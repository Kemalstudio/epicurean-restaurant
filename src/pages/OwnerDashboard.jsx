import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, UtensilsCrossed, Store, Tag, Plus, Trash2, Pencil, ExternalLink, Eye, EyeOff, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Photo } from '@/components/ember/Cards';
import { PopupShell } from '@/components/ember/Popups';
import { I18nInput, Tabs, Panel, OrdersTable, useSaver, fieldCls, labelCls, asI18n } from '@/components/ember/Manage';

const pick = (v, lang) => (v && typeof v === 'object' ? v[lang] || v.en || '' : v || '');
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/* ---------------- Orders ---------------- */
function OrdersTab({ restaurant }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('active');
  const key = ['owner-orders', restaurant.id];
  const { data: orders = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_at', 500),
    refetchInterval: 20000,
  });
  const shown = filter === 'active' ? orders.filter(o => !['delivered', 'cancelled'].includes(o.status)) : orders;
  return (
    <Panel title={t('orders_title')} actions={
      <div className="flex gap-2">
        {['active', 'all'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`h-[38px] rounded-pill px-4 text-[14px] font-semibold ${filter === f ? 'bg-ember-navy text-white' : 'bg-ember-section'}`}>{t(`orders_${f}`)}</button>
        ))}
      </div>
    }>
      {isLoading ? <Skeleton className="h-40 rounded-card" /> : <OrdersTable orders={shown} invalidateKey={key} />}
      <p className="mt-4 text-[12px] text-black/50">{t('orders_autorefresh')}</p>
    </Panel>
  );
}

/* ---------------- Menu ---------------- */
const emptyProduct = (restaurantId, sectionId) => ({
  restaurant_id: restaurantId, section_id: sectionId || '', name: { en: '', ru: '', tk: '' }, description: { en: '', ru: '', tk: '' },
  base_price: '', image_url: '', is_available: true, is_popular: false, spice_level: 0, discount_percent: 0, sizes: [],
  default_ingredients: [], optional_ingredients: [],
});

