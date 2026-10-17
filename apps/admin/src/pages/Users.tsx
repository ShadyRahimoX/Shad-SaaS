import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  adminUsersApi,
  type AdminUser,
  type UsersStats,
  type UserStatusFilter,
  type UserHasBalanceFilter,
  type UserSortBy,
} from '../lib/users';
import { UserAvatar } from '../components/UserAvatar';
import {
  Users as UsersIcon,
  CheckCircle2,
  Ban,
  DollarSign,
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  ShoppingCart,
  Wallet,
  User as UserIcon,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Gift,
  Share2,
  TrendingUp,
} from 'lucide-react';

function resolveVipLevelNumber(vipName: string, vipColor: string): number {
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

const VIP_CHIPS_META: Array<{ level: string; label: string; style: string }> = [
  {
    level: '0',
    label: 'VIP 0',
    style: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20',
  },
  {
    level: '1',
    label: 'VIP 1',
    style: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  {
    level: '2',
    label: 'VIP 2',
    style: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30',
  },
  {
    level: '3',
    label: 'VIP 3',
    style: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [hasBalanceFilter, setHasBalanceFilter] = useState<UserHasBalanceFilter>('all');
  const [sortBy, setSortBy] = useState<UserSortBy>('newest');

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [detailNotice, setDetailNotice] = useState<string | null>(null);
  const latestReqRef = useRef(0);

  const fetchUsersData = async (
    targetPage: number,
    targetSearch: string,
    targetStatus: UserStatusFilter,
    targetHasBalance: UserHasBalanceFilter,
    targetSort: UserSortBy
  ) => {
    const reqId = ++latestReqRef.current;
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminUsersApi.list({
          page: targetPage,
          limit,
          search: targetSearch.trim() || undefined,
          status: targetStatus,
          hasBalance: targetHasBalance,
          sortBy: targetSort,
        }),
        adminUsersApi.getStats(),
      ]);

      if (reqId !== latestReqRef.current) return;

      if (listRes.success && listRes.data) {
        setUsers(listRes.data.users);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب قائمة المستخدمين');
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      if (reqId !== latestReqRef.current) return;
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      if (reqId === latestReqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsersData(page, search, statusFilter, hasBalanceFilter, sortBy);
  }, [page, search, statusFilter, hasBalanceFilter, sortBy]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsersData(1, search, statusFilter, hasBalanceFilter, sortBy);
  };

  const handleStatusChange = (val: UserStatusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleHasBalanceChange = (val: UserHasBalanceFilter) => {
    setHasBalanceFilter(val);
    setPage(1);
  };

  const handleSortChange = (val: UserSortBy) => {
    setSortBy(val);
    setPage(1);
  };

  const handleToggleBan = async (user: AdminUser) => {
    setTogglingId(user.id);
    setError(null);
    try {
      const res = await adminUsersApi.update(user.id, { banned: !user.banned });
      if (res.success) {
        await fetchUsersData(page, search, statusFilter, hasBalanceFilter, sortBy);
      } else {
        setError(res.error?.message || 'فشل تحديث حالة الحظر للمستخدم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث حالة الحظر');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'لا يوجد';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalCount = stats?.total ?? 0;
  const bannedCount = stats?.banned ?? 0;
  const activeCount = Math.max(0, totalCount - bannedCount);
  const totalBalanceNum = Number(stats?.totalBalance || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <UsersIcon className="w-7 h-7 text-primary" />
            <span>إدارة المستخدمين</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            عرض وإدارة حسابات المستخدمين، الأرصدة، مستويات VIP، وحالات الحظر
          </p>
        </div>

        <div
          data-users-total-badge
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black shrink-0"
        >
          <span>إجمالي: {totalCount}</span>
        </div>
      </div>

      {/* 2. Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: إجمالي المستخدمين */}
        <div
          data-user-stats-card="total"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">
              إجمالي المستخدمين
            </span>
            <div className="text-2xl font-black text-foreground font-mono">{totalCount}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: نشط */}
        <div
          data-user-stats-card="active"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">نشط</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {activeCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: محظور */}
        <div
          data-user-stats-card="banned"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">محظور</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {bannedCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: إجمالي الأرصدة */}
        <div
          data-user-stats-card="total-balance"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">إجمالي الأرصدة</span>
            <div
              className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono"
              dir="ltr"
            >
              ${totalBalanceNum.toFixed(2)}
            </div>
            {stats && (
              <span className="text-[10px] text-muted-foreground font-bold block">
                لديه رصيد: {stats.withBalance}
              </span>
            )}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. VIP Distribution mini-bar */}
      <div
        data-vip-distribution-bar
        className="flex items-center gap-2 flex-wrap p-3.5 rounded-2xl bg-card border border-border shadow-xs"
      >
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 ml-2">
          <Award className="w-4 h-4 text-primary" />
          <span>توزيع مستويات VIP:</span>
        </span>
        {VIP_CHIPS_META.map((chip) => {
          const count = stats?.vipDistribution?.[chip.level] ?? 0;
          return (
            <span
              key={chip.level}
              data-vip-chip={chip.level}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${chip.style}`}
            >
              <span>{chip.label}</span>
              <span className="font-mono font-black">({count})</span>
            </span>
          );
        })}
      </div>

      {/* 4. Filters Row */}
      <div
        data-users-filters
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card p-4 rounded-3xl border border-border shadow-xs"
      >
        <form onSubmit={handleSearchSubmit} className="sm:col-span-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              data-users-search
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو المعرف..."
              className="w-full h-11 pr-10 pl-4 rounded-2xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            بحث
          </button>
        </form>

        {/* Status Dropdown */}
        <select
          data-users-status
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as UserStatusFilter)}
          className="h-11 px-3.5 rounded-2xl bg-background border border-border text-foreground text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">الحالة: الكل</option>
          <option value="active">نشط</option>
          <option value="banned">محظور</option>
        </select>

        {/* HasBalance Dropdown */}
        <select
          data-users-has-balance
          value={hasBalanceFilter}
          onChange={(e) => handleHasBalanceChange(e.target.value as UserHasBalanceFilter)}
          className="h-11 px-3.5 rounded-2xl bg-background border border-border text-foreground text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">الرصيد: الكل</option>
          <option value="true">لديه رصيد</option>
          <option value="false">بلا رصيد</option>
        </select>

        {/* Sort Dropdown */}
        <select
          data-users-sort
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as UserSortBy)}
          className="h-11 px-3.5 rounded-2xl bg-background border border-border text-foreground text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        >
          <option value="newest">الترتيب: الأحدث</option>
          <option value="balance-desc">الأعلى رصيداً</option>
          <option value="spent-desc">الأكثر صرفاً</option>
          <option value="name">بالاسم</option>
        </select>
      </div>

      {/* Notice for Details placeholder */}
      {detailNotice && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-between">
          <span>{detailNotice}</span>
          <button
            type="button"
            onClick={() => setDetailNotice(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 5. Users List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">
            جاري تحميل قائمة المستخدمين...
          </span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">
            لا يوجد مستخدمون مطابقون للبحث أو الفلتر
          </h3>
          <p className="text-xs text-muted-foreground">
            جرب تغيير شروط الفلترة أو البحث بكلمات أخرى.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const vipLevel = resolveVipLevelNumber(u.vipName, u.vipColor);
            const vipBadgeClass = getVipBadgeStyle(vipLevel);
            const balanceNum = Number(u.balanceUsd || 0);
            const spentNum = Number(u.totalSpentUsd || 0);
            const cashbackNum = Number(u.cashbackBalanceUsd || 0);
            const referralNum = Number(u.referralBalanceUsd || 0);

            return (
              <div
                key={u.id}
                data-user-row
                data-user-id={u.id}
                className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4"
              >
                {/* Left: User Avatar & Identity */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <UserAvatar
                    user={{
                      username: u.username,
                      firstName: u.firstName,
                      avatarUrl: u.avatarUrl,
                      vipColor: u.vipColor,
                    }}
                    size="md"
                  />

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        data-user-username
                        className="font-extrabold text-sm text-foreground truncate"
                        dir="ltr"
                      >
                        {u.username}
                      </span>

                      <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                        #{u.displayId}
                      </span>

                      {/* VIP Badge */}
                      <span
                        data-user-vip-badge
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${vipBadgeClass}`}
                      >
                        <Award className="w-3 h-3" />
                        <span>
                          VIP {vipLevel} — {u.vipName || 'New'}
                        </span>
                      </span>

                      {/* Banned Badge */}
                      {u.banned && (
                        <span
                          data-user-banned-badge
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        >
                          <Ban className="w-3 h-3" />
                          <span>محظور</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground truncate" dir="ltr">
                      {u.email}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>التسجيل: {formatDate(u.createdAt)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>آخر دخول: {formatDate(u.lastLoginAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Financial & Orders Stats Mini-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 px-4 py-2.5 rounded-2xl bg-muted/30 border border-border/60 text-center shrink-0">
                  <div>
                    <div className="text-[10px] text-muted-foreground">الرصيد</div>
                    <div
                      data-user-balance
                      className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5"
                      dir="ltr"
                    >
                      ${balanceNum.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      <span>الطلبات</span>
                    </div>
                    <div className="font-mono font-black text-sm text-foreground mt-0.5">
                      {u.ordersCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>المصروف</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-foreground mt-1" dir="ltr">
                      ${spentNum.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Gift className="w-3 h-3" />
                      <span>Cashback</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-muted-foreground mt-1" dir="ltr">
                      ${cashbackNum.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Share2 className="w-3 h-3" />
                      <span>Referral</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-muted-foreground mt-1" dir="ltr">
                      ${referralNum.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t xl:border-t-0 border-border/50 pt-3 xl:pt-0">
                  <button
                    type="button"
                    data-user-details-btn
                    onClick={() =>
                      setDetailNotice(
                        `صفحة تفاصيل المستخدم (@${u.username} — #${u.displayId}) مخصصة للمرحلة I-d-3-b.`
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>التفاصيل</span>
                  </button>

                  <button
                    type="button"
                    data-user-ban-btn
                    disabled={togglingId === u.id}
                    onClick={() => handleToggleBan(u)}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      u.banned
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                  >
                    {togglingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : u.banned ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    <span>{u.banned ? 'رفع الحظر' : 'حظر'}</span>
                  </button>

                  <Link
                    href={`/debts?user=${u.id}`}
                    data-user-wallet-link
                    className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>المحفظة</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* 6. Pagination */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> إلى{' '}
              <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> من{' '}
              <span className="font-bold text-foreground">{total}</span> مستخدم
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-users-prev-page
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <span
                data-users-page-indicator
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-bold"
              >
                {page} / {totalPages}
              </span>

              <button
                type="button"
                data-users-next-page
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>التالي</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
