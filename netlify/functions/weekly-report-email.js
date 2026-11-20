// Netlify Scheduled Function: weekly-report-email.js
// Jadwal: Setiap hari Sabtu jam 08.00 AM WIB (01.00 UTC -> cron: 0 1 * * 6)
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  console.log('Running weekly-report-email scheduled function...');

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

  // Supabase Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(
    supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
    supabaseKey
  );

  try {
    // Ambil data gaji & kantong terbaru
    const { data: salaries, error: salErr } = await supabase
      .from('salaries')
      .select(`
        id, profile_id, month, year, base_salary, payday_date,
        profiles ( full_name, email ),
        incentives ( id, label, amount ),
        pockets (
          id, name, percentage,
          expenses ( id, label, amount, date )
        )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(2);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let summaryHtml = '';

    if (salaries && salaries.length > 0) {
      salaries.forEach((sal) => {
        const base = Number(sal.base_salary) || 0;
        const incTotal = (sal.incentives || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalSalary = base + incTotal;

        const pockets = sal.pockets || [];
        const totalExpenses = pockets.reduce((sum, pkt) => {
          const pSum = (pkt.expenses || []).reduce((sub, e) => sub + (Number(e.amount) || 0), 0);
          return sum + pSum;
        }, 0);

        const remaining = totalSalary - totalExpenses;
        const periodStr = `${monthNames[(sal.month - 1) % 12]} ${sal.year}`;
        const profileName = sal.profiles?.full_name || 'Pengguna Pocketour';

        const pocketRows = pockets.map((p) => {
          const limit = Math.round(((Number(p.percentage) || 0) / 100) * totalSalary);
          const spent = (p.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const rem = limit - spent;
          return `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e0d6cc;"><strong>${p.name}</strong> (${p.percentage}%)</td>
              <td style="padding: 8px 12px; border: 1px solid #e0d6cc;">Rp ${limit.toLocaleString('id-ID')}</td>
              <td style="padding: 8px 12px; border: 1px solid #e0d6cc;">Rp ${spent.toLocaleString('id-ID')}</td>
              <td style="padding: 8px 12px; border: 1px solid #e0d6cc; color: ${rem < 0 ? '#d94452' : '#22945b'}; font-weight: bold;">
                Rp ${rem.toLocaleString('id-ID')}
              </td>
            </tr>
          `;
        }).join('');

        summaryHtml += `
          <div style="margin-bottom: 24px; padding: 18px; border: 1px solid #e8dece; border-radius: 8px; background-color: #fffaf0;">
            <h3 style="margin-top: 0; color: #2E2A38;">${profileName} — Periode ${periodStr}</h3>
            <p style="margin: 4px 0 12px; font-size: 14px; color: #6b6275;">
              Total Pemasukan: <strong>Rp ${totalSalary.toLocaleString('id-ID')}</strong> | 
              Total Pengeluaran: <strong>Rp ${totalExpenses.toLocaleString('id-ID')}</strong> | 
              Sisa Bersih: <strong style="color: ${remaining < 0 ? '#d94452' : '#22945b'};">Rp ${remaining.toLocaleString('id-ID')}</strong>
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; background-color: #ffffff;">
              <tr style="background-color: #f7efe5;">
                <th style="padding: 8px; border: 1px solid #e0d6cc; text-align: left;">Kantong</th>
                <th style="padding: 8px; border: 1px solid #e0d6cc; text-align: left;">Batas</th>
                <th style="padding: 8px; border: 1px solid #e0d6cc; text-align: left;">Terpakai</th>
                <th style="padding: 8px; border: 1px solid #e0d6cc; text-align: left;">Sisa</th>
              </tr>
              ${pocketRows}
            </table>
          </div>
        `;
      });
    } else {
      summaryHtml = '<p>Belum ada data keuangan yang tercatat untuk periode ini.</p>';
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 640px; margin: 0 auto; color: #2E2A38; border: 1px solid #e0d6cc; border-radius: 12px; padding: 28px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #C94472; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #2E2A38; margin: 0 0 6px 0;">Pocketour — Weekly Report</h2>
          <p style="margin: 0; font-size: 14px; color: #6b6275;">
            Laporan Keuangan Mingguan Otomatis (Setiap Hari Sabtu, 08:00 AM WIB)
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.5; color: #2E2A38;">
          Halo! Berikut adalah rekapitulasi posisi keuangan dan pemakaian kantong belanja Anda pada minggu ini:
        </p>

        ${summaryHtml}

        <div style="text-align: center; margin: 28px 0 10px;">
          <a href="https://pocketour.netlify.app" style="background-color: #C94472; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Buka Pocketour Sekarang
          </a>
        </div>

        <div style="border-top: 1px solid #e8dece; margin-top: 24px; padding-top: 14px; text-align: center;">
          <p style="font-size: 12px; color: #9E95A8; margin: 0;">
            Email ini dikirim otomatis oleh Pocketour setiap hari Sabtu pukul 08:00 AM WIB.
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
      subject: `[Pocketour] Weekly Report`,
      html: htmlContent,
    });

    console.log('Weekly report email sent:', info.messageId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Weekly Report berhasil dikirim ke: ${recipientList.join(', ')}.`,
        messageId: info.messageId,
      }),
    };
  } catch (error) {
    console.error('Error in weekly-report-email:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Gagal mengirim weekly report.',
      }),
    };
  }
};
