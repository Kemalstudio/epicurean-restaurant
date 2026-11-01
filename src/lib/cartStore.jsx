import { useState, useCallback, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'ember_basket_v2';
const DEFAULT_TERMS = { delivery_fee: 10, free_delivery_from: 150, min_order: 0 };

const round2 = (n) => Math.round(n * 100) / 100;
const EMPTY = { restaurant: null, items: [], promoCode: null, promoDiscount: 0, fulfillment: 'delivery' };

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.items)) return { ...EMPTY, ...saved };
  } catch {
    // corrupted storage — start with an empty basket
  }
  return EMPTY;
}

/** Minimal restaurant snapshot kept with the basket (terms are re-checked by the server). */
const snapshot = (r) => ({
  id: r.id, slug: r.slug, name: r.name, logo_url: r.logo_url,
  delivery_fee: Number(r.delivery_fee ?? DEFAULT_TERMS.delivery_fee),
  free_delivery_from: Number(r.free_delivery_from ?? DEFAULT_TERMS.free_delivery_from),
  min_order: Number(r.min_order ?? 0),
  delivery_time: r.delivery_time,
});

export function CartProvider({ children }) {
  const { appPublicSettings } = useAuth();
  const taxRate = Number(appPublicSettings?.public_settings?.pricing?.tax_rate) || 0;

  const [state, setState] = useState(loadSaved);
  const [isOpen, setIsOpen] = useState(false);
  // Item waiting for confirmation because the basket holds another restaurant's food
  const [conflict, setConflict] = useState(null);

  // Latest state for decisions made outside of setState updaters
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const insert = useCallback((s, { product, restaurant, quantity = 1, size = null, added = [], removed = [] }) => {
    const addedSorted = [...added].sort((a, b) => a.id.localeCompare(b.id));
    const removedSorted = [...removed].sort((a, b) => a.id.localeCompare(b.id));
    const key = `${product.id}|${size || ''}|${addedSorted.map(a => a.id).join(',')}|${removedSorted.map(r => r.id).join(',')}`;
    const existing = s.items.find(i => i.key === key);
    const items = existing
      ? s.items.map(i => (i.key === key ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i))
      : [...s.items, (() => {
          const sizeData = size ? (product.sizes || []).find(x => x.name === size) : null;
          const extras = addedSorted.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
          const unit = (Number(product.base_price) + (Number(sizeData?.price_modifier) || 0) + extras) * (1 - (Number(product.discount_percent) || 0) / 100);
          return {
            key,
            product_id: product.id,
            product_name: product.name,
            product_image: product.image_url,
            size,
            addedIngredients: addedSorted.map(a => a.name),
            removedIngredients: removedSorted.map(r => r.name),
            addedIngredientIds: addedSorted.map(a => a.id),
            removedIngredientIds: removedSorted.map(r => r.id),
            unitPrice: round2(unit),
            quantity,
          };
        })()];
    return { ...s, restaurant: snapshot(restaurant), items };
  }, []);

  /**
   * Adds a product. If the basket belongs to another restaurant, the add is parked in `conflict`
   * and the UI asks the user whether to start a new basket.
   */
  const addItem = useCallback((entry) => {
    const current = stateRef.current;
    if (current.restaurant && current.items.length > 0 && current.restaurant.id !== entry.restaurant.id) {
      setConflict(entry);
      return;
    }
    setState(s => insert(s, entry));
    if (entry.openBasket !== false) setIsOpen(true);
  }, [insert]);

  const resolveConflict = useCallback((startNew) => {
    if (startNew && conflict) {
      setState(() => insert({ ...EMPTY }, conflict));
      setIsOpen(true);
    }
    setConflict(null);
  }, [conflict, insert]);

  const removeItem = useCallback((key) => {
    setState(s => {
      const items = s.items.filter(i => i.key !== key);
      return items.length ? { ...s, items } : { ...EMPTY, fulfillment: s.fulfillment };
    });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    if (quantity <= 0) return removeItem(key);
    setState(s => ({ ...s, items: s.items.map(i => (i.key === key ? { ...i, quantity: Math.min(quantity, 99) } : i)) }));
  }, [removeItem]);

  const clearCart = useCallback(() => setState(s => ({ ...EMPTY, fulfillment: s.fulfillment })), []);
  const setPromo = useCallback((code, percent) => setState(s => ({ ...s, promoCode: code, promoDiscount: percent })), []);
  const setFulfillment = useCallback((fulfillment) => setState(s => ({ ...s, fulfillment })), []);

  const totals = useMemo(() => {
    const terms = state.restaurant || DEFAULT_TERMS;
    const subtotal = round2(state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
    const discountAmount = round2(subtotal * (state.promoDiscount / 100));
    const deliveryFee = state.fulfillment === 'collection' || subtotal >= terms.free_delivery_from || subtotal === 0 ? 0 : terms.delivery_fee;
    const tax = round2((subtotal - discountAmount) * taxRate);
    const total = round2(subtotal - discountAmount + deliveryFee + tax);
    const minOrder = Number(terms.min_order) || 0;
    return {
      subtotal, discountAmount, deliveryFee, tax, total,
      itemCount: state.items.reduce((n, i) => n + i.quantity, 0),
      minOrder, missingForMin: Math.max(0, round2(minOrder - subtotal)),
    };
  }, [state, taxRate]);

  const value = {
    ...state, ...totals,
    isOpen, setIsOpen, conflict, resolveConflict,
    addItem, removeItem, updateQuantity, clearCart, setPromo, setFulfillment,
    // backwards-compatible names
    setPromoCode: (code) => setPromo(code, state.promoDiscount),
    setPromoDiscount: (p) => setPromo(state.promoCode, p),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
