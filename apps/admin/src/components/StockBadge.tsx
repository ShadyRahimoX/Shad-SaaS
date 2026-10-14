import React from 'react';
import { type StockStatus } from '../lib/inventory';
import { Infinity as InfinityIcon, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockBadgeProps {
  stock: number | null;
  stockStatus: StockStatus;
  size?: 'sm' | 'md';
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  stockStatus,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const padding = isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (stockStatus === 'unlimited') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-muted text-muted-foreground border border-border ${padding}`}
      >
        <InfinityIcon className={iconSize} />
        <span>غير محدود</span>
      </span>
    );
  }

  if (stockStatus === 'out') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${padding}`}
      >
        <XCircle className={iconSize} />
        <span>نفد المخزون</span>
      </span>
    );
  }

  if (stockStatus === 'low') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${padding}`}
      >
        <AlertTriangle className={iconSize} />
        <span>
          <strong className="font-mono">{stock ?? 0}</strong> متبقي (منخفض)
        </span>
      </span>
    );
  }

  // ok
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${padding}`}
    >
      <CheckCircle2 className={iconSize} />
      <span>
        <strong className="font-mono">{stock ?? 0}</strong> متبقي
      </span>
    </span>
  );
};

export default StockBadge;
