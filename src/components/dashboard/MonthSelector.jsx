import React from 'react';
import styles from './MonthSelector.module.css';
import { formatMonthYear } from '../../utils/formatters';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthSelector({
  salaries = [],
  selectedSalaryId,
  onSelectSalary,
}) {
  if (!salaries.length) return null;

  const currentIndex = salaries.findIndex((s) => s.id === selectedSalaryId);
  const currentSalary = salaries[currentIndex] || salaries[0];

  const handlePrev = () => {
    if (currentIndex < salaries.length - 1) {
      onSelectSalary(salaries[currentIndex + 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex > 0) {
      onSelectSalary(salaries[currentIndex - 1].id);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.navWrap}>
        <button
          className={styles.navBtn}
          onClick={handlePrev}
          disabled={currentIndex >= salaries.length - 1}
          title="Bulan Sebelumnya"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>

        <div className={styles.currentMonth}>
          <Calendar size={18} className={styles.icon} />
          <span className={styles.monthText}>
            {formatMonthYear(currentSalary.month, currentSalary.year)}
          </span>
        </div>

        <button
          className={styles.navBtn}
          onClick={handleNext}
          disabled={currentIndex <= 0}
          title="Bulan Berikutnya"
          aria-label="Bulan Berikutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className={styles.selectWrap}>
        <select
          className={styles.dropdown}
          value={currentSalary.id}
          onChange={(e) => onSelectSalary(e.target.value)}
        >
          {salaries.map((s) => (
            <option key={s.id} value={s.id}>
              {formatMonthYear(s.month, s.year)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
