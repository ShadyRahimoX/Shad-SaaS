import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import { depositsApi, type Deposit } from '../lib/deposits';
import { useSettings } from '../lib/settings';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  ArrowRight,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  Loader2,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';

export const Deposits: React.FC = () => {
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Client-side date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDeposits = async (targetPage: number, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await depositsApi.list({
        page: targetPage,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        const data = res.data;
        if (append) {
          setDeposits((prev) => [...prev, ...data.deposits]);
        } else {
          setDeposits(data.deposits);
        }
        setHasMore(targetPage * 15 < data.total);
      } else {
        setError(res.error?.message || 'فشل جلب سجل الإيداعات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDeposits(1, false);
  }, [statusFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeposits(nextPage, true);
  };

  // Filter by date client-side
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      if (!dateFrom && !dateTo) return true;
      const dTime = new Date(d.createdAt).getTime();
      if (dateFrom && dTime < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (dTime > toEnd.getTime()) return false;
      }
      return true;
    });
  }, [deposits, dateFrom, dateTo]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'مقبول ومعتمد',
          color: 'bg-emerald-500',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'pending':
        return {
          label: 'قيد المراجعة والتدقيق',
          color: 'bg-amber-500',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'rejected':
        return {
          label: 'مرفوض',
          color: 'bg-red-500',
          badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          icon: <XCircle className="w-3.5 h-3.5" />,
        };
      case 'expired':
        return {
          label: 'منتهي الصلاحية',
          color: 'bg-muted-foreground',
          badgeClass: 'bg-muted text-muted-foreground border-border',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: status,
          color: 'bg-muted-foreground',
          badgeClass: 'bg-muted text-muted-foreground border-border',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>المحفظة</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <History className="w-7 h-7 text-primary" />
            <span>دفعاتي وسجل الإيداعات</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            استعرض جميع طلبات الشحن والفواتير السابقة وحالات اعتمادها
          </p>
        </div>

        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>شحن رصيد جديد</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
            <Filter className="w-4 h-4 text-primary" />
            <span>الحالة:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-muted/50 border border-border text-foreground font-bold focus:outline-hidden"
          >
            <option value="all">الكل</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبول ومعتمد</option>
            <option value="rejected">مرفوض</option>
            <option value="expired">منتهي الصلاحية</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-bold">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium text-xs focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-bold">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium text-xs focus:outline-hidden"
            />
          </div>

          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-2.5 py-1 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-bold text-[11px]"
            >
              مسح التاريخ
            </button>
          )}
        </div>
      </div>

      {/* Deposits List (Image #11) */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل سجل الدفعات...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3">
          <History className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد عمليات إيداع مسجلة</h3>
          <p className="text-xs text-muted-foreground">
            لم تقم بأي عمليات شحن مطابقة للخيارات المحددة بعد.
          </p>
          <Link
            href="/wallet"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            شحن المحفظة الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeposits.map((item) => {
            const statusCfg = getStatusConfig(item.status);

            return (
              <div
                key={item.id}
                className="relative rounded-3xl bg-card border border-border shadow-xs overflow-hidden transition-all hover:border-primary/40"
              >
                {/* Colored Top Header Bar (Image #11) */}
                <div className={`h-1.5 w-full ${statusCfg.color}`} />

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Side: Method Name + Date + Status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-base text-foreground">
                        {item.method}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        #{item.displayId}
                      </span>
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.icon}
                        <span>{statusCfg.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>{formatDate(item.createdAt)}</span>
                      {item.transactionRef && (
                        <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded-md" dir="ltr">
                          Ref: {item.transactionRef}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Amount + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border/60 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted-foreground block">القيمة المدفوعة:</span>
                      <span className="text-lg font-black text-primary tracking-tight" dir="ltr">
                        {item.amount} {item.currency}
                      </span>
                    </div>

                    {item.status === 'pending' && (
                      <Link
                        href={`/wallet/deposit/invoice/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                      >
                        <span>متابعة / التحقق</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs transition-colors border border-border shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? 'جاري تحميل المزيد...' : 'تحميل المزيد من العمليات ↓'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Deposits;
