import React from 'react';
import styles from './ThemeToggle.module.css';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.floatingButton}
      title={isDark ? 'Ganti ke Mode Terang (Floral White)' : 'Ganti ke Mode Gelap (Dark Plum)'}
      aria-label="Toggle theme"
    >
      <div className={styles.iconContainer}>
        {isDark ? (
          <Sun size={20} className={styles.sunIcon} />
        ) : (
          <Moon size={20} className={styles.moonIcon} />
        )}
      </div>
      <span className={styles.tooltip}>
        {isDark ? 'Mode Terang' : 'Mode Gelap'}
      </span>
    </button>
  );
}
