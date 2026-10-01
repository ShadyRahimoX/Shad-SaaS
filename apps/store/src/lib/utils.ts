import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(usdValue: string | number, symbol = '$'): string {
  const n = typeof usdValue === 'string' ? parseFloat(usdValue) : usdValue;
  if (isNaN(n)) return `${symbol}0.00`;
  return `${symbol}${n.toFixed(2)}`;
}

export function formatDate(date: string | Date | null | undefined, withTime = true): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const dateStr = d.toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  if (!withTime) return dateStr;
  const timeStr = d.toLocaleTimeString('ar-SY', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} ${timeStr}`;
}

export function formatCountdown(secondsRemaining: number): string {
  const s = Math.max(0, Math.floor(secondsRemaining));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
