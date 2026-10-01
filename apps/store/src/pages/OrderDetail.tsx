import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { request } from '../lib/api';
import { productsApi, type Product } from '../lib/products';
import { formatCurrency, formatDate } from '../lib/utils';
import { useSettings } from '../lib/settings';
import {
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Loader2,
} from 'lucide-react';

interface OrderDetailData {
  id: string;
  orderUuid: string;
  displayId: number;
  productId: string;
  qty: number;
  playerId: string;
  extraFields: Record<string, any>;
  priceUsd: string;
  costUsd: string;
  profitUsd: string;
  status: 'pending' | 'waiting' | 'accept' | 'reject' | 'cancelled';
  providerOrderId?: string;
  providerResponse?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const OrderDetail: React.FC = () => {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id || '';

  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        const res = await request<OrderDetailData>(`/api/orders/${orderId}`);
        if (!res.success || !res.data) {
          if (isMounted) setError(res.error?.message || 'الطلب غير موجود');
          return;
        }

        if (isMounted) setOrder(res.data);

        // Fetch product info
        if (res.data.productId) {
          productsApi.getProduct(res.data.productId).then((pRes) => {
            if (pRes.success && pRes.data && isMounted) {
              setProduct(pRes.data);
            }
          });
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات الطلب');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accept':
        return {
          label: 'تم التنفيذ والموافقة بنجاح',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'waiting':
      case 'pending':
        return {
          label: 'قيد المراجعة والتنفيذ',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Clock className="w-4 h-4" />,
        };
      case 'reject':
      case 'cancelled':
        return {
          label: 'تم رفض أو إلغاء الطلب',
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-muted text-muted-foreground border-border',
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">جاري تحميل تفاصيل الطلب...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">{error || 'الطلب غير موجود'}</h2>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الطلبات</span>
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(order.status);
  const extraFieldsEntries = Object.entries(order.extraFields || {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى سجل طلباتي</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl bg-card border border-border/80 shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">تفاصيل العملية:</span>
            <h1 className="text-2xl font-black text-foreground">
              طلب #{order.displayId}
            </h1>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${badge.bg} self-start sm:self-auto`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-6">
          {/* Product details */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                {product?.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Package className="w-7 h-7 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  {product?.name || 'منتج رقمي'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  الكمية: {order.qty}
                </p>
              </div>
            </div>

            <div className="text-left">
              <span className="text-xs text-muted-foreground block">إجمالي المدفوع:</span>
              <span className="text-xl font-black text-primary tracking-tight" dir="ltr">
                {formatCurrency(order.priceUsd, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Account and Required Fields Data Table */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>بيانات ومعلومات التفعيل:</span>
            </h4>

            <div className="rounded-2xl border border-border overflow-hidden text-xs">
              <table className="w-full text-right">
                <tbody className="divide-y divide-border">
                  <tr className="bg-muted/30">
                    <td className="p-3.5 font-bold text-muted-foreground w-1/3">معرف الحساب / Player ID:</td>
                    <td className="p-3.5 font-semibold text-foreground font-mono" dir="ltr">
                      {order.playerId}
                    </td>
                  </tr>

                  {extraFieldsEntries.map(([key, val], idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="p-3.5 font-bold text-muted-foreground">{key}:</td>
                      <td className="p-3.5 font-semibold text-foreground">{String(val)}</td>
                    </tr>
                  ))}

                  {order.providerOrderId && (
                    <tr className="bg-muted/30">
                      <td className="p-3.5 font-bold text-muted-foreground">رقم مزود الخدمة:</td>
                      <td className="p-3.5 font-semibold text-muted-foreground font-mono" dir="ltr">
                        {order.providerOrderId}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Guarantee Note */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              تم توثيق هذه العملية ومعالجتها عبر نظام التشفير الآمن. في حال واجهتك أي استفسارات، يمكنك التواصل مع الدعم الفني وتزويدهم برقم الطلب #{order.displayId}.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
