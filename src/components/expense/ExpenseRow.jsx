import React from 'react';
import styles from './ExpenseRow.module.css';
import { formatRupiah } from '../../utils/formatters';
import { Trash2, Calendar } from 'lucide-react';

export default function ExpenseRow({
  expense,
  isEditor,
  onDeleteRequest,
}) {
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <span className={styles.label}>{expense.label}</span>
        {expense.date && (
          <span className={styles.date}>
            <Calendar size={12} />
            <span>{expense.date}</span>
          </span>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.amount}>{formatRupiah(expense.amount)}</span>
        {isEditor && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDeleteRequest(expense)}
            title="Hapus pengeluaran"
            aria-label={`Hapus ${expense.label}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
