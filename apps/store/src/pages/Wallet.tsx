import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { depositsApi, type DepositMethod } from '../lib/deposits';
import { formatCurrency } from '../lib/utils';
import { DepositMethodCard } from '../components/DepositMethodCard';
import {
  Wallet as WalletIcon,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  History,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = settings.site_currency_symbol || '$';
  const currentBalance = user?.balanceUsd || '0.00';
  const totalSpent = user?.totalSpentUsd || '0.00';

  useEffect(() => {
    let mounted = true;
    depositsApi
      .getMethods()
      .then((res) => {
        if (mounted) {
          if (res.success && res.data) {
            setMethods(res.data);
          } else {
            setError(res.error?.message || 'فشل تحميل طرق الدفع');
          }
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'خطأ في الاتصال');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <WalletIcon className="w-7 h-7 text-primary" />
            <span>محفظتي وإدارة الرصيد</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            تابع إحصائيات رصيدك، اشحن محفظتك فورياً، واستعرض سجل العمليات والدفعات
          </p>
        </div>

        <Link
          href="/wallet/deposits"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs transition-colors border border-border shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-primary" />
          <span>سجل الإيداعات والدفعات ←</span>
        </Link>
      </div>

      {/* 4 Stats Cards (Image #10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Balance (Green) */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>رصيدك الحالي</span>
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight" dir="ltr">
            {formatCurrency(currentBalance, currencySymbol)}
          </div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
            جاهز للاستخدام الفوري
          </span>
        </div>

        {/* 2. Total Purchases (Red) */}
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-950 dark:text-red-100 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
            <span>إجمالي المشتريات</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight" dir="ltr">
            {formatCurrency(totalSpent, currencySymbol)}
          </div>
          <span className="text-[11px] text-red-600/80 dark:text-red-400/80">
            مجموع الطلبات المكتملة
          </span>
        </div>

        {/* 3. Incoming Deposits (Purple) */}
        <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-950 dark:text-purple-100 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>إجمالي الوارد</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight" dir="ltr">
            {formatCurrency('0.00', currencySymbol)}
          </div>
          <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80">
            شحن المحفظة
          </span>
        </div>

        {/* 4. Withdrawals (Blue) */}
        <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-100 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>سحب يدوي</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight" dir="ltr">
            {formatCurrency('0.00', currencySymbol)}
          </div>
          <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
            طلبات السحب
          </span>
        </div>
      </div>

      {/* Methods Section (Image #9) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>طرق الدفع والشحن المتوفرة</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              اختر وسيلة الدفع المناسبة لشحن محفظتك فورياً أو يدوياً
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground">
              جاري تحميل طرق الدفع...
            </span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : methods.length === 0 ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center text-xs text-muted-foreground">
            لا توجد طرق دفع متاحة حالياً
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {methods.map((m) => (
              <DepositMethodCard
                key={m.id}
                method={m}
                onClick={() => setLocation(`/wallet/deposit/${m.code}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
