import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Clock, ClipboardCheck, Bike, Star, ChevronLeft, ChevronRight, ChevronDown, UtensilsCrossed,
  Truck, Phone, CalendarClock, ArrowDownUp, Globe, MessageSquarePlus, X,
} from 'lucide-react';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/cartStore.jsx';
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ember/ProductCard';
import BasketPanel from '@/components/ember/BasketPanel';
import { Photo, OfferCard, RestaurantTile } from '@/components/ember/Cards';
import { PopupShell } from '@/components/ember/Popups';
import { EmptyState, errorAnim } from '@/components/ember/LottieAnim';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Stars({ value, className = 'h-4 w-4' }) {
  return (
    <span className="flex" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${className} ${i <= Math.round(value) ? 'fill-ember-orange text-ember-orange' : 'fill-ember-gray text-ember-gray'}`} />
      ))}
    </span>
  );
}

function RatingBox({ rating, count, className = '', compact = false }) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center rounded-card bg-white shadow-soft ${compact ? 'px-1 py-2' : 'px-4 py-3'} ${className}`}>
      <span className={`font-normal leading-none text-black ${compact ? 'text-[24px]' : 'text-[44px] md:text-[60px]'}`}>{Number(rating || 0).toFixed(1)}</span>
      <Stars value={rating} className={compact ? 'mt-0.5 h-2 w-2' : 'mt-1 h-3.5 w-3.5'} />
      <span className={`text-center leading-tight text-black/60 ${compact ? 'mt-0.5 text-[6px]' : 'mt-1 text-[11px]'}`}>{t('reviews_n', { count: count || 0 })}</span>
    </div>
  );
}

function OpenBadge({ r, className = '' }) {
  const { t } = useLanguage();
  const text = r.open_now
    ? (r.closes_at ? t('open_until', { time: r.closes_at }) : t('open_now'))
    : (r.opens_at ? t('opens_at', { time: r.opens_at }) : t('closed_now'));
  return (
    <div className={`flex items-center gap-3 font-semibold text-white ${r.open_now ? 'bg-ember-orange' : 'bg-ember-navy'} ${className}`}>
      <Clock className="h-7 w-7 shrink-0" aria-hidden="true" />{text}
    </div>
  );
}

