import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { productsApi, type Category, type Product } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { ArrowRight, Layers, Loader2, AlertCircle } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const [, params] = useRoute('/category/:slug');
  const slug = params?.slug || '';

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setPage(1);

    async function loadData() {
      try {
        const catRes = await productsApi.getCategory(slug);
        if (!catRes.success || !catRes.data) {
          if (isMounted) setError('الفئة غير موجودة');
          return;
        }

        if (isMounted) setCategory(catRes.data);

        const prodRes = await productsApi.getProducts({
          category: slug,
          search: searchTerm || undefined,
          page: 1,
          limit: 16,
        });

        if (isMounted) {
          if (prodRes.success && prodRes.data) {
            setProducts(prodRes.data.products);
            setTotal(prodRes.data.total);
          } else {
            setProducts([]);
            setTotal(0);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات الفئة والمنتجات');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle local search in category
  const handleSearch = async () => {
    setLoading(true);
    setPage(1);
    try {
      const prodRes = await productsApi.getProducts({
        category: slug,
        search: searchTerm || undefined,
        page: 1,
        limit: 16,
      });
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products);
        setTotal(prodRes.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await productsApi.getProducts({
        category: slug,
        search: searchTerm || undefined,
        page: nextPage,
        limit: 16,
      });
      if (res.success && res.data) {
        setProducts((prev) => [...prev, ...res.data!.products]);
        setPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading && !category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">جاري تحميل المنتجات...</span>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">{error || 'الفئة غير موجودة'}</h2>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى جميع الأقسام</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{category.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                إجمالي المنتجات المتاحة: {total}
              </p>
            </div>
          </div>

          {/* Local Search Input */}
          <div className="w-full sm:w-72">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearch}
              placeholder="ابحث داخل هذا القسم..."
            />
          </div>
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {products.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination: Load More */}
          {products.length < total && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <span>عرض المزيد ({total - products.length} متبقي)</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-border bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">لا توجد منتجات في هذه الفئة</h3>
          <p className="text-xs text-muted-foreground">
            {searchTerm ? 'لم يتم العثور على نتائج تطابق بحثك.' : 'سيتم إضافة منتجات وبطاقات جديدة قريباً لهذا القسم.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
