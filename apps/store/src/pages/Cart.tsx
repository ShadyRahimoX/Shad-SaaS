import React from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { formatCurrency } from '../lib/utils';
import { CartItem } from '../components/CartItem';
import {
  ShoppingBag,
  ArrowRight,
  Wallet,
  ShieldCheck,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const { items, itemCount, subtotalUsd, clear } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const currencySymbol = settings.site_currency_symbol || '$';
  const formattedSubtotal = formatCurrency(subtotalUsd, currencySymbol);

  const formattedBalance = user?.balanceUsd
    ? formatCurrency(user.balanceUsd, currencySymbol)
    : null;

  const handleCheckoutClick = () => {
    if (!user) {
      setLocation('/login');
      return;
    }
    setLocation('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-5" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10 stroke-1" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-foreground">سلة المشتريات فارغة</h2>
          <p className="text-sm text-muted-foreground">
            لم تقم بإضافة أي منتجات أو بطاقات إلى سلتك بعد.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تصفح الأقسام والمنتجات</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">سلة المشتريات</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              لديك {itemCount} عنصر في السلة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>إفراغ السلة</span>
        </button>
      </div>

      {/* Main Content: Items List + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>متابعة التسوق وإضافة المزيد</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Card (1 col) */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-6">
          <h3 className="font-extrabold text-base text-foreground pb-3 border-b border-border/70">
            ملخص الطلب
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>إجمالي عدد العناصر:</span>
              <span className="font-bold text-foreground" dir="ltr">
                {itemCount}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
              <span className="font-bold text-foreground">المجموع الكلي:</span>
              <span className="text-2xl font-black text-primary tracking-tight" dir="ltr">
                {formattedSubtotal}
              </span>
            </div>

            {/* Available Balance Preview if logged-in */}
            {user && (
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-between text-xs mt-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>رصيدك المتاح:</span>
                </div>
                <span className="font-bold text-primary" dir="ltr">
                  {formattedBalance}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleCheckoutClick}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{user ? 'متابعة إتمام الشراء' : 'تسجيل الدخول لإتمام الشراء'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>دفع آمن وتنفيذ فوري للطلبات</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
