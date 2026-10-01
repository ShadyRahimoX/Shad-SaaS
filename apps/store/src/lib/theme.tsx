import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface ThemeInfo {
  slug: string;
  nameAr: string;
  nameEn: string;
  isDark: boolean;
  variables: Record<string, string>;
}

interface ThemeContextType {
  slug: string;
  nameAr: string;
  nameEn: string;
  variables: Record<string, string>;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeData, setThemeData] = useState<ThemeInfo>({
    slug: 'default',
    nameAr: 'الافتراضي',
    nameEn: 'Default',
    isDark: false,
    variables: {},
  });

  const [mode, setModeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('store_theme_mode');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem('store_theme_mode', newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // Fetch active theme on mount
  useEffect(() => {
    let isMounted = true;
    api.get<ThemeInfo>('/api/public/theme').then((res) => {
      if (isMounted && res.success && res.data) {
        setThemeData(res.data);

        // If no user preference in localStorage, respect theme's default isDark
        if (!localStorage.getItem('store_theme_mode')) {
          const initialMode = res.data.isDark ? 'dark' : 'light';
          setModeState(initialMode);
          localStorage.setItem('store_theme_mode', initialMode);
        }

        // Apply theme variables to root style
        if (res.data.variables) {
          const root = document.documentElement;
          for (const [key, value] of Object.entries(res.data.variables)) {
            root.style.setProperty(key, value);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update HTML class when mode changes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{
        slug: themeData.slug,
        nameAr: themeData.nameAr,
        nameEn: themeData.nameEn,
        variables: themeData.variables,
        mode,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
