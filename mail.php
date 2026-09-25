<?php
/**
 * mail.php — Procesa los formularios de presupuesto/contacto y los envía por SMTP autenticado
 * al buzón de la web (info@…), con las fotos o planos adjuntos.
 *
 * Credenciales: NO van en este archivo ni en git. Se leen de mail-config.php, que se busca
 *   1) un nivel por encima de la carpeta pública (recomendado: fuera de public_html)
 *   2) junto a este archivo (bloqueado por .htaccess)
 * Plantilla: mail-config.example.php
 *
 * Respuesta: JSON si la petición llega por fetch (Accept: application/json);
 *            si no (navegador sin JS), redirige a /gracias/ o a /contacto/?error=…
 */

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

const MAX_FILES     = 6;
const MAX_FILE_MB   = 10;
const MAX_TOTAL_MB  = 40;
const MIN_FILL_SECS = 3;      // envíos más rápidos que esto = bot
const ALLOWED_MIME  = [
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
    'image/heic' => 'heic', 'image/heif' => 'heif', 'application/pdf' => 'pdf',
];

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $code = '', int $status = 200): void
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($ok ? 200 : $status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'error' => $code]);
    } else {
        header('Location: ' . ($ok ? '/gracias/' : '/contacto/?error=' . rawurlencode($code)), true, 303);
    }
    exit;
}

function field(string $name, int $max = 200): string
{
    $v = trim(strip_tags((string)($_POST[$name] ?? '')));
    $v = preg_replace('/[\r\n]+/', ' ', $v) ?? '';
    return mb_substr($v, 0, $max);
}

// --- Solo POST ---
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

// --- POST que supera post_max_size: PHP vacía $_POST y $_FILES ---
if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    respond(false, 'archivos', 413);
}

// --- Antispam: honeypot + tiempo mínimo de rellenado ---
if (!empty($_POST['_gotcha'])) {
    respond(true); // al bot le decimos que sí, pero no se envía nada
}
$ts = (int)($_POST['_ts'] ?? 0);
if ($ts > 0 && (time() - intdiv($ts, 1000)) < MIN_FILL_SECS) {
    respond(true);
}

// --- Campos (todos obligatorios salvo las fotos) ---
$nombre   = field('nombre', 80);
$email    = field('email', 120);
$telefono = field('telefono', 20);
$servicio = field('servicio', 80);
$mensaje  = mb_substr(trim(strip_tags((string)($_POST['mensaje'] ?? ''))), 0, 3000);
$page     = field('page', 120) ?: '(no definida)';
$rgpd     = !empty($_POST['rgpd']);
$utm      = array_filter([
    'utm_source'   => field('utm_source', 100),
    'utm_medium'   => field('utm_medium', 100),
    'utm_campaign' => field('utm_campaign', 100),
]);

if ($nombre === '' || $email === '' || $telefono === '' || $servicio === '' || $mensaje === '') {
    respond(false, 'campos', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'email', 422);
}
if (!preg_match('/^\+?[\d\s\-().]{9,20}$/', $telefono) || strlen(preg_replace('/\D/', '', $telefono)) < 9) {
    respond(false, 'telefono', 422);
}
if (!$rgpd) {
    respond(false, 'rgpd', 422);
}

// --- Adjuntos (opcionales) ---
$attachments = [];
if (!empty($_FILES['fotos']) && is_array($_FILES['fotos']['name'])) {
    $f     = $_FILES['fotos'];
    $count = 0;
    $total = 0;
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach ($f['name'] as $i => $origName) {
        if ($f['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($f['error'][$i] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'][$i])) {
            respond(false, 'archivos', 422);
        }
        $count++;
        $size   = (int)$f['size'][$i];
        $total += $size;
        if ($count > MAX_FILES || $size > MAX_FILE_MB * 1048576 || $total > MAX_TOTAL_MB * 1048576) {
            respond(false, 'archivos', 413);
        }
        $mime = $finfo->file($f['tmp_name'][$i]) ?: '';
        // HEIC de algunos móviles llega como application/octet-stream: se acepta por extensión
        $ext = strtolower(pathinfo((string)$origName, PATHINFO_EXTENSION));
        if (!isset(ALLOWED_MIME[$mime]) && !($mime === 'application/octet-stream' && in_array($ext, ['heic', 'heif'], true))) {
            respond(false, 'archivos', 415);
        }
        $safeExt = ALLOWED_MIME[$mime] ?? $ext;
        $attachments[] = [$f['tmp_name'][$i], sprintf('foto-%d.%s', $count, $safeExt),
                          isset(ALLOWED_MIME[$mime]) ? $mime : 'image/heic'];
    }
}

// --- Configuración SMTP ---
$config = null;
foreach ([dirname(__DIR__) . '/mail-config.php', __DIR__ . '/mail-config.php'] as $path) {
    if (is_file($path)) {
        $config = require $path;
        break;
    }
}
if (!is_array($config)) {
    error_log('[mail.php] Falta mail-config.php');
    respond(false, 'servidor', 500);
}

// --- Construir el email ---
$h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$rows = [
    'Nombre'          => $nombre,
    'Teléfono'        => $telefono,
    'Email'           => $email,
    'Tipo de mueble'  => $servicio,
    'Página de origen'=> $page,
    'Adjuntos'        => $attachments ? count($attachments) . ' archivo(s)' : 'ninguno',
] + $utm;

$html  = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">';
$html .= '<h2 style="margin:0 0 12px">Nueva solicitud de presupuesto</h2><table cellpadding="6" style="border-collapse:collapse">';
foreach ($rows as $k => $v) {
    $html .= '<tr><td style="border-bottom:1px solid #eee;color:#777">' . $h((string)$k) . '</td>'
           . '<td style="border-bottom:1px solid #eee"><strong>' . $h((string)$v) . '</strong></td></tr>';
}
$html .= '</table><h3 style="margin:18px 0 6px">Proyecto</h3><p style="white-space:pre-line">' . $h($mensaje) . '</p>';
$html .= '<p style="color:#999;font-size:12px">Consentimiento RGPD aceptado el ' . date('d/m/Y H:i')
       . ' desde IP ' . $h($_SERVER['REMOTE_ADDR'] ?? '') . '</p></div>';

$text = "NUEVA SOLICITUD DE PRESUPUESTO\n\n";
foreach ($rows as $k => $v) {
    $text .= str_pad($k . ':', 18) . $v . "\n";
}
$text .= "\nProyecto:\n{$mensaje}\n";

// --- Enviar ---
$mail = new PHPMailer(true);
try {
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->isSMTP();
    $mail->Host       = $config['host'];
    $mail->Port       = (int)$config['port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['username'];
    $mail->Password   = $config['password'];
    $secure = strtolower((string)($config['secure'] ?? 'ssl'));
    if ($secure === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($secure === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPAutoTLS = false; // solo para pruebas locales
    }
    $mail->Timeout    = 20;

    $mail->setFrom($config['from'], $config['from_name'] ?? 'Web');
    $mail->addAddress($config['to']);
    $mail->addReplyTo($email, $nombre);

    $mail->Subject = "Presupuesto: {$servicio} — {$nombre}";
    $mail->isHTML(true);
    $mail->Body    = $html;
    $mail->AltBody = $text;
    foreach ($attachments as [$tmp, $name, $type]) {
        $mail->addAttachment($tmp, $name, PHPMailer::ENCODING_BASE64, $type);
    }
    $mail->send();
} catch (MailException $e) {
    error_log('[mail.php] SMTP: ' . $mail->ErrorInfo);
    respond(false, 'servidor', 502);
}

respond(true);
