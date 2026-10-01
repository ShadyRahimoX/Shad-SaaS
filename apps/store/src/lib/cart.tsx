import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  priceUsd: string;
  imageUrl?: string | null;
  quantity: number;
  playerId?: string;
  requiredFields?: any[];
  requiredFieldsData?: Record<string, string>;
  minQty?: string;
  maxQty?: string;
  qtyOptions?: any[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateRequiredFields: (productId: string, data: Record<string, string>, playerId?: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  itemCount: number;
  subtotalUsd: number;
}

const STORAGE_KEY = 'store_cart_v1';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === item.productId);
      const minQ = item.minQty ? Math.max(1, parseInt(item.minQty, 10)) : 1;
      const maxQ = item.maxQty ? parseInt(item.maxQty, 10) : Infinity;

      if (existingIndex > -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const addQty = item.quantity || 1;
        let newQty = existing.quantity + addQty;
        if (newQty > maxQ) newQty = maxQ;
        if (newQty < minQ) newQty = minQ;

        next[existingIndex] = {
          ...existing,
          quantity: newQty,
          // Merge required fields data if provided
          requiredFieldsData: item.requiredFieldsData || existing.requiredFieldsData,
          playerId: item.playerId || existing.playerId,
        };
        return next;
      }

      let initialQty = item.quantity || minQ || 1;
      if (initialQty > maxQ) initialQty = maxQ;
      if (initialQty < minQ) initialQty = minQ;

      return [
        ...prev,
        {
          ...item,
          quantity: initialQty,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const minQ = item.minQty ? Math.max(1, parseInt(item.minQty, 10)) : 1;
          const maxQ = item.maxQty ? parseInt(item.maxQty, 10) : Infinity;

          let targetQty = quantity;
          if (targetQty > maxQ) targetQty = maxQ;
          if (targetQty < minQ) targetQty = minQ;

          return { ...item, quantity: targetQty };
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const updateRequiredFields = (
    productId: string,
    data: Record<string, string>,
    playerId?: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        return {
          ...item,
          requiredFieldsData: { ...(item.requiredFieldsData || {}), ...data },
          playerId: playerId !== undefined ? playerId : item.playerId,
        };
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clear = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalUsd = items.reduce((sum, item) => {
    const price = parseFloat(item.priceUsd) || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateRequiredFields,
        removeItem,
        clear,
        itemCount,
        subtotalUsd,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
