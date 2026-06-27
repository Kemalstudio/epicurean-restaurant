import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Percent from 'lucide-react/dist/esm/icons/percent';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';

export default function SpecialOffers() {
  const { t } = useLanguage();
  const { data: offers = [] } = useQuery({
    queryKey: ['special-offers'],
    queryFn: () => base44.entities.Product.filter({ discount_percent: { $gt: 0 } }, '-discount_percent', 4),
  });

  if (offers.length === 0) return null;

  return (
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('dont_miss_out')}</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2">{t('special_offers')}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.slice(0, 2).map((product, idx) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-2xl group"
                >
                  <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {product.discount_percent}% {t('off')}
                  </span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-white/60 text-sm max-w-xs mb-4 line-clamp-2">{product.short_description || product.description}</p>
                    <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {(product.base_price * (1 - product.discount_percent / 100)).toFixed(2)} {t('currency')}
                  </span>
                      <span className="text-white/50 line-through">
                    {product.base_price.toFixed(2)} {t('currency')}
                  </span>
                    </div>
                    <Link to="/menu">
                      <Button className="bg-primary hover:bg-primary/90 rounded-xl w-fit">
                        {t('order_now')} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </section>
  );
}