function ProductEditor({ product, sections, onClose, restaurantId }) {
  const { t, lang } = useLanguage();
  const { busy, run } = useSaver();
  const [p, setP] = useState(() => ({ ...product, name: asI18n(product.name), description: asI18n(product.description), sizes: product.sizes || [] }));
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients'], queryFn: () => base44.entities.Ingredient.list() });
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const toggleIng = (k, id) => set(k, p[k].includes(id) ? p[k].filter(x => x !== id) : [...p[k], id]);

  const save = async (e) => {
    e.preventDefault();
    const data = {
      ...p, base_price: Number(p.base_price) || 0, spice_level: Number(p.spice_level) || 0, discount_percent: Number(p.discount_percent) || 0,
      sizes: p.sizes.filter(s => s.name).map(s => ({ ...s, price_modifier: Number(s.price_modifier) || 0 })),
    };
    delete data.id; delete data.created_at; delete data.updated_at;
    const res = await run(() => (product.id ? base44.entities.Product.update(product.id, data) : base44.entities.Product.create(data)),
      { invalidate: [['owner-products', restaurantId], ['restaurant']] });
    if (res) onClose();
  };

  return (
    <PopupShell open onClose={onClose} label={t('edit_dish')} className="max-w-[820px]">
      <form onSubmit={save} className="space-y-4 p-6 lg:p-10">
        <h2 className="text-[24px] font-bold">{product.id ? t('edit_dish') : t('new_dish')}</h2>
        <I18nInput label={t('dish_name')} value={p.name} onChange={(v) => set('name', v)} required />
        <I18nInput label={t('description')} value={p.description} onChange={(v) => set('description', v)} multiline />
        <div className="grid gap-4 sm:grid-cols-3">
          <label><span className={labelCls}>{t('price_tmt')} *</span><input type="number" min="0" step="0.01" required value={p.base_price} onChange={(e) => set('base_price', e.target.value)} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('section')} *</span>
            <select required value={p.section_id} onChange={(e) => set('section_id', e.target.value)} className={fieldCls}>
              <option value="">—</option>{sections.map(s => <option key={s.id} value={s.id}>{pick(s.name, lang)}</option>)}
            </select>
          </label>
          <label><span className={labelCls}>{t('discount_percent')}</span><input type="number" min="0" max="100" value={p.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} className={fieldCls} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <label><span className={labelCls}>{t('image_url')}</span><input type="url" value={p.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" className={fieldCls} /></label>
          <Photo src={p.image_url} className="h-[72px] w-[72px] rounded-full sm:mt-4" />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={p.is_available} onChange={(e) => set('is_available', e.target.checked)} className="h-5 w-5 accent-ember-green" />{t('available')}</label>
          <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={p.is_popular} onChange={(e) => set('is_popular', e.target.checked)} className="h-5 w-5 accent-ember-orange" />{t('popular_flag')}</label>
          <label className="flex items-center gap-2 text-[14px]">{t('spice')}
            <select value={p.spice_level} onChange={(e) => set('spice_level', e.target.value)} className="h-[36px] rounded-[8px] border border-[#CFCFCF] px-2">{[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        </div>

        <fieldset className="rounded-card border border-black/15 p-4">
          <legend className="px-2 text-[14px] font-bold">{t('sizes')}</legend>
          {p.sizes.map((s, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_120px_1fr_40px] gap-2">
              <input aria-label={t('size_name')} placeholder={t('size_name')} value={s.name} onChange={(e) => set('sizes', p.sizes.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={fieldCls} />
              <input aria-label={t('extra_price')} type="number" step="0.01" placeholder="+0" value={s.price_modifier} onChange={(e) => set('sizes', p.sizes.map((x, j) => (j === i ? { ...x, price_modifier: e.target.value } : x)))} className={fieldCls} />
              <input aria-label={t('weight')} placeholder={t('weight')} value={s.weight || ''} onChange={(e) => set('sizes', p.sizes.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)))} className={fieldCls} />
              <button type="button" onClick={() => set('sizes', p.sizes.filter((_, j) => j !== i))} className="flex items-center justify-center text-ember-red" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('sizes', [...p.sizes, { name: '', price_modifier: 0, weight: '' }])} className="mt-1 flex items-center gap-1 text-[14px] font-semibold text-ember-orange"><Plus className="h-4 w-4" />{t('add_size')}</button>
        </fieldset>

        {ingredients.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[['default_ingredients', t('included_ingredients')], ['optional_ingredients', t('extra_toppings')]].map(([k, title]) => (
              <fieldset key={k} className="rounded-card border border-black/15 p-4">
                <legend className="px-2 text-[14px] font-bold">{title}</legend>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map(ing => (
                    <label key={ing.id} className={`cursor-pointer rounded-pill border px-3 py-1 text-[13px] ${p[k].includes(ing.id) ? 'border-ember-green bg-ember-green text-white' : 'border-ember-gray'}`}>
                      <input type="checkbox" className="sr-only" checked={p[k].includes(ing.id)} onChange={() => toggleIng(k, ing.id)} />{ing.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-pill h-[48px] border border-ember-navy text-[15px]">{t('cancel')}</button>
          <button type="submit" disabled={busy} className="btn-green h-[48px] px-8 text-[15px]"><Save className="h-4 w-4" aria-hidden="true" />{t('save')}</button>
        </div>
      </form>
    </PopupShell>
  );
}

function MenuTab({ restaurant }) {
  const { t, lang, formatPrice } = useLanguage();
  const { busy, run } = useSaver();
  const sKey = ['owner-sections', restaurant.id];
  const pKey = ['owner-products', restaurant.id];
  const { data: sections = [] } = useQuery({ queryKey: sKey, queryFn: () => base44.entities.MenuSection.filter({ restaurant_id: restaurant.id }, 'sort_order', 200, true) });
  const { data: products = [], isLoading } = useQuery({ queryKey: pKey, queryFn: () => base44.entities.Product.filter({ restaurant_id: restaurant.id }, '', 1000, true) });
  const [editing, setEditing] = useState(null);
  const [newSection, setNewSection] = useState({ en: '', ru: '', tk: '' });

  const addSection = async (e) => {
    e.preventDefault();
    const res = await run(() => base44.entities.MenuSection.create({ restaurant_id: restaurant.id, name: newSection, sort_order: sections.length + 1 }), { invalidate: [sKey, ['restaurant']] });
    if (res) setNewSection({ en: '', ru: '', tk: '' });
  };

  return (
    <div className="space-y-6">
      <Panel title={t('menu_sections')}>
        <ul className="mb-5 flex flex-wrap gap-2">
          {sections.map(s => (
            <li key={s.id} className="flex items-center gap-2 rounded-pill bg-ember-navy py-2 pl-4 pr-2 text-[14px] font-semibold text-white">
              {pick(s.name, lang)}
              <button type="button" onClick={() => {
                if (products.some(p => p.section_id === s.id)) {
                  toast({ title: t('section_not_empty'), variant: 'destructive' });
                  return;
                }
                run(() => base44.entities.MenuSection.delete(s.id), { success: t('deleted'), invalidate: [sKey, ['restaurant']] });
              }} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20" aria-label={t('delete')}><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={addSection} className="space-y-3">
          <I18nInput label={t('new_section')} value={newSection} onChange={setNewSection} required />
          <button type="submit" disabled={busy} className="btn-orange h-[44px] text-[15px]"><Plus className="h-4 w-4" aria-hidden="true" />{t('add_section')}</button>
        </form>
      </Panel>

      <Panel title={t('dishes')} actions={
        <button type="button" disabled={!sections.length} onClick={() => setEditing(emptyProduct(restaurant.id, sections[0]?.id))} className="btn-orange h-[44px] text-[15px]"><Plus className="h-4 w-4" aria-hidden="true" />{t('new_dish')}</button>
      }>
        {!sections.length && <p className="text-black/60">{t('add_section_first')}</p>}
        {isLoading ? <Skeleton className="h-40 rounded-card" /> : (
          <ul className="divide-y divide-black/10">
            {products.map(p => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <Photo src={p.image_url} className="h-14 w-14 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{pick(p.name, lang)}</p>
                  <p className="text-[13px] text-black/60">{pick(sections.find(s => s.id === p.section_id)?.name, lang)} · {formatPrice(p.base_price)}{p.sizes?.length ? ` · ${p.sizes.length} ${t('sizes').toLowerCase()}` : ''}</p>
                </div>
                <button type="button" onClick={() => run(() => base44.entities.Product.update(p.id, { is_available: !(p.is_available !== false) }), { invalidate: [pKey, ['restaurant']] })}
                  className={`flex h-9 items-center gap-1 rounded-pill px-3 text-[13px] font-semibold ${p.is_available !== false ? 'bg-ember-green text-white' : 'bg-ember-gray'}`}
                  aria-label={p.is_available !== false ? t('hide_dish') : t('show_dish')}>
                  {p.is_available !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="hidden sm:inline">{p.is_available !== false ? t('available') : t('hidden')}</span>
                </button>
                <button type="button" onClick={() => setEditing(p)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-section" aria-label={t('edit')}><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => window.confirm(t('confirm_delete')) && run(() => base44.entities.Product.delete(p.id), { success: t('deleted'), invalidate: [pKey, ['restaurant']] })}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-section text-ember-red" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {editing && <ProductEditor product={editing} sections={sections} restaurantId={restaurant.id} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ---------------- Profile ---------------- */
function ProfileTab({ restaurant }) {
  const { t, lang } = useLanguage();
  const { busy, run } = useSaver();
  const { data: cuisines = [] } = useQuery({ queryKey: ['cuisines-raw'], queryFn: () => base44.entities.Cuisine.list('sort_order', 100, true) });
  const [r, setR] = useState(() => ({
    ...restaurant, tagline: asI18n(restaurant.tagline), description: asI18n(restaurant.description),
    hours: Array.isArray(restaurant.hours) ? restaurant.hours : DAYS.map(() => ['10:00', '22:00']),
    cuisine_ids: restaurant.cuisine_ids || [],
  }));
  const set = (k, v) => setR(prev => ({ ...prev, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value);

  const save = (e) => {
    e.preventDefault();
    const data = {
      name: r.name, tagline: r.tagline, description: r.description, logo_url: r.logo_url, cover_url: r.cover_url, hero_image_url: r.hero_image_url,
      cuisine_ids: r.cuisine_ids, min_order: Number(r.min_order) || 0, delivery_fee: Number(r.delivery_fee) || 0, free_delivery_from: Number(r.free_delivery_from) || 0,
      delivery_time: r.delivery_time, phone: r.phone, website: r.website, address: r.address, area: r.area,
      lat: r.lat === '' || r.lat == null ? null : Number(r.lat), lng: r.lng === '' || r.lng == null ? null : Number(r.lng),
      hours: r.hours.map(h => (h ? [h[0], h[1]] : null)),
    };
    run(() => base44.entities.Restaurant.update(restaurant.id, data), { invalidate: [['owner-restaurants'], ['restaurant'], ['home'], ['restaurants']] });
  };

  const imageField = (k, label) => (
    <div className="grid grid-cols-[1fr_64px] items-end gap-3">
      <label><span className={labelCls}>{label}</span><input type="url" value={r[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder="https://…" className={fieldCls} /></label>
      <Photo src={r[k]} className="h-12 w-16 rounded-[8px]" />
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <Panel title={t('restaurant_profile')}>
        <div className="space-y-4">
          <label className="block"><span className={labelCls}>{t('restaurant_name')} *</span><input required value={pick(r.name, 'en')} onChange={(e) => set('name', e.target.value)} className={fieldCls} /></label>
          <I18nInput label={t('tagline')} value={r.tagline} onChange={(v) => set('tagline', v)} />
          <I18nInput label={t('description')} value={r.description} onChange={(v) => set('description', v)} multiline />
          <div className="grid gap-4 md:grid-cols-3">{imageField('logo_url', t('logo_url'))}{imageField('cover_url', t('cover_url'))}{imageField('hero_image_url', t('hero_url'))}</div>
          <fieldset>
            <legend className={labelCls}>{t('cuisines')}</legend>
            <div className="flex flex-wrap gap-2">
              {cuisines.map(c => (
                <label key={c.id} className={`cursor-pointer rounded-pill border px-4 py-2 text-[14px] ${r.cuisine_ids.includes(c.id) ? 'border-ember-orange bg-ember-orange text-white' : 'border-ember-gray'}`}>
                  <input type="checkbox" className="sr-only" checked={r.cuisine_ids.includes(c.id)} onChange={() => set('cuisine_ids', r.cuisine_ids.includes(c.id) ? r.cuisine_ids.filter(x => x !== c.id) : [...r.cuisine_ids, c.id])} />
                  {pick(c.name, lang)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel title={t('delivery_terms')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={labelCls}>{t('min_order_tmt')}</span><input type="number" min="0" value={r.min_order} onChange={num('min_order')} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('delivery_fee_tmt')}</span><input type="number" min="0" value={r.delivery_fee} onChange={num('delivery_fee')} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('free_delivery_tmt')}</span><input type="number" min="0" value={r.free_delivery_from} onChange={num('free_delivery_from')} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('delivery_time_min')}</span><input value={r.delivery_time || ''} onChange={(e) => set('delivery_time', e.target.value)} placeholder="25-35" className={fieldCls} /></label>
        </div>
      </Panel>

      <Panel title={t('opening_hours')}>
        <div className="grid gap-3 sm:grid-cols-2">
          {DAYS.map((d, i) => {
            const h = r.hours[i];
            return (
              <div key={d} className="flex items-center gap-3">
                <span className="w-28 text-[14px] font-semibold">{t(d)}</span>
                <label className="flex items-center gap-1 text-[13px]"><input type="checkbox" checked={!!h} onChange={(e) => set('hours', r.hours.map((x, j) => (j === i ? (e.target.checked ? ['10:00', '22:00'] : null) : x)))} className="h-4 w-4 accent-ember-green" />{t('open_word')}</label>
                {h && <>
                  <input type="time" aria-label={`${t(d)} ${t('opens')}`} value={h[0]} onChange={(e) => set('hours', r.hours.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} className="h-[38px] rounded-[8px] border border-[#CFCFCF] px-2" />
                  <span>–</span>
                  <input type="time" aria-label={`${t(d)} ${t('closes')}`} value={h[1]} onChange={(e) => set('hours', r.hours.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} className="h-[38px] rounded-[8px] border border-[#CFCFCF] px-2" />
                </>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-black/50">{t('hours_hint')}</p>
      </Panel>

      <Panel title={t('contact_information')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className={labelCls}>{t('phone')}</span><input type="tel" value={r.phone || ''} onChange={(e) => set('phone', e.target.value)} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('website')}</span><input type="url" value={r.website || ''} onChange={(e) => set('website', e.target.value)} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('restaurant_address')}</span><input value={r.address || ''} onChange={(e) => set('address', e.target.value)} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('area')}</span><input value={r.area || ''} onChange={(e) => set('area', e.target.value)} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('latitude')}</span><input type="number" step="0.0001" value={r.lat ?? ''} onChange={num('lat')} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('longitude')}</span><input type="number" step="0.0001" value={r.lng ?? ''} onChange={num('lng')} className={fieldCls} /></label>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-green h-[56px] px-10 text-[18px]"><Save className="h-5 w-5" aria-hidden="true" />{t('save_changes')}</button>
      </div>
    </form>
  );
}

/* ---------------- Promotions ---------------- */
function PromosTab({ restaurant }) {
  const { t, lang } = useLanguage();
  const { busy, run } = useSaver();
  const pcKey = ['owner-promos', restaurant.id];
  const ofKey = ['owner-offers', restaurant.id];
  const { data: codes = [] } = useQuery({ queryKey: pcKey, queryFn: () => base44.entities.PromoCode.filter({ restaurant_id: restaurant.id }) });
  const { data: offers = [] } = useQuery({ queryKey: ofKey, queryFn: () => base44.entities.Offer.filter({ restaurant_id: restaurant.id }, '', 100, true) });
  const [code, setCode] = useState({ code: '', discount_percent: 10, min_order_amount: 0, max_uses: '' });
  const [offer, setOffer] = useState({ title: { en: '', ru: '', tk: '' }, discount_percent: 10, promo_code: '', image_url: '' });

  const addCode = async (e) => {
    e.preventDefault();
    const res = await run(() => base44.entities.PromoCode.create({
      restaurant_id: restaurant.id, code: code.code.trim().toUpperCase(), discount_percent: Number(code.discount_percent),
      min_order_amount: Number(code.min_order_amount) || 0, max_uses: code.max_uses ? Number(code.max_uses) : null, is_active: true, used_count: 0,
    }), { invalidate: [pcKey] });
    if (res) setCode({ code: '', discount_percent: 10, min_order_amount: 0, max_uses: '' });
  };
  const addOffer = async (e) => {
    e.preventDefault();
    const res = await run(() => base44.entities.Offer.create({ ...offer, restaurant_id: restaurant.id, discount_percent: Number(offer.discount_percent), promo_code: offer.promo_code || null, is_active: true }), { invalidate: [ofKey, ['restaurant']] });
    if (res) setOffer({ title: { en: '', ru: '', tk: '' }, discount_percent: 10, promo_code: '', image_url: '' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title={t('promo_codes')}>
        <ul className="mb-5 divide-y divide-black/10">
          {codes.map(c => (
            <li key={c.id} className="flex items-center gap-3 py-2.5 text-[14px]">
              <span className="rounded-[6px] bg-ember-navy px-2 py-1 font-mono font-bold text-white">{c.code}</span>
              <span>−{c.discount_percent}%</span>
              <span className="text-black/60">{t('used_n', { count: c.used_count || 0 })}{c.max_uses ? ` / ${c.max_uses}` : ''}</span>
              <button type="button" onClick={() => run(() => base44.entities.PromoCode.update(c.id, { is_active: !c.is_active }), { invalidate: [pcKey] })}
                className={`ml-auto rounded-pill px-3 py-1 text-[12px] font-semibold ${c.is_active ? 'bg-ember-green text-white' : 'bg-ember-gray'}`}>{c.is_active ? t('active') : t('inactive')}</button>
              <button type="button" onClick={() => run(() => base44.entities.PromoCode.delete(c.id), { success: t('deleted'), invalidate: [pcKey] })} className="text-ember-red" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {!codes.length && <li className="py-3 text-black/60">{t('no_promos')}</li>}
        </ul>
        <form onSubmit={addCode} className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelCls}>{t('code')} *</span><input required pattern="[A-Za-z0-9_-]{3,30}" value={code.code} onChange={(e) => setCode({ ...code, code: e.target.value.toUpperCase() })} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('discount_percent')} *</span><input required type="number" min="1" max="90" value={code.discount_percent} onChange={(e) => setCode({ ...code, discount_percent: e.target.value })} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('min_order_tmt')}</span><input type="number" min="0" value={code.min_order_amount} onChange={(e) => setCode({ ...code, min_order_amount: e.target.value })} className={fieldCls} /></label>
          <label><span className={labelCls}>{t('max_uses')}</span><input type="number" min="1" value={code.max_uses} onChange={(e) => setCode({ ...code, max_uses: e.target.value })} className={fieldCls} /></label>
          <button type="submit" disabled={busy} className="btn-orange h-[44px] text-[15px] sm:col-span-2"><Plus className="h-4 w-4" aria-hidden="true" />{t('add_promo')}</button>
        </form>
      </Panel>

      <Panel title={t('offers_title')}>
        <ul className="mb-5 space-y-2">
          {offers.map(o => (
            <li key={o.id} className="flex items-center gap-3 text-[14px]">
              <Photo src={o.image_url} className="h-10 w-14 rounded-[6px]" />
              <span className="flex-1 truncate font-semibold">{pick(o.title, lang)} · −{o.discount_percent}%{o.promo_code ? ` · ${o.promo_code}` : ''}</span>
              <button type="button" onClick={() => run(() => base44.entities.Offer.delete(o.id), { success: t('deleted'), invalidate: [ofKey, ['restaurant']] })} className="text-ember-red" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {!offers.length && <li className="text-black/60">{t('no_offers')}</li>}
        </ul>
        <form onSubmit={addOffer} className="space-y-3">
          <I18nInput label={t('offer_title')} value={offer.title} onChange={(v) => setOffer({ ...offer, title: v })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className={labelCls}>{t('discount_percent')}</span><input type="number" min="1" max="100" value={offer.discount_percent} onChange={(e) => setOffer({ ...offer, discount_percent: e.target.value })} className={fieldCls} /></label>
            <label><span className={labelCls}>{t('linked_promo')}</span>
              <select value={offer.promo_code} onChange={(e) => setOffer({ ...offer, promo_code: e.target.value })} className={fieldCls}>
                <option value="">—</option>{codes.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className={labelCls}>{t('image_url')}</span><input type="url" value={offer.image_url} onChange={(e) => setOffer({ ...offer, image_url: e.target.value })} className={fieldCls} /></label>
          <button type="submit" disabled={busy} className="btn-orange h-[44px] w-full text-[15px]"><Plus className="h-4 w-4" aria-hidden="true" />{t('add_offer')}</button>
        </form>
      </Panel>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function OwnerDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { data: mine = [], isLoading } = useQuery({ queryKey: ['owner-restaurants'], queryFn: base44.market.ownerRestaurants });
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('orders');
  const restaurant = useMemo(() => mine.find(r => r.id === selectedId) || mine[0], [mine, selectedId]);

  if (isLoading) return <div className="ember-container pt-6"><Skeleton className="h-[400px] rounded-card" /></div>;
  if (!restaurant) {
    return (
      <div className="ember-container py-20 text-center">
        <Store className="mx-auto h-14 w-14 text-black/20" aria-hidden="true" />
        <h1 className="mt-4 text-[28px] font-bold">{t('no_restaurant_yet')}</h1>
        <p className="mt-2 text-black/60">{t('no_restaurant_yet_text')}</p>
        <Link to={user?.role === 'admin' ? '/admin' : '/partner'} className="btn-orange mt-6 h-[50px] text-[16px]">{user?.role === 'admin' ? t('admin_panel') : t('partner_title')}</Link>
      </div>
    );
  }

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <div className="flex flex-col gap-4 rounded-card bg-ember-navy p-6 text-white lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="flex items-center gap-4">
          <Photo src={restaurant.logo_url} className="h-16 w-16 rounded-full border-2 border-white" />
          <div>
            <p className="text-[14px] text-ember-orange">{t('owner_panel')}</p>
            <h1 className="text-[26px] font-bold lg:text-[32px]">{pick(restaurant.name, lang)}</h1>
            <p className="text-[13px] text-white/70">{t(`rstatus_${restaurant.status}`)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mine.length > 1 && (
            <select value={restaurant.id} onChange={(e) => setSelectedId(e.target.value)} aria-label={t('choose_restaurant')} className="h-[44px] max-w-[240px] rounded-pill px-4 text-[14px] text-black">
              {mine.map(r => <option key={r.id} value={r.id}>{pick(r.name, lang)}</option>)}
            </select>
          )}
          <Link to={`/r/${restaurant.slug}`} className="btn-orange h-[44px] text-[15px]"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t('view_page')}</Link>
        </div>
      </div>

      <div className="mt-6">
        <Tabs label={t('owner_panel')} active={tab} onChange={setTab} tabs={[
          { id: 'orders', label: t('orders_title'), icon: ClipboardList },
          { id: 'menu', label: t('menu'), icon: UtensilsCrossed },
          { id: 'profile', label: t('restaurant_profile'), icon: Store },
          { id: 'promos', label: t('promotions'), icon: Tag },
        ]} />
      </div>
      <div className="mt-6" key={restaurant.id}>
        {tab === 'orders' && <OrdersTab restaurant={restaurant} />}
        {tab === 'menu' && <MenuTab restaurant={restaurant} />}
        {tab === 'profile' && <ProfileTab restaurant={restaurant} />}
        {tab === 'promos' && <PromosTab restaurant={restaurant} />}
      </div>
    </div>
  );
}
