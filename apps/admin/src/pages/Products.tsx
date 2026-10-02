import React, { useEffect, useState } from 'react';
import {
  adminProductsApi,
  type AdminProduct,
  type ProductsStats,
} from '../lib/products';
import {
  adminCategoriesApi,
  type AdminCategory,
} from '../lib/categories';
import {
  Package,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Info,
  ShoppingCart,
} from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState<ProductsStats | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters state
  const [availableFilter, setAvailableFilter] = useState<'all' | 'true' | 'false'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price-asc' | 'price-desc'>('newest');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories once on mount
  useEffect(() => {
    adminCategoriesApi
      .list()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.error('Failed to load categories for dropdown:', err));
  }, []);

  const fetchProductsData = async (
    targetPage: number,
    avail: 'all' | 'true' | 'false',
    catId: string,
    type: string,
    sort: 'newest' | 'name' | 'price-asc' | 'price-desc',
    query: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminProductsApi.list({
          page: targetPage,
          limit,
          available: avail,
          categoryId: catId || undefined,
          productType: type || undefined,
          sortBy: sort,
          search: query || undefined,
        }),
        adminProductsApi.getStats(),
      ]);

      if (listRes.success && listRes.data) {
        setProducts(listRes.data.products);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب قائمة المنتجات');
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData(page, availableFilter, selectedCategory, selectedType, sortBy, appliedSearch);
  }, [page, availableFilter, selectedCategory, selectedType, sortBy, appliedSearch]);

  const handleAvailableFilterChange = (filter: 'all' | 'true' | 'false') => {
    setAvailableFilter(filter);
    setPage(1);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleSortChange = (sort: 'newest' | 'name' | 'price-asc' | 'price-desc') => {
    setSortBy(sort);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleDelete = async (prod: AdminProduct) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف المنتج "${prod.name}"؟`);
    if (!confirmed) return;

    try {
      const res = await adminProductsApi.remove(prod.id);
      if (res.success) {
        fetchProductsData(page, availableFilter, selectedCategory, selectedType, sortBy, appliedSearch);
      } else {
        if (res.error?.code === 'PRODUCT_HAS_ORDERS') {
          alert(`لا يمكن حذف المنتج — ${res.error.message || 'مرتبط بطلبات سابقة'}`);
        } else {
          alert(res.error?.message || 'فشل حذف المنتج');
        }
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف المنتج');
    }
  };

  const handleAddProductClick = () => {
    alert('إضافة المنتجات ستتوفر في الواجهة القادمة I-c-2-b');
  };

  const handleEditProductClick = (prod: AdminProduct) => {
    alert(`تعديل المنتج "${prod.name}" سيتوفر في الواجهة القادمة I-c-2-b`);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatPrice = (priceStr: string | number) => {
    const num = Number(priceStr) || 0;
    if (num < 0.01 && num > 0) {
      return `$${num.toFixed(6)}`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Package className="w-7 h-7 text-primary" />
            <span>إدارة المنتجات</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة وتخصيص أسعار المنتجات الرقمية، باقات الشحن، وأسعار التكلفة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs">
            <span>إجمالي المنتجات:</span>
            <span className="font-mono text-foreground font-black">{stats?.total ?? total}</span>
          </div>

          <button
            type="button"
            onClick={handleAddProductClick}
            className="px-5 py-2.5 rounded-2xl bg-primary hover:opacity-95 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        {/* Row 1: Availability Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleAvailableFilterChange('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              availableFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>الكل</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  availableFilter === 'all'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {stats.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleAvailableFilterChange('true')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              availableFilter === 'true'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>متاح</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  availableFilter === 'true'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {stats.available}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleAvailableFilterChange('false')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              availableFilter === 'false'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>غير متاح</span>
            {stats && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  availableFilter === 'false'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {stats.unavailable}
              </span>
            )}
          </button>
        </div>

        {/* Row 2: Category Dropdown, Type, Sort, and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="h-11 px-3.5 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
          >
            <option value="">كل الأقسام والتصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Product Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="h-11 px-3.5 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
          >
            <option value="">كل أنواع المنتجات</option>
            <option value="package">باقات محددة (Package)</option>
            <option value="specificPackage">باقة مخصصة (SpecificPackage)</option>
            <option value="amount">شحن كميات/أرصدة (Amount)</option>
            <option value="custom">مخصص (Custom)</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="h-11 px-3.5 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="name">ترتيب بالاسم أبجدياً</option>
            <option value="price-asc">السعر: من الأقل للأعلى</option>
            <option value="price-desc">السعر: من الأعلى للأقل</option>
          </select>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو المعرف..."
                className="w-full h-11 pr-9 pl-3 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
            >
              بحث
            </button>
          </form>
        </div>
      </div>

      {/* Products Grid / Cards List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل المنتجات...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد منتجات مطابقة</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي منتجات تطابق معايير الفلترة المحددة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {products.map((prod) => (
              <div
                key={prod.id}
                data-product-row
                className="p-4 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail 64x64 */}
                  <div className="w-16 h-16 rounded-2xl bg-muted border border-border shrink-0 flex items-center justify-center overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-7 h-7 text-primary/70" />
                    )}
                  </div>

                  {/* Middle Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-foreground truncate" title={prod.name}>
                      {prod.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-lg truncate">
                        {prod.categoryName || 'بدون قسم'}
                      </span>
                      {prod.alkasrProductId && (
                        <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                          #{prod.alkasrProductId}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {prod.available ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>متاح</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                          <XCircle className="w-3 h-3" />
                          <span>غير متاح</span>
                        </span>
                      )}

                      {prod.requiredFields && prod.requiredFields.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Info className="w-3 h-3" />
                          <span>يتطلب بيانات</span>
                        </span>
                      )}

                      {prod.ordersCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{prod.ordersCount} طلب</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Financials & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-base font-black text-foreground font-mono" dir="ltr">
                      {formatPrice(prod.priceUsd)}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono" dir="ltr">
                      +{formatPrice(prod.profitUsd)} ربح
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditProductClick(prod)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="تعديل المنتج"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(prod)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              عرض <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> إلى{' '}
              <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> من{' '}
              <span className="font-bold text-foreground">{total}</span> منتج
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-bold">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>التالي</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
