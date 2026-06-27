import { useState, useCallback, createContext, useContext } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const addItem = useCallback((product, quantity = 1, size = null, addedIngredients = [], removedIngredients = [], extraPrice = 0) => {
    const itemKey = `${product.id}-${size || 'default'}-${addedIngredients.sort().join(',')}-${removedIngredients.sort().join(',')}`;
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
        unitPrice: Math.round(unitPrice * 100) / 100,
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
      setItems(prev => prev.map(i => i.key === key ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
    setPromoDiscount(0);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = subtotal * (promoDiscount / 100);
  const deliveryFee = subtotal > 50 ? 0 : 4.99;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + deliveryFee + tax;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart,
      promoCode, setPromoCode, promoDiscount, setPromoDiscount,
      subtotal, discountAmount, deliveryFee, tax, total, itemCount
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