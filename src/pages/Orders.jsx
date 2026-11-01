import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Store, RotateCcw } from 'lucide-react';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import OrderTracker from '@/components/dashboard/OrderTracker';
import { EmptyState } from '@/components/ember/LottieAnim';

const ACTIVE = (o) => !['delivered', 'cancelled'].includes(o.status);
const STATUS_STYLE = {
  received: 'bg-ember-navy text-white', preparing: 'bg-ember-orange text-white', packaging: 'bg-ember-orange text-white',
  out_for_delivery: 'bg-ember-green text-white', delivered: 'bg-ember-line text-ember-navy', cancelled: 'bg-[#FFB1B1] text-ember-navy',
};

function GuestTrack() {
  const { t, formatPrice } = useLanguage();
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get('order') || '');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { setResult(await base44.orders.track(number.trim(), phone)); }
    catch (err) { setResult(null); setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <section className="rounded-card bg-ember-gray p-6 lg:p-10" aria-labelledby="track-title">
      <h2 id="track-title" className="text-[22px] font-bold lg:text-[28px]">{t('track_by_number')}</h2>
      <p className="mt-1 text-[15px] text-black/70">{t('track_by_number_sub')}</p>
      <form onSubmit={submit} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="block"><span className="sr-only">{t('order_number')}</span>
          <input required value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder={t('order_number_placeholder')} className="input-pill" />
        </label>
        <label className="block"><span className="sr-only">{t('phone')}</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+993 6X XXXXXX" className="input-pill" />
        </label>
        <button type="submit" disabled={busy} className="btn-orange h-[57px] text-[16px] font-bold"><Search className="h-5 w-5" aria-hidden="true" />{t('track_order')}</button>
      </form>
      {error && <p className="mt-4 font-semibold text-ember-red" role="alert">{error}</p>}
      {result && (
        <div className="mt-6 space-y-4">
          <p className="text-[15px]"><span className="font-semibold">{result.restaurant_name}</span> · {formatPrice(result.total)}</p>
          <OrderTracker order={result} onClose={() => setResult(null)} />
        </div>
      )}
    </section>
  );
}

export default function Orders() {
  const { t, formatPrice, formatDateTime } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [selectedId, setSelectedId] = useState(null);

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: () => base44.entities.Order.filter({ user_id: user.id }, '-created_at', 100),
    enabled: isAuthenticated,
    refetchInterval: (q) => ((q.state.data || []).some(ACTIVE) ? 30000 : false),
  });
  // Show the chosen order; by default the newest active one; 'none' = tracker closed
  const selected = selectedId === 'none' ? null : (orders.find(o => o.id === selectedId) || orders.find(ACTIVE) || null);

  return (
    <div className="ember-container pt-6 lg:pt-0">
      <h1 className="text-[30px] font-semibold lg:text-[48px]">{t('nav_track_order')}</h1>

      {!isAuthenticated ? (
        <div className="mt-8 space-y-6">
          <GuestTrack />
          <p className="text-center text-[15px]">
            {t('track_login_hint')} <Link to="/login?redirect=/orders" className="font-semibold text-ember-orange underline">{t('log_in')}</Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_480px]">
          <section aria-labelledby="history-title">
            <div className="flex items-center justify-between">
              <h2 id="history-title" className="text-[22px] font-bold lg:text-[28px]">{t('order_history')}</h2>
              <button type="button" onClick={() => refetch()} className="flex items-center gap-2 text-[14px] font-semibold text-ember-orange"><RotateCcw className="h-4 w-4" aria-hidden="true" />{t('refresh')}</button>
            </div>
            {isLoading && <p className="mt-6 text-black/60">{t('loading')}</p>}
            {isError && <p className="mt-6 font-semibold text-ember-red">{t('load_failed')}</p>}
            {!isLoading && orders.length === 0 && (
              <EmptyState anim="empty_basket" title={t('no_orders')} action={t('browse_restaurants')} to="/restaurants" />
            )}
            <ul className="mt-6 space-y-4">
              {orders.map(o => (
                <li key={o.id}>
                  <button type="button" onClick={() => setSelectedId(o.id)} aria-pressed={selected?.id === o.id}
                    className={`w-full rounded-card border bg-ember-card p-5 text-left transition-shadow hover:shadow-card-sm ${selected?.id === o.id ? 'border-ember-orange' : 'border-black/20'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-[16px] font-semibold"><Store className="h-4 w-4 text-ember-orange" aria-hidden="true" />{o.restaurant_name}</p>
                        <p className="text-[13px] text-black/60">{o.order_number} · {formatDateTime(o.created_at)}</p>
                      </div>
                      <span className={`rounded-pill px-3 py-1 text-[13px] font-semibold ${STATUS_STYLE[o.status] || ''}`}>{t(`status_${o.status}`)}</span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-[14px] text-black/70">{o.items?.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}</p>
                    <p className="mt-2 text-[18px] font-semibold text-ember-green">{formatPrice(o.total)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <aside className="space-y-6">
            {selected && <div className="lg:sticky lg:top-6"><OrderTracker order={selected} onClose={() => setSelectedId('none')} /></div>}
            <GuestTrack />
          </aside>
        </div>
      )}
    </div>
  );
}
