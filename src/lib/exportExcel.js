import * as XLSX from 'xlsx';
import { formatMonthYear, formatRupiah } from '../utils/formatters';

export function exportToExcel({
  salary,
  pockets = [],
  totalSalary,
  totalExpenses,
  remainingIncome,
  profile,
}) {
  const periodLabel = formatMonthYear(salary.month, salary.year);
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan
  const summaryData = [
    ['LAPORAN KEUANGAN POCKETOUR'],
    ['Profil', profile?.fullName || '-'],
    ['Email', profile?.email || '-'],
    ['Periode', periodLabel],
    ['Tanggal Dibuat', new Date().toLocaleDateString('id-ID')],
    [],
    ['METRIK UTAMA', 'NOMINAL (RP)'],
    ['Total Gaji & Tunjangan', totalSalary],
    ['Total Seluruh Pengeluaran', totalExpenses],
    ['Sisa Gaji Bersih', remainingIncome],
    [],
    ['RINGKASAN KANTONG', 'PERSENTASE', 'BATAS NOMINAL', 'TOTAL TERPAKAI', 'SISA KANTONG'],
  ];

  pockets.forEach((pkt) => {
    const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
    const spent = (pkt.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const rem = limit - spent;
    summaryData.push([
      pkt.name,
      `${pkt.percentage}%`,
      limit,
      spent,
      rem,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Sheet Rincian Gaji & Insentif
  const salaryData = [
    ['RINCIAN GAJI & TUNJANGAN'],
    ['Periode', periodLabel],
    [],
    ['Komponen', 'Nominal (Rp)'],
    ['Gaji Pokok', salary.base_salary || 0],
  ];

  (salary.incentives || []).forEach((inc) => {
    salaryData.push([inc.label, Number(inc.amount) || 0]);
  });
  salaryData.push(['TOTAL GAJI', totalSalary]);

  const wsSalary = XLSX.utils.aoa_to_sheet(salaryData);
  XLSX.utils.book_append_sheet(wb, wsSalary, 'Gaji');

  // 3. Sheet Rincian Pengeluaran
  const expenseDataRows = [
    ['DAFTAR TRANSAKSI PENGELUARAN'],
    ['Periode', periodLabel],
    [],
    ['Kantong', 'Deskripsi Pengeluaran', 'Tanggal', 'Nominal (Rp)'],
  ];

  pockets.forEach((pkt) => {
    (pkt.expenses || []).forEach((exp) => {
      expenseDataRows.push([
        pkt.name,
        exp.label,
        exp.date || '-',
        Number(exp.amount) || 0,
      ]);
    });
  });

  const wsExpense = XLSX.utils.aoa_to_sheet(expenseDataRows);
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Pengeluaran');

  // Generate nama file rapi
  const safeName = (profile?.fullName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Pocketour_Laporan_${salary.year}_${String(salary.month).padStart(2, '0')}_${safeName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
