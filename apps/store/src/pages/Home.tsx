import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSettings } from '../lib/settings';
import { productsApi, type Category } from '../lib/products';
import { CategoryCard } from '../components/CategoryCard';
import { SearchBar } from '../components/SearchBar';
import { MessageCircle, Sparkles, Heart, AlertCircle, RefreshCw } from 'lucide-react';

export const Home: React.FC = () => {
  const { settings } = useSettings();
  const [, setLocation] = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.getCategories();
      if (res.success && res.data) {
        // Top-level categories only (parentId === null or undefined)
        const topLevel = res.data.filter((c) => !c.parentId);
        setCategories(topLevel);
      } else {
        setError(res.error?.message || 'فشل تحميل الأقسام');
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    // Find matching category or pick first top category
    const foundCategory = categories.find((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (foundCategory) {
      setLocation(`/category/${foundCategory.slug}`);
    } else if (categories.length > 0) {
      setLocation(`/category/${categories[0].slug}`);
    }
  };

  const whatsappPhone =
    settings.branding_whatsapp_business ||
    settings.branding_contact_phone ||
    '';

  const handleWhatsAppJoin = () => {
    if (whatsappPhone) {
      window.open(`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  // Filtered categories if search is actively typed
  const displayedCategories = searchQuery.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" dir="rtl">
      {/* 1. WhatsApp Banner (Image #1) - Only if WhatsApp configured */}
      {whatsappPhone && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-right">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <MessageCircle className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="space-y-1">
                <h2 className="font-extrabold text-base sm:text-lg">
                  انضم إلى قناة الواتساب للإطلاع على الأسعار والتحديثات
                </h2>
                <p className="text-xs text-white/80">
                  تحديثات الأسعار الفورية، العروض الحصرية، والدعم الفني المباشر
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppJoin}
              className="px-6 py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-xs sm:text-sm hover:bg-white/90 shadow-md transition-all shrink-0 cursor-pointer"
            >
              انضم الآن
            </button>
          </div>
          {/* Decorative backdrop glow */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        </section>
      )}

      {/* 2. Welcome Banner (Image #2) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-card border border-border/80 p-6 sm:p-10 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مرحباً بكم في {settings.site_name || 'Shad Store'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              أهلاً وسهلاً بكم
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
              {settings.site_description || 'أفضل وأسرع منصة لشحن الألعاب، الاشتراكات والبطاقات الرقمية.'}
            </p>
          </div>

          <div className="hidden sm:flex w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-accent items-center justify-center text-white font-extrabold text-3xl shadow-xl">
            S
          </div>
        </div>
      </section>

      {/* 3. Tagline + Heart */}
      <div className="flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
        <span>كل خدماتك الرقمية في مكان واحد عبر منصة {settings.site_name || 'Shad Store'}</span>
        <Heart className="w-4 h-4 text-red-500 fill-red-500 inline-block animate-pulse" />
      </div>

      {/* 4. SearchBar */}
      <div className="py-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="ابحث عن القسم أو البطاقة التي تريدها..."
        />
      </div>

      {/* 5. Categories Grid Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">الأقسام المتاحة</h2>
          <span className="text-xs text-muted-foreground font-medium">
            {displayedCategories.length} قسم رقمي
          </span>
        </div>

        {/* 6. Loading state: skeleton placeholders */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-3xl bg-muted/60 animate-pulse border border-border/50"
              />
            ))}
          </div>
        )}

        {/* 7. Error state */}
        {!loading && error && (
          <div className="p-8 text-center rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-bold text-sm">{error}</p>
            <button
              type="button"
              onClick={loadCategories}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-bold hover:bg-muted cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && displayedCategories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}

        {/* Empty search */}
        {!loading && !error && displayedCategories.length === 0 && (
          <div className="p-12 text-center rounded-3xl border-2 border-dashed border-border text-muted-foreground space-y-2">
            <p className="font-bold text-sm">لم يتم العثور على أي قسم يطابق: &quot;{searchQuery}&quot;</p>
            <p className="text-xs">جرّب البحث بكلمات أخرى أو تصفح الأقسام الرئيسية.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
