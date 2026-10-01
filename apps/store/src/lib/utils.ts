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

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
