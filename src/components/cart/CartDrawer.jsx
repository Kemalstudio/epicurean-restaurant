import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

import X from 'lucide-react/dist/esm/icons/x';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export default function CartDrawer() {
  const {
    items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart,
    promoCode, setPromoCode, promoDiscount, setPromoDiscount,
    subtotal, discountAmount, deliveryFee, tax, total, itemCount
  } = useCart();
  const { t } = useLanguage();
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    try {
      const codes = await base44.entities.PromoCode.filter({ code: promoInput.trim().toUpperCase(), is_active: true });
      if (codes.length > 0) {
        const code = codes[0];
        if (code.max_uses && code.used_count >= code.max_uses) {
          toast({ title: 'Code expired', variant: 'destructive' });
        } else if (code.min_order_amount && subtotal < code.min_order_amount) {
          toast({ title: 'Minimum not met', description: `Need ${code.min_order_amount} ${t('currency')}`, variant: 'destructive' });
        } else {
          setPromoCode(code.code);
          setPromoDiscount(code.discount_percent);
          toast({ title: 'Code applied!', description: `${code.discount_percent}% discount.` });
        }
      } else {
        toast({ title: 'Invalid code', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
    }
    setApplyingPromo(false);
  };

  return (
      <AnimatePresence>
        {isOpen && (
            <>
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
              />
              <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 z-[120] w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
              >
                {/* Шапка */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{t('cart')}</h2>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{itemCount} {t('items')}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Список товаров */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/5">
                  {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-xl font-bold mb-2">Empty Cart</p>
                        <p className="text-sm text-muted-foreground mb-8">Add something delicious!</p>
                        <Button onClick={() => setIsOpen(false)} className="bg-primary rounded-2xl px-8 h-12 font-bold uppercase text-xs tracking-widest">Start Shopping</Button>
                      </div>
                  ) : (
                      items.map(item => (
                          <motion.div
                              key={item.key}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-4 bg-card rounded-[1.5rem] p-4 border border-border/50 shadow-sm relative group"
                          >
                            {item.product_image && (
                                <img src={item.product_image} alt={item.product_name} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                            )}
                            <div className="flex-1 min-w-0 pr-6">
                              <h4 className="font-bold text-sm text-foreground truncate mb-1">{item.product_name}</h4>
                              {item.size && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">{item.size}</span>}
                              <p className="text-primary font-black text-sm mt-2">{item.unitPrice.toFixed(2)} {t('currency')}</p>

                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center bg-muted rounded-xl p-1">
                                  <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-background flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-black w-8 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-background flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                                onClick={() => removeItem(item.key)}
                                className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                      ))
                  )}
                </div>

                {/* Футер с итогами */}
                {items.length > 0 && (
                    <div className="border-t border-border p-6 space-y-6 bg-card shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                      {/* Промокод */}
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                              placeholder="PROMO CODE"
                              value={promoInput}
                              onChange={(e) => setPromoInput(e.target.value)}
                              className="pl-10 rounded-2xl h-12 bg-muted/30 border-none font-bold text-xs"
                          />
                        </div>
                        <Button onClick={applyPromo} disabled={applyingPromo} variant="outline" className="rounded-2xl h-12 px-6 font-bold text-xs border-primary/20 text-primary">APPLY</Button>
                      </div>

                      {/* Списки цен */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span>{subtotal.toFixed(2)} {t('currency')}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-accent uppercase tracking-widest">
                              <span>Discount ({promoCode})</span>
                              <span>-{discountAmount.toFixed(2)} {t('currency')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <span>Delivery</span>
                          <span>{deliveryFee > 0 ? `${deliveryFee.toFixed(2)} ${t('currency')}` : 'FREE'}</span>
                        </div>
                        <div className="h-px bg-border my-4" />
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('total')}</span>
                          <span className="text-3xl font-black text-primary">{total.toFixed(2)} {t('currency')}</span>
                        </div>
                      </div>

                      <Link to="/checkout" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-14 font-black text-lg shadow-xl shadow-primary/20 group uppercase tracking-widest">
                          {t('checkout')} <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                )}
              </motion.div>
            </>
        )}
      </AnimatePresence>
  );
}