import React, { useEffect, useState, useMemo } from 'react';
import {
  adminCategoriesApi,
  type AdminCategory,
} from '../lib/categories';
import { CategoryModal } from '../components/CategoryModal';
import {
  FolderTree,
  Folder,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  CornerDownLeft,
  Package,
  EyeOff,
  Layers,
} from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCategoriesApi.list({
        search: appliedSearch || undefined,
        active: activeFilter,
      });

      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setError(res.error?.message || 'فشل جلب قائمة الأقسام');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeFilter, appliedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleDelete = async (cat: AdminCategory) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف القسم "${cat.name}"؟`);
    if (!confirmed) return;

    try {
      const res = await adminCategoriesApi.remove(cat.id);
      if (res.success) {
        fetchCategories();
      } else {
        const code = res.error?.code;
        if (code === 'CATEGORY_HAS_PRODUCTS') {
          alert('لا يمكن حذف قسم يحتوي على منتجات. يرجى نقل أو حذف المنتجات أولاً.');
        } else if (code === 'CATEGORY_HAS_CHILDREN') {
          alert('لا يمكن حذف قسم رئيسي يحتوي على أقسام فرعية. احذف الفئات الفرعية أولاً.');
        } else {
          alert(res.error?.message || 'فشل حذف القسم');
        }
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف القسم');
    }
  };

  // Build Hierarchical flat list (Roots followed by their children)
  const hierarchicalList = useMemo(() => {
    if (appliedSearch) {
      // When searching, display flat matches directly
      return categories.map((cat) => ({ ...cat, isChild: Boolean(cat.parentId) }));
    }

    const roots: AdminCategory[] = [];
    const childrenMap = new Map<string, AdminCategory[]>();

    categories.forEach((cat) => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        const list = childrenMap.get(cat.parentId) || [];
        list.push(cat);
        childrenMap.set(cat.parentId, list);
      }
    });

    const result: Array<AdminCategory & { isChild: boolean }> = [];
    roots.forEach((root) => {
      result.push({ ...root, isChild: false });
      const children = childrenMap.get(root.id);
      if (children && children.length > 0) {
        children.forEach((child) => {
          result.push({ ...child, isChild: true });
        });
      }
    });

    // Also include any orphan children whose parent wasn't in roots
    categories.forEach((cat) => {
      if (cat.parentId && !roots.some((r) => r.id === cat.parentId)) {
        result.push({ ...cat, isChild: true });
      }
    });

    return result;
  }, [categories, appliedSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-primary" />
            <span>إدارة الأقسام</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            تنظيم وتصنيف المنتجات في أقسام رئيسية وفرعية لتسهيل تصفح المتجر
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-primary hover:opacity-95 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>الكل ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('true')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'true'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>النشطة فقط</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('false')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === 'false'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>المخفية فقط</span>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم القسم أو الـ slug..."
              className="w-full h-10 pr-9 pl-4 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل الأقسام...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : hierarchicalList.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
          <FolderTree className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد أقسام مطابقة</h3>
          <p className="text-xs text-muted-foreground">
            لم يتم العثور على أي أقسام تطابق الفلتر أو البحث.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {hierarchicalList.map((cat) => (
            <div
              key={cat.id}
              data-category-row
              className={`p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                cat.isChild ? 'mr-6 sm:mr-10 border-r-4 border-r-primary/40 bg-muted/20' : ''
              }`}
            >
              {/* Left Side: Thumbnail & Names */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {cat.isChild && (
                  <CornerDownLeft className="w-4 h-4 text-muted-foreground/60 shrink-0 hidden sm:block" />
                )}

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-muted border border-border shrink-0 flex items-center justify-center overflow-hidden">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Folder className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Name and Meta */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-foreground truncate">
                      {cat.name}
                    </span>
                    {cat.nameEn && (
                      <span className="text-[11px] text-muted-foreground font-medium truncate" dir="ltr">
                        ({cat.nameEn})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap font-mono">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]" dir="ltr">
                      /{cat.slug}
                    </span>
                    {cat.iconName && <span>• أيقونة: {cat.iconName}</span>}
                    <span>• ترتيب: {cat.sortOrder}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Badges & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-border/50 pt-2 sm:pt-0">
                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cat.childrenCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Layers className="w-3 h-3" />
                      <span>{cat.childrenCount} فرعي</span>
                    </span>
                  )}

                  {cat.productsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Package className="w-3 h-3" />
                      <span>{cat.productsCount} منتج</span>
                    </span>
                  )}

                  {!cat.active && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                      <EyeOff className="w-3 h-3" />
                      <span>مخفية</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="تعديل القسم"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editingCategory}
        parentOptions={categories}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default Categories;
