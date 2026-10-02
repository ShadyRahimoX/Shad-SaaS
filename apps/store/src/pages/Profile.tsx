import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { profileApi, type VipInfo, type VipLevel, type ReferralInfo } from '../lib/profile';
import { formatCurrency, formatDate } from '../lib/utils';
import { VipProgress } from '../components/VipProgress';
import {
  User as UserIcon,
  Crown,
  Users,
  Info,
  Edit3,
  Wallet,
  Calendar,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<'info' | 'vip' | 'referrals'>('info');

  // VIP & Referral Data
  const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
  const [vipLevels, setVipLevels] = useState<VipLevel[]>([]);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const currencySymbol = settings.site_currency_symbol || '$';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      profileApi.getVipInfo().catch(() => ({ success: false, data: null })),
      profileApi.getVipLevels().catch(() => ({ success: false, data: [] })),
      profileApi.getReferralInfo().catch(() => ({ success: false, data: null })),
    ])
      .then(([vipRes, levelsRes, refRes]) => {
        if (!isMounted) return;
        if (vipRes.success && vipRes.data) setVipInfo(vipRes.data);
        if (levelsRes.success && levelsRes.data) setVipLevels(levelsRes.data);
        if (refRes.success && refRes.data) setReferralInfo(refRes.data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'حدث خطأ في تحميل البيانات');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <UserIcon className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-black">يرجى تسجيل الدخول لعرض الملف الشخصي</h2>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const initialLetter = (user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase();
  const currentVipColor = vipInfo?.color || user.vip?.color || '#3b82f6';
  const currentVipName = vipInfo?.name || user.vip?.name || 'New';
  const currentVipLevel = vipInfo?.level ?? user.vip?.level ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* 1. User Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          {/* Avatar with initial or image */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-md border-2 border-white/20 shrink-0 select-none"
            style={{ backgroundColor: currentVipColor }}
          >
            {initialLetter}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
              </h1>
              <span className="text-xs font-mono text-muted-foreground font-bold">
                #{user.displayId}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white shadow-xs"
                style={{ backgroundColor: currentVipColor }}
              >
                <Crown className="w-3 h-3" />
                <span>VIP {currentVipLevel} ({currentVipName})</span>
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <span>@{user.username}</span>
              <span>•</span>
              <span>{user.email}</span>
            </p>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>انضم في: {formatDate((user as any).createdAt, false)}</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
                <span dir="ltr">رصيدك: {formatCurrency(user.balanceUsd, currencySymbol)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors border border-border cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>تعديل الملف الشخصي</span>
        </Link>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'info'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>معلومات الحساب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vip')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'vip'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>العضويات ومستوى VIP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>نظام الإحالات والأرباح</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {loading ? (
        <div className="p-12 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل بيانات الملف الشخصي...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: User Details */}
          {activeTab === 'info' && (
            <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden">
              <div className="p-6 border-b border-border/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">البيانات الشخصية</h3>
                  <p className="text-xs text-muted-foreground">تفاصيل ومعلومات حسابك الأساسية المسجلة</p>
                </div>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </Link>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">اسم المستخدم (Username):</span>
                  <span className="text-foreground font-mono font-extrabold text-sm">{user.username}</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">البريد الإلكتروني:</span>
                  <span className="text-foreground font-bold text-sm" dir="ltr">{user.email}</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">الاسم الأول:</span>
                  <span className="text-foreground font-bold text-sm">{user.firstName || 'غير محدد'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">الاسم الأخير / الكنية:</span>
                  <span className="text-foreground font-bold text-sm">{user.lastName || 'غير محدد'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">رقم الهاتف:</span>
                  <span className="text-foreground font-mono font-bold text-sm" dir="ltr">{user.phone || 'غير مسجل'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-bold block">الدولة / المنطقة:</span>
                  <span className="text-foreground font-bold text-sm">{user.country || 'غير محدد'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIP Levels */}
          {activeTab === 'vip' && vipInfo && (
            <div className="space-y-6">
              {/* VIP Progress Component (Matching Image #14) */}
              <VipProgress vip={vipInfo} currentSpentUsd={user.totalSpentUsd} />

              {/* 4 Levels Cards */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>جميع شرائح ومستويات الـ VIP</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vipLevels.map((lvl) => {
                    const isCurrent = lvl.level === vipInfo.level;
                    const isUnlocked = lvl.level <= vipInfo.level;

                    return (
                      <div
                        key={lvl.level}
                        className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                          isCurrent
                            ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/20'
                            : isUnlocked
                            ? 'bg-card border-border'
                            : 'bg-muted/20 border-border/60 opacity-80'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-white shadow-xs"
                              style={{ backgroundColor: lvl.color || '#3b82f6' }}
                            >
                              VIP {lvl.level}
                            </span>
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>مستواك الحالي</span>
                              </span>
                            ) : !isUnlocked ? (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : null}
                          </div>

                          <h4 className="text-lg font-black text-foreground">{lvl.name}</h4>
                          <p className="text-[11px] text-muted-foreground font-bold">
                            الحد الأدنى للإنفاق: {formatCurrency(lvl.minSpendingUsd, currencySymbol)}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-muted-foreground">خصم السنت:</span>
                            <span className="font-mono text-primary font-black" dir="ltr">%{lvl.centDiscountPercent}.00</span>
                          </div>
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-muted-foreground">الكاش باك:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black" dir="ltr">%{lvl.cashbackPercent}.00</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Referrals */}
          {activeTab === 'referrals' && referralInfo && (
            <div className="space-y-6">
              {/* Quick Referral Overview */}
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span>كود ورابط الإحالة الخاص بك</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      شارك كود الإحالة مع أصدقائك واكسب عمولة مجزية على كل طلب إيداع وشراء يقومون به
                    </p>
                  </div>

                  <Link
                    href="/referrals"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <span>عرض التفاصيل وسجل العمولات ←</span>
                  </Link>
                </div>

                {/* Referral Code Box */}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                  <span className="text-xs font-bold text-muted-foreground sm:w-28 shrink-0">
                    كود الإحالة:
                  </span>
                  <span className="text-lg font-mono font-black text-primary flex-1 tracking-wider" dir="ltr">
                    {referralInfo.referralCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(referralInfo.referralCode)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>

                {/* Quick Stats Grid (3) */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-center space-y-1">
                    <span className="text-[11px] text-muted-foreground font-bold block">عدد المُحالين</span>
                    <span className="text-xl font-black text-foreground">{referralInfo.totalReferred}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">إجمالي العمولات</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {formatCurrency(referralInfo.totalEarned, currencySymbol)}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                    <span className="text-[11px] text-purple-700 dark:text-purple-400 font-bold block">رصيد الإحالات</span>
                    <span className="text-xl font-black text-purple-600 dark:text-purple-400" dir="ltr">
                      {formatCurrency(referralInfo.referralBalanceUsd, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
