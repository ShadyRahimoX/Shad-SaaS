import React, { useEffect, useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { productsApi, type Product, type Category } from '../lib/products';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { useSettings } from '../lib/settings';
import { formatCurrency } from '../lib/utils';
import {
  ArrowRight,
  Package,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const [, params] = useRoute('/product/:slug');
  const slugOrId = params?.slug || '';
  const [, setLocation] = useLocation();

  const { user } = useAuth();
  const { addItem } = useCart();
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadProduct() {
      try {
        const res = await productsApi.getProduct(slugOrId);
        if (!res.success || !res.data) {
          if (isMounted) setError('المنتج المطلوب غير موجود أو تم حذفه');
          return;
        }

        if (isMounted) {
          setProduct(res.data);
          // Load category details if categoryId is present
          if (res.data.categoryId) {
            productsApi.getCategory(res.data.categoryId).then((catRes) => {
              if (catRes.success && catRes.data && isMounted) {
                setCategory(catRes.data);
              }
            });
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات المنتج');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slugOrId]);

  const handlePurchase = () => {
    if (!user) {
      // Redirect to login if user is logged out
      setLocation('/login');
      return;
    }

    if (!product) return;

    addItem({
      productId: product.id,
      name: product.name,
      priceUsd: product.priceUsd,
      imageUrl: product.imageUrl,
      requiredFields: product.requiredFields,
      minQty: product.minQty,
      maxQty: product.maxQty,
    });

    alert('تمت الإضافة للسلة');
    setLocation('/cart');
  };

  const handleFavorite = () => {
    alert('تمت إضافة المنتج إلى المفضلة بنجاح!');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">جاري تحميل تفاصيل المنتج...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">{error || 'المنتج غير موجود'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    );
  }

  const formattedPrice = formatCurrency(product.priceUsd, currencySymbol);
  const formattedComparePrice = product.compareAtPriceUsd
    ? formatCurrency(product.compareAtPriceUsd, currencySymbol)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      {/* Back Link */}
      <div>
        <Link
          href={category ? `/category/${category.slug}` : '/'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{category ? `العودة إلى ${category.name}` : 'العودة للرئيسية'}</span>
        </Link>
      </div>

      {/* Main Product Card 2 Cols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Visual / Image Side */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative aspect-square w-full max-w-md rounded-2xl bg-gradient-to-br from-muted/60 via-primary/5 to-muted/40 border border-border/80 overflow-hidden flex items-center justify-center shadow-inner">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Package className="w-24 h-24 stroke-1 mb-3 text-primary/60" />
                <span className="font-extrabold text-base text-foreground/80 max-w-xs">{product.name}</span>
                <span className="text-xs text-muted-foreground mt-1">منتج رقمي معتمد</span>
              </div>
            )}

            {/* Discount Badge */}
            {formattedComparePrice && product.available && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
                تخفيض حصري
              </div>
            )}
          </div>
        </div>

        {/* Product Details Side */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category badge & Stock status */}
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link
                  href={`/category/${category.slug}`}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {category.name}
                </Link>
              )}

              {product.available ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{product.stock ? `متوفر (${product.stock})` : 'متوفر للتسليم الفوري'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>غير متوفر حالياً</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <span className="text-3xl sm:text-4xl font-black text-primary tracking-tight" dir="ltr">
                {formattedPrice}
              </span>
              {formattedComparePrice && (
                <span className="text-base text-muted-foreground line-through" dir="ltr">
                  {formattedComparePrice}
                </span>
              )}
            </div>

            {/* Required fields indicator badge */}
            {product.requiredFields && product.requiredFields.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
                <span>⚠️ يتطلب معلومات إضافية</span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">تفاصيل ومميزات المنتج:</h3>
              <p className="whitespace-pre-line">
                {product.description || 'هذا المنتج يتم تسليمه وشحنه بشكل فوري وآلي عبر النظام بعد إتمام الطلب.'}
              </p>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 text-muted-foreground">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>شحن وتفعيل فوري</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>ضمان رسمي 100%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={!product.available}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{user ? 'شراء الآن' : 'تسجيل الدخول للشراء'}</span>
            </button>

            <button
              type="button"
              onClick={handleFavorite}
              className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-muted-foreground hover:text-red-500"
            >
              <Heart className="w-4 h-4 text-red-500" />
              <span>إضافة إلى قائمة المفضلة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
