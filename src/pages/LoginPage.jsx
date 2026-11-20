import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import styles from './LoginPage.module.css';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Lock, Wallet, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Harap isi email dan password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      success(`Selamat datang, ${res.user.fullName}!`, 'Login Berhasil');
      navigate('/profiles');
    } catch (err) {
      toastError(err.message || 'Gagal masuk. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <Wallet size={24} />
          </div>
          <h1 className={styles.title}>Pocketour</h1>
          <p className={styles.subtitle}>
            Kelola gaji, kantong pengeluaran, dan laporan keuangan bersama secara teratur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            className={styles.submitBtn}
          >
            Masuk ke Pocketour
          </Button>
        </form>
      </div>
    </div>
  );
}
