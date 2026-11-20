import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  Users,
  LogOut,
  X,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';

export default function Sidebar({ isOpen, onClose, onRequestLogout }) {
  const { activeProfile, role, roleLabel } = useProfile();
  const isEditor = role === 'editor';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/salary', label: 'Gaji', icon: Wallet },
    { to: '/expense', label: 'Pengeluaran', icon: Receipt },
    { to: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <Wallet size={20} />
            </div>
            <span className={styles.brandName}>Pocketour</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Active Profile Info */}
        {activeProfile && (
          <div className={styles.profileBadgeBox}>
            <div className={styles.profileAvatar}>
              {activeProfile.fullName.charAt(0)}
            </div>
            <div className={styles.profileMeta}>
              <div className={styles.profileName} title={activeProfile.fullName}>
                {activeProfile.fullName}
              </div>
              <div className={`${styles.rolePill} ${isEditor ? styles.editorPill : styles.viewerPill}`}>
                {isEditor ? <ShieldCheck size={12} /> : <Eye size={12} />}
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navLabel}>Menu Utama</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                }
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={styles.bottomSection}>
          <NavLink
            to="/profiles"
            onClick={onClose}
            className={styles.bottomActionBtn}
          >
            <Users size={17} />
            <span>Ganti Profil</span>
          </NavLink>

          <button
            onClick={() => {
              onClose();
              onRequestLogout();
            }}
            className={`${styles.bottomActionBtn} ${styles.logoutBtn}`}
          >
            <LogOut size={17} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
