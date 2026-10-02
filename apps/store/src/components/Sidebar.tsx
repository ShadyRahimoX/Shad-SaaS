import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { ThemeToggle } from './ThemeToggle';
import {
  X,
  Home,
  Download,
  Info,
  CreditCard,
  History,
  Wallet,
  ShoppingBag,
  Send,
  Users,
  ShieldCheck,
  CheckCircle2,
  Heart,
  User,
  LogOut,
  PhoneCall,
  Crown,
  Coins,
  MessageCircle,
  Ticket,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleInstallClick = () => {
    alert('ميزة تثبيت التطبيق على جهازك قادمة قريباً!');
  };

  const handleTelegramClick = () => {
    const tgUrl = settings.branding_telegram_url || 'https://t.me/shad_store';
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    setLocation('/login');
  };

  const formattedBalance = user?.balanceUsd
    ? `$${parseFloat(user.balanceUsd).toFixed(3)}`
    : '$0.000';

  const vipName = user?.vip?.name || 'New';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        data-sidebar-overlay
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        data-sidebar-drawer
        className={`fixed top-0 right-0 z-50 h-full w-[310px] max-w-[85vw] bg-card text-card-foreground shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l border-border ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Top Header bar with close button */}
        <div className="p-4 flex items-center justify-between border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <span className="font-bold text-sm">{settings.site_name || 'Shad Store'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* USER LOGGED-IN SECTION (Image #6) */}
          {user ? (
            <div className="space-y-4">
              {/* User Header */}
              <div data-user-header className="p-3.5 bg-muted/50 rounded-2xl border border-border/70 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg border border-primary/30 shadow-inner">
                    {user.firstName ? user.firstName[0].toUpperCase() : user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{user.username}</span>
                      <span
                        data-vip-badge
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
                      >
                        <Crown className="w-3 h-3" />
                        <span>{vipName}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: #{user.displayId || user.id.slice(0, 6)}</p>
                  </div>
                </div>

                {/* $ balance */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Wallet className="w-3.5 h-3.5" />
                    <span dir="ltr">{formattedBalance}</span>
                  </div>
                  {/* Active Currency Badge (Image #6) */}
                  <div data-active-currency className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold">
                    <Coins className="w-3 h-3 text-muted-foreground" />
                    <span>العملة: {settings.site_currency || 'USD'}</span>
                  </div>
                </div>

                {/* 3 Quick Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      alert('قائمة المفضلة قريباً!');
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium border border-border/60 transition-colors cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-red-500 mb-1" />
                    <span>المفضلة</span>
                  </button>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium border border-border/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-500 mb-1" />
                    <span>البروفايل</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-card hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 text-[11px] font-medium border border-border/60 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500 mb-1" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>

              {/* Navigation Items (13 items, exactly matching Section 2 list) */}
              <nav className="space-y-1 text-sm font-medium">
                {/* 1 */}
                <Link
                  data-sidebar-item="home"
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Home className="w-4 h-4 text-primary" />
                  <span>الرئيسية</span>
                </Link>

                {/* 2 */}
                <Link
                  data-sidebar-item="deposit"
                  href="/wallet/deposit"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>إضافة رصيد</span>
                </Link>

                {/* 3 */}
                <Link
                  data-sidebar-item="deposits"
                  href="/wallet/deposits"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <History className="w-4 h-4 text-cyan-500" />
                  <span>دفعاتي</span>
                </Link>

                {/* 4 */}
                <Link
                  data-sidebar-item="wallet"
                  href="/wallet"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span>محفظتي</span>
                </Link>

                {/* 5 */}
                <Link
                  data-sidebar-item="orders"
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>طلباتي</span>
                </Link>

                {/* 6 - Chat */}
                <Link
                  data-sidebar-item="chat"
                  href="/chat"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>الدعم المباشر</span>
                </Link>

                {/* 7 - Tickets */}
                <Link
                  data-sidebar-item="tickets"
                  href="/tickets"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Ticket className="w-4 h-4 text-blue-500" />
                  <span>تذاكر الدعم</span>
                </Link>

                {/* 6 */}
                <Link
                  data-sidebar-item="favorites"
                  href="/profile"
                  onClick={() => {
                    onClose();
                    alert('قائمة المفضلة قريباً!');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>المفضلة</span>
                </Link>

                {/* 7 */}
                <button
                  data-sidebar-item="telegram"
                  type="button"
                  onClick={handleTelegramClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors text-right cursor-pointer"
                >
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>حساب تلغرام</span>
                </button>

                {/* 8 */}
                <Link
                  data-sidebar-item="agents"
                  href="/agents"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Users className="w-4 h-4 text-teal-500" />
                  <span>وكلاؤنا</span>
                </Link>

                {/* 9 */}
                <Link
                  data-sidebar-item="protection"
                  href="/protection"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>الحماية والأمان</span>
                </Link>

                {/* 10 */}
                <Link
                  data-sidebar-item="verify"
                  href="/verify"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>توثيق الهوية</span>
                </Link>

                {/* 11 */}
                <button
                  data-sidebar-item="install"
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors text-right cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>تثبيت التطبيق</span>
                </button>

                {/* 12 */}
                <Link
                  data-sidebar-item="about"
                  href="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Info className="w-4 h-4 text-gray-500" />
                  <span>من نحن</span>
                </Link>

                {/* 13 */}
                <button
                  data-sidebar-item="logout"
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors text-right cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>تسجيل الخروج</span>
                </button>
              </nav>
            </div>
          ) : (
            /* USER LOGGED-OUT SECTION (Image #3) - 3 items with data-sidebar-item */
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-2">
                <p className="text-sm font-bold">سجّل الدخول لتجربة متكاملة</p>
                <p className="text-xs text-muted-foreground">احصل على أسعار حصرية، تتبع طلباتك، وشحن فوري</p>
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl text-center shadow-sm"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex-1 py-2 text-xs font-bold border border-border hover:bg-card rounded-xl text-center"
                  >
                    تسجيل
                  </Link>
                </div>
              </div>

              <nav className="space-y-1 text-sm font-medium">
                {/* 1 */}
                <Link
                  data-sidebar-item="home"
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Home className="w-4 h-4 text-primary" />
                  <span>الرئيسية</span>
                </Link>

                {/* 2 */}
                <button
                  data-sidebar-item="install"
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors text-right cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>تثبيت التطبيق</span>
                </button>

                {/* 3 */}
                <Link
                  data-sidebar-item="about"
                  href="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  <Info className="w-4 h-4 text-gray-500" />
                  <span>من نحن</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Theme switch in sidebar */}
          <div data-theme-switch className="pt-2">
            <ThemeToggle variant="switch" />
          </div>

          {/* WhatsApp Support & Social */}
          <div data-whatsapp-btn className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              <span className="font-semibold">خدمة العملاء واتساب</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const phone = settings.branding_contact_phone || settings.branding_whatsapp_business || '+963900000000';
                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
              }}
              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:opacity-90 cursor-pointer"
            >
              محادثة
            </button>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-border text-center text-[11px] text-muted-foreground">
          <span>{settings.site_name || 'Shad Store'} © {new Date().getFullYear()}</span>
        </div>
      </aside>
    </>
  );
};
