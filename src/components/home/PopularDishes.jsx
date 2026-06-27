import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/shared/ProductCard';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import { useLanguage } from '@/lib/LanguageContext';

export default function PopularDishes() {
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['popular-products'],
    queryFn: () => base44.entities.Product.filter({ is_popular: true }, '-rating', 8),
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => base44.entities.Wishlist.list(),
  });

  const wishlistedIds = new Set(wishlistItems.map(w => w.product_id));

  const toggleWishlist = async (productId) => {
    const existing = wishlistItems.find(w => w.product_id === productId);
    if (existing) {
      await base44.entities.Wishlist.delete(existing.id);
    } else {
      await base44.entities.Wishlist.create({ product_id: productId });
    }
  };

  return (
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
        >
          <div>
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('most_loved')}</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2">{t('popular_dishes')}</h2>
          </div>
          <Link
              to="/menu"
              className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all group"
          >
            {t('view_all_menu')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
              ))
              : products.slice(0, 4).map(product => (
                  <ProductCard
                      key={product.id}
                      product={product}
                      onOpenDetail={setSelectedProduct}
                      isWishlisted={wishlistedIds.has(product.id)}
                      onToggleWishlist={toggleWishlist}
                  />
              ))}
        </div>

        {selectedProduct && (
            <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        )}
      </section>
  );
}