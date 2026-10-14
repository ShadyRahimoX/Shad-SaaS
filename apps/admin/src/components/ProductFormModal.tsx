import React, { useState, useEffect } from 'react';
import {
  adminProductsApi,
  type AdminProduct,
  type RequiredField,
} from '../lib/products';
import { type AdminCategory } from '../lib/categories';
import { RequiredFieldsEditor } from './RequiredFieldsEditor';
import {
  X,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
  Layers,
  Server,
  Settings2,
} from 'lucide-react';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  categories: AdminCategory[];
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  product,
  categories,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [alkasrProductId, setAlkasrProductId] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [basePriceUsd, setBasePriceUsd] = useState('');
  const [productType, setProductType] = useState('package');
  const [minQty, setMinQty] = useState('1');
  const [maxQty, setMaxQty] = useState('');
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [available, setAvailable] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setCategoryId(product.categoryId || '');
      setAlkasrProductId(product.alkasrProductId !== null ? String(product.alkasrProductId) : '');
      setPriceUsd(product.priceUsd ? String(product.priceUsd) : '');
      setBasePriceUsd(product.basePriceUsd ? String(product.basePriceUsd) : '');
      setProductType(product.productType || 'package');
      setMinQty(product.minQty ? String(product.minQty) : '1');
      setMaxQty(product.maxQty ? String(product.maxQty) : '');
      setRequiredFields(Array.isArray(product.requiredFields) ? product.requiredFields : []);
      setAvailable(product.available !== false);
      setSortOrder(product.sortOrder || 0);

      // Fetch full details in edit mode in case list had partial data
      adminProductsApi
        .get(product.id)
        .then((res) => {
          if (res.success && res.data) {
            const p = res.data;
            setName(p.name || '');
            setDescription(p.description || '');
            setImageUrl(p.imageUrl || '');
            setCategoryId(p.categoryId || '');
            setAlkasrProductId(p.alkasrProductId !== null ? String(p.alkasrProductId) : '');
            setPriceUsd(p.priceUsd ? String(p.priceUsd) : '');
            setBasePriceUsd(p.basePriceUsd ? String(p.basePriceUsd) : '');
            setProductType(p.productType || 'package');
            setMinQty(p.minQty ? String(p.minQty) : '1');
            setMaxQty(p.maxQty ? String(p.maxQty) : '');
            setRequiredFields(Array.isArray(p.requiredFields) ? p.requiredFields : []);
            setAvailable(p.available !== false);
            setSortOrder(p.sortOrder || 0);
          }
        })
        .catch(() => {});
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setCategoryId(categories[0]?.id || '');
      setAlkasrProductId('');
      setPriceUsd('');
      setBasePriceUsd('');
      setProductType('package');
      setMinQty('1');
      setMaxQty('');
      setRequiredFields([]);
      setAvailable(true);
      setSortOrder(0);
    }
    setError(null);
  }, [product, open, categories]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 200) {
      setError('اسم المنتج يجب أن يتراوح بين 2 و 200 حرف');
      return;
    }

    if (!categoryId) {
      setError('يرجى تحديد قسم/تصنيف للمنتج');
      return;
    }

    const parsedPrice = Number(priceUsd);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('يرجى إدخال سعر بيع صالح أكبر من صفر');
      return;
    }

    if (basePriceUsd) {
      const parsedBase = Number(basePriceUsd);
      if (isNaN(parsedBase) || parsedBase < 0) {
        setError('يرجى إدخال سعر تكلفة صالح (أكبر من أو يساوي صفر)');
        return;
      }
    }

    // Validate required fields
    for (let i = 0; i < requiredFields.length; i++) {
      const f = requiredFields[i];
      if (!f.label || !f.label.trim()) {
        setError(`الحقل #${i + 1} يتطلب تحديد تسمية واضحة`);
        return;
      }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        setError(`حقل القائمة المنسدلة "${f.label}" يتطلب إدخال خيار واحد على الأقل`);
        return;
      }
    }

    const payload: Partial<AdminProduct> = {
      name: trimmedName,
      description: description.trim() || null,
      imageUrl: imageUrl.trim() || null,
      categoryId,
      alkasrProductId: alkasrProductId.trim() ? Number(alkasrProductId) : null,
      priceUsd: String(priceUsd).trim(),
      basePriceUsd: basePriceUsd.trim() ? String(basePriceUsd).trim() : String(priceUsd).trim(),
      productType: productType || 'package',
      minQty: minQty.trim() ? String(minQty).trim() : '1',
      maxQty: maxQty.trim() ? String(maxQty).trim() : null,
      requiredFields,
      available,
      sortOrder: Number(sortOrder) || 0,
    };

    setLoading(true);
    try {
      if (product) {
        const res = await adminProductsApi.update(product.id, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          if (res.error?.code === 'ALKASR_ID_TAKEN') {
            setError('معرف Alkasr مستخدم بالفعل لمنتج آخر');
          } else if (res.error?.code === 'CATEGORY_NOT_FOUND') {
            setError('الفئة المحددة غير موجودة');
          } else {
            setError(res.error?.message || 'فشل تحديث بيانات المنتج');
          }
        }
      } else {
        const res = await adminProductsApi.create(payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          if (res.error?.code === 'ALKASR_ID_TAKEN') {
            setError('معرف Alkasr مستخدم بالفعل لمنتج آخر');
          } else if (res.error?.code === 'CATEGORY_NOT_FOUND') {
            setError('الفئة المحددة غير موجودة');
          } else {
            setError(res.error?.message || 'فشل إنشاء المنتج الجديد');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  const calculatedProfit = () => {
    const p = Number(priceUsd) || 0;
    const b = basePriceUsd ? Number(basePriceUsd) || 0 : p;
    return (p - b).toFixed(4);
  };

  return (
    <div
      data-product-form-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {product
                  ? `تحديث إعدادات المنتج #${product.name}`
                  : 'إضافة منتج أو باقة جديدة لكتالوج المتجر'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-foreground border-b border-border/60 pb-2">
              <Package className="w-4 h-4 text-primary" />
              <span>المعلومات الأساسية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-foreground block">
                  اسم المنتج <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: 60 شدة ببجي، شحن جواهر فري فاير..."
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  القسم / التصنيف <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">اختر القسم...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.nameEn ? `(${c.nameEn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">رابط صورة المنتج (URL)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product.png"
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-foreground block">وصف المنتج (اختياري)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل المنتج، شروط الشحن، أو أي ملاحظات للمشتري..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-foreground border-b border-border/60 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>التسعير والأرباح (بالدولار الأمريكي USD)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  سعر البيع للعميل ($) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  placeholder="8.35"
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground">يدعم حتى 10 خانات عشرية بدقة عالية</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">سعر التكلفة من المزود ($)</label>
                <input
                  type="text"
                  value={basePriceUsd}
                  onChange={(e) => setBasePriceUsd(e.target.value)}
                  placeholder="7.59"
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground">إذا تُرِك فارغاً، تُعتبر التكلفة مساوية للسعر</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">صافي الربح المتوقع</label>
                <div
                  className="w-full h-10 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-black flex items-center"
                  dir="ltr"
                >
                  +${calculatedProfit()}
                </div>
                <p className="text-[10px] text-muted-foreground">يُحسب تلقائياً: سعر البيع - التكلفة</p>
              </div>
            </div>
          </div>

          {/* Section 3: Product Type & Quantities */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-foreground border-b border-border/60 pb-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>نوع المنتج والكميات</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">نوع المنتج</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value="package">باقة محددة (Package)</option>
                  <option value="specificPackage">باقة مخصصة (SpecificPackage)</option>
                  <option value="amount">شحن كمية/رصيد حر (Amount)</option>
                  <option value="custom">مخصص (Custom)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">أقل كمية للطلب (Min Qty)</label>
                <input
                  type="text"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">أقصى كمية للطلب (Max Qty)</label>
                <input
                  type="text"
                  value={maxQty}
                  onChange={(e) => setMaxQty(e.target.value)}
                  placeholder="اختياري (مثال: 100)"
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Provider Integration */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-foreground border-b border-border/60 pb-2">
              <Server className="w-4 h-4 text-blue-500" />
              <span>ربط المزود الخارجي (اختياري)</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">معرف المنتج عند Alkasr (ID)</label>
              <input
                type="number"
                value={alkasrProductId}
                onChange={(e) => setAlkasrProductId(e.target.value)}
                placeholder="اتركه فارغاً للمنتجات اليدوية"
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                في حال كان المنتج يتم تنفيذه آلياً عبر مزود Alkasr، أدخل رقم معرف المنتج
              </p>
            </div>
          </div>

          {/* Section 5: Required Fields Editor */}
          <div className="p-4 rounded-3xl bg-muted/20 border border-border/80">
            <RequiredFieldsEditor value={requiredFields} onChange={setRequiredFields} />
          </div>

          {/* Section 6: Settings & Sorting */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-foreground border-b border-border/60 pb-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <span>خيارات الظهور والترتيب</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
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

              <div className="pt-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
                  />
                  <span className="font-bold text-foreground">
                    إتاحة المنتج في المتجر (يظهر للعملاء ومتاح للشراء)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5 sticky bottom-0 bg-card/95 py-2">
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
              <span>{product ? 'حفظ التعديلات' : 'إضافة المنتج'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
