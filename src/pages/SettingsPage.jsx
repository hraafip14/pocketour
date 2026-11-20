import React, { useState } from 'react';
import styles from './SettingsPage.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Lock, Shield, User, KeyRound, Check } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, changePassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toastError('Harap lengkapi semua kolom password.');
      return;
    }

    if (newPassword.length < 6) {
      toastError('Password baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    if (oldPassword === newPassword) {
      toastError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      success('Password Anda berhasil diperbarui. Silakan gunakan password baru saat login berikutnya.', 'Password Diubah');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError(err.message || 'Gagal mengubah password. Periksa password lama Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pengaturan Akun</h1>
        <p className={styles.subtitle}>
          Kelola kredensial login dan keamanan akun Pocketour Anda.
        </p>
      </div>

      <div className={styles.contentGrid}>
        {/* Card Profil Akun Aktif */}
        <Card
          header={
            <div className={styles.cardHeader}>
              <User size={18} className={styles.cardIcon} />
              <span>Informasi Akun</span>
            </div>
          }
          className={styles.infoCard}
        >
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nama Pengguna</span>
              <span className={styles.infoValue}>{currentUser?.fullName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Alamat Email</span>
              <span className={styles.infoValue}>{currentUser?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Hak Akses</span>
              <span className={styles.infoValue}>
                Editor (Profil Sendiri) · Pelihat (Profil Lainnya)
              </span>
            </div>
          </div>
        </Card>

        {/* Card Form Ubah Password */}
        <Card
          header={
            <div className={styles.cardHeader}>
              <KeyRound size={18} className={styles.cardIcon} />
              <span>Ubah Password Akun</span>
            </div>
          }
          className={styles.passwordCard}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Password Lama"
              type="password"
              placeholder="Masukkan password saat ini"
              icon={Lock}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Password Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              helper="Gunakan kombinasi huruf dan angka untuk keamanan ekstra."
              required
            />

            <Input
              label="Konfirmasi Password Baru"
              type="password"
              placeholder="Ketik ulang password baru"
              icon={Shield}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />

            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Check}
                loading={loading}
              >
                Simpan Password Baru
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
