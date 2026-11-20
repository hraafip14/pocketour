import React from 'react';
import styles from './IncentiveRow.module.css';
import { formatRupiah } from '../../utils/formatters';
import { Trash2 } from 'lucide-react';

export default function IncentiveRow({
  incentive,
  isEditor,
  onDeleteRequest,
}) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>{incentive.label}</div>
      <div className={styles.right}>
        <span className={styles.amount}>{formatRupiah(incentive.amount)}</span>
        {isEditor && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDeleteRequest(incentive)}
            title="Hapus insentif"
            aria-label={`Hapus ${incentive.label}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
