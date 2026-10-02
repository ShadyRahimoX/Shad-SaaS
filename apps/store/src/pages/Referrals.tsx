import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { profileApi, type ReferralInfo, type ReferralEntry, type ReferralCommission } from '../lib/profile';
import { useSettings } from '../lib/settings';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  ArrowRight,
  Users,
  Copy,
  Check,
  QrCode,
  TrendingUp,
  DollarSign,
  Gift,
  Share2,
  Calendar,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ChevronRight,
  X,
} from 'lucide-react';

export const Referrals: React.FC = () => {
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Commissions Modal State
  const [selectedReferral, setSelectedReferral] = useState<ReferralEntry | null>(null);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      profileApi.getReferralInfo(),
      profileApi.listReferrals({ page: 1, limit: 20 }),
    ])
      .then(([infoRes, listRes]) => {
        if (!isMounted) return;
        if (infoRes.success && infoRes.data) setInfo(infoRes.data);
        if (listRes.success && listRes.data) {
          setReferrals(listRes.data.referrals);
          setTotal(listRes.data.total);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل جلب بيانات الإحالات');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleViewCommissions = async (ref: ReferralEntry) => {
    setSelectedReferral(ref);
    setLoadingCommissions(true);
    try {
      const res = await profileApi.listCommissions(ref.id, { page: 1, limit: 50 });
      if (res.success && res.data) {
        setCommissions(res.data.commissions);
      } else {
        setCommissions([]);
      }
    } catch {
      setCommissions([]);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://store.shad-saas.com';
  const referralCode = info?.referralCode || '';
  const referralLink = info?.referralLink || `${currentOrigin}/register?ref=${referralCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للملف الشخصي</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            <span>نظام الإحالات والعمولات</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            شارك رابطك الخاص مع عملائك واكسب أرباحاً تلقائية مع كل عملية شراء ناجحة
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل بيانات الإحالات...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* 1. Share Card & QR (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Code & Link Share Box (2 cols) */}
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                  <Gift className="w-4 h-4" />
                  <span>شارك واكسب الأرباح فورياً</span>
                </div>
                <h3 className="text-xl font-black text-foreground">كود ورابط الدعوة الشخصي</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  عند تسجيل أي مستخدم جديد عبر كودك أو الرابط المباشر، ستحصل تلقائياً على نسبة من كل طلب يقوم بتنفيذه على المنصة.
                </p>
              </div>

              <div className="space-y-4">
                {/* Code Field */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    كود الإحالة (Referral Code):
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border">
                    <span className="text-lg font-mono font-black text-primary flex-1 px-2 tracking-wider" dir="ltr">
                      {referralCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(referralCode, 'code')}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                    </button>
                  </div>
                </div>

                {/* Link Field */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    رابط التسجيل المباشر:
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-2xl bg-muted/40 border border-border">
                    <span className="text-xs font-mono font-bold text-foreground truncate flex-1 px-2 text-left" dir="ltr">
                      {referralLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(referralLink, 'link')}
                      className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: QR Code Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 rounded-2xl bg-white shadow-xs border border-border">
                <img src={qrUrl} alt="Referral QR" className="w-36 h-36 object-contain" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-foreground block">رمز الاستجابة السريعة (QR)</span>
                <span className="text-[11px] text-muted-foreground block">امسح الرمز للتسجيل الفوري المباشر</span>
              </div>
            </div>
          </div>

          {/* 2. 3 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Total Referred */}
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span>عدد المُحالين</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {info?.totalReferred || 0}
              </div>
              <span className="text-[11px] text-muted-foreground block">مستخدم مسجل عبر كودك</span>
            </div>

            {/* 2. Total Earned */}
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>إجمالي الأرباح المكتسبة</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight" dir="ltr">
                {formatCurrency(info?.totalEarned || 0, currencySymbol)}
              </div>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 block">من جميع طلبات المشتركين</span>
            </div>

            {/* 3. Referral Balance */}
            <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>رصيد الإحالات المتاح</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight" dir="ltr">
                {formatCurrency(info?.referralBalanceUsd || 0, currencySymbol)}
              </div>
              <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 block">جاهز للاستخدام أو السحب</span>
            </div>
          </div>

          {/* 3. Referrals List Section */}
          <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">قائمة المسجلين عبر إحالتك</h3>
                <p className="text-xs text-muted-foreground">تفاصيل الأرباح والطلبات لكل مستخدم مُحال</p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-muted text-muted-foreground">
                إجمالي: {total}
              </span>
            </div>

            {referrals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <h4 className="font-extrabold text-foreground text-sm">لم تُحِل أي شخص بعد</h4>
                <p className="text-xs text-muted-foreground">
                  شارك كودك أو رابطك مع أصدقائك الآن لتبدأ في جني العمولات تلقائياً!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
                        {r.referredUsername[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-sm text-foreground block">
                          @{r.referredUsername}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>انضم: {formatDate(r.createdAt, false)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">الطلبات:</span>
                        <span className="font-bold font-mono text-foreground flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          <span>{r.totalOrdersCount}</span>
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-muted-foreground block">عمولتك منه:</span>
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm" dir="ltr">
                          {formatCurrency(r.totalEarnedUsd, currencySymbol)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewCommissions(r)}
                        className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title="عرض تفاصيل العمولات"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 4. Commissions Details Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-foreground">
                  تفاصيل عمولات: @{selectedReferral.referredUsername}
                </h3>
                <p className="text-xs text-muted-foreground">
                  إجمالي الأرباح من هذا المستخدم: {formatCurrency(selectedReferral.totalEarnedUsd, currencySymbol)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingCommissions ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : commissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  لا توجد تفاصيل عمولات فردية مسجلة بعد.
                </div>
              ) : (
                commissions.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-foreground block">
                        طلب #{c.orderId.slice(0, 8)}...
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(c.createdAt)} (نسبة %{c.commissionPercent})
                      </span>
                    </div>
                    <div className="text-left font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm" dir="ltr">
                      +{formatCurrency(c.commissionAmountUsd, currencySymbol)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;
