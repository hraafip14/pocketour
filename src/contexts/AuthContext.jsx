import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// Akun baku sesuai spesifikasi
export const REGISTERED_ACCOUNTS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'hasajalah74@gmail.com',
    fullName: 'Hasby Muhammad Raafi Prasetyo',
    initialPassword: 'LiyaAby14',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'nidaliyana14@gmail.com',
    fullName: 'Nida Liyana Nurrohmah',
    initialPassword: 'LiyaAby14',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pocketour_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Inisialisasi auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user && mounted) {
          const user = data.session.user;
          const reg = REGISTERED_ACCOUNTS.find((a) => a.email === user.email);
          const fullUser = {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || reg?.fullName || user.email,
          };
          setCurrentUser(fullUser);
          localStorage.setItem('pocketour_user', JSON.stringify(fullUser));
        }
      } catch (err) {
        console.warn('Supabase auth session fetch fallback:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listener auth perubahan Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const user = session.user;
          const reg = REGISTERED_ACCOUNTS.find((a) => a.email === user.email);
          const fullUser = {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || reg?.fullName || user.email,
          };
          setCurrentUser(fullUser);
          localStorage.setItem('pocketour_user', JSON.stringify(fullUser));
        } else if (event === 'SIGNED_OUT') {
          // Hanya clear jika bukan demo mode
          if (!localStorage.getItem('pocketour_demo_mode')) {
            setCurrentUser(null);
            localStorage.removeItem('pocketour_user');
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Login handler: Coba Supabase Auth dulu, jika gagal/placeholder gunakan verifikasi akun baku
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Coba login Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const reg = REGISTERED_ACCOUNTS.find((a) => a.email === cleanEmail);
        const fullUser = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || reg?.fullName || cleanEmail,
        };
        setCurrentUser(fullUser);
        localStorage.setItem('pocketour_user', JSON.stringify(fullUser));
        localStorage.removeItem('pocketour_demo_mode');
        localStorage.removeItem('pocketour_active_profile');
        return { success: true, user: fullUser };
      }
    } catch (err) {
      console.warn('Supabase login network warning:', err);
    }

    // 2. Demo/Offline fallback verifikasi akun baku
    const regAccount = REGISTERED_ACCOUNTS.find((a) => a.email === cleanEmail);
    if (!regAccount) {
      throw new Error('Email tidak terdaftar sebagai pengguna Pocketour.');
    }

    // Periksa password yang disimpan di localStorage (jika sudah diubah di Pengaturan)
    const customPasswords = JSON.parse(localStorage.getItem('pocketour_passwords') || '{}');
    const validPassword = customPasswords[cleanEmail] || regAccount.initialPassword;

    if (password !== validPassword) {
      throw new Error('Password yang dimasukkan salah.');
    }

    const fullUser = {
      id: regAccount.id,
      email: regAccount.email,
      fullName: regAccount.fullName,
    };
    setCurrentUser(fullUser);
    localStorage.setItem('pocketour_user', JSON.stringify(fullUser));
    localStorage.setItem('pocketour_demo_mode', 'true');
    localStorage.removeItem('pocketour_active_profile');
    return { success: true, user: fullUser };
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out err:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('pocketour_user');
    localStorage.removeItem('pocketour_demo_mode');
    localStorage.removeItem('pocketour_active_profile');
  };

  // Ubah password handler
  const changePassword = async (oldPassword, newPassword) => {
    if (!currentUser) throw new Error('Tidak ada pengguna yang login.');

    // 1. Jika online Supabase user
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (!error) {
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase password update fallback:', err);
    }

    // 2. Local fallback update
    const customPasswords = JSON.parse(localStorage.getItem('pocketour_passwords') || '{}');
    const currentPass = customPasswords[currentUser.email] || 'LiyaAby14';

    if (oldPassword !== currentPass) {
      throw new Error('Password lama tidak sesuai.');
    }

    customPasswords[currentUser.email] = newPassword;
    localStorage.setItem('pocketour_passwords', JSON.stringify(customPasswords));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        changePassword,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
