import React from 'react';
import type { VipInfo } from '../lib/profile';
import { Crown, Sparkles, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useSettings } from '../lib/settings';

interface VipProgressProps {
  vip: VipInfo;
  currentSpentUsd?: number | string;
}

export const VipProgress: React.FC<VipProgressProps> = ({ vip, currentSpentUsd }) => {
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const isMaxLevel = !vip.nextLevel;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.max(0, vip.nextLevel?.progressPercent || 0));
  const currentSpent = currentSpentUsd ? parseFloat(String(currentSpentUsd)) : vip.minSpendingUsd;

  return (
    <div
      className="p-6 rounded-3xl bg-card border shadow-xs space-y-5 text-right relative overflow-hidden"
      style={{ borderColor: vip.color ? `${vip.color}40` : undefined }}
      dir="rtl"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-xs"
              style={{ backgroundColor: vip.color || '#3b82f6' }}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>VIP {vip.level} — {vip.name}</span>
            </span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {settings.site_name || 'AL HALLAK'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            {isMaxLevel
              ? `تهانينا! أنت حالياً في أعلى شريحة VIP (${vip.name}) وتتمتع بأقصى نسبة خصم وكاش باك.`
              : `شريحتك الحالية VIP ${vip.level} (${vip.name}). إذا كنت ترغب بترقية حسابك إلى شريحة أعلى والحصول على خصومات مميزة ما عليك إلا زيادة مبيعاتك ومشترياتك.`}
          </p>
        </div>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
          style={{ backgroundColor: `${vip.color || '#3b82f6'}15`, color: vip.color || '#3b82f6' }}
        >
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2 pt-2">
        <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/60">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: isMaxLevel
                ? 'linear-gradient(90deg, #F59E0B, #EAB308, #FBBF24)'
                : `linear-gradient(90deg, ${vip.color || '#3b82f6'}, #10B981)`,
            }}
          />
        </div>

        {/* Labels under progress bar (matching Image #14) */}
        {!isMaxLevel && vip.nextLevel ? (
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1">
            {/* Right: Target spending */}
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground/80">الهدف ({vip.nextLevel.name}):</span>
              <span className="font-mono text-foreground font-extrabold" dir="ltr">
                {formatCurrency(vip.nextLevel.minSpendingUsd, currencySymbol)}
              </span>
            </div>

            {/* Center: Current discount */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground/80">خصم السنت الحالي:</span>
              <span className="font-mono text-primary font-black" dir="ltr">
                %{vip.centDiscountPercent}.00
              </span>
            </div>

            {/* Left: Current Purchases */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground/80">المشتريات الحالية:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold" dir="ltr">
                {formatCurrency(currentSpent, currencySymbol)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أنت في أعلى مستوى VIP 🎉</span>
            </span>
            <span className="font-mono" dir="ltr">
              خصم السنت: %{vip.centDiscountPercent}.00 | كاش باك: %{vip.cashbackPercent}.00
            </span>
          </div>
        )}
      </div>

      {/* Remaining Amount Note */}
      {!isMaxLevel && vip.nextLevel && (
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>المبلغ المتبقي للوصول إلى {vip.nextLevel.name}:</span>
          </div>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
            {formatCurrency(vip.nextLevel.remainingUsd, currencySymbol)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VipProgress;
