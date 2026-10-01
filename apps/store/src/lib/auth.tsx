import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from './api';

export interface User {
  id: string;
  displayId: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  balanceUsd: string;
  referralCode?: string;
  vip?: {
    level: number;
    name: string;
    color: string;
    centDiscountPercent: number;
    cashbackPercent: number;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  referralCode?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.get<User>('/api/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('refreshUser failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await api.post<{ user: User; accessToken: string }>('/api/auth/login', {
        usernameOrEmail,
        password,
      });

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: res.error?.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'حدث خطأ في الاتصال بالخادم.',
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await api.post<{ user: User; accessToken: string }>('/api/auth/register', data);

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: res.error?.message || 'فشل إنشاء الحساب.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'حدث خطأ في الاتصال بالخادم.',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
