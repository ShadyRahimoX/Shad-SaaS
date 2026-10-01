/**
 * Profit-Protected VIP Calculator
 *
 * كيف يعمل:
 * 1. خصم على الجزء العشري فقط (cent-discount)
 * 2. حماية الربح (profit floor) — لا نبيع بأقل من base × (1 + floor%)
 * 3. كاش باك يُعاد للمستخدم
 */

export interface VipLevel {
  levelNumber: number;
  centDiscountPercent: number;   // 0-100
  profitFloorPercent: number;    // 0-100 (حد أدنى للربح)
  cashbackPercent: number;       // 0-100
}

export interface VipPriceResult {
  originalPrice: number;         // السعر الأصلي
  userPrice: number;             // السعر النهائي للمستخدم بعد الخصم
  cashback: number;              // المبلغ المُعاد للمحفظة
  netPrice: number;              // userPrice - cashback (ما دفعه فعلياً)
  sellerProfit: number;          // ربحك النهائي
  appliedDiscount: number;       // قيمة الخصم المطبق
  appliedDiscountPercent: number; // % الخصم الفعلي
  basePrice: number;             // تكلفة Alkasr
  floorApplied: boolean;         // هل تم تطبيق الحد الأدنى؟
}

/**
 * الخصم الذكي:
 * - يفصل السعر إلى: عدد صحيح + عشري
 * - يطبق الخصم على العشري فقط
 * - يجمع النتيجة
 *
 * مثال: price=1.10, disc=10%
 *   int = 1
 *   dec = 0.10
 *   discAmt = 10% × 0.10 = 0.01
 *   result = 1 + (0.10 - 0.01) = 1.09
 */
export function applyCentDiscount(price: number, discountPercent: number): number {
  if (discountPercent <= 0) return price;
  if (discountPercent >= 100) return Math.floor(price); // 100% = نطرد العشري بالكامل

  const intPart = Math.floor(price);
  const decPart = price - intPart;
  const discountAmount = decPart * (discountPercent / 100);

  return Number((intPart + decPart - discountAmount).toFixed(10));
}

/**
 * الحساب الكامل مع Profit Floor + Cashback
 */
export function calculateVipPrice(
  priceUsd: number,
  basePriceUsd: number,
  level: VipLevel
): VipPriceResult {
  // 1. طبّق cent-discount
  const centDiscounted = applyCentDiscount(priceUsd, level.centDiscountPercent);

  // 2. احسب الحد الأدنى المسموح (profit floor)
  const minAllowed = Number(
    (basePriceUsd * (1 + level.profitFloorPercent / 100)).toFixed(10)
  );

  // 3. اختر الأكبر بين السعر المُخصَّم والحد الأدنى
  const finalPrice = Math.max(centDiscounted, minAllowed);
  const floorApplied = centDiscounted < minAllowed;

  // 4. احسب الكاش باك (على السعر النهائي)
  const cashback = Number(
    (finalPrice * (level.cashbackPercent / 100)).toFixed(10)
  );

  // 5. الحسابات النهائية
  const appliedDiscount = Number((priceUsd - finalPrice).toFixed(10));
  const appliedDiscountPercent = priceUsd > 0
    ? Number(((appliedDiscount / priceUsd) * 100).toFixed(2))
    : 0;

  const sellerProfit = Number((finalPrice - basePriceUsd).toFixed(10));
  const netPrice = Number((finalPrice - cashback).toFixed(10));

  return {
    originalPrice: Number(priceUsd.toFixed(10)),
    userPrice: Number(finalPrice.toFixed(10)),
    cashback,
    netPrice,
    sellerProfit,
    appliedDiscount,
    appliedDiscountPercent,
    basePrice: Number(basePriceUsd.toFixed(10)),
    floorApplied,
  };
}
