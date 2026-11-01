import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWishlist } from '@/hooks/use-wishlist';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/shared/ProductCard';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import { useLanguage } from '@/lib/LanguageContext';

export default function Wishlist() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { t } = useLanguage();

  const { wishlistedIds, toggleWishlist, isLoading: loadingWishlist } = useWishlist();

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const wishlistProducts = products.filter(p => wishlistedIds.has(p.id));
  const isLoading = loadingWishlist || loadingProducts;


  return (
    <div className="pt-24 pb-12 min-h-screen px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t('back')}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{t('my_wishlist')}</h1>
          <p className="text-muted-foreground mb-8">{t('saved_count', { count: wishlistProducts.length })}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-2">{t('no_saved')}</h3>
            <p className="text-muted-foreground mb-6">{t('no_saved_desc')}</p>
            <Link to="/menu" className="text-primary font-semibold">{t('browse_menu')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetail={setSelectedProduct}
                isWishlisted={true}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        )}

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
}