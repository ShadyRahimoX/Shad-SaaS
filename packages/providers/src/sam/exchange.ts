/**
 * أسعار الصرف الحالية — ستُحدَّث من DB في E3b.
 * الآن: قيم ثابتة للاختبار.
 */
export const USD_TO_SYP = 15000;
export const USD_TO_TRY = 35;
export const USD_TO_EUR = 0.92;

export function convertToUsd(amount: number, currency: string): number {
  const cur = currency.toUpperCase();
  switch (cur) {
    case 'USD': return amount;
    case 'SYP': return amount / USD_TO_SYP;
    case 'TRY': return amount / USD_TO_TRY;
    case 'EUR': return amount / USD_TO_EUR;
    default: throw new Error(`Unsupported currency: ${currency}`);
  }
}

export function convertFromUsd(amount: number, currency: string): number {
  const cur = currency.toUpperCase();
  switch (cur) {
    case 'USD': return amount;
    case 'SYP': return amount * USD_TO_SYP;
    case 'TRY': return amount * USD_TO_TRY;
    case 'EUR': return amount * USD_TO_EUR;
    default: throw new Error(`Unsupported currency: ${currency}`);
  }
}
