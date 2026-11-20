import React, { useState } from 'react';
import styles from './PocketSection.module.css';
import ExpenseRow from './ExpenseRow';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatRupiah } from '../../utils/formatters';
import { Plus, ShoppingBag, Coffee, TrendingUp } from 'lucide-react';

const POCKET_ICONS = {
  Kebutuhan: ShoppingBag,
  Jajan: Coffee,
  Investasi: TrendingUp,
};

export default function PocketSection({
  pocket,
  totalSalary,
  isEditor,
  onAddExpense,
  onDeleteExpenseRequest,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const Icon = POCKET_ICONS[pocket.name] || ShoppingBag;

  // Hitung batas nominal dari persentase x total gaji
  const nominalLimit = Math.round(((Number(pocket.percentage) || 0) / 100) * totalSalary);

  // Total terpakai di kantong ini
  const totalSpent = (pocket.expenses || []).reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  );

  // Sisa nominal di kantong
  const remaining = nominalLimit - totalSpent;
  const isOverbudget = remaining < 0;
  const percentUsed = nominalLimit > 0 ? Math.min(100, Math.round((totalSpent / nominalLimit) * 100)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;

    setLoading(true);
    try {
      await onAddExpense(pocket.id, label, amount, date);
      setLabel('');
      setAmount('');
      setIsAdding(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconBox}>
            <Icon size={16} />
          </div>
          <div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{pocket.name}</span>
              <span className={styles.percentageBadge}>{pocket.percentage}%</span>
            </div>
            <div className={styles.limitInfo}>
              Batas: <strong>{formatRupiah(nominalLimit)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.statusWrap}>
          <div className={styles.spentMeta}>
            <span className={styles.spentLabel}>Terpakai:</span>
            <span className={styles.spentAmount}>{formatRupiah(totalSpent)}</span>
          </div>
          <div className={`${styles.remainingMeta} ${isOverbudget ? styles.overbudget : ''}`}>
            <span className={styles.remainingLabel}>Sisa:</span>
            <span className={styles.remainingAmount}>{formatRupiah(remaining)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div
          className={`${styles.progressBar} ${isOverbudget ? styles.progressOver : ''}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Action Add Button */}
      <div className={styles.actionRow}>
        <span className={styles.listLabel}>Daftar Pengeluaran ({pocket.expenses?.length || 0})</span>
        {isEditor && !isAdding && (
          <Button
            size="sm"
            variant="ghost"
            icon={Plus}
            onClick={() => setIsAdding(true)}
          >
            Catat Pengeluaran
          </Button>
        )}
      </div>

      {/* Form Tambah Pengeluaran */}
      {isAdding && isEditor && (
        <form onSubmit={handleSubmit} className={styles.addForm}>
          <div className={styles.formGrid}>
            <Input
              placeholder="Deskripsi pengeluaran"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="Nominal (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className={styles.formActions}>
            <Button type="submit" size="sm" variant="primary" loading={loading}>
              Simpan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsAdding(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {/* List Item Pengeluaran */}
      <div className={styles.expenseList}>
        {pocket.expenses && pocket.expenses.length > 0 ? (
          pocket.expenses.map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              isEditor={isEditor}
              onDeleteRequest={(targetExp) => onDeleteExpenseRequest(pocket.id, targetExp)}
            />
          ))
        ) : (
          <p className={styles.emptyText}>Belum ada pengeluaran di kantong ini.</p>
        )}
      </div>
    </div>
  );
}
