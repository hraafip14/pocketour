import React, { useEffect } from 'react';
import styles from './ConfirmModal.module.css';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={() => !isLoading && onCancel()}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${isDanger ? styles.danger : styles.neutral}`}>
            <AlertTriangle size={20} />
          </div>
          <h3 id="confirm-modal-title" className={styles.title}>
            {title}
          </h3>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
