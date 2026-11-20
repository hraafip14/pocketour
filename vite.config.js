import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const getTransporter = () => {
    const smtpUser = env.SMTP_USER || process.env.SMTP_USER;
    const smtpPass = env.SMTP_PASS || process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new Error(
        'SMTP_USER atau SMTP_PASS belum diset di file .env. Buat App Password di https://myaccount.google.com/apppasswords lalu masukkan ke .env.'
      );
    }

    return {
      smtpUser,
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''),
        },
      }),
    };
  };

  const getRecipients = () => {
    const recipientsEnv =
      env.REPORT_RECIPIENTS ||
      process.env.REPORT_RECIPIENTS ||
      'hasajalah74@gmail.com,nidaliyana14@gmail.com';
    return recipientsEnv
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  };

  return {
    plugins: [
      react(),
      {
        name: 'netlify-functions-dev-server',
        configureServer(server) {
          // 1. Endpoint Kirim Laporan Manual / Instan
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
                const { smtpUser, transporter } = getTransporter();
                const recipientList = getRecipients();

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
                console.error('Error in send-report-email:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          });

          // 2. Endpoint Weekly Report (Jadwal: Sabtu 08:00 WIB)
          server.middlewares.use('/.netlify/functions/weekly-report-email', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { smtpUser, transporter } = getTransporter();
              const recipientList = getRecipients();

              const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
              const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
              const supabase = createClient(
                supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
                supabaseKey
              );

              const { data: salaries } = await supabase
                .from('salaries')
                .select(`
                  id, profile_id, month, year, base_salary, payday_date,
                  profiles ( full_name, email ),
                  incentives ( id, label, amount ),
                  pockets ( id, name, percentage, expenses ( id, label, amount, date ) )
                `)
                .order('year', { ascending: false })
                .order('month', { ascending: false })
                .limit(2);

              const info = await transporter.sendMail({
                from: `"Pocketour" <${smtpUser}>`,
                to: recipientList.join(', '),
                subject: `[Pocketour] Weekly Report`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #C94472;">Pocketour — Weekly Report</h2>
                    <p>Halo! Ini adalah laporan mingguan otomatis Pocketour setiap hari Sabtu pukul 08:00 AM WIB.</p>
                    <p>Total profil yang tercatat: <strong>${salaries?.length || 0}</strong></p>
                    <p>Silakan buka <a href="https://pocketour.netlify.app">Pocketour</a> untuk rincian lengkapnya.</p>
                  </div>
                `,
              });

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Weekly Report berhasil dikirim ke: ${recipientList.join(', ')}.` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 3. Endpoint Payday Reminder (Jadwal: Harian 16:00 WIB pada tanggal gajian)
          server.middlewares.use('/.netlify/functions/payday-reminder-email', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { smtpUser, transporter } = getTransporter();
              const recipientList = getRecipients();

              const info = await transporter.sendMail({
                from: `"Pocketour" <${smtpUser}>`,
                to: recipientList.join(', '),
                subject: `[Pocketour] Payday Reminder — Waktunya Mengisi Data Gaji`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #00D2FF;">Pocketour — Payday Reminder 🎉</h2>
                    <p>Halo! Hari ini adalah tanggal gajian Anda yang telah dijadwalkan.</p>
                    <p>Jangan lupa untuk masuk ke aplikasi Pocketour, mengisi gaji pokok, insentif/tunjangan, dan mengecek pos kantong belanja Anda!</p>
                    <p><a href="https://pocketour.netlify.app" style="display: inline-block; padding: 10px 20px; background: #00D2FF; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">Buka Pocketour Sekarang</a></p>
                  </div>
                `,
              });

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Payday Reminder berhasil dikirim ke: ${recipientList.join(', ')}.` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        },
      },
    ],
  };
});
