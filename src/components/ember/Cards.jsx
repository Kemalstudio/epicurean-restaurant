import { Link } from 'react-router-dom';
import { Plus, Star, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

/** Photo with lazy loading and a neutral placeholder background. */
export function Photo({ src, alt = '', className = '' }) {
  return src
    ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`bg-ember-gray object-cover ${className}`} />
    : <div className={`bg-ember-gray ${className}`} aria-hidden="true" />;
}

/** Navy discount badge on the top-right corner (kit: 88x66, rounded bottom corners). */
export function DiscountBadge({ percent, className = 'right-5 h-[66px] w-[88px] text-[18px]' }) {
  if (!percent) return null;
  return (
    <span className={`absolute top-0 flex items-center justify-center rounded-b-card bg-ember-navy font-bold text-white ${className}`}>
      −{percent}%
    </span>
  );
}

/** "Exclusive deals" card: big photo, gradient, "Restaurant" label + name, discount badge. */
export function DealCard({ restaurant, label }) {
  const { t } = useLanguage();
  return (
    <Link to={`/r/${restaurant.slug}`} className="group relative block aspect-[496/325] overflow-hidden rounded-card focus-visible:ring-offset-4">
      <Photo src={restaurant.cover_url || restaurant.hero_image_url} alt="" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
      <span className="deal-overlay absolute inset-0" aria-hidden="true" />
      <DiscountBadge percent={restaurant.discount_percent} />
      <span className="absolute bottom-[12%] left-[9%] right-6">
        <span className="block text-[15px] font-medium text-ember-orange md:text-[18px]">{label || t('restaurant_word')}</span>
        <span className="block text-[20px] font-bold leading-tight text-white md:text-[24px]">{restaurant.name}</span>
      </span>
    </Link>
  );
}

/** Mobile variant of the deal card (kit Mobile Home: 150x150 photo, text below). */
export function DealCardSmall({ restaurant }) {
  const { t } = useLanguage();
  return (
    <Link to={`/r/${restaurant.slug}`} className="block w-[150px] shrink-0">
      <span className="relative block h-[150px] overflow-hidden rounded-card">
        <Photo src={restaurant.cover_url || restaurant.hero_image_url} className="h-full w-full" />
        <span className="deal-overlay absolute inset-0" aria-hidden="true" />
        <DiscountBadge percent={restaurant.discount_percent} className="right-4 h-[38px] w-[46px] text-[15px]" />
      </span>
      <span className="mt-2.5 block text-[13px] font-medium text-ember-orange">{t('restaurant_word')}</span>
      <span className="block text-[14px] font-semibold leading-tight">{restaurant.name}</span>
    </Link>
  );
}

/** "Popular categories" tile: photo + navy footer with orange name and restaurant count. */
export function CuisineTile({ cuisine }) {
  const { t } = useLanguage();
  return (
    <Link to={`/restaurants?cuisine=${cuisine.slug}`} className="group block overflow-hidden rounded-card bg-ember-navy shadow-card-sm">
      <span className="block aspect-[238/203] overflow-hidden bg-ember-section">
        <Photo src={cuisine.image_url} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
      </span>
      <span className="block px-[22px] py-2.5">
        <span className="block truncate text-[16px] font-bold text-ember-orange md:text-[18px]">{cuisine.name}</span>
        <span className="block text-[13px] text-white">{t('restaurants_count', { count: cuisine.restaurant_count })}</span>
      </span>
    </Link>
  );
}

/** "Popular restaurants" tile: logo/photo on top, orange footer with white name. */
export function RestaurantTile({ restaurant }) {
  return (
    <Link to={`/r/${restaurant.slug}`} className="group block overflow-hidden rounded-card bg-ember-orange">
      <span className="block aspect-[238/203] overflow-hidden bg-white">
        <Photo src={restaurant.logo_url} alt="" className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
      </span>
      <span className="flex min-h-[63px] items-center justify-center px-3 py-2 text-center text-[16px] font-bold leading-tight text-white md:text-[18px]">
        {restaurant.name}
      </span>
    </Link>
  );
}

/** Wider restaurant card for the restaurants list page. */
export function RestaurantCard({ restaurant }) {
  const { t, formatPrice } = useLanguage();
  return (
    <Link to={`/r/${restaurant.slug}`} className="group block overflow-hidden rounded-card bg-ember-card shadow-card transition-transform hover:-translate-y-1">
      <span className="relative block aspect-[16/10] overflow-hidden">
        <Photo src={restaurant.cover_url || restaurant.hero_image_url} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        <span className="deal-overlay absolute inset-0" aria-hidden="true" />
        <DiscountBadge percent={restaurant.discount_percent} className="right-5 h-[52px] w-[70px] text-[16px]" />
        {!restaurant.open_now && (
          <span className="absolute left-4 top-4 rounded-pill bg-white px-3 py-1 text-[12px] font-semibold text-ember-navy">
            {restaurant.opens_at ? t('opens_at', { time: restaurant.opens_at }) : t('closed_now')}
          </span>
        )}
        <span className="absolute bottom-4 left-5 right-5 flex items-end gap-3">
          <Photo src={restaurant.logo_url} className="h-12 w-12 shrink-0 rounded-full border-2 border-white" />
          <span className="min-w-0">
            <span className="block truncate text-[20px] font-bold leading-tight text-white">{restaurant.name}</span>
            <span className="block truncate text-[13px] font-medium text-ember-orange">{restaurant.cuisines?.map(c => c.name).join(' · ')}</span>
          </span>
        </span>
      </span>
      <span className="flex items-center justify-between gap-2 px-5 py-4 text-[13px] text-black/70">
        <span className="flex items-center gap-1 font-semibold text-black"><Star className="h-4 w-4 fill-ember-orange text-ember-orange" aria-hidden="true" />{Number(restaurant.rating || 0).toFixed(1)}</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{restaurant.delivery_time} {t('min_short')}</span>
        <span>{t('min_order_short', { amount: formatPrice(restaurant.min_order) })}</span>
      </span>
    </Link>
  );
}

/** Offer card on the restaurant page (kit: "First Order Discount" with a round + button). */
export function OfferCard({ offer, restaurantName, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group relative block aspect-[496/325] w-full overflow-hidden rounded-card text-left">
      <Photo src={offer.image_url} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
      <span className="deal-overlay absolute inset-0" aria-hidden="true" />
      <DiscountBadge percent={offer.discount_percent} />
      <span className="absolute bottom-[10%] left-[6%] right-[25%]">
        <span className="block text-[14px] font-medium text-ember-orange md:text-[16px]">{restaurantName}</span>
        <span className="block text-[20px] font-bold leading-tight text-white md:text-[24px]">{offer.title}</span>
      </span>
      <span className="absolute bottom-0 right-0 flex h-[86px] w-[95px] items-center justify-center rounded-tl-[45px] bg-white/90" aria-hidden="true">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ember-navy text-white"><Plus className="h-6 w-6" strokeWidth={3} /></span>
      </span>
    </button>
  );
}
