import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBasket, CheckCircle2, X, ArrowRight, Bike, Store, Minus, Plus, Clock, AlertTriangle } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import LottieAnim from './LottieAnim';

/** Basket header icon: basket with a check badge, like the kit's "Full Shopping Basket". */
export function BasketIcon({ className = 'h-[58px] w-[58px]' }) {
  return (
    <span className={`relative inline-flex ${className}`} aria-hidden="true">
      <ShoppingBasket className="h-full w-full" strokeWidth={1.8} />
      <CheckCircle2 className="absolute -bottom-1 -right-1 h-[45%] w-[45%] rounded-full bg-ember-green" strokeWidth={2.4} />
    </span>
  );
}

function PromoField() {
  const { t } = useLanguage();
  const { promoCode, setPromo, subtotal, restaurant } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await base44.orders.checkPromo(code.trim(), subtotal, restaurant?.id);
      setPromo(res.code, res.discount_percent);
      toast({ title: t('promo_applied'), description: t('promo_applied_desc', { percent: res.discount_percent }) });
      setOpen(false);
    } catch (err) {
      toast({ title: t('promo_failed'), description: apiErrorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (promoCode) {
    return (
      <div className="flex h-[52px] items-center justify-between rounded-pill border border-[#CFCFCF] bg-[#F6F6F6] pl-10 pr-3 text-[16px]">
        <span><span className="font-semibold">{promoCode}</span> {t('promo_active')}</span>
        <button type="button" onClick={() => setPromo(null, 0)} className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ember-gray-dark text-white" aria-label={t('remove_promo')}>
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return open ? (
    <form onSubmit={apply} className="flex h-[52px] items-center rounded-pill border border-ember-orange bg-white pl-6 pr-1.5">
      <label htmlFor="basket-promo" className="sr-only">{t('promo_placeholder')}</label>
      <input id="basket-promo" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('promo_placeholder')}
        className="min-w-0 flex-1 bg-transparent text-[16px] uppercase outline-none" maxLength={30} />
      <button type="submit" disabled={busy} className="flex h-[40px] items-center rounded-pill bg-ember-green px-4 text-[14px] font-semibold text-white">{t('apply')}</button>
    </form>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="flex h-[52px] w-full items-center justify-between rounded-pill border border-[#CFCFCF] bg-[#F6F6F6] pl-10 pr-4 text-left text-[16px]">
      {t('apply_coupon')}
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ember-green text-white" aria-hidden="true"><ArrowRight className="h-4 w-4" /></span>
    </button>
  );
}

/**
 * "My Basket" panel from the kit. Used in the restaurant page sidebar and in the basket drawer.
 * @param onCheckout optional callback (e.g. close drawer) before navigating to /checkout
 */
export default function BasketPanel({ onCheckout, compact = false }) {
  const { t, formatPrice } = useLanguage();
  const navigate = useNavigate();
  const {
    items, restaurant, removeItem, updateQuantity, subtotal, discountAmount, deliveryFee, total,
    fulfillment, setFulfillment, missingForMin, minOrder, promoCode,
  } = useCart();

  const blocked = items.length === 0 || (fulfillment === 'delivery' && missingForMin > 0);

  return (
    // compact = inside the slide-out drawer: full-height panel, no card corners/border
    // (rounded corners showed the drawer's white background in the top corners)
    <section className={compact ? 'min-h-full bg-[#F9F9F9]' : 'overflow-hidden rounded-card border border-black bg-[#F9F9F9]'} aria-label={t('my_basket')}>
      <div className="flex h-[100px] items-center gap-5 border-b border-white bg-ember-green px-7 text-white 2xl:h-[117px] 2xl:gap-8 2xl:px-12">
        <BasketIcon className="h-[48px] w-[48px] shrink-0 2xl:h-[58px] 2xl:w-[58px]" />
        <h2 className="whitespace-nowrap text-[26px] font-semibold 2xl:text-[32px]">{t('my_basket')}</h2>
      </div>

      {restaurant && items.length > 0 && (
        <Link to={`/r/${restaurant.slug}`} className="flex items-center gap-3 border-b border-black px-5 py-3 text-[15px] font-semibold text-ember-navy hover:text-ember-orange">
          {restaurant.logo_url && <img src={restaurant.logo_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
          <span className="truncate">{restaurant.name}</span>
          {restaurant.delivery_time && <span className="ml-auto flex shrink-0 items-center gap-1 text-[13px] font-normal text-black/60"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{restaurant.delivery_time} {t('min_short')}</span>}
        </Link>
      )}

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <LottieAnim name="empty_basket" size={150} />
          <p className="mt-5 text-[16px] font-semibold text-ember-navy">{t('cart_empty')}</p>
          <p className="mt-1 text-[14px] text-black/60">{t('cart_empty_desc')}</p>
          <Link to="/restaurants" onClick={onCheckout} className="btn-orange mt-6 h-[48px] text-[16px]">{t('browse_restaurants')}</Link>
        </div>
      ) : (
        <>
          <ul className={compact ? '' : 'max-h-[560px] overflow-y-auto'}>
            {items.map(item => {
              const notes = [
                item.size,
                ...item.removedIngredients.map(n => `${t('no_word')} ${n}`),
                ...item.addedIngredients.map(n => `+ ${n}`),
              ].filter(Boolean).join(', ');
              return (
                <li key={item.key} className="flex items-center gap-5 border-b border-black px-5 py-4">
                  <span className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-ember-orange text-[22px] font-bold text-white" aria-label={t('quantity_n', { count: item.quantity })}>
                    {item.quantity}x
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[20px] font-semibold text-ember-green">{formatPrice(item.unitPrice * item.quantity)}</p>
                    <p className="text-[16px] font-semibold leading-tight text-ember-navy">{item.product_name}</p>
                    {notes && <p className="mt-1 text-[14px] leading-snug text-black">{notes}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-navy text-white relative after:absolute after:-inset-2 after:content-['']" aria-label={t('decrease_quantity')}><Minus className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-navy text-white relative after:absolute after:-inset-2 after:content-['']" aria-label={t('increase_quantity')}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(item.key)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#8E8E8E] text-white transition-colors hover:bg-ember-red" aria-label={t('remove_item')}>
                    <X className="h-5 w-5" strokeWidth={3} />
                  </button>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-3 border-b border-black px-5 py-6 text-[20px]">
            <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('subtotal')}:</dt><dd className="text-[22px] text-[#212121]">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('discounts')}:</dt><dd className="text-[22px] text-[#212121]">{discountAmount > 0 ? `−${formatPrice(discountAmount)}` : formatPrice(0)}</dd></div>
            <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('delivery_fee')}:</dt><dd className="text-[22px] text-[#212121]">{deliveryFee > 0 ? formatPrice(deliveryFee) : t('free')}</dd></div>
          </dl>

          <div className="space-y-3.5 border-b border-black px-3 py-5">
            <div className="flex h-[70px] items-center justify-between rounded-[8px] border border-black bg-ember-orange/80 px-8 text-white">
              <span className="text-[20px] font-semibold">{t('total_to_pay')}</span>
              <span className="text-[24px] font-semibold 2xl:text-[32px]">{formatPrice(total)}</span>
            </div>
            <PromoField key={promoCode || 'none'} />
          </div>

          <div className="grid grid-cols-2 items-stretch border-b border-black p-3.5" role="radiogroup" aria-label={t('fulfillment')}>
            {[
              { value: 'delivery', icon: Bike, label: t('delivery'), sub: restaurant?.delivery_time ? `${restaurant.delivery_time} ${t('min_short')}` : '' },
              { value: 'collection', icon: Store, label: t('collection'), sub: t('collection_sub') },
            ].map((opt, i) => {
              const active = fulfillment === opt.value;
              return (
                <button key={opt.value} type="button" role="radio" aria-checked={active} onClick={() => setFulfillment(opt.value)}
                  className={`flex flex-col items-center justify-center rounded-card px-2 py-3 text-center ${active ? 'border border-black bg-ember-line' : 'text-black/50'} ${i === 1 ? 'border-l-black' : ''}`}>
                  <opt.icon className={`mb-1 h-[35px] w-[35px] ${active ? 'text-ember-green' : ''}`} aria-hidden="true" />
                  <span className="text-[16px] font-semibold">{opt.label}</span>
                  {opt.sub && <span className="text-[14px]">{opt.sub}</span>}
                </button>
              );
            })}
          </div>

          <div className="p-3.5">
            <button
              type="button"
              disabled={blocked}
              onClick={() => { onCheckout?.(); navigate('/checkout'); }}
              className="btn-green relative h-[70px] w-full text-[24px]"
            >
              <span className="absolute left-5 flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white text-ember-green" aria-hidden="true"><ArrowRight className="h-5 w-5" /></span>
              {t('checkout_btn')}
            </button>
            {fulfillment === 'delivery' && missingForMin > 0 && (
              <div className="relative mt-4 rounded-[6px] bg-ember-navy px-5 py-4 text-center text-[16px] font-semibold text-white" role="status">
                <span className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center" aria-hidden="true"><AlertTriangle className="h-6 w-6 fill-ember-navy text-white" /></span>
                {t('min_delivery_warning_1', { min: formatPrice(minOrder) })}{' '}
                <span className="text-ember-orange underline">{t('min_delivery_more', { amount: formatPrice(missingForMin) })}</span>{' '}
                {t('min_delivery_warning_2')}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
