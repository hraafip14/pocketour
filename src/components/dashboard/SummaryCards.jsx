import React from 'react';
import styles from './SummaryCards.module.css';
import { formatRupiah } from '../../utils/formatters';
import { Wallet, Receipt, PiggyBank, Percent } from 'lucide-react';

export default function SummaryCards({
  totalSalary,
  totalExpenses,
  remainingIncome,
}) {
  const isDeficit = remainingIncome < 0;

  // Rasio penghematan / sisa terhadap total pemasukan
  const savingsRate =
    totalSalary > 0
      ? Math.max(0, Math.round((remainingIncome / totalSalary) * 100))
      : 0;

  return (
    <div className={styles.grid}>
      {/* 1. Total Gaji */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Pemasukan Gaji</span>
          <div className={`${styles.iconWrap} ${styles.iconSalary}`}>
            <Wallet size={18} />
          </div>
        </div>
        <div className={styles.cardValue}>{formatRupiah(totalSalary)}</div>
        <div className={styles.cardSub}>Termasuk gaji pokok & tunjangan</div>
      </div>

      {/* 2. Total Pengeluaran */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Total Pengeluaran</span>
          <div className={`${styles.iconWrap} ${styles.iconExpense}`}>
            <Receipt size={18} />
          </div>
        </div>
        <div className={styles.cardValue}>{formatRupiah(totalExpenses)}</div>
        <div className={styles.cardSub}>Total akumulasi ketiga pos kantong</div>
      </div>

      {/* 3. Sisa Bersih */}
      <div className={`${styles.card} ${isDeficit ? styles.cardDeficit : ''}`}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Sisa Gaji Bersih</span>
          <div className={`${styles.iconWrap} ${isDeficit ? styles.iconDeficit : styles.iconRemaining}`}>
            <PiggyBank size={18} />
          </div>
        </div>
        <div className={`${styles.cardValue} ${isDeficit ? styles.textDeficit : styles.textRemaining}`}>
          {formatRupiah(remainingIncome)}
        </div>
        <div className={styles.cardSub}>
          {isDeficit ? 'Pengeluaran melebihi total pendapatan' : 'Tersisa dari alokasi bulan ini'}
        </div>
      </div>

      {/* 4. Tingkat Penghematan */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Tingkat Penghematan</span>
          <div className={`${styles.iconWrap} ${styles.iconPercent}`}>
            <Percent size={18} />
          </div>
        </div>
        <div className={styles.cardValue}>{savingsRate}%</div>
        <div className={styles.cardSub}>Persentase pendapatan belum terpakai</div>
      </div>
    </div>
  );
}
