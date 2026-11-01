import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, CreditCard, Wallet, ArrowLeft, ArrowRight, Mail, Bike, Store } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useLocationStore } from '@/lib/locationStore.jsx';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { BasketIcon } from '@/components/ember/BasketPanel';
import LottieAnim from '@/components/ember/LottieAnim';

const PAYMENT_OPTIONS = [
  { value: 'cash', labelKey: 'pay_cash', icon: Wallet },
  { value: 'card', labelKey: 'pay_card', icon: CreditCard },
];

function Field({ id, icon: Icon, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block pl-6 text-[14px] font-semibold text-ember-navy">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-6 top-[18px] h-5 w-5 text-black/50" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

const inputCls = 'h-[57px] w-full rounded-pill border border-[#CFCFCF] bg-[#F6F6F6] pl-14 pr-6 text-[15px] outline-none focus:border-ember-orange focus:bg-white';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, formatPrice } = useLanguage();
  const { address } = useLocationStore();
  const {
    items, restaurant, subtotal, discountAmount, deliveryFee, total, promoCode, clearCart,
    fulfillment, setFulfillment, missingForMin, minOrder,
  } = useCart();
  const [form, setForm] = useState({ name: user?.name || '', phone: '', email: user?.email || '', address, notes: '', payment: 'cash' });
  const [submitting, setSubmitting] = useState(false);
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const isDelivery = fulfillment === 'delivery';
  const belowMin = isDelivery && missingForMin > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length || submitting || belowMin) return;
    setSubmitting(true);
    try {
      // Prices are calculated by the server from the menu — only the selection is sent
      const order = await base44.orders.place({
        restaurant_id: restaurant.id,
        fulfillment,
        items: items.map(i => ({
          product_id: i.product_id, quantity: i.quantity, size: i.size,
          added_ingredient_ids: i.addedIngredientIds || [], removed_ingredient_ids: i.removedIngredientIds || [],
        })),
        promo_code: promoCode,
        delivery_address: isDelivery ? form.address : '',
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_notes: form.notes,
        payment_method: form.payment,
      });
      clearCart();
      toast({ title: t('order_placed'), description: t('order_placed_desc', { number: order.order_number }) });
      navigate('/order-success?order=' + encodeURIComponent(order.order_number), { state: { order } });
    } catch (error) {
      toast({ title: t('order_failed'), description: apiErrorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="ember-container flex min-h-[50vh] items-center justify-center py-16">
        <div className="text-center">
          <LottieAnim name="empty_basket" size={170} />
          <h1 className="mt-5 text-[28px] font-bold">{t('cart_empty')}</h1>
          <p className="mt-2 text-black/60">{t('cart_empty_desc')}</p>
          <Link to="/restaurants" className="btn-orange mt-6 h-[52px] text-[16px]">{t('browse_restaurants')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <Link to={`/r/${restaurant.slug}`} className="inline-flex items-center gap-2 text-[15px] font-semibold hover:text-ember-orange">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('back_to_restaurant', { name: restaurant.name })}
      </Link>
      <h1 className="mt-4 text-[30px] font-semibold lg:text-[48px]">{t('checkout_title')}</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
        <div className="space-y-6">
          {/* Delivery / collection (kit basket tiles) */}
          <section className="rounded-card border border-black bg-ember-card p-6 lg:p-8">
            <h2 className="text-[22px] font-semibold">1. {t('fulfillment')}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4" role="radiogroup" aria-label={t('fulfillment')}>
              {[
                { value: 'delivery', icon: Bike, label: t('delivery'), sub: `${restaurant.delivery_time || '30-40'} ${t('min_short')}` },
                { value: 'collection', icon: Store, label: t('collection'), sub: t('collection_sub') },
              ].map(o => (
                <button key={o.value} type="button" role="radio" aria-checked={fulfillment === o.value} onClick={() => setFulfillment(o.value)}
                  className={`flex flex-col items-center rounded-card border px-4 py-5 ${fulfillment === o.value ? 'border-black bg-ember-line' : 'border-ember-gray text-black/50'}`}>
                  <o.icon className={`h-9 w-9 ${fulfillment === o.value ? 'text-ember-green' : ''}`} aria-hidden="true" />
                  <span className="mt-1 text-[16px] font-semibold">{o.label}</span>
                  <span className="text-[14px]">{o.sub}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Contact & address */}
          <section className="space-y-5 rounded-card border border-black bg-ember-card p-6 lg:p-8">
            <h2 className="text-[22px] font-semibold">2. {t('delivery_details')}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="co-name" icon={User} label={t('full_name')}>
                <input id="co-name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
              </Field>
              <Field id="co-phone" icon={Phone} label={t('phone')}>
                <input id="co-phone" type="tel" autoComplete="tel" required pattern="\+?[\d\s\(\)\-]{6,20}" placeholder="+993 6X XXXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field id="co-email" icon={Mail} label={t('email_optional')}>
              <input id="co-email" type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} />
            </Field>
            {isDelivery && (
              <Field id="co-address" icon={MapPin} label={t('delivery_address')}>
                <textarea id="co-address" autoComplete="street-address" required minLength={5} maxLength={500} rows={2} value={form.address} onChange={(e) => update('address', e.target.value)}
                  className="min-h-[90px] w-full rounded-[28px] border border-[#CFCFCF] bg-[#F6F6F6] py-4 pl-14 pr-6 text-[15px] outline-none focus:border-ember-orange focus:bg-white" />
              </Field>
            )}
            <div>
              <label htmlFor="co-notes" className="mb-2 block pl-6 text-[14px] font-semibold text-ember-navy">{t('notes_optional')}</label>
              <textarea id="co-notes" rows={2} maxLength={1000} value={form.notes} onChange={(e) => update('notes', e.target.value)}
                className="min-h-[80px] w-full rounded-[28px] border border-[#CFCFCF] bg-[#F6F6F6] px-6 py-4 text-[15px] outline-none focus:border-ember-orange focus:bg-white" />
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-card border border-black bg-ember-card p-6 lg:p-8">
            <h2 className="text-[22px] font-semibold">3. {t('payment_method')}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label={t('payment_method')}>
              {PAYMENT_OPTIONS.map(pm => (
                <button key={pm.value} type="button" role="radio" aria-checked={form.payment === pm.value} onClick={() => update('payment', pm.value)}
                  className={`flex h-[70px] items-center gap-4 rounded-card border-2 px-6 text-[16px] font-semibold ${form.payment === pm.value ? 'border-ember-orange bg-ember-orange/5' : 'border-ember-gray'}`}>
                  <pm.icon className={`h-6 w-6 ${form.payment === pm.value ? 'text-ember-orange' : 'text-black/50'}`} aria-hidden="true" />{t(pm.labelKey)}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit overflow-hidden rounded-card border border-black bg-[#F9F9F9] lg:sticky lg:top-6">
          <div className="flex h-[100px] items-center gap-6 bg-ember-green px-8 text-white">
            <BasketIcon className="h-12 w-12" />
            <h2 className="text-[26px] font-semibold">{t('order_summary')}</h2>
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {items.map(i => (
              <li key={i.key} className="flex items-center gap-4 border-b border-black px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember-orange text-[15px] font-bold text-white">{i.quantity}x</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ember-navy">{i.product_name}</span>
                  {i.size && <span className="block text-[13px] text-black/60">{i.size}</span>}
                </span>
                <span className="text-[16px] font-semibold text-ember-green">{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 px-5 py-5 text-[17px]">
            <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('subtotal')}:</dt><dd>{formatPrice(subtotal)}</dd></div>
            {discountAmount > 0 && <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('discounts')} ({promoCode}):</dt><dd>−{formatPrice(discountAmount)}</dd></div>}
            <div className="flex justify-between"><dt className="font-semibold text-ember-navy">{t('delivery_fee')}:</dt><dd>{deliveryFee > 0 ? formatPrice(deliveryFee) : t('free')}</dd></div>
          </dl>
          <div className="px-3 pb-4">
            <div className="flex h-[70px] items-center justify-between rounded-[8px] border border-black bg-ember-orange/80 px-6 text-white">
              <span className="text-[18px] font-semibold">{t('total_to_pay')}</span>
              <span className="text-[28px] font-semibold">{formatPrice(total)}</span>
            </div>
            <button type="submit" disabled={submitting || belowMin} className="btn-green relative mt-4 h-[70px] w-full text-[22px]">
              <span className="absolute left-5 flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white text-ember-green" aria-hidden="true"><ArrowRight className="h-5 w-5" /></span>
              {submitting ? t('placing_order') : t('place_order')}
            </button>
            {belowMin && (
              <p className="mt-3 rounded-[6px] bg-ember-navy px-4 py-3 text-center text-[14px] font-semibold text-white" role="status">
                {t('min_delivery_warning_1', { min: formatPrice(minOrder) })} <span className="text-ember-orange">{t('min_delivery_more', { amount: formatPrice(missingForMin) })}</span> {t('min_delivery_warning_2')}
              </p>
            )}
            <p className="mt-3 text-center text-[12px] text-black/60">{t('final_price_note')}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
