const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email (par exemple, Gmail)
    pass: process.env.EMAIL_PASS, // Le mot de passe ou le token de l'application pour Gmail
  },
});

module.exports = transporter;
