import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import {
  adminOrdersApi,
  type AdminOrderDetail,
} from '../lib/orders';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Package,
  Server,
  DollarSign,
  Gamepad2,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const OrderDetail: React.FC = () => {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id || '';

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    adminOrdersApi
      .get(orderId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.error?.message || 'لم يتم العثور على الطلب');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات الطلب');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const formatUsd = (val: string | number) => {
    const num = Number(val) || 0;
    return `$${num.toFixed(4)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground">جاري تحميل تفاصيل الطلب...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
        <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
        <h2 className="text-xl font-black text-foreground">{error || 'الطلب غير موجود'}</h2>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لسجل الطلبات</span>
        </Link>
      </div>
    );
  }

  const extraFieldsEntries = Object.entries(order.extraFields || {});

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة الطلبات</span>
        </Link>
      </div>

      {/* Main Order Header */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-foreground font-mono">
              طلب #{order.displayId || order.id.slice(0, 8)}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(order.createdAt)}</span>
            </span>
            <span>•</span>
            <span>UUID: {order.orderUuid}</span>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 border-border/60 pt-3 sm:pt-0">
          <div className="text-xs text-muted-foreground">قيمة الطلب الإجمالية</div>
          <div className="text-2xl font-black text-foreground font-mono" dir="ltr">
            {formatUsd(order.priceUsd)}
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: تفاصيل المنتج */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-foreground border-b border-border pb-3">
            <Package className="w-5 h-5 text-accent" />
            <span>بيانات المنتج المطلوب</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">اسم المنتج:</span>
              <span className="font-bold text-foreground text-sm">{order.productName}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">الكمية:</span>
              <span className="font-mono font-bold text-foreground">× {order.qty}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">نوع المنتج:</span>
              <span className="font-bold text-foreground">{order.productType || 'باقة مباشرة'}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">معرف المنتج (ID):</span>
              <span className="font-mono text-[11px] text-muted-foreground">{order.productId}</span>
            </div>
          </div>
        </div>

        {/* Card 2: بيانات العميل */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <User className="w-5 h-5 text-primary" />
              <span>بيانات المستخدم</span>
            </div>
            <Link
              href={`/users`}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>عرض الملف</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">اسم المستخدم:</span>
              <span className="font-bold text-foreground font-mono">@{order.username}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span className="font-mono text-foreground">{order.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">رقم الهاتف:</span>
              <span className="font-mono text-foreground">{order.phone || 'غير مسجل'}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">الدولة:</span>
              <span className="font-bold text-foreground">{order.country || 'غير محدد'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: بيانات الشحن والتفعيل */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-foreground border-b border-border pb-3">
            <Gamepad2 className="w-5 h-5 text-purple-500" />
            <span>بيانات التفعيل والمعرف</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/50 border border-border space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground">معرف اللاعب / الحساب الرئيسي:</span>
              <div className="font-mono font-black text-base text-foreground tracking-wider select-all" dir="ltr">
                {order.playerId}
              </div>
            </div>

            {extraFieldsEntries.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-muted-foreground">الحقول الإضافية (Extra Fields):</span>
                <div className="space-y-1.5 rounded-2xl border border-border p-3 bg-muted/20">
                  {extraFieldsEntries.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs py-0.5">
                      <span className="font-mono text-muted-foreground">{k}:</span>
                      <span className="font-mono font-bold text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: الحسابات والربحية */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-foreground border-b border-border pb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>الحسابات والهامش الربحي</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">سعر البيع للعميل:</span>
              <span className="font-mono font-black text-sm text-foreground" dir="ltr">
                {formatUsd(order.priceUsd)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">تكلفة المزود (Cost):</span>
              <span className="font-mono font-bold text-muted-foreground" dir="ltr">
                {formatUsd(order.costUsd)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <span className="font-bold">صافي الربح المحقق:</span>
              <span className="font-mono font-black text-base" dir="ltr">
                +{formatUsd(order.profitUsd)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-black text-foreground border-b border-border pb-3">
          <Server className="w-5 h-5 text-blue-500" />
          <span>استجابة المزود وسجل النظام</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <span className="text-muted-foreground">معرف الطلب عند المزود (Provider Order ID):</span>
            <div className="p-3 rounded-2xl bg-muted/60 border border-border font-mono font-bold text-foreground">
              {order.providerOrderId || '— لم يُسجل معرف خارجي —'}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground">ملاحظات الطلب (Notes):</span>
            <div className="p-3 rounded-2xl bg-muted/60 border border-border text-muted-foreground">
              {order.notes || 'لا توجد ملاحظات مسجلة على هذا الطلب'}
            </div>
          </div>
        </div>

        {order.providerResponse && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>استجابة المزود الخام (Raw Provider Response):</span>
            </span>
            <pre
              className="p-4 rounded-2xl bg-muted/70 border border-border text-[11px] font-mono overflow-x-auto text-foreground max-h-60"
              dir="ltr"
            >
              {JSON.stringify(order.providerResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/orders"
          className="px-6 py-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
        >
          رجوع للقائمة
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            title="تعديل الحالة سيتوفر في المرحلة I-f"
            className="px-5 py-3 rounded-2xl bg-muted border border-border text-muted-foreground font-bold text-xs cursor-not-allowed opacity-60"
          >
            تعديل الحالة (قريباً)
          </button>

          <button
            type="button"
            disabled
            title="إعادة الإرسال ستتوفر في مرحلة المزودين"
            className="px-5 py-3 rounded-2xl bg-primary/20 text-primary font-bold text-xs cursor-not-allowed opacity-60"
          >
            إعادة الإرسال للمزود (قريباً)
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
