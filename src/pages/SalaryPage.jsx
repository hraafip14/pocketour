import React, { useState } from 'react';
import styles from './SalaryPage.module.css';
import { useSalary } from '../hooks/useSalary';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import SalaryCard from '../components/salary/SalaryCard';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';
import { Wallet, Info, Sparkles } from 'lucide-react';

export default function SalaryPage() {
  const { isEditor, roleLabel } = useProfile();
  const {
    salaries,
    loading,
    updateBaseSalary,
    addIncentive,
    deleteIncentive,
    calculateTotalSalary,
  } = useSalary();

  const { success, error: toastError } = useToast();

  // State modal konfirmasi hapus insentif
  const [targetToDelete, setTargetToDelete] = useState(null); // { salaryId, incentive }
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateBase = async (salaryId, newAmount) => {
    try {
      await updateBaseSalary(salaryId, newAmount);
      success('Gaji pokok berhasil diperbarui.');
    } catch (err) {
      toastError(err.message || 'Gagal memperbarui gaji pokok.');
    }
  };

  const handleAddIncentive = async (salaryId, label, amount) => {
    try {
      await addIncentive(salaryId, label, amount);
      success(`Insentif "${label}" berhasil ditambahkan.`);
    } catch (err) {
      toastError(err.message || 'Gagal menambahkan insentif.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteIncentive(targetToDelete.salaryId, targetToDelete.incentive.id);
      success(`Insentif "${targetToDelete.incentive.label}" berhasil dihapus.`);
      setTargetToDelete(null);
    } catch (err) {
      toastError(err.message || 'Gagal menghapus insentif.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manajemen Gaji</h1>
          <p className={styles.subtitle}>
            Kelola gaji pokok dan daftar insentif/tunjangan per periode bulanan.
          </p>
        </div>

        {!isEditor && (
          <div className={styles.readOnlyBanner}>
            <Info size={16} />
            <span>Mode {roleLabel} (Hanya-baca): Anda tidak dapat mengubah data gaji ini.</span>
          </div>
        )}
      </div>

      <div className={styles.periodNotice}>
        <Sparkles size={16} className={styles.periodIcon} />
        <span>
          Periode dimulai dari <strong>November 2026</strong>. Kartu gaji bulan baru akan otomatis ditambahkan setiap memasuki <strong>tanggal 1</strong> bulan berikutnya.
        </span>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} />
          <p>Memuat data gaji...</p>
        </div>
      ) : salaries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada data gaji"
          description="Data gaji untuk profil ini belum dibuat."
        />
      ) : (
        <div className={styles.cardsGrid}>
          {salaries.map((sal) => (
            <SalaryCard
              key={sal.id}
              salary={sal}
              isEditor={isEditor}
              totalSalary={calculateTotalSalary(sal)}
              onUpdateBaseSalary={handleUpdateBase}
              onAddIncentive={handleAddIncentive}
              onDeleteIncentiveRequest={(inc) =>
                setTargetToDelete({ salaryId: sal.id, incentive: inc })
              }
            />
          ))}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Insentif */}
      <ConfirmModal
        isOpen={!!targetToDelete}
        title="Hapus Insentif"
        message={`Apakah Anda yakin ingin menghapus "${targetToDelete?.incentive?.label}" sebesar ${targetToDelete ? targetToDelete.incentive.amount : ''}?`}
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
