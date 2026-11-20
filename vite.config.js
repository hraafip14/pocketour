import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';

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

                const smtpUser = env.SMTP_USER || process.env.SMTP_USER;
                const smtpPass = env.SMTP_PASS || process.env.SMTP_PASS;
                const recipientsEnv =
                  env.REPORT_RECIPIENTS ||
                  process.env.REPORT_RECIPIENTS ||
                  'hasajalah74@gmail.com,nidaliyana14@gmail.com';
                const recipientList = recipientsEnv
                  .split(',')
                  .map((e) => e.trim())
                  .filter(Boolean);

                if (!smtpUser || !smtpPass) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        'SMTP_USER atau SMTP_PASS belum diset di file .env. Buat App Password di https://myaccount.google.com/apppasswords lalu masukkan ke .env.',
                    })
                  );
                  return;
                }

                const transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: smtpUser,
                    pass: smtpPass.replace(/\s+/g, ''),
                  },
                });

                const info = await transporter.sendMail({
                  from: `"Pocketour" <${smtpUser}>`,
                  to: recipientList.join(', '),
                  subject: `[Pocketour] Laporan Keuangan Bulan ${month} ${year} — ${profileName}`,
                  html: htmlSummary,
                });

                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    message: `Email laporan keuangan berhasil dikirim ke: ${recipientList.join(', ')}.`,
                    messageId: info.messageId,
                  })
                );
              } catch (err) {
                console.error('Error in local nodemailer server:', err);
                res.statusCode = 500;
                res.end(
                  JSON.stringify({
                    success: false,
                    error: err.message || 'Terjadi kesalahan saat mengirim email via Gmail SMTP.',
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
