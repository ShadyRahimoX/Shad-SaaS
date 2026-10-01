import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { useTheme } from '../lib/theme';
import { Store, User, LogOut, LogIn, Sun, Moon, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const { settings } = useSettings();
  const { mode, toggleMode, nameAr: themeName } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg leading-tight block">
                {settings.site_name || 'Shad Store'}
              </span>
              <span className="text-xs text-muted-foreground block">
                {settings.site_tagline || 'متجرك الرقمي'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              title={`الوضع الحالي: ${mode === 'dark' ? 'داكن' : 'فاتح'}`}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {mode === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Actions */}
            {isLoading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl text-sm font-medium">
                  <User className="w-4 h-4 text-primary" />
                  <span>{user.username}</span>
                  {user.balanceUsd && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                      ${parseFloat(user.balanceUsd).toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>دخول</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-border text-foreground hover:bg-muted text-sm font-medium rounded-xl transition-colors"
                >
                  <span>تسجيل جديد</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>النمط النشط: {themeName || 'الافتراضي'}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            مرحباً بك في {settings.site_name || 'Shad Store'}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {settings.site_description || 'منصة متكاملة لبيع وشراء المنتجات الرقمية والبطاقات والخدمات بأعلى معايير الأمان والسرعة.'}
          </p>

          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm text-center space-y-2">
            <p className="text-sm font-semibold text-primary">Home page — H-b قادم</p>
            <p className="text-xs text-muted-foreground">
              تم بنجاح ربط أنظمة المصادقة (Auth Cookie)، الثيمات المركزية (Themes)، والإعدادات العامة (Settings).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {settings.site_name || 'Shad Store'}. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
};
