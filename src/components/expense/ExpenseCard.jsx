import React, { useState } from 'react';
import styles from './ExpenseCard.module.css';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PocketSection from './PocketSection';
import { formatRupiah, formatExpenseHeader } from '../../utils/formatters';
import { SlidersHorizontal, Check, AlertCircle, CalendarRange } from 'lucide-react';

export default function ExpenseCard({
  salary,
  totalSalary,
  pockets = [],
  isEditor,
  onUpdatePercentages,
  onAddExpense,
  onDeleteExpenseRequest,
}) {
  const [isEditingPockets, setIsEditingPockets] = useState(false);
  const [pocketDraft, setPocketDraft] = useState(() =>
    pockets.map((p) => ({ ...p }))
  );
  const [savingPockets, setSavingPockets] = useState(false);

  // Hitung total pengeluaran semua kantong
  const totalAllExpenses = pockets.reduce((sum, pkt) => {
    const pktSum = (pkt.expenses || []).reduce(
      (sub, exp) => sub + (Number(exp.amount) || 0),
      0
    );
    return sum + pktSum;
  }, 0);

  const remainingIncome = totalSalary - totalAllExpenses;
  const isDeficit = remainingIncome < 0;

  // Header format: "November 2026 - Desember 2026"
  const headerLabel = formatExpenseHeader(salary.month, salary.year);

  // Validasi draft persentase = 100%
  const draftSum = pocketDraft.reduce(
    (sum, p) => sum + (Number(p.percentage) || 0),
    0
  );
  const isDraftValid = Math.round(draftSum) === 100;

  const handleOpenEdit = () => {
    setPocketDraft(pockets.map((p) => ({ ...p })));
    setIsEditingPockets(true);
  };

  const handleDraftChange = (name, newPercent) => {
    setPocketDraft((prev) =>
      prev.map((p) => (p.name === name ? { ...p, percentage: newPercent } : p))
    );
  };

  const handleSavePercentages = async () => {
    if (!isDraftValid) return;
    setSavingPockets(true);
    try {
      await onUpdatePercentages(salary.id, pocketDraft);
      setIsEditingPockets(false);
    } finally {
      setSavingPockets(false);
    }
  };

  return (
    <Card
      header={
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <CalendarRange size={18} className={styles.headerIcon} />
            <span className={styles.headerTitle}>{headerLabel}</span>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.salaryRef}>
              Gaji: <strong>{formatRupiah(totalSalary)}</strong>
            </div>
            {isEditor && !isEditingPockets && (
              <Button
                size="sm"
                variant="outline"
                icon={SlidersHorizontal}
                onClick={handleOpenEdit}
              >
                Atur Persentase
              </Button>
            )}
          </div>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <div className={styles.footerItem}>
            <span className={styles.footerLabel}>Total Seluruh Pengeluaran:</span>
            <span className={styles.totalSpentText}>{formatRupiah(totalAllExpenses)}</span>
          </div>
          <div className={styles.footerItem}>
            <span className={styles.footerLabel}>Sisa Gaji Bersih:</span>
            <span className={`${styles.netRemainingText} ${isDeficit ? styles.deficit : ''}`}>
              {formatRupiah(remainingIncome)}
            </span>
          </div>
        </div>
      }
      className={styles.card}
    >
      {/* Modal/Inline Form Atur Persentase Kantong */}
      {isEditingPockets && isEditor && (
        <div className={styles.editPocketsBox}>
          <div className={styles.editPocketsHeader}>
            <span className={styles.editPocketsTitle}>Atur Pembagian Persentase Kantong</span>
            <span className={`${styles.sumBadge} ${isDraftValid ? styles.sumValid : styles.sumInvalid}`}>
              Total: {draftSum}% / 100%
            </span>
          </div>

          <div className={styles.pocketsInputsGrid}>
            {pocketDraft.map((pkt) => (
              <div key={pkt.name} className={styles.pocketInputItem}>
                <span className={styles.inputItemName}>{pkt.name}</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={pkt.percentage}
                  onChange={(e) => handleDraftChange(pkt.name, e.target.value)}
                  placeholder="%"
                />
              </div>
            ))}
          </div>

          {!isDraftValid && (
            <div className={styles.validationError}>
              <AlertCircle size={15} />
              <span>Total persentase harus tepat 100%. Mohon sesuaikan angka.</span>
            </div>
          )}

          <div className={styles.editActions}>
            <Button
              size="sm"
              variant="primary"
              icon={Check}
              disabled={!isDraftValid}
              loading={savingPockets}
              onClick={handleSavePercentages}
            >
              Simpan Persentase
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditingPockets(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Daftar 3 Kantong (Kebutuhan, Jajan, Investasi) */}
      <div className={styles.pocketsGrid}>
        {pockets.map((pkt) => (
          <PocketSection
            key={pkt.id || pkt.name}
            pocket={pkt}
            totalSalary={totalSalary}
            isEditor={isEditor}
            onAddExpense={(pocketId, label, amount, date) =>
              onAddExpense(salary.id, pocketId, label, amount, date)
            }
            onDeleteExpenseRequest={(pocketId, exp) =>
              onDeleteExpenseRequest(salary.id, pocketId, exp)
            }
          />
        ))}
      </div>
    </Card>
  );
}
