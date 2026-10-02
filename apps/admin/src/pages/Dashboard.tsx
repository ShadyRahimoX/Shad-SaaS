import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  dashboardApi,
  type DashboardStats,
} from '../lib/dashboard';
import {
  ShoppingCart,
  Hourglass,
  Tag,
  Users,
  Wallet,
  TrendingDown,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Scissors,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getMaintenanceMode(),
    ])
      .then(([statsData, maintMode]) => {
        if (!isMounted) return;
        setStats(statsData);
        setMaintenanceMode(maintMode);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل جلب بيانات لوحة التحكم');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleMaintenance = async () => {
    const nextVal = !maintenanceMode;
    setTogglingMaintenance(true);
    try {
      const res = await dashboardApi.setMaintenanceMode(nextVal);
      if (res.success) {
        setMaintenanceMode(nextVal);
        setToastMsg(
          nextVal
            ? 'تم تفعيل وضع الصيانة بنجاح (المتجر متوقف للزوار)'
            : 'تم إلغاء وضع الصيانة بنجاح (المتجر متاح للجميع)'
        );
        setTimeout(() => setToastMsg(null), 4000);
      } else {
        alert(res.error?.message || 'فشل تحديث وضع الصيانة');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تعديل الإعداد');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground">جاري تحميل لوحة التحكم...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">لوحة القيادة الرئيسية</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ملخص الأداء العام، الإحصائيات، ومؤشرات المتجر الرقمي
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>التحديث الأخير:</span>
          <span className="font-mono text-foreground">{new Date().toLocaleTimeString('ar-EG')}</span>
        </div>
      </div>

      {/* 1. Four Quick Stats Cards (Grid 2 cols sm / 4 cols lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: عدد الطلبات */}
        <div
          data-dashboard-stats="orders"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">عدد الطلبات</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">
              {stats?.orders.total !== null ? stats?.orders.total : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">إجمالي الطلبات المنفذة</p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>إدارة الطلبات</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 2: الطلبات قيد الانتظار */}
        <div
          data-dashboard-stats="pending-orders"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">الطلبات قيد الانتظار</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Hourglass className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats?.orders.pending !== null ? stats?.orders.pending : '0'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">بانتظار المعالجة والتأكيد</p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            <span>عرض الطلبات المعلقة</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 3: المنتجات النشطة */}
        <div
          data-dashboard-stats="active-products"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المنتجات النشطة</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">
              {stats?.products.total ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">منتج متوفر ومتاح للشراء</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>إدارة المنتجات</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 4: عدد المستخدمين */}
        <div
          data-dashboard-stats="users-count"
          className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">عدد المستخدمين</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">
              {stats?.users.total !== null ? stats?.users.total : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">الحسابات المسجلة بالمتجر</p>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            <span>إدارة المستخدمين</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 2. Full-Width 6 Metric Cards (Grid 2 cols md / 3 cols lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card A: إجمالي رصيد المستخدمين */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي رصيد المستخدمين</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground" dir="ltr">
            $0.00
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>طلبات شحن معلقة:</span>
            <span className="font-bold text-foreground">0</span>
          </div>
        </div>

        {/* Card B: المستخدمون المدينون */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المستخدمون المدينون</span>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-black text-destructive" dir="ltr">
            $0.00
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>عدد الحسابات المدينة:</span>
            <span className="font-bold text-foreground">0 مستخدم</span>
          </div>
        </div>

        {/* Card C: عدد الطلبات هذا الشهر */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">عدد الطلبات هذا الشهر</span>
            <Calendar className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            0
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>الفترة:</span>
            <span>الشهر الحالي</span>
          </div>
        </div>

        {/* Card D: إجمالي المبيعات */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي المبيعات</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground" dir="ltr">
            $0.0000
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>شامل كافة العمليات:</span>
            <span>USD</span>
          </div>
        </div>

        {/* Card E: التكلفة الكلية */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">التكلفة الكلية</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground" dir="ltr">
            $0.0000
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>تكلفة المزودين:</span>
            <span>USD</span>
          </div>
        </div>

        {/* Card F: الأرباح الصافية */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">الأرباح الصافية</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
            $0.0000
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>صافي الهامش الربحي:</span>
            <span className="text-emerald-600 font-bold">+0.00%</span>
          </div>
        </div>
      </div>

      {/* 3. Maintenance Toggle Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              maintenanceMode
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {maintenanceMode ? <ShieldAlert className="w-6 h-6" /> : <Scissors className="w-6 h-6" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-foreground">وضع الصيانة (Maintenance Mode)</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  maintenanceMode
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {maintenanceMode ? 'مفعّل (المتجر مغلق)' : 'معطّل (المتجر يعمل)'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              التحكم بتفعيل أو إيقاف واجهة المستخدمين والمتجر العام للقيام بالتحديثات
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          data-maintenance-toggle
          aria-checked={maintenanceMode}
          disabled={togglingMaintenance}
          onClick={handleToggleMaintenance}
          className={`h-11 px-6 rounded-2xl font-black text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
            maintenanceMode
              ? 'bg-destructive text-destructive-foreground hover:opacity-95'
              : 'bg-primary text-primary-foreground hover:opacity-95'
          }`}
        >
          {togglingMaintenance ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : maintenanceMode ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Scissors className="w-4 h-4" />
          )}
          <span>{maintenanceMode ? 'إلغاء وضع الصيانة' : 'تفعيل وضع الصيانة'}</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
