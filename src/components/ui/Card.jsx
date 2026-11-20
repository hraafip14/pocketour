import React from 'react';
import styles from './Card.module.css';

export default function Card({
  children,
  header,
  footer,
  action,
  className = '',
  onClick,
}) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
    >
      {(header || action) && (
        <div className={styles.header}>
          <div className={styles.headerTitle}>{header}</div>
          {action && <div className={styles.headerAction}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
