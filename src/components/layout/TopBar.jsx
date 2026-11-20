import React from 'react';
import styles from './TopBar.module.css';
import { Menu, Users, ShieldCheck, Eye } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { Link } from 'react-router-dom';

export default function TopBar({ onOpenSidebar }) {
  const { activeProfile, isEditor, roleLabel } = useProfile();

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onOpenSidebar}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <span className={styles.brandTitleMobile}>Pocketour</span>
      </div>

      <div className={styles.right}>
        {activeProfile && (
          <div className={styles.profileBadge}>
            <div className={`${styles.roleIndicator} ${isEditor ? styles.editorDot : styles.viewerDot}`}>
              {isEditor ? <ShieldCheck size={13} /> : <Eye size={13} />}
              <span>{roleLabel}</span>
            </div>
            <span className={styles.profileNameDesktop}>
              {activeProfile.fullName}
            </span>
          </div>
        )}

        <Link to="/profiles" className={styles.switchProfileBtn} title="Ganti Profil">
          <Users size={16} />
          <span className={styles.switchText}>Ganti Profil</span>
        </Link>
      </div>
    </header>
  );
}