function Hero({ r }) {
  const { t, formatPrice } = useLanguage();
  const badges = [
    { icon: ClipboardCheck, text: t('min_order_badge', { amount: formatPrice(r.min_order) }) },
    { icon: Bike, text: t('delivery_in_badge', { time: r.delivery_time }) },
  ];
  return (
    <section aria-labelledby="restaurant-name">
      {/* Desktop */}
      <div className="relative hidden h-[477px] rounded-card lg:block">
        <Photo src={r.cover_url} className="absolute inset-0 h-full w-full rounded-card" />
        <div className="absolute inset-0 rounded-card bg-[#E2E2E2]/90" aria-hidden="true" />
        <div className="relative flex h-full items-center justify-between gap-8 pl-10 pr-10 2xl:gap-10 2xl:pl-[57px] 2xl:pr-[62px]">
          <div className="min-w-0 max-w-[660px]">
            {r.tagline && <p className="text-[20px] text-ember-navy">{r.tagline}</p>}
            <h1 id="restaurant-name" className="mt-2 text-[36px] font-bold leading-tight text-ember-navy xl:text-[44px] 2xl:text-[54px]">{r.name}</h1>
            <div className="mt-8 flex flex-wrap gap-4">
              {badges.map(b => (
                <span key={b.text} className="flex h-[54px] items-center gap-3 whitespace-nowrap rounded-pill border border-white bg-ember-navy px-5 text-[15px] font-semibold text-white xl:text-[16px] 2xl:h-[63px] 2xl:gap-4 2xl:px-7 2xl:text-[18px]">
                  <b.icon className="h-[30px] w-[30px]" aria-hidden="true" />{b.text}
                </span>
              ))}
            </div>
          </div>
          <div className="relative aspect-[581/361] w-[38%] max-w-[581px] shrink-0 xl:w-[42%]">
            <Photo src={r.hero_image_url || r.cover_url} alt={r.name} className="h-full w-full rounded-card" />
            <RatingBox rating={r.rating} count={r.review_count} className="absolute -left-10 bottom-[-20px] h-[130px] w-[112px] 2xl:-left-14 2xl:bottom-[-8px] 2xl:h-[158px] 2xl:w-[136px]" />
          </div>
        </div>
        <OpenBadge r={r} className="absolute -bottom-[30px] left-0 h-[61px] rounded-r-card rounded-bl-card px-14 text-[18px]" />
      </div>

      {/* Mobile (kit: Mobile Restaurant) */}
      <div className="overflow-hidden rounded-card bg-[#E2E2E2] lg:hidden">
        <div className="relative px-[42px] pt-[42px]">
          <Photo src={r.hero_image_url || r.cover_url} alt={r.name} className="aspect-[228/142] w-full rounded-card" />
          <RatingBox compact rating={r.rating} count={r.review_count} className="absolute bottom-[-8px] left-[30px] h-[83px] w-[54px]" />
        </div>
        <OpenBadge r={r} className="mt-[34px] inline-flex h-[61px] whitespace-nowrap rounded-r-card px-8 text-[18px]" />
        <div className="px-4 pb-8 pt-12 text-center">
          {r.tagline && <p className="text-[13px] text-black">{r.tagline}</p>}
          <h1 className="text-[28px] font-bold leading-tight text-ember-navy">{r.name}</h1>
          <div className="mt-4 flex flex-col items-center gap-4">
            {badges.map(b => (
              <span key={b.text} className="flex h-[63px] w-full max-w-[328px] items-center justify-center gap-3 rounded-pill border border-white bg-ember-navy px-5 text-[17px] font-semibold text-white">
                <b.icon className="h-8 w-8" aria-hidden="true" />{b.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoSection({ r }) {
  const { t } = useLanguage();
  const hours = Array.isArray(r.hours) ? r.hours : null;
  return (
    <section className="mt-12 grid overflow-hidden rounded-card bg-[#FBFBFB] shadow-card md:grid-cols-[1fr_1fr_0.8fr] lg:mt-[63px]" aria-label={t('restaurant_info')}>
      <div className="p-8 lg:px-7 lg:py-14">
        <h2 className="flex items-center gap-3 text-[24px] font-bold text-black lg:text-[28px]"><Truck className="h-9 w-9" aria-hidden="true" />{t('delivery_information')}</h2>
        <dl className="mt-7 space-y-3 text-[15px]">
          {hours ? DAYS.map((d, i) => (
            <div key={d} className="flex gap-1"><dt className="font-bold">{t(d)}:</dt><dd>{hours[i] ? `${hours[i][0]}–${hours[i][1]}` : t('closed_now')}</dd></div>
          )) : <p>{t('hours_not_set')}</p>}
          <div className="flex gap-1 pt-1"><dt className="font-bold">{t('estimated_delivery_time')}:</dt><dd>{r.delivery_time} {t('min_short')}</dd></div>
        </dl>
      </div>
      <div className="p-8 lg:px-7 lg:py-14">
        <h2 className="flex items-center gap-3 text-[24px] font-bold text-black lg:text-[28px]"><Phone className="h-8 w-8" aria-hidden="true" />{t('contact_information')}</h2>
        <p className="mt-7 text-[15px] leading-[2]">{t('allergy_note')}</p>
        {r.phone && <><p className="mt-4 text-[15px] font-bold">{t('phone_number')}</p><a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="text-[18px] hover:text-ember-orange">{r.phone}</a></>}
        {r.website && <><p className="mt-4 text-[15px] font-bold">{t('website')}</p><a href={r.website} target="_blank" rel="noopener noreferrer" className="break-all text-[18px] hover:text-ember-orange">{r.website}</a></>}
      </div>
      <div className="bg-ember-navy p-8 text-white lg:px-8 lg:py-14">
        <h2 className="flex items-center gap-3 text-[24px] font-bold lg:text-[28px]"><CalendarClock className="h-8 w-8" aria-hidden="true" />{t('operational_times')}</h2>
        <dl className="mt-7 space-y-3 text-[15px]">
          {hours ? DAYS.map((d, i) => (
            <div key={d} className="flex gap-1"><dt className="font-bold">{t(d)}:</dt><dd>{hours[i] ? `${hours[i][0]}–${hours[i][1]}` : t('closed_now')}</dd></div>
          )) : <p>{t('hours_not_set')}</p>}
        </dl>
      </div>
    </section>
  );
}

function MapSection({ r }) {
  const { t } = useLanguage();
  if (!r.lat || !r.lng) return null;
  const d = 0.008;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${r.lng - d * 2},${r.lat - d},${r.lng + d * 2},${r.lat + d}&layer=mapnik&marker=${r.lat},${r.lng}`;
  return (
    <section className="relative mt-12 h-[420px] overflow-hidden rounded-card shadow-card lg:mt-[57px] lg:h-[555px]" aria-label={t('location')}>
      <iframe title={t('map_of', { name: r.name })} src={src} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer" />
      <div className="absolute bottom-4 left-4 right-4 rounded-card bg-ember-navy/95 p-6 text-white sm:bottom-[70px] sm:left-[64px] sm:right-auto sm:w-[371px] sm:p-10">
        <h2 className="text-[26px] font-bold lg:text-[32px]">{r.name}</h2>
        <p className="text-[18px] font-semibold text-ember-orange">{r.area}</p>
        <p className="mt-5 text-[15px] leading-relaxed">{r.address}</p>
        {r.phone && <><p className="mt-5 text-[15px] font-bold">{t('phone_number')}</p><p className="text-[18px] text-ember-orange">{r.phone}</p></>}
        <a href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=16/${r.lat}/${r.lng}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-[15px] underline underline-offset-2">
          <Globe className="h-4 w-4" aria-hidden="true" />{t('open_in_maps')}
        </a>
      </div>
    </section>
  );
}

function ReviewForm({ restaurantId, onClose }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.entities.Review.create({ restaurant_id: restaurantId, rating, comment });
      toast({ title: t('review_thanks'), description: t('review_posted') });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      onClose();
    } catch (err) {
      toast({ title: t('review_failed'), description: apiErrorMessage(err), variant: 'destructive' });
    } finally { setBusy(false); }
  };
  return (
    <PopupShell open onClose={onClose} label={t('write_review')} className="max-w-[520px]">
      <form onSubmit={submit} className="p-8">
        <h2 className="text-[24px] font-bold">{t('write_review')}</h2>
        <fieldset className="mt-5">
          <legend className="text-[14px] font-semibold">{t('your_rating')}</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setRating(s)} aria-pressed={s === rating} aria-label={`${s} / 5`}>
                <Star className={`h-8 w-8 ${s <= rating ? 'fill-ember-orange text-ember-orange' : 'text-ember-gray'}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <label htmlFor="review-text" className="mt-5 block text-[14px] font-semibold">{t('your_review')}</label>
        <textarea id="review-text" required maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('review_placeholder')}
          className="mt-2 min-h-[120px] w-full rounded-card border border-ember-gray p-4 text-[15px] outline-none focus:border-ember-orange" />
        <button type="submit" disabled={busy} className="btn-orange mt-6 h-[50px] w-full text-[16px]">{busy ? t('posting') : t('post_review')}</button>
      </form>
    </PopupShell>
  );
}

function Reviews({ r }) {
  const { t, formatDate } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [writing, setWriting] = useState(false);
  const perPage = 3;
  const pages = Math.max(1, Math.ceil(r.reviews.length / perPage));
  const shown = r.reviews.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="-mx-4 mt-12 bg-ember-gray px-4 pb-20 pt-12 sm:-mx-6 sm:px-6 lg:mx-[calc(50%-50vw)] lg:mt-[67px] lg:px-[calc(50vw-50%)] lg:pb-[84px] lg:pt-[67px]" aria-labelledby="reviews-title">
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="reviews-title" className="text-[28px] font-bold lg:text-[32px]">{t('customer_reviews')}</h2>
          <div className="flex items-center gap-4">
            {isAuthenticated
              ? <button type="button" onClick={() => setWriting(true)} className="btn-navy h-[48px] text-[15px]"><MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{t('write_review')}</button>
              : <Link to={`/login?redirect=/r/${r.slug}`} className="text-[15px] font-semibold underline">{t('login_to_review')}</Link>}
            <button type="button" onClick={() => setPage(p => (p - 1 + pages) % pages)} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ember-orange text-ember-navy lg:h-[66px] lg:w-[66px]" aria-label={t('previous')}><ChevronLeft className="h-8 w-8" /></button>
            <button type="button" onClick={() => setPage(p => (p + 1) % pages)} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ember-orange text-ember-navy lg:h-[66px] lg:w-[66px]" aria-label={t('next')}><ChevronRight className="h-8 w-8" /></button>
          </div>
        </div>
        {r.reviews.length === 0 ? (
          <p className="mt-10 text-[16px] text-black/60">{t('no_reviews')}</p>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-3" aria-live="polite">
            {shown.map(rev => (
              <li key={rev.id} className="rounded-card bg-white p-6 shadow-soft lg:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ember-navy text-[18px] font-bold text-white" aria-hidden="true">{rev.avatar_letter || rev.author_name?.[0]}</span>
                    <span className="border-l-2 border-ember-orange pl-3">
                      <span className="block text-[16px] font-semibold">{rev.author_name}</span>
                      <span className="block text-[13px] text-ember-orange">{r.area}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <Stars value={rev.rating} className="h-4 w-4" />
                    <span className="mt-1 flex items-center justify-end gap-1 text-[13px]"><Clock className="h-3.5 w-3.5 text-ember-orange" aria-hidden="true" />{formatDate(rev.created_at)}</span>
                  </div>
                </div>
                <p className="mt-5 text-[15px] leading-[1.8]">{rev.comment}</p>
              </li>
            ))}
          </ul>
        )}
        <RatingBox rating={r.rating} count={r.review_count} className="absolute -bottom-[130px] left-1/2 hidden h-[115px] w-[146px] -translate-x-1/2 lg:flex" />
      </div>
      {writing && <ReviewForm restaurantId={r.id} onClose={() => setWriting(false)} />}
    </section>
  );
}

function MenuNav({ sections, active, onSelect }) {
  const { t } = useLanguage();
  return (
    <nav className="overflow-hidden rounded-card border border-[#BCBCBC] bg-[#FBFBFB]" aria-label={t('menu')}>
      <h2 className="flex items-center gap-4 px-6 pb-6 pt-8 text-[28px] 2xl:gap-5 2xl:px-[34px] 2xl:pb-8 2xl:pt-[46px] 2xl:text-[32px] font-semibold"><UtensilsCrossed className="h-[45px] w-[45px]" aria-hidden="true" />{t('menu')}</h2>
      <ul className="pb-8">
        {[{ id: 'all', name: t('all_dishes') }, ...sections].map(s => (
          <li key={s.id}>
            <button type="button" onClick={() => onSelect(s.id)} aria-current={active === s.id ? 'true' : undefined}
              className={`block w-full px-6 py-4 text-left text-[18px] font-bold 2xl:px-[34px] 2xl:py-[19px] 2xl:text-[22px] ${active === s.id ? 'bg-ember-navy text-white' : 'text-[#282828] hover:text-ember-orange'}`}>
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function RestaurantPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { wishlistedIds, toggleWishlist } = useWishlist();
  const { promoCode, setPromo, restaurant: basketRestaurant } = useCart();
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [sort, setSort] = useState('none');
  const [offer, setOffer] = useState(null);

  const { data: r, isLoading, isError, error } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => base44.market.restaurant(slug),
  });

  const groups = useMemo(() => {
    if (!r) return [];
    const q = query.trim().toLowerCase();
    let products = r.products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    if (sort !== 'none') products = [...products].sort((a, b) => (sort === 'asc' ? 1 : -1) * (a.base_price - b.base_price));
    const sections = section === 'all' ? r.sections : r.sections.filter(s => s.id === section);
    const out = sections.map(s => ({ ...s, products: products.filter(p => p.section_id === s.id) })).filter(g => g.products.length);
    const orphan = products.filter(p => !r.sections.some(s => s.id === p.section_id));
    if (section === 'all' && orphan.length) out.push({ id: 'other', name: t('other_dishes'), products: orphan });
    return out;
  }, [r, query, section, sort, t]);

  if (isLoading) {
    return (
      <div className="ember-container pt-4">
        <Skeleton className="h-[477px] rounded-card" />
        <div className="mt-16 grid gap-5 lg:grid-cols-[367px_1fr_367px]"><Skeleton className="h-[600px] rounded-card" /><Skeleton className="h-[600px] rounded-card" /><Skeleton className="h-[600px] rounded-card" /></div>
      </div>
    );
  }
  if (isError || !r) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="ember-container py-10">
        <EmptyState anim={notFound ? 'not_found' : errorAnim(error)} title={notFound ? t('restaurant_not_found') : t('load_failed')} action={t('browse_restaurants')} to="/restaurants" />
      </div>
    );
  }

  const applyOffer = (o) => {
    if (o.promo_code) {
      if (basketRestaurant && basketRestaurant.id !== r.id) {
        toast({ title: t('offer_other_basket') });
      } else {
        setPromo(o.promo_code, o.discount_percent);
        toast({ title: t('promo_applied'), description: t('promo_applied_desc', { percent: o.discount_percent }) });
      }
    }
    setOffer(o);
  };

  return (
    <div className="ember-container pt-4 lg:pt-0">
      <Hero r={r} />

      <div className="mt-8 flex flex-col-reverse gap-6 lg:mt-[69px] lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-center text-[18px] font-semibold lg:text-left lg:text-[32px]">{t('order_from', { name: r.name })}</h2>
        <label className="relative mx-auto block w-full max-w-[344px] lg:mx-0 lg:w-[373px] lg:max-w-none">
          <span className="sr-only">{t('search_menu')}</span>
          <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search_menu')}
            className="h-[62px] w-full rounded-pill border border-black/70 bg-white pl-14 pr-5 text-[16px] outline-none focus:border-ember-orange lg:h-[61px]" />
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:mt-[39px] lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,340px)] 2xl:grid-cols-[minmax(0,367px)_minmax(0,1fr)_minmax(0,367px)]">
        {/* Left: menu */}
        <aside className="space-y-5">
          <div className="hidden lg:block"><MenuNav sections={r.sections} active={section} onSelect={setSection} /></div>
          {/* Mobile menu select (kit: "Menu  Pizzas ⌄") */}
          <label className="relative flex h-[77px] items-center justify-between rounded-card border border-black/30 px-6 lg:hidden">
            <span className="flex items-center gap-4 text-[32px] font-semibold"><UtensilsCrossed className="h-[45px] w-[45px]" aria-hidden="true" />{t('menu')}</span>
            <select value={section} onChange={(e) => setSection(e.target.value)} aria-label={t('menu')}
              className="absolute inset-0 cursor-pointer opacity-0">
              <option value="all">{t('all_dishes')}</option>
              {r.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="flex items-center gap-3 text-[16px]">
              {section === 'all' ? t('all_dishes') : r.sections.find(s => s.id === section)?.name}
              <ChevronDown className="h-6 w-6 rounded-full bg-black/40 p-1 text-white" aria-hidden="true" />
            </span>
          </label>
          {r.offers.slice(0, 1).map(o => (
            <div key={o.id} className="hidden lg:block"><OfferCard offer={o} restaurantName={t('special_offer')} onClick={() => applyOffer(o)} /></div>
          ))}
        </aside>

        {/* Middle: products */}
        <div className="min-w-0">
          {r.offers.length > 0 && (
            <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:hidden">
              {r.offers.map(o => <OfferCard key={o.id} offer={o} restaurantName={t('special_offer')} onClick={() => applyOffer(o)} />)}
            </div>
          )}
          {groups.length === 0 && <EmptyState anim="not_found" title={t('no_dishes')} text={t('no_dishes_desc')} size={160} />}
          {groups.map((g, gi) => (
            <section key={g.id} className={gi > 0 ? 'mt-12' : ''} aria-labelledby={`sec-${g.id}`}>
              <div className="flex items-center justify-between gap-4 px-2">
                <h2 id={`sec-${g.id}`} className="text-[28px] font-semibold lg:text-[32px]">{g.name}</h2>
                {gi === 0 && (
                  <button type="button" onClick={() => setSort(s => (s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none'))}
                    className="flex h-[52px] items-center gap-3 rounded-pill border border-[#CFCFCF] bg-[#F6F6F6] pl-8 pr-3 text-[16px]">
                    {sort === 'none' ? t('sort_by_price') : sort === 'asc' ? t('sort_price_low') : t('sort_price_high')}
                    <ArrowDownUp className="h-[30px] w-[30px] rounded-full bg-black/40 p-1.5 text-white" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-[31px]">
                {g.products.map(p => (
                  <ProductCard key={p.id} product={p} restaurant={r} isFavourite={wishlistedIds.has(p.id)} onToggleFavourite={toggleWishlist} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Right: basket */}
        <aside className="hidden space-y-5 xl:block">
          <div className="flex h-[125px] items-center justify-center gap-5 rounded-[8px] bg-ember-orange text-[18px] font-semibold text-white">
            <Clock className="h-[58px] w-[58px]" aria-hidden="true" />
            {r.open_now ? (r.closes_at ? t('open_until', { time: r.closes_at }) : t('open_now')) : (r.opens_at ? t('opens_at', { time: r.opens_at }) : t('closed_now'))}
          </div>
          <div className="sticky top-4"><BasketPanel /></div>
        </aside>
      </div>

      <InfoSection r={r} />
      <MapSection r={r} />
      <Reviews r={r} />

      {r.similar.length > 0 && (
        <section className="mt-12 lg:mt-[160px]" aria-labelledby="similar-title">
          <h2 id="similar-title" className="text-[24px] font-bold lg:pl-[21px] lg:text-[32px]">{t('similar_restaurants')}</h2>
          <div className="scrollbar-hide -mx-4 mt-8 flex gap-2.5 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-5 lg:px-0">
            {r.similar.map(s => <div key={s.id} className="w-[122px] shrink-0 lg:w-auto"><RestaurantTile restaurant={s} /></div>)}
          </div>
        </section>
      )}

      {offer && (
        <PopupShell open onClose={() => setOffer(null)} label={offer.title} className="max-w-[480px]">
          <Photo src={offer.image_url} className="h-[200px] w-full rounded-t-card" />
          <div className="p-8 text-center">
            <h2 className="text-[24px] font-bold">{offer.title}</h2>
            <p className="mt-2 text-[40px] font-bold text-ember-orange">−{offer.discount_percent}%</p>
            {offer.promo_code
              ? <p className="mt-3 text-[15px]">{t('offer_code_hint', { code: offer.promo_code })}{promoCode === offer.promo_code ? ` ✓ ${t('promo_active')}` : ''}</p>
              : <p className="mt-3 text-[15px]">{t('offer_auto_hint')}</p>}
            <button type="button" onClick={() => setOffer(null)} className="btn-orange mt-6 h-[50px] text-[16px]"><X className="h-4 w-4" aria-hidden="true" />{t('close')}</button>
          </div>
        </PopupShell>
      )}
    </div>
  );
}
