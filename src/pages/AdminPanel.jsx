import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Inbox, Store, Soup, Users, Tag, ClipboardList, Check, X, Trash2, Plus, Star, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Photo } from '@/components/ember/Cards';
import { I18nInput, Tabs, Panel, OrdersTable, useSaver, fieldCls, labelCls } from '@/components/ember/Manage';

const pick = (v, lang) => (v && typeof v === 'object' ? v[lang] || v.en || '' : v || '');

function Overview() {
  const { t, formatPrice, lang } = useLanguage();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => base44.entities.Order.list('-created_at', 1000) });
  const { data: restaurants = [] } = useQuery({ queryKey: ['admin-restaurants'], queryFn: () => base44.entities.Restaurant.list('', 500, true) });

  const valid = orders.filter(o => o.status !== 'cancelled');
  const revenue = valid.reduce((s, o) => s + (o.total || 0), 0);
  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const days = useMemo(() => {
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), { name: d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'short', day: 'numeric' }), value: 0 });
    }
    valid.forEach(o => { const e = map.get(String(o.created_at).slice(0, 10)); if (e) e.value += o.total || 0; });
    return [...map.values()].map(d => ({ ...d, value: Math.round(d.value) }));
  }, [valid, lang]);
  const top = useMemo(() => {
    const m = new Map();
    valid.forEach(o => m.set(o.restaurant_name, (m.get(o.restaurant_name) || 0) + (o.total || 0)));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [valid]);

  const stats = [
    { label: t('revenue'), value: formatPrice(revenue) },
    { label: t('total_orders'), value: orders.length },
    { label: t('active_orders'), value: active },
    { label: t('nav_restaurants'), value: restaurants.filter(r => r.status === 'approved').length },
  ];

  if (isLoading) return <Skeleton className="h-[400px] rounded-card" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-card bg-ember-orange p-5 text-white">
            <p className="text-[28px] font-light leading-none lg:text-[36px]">{s.value}</p>
            <p className="mt-2 text-[14px] font-bold">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title={t('revenue_7_days')}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Bar dataKey="value" fill="#FC8A06" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={t('top_restaurants')}>
          {top.length === 0 ? <p className="text-black/60">{t('no_orders')}</p> : (
            <ol className="space-y-3">
              {top.map(([name, sum], i) => (
                <li key={name} className="flex items-center gap-3 text-[15px]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ember-navy text-[13px] font-bold text-white">{i + 1}</span>
                  <span className="flex-1 truncate font-semibold">{name}</span>
                  <span className="text-ember-green">{formatPrice(sum)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Applications() {
  const { t, formatDateTime } = useLanguage();
  const { busy, run } = useSaver();
  const { data: partners = [] } = useQuery({ queryKey: ['admin-partner-apps'], queryFn: () => base44.entities.PartnerApplication.list('-created_at', 500) });
  const { data: riders = [] } = useQuery({ queryKey: ['admin-rider-apps'], queryFn: () => base44.entities.RiderApplication.list('-created_at', 500) });
  const statusCls = { pending: 'bg-ember-orange text-white', approved: 'bg-ember-green text-white', rejected: 'bg-ember-gray' };

  return (
    <div className="space-y-6">
      <Panel title={t('partner_applications')}>
        {partners.length === 0 ? <p className="text-black/60">{t('no_applications')}</p> : (
          <ul className="divide-y divide-black/10">
            {partners.map(a => (
              <li key={a.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
                <div className="flex-1 text-[14px]">
                  <p className="text-[16px] font-bold">{a.restaurant_name} <span className={`ml-2 rounded-pill px-2 py-0.5 text-[12px] ${statusCls[a.status]}`}>{t(`app_${a.status}`)}</span></p>
                  <p>{a.contact_name} · {a.phone} · {a.email}</p>
                  <p className="text-black/60">{a.address}{a.cuisine ? ` · ${a.cuisine}` : ''} · {formatDateTime(a.created_at)}</p>
                  {a.message && <p className="mt-1 italic text-black/70">“{a.message}”</p>}
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => run(() => base44.market.decideApplication(a.id, 'approve'), { success: t('approved_msg'), invalidate: [['admin-partner-apps'], ['admin-restaurants'], ['admin-users']] })} className="btn-green h-[40px] px-4 text-[14px]"><Check className="h-4 w-4" aria-hidden="true" />{t('approve')}</button>
                    <button type="button" disabled={busy} onClick={() => run(() => base44.market.decideApplication(a.id, 'reject'), { success: t('rejected_msg'), invalidate: [['admin-partner-apps']] })} className="btn-pill h-[40px] border border-ember-red px-4 text-[14px] text-ember-red"><X className="h-4 w-4" aria-hidden="true" />{t('reject')}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={t('rider_applications')}>
        {riders.length === 0 ? <p className="text-black/60">{t('no_applications')}</p> : (
          <ul className="divide-y divide-black/10">
            {riders.map(a => (
              <li key={a.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-[14px]">
                  <p className="font-bold">{a.name} <span className={`ml-2 rounded-pill px-2 py-0.5 text-[12px] ${statusCls[a.status]}`}>{t(`app_${a.status}`)}</span></p>
                  <p className="text-black/70">{a.phone}{a.email ? ` · ${a.email}` : ''} · {t(`vehicle_${a.vehicle}`)}{a.area ? ` · ${a.area}` : ''}</p>
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => run(() => base44.entities.RiderApplication.update(a.id, { status: 'approved' }), { invalidate: [['admin-rider-apps'], ['home']] })} className="btn-green h-[36px] px-3 text-[13px]">{t('approve')}</button>
                    <button type="button" onClick={() => run(() => base44.entities.RiderApplication.update(a.id, { status: 'rejected' }), { invalidate: [['admin-rider-apps']] })} className="btn-pill h-[36px] border border-ember-red px-3 text-[13px] text-ember-red">{t('reject')}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function RestaurantsAdmin() {
  const { t, lang } = useLanguage();
  const { run } = useSaver();
  const key = ['admin-restaurants'];
  const { data: list = [], isLoading } = useQuery({ queryKey: key, queryFn: () => base44.entities.Restaurant.list('-created_at', 500, true) });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: base44.admin.users });
  const owners = new Map(users.map(u => [u.id, u]));
  const upd = (id, data) => run(() => base44.entities.Restaurant.update(id, data), { invalidate: [key, ['home'], ['restaurants']] });

  if (isLoading) return <Skeleton className="h-[300px] rounded-card" />;
  return (
    <Panel title={t('nav_restaurants')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="border-b border-black/15 text-[12px] uppercase text-black/50">
            <tr><th className="py-3">{t('restaurant_word')}</th><th>{t('owner')}</th><th>{t('status')}</th><th>{t('featured')}</th><th>{t('deal_percent')}</th><th /></tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-b border-black/10">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3"><Photo src={r.logo_url} className="h-10 w-10 rounded-full" /><span className="font-semibold">{pick(r.name, lang)}</span></div>
                </td>
                <td className="pr-3 text-black/70">{owners.get(r.owner_id)?.email || '—'}</td>
                <td className="pr-3">
                  <select value={r.status} onChange={(e) => upd(r.id, { status: e.target.value })} aria-label={t('status')} className="h-[36px] rounded-pill border border-[#CFCFCF] px-3 text-[13px]">
                    {['approved', 'pending', 'suspended'].map(s => <option key={s} value={s}>{t(`rstatus_${s}`)}</option>)}
                  </select>
                </td>
                <td className="pr-3">
                  <button type="button" onClick={() => upd(r.id, { is_featured: !r.is_featured })} aria-pressed={!!r.is_featured} aria-label={t('featured')}>
                    <Star className={`h-6 w-6 ${r.is_featured ? 'fill-ember-orange text-ember-orange' : 'text-ember-gray-dark'}`} />
                  </button>
                </td>
                <td className="pr-3">
                  <input type="number" min="0" max="90" defaultValue={r.discount_percent || 0} aria-label={t('deal_percent')}
                    onBlur={(e) => Number(e.target.value) !== (r.discount_percent || 0) && upd(r.id, { discount_percent: Number(e.target.value) || 0 })}
                    className="h-[36px] w-20 rounded-[8px] border border-[#CFCFCF] px-2" />
                </td>
                <td><Link to={`/r/${r.slug}`} className="inline-flex items-center gap-1 text-ember-orange" aria-label={t('view_page')}><ExternalLink className="h-4 w-4" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] text-black/60">{t('admin_restaurants_hint')}</p>
    </Panel>
  );
}

function CuisinesAdmin() {
  const { t, lang } = useLanguage();
  const { busy, run } = useSaver();
  const key = ['cuisines-raw'];
  const { data: list = [] } = useQuery({ queryKey: key, queryFn: () => base44.entities.Cuisine.list('sort_order', 100, true) });
  const [form, setForm] = useState({ name: { en: '', ru: '', tk: '' }, slug: '', image_url: '' });
  const add = async (e) => {
    e.preventDefault();
    const res = await run(() => base44.entities.Cuisine.create({ ...form, slug: form.slug.toLowerCase(), sort_order: list.length + 1 }), { invalidate: [key, ['home']] });
    if (res) setForm({ name: { en: '', ru: '', tk: '' }, slug: '', image_url: '' });
  };
  return (
    <Panel title={t('cuisines')}>
      <ul className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(c => (
          <li key={c.id} className="flex items-center gap-3 rounded-card bg-ember-navy p-3 text-white">
            <Photo src={c.image_url} className="h-12 w-12 rounded-[8px]" />
            <span className="flex-1 truncate text-[14px] font-bold text-ember-orange">{pick(c.name, lang)}</span>
            <button type="button" onClick={() => window.confirm(t('confirm_delete')) && run(() => base44.entities.Cuisine.delete(c.id), { success: t('deleted'), invalidate: [key, ['home']] })} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="space-y-3">
        <I18nInput label={t('new_cuisine')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelCls}>Slug *</span><input required pattern="[a-z0-9-]{2,40}" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="pizza" className={fieldCls} /></label>
          <label><span className={labelCls}>{t('image_url')}</span><input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={fieldCls} /></label>
        </div>
        <button type="submit" disabled={busy} className="btn-orange h-[44px] text-[15px]"><Plus className="h-4 w-4" aria-hidden="true" />{t('add')}</button>
      </form>
    </Panel>
  );
}

function UsersAdmin() {
  const { t, formatDate } = useLanguage();
  const { user: me } = useAuth();
  const { run } = useSaver();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: base44.admin.users });
  const [q, setQ] = useState('');
  const shown = users.filter(u => !q || `${u.email} ${u.name}`.toLowerCase().includes(q.toLowerCase()));
  if (isLoading) return <Skeleton className="h-[300px] rounded-card" />;
  return (
    <Panel title={t('users')} actions={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} className="h-[40px] rounded-pill border border-[#CFCFCF] px-4 text-[14px]" />}>
      <ul className="divide-y divide-black/10">
        {shown.map(u => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 text-[14px]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-navy font-bold text-white">{(u.name || u.email).charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{u.name}</span><span className="block truncate text-black/60">{u.email} · {formatDate(u.created_at)}</span></span>
            <select value={u.role} disabled={u.id === me?.id} onChange={(e) => run(() => base44.admin.setRole(u.id, e.target.value), { invalidate: [['admin-users']] })} aria-label={t('role')}
              className="h-[36px] rounded-pill border border-[#CFCFCF] px-3 text-[13px]">
              {['user', 'owner', 'admin'].map(r => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function PromosAdmin() {
  const { t } = useLanguage();
  const { busy, run } = useSaver();
  const key = ['admin-promos'];
  const { data: codes = [] } = useQuery({ queryKey: key, queryFn: () => base44.entities.PromoCode.list('-created_at', 500) });
  const [f, setF] = useState({ code: '', discount_percent: 10, min_order_amount: 0, max_uses: '', expires_at: '' });
  const add = async (e) => {
    e.preventDefault();
    const res = await run(() => base44.entities.PromoCode.create({
      code: f.code.trim().toUpperCase(), discount_percent: Number(f.discount_percent), min_order_amount: Number(f.min_order_amount) || 0,
      max_uses: f.max_uses ? Number(f.max_uses) : null, expires_at: f.expires_at || null, is_active: true, used_count: 0, restaurant_id: null,
    }), { invalidate: [key] });
    if (res) setF({ code: '', discount_percent: 10, min_order_amount: 0, max_uses: '', expires_at: '' });
  };
  return (
    <Panel title={t('promo_codes')}>
      <ul className="mb-6 divide-y divide-black/10">
        {codes.map(c => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5 text-[14px]">
            <span className="rounded-[6px] bg-ember-navy px-2 py-1 font-mono font-bold text-white">{c.code}</span>
            <span>−{c.discount_percent}%</span>
            <span className="text-black/60">{c.restaurant_id ? t('restaurant_only') : t('all_restaurants')} · {t('used_n', { count: c.used_count || 0 })}{c.max_uses ? ` / ${c.max_uses}` : ''}</span>
            <button type="button" onClick={() => run(() => base44.entities.PromoCode.update(c.id, { is_active: !c.is_active }), { invalidate: [key] })}
              className={`ml-auto rounded-pill px-3 py-1 text-[12px] font-semibold ${c.is_active ? 'bg-ember-green text-white' : 'bg-ember-gray'}`}>{c.is_active ? t('active') : t('inactive')}</button>
            <button type="button" onClick={() => run(() => base44.entities.PromoCode.delete(c.id), { success: t('deleted'), invalidate: [key] })} className="text-ember-red" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label><span className={labelCls}>{t('code')} *</span><input required pattern="[A-Za-z0-9_-]{3,30}" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className={fieldCls} /></label>
        <label><span className={labelCls}>{t('discount_percent')} *</span><input required type="number" min="1" max="90" value={f.discount_percent} onChange={(e) => setF({ ...f, discount_percent: e.target.value })} className={fieldCls} /></label>
        <label><span className={labelCls}>{t('min_order_tmt')}</span><input type="number" min="0" value={f.min_order_amount} onChange={(e) => setF({ ...f, min_order_amount: e.target.value })} className={fieldCls} /></label>
        <label><span className={labelCls}>{t('max_uses')}</span><input type="number" min="1" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} className={fieldCls} /></label>
        <label><span className={labelCls}>{t('expires')}</span><input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className={fieldCls} /></label>
        <button type="submit" disabled={busy} className="btn-orange h-[44px] text-[15px] sm:col-span-2 lg:col-span-5"><Plus className="h-4 w-4" aria-hidden="true" />{t('add_promo')}</button>
      </form>
    </Panel>
  );
}

function OrdersAdmin() {
  const { t } = useLanguage();
  const key = ['admin-orders'];
  const { data: orders = [], isLoading } = useQuery({ queryKey: key, queryFn: () => base44.entities.Order.list('-created_at', 1000), refetchInterval: 30000 });
  return <Panel title={t('orders_title')}>{isLoading ? <Skeleton className="h-40 rounded-card" /> : <OrdersTable orders={orders} showRestaurant invalidateKey={key} />}</Panel>;
}

export default function AdminPanel() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('overview');
  const { data: partners = [] } = useQuery({ queryKey: ['admin-partner-apps'], queryFn: () => base44.entities.PartnerApplication.list('-created_at', 500) });
  const pending = partners.filter(a => a.status === 'pending').length;

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <div className="rounded-card bg-ember-navy p-6 text-white lg:p-8">
        <p className="text-[14px] text-ember-orange">Ember</p>
        <h1 className="text-[28px] font-bold lg:text-[36px]">{t('admin_panel')}</h1>
      </div>
      <div className="mt-6">
        <Tabs label={t('admin_panel')} active={tab} onChange={setTab} tabs={[
          { id: 'overview', label: t('overview'), icon: LayoutDashboard },
          { id: 'applications', label: t('applications'), icon: Inbox, badge: pending },
          { id: 'restaurants', label: t('nav_restaurants'), icon: Store },
          { id: 'cuisines', label: t('cuisines'), icon: Soup },
          { id: 'users', label: t('users'), icon: Users },
          { id: 'promos', label: t('promo_codes'), icon: Tag },
          { id: 'orders', label: t('orders_title'), icon: ClipboardList },
        ]} />
      </div>
      <div className="mt-6">
        {tab === 'overview' && <Overview />}
        {tab === 'applications' && <Applications />}
        {tab === 'restaurants' && <RestaurantsAdmin />}
        {tab === 'cuisines' && <CuisinesAdmin />}
        {tab === 'users' && <UsersAdmin />}
        {tab === 'promos' && <PromosAdmin />}
        {tab === 'orders' && <OrdersAdmin />}
      </div>
    </div>
  );
}
