import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface SiteSettings {
  site_name?: string;
  site_tagline?: string;
  site_description?: string;
  site_currency?: string;
  site_currency_symbol?: string;
  site_language?: string;
  site_timezone?: string;
  support_email?: string;
  min_deposit_usd?: number;
  active_theme_slug?: string;
  registration_enabled?: boolean;
  [key: string]: any;
}

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  get: <T = any>(key: string, fallback?: T) => T;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'Shad Store',
    site_tagline: 'متجرك الرقمي',
    site_currency: 'USD',
    site_currency_symbol: '$',
    registration_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get<SiteSettings>('/api/public/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load public settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const get = <T = any>(key: string, fallback?: T): T => {
    if (key in settings && settings[key] !== undefined && settings[key] !== null) {
      return settings[key] as T;
    }
    return fallback as T;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        get,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
