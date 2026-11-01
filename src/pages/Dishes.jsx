import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useWishlist } from '@/hooks/use-wishlist';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ember/ProductCard';

const PAGE = 20;

/** "Browse menu": every dish from every open restaurant, searchable. */
export default function Dishes() {
  const { t } = useLanguage();
  const { wishlistedIds, toggleWishlist } = useWishlist();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('popular');
  const [limit, setLimit] = useState(PAGE);

  const { data: restaurants = [], isLoading: lr } = useQuery({ queryKey: ['restaurants', '', '', ''], queryFn: () => base44.market.restaurants() });
  const { data: products = [], isLoading: lp } = useQuery({ queryKey: ['all-products'], queryFn: () => base44.entities.Product.filter({ is_available: true }, '', 1000) });

  const byId = useMemo(() => new Map(restaurants.map(r => [r.id, r])), [restaurants]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = products.filter(p => byId.has(p.restaurant_id));
    if (s) out = out.filter(p => p.name.toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s) || byId.get(p.restaurant_id).name.toLowerCase().includes(s));
    const key = {
      popular: (a, b) => Number(!!b.is_popular) - Number(!!a.is_popular) || (b.rating || 0) - (a.rating || 0),
      'price-low': (a, b) => a.base_price - b.base_price,
      'price-high': (a, b) => b.base_price - a.base_price,
      deals: (a, b) => (b.discount_percent || 0) - (a.discount_percent || 0),
    }[sort];
    return [...out].sort(key);
  }, [products, byId, q, sort]);

  const loading = lr || lp;
  return (
    <div className="ember-container pt-6 lg:pt-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold lg:text-[48px]">{t('browse_menu_title')}</h1>
          <p className="mt-1 text-[15px] text-black/60 lg:text-[18px]">{t('browse_menu_sub')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-[373px]">
            <span className="sr-only">{t('search_placeholder')}</span>
            <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder={t('search_placeholder')}
              className="h-[61px] w-full rounded-pill border border-black/70 pl-14 pr-5 text-[16px] outline-none focus:border-ember-orange" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('sort_by')}
            className="h-[61px] rounded-pill border border-[#CFCFCF] bg-[#F6F6F6] px-6 text-[16px] outline-none">
            <option value="popular">{t('sort_popular')}</option>
            <option value="price-low">{t('sort_price_low')}</option>
            <option value="price-high">{t('sort_price_high')}</option>
            <option value="deals">{t('filter_deals')}</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-[15px] text-black/60" aria-live="polite">{loading ? t('loading') : t('dishes_found', { count: list.length })}</p>

      <div className="mt-6 grid gap-[31px] lg:grid-cols-2">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-[8px]" />)
          : list.slice(0, limit).map(p => {
              const r = byId.get(p.restaurant_id);
              return (
                <div key={p.id}>
                  <Link to={`/r/${r.slug}`} className="mb-2 inline-flex items-center gap-2 text-[14px] font-semibold text-ember-orange hover:underline">
                    <Store className="h-4 w-4" aria-hidden="true" />{r.name}
                  </Link>
                  <ProductCard product={p} restaurant={r} isFavourite={wishlistedIds.has(p.id)} onToggleFavourite={toggleWishlist} />
                </div>
              );
            })}
      </div>

      {!loading && list.length === 0 && <p className="py-16 text-center text-[18px] font-semibold">{t('no_dishes')}</p>}
      {list.length > limit && (
        <div className="mt-10 text-center">
          <button type="button" onClick={() => setLimit(l => l + PAGE)} className="btn-navy h-[52px] text-[16px]">{t('show_more')}</button>
        </div>
      )}
    </div>
  );
}
