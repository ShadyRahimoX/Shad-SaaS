import React from 'react';
import { useTheme } from '../lib/theme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { mode, toggleMode, setMode } = useTheme();
  const isDark = mode === 'dark';

  if (variant === 'switch') {
    return (
      <div className={`flex items-center justify-between py-2 px-3 rounded-xl bg-muted/60 ${className}`}>
        <div className="flex items-center gap-2.5 text-sm font-medium">
          {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>{isDark ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>
        </div>
        <button
          type="button"
          onClick={toggleMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDark ? 'bg-primary' : 'bg-secondary'
          }`}
          aria-label="تبديل المظهر"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              isDark ? 'translate-x-1' : 'translate-x-6'
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      className={`p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ${className}`}
      aria-label="تبديل المظهر"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
