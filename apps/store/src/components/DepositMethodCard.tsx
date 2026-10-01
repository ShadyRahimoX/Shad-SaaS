import React from 'react';
import type { DepositMethod } from '../lib/deposits';
import {
  Wallet,
  CreditCard,
  Building2,
  Zap,
  Smartphone,
  Send,
  Coins,
  Receipt,
} from 'lucide-react';

interface DepositMethodCardProps {
  method: DepositMethod;
  onClick: () => void;
}

export const DepositMethodCard: React.FC<DepositMethodCardProps> = ({ method, onClick }) => {
  const getFallbackIcon = (code: string) => {
    if (code.includes('shamcash')) return <Zap className="w-8 h-8 text-white drop-shadow-sm" />;
    if (code.includes('usdt')) return <Coins className="w-8 h-8 text-white drop-shadow-sm" />;
    if (code.includes('wish') || code.includes('vodafone') || code.includes('orange'))
      return <Smartphone className="w-8 h-8 text-white drop-shadow-sm" />;
    if (code.includes('bank') || code.includes('post') || code.includes('ziraat'))
      return <Building2 className="w-8 h-8 text-white drop-shadow-sm" />;
    if (code.includes('paypal') || code.includes('kaza'))
      return <Send className="w-8 h-8 text-white drop-shadow-sm" />;
    return <CreditCard className="w-8 h-8 text-white drop-shadow-sm" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-deposit-method={method.code}
      className="group relative flex flex-col items-center justify-between p-3.5 aspect-square rounded-3xl bg-gradient-to-br from-[#3eb8b0] to-[#2da89c] text-white shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden border border-white/20 select-none text-right"
    >
      {/* Top Badges */}
      <div className="w-full flex items-center justify-between gap-1">
        {method.type === 'invoice' ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-950 font-black text-[10px] shadow-xs">
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span>فوري</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold">
            يدوي
          </span>
        )}

        {method.discountPercent && method.discountPercent > 0 ? (
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px]">
            +{method.discountPercent}%
          </span>
        ) : null}
      </div>

      {/* Center Icon */}
      <div className="my-auto flex items-center justify-center">
        {method.iconUrl ? (
          <img
            src={method.iconUrl}
            alt={method.name}
            className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="transition-transform group-hover:scale-110">
            {getFallbackIcon(method.code)}
          </div>
        )}
      </div>

      {/* Bottom Name Badge */}
      <div className="w-full text-center px-1.5 py-1 rounded-xl bg-black/20 backdrop-blur-xs border border-white/10">
        <span className="block text-xs font-black text-white truncate tracking-tight">
          {method.name}
        </span>
      </div>
    </button>
  );
};

export default DepositMethodCard;
