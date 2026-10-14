import React, { useState, useEffect } from 'react';
import { adminInventoryApi, type InventoryItem } from '../lib/inventory';
import { X, Loader2, AlertCircle, Boxes, Check } from 'lucide-react';

interface StockEditorModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export const StockEditorModal: React.FC<StockEditorModalProps> = ({
  open,
  onClose,
  item,
  onSuccess,
}) => {
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [stockInput, setStockInput] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) return;

    if (item.stock === null) {
      setIsUnlimited(true);
      setStockInput('0');
    } else {
      setIsUnlimited(false);
      setStockInput(String(item.stock));
    }
    setNote('');
    setError(null);
  }, [open, item]);

  if (!open || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalStock: number | null = null;
    if (!isUnlimited) {
      const parsed = parseInt(stockInput, 10);
      if (isNaN(parsed) || parsed < 0) {
        setError('يرجى إدخال كمية صحيحة أكبر من أو تساوي 0');
        return;
      }
      finalStock = parsed;
    }

    setLoading(true);
    try {
      const res = await adminInventoryApi.setStock(item.id, finalStock, note.trim() || undefined);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'فشل تحديث المخزون');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-stock-editor-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-foreground truncate" title={item.name}>
                {item.name}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                المخزون الحالي:{' '}
                <span className="font-bold font-mono text-foreground">
                  {item.stock === null ? 'غير محدود' : item.stock}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unlimited checkbox */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
                className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
              />
              <div>
                <span className="font-bold text-foreground block">
                  مخزون غير محدود (بدون متابعة)
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  مناسب للمنتجات الرقمية التي يتم توفيرها تلقائياً عبر مزود خارجي
                </span>
              </div>
            </label>
          </div>

          {/* Stock Input (if not unlimited) */}
          {!isUnlimited && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="font-bold text-foreground block">
                الكمية المتوفرة حالياً <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required={!isUnlimited}
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                placeholder="0"
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                عند وصول الكمية إلى 5 قطع أو أقل سيتم تصنيف المنتج كـ "منخفض المخزون"
              </p>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">ملاحظة التعديل (اختياري)</label>
            <textarea
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب تعديل المخزون (مثال: توريد شحنة جديدة، تصحيح جرد...)"
              className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary hover:opacity-95 text-primary-foreground font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>حفظ المخزون</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockEditorModal;
