import React from 'react';
import styles from './Input.module.css';

export default function Input({
  label,
  error,
  helper,
  icon: Icon,
  type = 'text',
  className = '',
  disabled = false,
  ...rest
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.inputContainer} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        {Icon && <Icon size={16} className={styles.icon} />}
        <input
          type={type}
          disabled={disabled}
          className={styles.input}
          {...rest}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {!error && helper && <span className={styles.helperText}>{helper}</span>}
    </div>
  );
}
