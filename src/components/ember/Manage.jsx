// Building blocks for the owner dashboard and the admin panel (kit styling).
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from '@/components/ui/use-toast';

export const LANGS = ['en', 'ru', 'tk'];
export const ORDER_STATUSES = ['received', 'preparing', 'packaging', 'out_for_delivery', 'delivered', 'cancelled'];

export const fieldCls = 'h-[48px] w-full rounded-[10px] border border-[#CFCFCF] bg-white px-4 text-[15px] outline-none focus:border-ember-orange';
export const labelCls = 'mb-1 block text-[13px] font-semibold text-ember-navy';

/** Normalises a stored value into { en, ru, tk }. */
export const asI18n = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? { en: v.en || '', ru: v.ru || '', tk: v.tk || '' } : { en: v || '', ru: '', tk: '' });

/** Three inputs for a translatable field. */
export function I18nInput({ label, value, onChange, required = false, multiline = false }) {
  const v = asI18n(value);
  return (
    <fieldset>
      <legend className={labelCls}>{label}{required ? ' *' : ''}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map(l => (
          <label key={l} className="relative block">
            <span className="absolute left-3 top-2 text-[10px] font-bold uppercase text-black/40">{l}</span>
            {multiline
              ? <textarea rows={2} value={v[l]} required={required && l === 'en'} onChange={(e) => onChange({ ...v, [l]: e.target.value })} className="w-full rounded-[10px] border border-[#CFCFCF] px-4 pb-2 pt-6 text-[14px] outline-none focus:border-ember-orange" />
              : <input value={v[l]} required={required && l === 'en'} onChange={(e) => onChange({ ...v, [l]: e.target.value })} className={`${fieldCls} pt-3`} />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Tabs({ tabs, active, onChange, label }) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={label}>
      {tabs.map(tab => (
        <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => onChange(tab.id)}
          className={`flex h-[48px] shrink-0 items-center gap-2 whitespace-nowrap rounded-pill px-6 text-[15px] font-semibold ${active === tab.id ? 'bg-ember-orange text-white' : 'bg-ember-section text-black hover:bg-ember-gray'}`}>
          {tab.icon && <tab.icon className="h-4 w-4" aria-hidden="true" />}{tab.label}
          {tab.badge ? <span className="rounded-full bg-ember-navy px-2 text-[12px] text-white">{tab.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Panel({ title, actions, children }) {
  return (
    <section className="rounded-card border border-black/15 bg-ember-card p-5 lg:p-8">
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[20px] font-bold lg:text-[24px]">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Generic save helper with toasts + cache invalidation. */
export function useSaver() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async (fn, { success = t('saved'), invalidate = [] } = {}) => {
    setBusy(true);
    try {
      const res = await fn();
      toast({ title: success });
      invalidate.forEach(key => qc.invalidateQueries({ queryKey: key }));
      return res;
    } catch (err) {
      toast({ title: t('save_failed'), description: apiErrorMessage(err), variant: 'destructive' });
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Orders table with status changes (owner: own restaurant; admin: all). */
export function OrdersTable({ orders, showRestaurant = false, invalidateKey }) {
  const { t, formatPrice, formatDateTime } = useLanguage();
  const { run } = useSaver();
  const [open, setOpen] = useState(null);
  if (!orders.length) return <p className="py-8 text-center text-black/60">{t('no_orders')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[14px]">
        <thead className="border-b border-black/15 text-[12px] uppercase text-black/50">
          <tr>
            <th className="py-3 pr-3">{t('order_number')}</th>
            {showRestaurant && <th className="py-3 pr-3">{t('restaurant_word')}</th>}
            <th className="py-3 pr-3">{t('customer')}</th>
            <th className="py-3 pr-3">{t('total')}</th>
            <th className="py-3 pr-3">{t('fulfillment')}</th>
            <th className="py-3 pr-3">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <FragmentRow key={o.id} o={o} open={open === o.id} toggle={() => setOpen(open === o.id ? null : o.id)} showRestaurant={showRestaurant}
              onStatus={(status) => run(() => base44.entities.Order.update(o.id, { status }), { success: t('status_updated'), invalidate: [invalidateKey] })}
              t={t} formatPrice={formatPrice} formatDateTime={formatDateTime} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRow({ o, open, toggle, showRestaurant, onStatus, t, formatPrice, formatDateTime }) {
  return (
    <>
      <tr className="border-b border-black/10 align-top">
        <td className="py-3 pr-3">
          <button type="button" onClick={toggle} aria-expanded={open} className="text-left font-semibold text-ember-orange underline-offset-2 hover:underline">{o.order_number}</button>
          <div className="text-[12px] text-black/50">{formatDateTime(o.created_at)}</div>
        </td>
        {showRestaurant && <td className="py-3 pr-3">{o.restaurant_name}</td>}
        <td className="py-3 pr-3">{o.customer_name}<div className="text-[12px] text-black/60">{o.customer_phone}</div></td>
        <td className="py-3 pr-3 font-semibold text-ember-green">{formatPrice(o.total)}<div className="text-[12px] font-normal text-black/60">{t(o.payment_method === 'card' ? 'pay_card' : 'pay_cash')}</div></td>
        <td className="py-3 pr-3">{t(o.fulfillment === 'collection' ? 'collection' : 'delivery')}</td>
        <td className="py-3 pr-3">
          <label className="sr-only" htmlFor={`st-${o.id}`}>{t('status')}</label>
          <select id={`st-${o.id}`} value={o.status} onChange={(e) => onStatus(e.target.value)} className="h-[38px] rounded-pill border border-[#CFCFCF] bg-white px-3 text-[13px] font-semibold outline-none focus:border-ember-orange">
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
          </select>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-black/10 bg-ember-section/60">
          <td colSpan={showRestaurant ? 6 : 5} className="px-3 py-4 text-[14px]">
            <ul className="space-y-1">
              {o.items?.map((i, idx) => (
                <li key={idx}>{i.quantity}× <b>{i.product_name}</b>{i.size ? ` (${i.size})` : ''}
                  {i.removed_ingredients?.length ? ` — ${t('no_word')} ${i.removed_ingredients.join(', ')}` : ''}
                  {i.added_ingredients?.length ? ` + ${i.added_ingredients.join(', ')}` : ''} · {formatPrice(i.total_price)}</li>
              ))}
            </ul>
            {o.fulfillment !== 'collection' && <p className="mt-2"><b>{t('delivery_address')}:</b> {o.delivery_address}</p>}
            {o.customer_notes && <p className="mt-1"><b>{t('comment')}:</b> {o.customer_notes}</p>}
            {o.promo_code && <p className="mt-1"><b>{t('promo_placeholder')}:</b> {o.promo_code} (−{formatPrice(o.discount_amount)})</p>}
          </td>
        </tr>
      )}
    </>
  );
}
