'use strict';

const nodemailer = require('nodemailer');

const json = (status, payload) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(payload),
});

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Metodo non consentito' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { message: 'Payload non valido.' });
  }

  // Honeypot anti-spam
  if (data.hp) {
    return json(200, { message: 'Messaggio inviato con successo!' });
  }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const message = (data.message || '').trim();

  if (!name || !email || !message) {
    return json(400, { message: 'Tutti i campi sono obbligatori.' });
  }
  if (!isValidEmail(email)) {
    return json(400, { message: 'Email non valida.' });
  }
  if (name.length < 2 || name.length > 80) {
    return json(400, { message: 'Il nome deve avere tra 2 e 80 caratteri.' });
  }
  if (message.length < 10 || message.length > 3000) {
    return json(400, { message: 'Il messaggio deve avere tra 10 e 3000 caratteri.' });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  // SMTP config
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const to = process.env.MAIL_RECIPIENT || user;
  const fromAddr = process.env.MAIL_FROM || user;
  const fromName = process.env.MAIL_FROM_NAME || 'Digital Tower';

  if (!host || !port || !user || !pass) {
    console.error('Variabili d’ambiente SMTP mancanti.');
    return json(500, { message: 'Configurazione email non valida.' });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `Nuovo messaggio dalla Business Card - ${safeName}`;
  const textBody =
`Hai ricevuto un nuovo messaggio:
Nome: ${name}
Email: ${email}

Messaggio:
${message}`;

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6">
      <h2 style="margin:0 0 8px">Hai ricevuto un nuovo messaggio:</h2>
      <p><strong>Nome:</strong> ${safeName}</p>
      <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0" />
      <p style="margin:0 0 4px"><strong>Messaggio:</strong></p>
      <pre style="white-space:pre-wrap;margin:0">${safeMessage}</pre>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
      headers: { 'X-Priority': '3' },
    });

    return json(200, { message: 'Messaggio inviato con successo!' });
  } catch (err) {
    console.error('Errore invio email:', err);
    return json(500, { message: 'Si è verificato un errore, riprova più tardi.' });
  }
};
