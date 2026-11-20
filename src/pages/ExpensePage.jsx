import React, { useState } from 'react';
import styles from './ExpensePage.module.css';
import { useSalary } from '../hooks/useSalary';
import { useExpense } from '../hooks/useExpense';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import ExpenseCard from '../components/expense/ExpenseCard';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';
import { Receipt, Info } from 'lucide-react';

export default function ExpensePage() {
  const { isEditor, roleLabel } = useProfile();
  const { salaries, loading: salaryLoading, calculateTotalSalary } = useSalary();
  const {
    expenseData,
    loading: expenseLoading,
    updatePocketPercentages,
    addExpense,
    deleteExpense,
  } = useExpense(salaries);

  const { success, error: toastError } = useToast();

  // State modal konfirmasi hapus pengeluaran
  const [targetToDelete, setTargetToDelete] = useState(null); // { salaryId, pocketId, expense }
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdatePercentages = async (salaryId, updatedPockets) => {
    try {
      await updatePocketPercentages(salaryId, updatedPockets);
      success('Pembagian persentase kantong berhasil disimpan.');
    } catch (err) {
      toastError(err.message || 'Gagal mengubah persentase kantong.');
    }
  };

  const handleAddExpense = async (salaryId, pocketId, label, amount, date) => {
    try {
      await addExpense(salaryId, pocketId, label, amount, date);
      success(`Pengeluaran "${label}" berhasil dicatat.`);
    } catch (err) {
      toastError(err.message || 'Gagal mencatat pengeluaran.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(
        targetToDelete.salaryId,
        targetToDelete.pocketId,
        targetToDelete.expense.id
      );
      success(`Pengeluaran "${targetToDelete.expense.label}" berhasil dihapus.`);
      setTargetToDelete(null);
    } catch (err) {
      toastError(err.message || 'Gagal menghapus pengeluaran.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = salaryLoading || expenseLoading;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pos & Kantong Pengeluaran</h1>
          <p className={styles.subtitle}>
            Alokasikan gaji ke dalam 3 kantong (Kebutuhan, Jajan, Investasi) dan catat setiap transaksi.
          </p>
        </div>

        {!isEditor && (
          <div className={styles.readOnlyBanner}>
            <Info size={16} />
            <span>Mode {roleLabel} (Hanya-baca): Anda tidak dapat menambah/mengubah data pengeluaran.</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} />
          <p>Memuat kantong pengeluaran...</p>
        </div>
      ) : salaries.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Belum ada data gaji"
          description="Silakan isi data gaji terlebih dahulu di menu Gaji."
        />
      ) : (
        <div className={styles.cardsGrid}>
          {salaries.map((sal) => {
            const pockets = expenseData[sal.id] || [];
            const totalSalary = calculateTotalSalary(sal);

            return (
              <ExpenseCard
                key={sal.id}
                salary={sal}
                totalSalary={totalSalary}
                pockets={pockets}
                isEditor={isEditor}
                onUpdatePercentages={handleUpdatePercentages}
                onAddExpense={handleAddExpense}
                onDeleteExpenseRequest={(salaryId, pocketId, exp) =>
                  setTargetToDelete({ salaryId, pocketId, expense: exp })
                }
              />
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      <ConfirmModal
        isOpen={!!targetToDelete}
        title="Hapus Catatan Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus catatan "${targetToDelete?.expense?.label}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTargetToDelete(null)}
      />
    </div>
  );
}
