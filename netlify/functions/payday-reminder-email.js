// Netlify Scheduled Function: payday-reminder-email.js
// Jadwal: Setiap hari jam 16.00 PM WIB (09.00 UTC -> cron: 0 9 * * *)
// Memeriksa apakah hari ini bertepatan dengan tanggal gajian yang telah diatur pada kartu gaji
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  console.log('Running payday-reminder-email scheduled function...');

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const recipientsEnv =
    process.env.REPORT_RECIPIENTS || 'hasajalah74@gmail.com,nidaliyana14@gmail.com';
  const recipientList = recipientsEnv
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials missing in environment.');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'SMTP credentials missing.' }),
    };
  }

  // Parameter ?force=true untuk kebutuhan uji coba langsung
  const queryParams = event.queryStringParameters || {};
  const isForce = queryParams.force === 'true';

  // Supabase Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(
    supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
    supabaseKey
  );

  try {
    // Tanggal hari ini dalam zona waktu WIB (UTC+7) format YYYY-MM-DD
    const todayWIB = new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0];

    // Ambil kartu gaji yang memiliki payday_date hari ini
    const { data: salaries, error: salErr } = await supabase
      .from('salaries')
      .select(`
        id, profile_id, month, year, base_salary, payday_date,
        profiles ( full_name, email )
      `)
      .eq('payday_date', todayWIB);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Jika tidak ada yang gajian hari ini dan bukan force test, selesaikan tanpa mengirim
    if ((!salaries || salaries.length === 0) && !isForce) {
      console.log(`Tidak ada jadwal gajian untuk hari ini (${todayWIB}).`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Tidak ada jadwal gajian pada tanggal ${todayWIB}.`,
        }),
      };
    }

    const matchedProfiles = salaries && salaries.length > 0
      ? salaries.map((s) => s.profiles?.full_name || s.profiles?.email).join(', ')
      : 'Pengguna Pocketour';

    const periodLabel = salaries && salaries.length > 0
      ? `${monthNames[(salaries[0].month - 1) % 12]} ${salaries[0].year}`
      : 'Bulan Ini';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #2E2A38; border: 1px solid #e0d6cc; border-radius: 12px; padding: 28px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #00D2FF; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #2E2A38; margin: 0 0 6px 0;">Pocketour — Payday Reminder 🎉</h2>
          <p style="margin: 0; font-size: 14px; color: #6b6275;">
            Pengingat Otomatis Hari Gajian (Dikirim Pukul 16:00 PM WIB)
          </p>
        </div>

        <p style="font-size: 15px; line-height: 1.5; color: #2E2A38;">
          Halo <strong>${matchedProfiles}</strong>,
        </p>

        <p style="font-size: 14px; line-height: 1.5; color: #2E2A38;">
          Hari ini adalah <strong>tanggal gajian</strong> yang telah diatur untuk periode <strong>${periodLabel}</strong>! 
        </p>

        <div style="background-color: #f7efe5; border-left: 4px solid #C94472; padding: 14px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #2E2A38; line-height: 1.5;">
            💡 <strong>Jangan lupa untuk:</strong><br/>
            1. Mengisi atau memperbarui <strong>Gaji Pokok</strong> dan daftar <strong>Insentif/Tunjangan</strong> Anda.<br/>
            2. Memeriksa kembali alokasi 3 kantong anggaran: <strong>Kebutuhan (50%)</strong>, <strong>Jajan (30%)</strong>, dan <strong>Investasi (20%)</strong>.<br/>
            3. Mulai mencatat pengeluaran bulan ini agar alokasi keuangan tetap terkontrol.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0 10px;">
          <a href="https://pocketour.netlify.app" style="background-color: #00D2FF; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Buka Pocketour & Catat Gaji
          </a>
        </div>

        <div style="border-top: 1px solid #e8dece; margin-top: 24px; padding-top: 14px; text-align: center;">
          <p style="font-size: 12px; color: #9E95A8; margin: 0;">
            Email ini dikirim otomatis oleh Pocketour setiap pukul 16:00 PM WIB pada tanggal gajian Anda.
          </p>
        </div>
      </div>
    `;

    // Kirim via nodemailer
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
      subject: `[Pocketour] Payday Reminder — Waktunya Mengisi Data Gaji`,
      html: htmlContent,
    });

    console.log('Payday reminder email sent:', info.messageId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Payday Reminder berhasil dikirim ke: ${recipientList.join(', ')}.`,
        messageId: info.messageId,
      }),
    };
  } catch (error) {
    console.error('Error in payday-reminder-email:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Gagal mengirim Payday Reminder.',
      }),
    };
  }
};
