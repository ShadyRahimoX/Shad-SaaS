import React, { useState, useEffect } from 'react';
import {
  adminCategoriesApi,
  type AdminCategory,
  type CreateCategoryInput,
} from '../lib/categories';
import { X, Loader2, AlertCircle, Sparkles, FolderTree } from 'lucide-react';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: AdminCategory | null;
  parentOptions: AdminCategory[];
  onSuccess: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  onClose,
  category,
  parentOptions,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [iconName, setIconName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setNameEn(category.nameEn || '');
      setSlug(category.slug);
      setParentId(category.parentId || '');
      setImageUrl(category.imageUrl || '');
      setIconName(category.iconName || '');
      setSortOrder(category.sortOrder);
      setActive(category.active);
    } else {
      setName('');
      setNameEn('');
      setSlug('');
      setParentId('');
      setImageUrl('');
      setIconName('');
      setSortOrder(0);
      setActive(true);
    }
    setError(null);
  }, [category, open]);

  if (!open) return null;

  const handleGenerateSlug = () => {
    const raw = (nameEn || name)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    const formatted = raw ? (raw.match(/^[a-z]/) ? raw : `cat-${raw}`).slice(0, 50) : 'cat-new';
    setSlug(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('اسم القسم يجب ألا يقل عن حرفين');
      return;
    }

    const trimmedSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z][a-z0-9-]{1,50}$/;
    if (!slugRegex.test(trimmedSlug)) {
      setError('معرّف الرابط (Slug) يجب أن يبدأ بحرف إنجليزي صغير ويحوي فقط أحرفاً وأرقاماً وشرطات (2-50 حرف)');
      return;
    }

    const payload: CreateCategoryInput = {
      name: trimmedName,
      nameEn: nameEn.trim() || null,
      slug: trimmedSlug,
      parentId: parentId ? parentId : null,
      imageUrl: imageUrl.trim() || null,
      iconName: iconName.trim() || null,
      sortOrder: Number(sortOrder) || 0,
      active,
    };

    setLoading(true);
    try {
      if (category) {
        const res = await (adminCategoriesApi as any).update(category.id, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error?.message || 'فشل تحديث بيانات القسم');
        }
      } else {
        const res = await (adminCategoriesApi as any).create(payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error?.message || 'فشل إنشاء القسم الجديد');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Filter valid parent options (exclude self)
  const validParents = parentOptions.filter((p) => !category || p.id !== category.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {category ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {category ? `تحديث إعدادات القسم #${category.name}` : 'إنشاء قسم جديد في الهيكل التنظيمي للمنتجات'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name (AR) */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              اسم القسم (عربي) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: بطاقات الألعاب، شحن رصيد..."
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Name (EN) */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">اسم القسم (إنجليزي - اختياري)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Gaming Cards, Direct Topup..."
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground">
                معرّف الرابط (Slug) <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>توليد تلقائي</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. gaming-cards"
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-left"
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground">
              أحرف إنجليزية صغيرة، أرقام، وشرطات فقط — يبدأ بحرف (مثال: pubg-mobile).
            </p>
          </div>

          {/* Parent Category */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">القسم الأب (التصنيف الرئيسي)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <option value="">بدون قسم أب (قسم رئيسي أعلى)</option>
              {validParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.nameEn ? `(${p.nameEn})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">رابط صورة القسم (Image URL)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/category-banner.png"
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
          </div>

          {/* Icon Name + Sort Order Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">اسم الأيقونة (Lucide Icon)</label>
              <input
                type="text"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="e.g. Gamepad2, Gift, Phone"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">ترتيب الظهور (Sort Order)</label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
              />
              <span className="font-bold text-foreground">تفعيل القسم (ظاهر للعملاء في المتجر)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-95 text-primary-foreground font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{category ? 'حفظ التعديلات' : 'إنشاء القسم'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
