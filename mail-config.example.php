<?php
/**
 * Plantilla de credenciales SMTP para mail.php.
 *
 * 1. Copia este archivo como mail-config.php
 * 2. Rellena la contraseña del buzón
 * 3. Súbelo al servidor UNA vez, idealmente un nivel por encima de la carpeta pública
 *    (junto a public_html, no dentro). Si lo dejas junto a mail.php, .htaccess lo bloquea.
 *
 * mail-config.php está en .gitignore: nunca se sube a git.
 */
return [
    'host'      => 'mail.mueblesamedidaenvitoria.com.es',
    'port'      => 465,          // 465 = SSL · si tu hosting usa 587, pon 587 y 'secure' => 'tls'
    'secure'    => 'ssl',
    'username'  => 'info@mueblesamedidaenvitoria.com.es',
    'password'  => 'CAMBIAR',
    'from'      => 'info@mueblesamedidaenvitoria.com.es',
    'from_name' => 'Web Muebles a medida en Vitoria',
    'to'        => 'info@mueblesamedidaenvitoria.com.es',
];
