import React, { useEffect, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { depositsApi, type DepositMethod } from '../lib/deposits';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { formatCurrency } from '../lib/utils';
import {
  ArrowRight,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Lock,
  Zap,
  DollarSign,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';

export const Deposit: React.FC = () => {
  const [, params] = useRoute('/wallet/deposit/:code');
  const methodCode = params?.code || '';

  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('5');
  const [currency, setCurrency] = useState<string>('USD');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [proofImageUrl, setProofImageUrl] = useState<string>('');

  const currencySymbol = settings.site_currency_symbol || '$';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    depositsApi
      .getMethodByCode(methodCode)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setMethod(res.data);
          if (res.data.currencies && res.data.currencies.length > 0) {
            setCurrency(res.data.currencies[0]);
          }
        } else {
          setError(res.error?.message || 'طريقة الدفع غير موجودة');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات طريقة الدفع');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [methodCode]);

  const parsedAmount = parseFloat(amount) || 0;
  const minAmount = method ? parseFloat(method.minAmountUsd) || 1 : 1;
  const isBelowMin = parsedAmount < minAmount;

  const isManual = method?.type === 'manual';
  const isMissingManualRef = isManual && !transactionRef.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLocation('/login');
      return;
    }

    if (isBelowMin) {
      setError(`الحد الأدنى للشحن عبر هذه الطريقة هو ${formatCurrency(minAmount, currencySymbol)}`);
      return;
    }

    if (isMissingManualRef) {
      setError('يرجى إدخال رقم العملية / المرجع لتأكيد التحويل');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        methodCode,
        amount: parsedAmount,
        currency,
      };

      if (transactionRef.trim()) payload.transactionRef = transactionRef.trim();
      if (proofImageUrl.trim()) payload.proofImageUrl = proofImageUrl.trim();

      const res = await depositsApi.create(payload);

      if (res.success && res.data?.deposit?.id) {
        setLocation(`/wallet/deposit/invoice/${res.data.deposit.id}`);
      } else {
        setError(res.error?.message || 'فشل إنشاء طلب الإيداع');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل بيانات وسيلة الدفع...</span>
      </div>
    );
  }

  if (error && !method) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">{error}</h2>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى المحفظة</span>
        </Link>
      </div>
    );
  }

  if (!method) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى المحفظة</span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">{method.name}</h1>
              {method.type === 'invoice' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>دفع فوري تلقائي</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-xs">
                  تحويل يدوي
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              الحد الأدنى للشحن: {formatCurrency(minAmount, currencySymbol)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Instructions */}
          {method.instructions && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">{method.instructions}</p>
            </div>
          )}

          {/* Currency & Amount (Images #9.1, #9.2) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                العملة
              </label>
              {method.currencies && method.currencies.length > 1 ? (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-muted/40 border border-border text-foreground font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {method.currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground font-black text-sm flex items-center">
                  {currency}
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">
                المبلغ المطلوب إيداعه ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min={minAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`أدخل المبلغ (أقل قيمة ${minAmount})`}
                  className={`w-full h-12 pr-4 pl-10 rounded-2xl bg-background border text-foreground font-black text-base focus:outline-hidden focus:ring-2 ${
                    isBelowMin
                      ? 'border-destructive focus:ring-destructive/20'
                      : 'border-border focus:ring-primary/20'
                  }`}
                  required
                />
                <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {isBelowMin && (
                <span className="text-[11px] text-destructive font-bold mt-1 block">
                  أقل مبلغ مسموح به هو {formatCurrency(minAmount, currencySymbol)}
                </span>
              )}
            </div>
          </div>

          {/* Manual Method Extra Fields (Image #9.6) */}
          {isManual && (
            <div className="space-y-4 pt-2 border-t border-border/80">
              <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>بيانات ومعلومات التحويل:</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  رقم العملية / المرجع (TX Hash / Reference) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="أدخل رقم الحوالة أو معرف المعاملة..."
                  className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  رابط صورة الإشعار (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={proofImageUrl}
                    onChange={(e) => setProofImageUrl(e.target.value)}
                    placeholder="https://example.com/receipt.jpg"
                    className="w-full h-12 pr-4 pl-10 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <ImageIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Box (Image #9.3) */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            {currency === 'USD' ? (
              <div className="flex items-center justify-between w-full">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">الرصيد الذي سيتم إضافته إلى محفظتك:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                    {formatCurrency(parsedAmount, currencySymbol)}
                  </span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-bold block">
                  المبلغ المطلوب: <span dir="ltr" className="font-black">{parsedAmount} {currency}</span>
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 block">
                  سيُحسب الرصيد المضاف بالدولار تلقائياً عند إنشاء الفاتورة حسب سعر الصرف الحالي.
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || isBelowMin || (isManual && isMissingManualRef)}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء طلب الإيداع...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{method.type === 'invoice' ? 'إنشاء فاتورة ودفع فوري' : 'تأكيد وإرسال طلب الإيداع'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Deposit;
