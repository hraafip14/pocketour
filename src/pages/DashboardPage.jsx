import React, { useState, useMemo } from 'react';
import styles from './DashboardPage.module.css';
import { useSalary } from '../hooks/useSalary';
import { useExpense } from '../hooks/useExpense';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import MonthSelector from '../components/dashboard/MonthSelector';
import SummaryCards from '../components/dashboard/SummaryCards';
import PocketBreakdown from '../components/dashboard/PocketBreakdown';
import ReportPreview from '../components/dashboard/ReportPreview';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { exportToExcel } from '../lib/exportExcel';
import { exportToPdf } from '../lib/exportPdf';
import { sendReportEmail } from '../lib/sendEmail';
import {
  FileText,
  Eye,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Wallet,
} from 'lucide-react';

export default function DashboardPage() {
  const { activeProfile, isEditor, roleLabel } = useProfile();
  const { salaries, loading: salaryLoading, calculateTotalSalary } = useSalary();
  const { expenseData, loading: expenseLoading } = useExpense(salaries);
  const { success, error: toastError, info } = useToast();

  // State bulan terpilih
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);

  // State modal preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Gaji bulan terpilih
  const currentSalary = useMemo(() => {
    if (!salaries || salaries.length === 0) return null;
    if (selectedSalaryId) {
      const found = salaries.find((s) => s.id === selectedSalaryId);
      if (found) return found;
    }
    return salaries[0];
  }, [salaries, selectedSalaryId]);

  // Kantong bulan terpilih
  const currentPockets = useMemo(() => {
    if (!currentSalary) return [];
    return expenseData[currentSalary.id] || [];
  }, [currentSalary, expenseData]);

  // Kalkulasi total
  const totalSalary = useMemo(() => {
    return calculateTotalSalary(currentSalary);
  }, [currentSalary, calculateTotalSalary]);

  const totalExpenses = useMemo(() => {
    return currentPockets.reduce((sum, pkt) => {
      const pSum = (pkt.expenses || []).reduce(
        (sub, exp) => sub + (Number(exp.amount) || 0),
        0
      );
      return sum + pSum;
    }, 0);
  }, [currentPockets]);

  const remainingIncome = totalSalary - totalExpenses;

  // Handlers Export & Email
  const handleExportExcel = () => {
    try {
      exportToExcel({
        salary: currentSalary,
        pockets: currentPockets,
        totalSalary,
        totalExpenses,
        remainingIncome,
        profile: activeProfile,
      });
      success('Laporan Excel (.xlsx) berhasil diunduh.', 'Export Excel Selesai');
    } catch (err) {
      toastError(err.message || 'Gagal mengekspor ke Excel.');
    }
  };

  const handleExportPdf = () => {
    try {
      exportToPdf({
        salary: currentSalary,
        pockets: currentPockets,
        totalSalary,
        totalExpenses,
        remainingIncome,
        profile: activeProfile,
      });
      success('Laporan PDF (.pdf) berhasil diunduh.', 'Export PDF Selesai');
    } catch (err) {
      toastError(err.message || 'Gagal mengekspor ke PDF.');
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await sendReportEmail({
        salary: currentSalary,
        pockets: currentPockets,
        totalSalary,
        totalExpenses,
        remainingIncome,
        profile: activeProfile,
      });
      success(
        res.message || 'Laporan berhasil dikirim ke hasajalah74@gmail.com dan nidaliyana14@gmail.com.',
        'Email Terkirim'
      );
    } catch (err) {
      toastError(err.message || 'Gagal mengirim email laporan.');
    }
  };

  const isLoading = salaryLoading || expenseLoading;

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
        <p>Memuat ringkasan dashboard keuangan...</p>
      </div>
    );
  }

  if (!currentSalary) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum Ada Data Gaji"
        description="Silakan buka menu Gaji untuk memulai pencatatan keuangan periode ini."
      />
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Dashboard Top Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.profileBadgeRow}>
            <span className={`${styles.rolePill} ${isEditor ? styles.editorPill : styles.viewerPill}`}>
              {isEditor ? <ShieldCheck size={13} /> : <Eye size={13} />}
              <span>{roleLabel}</span>
            </span>
            <span className={styles.profileNameTitle}>{activeProfile?.fullName}</span>
          </div>
          <h1 className={styles.title}>Dashboard Keuangan</h1>
          <p className={styles.subtitle}>
            Ringkasan pendapatan, pos anggaran kantong, dan riwayat pengeluaran bulanan.
          </p>
        </div>

        {/* Action Button: Preview & Export */}
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="md"
            icon={Eye}
            onClick={() => setShowPreviewModal(true)}
          >
            Tinjau & Ekspor Laporan
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className={styles.selectorSection}>
        <MonthSelector
          salaries={salaries}
          selectedSalaryId={currentSalary.id}
          onSelectSalary={(id) => setSelectedSalaryId(id)}
        />
      </div>

      {/* 4 Summary Metric Cards */}
      <section className={styles.summarySection}>
        <SummaryCards
          totalSalary={totalSalary}
          totalExpenses={totalExpenses}
          remainingIncome={remainingIncome}
        />
      </section>

      {/* Pocket Breakdown & Visualizations */}
      <section className={styles.breakdownSection}>
        <PocketBreakdown
          pockets={currentPockets}
          totalSalary={totalSalary}
        />
      </section>

      {/* Required Report Preview Modal */}
      <ReportPreview
        isOpen={showPreviewModal}
        salary={currentSalary}
        pockets={currentPockets}
        totalSalary={totalSalary}
        totalExpenses={totalExpenses}
        remainingIncome={remainingIncome}
        profile={activeProfile}
        onClose={() => setShowPreviewModal(false)}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
}
