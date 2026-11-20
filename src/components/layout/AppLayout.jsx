import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from './AppLayout.module.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from '../ui/Toast';
import ConfirmModal from '../ui/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

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
    <div className={styles.layoutWrapper}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRequestLogout={() => setShowLogoutConfirm(true)}
      />

      <div className={styles.mainContainer}>
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className={styles.contentArea}>
          <Outlet />
        </main>
      </div>

      {/* Toast Notifier */}
      <Toast />

      {/* Logout Confirmation Modal */}
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
