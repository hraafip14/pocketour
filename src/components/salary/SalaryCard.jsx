import React, { useState } from 'react';
import styles from './SalaryCard.module.css';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import IncentiveRow from './IncentiveRow';
import { formatRupiah, formatMonthYear } from '../../utils/formatters';
import { Plus, Check, Calendar, Coins, Sparkles } from 'lucide-react';

export default function SalaryCard({
  salary,
  isEditor,
  totalSalary,
  onUpdateBaseSalary,
  onAddIncentive,
  onDeleteIncentiveRequest,
}) {
  const [isEditingBase, setIsEditingBase] = useState(false);
  const [baseInput, setBaseInput] = useState(salary.base_salary || 0);

  // State tambah insentif
  const [isAddingInc, setIsAddingInc] = useState(false);
  const [incLabel, setIncLabel] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [submittingInc, setSubmittingInc] = useState(false);

  const handleSaveBase = async () => {
    await onUpdateBaseSalary(salary.id, baseInput);
    setIsEditingBase(false);
  };

  const handleCreateIncentive = async (e) => {
    e.preventDefault();
    if (!incLabel.trim() || !incAmount) return;

    setSubmittingInc(true);
    try {
      await onAddIncentive(salary.id, incLabel, incAmount);
      setIncLabel('');
      setIncAmount('');
      setIsAddingInc(false);
    } finally {
      setSubmittingInc(false);
    }
  };

  const monthYearLabel = formatMonthYear(salary.month, salary.year);

  return (
    <Card
      header={
        <div className={styles.header}>
          <Calendar size={18} className={styles.headerIcon} />
          <span className={styles.monthTitle}>{monthYearLabel}</span>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <div className={styles.footerLabel}>
            <span>Total Gaji Periode Ini:</span>
          </div>
          <div className={styles.footerAmount}>
            {formatRupiah(totalSalary)}
          </div>
        </div>
      }
      className={styles.card}
    >
      {/* Bagian Gaji Pokok */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Coins size={16} />
            <span>Gaji Pokok</span>
          </div>
          {isEditor && !isEditingBase && (
            <button
              className={styles.editBtn}
              onClick={() => {
                setBaseInput(salary.base_salary);
                setIsEditingBase(true);
              }}
            >
              Ubah
            </button>
          )}
        </div>

        {isEditingBase && isEditor ? (
          <div className={styles.baseEditForm}>
            <Input
              type="number"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              placeholder="Masukkan gaji pokok"
              autoFocus
            />
            <Button
              size="sm"
              variant="primary"
              icon={Check}
              onClick={handleSaveBase}
            >
              Simpan
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditingBase(false)}
            >
              Batal
            </Button>
          </div>
        ) : (
          <div className={styles.baseDisplay}>
            <span className={styles.baseAmount}>
              {formatRupiah(salary.base_salary)}
            </span>
          </div>
        )}
      </div>

      {/* Bagian Insentif / Tunjangan */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Sparkles size={16} />
            <span>Insentif & Tunjangan</span>
          </div>
          {isEditor && !isAddingInc && (
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() => setIsAddingInc(true)}
            >
              Tambah
            </Button>
          )}
        </div>

        {/* List Insentif */}
        <div className={styles.incentiveList}>
          {salary.incentives && salary.incentives.length > 0 ? (
            salary.incentives.map((inc) => (
              <IncentiveRow
                key={inc.id}
                incentive={inc}
                isEditor={isEditor}
                onDeleteRequest={onDeleteIncentiveRequest}
              />
            ))
          ) : (
            <p className={styles.emptyInc}>Belum ada insentif atau tunjangan.</p>
          )}
        </div>

        {/* Form Tambah Insentif */}
        {isAddingInc && isEditor && (
          <form onSubmit={handleCreateIncentive} className={styles.addIncForm}>
            <div className={styles.addIncInputs}>
              <Input
                placeholder="Nama tunjangan / insentif"
                value={incLabel}
                onChange={(e) => setIncLabel(e.target.value)}
                required
              />
              <Input
                type="number"
                placeholder="Nominal (Rp)"
                value={incAmount}
                onChange={(e) => setIncAmount(e.target.value)}
                required
              />
            </div>
            <div className={styles.addIncActions}>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                loading={submittingInc}
              >
                Simpan
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsAddingInc(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
