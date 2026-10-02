import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import {
  ArrowRight,
  User,
  Info,
  Lock,
  MessageCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const ProfileEdit: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const whatsappNumber = settings.branding_whatsapp_business || '';

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <User className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-black">يرجى تسجيل الدخول أولاً</h2>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى الملف الشخصي</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20 space-y-1">
          <h1 className="text-2xl font-black text-foreground">تعديل الملف الشخصي</h1>
          <p className="text-xs text-muted-foreground">عرض وتعديل معلومات حسابك وبياناتك المسجلة</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Coming Soon Notice */}
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>تعديل البيانات المباشر قادم قريباً</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
              خدمة تعديل البيانات الشخصية ذاتياً ستتوفر في التحديث القادم. في حال رغبتك بتغيير بريدك الإلكتروني، رقم الهاتف أو الاسم بشكل عاجل، يرجى التواصل مع فريق الدعم الفني.
            </p>
          </div>

          {/* Read-only Profile Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>اسم المستخدم (Username)</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> غير قابل للتعديل
                </span>
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground font-mono font-bold text-sm cursor-not-allowed opacity-80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>البريد الإلكتروني</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> محمي
                </span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground text-sm cursor-not-allowed opacity-80"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  الاسم الأول
                </label>
                <input
                  type="text"
                  value={user.firstName || ''}
                  disabled
                  placeholder="غير محدد"
                  className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground text-sm cursor-not-allowed opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  الاسم الأخير / الكنية
                </label>
                <input
                  type="text"
                  value={user.lastName || ''}
                  disabled
                  placeholder="غير محدد"
                  className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground text-sm cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                رقم الهاتف
              </label>
              <input
                type="text"
                value={user.phone || ''}
                disabled
                placeholder="غير مسجل"
                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground font-mono text-sm cursor-not-allowed opacity-80"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                الدولة / المنطقة
              </label>
              <input
                type="text"
                value={user.country || ''}
                disabled
                placeholder="غير محدد"
                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border border-border text-foreground text-sm cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/80">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `مرحباً، أود طلب تعديل بيانات حسابي (@${user.username})`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>طلب تعديل البيانات عبر WhatsApp</span>
              </a>
            )}

            <Link
              href="/profile"
              className="px-6 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center transition-all shadow-sm cursor-pointer"
            >
              العودة إلى الملف الشخصي
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
