import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { Menu, Bell, User as UserIcon, Wallet } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const formattedBalance = user?.balanceUsd
    ? `$${parseFloat(user.balanceUsd).toFixed(3)}`
    : '$0.000';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Right side (RTL start): Brand Logo + Name */}
        <Link href="/" data-brand-logo className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
              {settings.site_name || 'Shad Store'}
            </span>
            {settings.site_tagline && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block leading-none mt-0.5">
                {settings.site_tagline}
              </span>
            )}
          </div>
        </Link>

        {/* Center: Balance (Only when logged-in, formatted $0.000) */}
        {user ? (
          <div
            data-balance
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm shadow-xs"
          >
            <Wallet className="w-4 h-4 text-primary" />
            <span dir="ltr" className="tracking-tight">{formattedBalance}</span>
          </div>
        ) : null}

        {/* Left side (RTL end): Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification icon with badge */}
              <button
                type="button"
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </button>

              {/* Profile icon */}
              <Link
                href="/profile"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title="الملف الشخصي"
              >
                <UserIcon className="w-5 h-5" />
              </Link>
            </>
          ) : null}

          {/* Menu button (opens Sidebar) - In logged-out, this is the ONLY action, matching Image #1 */}
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="القائمة الرئيسية"
            title="القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};
