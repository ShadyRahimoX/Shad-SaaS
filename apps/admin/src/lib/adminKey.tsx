import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'admin_sync_key';

interface AdminKeyContextValue {
  adminKey: string | null;
  setAdminKey: (key: string) => void;
  clearAdminKey: () => void;
  isReady: boolean;
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

export const AdminKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminKey, setKeyState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setKeyState(stored);
    } catch {}
    setIsReady(true);
  }, []);

  const setAdminKey = (key: string) => {
    setKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {}
  };

  const clearAdminKey = () => {
    setKeyState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AdminKeyContext.Provider value={{ adminKey, setAdminKey, clearAdminKey, isReady }}>
      {children}
    </AdminKeyContext.Provider>
  );
};

export function useAdminKey() {
  const ctx = useContext(AdminKeyContext);
  if (!ctx) throw new Error('useAdminKey must be used within AdminKeyProvider');
  return ctx;
}

export function getAdminKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
