import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  adminDebtsApi,
  type DebtUser,
  type DebtsStats,
  type DebtStatusFilter,
  type DebtSortBy,
} from '../lib/debts';
import { DebtAdjustModal } from '../components/DebtAdjustModal';
import { DebtHistoryModal } from '../components/DebtHistoryModal';
import {
  Wallet,
  Users,
  DollarSign,
  CheckCircle2,
  BarChart3,
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  History,
  User,
  Ban,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const Debts: React.FC = () => {
  const [users, setUsers] = useState<DebtUser[]>([]);
  const [stats, setStats] = useState<DebtsStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<DebtStatusFilter>('all');
  const [sortBy, setSortBy] = useState<DebtSortBy>('debt-desc');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DebtUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtsData = async (
    targetPage: number,
    targetStatus: DebtStatusFilter,
    targetSort: DebtSortBy,
    targetSearch: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminDebtsApi.list({
          page: targetPage,
          limit,
          status: targetStatus,
          sortBy: targetSort,
          search: targetSearch || undefined,
        }),
        adminDebtsApi.getStats(),
      ]);

      if (listRes.success && listRes.data) {
        setUsers(listRes.data.users);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب قائمة الأرصدة المدينة');
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtsData(page, statusFilter, sortBy, appliedSearch);
  }, [page, statusFilter, sortBy, appliedSearch]);

  const handleStatusChange = (nextStatus: DebtStatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleSortChange = (nextSort: DebtSortBy) => {
    setSortBy(nextSort);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleOpenAdjust = (u: DebtUser) => {
    setSelectedUser(u);
    setAdjustModalOpen(true);
  };

  const handleOpenHistory = (u: DebtUser) => {
    setSelectedUser(u);
    setHistoryModalOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-primary" />
            <span>الرصيد المدين</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            متابعة الحسابات المدينة، سقوف الائتمان الممنوحة، وتسجيل عمليات الزيادة والتسديد
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-2xl shadow-xs shrink-0">
          <span>إجمالي الدين:</span>
          <span className="font-mono font-black text-sm" dir="ltr">
            ${Number(stats?.totalDebtUsd || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 2. Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: مستخدمون عليهم دين */}
        <div
          data-debt-stats-card="users-with-debt"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">
              مستخدمون عليهم دين
            </span>
            <div className="text-2xl font-black text-foreground font-mono">
              {stats?.totalUsersWithDebt ?? 0}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: إجمالي الدين */}
        <div
          data-debt-stats-card="total-debt"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">إجمالي الدين</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono" dir="ltr">
              ${Number(stats?.totalDebtUsd || 0).toFixed(2)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: credit مُفعَّل */}
        <div
          data-debt-stats-card="credit-enabled"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">credit مُفعَّل</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats?.creditEnabledUsers ?? 0}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: السقف المتاح */}
        <div
          data-debt-stats-card="available-credit"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">السقف المتاح</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
              ${Number(stats?.availableCreditUsd || 0).toFixed(2)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Status Chips (4) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          data-debt-chip="all"
          onClick={() => handleStatusChange('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>الكل</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === 'all'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {stats.totalUsersWithDebt + stats.creditEnabledUsers > 0 ? total : stats.totalUsersWithDebt}
            </span>
          )}
        </button>

        <button
          type="button"
          data-debt-chip="with-debt"
          onClick={() => handleStatusChange('with-debt')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            statusFilter === 'with-debt'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>عليه دين</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === 'with-debt'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.totalUsersWithDebt}
            </span>
          )}
        </button>

        <button
          type="button"
          data-debt-chip="credit-enabled"
          onClick={() => handleStatusChange('credit-enabled')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            statusFilter === 'credit-enabled'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>credit مُفعَّل</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === 'credit-enabled'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.creditEnabledUsers}
            </span>
          )}
        </button>

        <button
          type="button"
          data-debt-chip="over-limit"
          onClick={() => handleStatusChange('over-limit')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            statusFilter === 'over-limit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>تجاوز الحد</span>
        </button>
      </div>

      {/* 4. Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المستخدم، البريد الإلكتروني، أو الهاتف..."
              className="w-full h-11 pr-10 pl-4 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            بحث
          </button>
        </form>

        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as DebtSortBy)}
          className="h-11 px-4 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
        >
          <option value="debt-desc">الأعلى ديناً</option>
          <option value="newest">الأحدث</option>
          <option value="credit-desc">الأعلى credit</option>
        </select>
      </div>

      {/* 5. Users List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">
            جاري تحميل بيانات الرصيد المدين...
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
            لا توجد حسابات مطابقة للفلتر المحدد
          </h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي مستخدمين ضمن هذا التصنيف أو البحث.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const debtNum = Number(u.debtUsd) || 0;
            const limitNum = Number(u.creditLimit) || 0;
            const availNum = Number(u.availableCreditUsd) || 0;
            const ratioPct = Math.min(100, Math.round((u.debtRatio || 0) * 100));
            const isOverLimit = limitNum > 0 && debtNum > limitNum;

            const barColor =
              ratioPct > 80
                ? 'bg-rose-500'
                : ratioPct >= 50
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={u.id}
                data-debt-row
                className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: User Identity & Badges */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-base shrink-0 overflow-hidden">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{(u.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground truncate" dir="ltr">
                        @{u.username}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                        #{u.displayId}
                      </span>

                      {/* Badges */}
                      {u.creditEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>credit مُفعَّل</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                          <span>غير مُفعَّل</span>
                        </span>
                      )}

                      {isOverLimit && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>تجاوز الحد</span>
                        </span>
                      )}

                      {u.banned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                          <Ban className="w-3 h-3" />
                          <span>محظور</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground truncate" dir="ltr">
                      {u.email}
                    </div>

                    {/* Progress bar */}
                    {limitNum > 0 && (
                      <div className="max-w-xs space-y-1 pt-1">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all ${barColor}`}
                            style={{ width: `${ratioPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>نسبة استهلاك السقف</span>
                          <span>{Math.round((u.debtRatio || 0) * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Debt Figures */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 px-4 py-2.5 rounded-2xl bg-muted/30 border border-border/60 text-center shrink-0">
                  <div>
                    <div className="text-[10px] text-muted-foreground">الرصيد الحالي</div>
                    <div
                      className={`font-mono font-black text-sm mt-0.5 ${
                        debtNum > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                      }`}
                      dir="ltr"
                    >
                      ${debtNum.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground">سقف الدين</div>
                    <div className="font-mono font-black text-sm text-foreground mt-0.5" dir="ltr">
                      ${limitNum.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground">المتبقي</div>
                    <div
                      className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5"
                      dir="ltr"
                    >
                      ${availNum.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 border-border/50 pt-3 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenAdjust(u)}
                    className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>تعديل الدين</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenHistory(u)}
                    className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>عرض السجل</span>
                  </button>

                  <Link
                    href={`/users/${u.id}`}
                    className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="عرض المستخدم"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">عرض المستخدم</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> إلى{' '}
              <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> من{' '}
              <span className="font-bold text-foreground">{total}</span> مستخدم
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-bold">
                {page} / {totalPages}
              </span>

              <button
                type="button"
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

      {/* Modals */}
      <DebtAdjustModal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          fetchDebtsData(page, statusFilter, sortBy, appliedSearch);
        }}
      />

      <DebtHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default Debts;
