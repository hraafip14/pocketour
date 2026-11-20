import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from './Toast.module.css';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type] || styles.info}`}
            role="alert"
          >
            <div className={styles.iconWrapper}>
              {isSuccess && <CheckCircle2 size={18} className={styles.iconSuccess} />}
              {isError && <AlertCircle size={18} className={styles.iconError} />}
              {!isSuccess && !isError && <Info size={18} className={styles.iconInfo} />}
            </div>
            <div className={styles.content}>
              {toast.title && <div className={styles.title}>{toast.title}</div>}
              <div className={styles.message}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={styles.closeBtn}
              aria-label="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
