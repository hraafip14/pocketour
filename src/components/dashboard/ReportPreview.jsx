import React, { useState } from 'react';
import styles from './ReportPreview.module.css';
import Button from '../ui/Button';
import { formatRupiah, formatMonthYear } from '../../utils/formatters';
import {
  FileSpreadsheet,
  FileText,
  Send,
  X,
  Mail,
  Eye,
  Calendar,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export default function ReportPreview({
  isOpen,
  salary,
  pockets = [],
  totalSalary,
  totalExpenses,
  remainingIncome,
  profile,
  isEditor = false,
  onClose,
  onExportExcel,
  onExportPdf,
  onSendEmail,
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'pockets' | 'expenses'
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!isOpen || !salary) return null;

  const periodLabel = formatMonthYear(salary.month, salary.year);

  // Daftar pengeluaran digabung
  const allExpenses = [];
  pockets.forEach((pkt) => {
    (pkt.expenses || []).forEach((exp) => {
      allExpenses.push({ ...exp, pocketName: pkt.name });
    });
  });

  const handleSend = async () => {
    if (!isEditor) return;
    setIsSendingEmail(true);
    try {
      await onSendEmail();
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.previewIconWrap}>
              <Eye size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Pratinjau Laporan Keuangan</h2>
              <div className={styles.metaRow}>
                <Calendar size={13} />
                <span>{periodLabel}</span>
                <span className={styles.dot}>•</span>
                <span>{profile?.fullName}</span>
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup preview">
            <X size={18} />
          </button>
        </div>

        {/* Notifikasi Mode Pelihat / Info Pengiriman Email */}
        {!isEditor ? (
          <div className={styles.viewerAlert}>
            <ShieldAlert size={16} className={styles.alertIcon} />
            <span>
              <strong>Mode Pelihat (Hanya-Baca):</strong> Anda sedang melihat profil <strong>{profile?.fullName}</strong>. Fitur ekspor berkas (Excel/PDF) dan kirim email laporan dinonaktifkan.
            </span>
          </div>
        ) : (
          <div className={styles.emailNotice}>
            <Mail size={16} className={styles.mailIcon} />
            <span>
              Laporan ini ditujukan & akan dikirimkan ke 2 email:
              <strong> hasajalah74@gmail.com</strong> dan <strong>nidaliyana14@gmail.com</strong>.
            </span>
          </div>
        )}

        {/* Tab Navigasi */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'summary' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Ringkasan Metrik
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'pockets' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pockets')}
          >
            Alokasi Kantong ({pockets.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'expenses' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Daftar Transaksi ({allExpenses.length})
          </button>
        </div>

        {/* Isi Tab */}
        <div className={styles.body}>
          {activeTab === 'summary' && (
            <div className={styles.tabContent}>
              <div className={styles.metricGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Total Pemasukan Gaji</span>
                  <span className={styles.metricVal}>{formatRupiah(totalSalary)}</span>
                  <span className={styles.metricSub}>
                    Gaji pokok ({formatRupiah(salary.base_salary)}) + {salary.incentives?.length || 0} insentif
                  </span>
                </div>

                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Total Pengeluaran</span>
                  <span className={styles.metricVal}>{formatRupiah(totalExpenses)}</span>
                  <span className={styles.metricSub}>
                    Dari total {allExpenses.length} catatan transaksi
                  </span>
                </div>

                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Sisa Gaji Bersih</span>
                  <span
                    className={`${styles.metricVal} ${remainingIncome < 0 ? styles.valDeficit : styles.valSuccess}`}
                  >
                    {formatRupiah(remainingIncome)}
                  </span>
                  <span className={styles.metricSub}>
                    {remainingIncome < 0 ? 'Kondisi defisit' : 'Saldo surplus periode ini'}
                  </span>
                </div>
              </div>

              {salary.incentives && salary.incentives.length > 0 && (
                <div className={styles.incPreviewBox}>
                  <span className={styles.incTitle}>Rincian Insentif & Tunjangan:</span>
                  <div className={styles.incTags}>
                    {salary.incentives.map((inc) => (
                      <span key={inc.id} className={styles.incTag}>
                        {inc.label}: <strong>{formatRupiah(inc.amount)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pockets' && (
            <div className={styles.tabContent}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pos Kantong</th>
                      <th>Alokasi</th>
                      <th>Batas Nominal</th>
                      <th>Terpakai</th>
                      <th>Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pockets.map((pkt) => {
                      const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
                      const spent = (pkt.expenses || []).reduce(
                        (s, e) => s + (Number(e.amount) || 0),
                        0
                      );
                      const rem = limit - spent;
                      return (
                        <tr key={pkt.name}>
                          <td><strong>{pkt.name}</strong></td>
                          <td>{pkt.percentage}%</td>
                          <td>{formatRupiah(limit)}</td>
                          <td>{formatRupiah(spent)}</td>
                          <td className={rem < 0 ? styles.valDeficit : styles.valSuccess}>
                            {formatRupiah(rem)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className={styles.tabContent}>
              {allExpenses.length === 0 ? (
                <p className={styles.emptyNote}>Belum ada catatan pengeluaran di periode ini.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Deskripsi</th>
                        <th>Tanggal</th>
                        <th>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allExpenses.map((exp) => (
                        <tr key={exp.id}>
                          <td><span className={styles.pocketPill}>{exp.pocketName}</span></td>
                          <td>{exp.label}</td>
                          <td>{exp.date || '-'}</td>
                          <td className={styles.amountCol}>{formatRupiah(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions: Export & Send Email */}
        <div className={styles.footer}>
          <div className={styles.exportBtns}>
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              disabled={!isEditor}
              title={!isEditor ? 'Fitur ekspor Excel dinonaktifkan pada mode pelihat' : 'Export Excel (.xlsx)'}
              onClick={isEditor ? onExportExcel : undefined}
            >
              Export Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FileText}
              disabled={!isEditor}
              title={!isEditor ? 'Fitur ekspor PDF dinonaktifkan pada mode pelihat' : 'Export PDF (.pdf)'}
              onClick={isEditor ? onExportPdf : undefined}
            >
              Export PDF (.pdf)
            </Button>
          </div>

          <div className={styles.mainActions}>
            <Button
              variant={isEditor ? 'primary' : 'secondary'}
              size="sm"
              icon={isEditor ? Send : Lock}
              disabled={!isEditor}
              title={!isEditor ? 'Fitur kirim email dinonaktifkan pada mode pelihat' : 'Kirim Email Laporan'}
              loading={isSendingEmail}
              onClick={handleSend}
            >
              {isEditor ? 'Kirim Email Laporan' : 'Kirim Email (Terkunci)'}
            </Button>
            {!isEditor && (
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                Tutup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
