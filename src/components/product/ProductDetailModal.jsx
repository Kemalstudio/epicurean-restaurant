import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';
import NutritionRing from './NutritionRing';
import MealCustomizer from './MealCustomizer';

// Прямые импорты иконок
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Flame from 'lucide-react/dist/esm/icons/flame';
import Weight from 'lucide-react/dist/esm/icons/weight';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';

export default function ProductDetailModal({ product, onClose }) {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]?.name || null);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [extraPrice, setExtraPrice] = useState(0);
  const [extraCalories, setExtraCalories] = useState(0);

  const sizeData = selectedSize && product.sizes
      ? product.sizes.find(s => s.name === selectedSize)
      : null;

  const currentPrice = product.base_price + (sizeData?.price_modifier || 0) + extraPrice;
  const currentCalories = (product.calories || 0) + (sizeData?.calories_modifier || 0) + extraCalories;
  const discountedPrice = product.discount_percent
      ? currentPrice * (1 - product.discount_percent / 100)
      : currentPrice;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, addedIngredients, removedIngredients, extraPrice);
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-[3rem] overflow-hidden shadow-2xl border border-border/50 flex flex-col"
        >
          <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Изображение */}
              <div className="relative aspect-square md:aspect-auto md:h-full">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {product.is_new && <Badge className="bg-secondary text-white border-0 px-3 py-1 font-bold">NEW</Badge>}
                  {product.discount_percent > 0 && <Badge className="bg-destructive text-white border-0 px-3 py-1 font-bold">-{product.discount_percent}%</Badge>}
                </div>
              </div>

              {/* Детали */}
              <div className="p-8 md:p-12 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 fill-secondary text-secondary" />
                    <span className="font-bold text-lg">{product.rating?.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({product.review_count} {t('testimonials')})</span>
                  </div>
                  <h2 className="font-display text-4xl font-bold text-foreground mb-4">{product.name}</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">{product.description}</p>
                </div>

                <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {product.prep_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span>{product.prep_time}</span>
                      </div>
                  )}
                  {product.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="w-5 h-5 text-primary" />
                        <span>{product.weight}</span>
                      </div>
                  )}
                </div>

                {/* Нутриенты */}
                <NutritionRing
                    calories={currentCalories}
                    protein={product.protein || 0}
                    fat={product.fat || 0}
                    carbs={product.carbs || 0}
                />

                {/* Выбор размера */}
                {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-foreground mb-4 block uppercase tracking-widest">{t('select_size') || 'Select Size'}</label>
                      <div className="flex gap-3">
                        {product.sizes.map(size => (
                            <button
                                key={size.name}
                                onClick={() => setSelectedSize(size.name)}
                                className={`flex-1 py-4 px-4 rounded-2xl border-2 transition-all duration-300 ${
                                    selectedSize === size.name
                                        ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10'
                                        : 'border-border hover:border-primary/20 text-muted-foreground'
                                }`}
                            >
                              <div className="font-bold">{size.name}</div>
                              <div className="text-[10px] mt-1 opacity-70 uppercase tracking-tighter">{size.weight}</div>
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                {/* Кастомизатор ингредиентов */}
                <MealCustomizer
                    product={product}
                    onIngredientsChange={(added, removed, price, cals) => {
                      setAddedIngredients(added);
                      setRemovedIngredients(removed);
                      setExtraPrice(price);
                      setExtraCalories(cals);
                    }}
                />
              </div>
            </div>
          </div>

          {/* Нижняя панель действий */}
          <div className="border-t border-border p-6 md:px-12 md:py-8 flex items-center justify-between gap-6 bg-card">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">{t('total')}</p>
              <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">
                {discountedPrice.toFixed(2)} <span className="text-sm">{t('currency')}</span>
              </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{currentCalories} calories</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted rounded-2xl p-1.5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-background transition-colors shadow-sm">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-10 text-center font-black text-lg">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-background transition-colors shadow-sm">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <Button
                  onClick={handleAddToCart}
                  className="bg-primary hover:bg-primary/90 rounded-[1.5rem] h-14 px-10 font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t('add_to_cart')}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
}