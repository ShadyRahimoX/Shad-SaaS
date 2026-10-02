import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  ShoppingCart,
  AlertOctagon,
  FolderTree,
  PackagePlus,
  Package,
  Boxes,
  CreditCard,
  Truck,
  Store,
  Crown,
  Coins,
  TrendingUp,
  Users,
  Wallet,
  TrendingDown,
  UserPlus,
  Gift,
  Award,
  BellRing,
  Server,
  DownloadCloud,
  Key,
  Palette,
  MessageSquare,
  ListOrdered,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'لوحة القيادة',
    items: [
      { id: 'dashboard', label: 'الرئيسية', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'إدارة الطلبات',
    items: [
      { id: 'orders', label: 'الطلبات', href: '/orders', icon: ShoppingCart },
      { id: 'disputes', label: 'طلبات الاعتراض', href: '/disputes', icon: AlertOctagon },
    ],
  },
  {
    title: 'الأقسام والمنتجات',
    items: [
      { id: 'categories', label: 'الأقسام', href: '/categories', icon: FolderTree },
      { id: 'products-add', label: 'إضافة منتج', href: '/products/add', icon: PackagePlus },
      { id: 'products', label: 'إدارة المنتجات', href: '/products', icon: Package },
      { id: 'inventory', label: 'منتجات المخزون', href: '/inventory', icon: Boxes },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'payment-methods', label: 'طرق الدفع', href: '/payment-methods', icon: CreditCard },
      { id: 'shipping-requests', label: 'طلبات الشحن', href: '/shipping-requests', icon: Truck },
      { id: 'store-cards', label: 'بطاقات المتجر', href: '/store-cards', icon: Store },
      { id: 'vip-profit', label: 'نسبة ربح VIP', href: '/vip-profit', icon: Crown },
      { id: 'currencies', label: 'العملات', href: '/currencies', icon: Coins },
      { id: 'profit-log', label: 'سجل الأرباح', href: '/profit-log', icon: TrendingUp },
    ],
  },
  {
    title: 'المستخدمون',
    items: [
      { id: 'users', label: 'إدارة المستخدمين', href: '/users', icon: Users },
      { id: 'debts', label: 'الرصيد المدين', href: '/debts', icon: Wallet },
      { id: 'top-spenders', label: 'الأكثر صرفاً', href: '/top-spenders', icon: TrendingDown },
      { id: 'agents', label: 'الوكلاء', href: '/agents', icon: UserPlus },
      { id: 'referrals', label: 'الإحالات', href: '/referrals', icon: Gift },
      { id: 'vip-members', label: 'عضويات VIP', href: '/vip-members', icon: Award },
      { id: 'send-notification', label: 'إرسال إشعار', href: '/send-notification', icon: BellRing },
    ],
  },
  {
    title: 'API',
    items: [
      { id: 'providers', label: 'إدارة المزودين', href: '/providers', icon: Server },
      { id: 'product-import', label: 'استيراد منتجات', href: '/product-import', icon: DownloadCloud },
      { id: 'api-clients', label: 'عملاء API', href: '/api-clients', icon: Key },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      { id: 'design', label: 'التصميم', href: '/design', icon: Palette },
      { id: 'order-messages', label: 'رسائل الطلب', href: '/order-messages', icon: MessageSquare },
      { id: 'sorting', label: 'إدارة الترتيب', href: '/sorting', icon: ListOrdered },
      { id: 'contact', label: 'وسائل التواصل', href: '/contact', icon: Share2 },
      { id: 'accounts', label: 'حسابات الإدارة', href: '/accounts', icon: ShieldCheck },
      { id: '2fa', label: 'التحقق بخطوتين', href: '/2fa', icon: Key },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-card text-card-foreground border-l border-border shadow-lg flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        dir="rtl"
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border flex items-center justify-between shrink-0">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-xl shadow-md">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-foreground leading-tight">لوحة الإدارة</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Shad-SaaS Pro</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold text-muted-foreground/80 tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      data-sidebar-item={item.id}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 text-primary border-r-4 border-primary'
                          : 'text-foreground/80 hover:text-foreground hover:bg-muted/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/70 text-center shrink-0">
          <p className="text-[10px] text-muted-foreground font-medium">
            Shad-SaaS v1.0.0 &copy; 2026
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
