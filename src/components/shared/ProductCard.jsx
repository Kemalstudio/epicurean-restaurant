import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';

import Star from 'lucide-react/dist/esm/icons/star';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Flame from 'lucide-react/dist/esm/icons/flame';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';

export default function ProductCard({ product, onOpenDetail, onToggleWishlist, isWishlisted }) {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Расчет цены со скидкой
  const discountedPrice = product.discount_percent
      ? product.base_price * (1 - product.discount_percent / 100)
      : null;

  return (
      <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="group relative bg-card rounded-[2rem] overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500"
      >
        {/* Контейнер изображения */}
        <div
            className="relative overflow-hidden aspect-square cursor-pointer"
            onClick={() => onOpenDetail?.(product)}
        >
          {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
              src={product.image_url}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Бейджи */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {product.is_new && (
                <Badge className="bg-secondary text-secondary-foreground border-0 text-[10px] font-bold px-2 py-0.5">NEW</Badge>
            )}
            {product.discount_percent > 0 && (
                <Badge className="bg-destructive text-white border-0 text-[10px] font-bold px-2 py-0.5">-{product.discount_percent}%</Badge>
            )}
            {product.is_popular && (
                <Badge className="bg-primary text-white border-0 text-[10px] font-bold px-2 py-0.5">HOT</Badge>
            )}
          </div>

          {/* Избранное */}
          <button
              onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product.id); }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-sm"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground/60'}`} />
          </button>

          {/* Быстрое добавление (кнопка плюс) */}
          <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <Button
                size="icon"
                onClick={(e) => { e.stopPropagation(); addItem(product); }}
                className="w-11 h-11 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        </div>

        {/* Информационный блок */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {product.rating > 0 && (
                <div className="flex items-center gap-1 text-secondary">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
            )}
            {product.prep_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{product.prep_time}</span>
                </div>
            )}
            {product.calories > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{product.calories} cal</span>
                </div>
            )}
          </div>

          <h3 className="font-display text-xl font-bold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer mb-2">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed min-h-[32px]">
            {product.short_description || product.description}
          </p>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
            <div className="flex flex-col">
            <span className="text-xl font-black text-primary leading-none">
              {(discountedPrice || product.base_price).toFixed(2)} <span className="text-[11px] font-bold ml-0.5">{t('currency')}</span>
            </span>
              {discountedPrice && (
                  <span className="text-xs text-muted-foreground line-through mt-1">
                {product.base_price.toFixed(2)} {t('currency')}
              </span>
              )}
            </div>
            <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); addItem(product); }}
                className="text-primary hover:bg-primary/10 rounded-xl text-xs font-bold gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              {t('add_to_cart')}
            </Button>
          </div>
        </div>
      </motion.div>
  );
}