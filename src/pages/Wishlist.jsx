import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWishlist } from '@/hooks/use-wishlist';
import { useLanguage } from '@/lib/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ember/ProductCard';

export default function Wishlist() {
  const { t } = useLanguage();
  const { wishlistedIds, toggleWishlist, isLoading: lw } = useWishlist();
  const { data: products = [], isLoading: lp } = useQuery({ queryKey: ['all-products-any'], queryFn: () => base44.entities.Product.list('', 1000) });
  const { data: restaurants = [], isLoading: lr } = useQuery({ queryKey: ['restaurants', '', '', ''], queryFn: () => base44.market.restaurants() });
  const byId = useMemo(() => new Map(restaurants.map(r => [r.id, r])), [restaurants]);
  const saved = products.filter(p => wishlistedIds.has(p.id) && byId.has(p.restaurant_id));
  const loading = lw || lp || lr;

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <h1 className="text-[30px] font-semibold lg:text-[48px]">{t('my_wishlist')}</h1>
      <p className="mt-1 text-[15px] text-black/60">{t('saved_count', { count: saved.length })}</p>

      {loading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-[300px] rounded-[8px]" />)}</div>
      ) : saved.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto h-16 w-16 text-black/15" aria-hidden="true" />
          <h2 className="mt-4 text-[24px] font-bold">{t('no_saved')}</h2>
          <p className="mt-2 text-black/60">{t('no_saved_desc')}</p>
          <Link to="/dishes" className="btn-orange mt-6 h-[50px] text-[16px]">{t('nav_browse_menu')}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-[31px] lg:grid-cols-2">
          {saved.map(p => {
            const r = byId.get(p.restaurant_id);
            return (
              <div key={p.id}>
                <Link to={`/r/${r.slug}`} className="mb-2 inline-flex items-center gap-2 text-[14px] font-semibold text-ember-orange hover:underline"><Store className="h-4 w-4" aria-hidden="true" />{r.name}</Link>
                <ProductCard product={p} restaurant={r} isFavourite onToggleFavourite={toggleWishlist} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
