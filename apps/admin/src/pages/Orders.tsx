import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  adminOrdersApi,
  type AdminOrder,
  type OrdersStats,
} from '../lib/orders';
import { StatusBadge } from '../components/StatusBadge';
import { OrdersFilters } from '../components/OrdersFilters';
import {
  ShoppingCart,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Package,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (targetPage: number, targetStatus: string, targetSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminOrdersApi.list({
          page: targetPage,
          limit,
          status: targetStatus,
          search: targetSearch || undefined,
        }),
        adminOrdersApi.getStats(),
      ]);

      if (listRes.success && listRes.data) {
        setOrders(listRes.data.orders);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب قائمة الطلبات');
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
    fetchOrders(page, status, appliedSearch);
  }, [page, status, appliedSearch]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatUsd = (val: string | number) => {
    const num = Number(val) || 0;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-primary" />
            <span>إدارة الطلبات</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            متابعة وإدارة طلبات العملاء وحالات التنفيذ عبر المزودين
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs">
          <span>إجمالي الطلبات:</span>
          <span className="font-mono text-foreground font-black">{total}</span>
        </div>
      </div>

      {/* Filters (Tabs + Search) */}
      <OrdersFilters
        status={status}
        onStatusChange={handleStatusChange}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        stats={stats}
      />

      {/* Orders List Container */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل سجل الطلبات...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد طلبات مطابقة</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي طلبات تطابق الفلتر أو البحث المحدد.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              data-order-row
              className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Details (ID + Badges + Info) */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-black text-sm text-foreground bg-muted px-2.5 py-1 rounded-xl">
                    #{order.displayId || order.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(order.createdAt)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-bold text-foreground truncate">@{order.username}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">{order.productName}</span>
                    <span className="text-[11px] font-bold">(×{order.qty})</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-muted-foreground">المعرف:</span>
                    <span className="font-bold text-foreground truncate">{order.playerId}</span>
                  </div>
                </div>
              </div>

              {/* Right Financials & Action */}
              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-border/60 pt-3 lg:pt-0">
                <div className="text-right">
                  <div className="text-base font-black text-foreground font-mono" dir="ltr">
                    {formatUsd(order.priceUsd)}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono" dir="ltr">
                    +{formatUsd(order.profitUsd)} ربح
                  </div>
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 rounded-2xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> إلى{' '}
              <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> من{' '}
              <span className="font-bold text-foreground">{total}</span> طلب
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
    </div>
  );
};

export default Orders;
