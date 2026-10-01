import React, { useEffect, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { depositsApi, type Deposit } from '../lib/deposits';
import { useSettings } from '../lib/settings';
import { formatCurrency, formatCountdown, formatDate } from '../lib/utils';
import {
  ArrowRight,
  QrCode,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Zap,
  Building2,
  RotateCcw,
} from 'lucide-react';

export const DepositInvoice: React.FC = () => {
  const [, params] = useRoute('/wallet/deposit/invoice/:id');
  const depositId = params?.id || '';

  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification state
  const [verifyRef, setVerifyRef] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Countdown timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [isExpired, setIsExpired] = useState(false);

  const currencySymbol = settings.site_currency_symbol || '$';
  const whatsappNumber = settings.branding_whatsapp_business || '';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    depositsApi
      .get(depositId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setDeposit(res.data);
          if (res.data.transactionRef) {
            setVerifyRef(res.data.transactionRef);
          }

          // Calculate remaining seconds from expiresAt
          if (res.data.expiresAt) {
            const expTime = new Date(res.data.expiresAt).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expTime - now) / 1000));
            setSecondsRemaining(remaining);
            if (remaining <= 0) setIsExpired(true);
          }
        } else {
          setError(res.error?.message || 'لم يتم العثور على الفاتورة');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل جلب بيانات الفاتورة');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [depositId]);

  // Interval timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRef.trim()) {
      setVerifyError('يرجى إدخال رقم أو مرجع العملية أولاً');
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await depositsApi.verify(depositId, verifyRef.trim());
      if (res.success) {
        alert('تم تأكيد وإرسال بيانات التحقق بنجاح!');
        setLocation('/wallet/deposits');
      } else {
        setVerifyError(res.error?.message || 'فشل التحقق من رقم العملية. يرجى التأكد من صحة الرقم والمحاولة ثانية.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل بيانات الفاتورة...</span>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">{error || 'الفاتورة غير موجودة'}</h2>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمحفظة</span>
        </Link>
      </div>
    );
  }

  const isInvoice = deposit.invoiceId || deposit.paymentUrl;
  const qrData = deposit.paymentUrl || deposit.invoiceId || deposit.id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  const displayAddress = deposit.invoiceId || deposit.paymentUrl || deposit.id;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Bar */}
      <div>
        <Link
          href="/wallet/deposits"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى سجل الدفعات</span>
        </Link>
      </div>

      {/* Invoice / Receipt Main Card */}
      <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">
                فاتورة إيداع #{deposit.displayId}
              </h1>
              {isInvoice ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>دفع فوري</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  تحويل يدوي
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(deposit.createdAt)}</p>
          </div>

          {/* Amount Badge */}
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">المبلغ المطلوب:</span>
            <span className="text-2xl font-black text-primary tracking-tight" dir="ltr">
              {deposit.amount} {deposit.currency}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Invoice Flow (QR + Countdown + Verify) */}
          {isInvoice ? (
            <>
              {/* Expired Banner */}
              {isExpired ? (
                <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <h3 className="font-extrabold text-base">انتهت صلاحية هذه الفاتورة</h3>
                  <p className="text-xs text-muted-foreground">
                    يرجى إنشاء فاتورة جديدة لإتمام عملية الشحن.
                  </p>
                  <Link
                    href={`/wallet/deposit/${deposit.method}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إنشاء فاتورة جديدة</span>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Countdown Timer */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                      <span>الوقت المتبقي لصلاحية الفاتورة:</span>
                    </div>
                    <span className="text-base font-black font-mono text-amber-700 dark:text-amber-300" dir="ltr">
                      {formatCountdown(secondsRemaining)}
                    </span>
                  </div>

                  {/* QR Code & Payment Details (Image #9.4) */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-muted/30 border border-border/70 space-y-4 text-center">
                    <div className="p-3 rounded-2xl bg-white shadow-xs border border-border">
                      <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                    </div>

                    <div className="w-full max-w-md space-y-2">
                      <span className="text-xs text-muted-foreground font-bold block">
                        امسح الرمز أو انسخ العنوان / رقم الفاتورة التالي:
                      </span>
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-border">
                        <span className="text-xs font-mono font-bold text-foreground truncate flex-1 text-left" dir="ltr">
                          {displayAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(displayAddress)}
                          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                          title="نسخ"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {deposit.paymentUrl && (
                      <a
                        href={deposit.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
                      >
                        <span>فتح رابط الدفع في نافذة جديدة</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Live Credit Preview Note */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold block">الرصيد بعد الإضافة:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                        {formatCurrency(parseFloat(deposit.amountUsd), currencySymbol)}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>

                  {/* Verification Form (Image #9.4 & #9.5) */}
                  <form onSubmit={handleVerify} className="space-y-4 pt-2 border-t border-border/80">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-foreground">
                        تأكيد وإتمام الطلب بعد التحويل:
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        بعد تحويل المبلغ، يرجى إدخال رقم العملية / المرجع الممنوح لك من تطبيق الدفع
                      </p>
                    </div>

                    {/* Inline Error (Image #9.5) */}
                    {verifyError && (
                      <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        رقم العملية / المرجع (Transaction Ref)
                      </label>
                      <input
                        type="text"
                        value={verifyRef}
                        onChange={(e) => setVerifyRef(e.target.value)}
                        placeholder="أدخل رقم العملية..."
                        className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={verifying || isExpired}
                        className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري التحقق من العملية...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>إتمام الطلب وتأكيد الإيداع</span>
                          </>
                        )}
                      </button>

                      <Link
                        href="/wallet/deposits"
                        className="px-5 h-12 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center transition-colors border border-border"
                      >
                        إلغاء المعاملة
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </>
          ) : (
            /* Manual Flow (Image #9.6) */
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>تم استلام بيانات الإيداع وهي قيد المراجعة</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  تم تسجيل طلبك برقم مرجعي (#{deposit.displayId}). سيقوم فريق العمل بمراجعة إشعار التحويل وتحديث رصيد محفظتك في أقرب وقت.
                </p>
              </div>

              {/* Deposit Details Table */}
              <div className="rounded-2xl border border-border overflow-hidden text-xs">
                <table className="w-full text-right">
                  <tbody className="divide-y divide-border">
                    <tr className="bg-muted/30">
                      <td className="p-3.5 font-bold text-muted-foreground w-1/3">طريقة الدفع:</td>
                      <td className="p-3.5 font-bold text-foreground">{deposit.method}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-muted-foreground">رقم العملية / المرجع:</td>
                      <td className="p-3.5 font-mono font-bold text-foreground" dir="ltr">
                        {deposit.transactionRef || 'غير محدد'}
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-3.5 font-bold text-muted-foreground">المبلغ:</td>
                      <td className="p-3.5 font-black text-primary" dir="ltr">
                        {deposit.amount} {deposit.currency} ({formatCurrency(deposit.amountUsd, currencySymbol)})
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-muted-foreground">حالة الطلب:</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[11px]">
                          قيد المراجعة والتدقيق
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `مرحباً، أود متابعة طلب الإيداع رقم #${deposit.displayId} بقيمة ${deposit.amount} ${deposit.currency}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل مع الإدارة عبر WhatsApp لتسريع الاعتماد</span>
                  </a>
                )}

                <Link
                  href="/wallet/deposits"
                  className="px-6 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center transition-all shadow-sm"
                >
                  العودة لسجل الإيداعات
                </Link>
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              نظام الإيداع مشفر ومحمي. يتم تدقيق العمليات لضمان أمان أرصدة العملاء وسرعة إنجاز الطلبات.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositInvoice;
