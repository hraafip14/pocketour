import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useProfile } from './contexts/ProfileContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ProfileSelectPage from './pages/ProfileSelectPage';
import DashboardPage from './pages/DashboardPage';
import SalaryPage from './pages/SalaryPage';
import ExpensePage from './pages/ExpensePage';
import SettingsPage from './pages/SettingsPage';

// Guard: Harus login
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Bisa diganti skeleton/loading screen
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Guard: Harus login dan sudah memilih profil keuangan
function RequireActiveProfile({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { activeProfile } = useProfile();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!activeProfile) {
    return <Navigate to="/profiles" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { activeProfile } = useProfile();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.9rem'
      }}>
        Memuat Pocketour...
      </div>
    );
  }

  return (
    <Routes>
      {/* Route Publik: Login (jika sudah login, wajib pilih profil dulu) */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/profiles" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Route Pilih Profil */}
      <Route
        path="/profiles"
        element={
          <RequireAuth>
            <ProfileSelectPage />
          </RequireAuth>
        }
      />

      {/* Route Aplikasi Utama (Dengan Sidebar & TopBar) */}
      <Route
        path="/"
        element={
          <RequireActiveProfile>
            <AppLayout />
          </RequireActiveProfile>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="salary" element={<SalaryPage />} />
        <Route path="expense" element={<ExpensePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={activeProfile ? "/dashboard" : "/profiles"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
