import { useMemo, useState } from 'react';
import { Flame, Plus, Check, ChevronRight, Leaf, Drumstick, Minus, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';
import { Photo } from './Cards';
import { PopupShell } from './Popups';

const priceOf = (product, sizeName) => {
  const size = sizeName ? (product.sizes || []).find(s => s.name === sizeName) : null;
  return (Number(product.base_price) + (Number(size?.price_modifier) || 0)) * (1 - (Number(product.discount_percent) || 0) / 100);
};

const hasOptions = (p) => (p.default_ingredients?.length || 0) + (p.optional_ingredients?.length || 0) > 0;

/** Red chilli scale 0–5 (kit uses five chilli icons). */
export function SpiceLevel({ level = 0 }) {
  const { t } = useLanguage();
  if (!level) return null;
  return (
    <span className="mt-1 flex gap-0.5" role="img" aria-label={t('spice_level', { level })}>
      {[1, 2, 3, 4, 5].map(i => (
        <Flame key={i} className={`h-[18px] w-[18px] ${i <= level ? 'fill-[#E12B25] text-[#E12B25]' : 'fill-[#8E8E8E] text-[#8E8E8E]'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

function OptionGroup({ title, icon: Icon, children }) {
  return (
    <fieldset className="relative mt-10 rounded-card border border-black/30 px-5 pb-5 pt-10 first:mt-6">
      <legend className="absolute -top-6 left-6 flex items-center">
        <span className="relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-ember-orange" aria-hidden="true"><Icon className="h-6 w-6 text-ember-navy" /></span>
        <span className="-ml-3 rounded-r-[4px] bg-ember-navy py-2.5 pl-6 pr-5 text-[16px] font-bold text-white">{title}</span>
      </legend>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CheckOption({ checked, onChange, label, extra }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[16px] font-bold">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[4px] border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-ember-orange ${checked ? 'border-ember-green bg-ember-green' : 'border-[#D8D8D8] bg-white'}`} aria-hidden="true">
        {checked && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      {extra && <span className="text-[14px] font-semibold text-ember-green">{extra}</span>}
    </label>
  );
}

/** Customisation popup (kit: "Customise Pizza"). */
export function ProductOptionsModal({ product, restaurant, initialSize, onClose }) {
  const { t, formatPrice } = useLanguage();
  const { addItem } = useCart();
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients'], queryFn: () => base44.entities.Ingredient.list(), staleTime: 300000 });
  const byId = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);
  const [size, setSize] = useState(initialSize || product.sizes?.[0]?.name || null);
  const [removed, setRemoved] = useState(new Set());
  const [added, setAdded] = useState(new Set());
  const [qty, setQty] = useState(1);

  const toggle = (setter) => (id) => setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const extras = [...added].reduce((s, id) => s + (Number(byId.get(id)?.price) || 0), 0);
  const unit = (priceOf(product, size) + extras * (1 - (Number(product.discount_percent) || 0) / 100));

  const confirm = () => {
    addItem({
      product, restaurant, quantity: qty, size,
      added: [...added].map(id => ({ id, name: byId.get(id)?.name || id, price: byId.get(id)?.price || 0 })),
      removed: [...removed].map(id => ({ id, name: byId.get(id)?.name || id })),
    });
    onClose();
  };

  return (
    <PopupShell open onClose={onClose} label={product.name} className="max-w-[635px]">
      <div className="h-[140px] overflow-hidden rounded-t-card"><Photo src={product.image_url} alt="" className="h-full w-full" /></div>
      <div className="px-6 pb-8 pt-5 sm:px-[78px]">
        <nav className="flex items-center gap-1.5 text-[13px] font-semibold" aria-label="breadcrumb">
          <span>{restaurant.name}</span><ChevronRight className="h-4 w-4" aria-hidden="true" /><span>{product.name}</span>
        </nav>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h2 className="text-[18px]">{t('customise_title', { name: product.name })}</h2>
          {added.size > 0 && <span className="text-[13px] font-bold">{t('extras_selected', { count: added.size })}</span>}
        </div>

        {product.sizes?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label={t('select_size')}>
            {product.sizes.map(s => (
              <button key={s.name} type="button" role="radio" aria-checked={size === s.name} onClick={() => setSize(s.name)}
                className={`flex items-center gap-3 rounded-[4px] border border-ember-navy py-2 pl-4 pr-2 text-[14px] font-bold ${size === s.name ? 'bg-ember-navy text-white' : ''}`}>
                {s.name}{s.weight ? <span className="font-normal opacity-70">{s.weight}</span> : null}
                <span className="rounded-[4px] bg-ember-green px-3 py-1.5 text-white">{formatPrice(priceOf(product, s.name))}</span>
              </button>
            ))}
          </div>
        )}

        {product.default_ingredients?.length > 0 && (
          <OptionGroup title={t('included_ingredients')} icon={Leaf}>
            {product.default_ingredients.map(id => (
              <CheckOption key={id} checked={!removed.has(id)} onChange={() => toggle(setRemoved)(id)} label={byId.get(id)?.name || '…'} />
            ))}
          </OptionGroup>
        )}
        {product.optional_ingredients?.length > 0 && (
          <OptionGroup title={t('extra_toppings')} icon={Drumstick}>
            {product.optional_ingredients.map(id => (
              <CheckOption key={id} checked={added.has(id)} onChange={() => toggle(setAdded)(id)} label={byId.get(id)?.name || '…'}
                extra={byId.get(id)?.price ? `+${formatPrice(byId.get(id).price)}` : ''} />
            ))}
          </OptionGroup>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex h-[48px] items-center gap-4 rounded-[4px] bg-ember-orange/80 px-4 text-white">
            <span className="text-[14px] font-semibold">{t('total_to_pay')}</span>
            <span className="text-[22px] font-semibold">{formatPrice(unit * qty)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-navy text-white" aria-label={t('decrease_quantity')}><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center text-[16px] font-bold" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty(q => Math.min(99, q + 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-navy text-white" aria-label={t('increase_quantity')}><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-8">
          <button type="button" onClick={onClose} className="text-[14px] font-semibold underline underline-offset-2">{t('take_me_back')}</button>
          <button type="button" onClick={confirm} className="btn-green relative h-[48px] w-[200px] text-[16px]">
            <span className="absolute left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ember-green" aria-hidden="true"><ArrowRight className="h-4 w-4" /></span>
            {t('add_to_basket')}
          </button>
        </div>
      </div>
    </PopupShell>
  );
}

/** Menu item card (kit: Ordering page product with size/price buttons). */
export default function ProductCard({ product, restaurant, isFavourite, onToggleFavourite }) {
  const { t, formatPrice } = useLanguage();
  const { addItem } = useCart();
  const [modalSize, setModalSize] = useState(undefined);
  const sizes = product.sizes?.length ? product.sizes : [{ name: null }];
  const unavailable = product.is_available === false;

  const choose = (sizeName) => {
    if (hasOptions(product)) setModalSize(sizeName);
    else addItem({ product, restaurant, size: sizeName, quantity: 1 });
  };

  return (
    <article className={`relative rounded-[8px] border border-black bg-ember-card p-5 shadow-card sm:p-7 ${unavailable ? 'opacity-60' : ''}`}>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-semibold leading-tight text-black sm:text-[24px]">{product.name}</h3>
          <SpiceLevel level={product.spice_level} />
          {product.description && <p className="mt-3 text-[14px] leading-[1.8] text-black">{product.description}</p>}
          {product.discount_percent > 0 && <p className="mt-2 inline-block rounded-[4px] bg-ember-navy px-2 py-0.5 text-[13px] font-bold text-white">−{product.discount_percent}%</p>}
        </div>
        <div className="relative shrink-0">
          <Photo src={product.image_url} alt={product.name} className="h-[117px] w-[117px] rounded-full sm:h-[191px] sm:w-[191px]" />
          {onToggleFavourite && (
            <button type="button" onClick={() => onToggleFavourite(product.id)} aria-pressed={!!isFavourite}
              aria-label={isFavourite ? t('remove_from_wishlist') : t('add_to_wishlist')}
              className="absolute -left-2 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
              <svg viewBox="0 0 24 24" className={`h-6 w-6 ${isFavourite ? 'fill-ember-green text-ember-green' : 'fill-none text-ember-green'}`} stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
            </button>
          )}
        </div>
      </div>

      {unavailable ? (
        <p className="mt-6 text-[14px] font-semibold text-ember-red">{t('unavailable_now')}</p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {sizes.map((s, i) => (
            <button key={s.name || 'one'} type="button" onClick={() => choose(s.name)}
              className={`group flex h-[58px] items-center gap-3 rounded-[4px] border border-ember-navy pl-4 pr-2.5 text-[14px] font-bold transition-colors hover:bg-ember-navy hover:text-white ${i === 0 && s.name ? 'bg-ember-navy text-white' : 'text-black'}`}
              aria-label={`${s.name ? s.name + ' — ' : ''}${formatPrice(priceOf(product, s.name))}. ${t('add_to_basket')}`}>
              {s.name || t('add_to_basket')}
              <span className="flex h-[39px] min-w-[90px] items-center justify-center rounded-[4px] bg-ember-green px-3 text-white">{formatPrice(priceOf(product, s.name))}</span>
            </button>
          ))}
        </div>
      )}

      {modalSize !== undefined && (
        <ProductOptionsModal product={product} restaurant={restaurant} initialSize={modalSize} onClose={() => setModalSize(undefined)} />
      )}
    </article>
  );
}
