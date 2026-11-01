import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { RestaurantCard, DealCard } from '@/components/ember/Cards';

/** All restaurants with cuisine / text / area filters. `mode="offers"` shows only discounted ones. */
export default function Restaurants({ mode = 'all' }) {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const cuisine = params.get('cuisine') || '';
  const area = params.get('area') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [openOnly, setOpenOnly] = useState(false);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const { data: home } = useQuery({ queryKey: ['home'], queryFn: base44.market.home, staleTime: 60000 });
  const { data: list = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['restaurants', cuisine, area, params.get('q') || ''],
    queryFn: () => base44.market.restaurants({ cuisine, area, q: params.get('q') || '' }),
  });

  let shown = openOnly ? list.filter(r => r.open_now) : list;
  if (mode === 'offers') shown = shown.filter(r => r.discount_percent > 0).sort((a, b) => b.discount_percent - a.discount_percent);

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <div className="rounded-card bg-ember-navy px-6 py-10 text-white lg:px-[57px] lg:py-[60px]">
        <h1 className="text-[30px] font-semibold leading-tight lg:text-[48px]">
          {mode === 'offers' ? t('offers_page_title') : t('restaurants_page_title')}
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] text-white/80 lg:text-[18px]">{mode === 'offers' ? t('offers_page_sub') : t('restaurants_page_sub')}</p>
        <form onSubmit={(e) => { e.preventDefault(); setParam('q', q.trim()); }} role="search" className="relative mt-8 max-w-[560px]">
          <label htmlFor="rest-search" className="sr-only">{t('search_restaurants')}</label>
          <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-black/50" aria-hidden="true" />
          <input id="rest-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_restaurants')} className="input-pill pl-14 pr-[130px]" />
          <button type="submit" className="btn-orange absolute right-0 top-0 h-[57px] w-[120px] text-[16px] font-bold">{t('search')}</button>
        </form>
        {area && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-pill bg-white/10 py-1.5 pl-4 pr-2 text-[14px]">
            <MapPin className="h-4 w-4" aria-hidden="true" />{t('delivering_to', { area })}
            <button type="button" onClick={() => setParam('area', '')} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20" aria-label={t('clear_filter')}><X className="h-3.5 w-3.5" /></button>
          </p>
        )}
      </div>

      <div className="scrollbar-hide -mx-4 mt-8 flex items-center gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label={t('filter_by_cuisine')}>
        {[{ slug: '', name: t('filter_all') }, ...(home?.cuisines || [])].map(c => (
          <button key={c.slug || 'all'} type="button" role="tab" aria-selected={cuisine === c.slug} onClick={() => setParam('cuisine', c.slug)}
            className={`h-[48px] shrink-0 whitespace-nowrap rounded-pill border px-6 text-[15px] ${cuisine === c.slug ? 'border-ember-orange bg-ember-orange text-white' : 'border-ember-gray text-black hover:border-ember-orange'}`}>
            {c.name}
          </button>
        ))}
        <label className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 pl-4 text-[15px]">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-5 w-5 accent-ember-green" />
          {t('open_now_only')}
        </label>
      </div>

      <p className="mt-6 text-[15px] text-black/60" aria-live="polite">{isLoading ? t('loading') : t('restaurants_found', { count: shown.length })}</p>

      {isError ? (
        <div className="py-16 text-center">
          <p className="text-[18px] font-semibold">{t('load_failed')}</p>
          <button type="button" onClick={() => refetch()} className="btn-orange mt-4 h-[48px] text-[16px]">{t('try_again')}</button>
        </div>
      ) : (
        <div className={`mt-6 grid gap-6 sm:grid-cols-2 ${mode === 'offers' ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
          {isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[16/12] rounded-card" />)
            : shown.map(r => (mode === 'offers' ? <DealCard key={r.id} restaurant={r} /> : <RestaurantCard key={r.id} restaurant={r} />))}
        </div>
      )}

      {!isLoading && !isError && shown.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[20px] font-semibold">{t('no_restaurants')}</p>
          <p className="mt-2 text-black/60">{t('no_restaurants_desc')}</p>
        </div>
      )}

      {mode === 'offers' && (
        <section className="mt-16 rounded-card bg-ember-orange p-8 text-white lg:p-12" aria-labelledby="promo-title">
          <h2 id="promo-title" className="text-[24px] font-bold lg:text-[32px]">{t('promo_section_title')}</h2>
          <p className="mt-2 text-[16px]">{t('promo_section_text', { code: 'WELCOME' })}</p>
        </section>
      )}
    </div>
  );
}
