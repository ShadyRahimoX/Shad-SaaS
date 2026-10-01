import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { request } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useSettings } from '../lib/settings';
import { useAuth } from '../lib/auth';
import {
  ShoppingBag,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';

interface OrderItem {
  id: string;
  displayId: number;
  orderUuid: string;
  productId: string;
  qty: number;
  playerId: string;
  extraFields: Record<string, any>;
  priceUsd: string;
  status: 'pending' | 'waiting' | 'accept' | 'reject' | 'cancelled';
  createdAt: string;
}

interface OrdersResponse {
  orders: OrderItem[];
  total: number;
  page: number;
  limit: number;
}

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState<'all' | 'accept' | 'waiting' | 'reject'>('all');

  const fetchOrders = async (pageNum = 1) => {
    setLoading(true);
    try {
      const statusParam = activeTab === 'all' ? '' : `&status=${activeTab}`;
      const res = await request<OrdersResponse>(`/api/orders?page=${pageNum}&limit=${limit}${statusParam}`);
      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setPage(pageNum);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders(1);
    } else {
      setLoading(false);
    }
  }, [user, activeTab]);

  const handleDateFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  // Status mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accept':
        return {
          label: 'مقبول',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          bar: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'waiting':
      case 'pending':
        return {
          label: 'قيد الانتظار',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          bar: 'bg-amber-500',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'reject':
      case 'cancelled':
        return {
          label: 'مرفوض',
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          bar: 'bg-red-500',
          icon: <XCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-muted text-muted-foreground border-border',
          bar: 'bg-primary',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
    }
  };

  // Calculate total sum of loaded orders
  const ordersTotalSum = orders.reduce((sum, o) => sum + (parseFloat(o.priceUsd) || 0), 0);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">تسجيل الدخول مطلوب</h2>
        <p className="text-xs text-muted-foreground">
          يرجى تسجيل الدخول إلى حسابك لعرض قائمة طلباتك ومتابعة حالاتها.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">طلباتي</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              متابعة جميع عمليات الشراء وتفاصيل التفعيل
            </p>
          </div>
        </div>

        {/* Total sum badge */}
        <div className="px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
          <span>إجمالي الطلبات المعروضة:</span>
          <span className="text-sm font-black" dir="ltr">
            {formatCurrency(ordersTotalSum, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Date Filters Form (Image #8) */}
      <form
        onSubmit={handleDateFilterSubmit}
        className="p-4 rounded-2xl bg-card border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
      >
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>من تاريخ:</span>
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>إلى تاريخ:</span>
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>تطبيق الفلترة</span>
        </button>
      </form>

      {/* Status Tabs (Image #8) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'accept', label: 'مقبول' },
          { id: 'waiting', label: 'قيد الانتظار' },
          { id: 'reject', label: 'مرفوض' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List / Empty State */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">جاري تحميل الطلبات...</span>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group block relative overflow-hidden rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer p-4 sm:p-5"
              >
                {/* Colored Status Top Bar (Image #8) */}
                <div className={`absolute top-0 right-0 left-0 h-1.5 ${badge.bar}`} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  {/* Right: DisplayId + Date + PlayerId */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Package className="w-6 h-6 text-primary" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          طلب #{order.displayId}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>معرف الحساب: {order.playerId}</span>
                        <span>•</span>
                        <span>الكمية: {order.qty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Left: Price + Arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-muted-foreground">قيمة الطلب:</span>
                      <span className="font-black text-base text-primary tracking-tight" dir="ltr">
                        {formatCurrency(order.priceUsd, currencySymbol)}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Simple Pagination */}
          {total > limit && (
            <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => fetchOrders(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span>
                صفحة {page} من {Math.ceil(total / limit)}
              </span>
              <button
                type="button"
                onClick={() => fetchOrders(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-border bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6 stroke-1" />
          </div>
          <h3 className="font-bold text-base text-foreground">لا يوجد طلبات ضمن النطاق الزمني الحالي</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي طلبات تطابق الفلاتر المحددة.
          </p>
        </div>
      )}
    </div>
  );
};

export default Orders;
