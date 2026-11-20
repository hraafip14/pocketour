// Netlify Serverless Function: send-report-email.js
// Menggunakan Gmail SMTP (Nodemailer) - bebas kirim ke email siapa saja tanpa perlu domain
import nodemailer from 'nodemailer';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { month, year, profileName, htmlSummary } = body;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const recipientsEnv =
      process.env.REPORT_RECIPIENTS || 'hasajalah74@gmail.com,nidaliyana14@gmail.com';
    const recipientList = recipientsEnv
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (!smtpUser || !smtpPass) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error:
            'SMTP_USER atau SMTP_PASS belum diset. Buat App Password di https://myaccount.google.com/apppasswords lalu tambahkan ke Environment Variables Netlify.',
        }),
      };
    }

    // Konfigurasi transporter Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, ''), // buang spasi jika copy-paste dari Google
      },
    });

    const info = await transporter.sendMail({
      from: `"Pocketour" <${smtpUser}>`,
      to: recipientList.join(', '),
      subject: `[Pocketour] Laporan Keuangan Bulan ${month} ${year} — ${profileName}`,
      html: htmlSummary,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Email laporan keuangan berhasil dikirim ke: ${recipientList.join(', ')}.`,
        messageId: info.messageId,
      }),
    };
  } catch (error) {
    console.error('Error sending email with Nodemailer:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Terjadi kesalahan sistem saat mengirim email via Gmail SMTP.',
      }),
    };
  }
};
