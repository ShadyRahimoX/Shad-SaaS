import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import {
  adminUsersApi,
  type AdminUser,
  type UserTransaction,
} from '../lib/users';
import { adminDebtsApi, type DebtDetailResponse } from '../lib/debts';
import { UserAvatar } from '../components/UserAvatar';
import { UserEditModal } from '../components/UserEditModal';
import { BalanceAdjustModal } from '../components/BalanceAdjustModal';
import {
  ArrowRight,
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Gift,
  Edit3,
  Wallet,
  User as UserIcon,
  History,
  Loader2,
  AlertCircle,
  Calendar,
  HelpCircle,
} from 'lucide-react';

type ActiveTab = 'profile' | 'credit' | 'transactions';

function resolveVipLevelNumber(vipName?: string, vipColor?: string): number {
  const lower = (vipName || '').toLowerCase();
  const color = (vipColor || '').toUpperCase();
  if (lower.includes('gold') || lower.includes('ذهب') || lower.includes('3') || color === '#FFD700') {
    return 3;
  }
  if (lower.includes('silver') || lower.includes('فض') || lower.includes('2') || color === '#C0C0C0') {
    return 2;
  }
  if (lower.includes('bronze') || lower.includes('برونز') || lower.includes('1') || color === '#CD7F32') {
    return 1;
  }
  return 0;
}

function getVipBadgeStyle(level: number): string {
  switch (level) {
    case 3:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 2:
      return 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30';
    case 1:
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  }
}

