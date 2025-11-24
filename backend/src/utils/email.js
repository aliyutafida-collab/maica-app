const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true') || false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });
}

async function sendResetEmail(to, link) {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MaiCa" <no-reply@maica.app>',
      to,
      subject: "MaiCa - Reset Your Password",
      html: `<p>Click <a href="${link}">here to reset your password</a></p><p>Link expires in 1 hour.</p>`
    });
  } catch (error) {
    console.error('Email send failed:', error);
  }
}

module.exports = { sendResetEmail };
