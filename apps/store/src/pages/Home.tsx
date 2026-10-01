import React from 'react';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { useTheme } from '../lib/theme';
import { Sparkles, Layers, PackageCheck, Zap } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { nameAr: themeName } = useTheme();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-border p-6 sm:p-10">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>النمط النشط: {themeName || 'الافتراضي'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {user
              ? `أهلاً بك مجدداً، ${user.firstName || user.username}!`
              : `مرحباً بك في ${settings.site_name || 'Shad Store'}`}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {settings.site_description || 'منصة متكاملة لشراء وشحن الألعاب والبطاقات الرقمية والاشتراكات بأعلى سرعة وأمان.'}
          </p>
        </div>
      </section>

      {/* Placeholder Section for H-c: Categories & Products */}
      <section className="rounded-3xl border-2 border-dashed border-border/80 p-8 sm:p-12 text-center space-y-4 bg-card/40">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <Layers className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-foreground">الأقسام والمنتجات</h2>
          <p className="text-sm font-semibold text-primary">Products &amp; Categories قادمة في H-c</p>
          <p className="text-xs text-muted-foreground">
            سيتم في المرحلة التالية عرض شبكة التصنيفات، المنتجات الأكثر طلباً، ومحرك البحث السريع.
          </p>
        </div>

        {/* Feature Highlights Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto text-xs text-muted-foreground">
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>تسليم فوري وآلي</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-500" />
            <span>ضمان رسمي 100%</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>خصومات حصرية للـ VIP</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