export const UserDetail: React.FC = () => {
  const [, params] = useRoute('/users/:id');
  const userIdParam = params?.id || '';

  const [user, setUser] = useState<AdminUser | null>(null);
  const [debtDetail, setDebtDetail] = useState<DebtDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Transactions state
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const txLimit = 20;
  const [txLoading, setTxLoading] = useState(false);
  const [txLoadingMore, setTxLoadingMore] = useState(false);

  // Page states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [banLoading, setBanLoading] = useState(false);

  const fetchUserAndDebt = async () => {
    if (!userIdParam) return;
    setLoading(true);
    setError(null);
    try {
      const [userRes, debtRes] = await Promise.all([
        adminUsersApi.get(userIdParam),
        adminDebtsApi.get(userIdParam),
      ]);

      if (!userRes.success || !userRes.data) {
        setError(userRes.error?.message || 'المستخدم غير موجود');
        setLoading(false);
        return;
      }

      const debtUser = debtRes.success && debtRes.data ? debtRes.data.user : null;
      const mergedUser: AdminUser = {
        ...userRes.data,
        creditEnabled: debtUser ? Boolean(debtUser.creditEnabled) : false,
        creditLimit: debtUser ? String(debtUser.creditLimit ?? '0') : '0',
        debtUsd: debtUser ? String(debtUser.debtUsd ?? '0') : '0',
        availableCreditUsd: debtUser ? String(debtUser.availableCreditUsd ?? '0') : '0',
      };

      setUser(mergedUser);
      if (debtRes.success && debtRes.data) {
        setDebtDetail(debtRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (targetPage: number, append: boolean) => {
    if (!userIdParam) return;
    if (append) {
      setTxLoadingMore(true);
    } else {
      setTxLoading(true);
    }
    try {
      const res = await adminUsersApi.getTransactions(userIdParam, {
        page: targetPage,
        limit: txLimit,
      });
      if (res.success && res.data) {
        if (append) {
          setTransactions((prev) => [...prev, ...res.data!.transactions]);
        } else {
          setTransactions(res.data.transactions);
        }
        setTxTotal(res.data.total);
      }
    } finally {
      setTxLoading(false);
      setTxLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUserAndDebt();
    setTxPage(1);
    fetchTransactions(1, false);
  }, [userIdParam]);

  const handleToggleBan = async () => {
    if (!user) return;
    setBanLoading(true);
    setError(null);
    try {
      const res = await adminUsersApi.update(user.id, { banned: !user.banned });
      if (res.success) {
        await fetchUserAndDebt();
      } else {
        setError(res.error?.message || 'فشل تحديث حالة الحظر');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث حالة الحظر');
    } finally {
      setBanLoading(false);
    }
  };

  const handleLoadMoreTx = () => {
    const nextPage = txPage + 1;
    setTxPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div
        data-user-detail-page
        className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3"
        dir="rtl"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground">
          جاري تحميل ملف المستخدم...
        </span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div data-user-detail-page className="space-y-4" dir="rtl">
        <Link
          href="/users"
          data-user-back-link
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة المستخدمين</span>
        </Link>
        <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'المستخدم غير موجود'}</span>
        </div>
      </div>
    );
  }

  const vipLevel = resolveVipLevelNumber(user.vipName, user.vipColor);
  const vipBadgeClass = getVipBadgeStyle(vipLevel);

  const balanceNum = Number(user.balanceUsd || 0);
  const spentNum = Number(user.totalSpentUsd || 0);
  const cashbackNum = Number(user.cashbackBalanceUsd || 0);
  const creditLimitNum = Number(user.creditLimit || 0);
  const debtNum = Number(user.debtUsd || 0);
  const availableCreditNum = Number(user.availableCreditUsd || 0);

  const profileRows: Array<{ key: string; label: string; value: React.ReactNode }> = [
    { key: 'username', label: 'اسم المستخدم (username)', value: `@${user.username}` },
    { key: 'displayId', label: 'المعرف الرقمي (displayId)', value: `#${user.displayId}` },
    { key: 'firstName', label: 'الاسم الأول (firstName)', value: user.firstName || '—' },
    { key: 'lastName', label: 'الاسم الأخير (lastName)', value: user.lastName || '—' },
    { key: 'phone', label: 'رقم الهاتف (phone)', value: user.phone || '—' },
    { key: 'country', label: 'الدولة (country)', value: user.country || '—' },
    { key: 'email', label: 'البريد الإلكتروني (email)', value: user.email },
    {
      key: 'emailVerified',
      label: 'توثيق البريد (emailVerified)',
      value: user.emailVerified ? 'موثق (نعم)' : 'غير موثق (لا)',
    },
    { key: 'googleId', label: 'معرف Google (googleId)', value: user.googleId || '—' },
    { key: 'referredBy', label: 'أُحيل بواسطة (referredBy)', value: user.referredBy || '—' },
    { key: 'referralCode', label: 'كود الإحالة (referralCode)', value: user.referralCode || '—' },
    { key: 'createdAt', label: 'تاريخ التسجيل (createdAt)', value: formatDate(user.createdAt) },
    { key: 'lastLoginAt', label: 'آخر دخول (lastLoginAt)', value: formatDate(user.lastLoginAt) },
  ];

  return (
    <div data-user-detail-page className="space-y-6" dir="rtl">
      {/* 1. Breadcrumb */}
      <div>
        <Link
          href="/users"
          data-user-back-link
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة المستخدمين</span>
        </Link>
      </div>

      {/* 2. Header Card */}
      <div
        data-user-header-card
        className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
      >
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar
            user={{
              username: user.username,
              firstName: user.firstName,
              avatarUrl: user.avatarUrl,
              vipColor: user.vipColor,
            }}
            size="lg"
          />

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                data-detail-username
                className="text-xl font-black text-foreground truncate"
                dir="ltr"
              >
                {user.username}
              </h1>

              <span
                data-detail-display-id
                className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg"
              >
                #{user.displayId}
              </span>

              <span
                data-detail-vip-badge
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${vipBadgeClass}`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  VIP {vipLevel} — {user.vipName || 'New'}
                </span>
              </span>

              {user.banned && (
                <span
                  data-user-banned-badge
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>محظور</span>
                </span>
              )}
            </div>

            <div data-detail-email className="text-xs text-muted-foreground font-mono" dir="ltr">
              {user.email}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            data-user-edit-btn
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>تعديل</span>
          </button>

          <button
            type="button"
            data-user-balance-soon-btn
            onClick={() => setBalanceModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>تعديل الرصيد</span>
          </button>

          <button
            type="button"
            data-user-ban-btn
            disabled={banLoading}
            onClick={handleToggleBan}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              user.banned
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            {banLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : user.banned ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            <span>{user.banned ? 'رفع الحظر' : 'حظر'}</span>
          </button>
        </div>
      </div>

      {/* 3. Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          data-detail-stat="balance"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">الرصيد</span>
            <div
              className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono"
              dir="ltr"
            >
              ${balanceNum.toFixed(2)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div
          data-detail-stat="orders"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">الطلبات</span>
            <div className="text-2xl font-black text-foreground font-mono">{user.ordersCount}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div
          data-detail-stat="spent"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">المصروف</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
              ${spentNum.toFixed(2)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div
          data-detail-stat="cashback"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">Cashback</span>
            <div
              className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono"
              dir="ltr"
            >
              ${cashbackNum.toFixed(2)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Tabs (3) */}
      <div data-user-tabs className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
          <button
            type="button"
            data-user-tab="profile"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>الملف الشخصي</span>
          </button>

          <button
            type="button"
            data-user-tab="credit"
            onClick={() => setActiveTab('credit')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>الرصيد والائتمان</span>
          </button>

          <button
            type="button"
            data-user-tab="transactions"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <History className="w-4 h-4" />
            <span>المعاملات المالية ({txTotal})</span>
          </button>
        </div>

        {/* Tab 1: الملف الشخصي */}
        {activeTab === 'profile' && (
          <div
            data-tab-panel="profile"
            className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground">بيانات الملف الشخصي</h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs text-right">
                <tbody className="divide-y divide-border">
                  {profileRows.map((row) => (
                    <tr
                      key={row.key}
                      data-profile-row={row.key}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <th className="py-3 px-4 font-bold text-muted-foreground bg-muted/20 w-1/3">
                        {row.label}
                      </th>
                      <td className="py-3 px-4 font-bold text-foreground font-mono">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: الرصيد والائتمان */}
        {activeTab === 'credit' && (
          <div
            data-tab-panel="credit"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Credit Card */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-foreground">حالة الائتمان (Credit)</h2>
                  {user.creditEnabled ? (
                    <span
                      data-credit-enabled-badge
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    >
                      credit مُفعَّل
                    </span>
                  ) : (
                    <span
                      data-credit-enabled-badge
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border"
                    >
                      غير مُفعَّل
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  data-edit-credit-btn
                  onClick={() => setEditModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل credit</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                  <div className="text-[11px] text-muted-foreground">سقف الدين</div>
                  <div
                    data-credit-limit
                    className="font-mono font-black text-base text-foreground mt-1"
                    dir="ltr"
                  >
                    ${creditLimitNum.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                  <div className="text-[11px] text-muted-foreground">الدين الحالي</div>
                  <div
                    data-credit-debt
                    className="font-mono font-black text-base text-rose-600 dark:text-rose-400 mt-1"
                    dir="ltr"
                  >
                    ${debtNum.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                  <div className="text-[11px] text-muted-foreground">المتبقي المتاح</div>
                  <div
                    data-credit-available
                    className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 mt-1"
                    dir="ltr"
                  >
                    ${availableCreditNum.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Debt Summary Card */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-sm font-black text-foreground">ملخص حركات الدين</h2>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                    <div className="text-[11px] text-muted-foreground">إجمالي الزيادة</div>
                    <div
                      className="font-mono font-black text-sm text-foreground mt-1"
                      dir="ltr"
                    >
                      ${Number(debtDetail?.summary?.totalIncrease || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                    <div className="text-[11px] text-muted-foreground">إجمالي المسدد</div>
                    <div
                      className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-1"
                      dir="ltr"
                    >
                      ${Number(debtDetail?.summary?.totalPaid || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                    <div className="text-[11px] text-muted-foreground">عدد العمليات</div>
                    <div className="font-mono font-black text-sm text-foreground mt-1">
                      {debtDetail?.summary?.transactionCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  data-credit-balance-btn
                  onClick={() => setBalanceModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>تعديل الرصيد</span>
                </button>

                <Link
                  href={`/debts?user=${user.id}`}
                  className="px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>عرض سجل الدين</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: المعاملات المالية */}
        {activeTab === 'transactions' && (
          <div
            data-tab-panel="transactions"
            className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground">
                سجل المعاملات المالية ({txTotal})
              </h2>
            </div>

            {txLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-bold text-muted-foreground">
                  جاري تحميل المعاملات...
                </span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-bold text-muted-foreground">
                  لا توجد معاملات مالية مسجلة لهذا المستخدم
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map((tx) => {
                  const amt = Number(tx.amountUsd || 0);
                  const isPositive = amt >= 0;

                  return (
                    <div
                      key={tx.id}
                      data-user-tx-row
                      className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono font-black text-sm ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                            dir="ltr"
                          >
                            {amt >= 0 ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border font-mono">
                            {tx.type}
                          </span>

                          {tx.referenceType && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({tx.referenceType})
                            </span>
                          )}

                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(tx.createdAt)}</span>
                          </span>
                        </div>

                        {tx.description && (
                          <div className="text-muted-foreground font-bold">{tx.description}</div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1.5 font-mono text-[11px] bg-muted/60 px-3 py-1.5 rounded-xl shrink-0"
                        dir="ltr"
                      >
                        <span className="text-muted-foreground">
                          ${Number(tx.balanceBefore || 0).toFixed(2)}
                        </span>
                        <ArrowLeft className="w-3 h-3 text-muted-foreground rotate-180" />
                        <span className="font-bold text-foreground">
                          ${Number(tx.balanceAfter || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {transactions.length < txTotal && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      data-tx-load-more
                      disabled={txLoadingMore}
                      onClick={handleLoadMoreTx}
                      className="px-5 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {txLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>تحميل المزيد ({txTotal - transactions.length})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <UserEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={user}
        onSuccess={() => {
          fetchUserAndDebt();
        }}
      />

      {/* Balance Adjust Modal */}
      <BalanceAdjustModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        user={user}
        onSuccess={() => {
          fetchUserAndDebt();
          fetchTransactions(1, false);
          setTxPage(1);
        }}
      />
    </div>
  );
};

export default UserDetail;
