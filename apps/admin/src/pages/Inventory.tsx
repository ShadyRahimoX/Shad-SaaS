import React, { useEffect, useState } from 'react';
import {
  adminInventoryApi,
  type InventoryItem,
  type InventoryStats,
  type InventoryFilter,
} from '../lib/inventory';
import { adminCategoriesApi, type AdminCategory } from '../lib/categories';
import { StockBadge } from '../components/StockBadge';
import { StockEditorModal } from '../components/StockEditorModal';
import {
  Boxes,
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Edit3,
  ShoppingCart,
  Package,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters state
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Stock Editor Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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
      .catch((err) => console.error('Failed to load categories for inventory:', err));
  }, []);

  const fetchInventoryData = async (
    targetPage: number,
    targetFilter: InventoryFilter,
    catId: string,
    query: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminInventoryApi.list({
          page: targetPage,
          limit,
          filter: targetFilter,
          categoryId: catId || undefined,
          search: query || undefined,
        }),
        adminInventoryApi.getStats(),
      ]);

      if (listRes.success && listRes.data) {
        setItems(listRes.data.products);
        setTotal(listRes.data.total);
      } else {
        setError(listRes.error?.message || 'فشل جلب بيانات المخزون');
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
    fetchInventoryData(page, filter, selectedCategory, appliedSearch);
  }, [page, filter, selectedCategory, appliedSearch]);

  const handleFilterChange = (newFilter: InventoryFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleEditStock = (item: InventoryItem) => {
    setEditingItem(item);
    setModalOpen(true);
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
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-primary" />
            <span>منتجات المخزون</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            متابعة وضبط كميات المخزون المتوفرة للمنتجات الرقمية والبطاقات اليدوية
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-2xl shadow-xs shrink-0">
          <span>إجمالي المنتجات:</span>
          <span className="font-mono text-foreground font-black">{stats?.total ?? total}</span>
        </div>
      </div>

      {/* Stats Chips (5 filter tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* All */}
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>الكل</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filter === 'all'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {stats.total}
            </span>
          )}
        </button>

        {/* Tracked */}
        <button
          type="button"
          onClick={() => handleFilterChange('tracked')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'tracked'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>متتبَّع</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filter === 'tracked'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {stats.tracked}
            </span>
          )}
        </button>

        {/* Unlimited */}
        <button
          type="button"
          onClick={() => handleFilterChange('unlimited')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'unlimited'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>غير محدود</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filter === 'unlimited'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {stats.unlimited}
            </span>
          )}
        </button>

        {/* Low Stock */}
        <button
          type="button"
          onClick={() => handleFilterChange('low')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'low'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-card border border-border/80 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <span>منخفض</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filter === 'low'
                  ? 'bg-black/20 text-white'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              {stats.lowStock}
            </span>
          )}
        </button>

        {/* Out of Stock */}
        <button
          type="button"
          onClick={() => handleFilterChange('out')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'out'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-card border border-border/80 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <span>نفد</span>
          {stats && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filter === 'out'
                  ? 'bg-black/20 text-white'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              {stats.outOfStock}
            </span>
          )}
        </button>
      </div>

      {/* Filters Row: Category Dropdown + Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

        <form onSubmit={handleSearchSubmit} className="sm:col-span-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو معرف المنتج..."
              className="w-full h-11 pr-9 pl-3 rounded-2xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Inventory List (Full width cards) */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل المخزون...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد منتجات مطابقة في المخزون</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي منتجات تطابق معايير البحث والفلترة المحددة.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              data-inventory-row
              className="p-4 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-muted border border-border shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-primary/70" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-foreground truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <StockBadge stock={item.stock} stockStatus={item.stockStatus} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-lg truncate">
                      {item.categoryName || 'بدون قسم'}
                    </span>
                    {item.alkasrProductId && (
                      <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                        #{item.alkasrProductId}
                      </span>
                    )}
                    {item.ordersCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <ShoppingCart className="w-3 h-3" />
                        <span>{item.ordersCount} طلب</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex sm:flex-row items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                <div className="text-right">
                  <div className="text-sm font-black text-foreground font-mono" dir="ltr">
                    {formatPrice(item.priceUsd)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">سعر البيع</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleEditStock(item)}
                  className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل المخزون</span>
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
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

      {/* Stock Editor Modal */}
      <StockEditorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editingItem}
        onSuccess={() => {
          fetchInventoryData(page, filter, selectedCategory, appliedSearch);
        }}
      />
    </div>
  );
};

export default Inventory;
