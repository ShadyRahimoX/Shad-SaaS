import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { request } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { RequiredFieldsForm } from '../components/RequiredFieldsForm';
import {
  ShieldCheck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Package,
  Loader2,
  Lock,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const { items, subtotalUsd, clear, addItem, updateRequiredFields } = useCart();
  const { user, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currencySymbol = settings.site_currency_symbol || '$';
  const currentBalance = parseFloat(user?.balanceUsd || '0');
  const balanceAfter = currentBalance - subtotalUsd;
  const isInsufficient = balanceAfter < 0;

  // Validation: Only check items that actually have requiredFields configured
  const isMissingRequiredData = items.some((item) => {
    if (Array.isArray(item.requiredFields) && item.requiredFields.length > 0) {
      const data = item.requiredFieldsData || {};
      for (const field of item.requiredFields) {
        const key = field.label || field.name;
        if (!data[key] || !String(data[key]).trim()) {
          return true;
        }
      }
    }
    return false;
  });

  const handleConfirmOrder = async () => {
    if (!user) {
      setLocation('/login');
      return;
    }

    if (items.length === 0) {
      setLocation('/cart');
      return;
    }

    if (isInsufficient) {
      setErrorMsg('رصيدك الحالي غير كافٍ لإتمام هذه العملية. يرجى شحن الرصيد أولاً.');
      return;
    }

    if (isMissingRequiredData) {
      setErrorMsg('يرجى ملء جميع الحقول والمعلومات المطلوبة للمنتجات قبل التأكيد.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const orderIds: string[] = [];
    const failedIndices: number[] = [];

    try {
      // Process items sequentially
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const orderUuid = crypto.randomUUID();

        // Robust playerId fallback hierarchy
        const pId =
          item.playerId?.trim() ||
          item.requiredFieldsData?.playerId ||
          (item.requiredFieldsData && Object.values(item.requiredFieldsData)[0]) ||
          user.username ||
          'N/A';

        const payload = {
          productId: item.productId,
          qty: item.quantity,
          playerId: pId,
          extraFields: item.requiredFieldsData || {},
          orderUuid,
        };

        try {
          const res = await request<any>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          if (res.success && res.data?.id) {
            orderIds.push(res.data.id);
          } else {
            console.error('Order creation error:', res.error);
            failedIndices.push(i);
          }
        } catch (itemErr) {
          console.error('Network or execution error on item order:', itemErr);
          failedIndices.push(i);
        }
      }

      await refreshUser();

      if (failedIndices.length === 0) {
        clear();
        alert(
          orderIds.length === 1
            ? 'تم إنشاء وتأكيد طلبك بنجاح!'
            : `تم إنشاء وتأكيد ${orderIds.length} طلبات بنجاح!`
        );
        if (orderIds.length === 1) {
          setLocation(`/orders/${orderIds[0]}`);
        } else {
          setLocation('/orders');
        }
      } else {
        // Multi-order partial failure: retain failed items in cart so user can retry
        const failedItems = items.filter((_, idx) => failedIndices.includes(idx));
        clear();
        failedItems.forEach((f) => addItem(f));

        alert(
          `${orderIds.length} طلبات نجحت، و ${failedIndices.length} فشلت. يرجى التحقق من الرصيد والبيانات.`
        );
        setLocation('/orders');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الطلبات، يرجى المحاولة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center space-y-4" dir="rtl">
        <h2 className="text-2xl font-black">لا توجد عناصر لإتمام شرائها</h2>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/80 pb-4">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-2"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى السلة</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">
          إتمام وتأكيد الشراء
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          يرجى مراجعة البيانات واستكمال معلومات الحساب المطلوبة لكل منتج
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 cols: Items & Required Fields Forms */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-extrabold text-base text-foreground">
            بيانات المنتجات والتفعيل
          </h3>

          {items.map((item) => {
            const hasRequiredFields =
              Array.isArray(item.requiredFields) && item.requiredFields.length > 0;

            return (
              <div
                key={item.productId}
                className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        الكمية: {item.quantity} × {formatCurrency(item.priceUsd, currencySymbol)}
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-sm text-primary" dir="ltr">
                    {formatCurrency(parseFloat(item.priceUsd) * item.quantity, currencySymbol)}
                  </span>
                </div>

                {/* Inline form or info note */}
                <div className="space-y-2">
                  <h5 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>بيانات الشحن / التفعيل:</span>
                  </h5>

                  {hasRequiredFields ? (
                    <RequiredFieldsForm
                      fields={item.requiredFields || []}
                      values={item.requiredFieldsData || {}}
                      onChange={(vals) => updateRequiredFields(item.productId, vals)}
                      playerId={item.playerId || ''}
                      onPlayerIdChange={(pid) =>
                        updateRequiredFields(item.productId, item.requiredFieldsData || {}, pid)
                      }
                    />
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">
                          لا توجد حقول إضافية مطلوبة لهذا المنتج.
                        </span>
                        <span>سيتم ربط وإصدار الطلب تلقائياً باسم حسابك ({user?.username}).</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        جاهز للشراء
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 col: Live Balance & Summary (Image #9.3) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-6">
            <h3 className="font-extrabold text-base text-foreground pb-3 border-b border-border/70">
              تفاصيل الدفع والرصيد
            </h3>

            {/* Live Balance Preview (Image #9.3) */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>الرصيد الحالي:</span>
                </span>
                <span className="font-bold text-foreground text-sm" dir="ltr">
                  {formatCurrency(currentBalance, currencySymbol)}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>إجمالي الخصم (المشتريات):</span>
                <span className="font-bold text-red-500 text-sm" dir="ltr">
                  -{formatCurrency(subtotalUsd, currencySymbol)}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
                <span className="font-bold text-foreground">الرصيد المتبقي بعد الشراء:</span>
                <span
                  className={`font-black text-base tracking-tight ${
                    isInsufficient ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                  dir="ltr"
                >
                  {formatCurrency(balanceAfter, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Insufficient Warning */}
            {isInsufficient && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>الرصيد الحالي غير كافٍ!</span>
                </div>
                <p className="leading-relaxed">
                  أنت بحاجة إلى شحن محفظتك بـ {formatCurrency(Math.abs(balanceAfter), currencySymbol)} إضافية لتنفيذ الطلب.
                </p>
                <Link
                  href="/wallet/deposit"
                  className="inline-block mt-1 font-bold underline hover:opacity-90"
                >
                  إضافة رصيد للمحفظة الآن ←
                </Link>
              </div>
            )}

            {/* Incomplete fields warning */}
            {isMissingRequiredData && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>يرجى ملء جميع الحقول الإلزامية لتأكيد الطلب.</span>
              </div>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={loading || isInsufficient || isMissingRequiredData}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تأكيد الطلب والخصم...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الطلب والخصم من الرصيد</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>معاملة مشفرة وآمنة بنسبة 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
