import React from 'react';
import styles from './EmptyState.module.css';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Belum ada data',
  description = 'Data pengeluaran atau gaji belum tercatat.',
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconWrap}>
        <Icon size={32} />
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
