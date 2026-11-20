// Helper format mata uang Rupiah
export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Nama-nama bulan Indonesia
export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getMonthName(monthNumber) {
  return MONTH_NAMES[(monthNumber - 1) % 12] || '';
}

export function formatMonthYear(month, year) {
  return `${getMonthName(month)} ${year}`;
}

export function formatExpenseHeader(month, year) {
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear = year + 1;
  }
  return `${getMonthName(month)} ${year} - ${getMonthName(nextMonth)} ${nextYear}`;
}
