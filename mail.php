<?php
// mail.php — Procesador de formulario de contacto
// Negocio SIN teléfono: el canal es email. Campos obligatorios: nombre, email, mensaje.
// $to = destino real de los leads (el dominio aún no recibe correo).

$to     = 'albertogamkt@gmail.com';            // destino real de los leads
$domain = 'mueblesamedidaenvitoria.com.es';    // CONFIG.domain

// --- Bloquear acceso directo (no POST) ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// --- Honeypot: si tiene valor, es spam ---
if (!empty($_POST['_gotcha'])) {
    header('Location: /gracias/');
    exit;
}

// --- Recoger y sanitizar campos ---
$nombre   = trim(strip_tags($_POST['nombre']   ?? ''));
$email    = trim(strip_tags($_POST['email']    ?? ''));
$telefono = trim(strip_tags($_POST['telefono'] ?? ''));
$servicio = trim(strip_tags($_POST['servicio'] ?? ''));
$mensaje  = trim(strip_tags($_POST['mensaje']  ?? ''));
$page     = trim(strip_tags($_POST['page']     ?? '(no definida)'));
$utm_s    = trim(strip_tags($_POST['utm_source']   ?? ''));
$utm_m    = trim(strip_tags($_POST['utm_medium']   ?? ''));
$utm_c    = trim(strip_tags($_POST['utm_campaign'] ?? ''));

// --- Validación mínima del servidor (email es el canal obligatorio) ---
if (empty($nombre) || empty($email) || empty($mensaje)) {
    header('Location: /contacto/?error=campos');
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: /contacto/?error=email');
    exit;
}
if (!empty($telefono) && !preg_match('/^[\d\s\+\-]{9,15}$/', $telefono)) {
    header('Location: /contacto/?error=telefono');
    exit;
}

// --- Construir el email ---
$asunto = "Nueva consulta: {$nombre} — via {$page}";

$cuerpo  = "NUEVA CONSULTA DESDE LA WEB\n";
$cuerpo .= str_repeat('-', 40) . "\n\n";
$cuerpo .= "Nombre:   {$nombre}\n";
$cuerpo .= "Email:    {$email}\n";
if (!empty($telefono)) $cuerpo .= "Telefono: {$telefono}\n";
if (!empty($servicio)) $cuerpo .= "Servicio: {$servicio}\n";
$cuerpo .= "\nMensaje:\n{$mensaje}\n\n";
$cuerpo .= str_repeat('-', 40) . "\n";
$cuerpo .= "Pagina de origen: {$page}\n";
if (!empty($utm_s)) $cuerpo .= "UTM source:   {$utm_s}\n";
if (!empty($utm_m)) $cuerpo .= "UTM medium:   {$utm_m}\n";
if (!empty($utm_c)) $cuerpo .= "UTM campaign: {$utm_c}\n";

// --- Cabeceras del email ---
$headers  = "From: noreply@{$domain}\r\n"
          . "Reply-To: {$email}\r\n"
          . "Content-Type: text/plain; charset=UTF-8\r\n"
          . "X-Mailer: PHP/" . phpversion();

// --- Enviar ---
mail($to, $asunto, $cuerpo, $headers);

// --- Redirigir siempre a /gracias/ ---
header('Location: /gracias/');
exit;
