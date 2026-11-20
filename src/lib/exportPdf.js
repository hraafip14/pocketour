import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMonthYear, formatRupiah } from '../utils/formatters';

export function exportToPdf({
  salary,
  pockets = [],
  totalSalary,
  totalExpenses,
  remainingIncome,
  profile,
}) {
  const doc = new jsPDF();
  const periodLabel = formatMonthYear(salary.month, salary.year);

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(46, 42, 56);
  doc.text('Pocketour - Laporan Keuangan Bulanan', 14, 20);

  // Meta Info
  doc.setFontSize(10);
  doc.setTextColor(110, 105, 120);
  doc.text(`Profil: ${profile?.fullName || '-'} (${profile?.email || '-'})`, 14, 28);
  doc.text(`Periode Laporan: ${periodLabel}`, 14, 34);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 14, 40);

  // 1. Tabel Ringkasan Metrik
  autoTable(doc, {
    startY: 46,
    head: [['Metrik Keuangan', 'Nominal']],
    body: [
      ['Total Gaji & Tunjangan', formatRupiah(totalSalary)],
      ['Total Seluruh Pengeluaran', formatRupiah(totalExpenses)],
      ['Sisa Gaji Bersih', formatRupiah(remainingIncome)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [46, 42, 56], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // 2. Tabel Pos Kantong
  const pocketRows = pockets.map((pkt) => {
    const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
    const spent = (pkt.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const rem = limit - spent;
    return [
      pkt.name,
      `${pkt.percentage}%`,
      formatRupiah(limit),
      formatRupiah(spent),
      formatRupiah(rem),
    ];
  });

  const afterFirstTable = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(46, 42, 56);
  doc.text('Rincian Pos Kantong', 14, afterFirstTable);

  autoTable(doc, {
    startY: afterFirstTable + 4,
    head: [['Pos Kantong', 'Alokasi (%)', 'Batas Nominal', 'Terpakai', 'Sisa']],
    body: pocketRows,
    theme: 'striped',
    headStyles: { fillColor: [201, 68, 114], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  // 3. Tabel Detail Pengeluaran
  const expenseRows = [];
  pockets.forEach((pkt) => {
    (pkt.expenses || []).forEach((exp) => {
      expenseRows.push([
        pkt.name,
        exp.label,
        exp.date || '-',
        formatRupiah(exp.amount),
      ]);
    });
  });

  if (expenseRows.length > 0) {
    const afterSecondTable = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(46, 42, 56);
    doc.text('Daftar Catatan Pengeluaran', 14, afterSecondTable);

    autoTable(doc, {
      startY: afterSecondTable + 4,
      head: [['Pos Kantong', 'Deskripsi', 'Tanggal', 'Nominal']],
      body: expenseRows,
      theme: 'grid',
      headStyles: { fillColor: [78, 71, 94], textColor: 255 },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });
  }

  // Footer text
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Halaman ${i} dari ${totalPages} — Pocketour Personal Finance App`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  const safeName = (profile?.fullName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Pocketour_Laporan_${salary.year}_${String(salary.month).padStart(2, '0')}_${safeName}.pdf`;

  doc.save(fileName);
}
