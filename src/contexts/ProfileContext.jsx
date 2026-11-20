import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, REGISTERED_ACCOUNTS } from './AuthContext';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState(REGISTERED_ACCOUNTS);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [activeProfile, setActiveProfile] = useState(() => {
    const saved = localStorage.getItem('pocketour_active_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Fetch profil asli dari tabel Supabase public.profiles
  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map((p) => ({
          id: p.id,
          email: p.email,
          fullName: p.full_name || p.email,
        }));
        setProfiles(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Gagal memuat profil Supabase:', err);
    } finally {
      setLoadingProfiles(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProfiles();
    }
  }, [currentUser, fetchProfiles]);

  // Sinkronkan activeProfile dengan UUID asli dari Supabase saat profiles termuat
  useEffect(() => {
    if (activeProfile && profiles.length > 0) {
      const matched = profiles.find(
        (p) => p.email.toLowerCase() === activeProfile.email.toLowerCase()
      );
      if (matched && matched.id !== activeProfile.id) {
        setActiveProfile(matched);
        localStorage.setItem('pocketour_active_profile', JSON.stringify(matched));
      }
    }
  }, [profiles, activeProfile]);

  // Jika currentUser logout, reset activeProfile
  useEffect(() => {
    if (!currentUser) {
      setActiveProfile(null);
      localStorage.removeItem('pocketour_active_profile');
    }
  }, [currentUser]);

  const selectProfile = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem('pocketour_active_profile', JSON.stringify(profile));
  };

  const clearActiveProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('pocketour_active_profile');
  };

  // RBAC: Jika email profil aktif == email user login -> Editor, selain itu -> Viewer
  const isEditor = Boolean(
    currentUser &&
      activeProfile &&
      currentUser.email.toLowerCase() === activeProfile.email.toLowerCase()
  );

  const role = isEditor ? 'editor' : 'viewer';
  const roleLabel = isEditor ? 'Editor' : 'Pelihat';

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        loadingProfiles,
        activeProfile,
        selectProfile,
        clearActiveProfile,
        refreshProfiles: fetchProfiles,
        isEditor,
        role,
        roleLabel,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
