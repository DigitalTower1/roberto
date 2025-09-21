// netlify/functions/send-contact.js
const nodemailer = require('nodemailer');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',           // Consenti richieste cross-origin (github.io -> netlify.app)
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function(event) {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ message: 'Metodo non consentito' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // Honeypot anti-bot (campo nascosto "hp")
    if (data.hp) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ message: 'OK' }) };
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();

    if (!name || !email || !message) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ message: 'Tutti i campi sono obbligatori.' }) };
    }

    // Transport SMTP (usa le variabili d'ambiente su Netlify)
    const port = Number(process.env.MAIL_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,           // es: smtp.gmail.com
      port,
      secure: port === 465,                  // SSL su 465
      auth: {
        user: process.env.MAIL_USER,         // casella di invio
        pass: process.env.MAIL_PASS          // password o app password
      }
    });

    const html = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Nuovo messaggio dalla Digital Business Card</h2>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <hr />
        <p><strong>Messaggio:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_USER}>`,
      replyTo: email,
      to: process.env.MAIL_RECIPIENT || process.env.MAIL_USER,
      subject: `Nuovo messaggio da ${name} — Digital Card`,
      html
    });

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ message: 'Messaggio inviato con successo!' }) };

  } catch (err) {
    console.error('Errore invio email:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: 'Si è verificato un errore, riprova più tardi.' }) };
  }
};

// piccola funzione per sicurezza HTML
function escapeHtml(str='') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
