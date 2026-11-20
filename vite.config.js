import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Resend } from 'resend';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'netlify-functions-dev-server',
        configureServer(server) {
          server.middlewares.use('/.netlify/functions/send-report-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });

            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const body = JSON.parse(bodyStr || '{}');
                const { month, year, profileName, htmlSummary } = body;

                const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
                const recipientsEnv =
                  env.REPORT_RECIPIENTS ||
                  process.env.REPORT_RECIPIENTS ||
                  'hasajalah74@gmail.com,nidaliyana14@gmail.com';
                const recipientList = recipientsEnv
                  .split(',')
                  .map((e) => e.trim())
                  .filter(Boolean);

                if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_resend_api_key')) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        'RESEND_API_KEY belum diisi di file .env. Silakan buat akun gratis di https://resend.com, salin API Key Anda, lalu masukkan ke file .env pada baris RESEND_API_KEY=re_...',
                    })
                  );
                  return;
                }

                const resend = new Resend(apiKey);

                // 1. Coba kirim ke daftar penerima
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
                    console.log(`Resend Sandbox restriction detected. Forwarding report to owner email: ${ownerEmail}`);

                    // Kirim otomatis ke email terverifikasi pemilik akun Resend
                    const ownerResult = await resend.emails.send({
                      from: 'Pocketour <onboarding@resend.dev>',
                      to: [ownerEmail],
                      subject: `[Pocketour] Laporan Keuangan Bulan ${month} ${year} — ${profileName}`,
                      html: htmlSummary,
                    });

                    if (!ownerResult.error) {
                      res.statusCode = 200;
                      res.end(
                        JSON.stringify({
                          success: true,
                          message: `Laporan berhasil dikirim ke email akun Resend Anda (${ownerEmail})! (Catatan: Domain onboarding@resend.dev hanya mengizinkan pengiriman ke email pemilik akun. Untuk mengirim ke email lain seperti hasajalah74@gmail.com & nidaliyana14@gmail.com, Anda perlu memverifikasi domain di resend.com/domains).`,
                          deliveredTo: ownerEmail,
                        })
                      );
                      return;
                    }
                  }

                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error: sendResult.error.message || 'Gagal mengirim email melalui Resend.',
                    })
                  );
                  return;
                }

                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    message: `Email laporan keuangan berhasil dikirim ke: ${recipientList.join(', ')}.`,
                  })
                );
              } catch (err) {
                res.statusCode = 500;
                res.end(
                  JSON.stringify({
                    success: false,
                    error: err.message || 'Terjadi kesalahan pada server saat mengirim email.',
                  })
                );
              }
            });
          });
        },
      },
    ],
  };
});
