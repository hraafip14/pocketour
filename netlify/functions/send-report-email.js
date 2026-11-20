// Netlify Serverless Function: send-report-email.js
// Path: /.netlify/functions/send-report-email
import { Resend } from 'resend';

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

    const apiKey = process.env.RESEND_API_KEY;
    const recipientsEnv =
      process.env.REPORT_RECIPIENTS || 'hasajalah74@gmail.com,nidaliyana14@gmail.com';
    const recipientList = recipientsEnv
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_resend_api_key')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error:
            'RESEND_API_KEY belum dikonfigurasi di environment Netlify. Silakan tambahkan RESEND_API_KEY di Netlify Dashboard -> Site Settings -> Environment Variables.',
        }),
      };
    }

    const resend = new Resend(apiKey);

    // 1. Coba kirim langsung
    const sendResult = await resend.emails.send({
      from: 'Pocketour <onboarding@resend.dev>',
      to: recipientList,
      subject: `[Pocketour] Laporan Keuangan Bulan ${month} ${year} — ${profileName}`,
      html: htmlSummary,
    });

    if (sendResult.error) {
      const errorMsg = sendResult.error.message || '';

      // Cek apakah ada batasan testing domain Resend (hanya boleh kirim ke email pemilik akun)
      const matchOwner = errorMsg.match(/own email address \(([^)]+)\)/i);
      if (matchOwner && matchOwner[1]) {
        const ownerEmail = matchOwner[1];

        const ownerResult = await resend.emails.send({
          from: 'Pocketour <onboarding@resend.dev>',
          to: [ownerEmail],
          subject: `[Pocketour] Laporan Keuangan Bulan ${month} ${year} — ${profileName}`,
          html: htmlSummary,
        });

        if (!ownerResult.error) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              message: `Laporan berhasil dikirim ke email akun Resend Anda (${ownerEmail})! (Catatan: Domain onboarding@resend.dev hanya mengizinkan pengiriman ke email pemilik akun. Untuk mengirim ke email lain seperti hasajalah74@gmail.com & nidaliyana14@gmail.com, Anda perlu memverifikasi domain di resend.com/domains).`,
              deliveredTo: ownerEmail,
            }),
          };
        }
      }

      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: sendResult.error.message || 'Gagal mengirim email via Resend.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Email laporan keuangan berhasil dikirim ke: ${recipientList.join(', ')}.`,
      }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Terjadi kesalahan sistem saat mengirim email.',
      }),
    };
  }
};
