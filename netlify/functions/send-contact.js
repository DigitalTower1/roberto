// Usiamo la libreria Nodemailer per inviare le email in modo professionale
const nodemailer = require('nodemailer');

// La funzione handler è il punto di ingresso per la nostra serverless function
exports.handler = async function(event) {
  // Per sicurezza, accettiamo solo richieste di tipo POST dal nostro form
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: 'Metodo non consentito' }) 
    };
  }

  try {
    // Estraiamo i dati inviati dal form (che arrivano come stringa JSON)
    const data = JSON.parse(event.body);

    // Validazione base dei dati per evitare input vuoti
    if (!data.name || !data.email || !data.message) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: 'Tutti i campi sono obbligatori.' }) 
      };
    }

    // Qui configuriamo il servizio di invio email (trasportatore SMTP)
    // Le credenziali NON sono scritte qui, ma vengono lette dalle variabili d'ambiente di Netlify
    // Questo è il modo corretto e sicuro di gestire dati sensibili.
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,       // Es: smtp.gmail.com
      port: process.env.MAIL_PORT,       // Es: 465 (per SSL) o 587 (per TLS)
      secure: process.env.MAIL_PORT == 465, // 'true' se la porta è 465 (SSL)
      auth: {
        user: process.env.MAIL_USER,     // La tua email di invio
        pass: process.env.MAIL_PASS,     // La tua password o una password per app
      },
    });

    // Definiamo il contenuto dell'email che riceverai
    const mailOptions = {
      from: `"${data.name}" <${process.env.MAIL_USER}>`, // Mostra il nome del mittente ma invia dal tuo account
      replyTo: data.email, // Così quando rispondi, rispondi direttamente all'utente
      to: process.env.MAIL_RECIPIENT, // L'email dove vuoi ricevere i messaggi
      subject: `Nuovo messaggio da ${data.name} dalla tua Business Card`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Hai ricevuto un nuovo messaggio:</h2>
          <p><strong>Nome:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <hr>
          <p><strong>Messaggio:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
      `,
    };

    // Inviamo l'email e attendiamo il risultato
    await transporter.sendMail(mailOptions);

    // Se tutto va a buon fine, restituiamo uno status 200 (OK)
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Messaggio inviato con successo!" }),
    };

  } catch (error) {
    // Se qualcosa va storto, registriamo l'errore e restituiamo uno status 500 (Errore del server)
    console.error('Errore nell\'invio dell\'email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Si è verificato un errore, riprova più tardi.' }),
    };
  }
};