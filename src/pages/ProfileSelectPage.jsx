import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import styles from './ProfileSelectPage.module.css';
import { User, ShieldCheck, Eye, ArrowRight, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function ProfileSelectPage() {
  const { currentUser, logout } = useAuth();
  const { profiles, selectProfile } = useProfile();
  const { info } = useToast();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleSelect = (profile) => {
    selectProfile(profile);
    navigate('/dashboard');
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      info('Anda telah keluar dari Pocketour.', 'Sampai Jumpa');
      navigate('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <div className={styles.loginStatus}>
            <span className={styles.statusDot} />
            <span className={styles.loginText}>
              Masuk sebagai: <strong>{currentUser?.fullName}</strong> ({currentUser?.email})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={() => setShowLogoutConfirm(true)}
          >
            Keluar
          </Button>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Pilih Profil Keuangan</h1>
          <p className={styles.subtitle}>
            Pilih lembar keuangan yang ingin Anda tinjau atau kelola.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {profiles.map((p) => {
            const isSelf = currentUser?.email?.toLowerCase() === p.email.toLowerCase();
            const role = isSelf ? 'Editor' : 'Pelihat';
            const roleDescription = isSelf
              ? 'Akses penuh untuk input, ubah, dan hapus data keuangan.'
              : 'Akses hanya-baca (read-only) untuk meninjau laporan keuangan.';

            return (
              <div
                key={p.id}
                className={`${styles.card} ${isSelf ? styles.cardEditor : styles.cardViewer}`}
                onClick={() => handleSelect(p)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.cardHeader}>
                  <div className={`${styles.avatar} ${isSelf ? styles.avatarEditor : styles.avatarViewer}`}>
                    <User size={26} />
                  </div>
                  <span className={`${styles.roleBadge} ${isSelf ? styles.badgeEditor : styles.badgeViewer}`}>
                    {isSelf ? <ShieldCheck size={14} /> : <Eye size={14} />}
                    <span>{role}</span>
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.profileName}>{p.fullName}</h3>
                  <p className={styles.profileEmail}>{p.email}</p>
                  <p className={styles.roleDesc}>{roleDescription}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.enterText}>Buka Profil Keuangan</span>
                  <ArrowRight size={16} className={styles.arrowIcon} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Konfirmasi Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun Pocketour?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        isDanger={true}
        isLoading={logoutLoading}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
