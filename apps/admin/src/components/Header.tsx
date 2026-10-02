import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAdminKey } from '../lib/adminKey';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { clearAdminKey } = useAdminKey();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Right side (RTL start): Mobile menu button + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors lg:hidden cursor-pointer"
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base text-foreground">
            لوحة التحكم الرئيسية
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
            Live
          </span>
        </div>
      </div>

      {/* Left side (RTL end): Dark mode toggle + Admin profile dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="تبديل المظهر"
          title="تبديل المظهر"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-black text-xs flex items-center justify-center shadow-xs">
              A
            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-foreground leading-tight">مدير النظام</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Super Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-card border border-border shadow-xl p-1.5 space-y-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="font-bold text-foreground">مدير النظام</p>
                <p className="text-[10px] text-muted-foreground font-mono">admin@shad-saas.dev</p>
              </div>

              <Link
                href="/design"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted font-bold transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>إعدادات التصميم</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  clearAdminKey();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 font-bold transition-colors cursor-pointer text-right"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
