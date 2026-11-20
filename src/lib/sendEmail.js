import { formatMonthYear, formatRupiah } from '../utils/formatters';

export async function sendReportEmail({
  salary,
  pockets = [],
  totalSalary,
  totalExpenses,
  remainingIncome,
  profile,
}) {
  const periodLabel = formatMonthYear(salary.month, salary.year);

  // Buat HTML representasi ringkasan laporan untuk isi email
  const pocketHtmlRows = pockets
    .map((pkt) => {
      const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
      const spent = (pkt.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const rem = limit - spent;
      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #e0d6cc;"><strong>${pkt.name}</strong> (${pkt.percentage}%)</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc;">${formatRupiah(limit)}</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc;">${formatRupiah(spent)}</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc; color: ${rem < 0 ? '#d94452' : '#22945b'}; font-weight: bold;">
            ${formatRupiah(rem)}
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlSummary = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; color: #2E2A38; border: 1px solid #e8dece; border-radius: 12px; padding: 28px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #C94472; padding-bottom: 14px; margin-bottom: 20px;">
        <h2 style="color: #2E2A38; margin: 0 0 6px 0; font-size: 22px;">Pocketour — Laporan Keuangan Bulanan</h2>
        <p style="margin: 0; font-size: 14px; color: #6b6275;">
          Profil Keuangan: <strong>${profile?.fullName}</strong> (${profile?.email})<br/>
          Periode: <strong>${periodLabel}</strong>
        </p>
      </div>

      <h3 style="font-size: 16px; margin: 0 0 10px 0; color: #2E2A38;">Ringkasan Metrik:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background-color: #f7efe5;">
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left; font-size: 13px;">Metrik</th>
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left; font-size: 13px;">Nominal</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-size: 14px;">Total Gaji & Tunjangan</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-weight: bold; font-size: 14px; color: #2E2A38;">${formatRupiah(totalSalary)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-size: 14px;">Total Pengeluaran</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-weight: bold; font-size: 14px; color: #2E2A38;">${formatRupiah(totalExpenses)}</td>
        </tr>
        <tr style="background-color: #fffaf0;">
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-size: 14px; font-weight: bold;">Sisa Gaji Bersih</td>
          <td style="padding: 10px; border: 1px solid #e0d6cc; font-weight: bold; color: ${remainingIncome < 0 ? '#d94452' : '#22945b'}; font-size: 16px;">
            ${formatRupiah(remainingIncome)}
          </td>
        </tr>
      </table>

      <h3 style="font-size: 16px; margin: 0 0 10px 0; color: #2E2A38;">Rincian 3 Pos Kantong:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <tr style="background-color: #f7efe5;">
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left;">Pos Kantong</th>
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left;">Batas Anggaran</th>
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left;">Aktual Terpakai</th>
          <th style="padding: 10px; border: 1px solid #e0d6cc; text-align: left;">Sisa Saldo</th>
        </tr>
        ${pocketHtmlRows}
      </table>

      <div style="border-top: 1px solid #e8dece; padding-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #9E95A8; margin: 0;">
          Email ini dikirim otomatis oleh Pocketour untuk <strong>hasajalah74@gmail.com</strong> dan <strong>nidaliyana14@gmail.com</strong>.
        </p>
      </div>
    </div>
  `;

  // Panggil endpoint function
  let response;
  try {
    response = await fetch('/.netlify/functions/send-report-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: salary.month,
        year: salary.year,
        profileName: profile?.fullName,
        htmlSummary,
      }),
    });
  } catch (netErr) {
    throw new Error(
      'Gagal menghubungi server pengirim email. Jika berjalan secara lokal, pastikan dev server aktif.'
    );
  }

  let result;
  try {
    result = await response.json();
  } catch (jsonErr) {
    throw new Error(`Respon server tidak valid (${response.status} ${response.statusText}).`);
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ||
      result.message ||
      'Gagal mengirim email laporan. Periksa konfigurasi RESEND_API_KEY di file .env Anda.'
    );
  }

  return result;
}
