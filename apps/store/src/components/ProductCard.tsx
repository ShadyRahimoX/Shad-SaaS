import React from 'react';
import { Link } from 'wouter';
import { type Product } from '../lib/products';
import { formatCurrency } from '../lib/utils';
import { useSettings } from '../lib/settings';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { settings } = useSettings();
  const currencySymbol = settings.site_currency_symbol || '$';

  const formattedPrice = formatCurrency(product.priceUsd, currencySymbol);
  const formattedComparePrice = product.compareAtPriceUsd
    ? formatCurrency(product.compareAtPriceUsd, currencySymbol)
    : null;

  return (
    <Link
      data-product-card
      href={`/product/${product.id}`}
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-3xl bg-card border border-border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      dir="rtl"
    >
      {/* Product Image / Visual Container */}
      <div className="relative aspect-square w-full bg-muted/40 overflow-hidden flex items-center justify-center border-b border-border/60">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-muted/60 to-primary/5 text-muted-foreground group-hover:text-primary transition-colors">
            <Package className="w-12 h-12 stroke-1 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-center line-clamp-2 px-2 text-foreground/80">
              {product.name}
            </span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2 z-20">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>غير متوفر</span>
            </span>
          </div>
        )}

        {/* Discount badge if compareAtPrice exists */}
        {formattedComparePrice && product.available && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
            تخفيض
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-auto">
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base text-primary tracking-tight" dir="ltr">
              {formattedPrice}
            </span>
            {formattedComparePrice && (
              <span className="text-[10px] text-muted-foreground line-through" dir="ltr">
                {formattedComparePrice}
              </span>
            )}
          </div>

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
};
