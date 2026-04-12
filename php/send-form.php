<?php
/**
 * ABC Carrelage — Traitement formulaire contact + devis
 * Hébergé sur O2switch
 */

// --- Configuration ---
$to_email    = 'contact@abc-carrelage.fr';
$cc_email    = 'anthonyboreycarrelage@gmail.com';
$from_name   = 'ABC Carrelage - Site Web';
$from_email  = 'noreply@abc-carrelage.fr';

// --- Sécurité : CSRF ---
session_start();

// --- Rate limiting basique (5 envois/heure par IP) ---
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rate_file = sys_get_temp_dir() . '/abc_form_rate_' . md5($ip);
$now = time();
$window = 3600; // 1 heure
$max_requests = 5;

if (file_exists($rate_file)) {
    $data = json_decode(file_get_contents($rate_file), true);
    // Nettoyer les anciennes entrées
    $data = array_filter($data, function($t) use ($now, $window) {
        return ($now - $t) < $window;
    });
    if (count($data) >= $max_requests) {
        send_response(false, 'Trop de demandes. Réessayez dans une heure ou appelez-nous au 06 52 25 12 26.');
    }
    $data[] = $now;
    file_put_contents($rate_file, json_encode(array_values($data)));
} else {
    file_put_contents($rate_file, json_encode([$now]));
}

// --- Vérifications ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(false, 'Méthode non autorisée.');
}

// Honeypot
if (!empty($_POST['website'])) {
    // Bot détecté, on simule un succès pour ne pas alerter
    send_response(true, 'Votre demande a bien été envoyée.');
}

// CSRF token
if (empty($_POST['csrf_token']) || empty($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    send_response(false, 'Session expirée. Rechargez la page et réessayez.');
}

// --- Récupération et nettoyage des données ---
$form_type = clean($_POST['form_type'] ?? 'contact');
$nom       = clean($_POST['nom'] ?? '');
$email     = clean($_POST['email'] ?? '');
$telephone = clean($_POST['telephone'] ?? '');
$message   = clean($_POST['message'] ?? '');

// Champs spécifiques devis
$ville     = clean($_POST['ville'] ?? '');
$type_projet = clean($_POST['type_projet'] ?? '');
$neuf_reno = clean($_POST['neuf_renovation'] ?? '');
$surface   = clean($_POST['surface'] ?? '');

// --- Validation ---
if (empty($nom) || mb_strlen($nom) < 2) {
    send_response(false, 'Veuillez indiquer votre nom.');
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response(false, 'Adresse email invalide.');
}
if (empty($message) || mb_strlen($message) < 10) {
    send_response(false, 'Le message doit contenir au moins 10 caractères.');
}
if (mb_strlen($message) > 5000) {
    send_response(false, 'Le message est trop long (5000 caractères max).');
}
if (empty($_POST['rgpd_consent'])) {
    send_response(false, 'Vous devez accepter la politique de confidentialité.');
}

// --- Construction de l'email ---
if ($form_type === 'devis') {
    $subject = "Demande de devis — $nom";
    $body  = "NOUVELLE DEMANDE DE DEVIS\n";
    $body .= "========================\n\n";
    $body .= "Nom : $nom\n";
    $body .= "Email : $email\n";
    $body .= "Téléphone : $telephone\n";
    $body .= "Ville du chantier : $ville\n";
    $body .= "Type de projet : $type_projet\n";
    $body .= "Neuf / Rénovation : $neuf_reno\n";
    $body .= "Surface estimée : $surface\n";
    $body .= "\nDescription du projet :\n$message\n";
} else {
    $subject = "Message depuis le site — $nom";
    $body  = "NOUVEAU MESSAGE\n";
    $body .= "===============\n\n";
    $body .= "Nom : $nom\n";
    $body .= "Email : $email\n";
    $body .= "Téléphone : $telephone\n";
    $body .= "\nMessage :\n$message\n";
}

$body .= "\n---\nEnvoyé depuis abc-carrelage.fr le " . date('d/m/Y à H:i');

// --- Envoi ---
$headers  = "From: $from_name <$from_email>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Cc: $cc_email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: ABC-Carrelage-Form/1.0\r\n";

$sent = mail($to_email, "=?UTF-8?B?" . base64_encode($subject) . "?=", $body, $headers);

if ($sent) {
    // Invalider le token CSRF après envoi réussi
    unset($_SESSION['csrf_token']);
    send_response(true, 'Votre demande a bien été envoyée. Nous vous répondons sous 48h.');
} else {
    send_response(false, 'Une erreur est survenue. Appelez-nous directement au 06 52 25 12 26.');
}

// --- Fonctions utilitaires ---
function clean($str) {
    $str = trim($str);
    $str = stripslashes($str);
    $str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
    return $str;
}

function send_response($success, $message) {
    // Si requête AJAX
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $success, 'message' => $message]);
        exit;
    }
    // Sinon redirection classique
    $page = ($_POST['form_type'] ?? 'contact') === 'devis' ? 'devis-en-ligne.html' : 'contact.html';
    $status = $success ? 'ok' : 'error';
    header("Location: ../$page?statut=$status#form-message" . ($page === 'devis-en-ligne.html' ? '-devis' : ''));
    exit;
}
