import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/lib/AuthContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'epicurean_cart_v1';
// Fallback until /settings/public is loaded; the server is the source of truth and re-prices every order
const DEFAULT_PRICING = { delivery_fee: 4.99, free_delivery_from: 50, tax_rate: 0.08 };

const round2 = (n) => Math.round(n * 100) / 100;

function loadSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.items)) return saved;
  } catch {
    // corrupted storage — start with an empty cart
  }
  return { items: [], promoCode: null, promoDiscount: 0 };
}

export function CartProvider({ children }) {
  const { appPublicSettings } = useAuth();
  const pricing = { ...DEFAULT_PRICING, ...(appPublicSettings?.public_settings?.pricing || {}) };

  const [saved] = useState(loadSavedCart);
  const [items, setItems] = useState(saved.items);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState(saved.promoCode);
  const [promoDiscount, setPromoDiscount] = useState(saved.promoDiscount);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, promoCode, promoDiscount }));
  }, [items, promoCode, promoDiscount]);

  const addItem = useCallback((
    product, quantity = 1, size = null,
    addedIngredients = [], removedIngredients = [], extraPrice = 0,
    addedIngredientIds = [], removedIngredientIds = []
  ) => {
    const addedIds = [...addedIngredientIds].sort();
    const removedIds = [...removedIngredientIds].sort();
    const itemKey = `${product.id}-${size || 'default'}-${addedIds.join(',')}-${removedIds.join(',')}`;
    setItems(prev => {
      const existing = prev.find(i => i.key === itemKey);
      if (existing) {
        return prev.map(i => i.key === itemKey ? { ...i, quantity: i.quantity + quantity } : i);
      }
      const sizeData = size && product.sizes ? product.sizes.find(s => s.name === size) : null;
      const unitPrice = (product.base_price + (sizeData?.price_modifier || 0) + extraPrice) * (1 - (product.discount_percent || 0) / 100);
      return [...prev, {
        key: itemKey,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        size,
        addedIngredients,
        removedIngredients,
        addedIngredientIds: addedIds,
        removedIngredientIds: removedIds,
        unitPrice: round2(unitPrice),
        quantity,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.key !== key));
    } else {
      setItems(prev => prev.map(i => i.key === key ? { ...i, quantity: Math.min(quantity, 99) } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }, []);

  // Same formula as backend/pricing.js
  const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
  const discountAmount = round2(subtotal * (promoDiscount / 100));
  const deliveryFee = subtotal > pricing.free_delivery_from ? 0 : pricing.delivery_fee;
  const tax = round2((subtotal - discountAmount) * pricing.tax_rate);
  const total = round2(subtotal - discountAmount + deliveryFee + tax);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart,
      promoCode, setPromoCode, promoDiscount, setPromoDiscount,
      subtotal, discountAmount, deliveryFee, tax, total, itemCount, pricing
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
