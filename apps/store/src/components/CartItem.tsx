import React from 'react';
import { type CartItem as CartItemType, useCart } from '../lib/cart';
import { formatCurrency } from '../lib/utils';
import { useSettings } from '../lib/settings';
import { Package, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onChange?: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onChange }) => {
  const { updateQuantity, removeItem } = useCart();
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const priceNum = parseFloat(item.priceUsd) || 0;
  const totalItemPrice = priceNum * item.quantity;

  const minQ = item.minQty ? Math.max(1, parseInt(item.minQty, 10)) : 1;
  const maxQ = item.maxQty ? parseInt(item.maxQty, 10) : Infinity;

  // Check if item needs required fields that are not filled yet
  const hasFields = Array.isArray(item.requiredFields) && item.requiredFields.length > 0;
  const filledCount = Object.keys(item.requiredFieldsData || {}).length;
  const needsInfo = (hasFields && filledCount === 0) || !item.playerId;

  const handleIncrement = () => {
    if (item.quantity < maxQ) {
      updateQuantity(item.productId, item.quantity + 1);
      onChange?.();
    }
  };

  const handleDecrement = () => {
    if (item.quantity > minQ) {
      updateQuantity(item.productId, item.quantity - 1);
      onChange?.();
    } else {
      removeItem(item.productId);
      onChange?.();
    }
  };

  const handleDelete = () => {
    removeItem(item.productId);
    onChange?.();
  };

  return (
    <div
      data-cart-item
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs transition-colors"
      dir="rtl"
    >
      {/* Right side: Thumbnail + Name + Badge */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/70 overflow-hidden flex items-center justify-center shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-8 h-8 text-primary/70" />
          )}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-sm">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>سعر الوحدة:</span>
            <span className="font-semibold text-primary" dir="ltr">
              {formatCurrency(item.priceUsd, currencySymbol)}
            </span>
          </div>

          {needsInfo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              <span>⚠️ يحتاج معلومات</span>
            </span>
          )}
        </div>
      </div>

      {/* Left side: Quantity + Total + Delete */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-1 border border-border/60">
          <button
            type="button"
            onClick={handleDecrement}
            className="w-7 h-7 rounded-lg bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="تقليل الكمية"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-8 text-center font-bold text-sm" dir="ltr">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={item.quantity >= maxQ}
            className="w-7 h-7 rounded-lg bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
            aria-label="زيادة الكمية"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Item Total Price */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-muted-foreground">الإجمالي:</span>
          <span className="font-black text-sm sm:text-base text-primary tracking-tight" dir="ltr">
            {formatCurrency(totalItemPrice, currencySymbol)}
          </span>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          title="حذف من السلة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
