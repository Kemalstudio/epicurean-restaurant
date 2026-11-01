import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, TrendingUp, Users, Smartphone, Wallet, Clock, ShieldCheck } from 'lucide-react';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Photo } from '@/components/ember/Cards';

const PARTNER_IMAGE = '/img/1600565193348-f74bd3c7ccdf-1600.webp';
const RIDER_IMAGE = '/img/1617347454431-f49d7ff5c3b1-1600.webp';

function Banner({ image, tab, kicker, title, text }) {
  return (
    <div className="relative h-[340px] overflow-hidden rounded-card lg:h-[425px]">
      <Photo src={image} className="absolute inset-0 h-full w-full" />
      <span className="deal-overlay absolute inset-0" aria-hidden="true" />
      <span className="absolute left-[6%] top-0 rounded-b-card bg-white px-6 py-3 text-[14px] font-bold text-ember-navy lg:px-7 lg:py-4 lg:text-[18px]">{tab}</span>
      <div className="absolute bottom-[12%] left-[6%] right-[6%] max-w-[720px]">
        <p className="text-[16px] font-medium text-ember-orange lg:text-[18px]">{kicker}</p>
        <h1 className="text-[32px] font-bold leading-tight text-white lg:text-[44px]">{title}</h1>
        <p className="mt-2 text-[15px] text-white/90 lg:text-[18px]">{text}</p>
      </div>
    </div>
  );
}

function Benefits({ items }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {items.map(b => (
        <li key={b.title} className="rounded-card bg-ember-navy p-6 text-white">
          <b.icon className="h-9 w-9 text-ember-orange" aria-hidden="true" />
          <h2 className="mt-4 text-[18px] font-bold">{b.title}</h2>
          <p className="mt-1 text-[14px] text-white/80">{b.text}</p>
        </li>
      ))}
    </ul>
  );
}

const input = 'input-pill border-[#CFCFCF] bg-[#F6F6F6] focus:bg-white';

function Done({ title, text }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card border border-black bg-[#F9F9F9] p-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-ember-green" aria-hidden="true" />
      <h2 className="mt-4 text-[24px] font-bold">{title}</h2>
      <p className="mt-2 text-[15px] text-black/70">{text}</p>
      <Link to="/" className="btn-orange mt-6 h-[50px] text-[16px]">{t('back_to_home')}</Link>
    </div>
  );
}

export function PartnerPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ restaurant_name: '', contact_name: user?.name || '', phone: '', email: user?.email || '', address: '', cuisine: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: myApps = [] } = useQuery({
    queryKey: ['my-partner-apps', user?.id],
    queryFn: () => base44.entities.PartnerApplication.list('-created_at'),
    enabled: isAuthenticated,
  });
  const pending = myApps.find(a => a.status === 'pending');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await base44.market.applyPartner(form); setSent(true); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="ember-container space-y-10 pt-6 lg:pt-0">
      <Banner image={PARTNER_IMAGE} tab={t('partner_tab_label')} kicker={t('partner_kicker')} title={t('partner_title')} text={t('partner_page_text')} />
      <Benefits items={[
        { icon: TrendingUp, title: t('partner_b1_title'), text: t('partner_b1_text') },
        { icon: Users, title: t('partner_b2_title'), text: t('partner_b2_text') },
        { icon: Smartphone, title: t('partner_b3_title'), text: t('partner_b3_text') },
      ]} />

      <section className="mx-auto max-w-[760px]" aria-labelledby="partner-form-title">
        {user?.role === 'owner' || user?.role === 'admin' ? (
          <Done title={t('already_partner')} text={t('already_partner_text')} />
        ) : sent || pending ? (
          <Done title={t('application_sent')} text={t('application_sent_text')} />
        ) : !isAuthenticated ? (
          <div className="rounded-card border border-black bg-[#F9F9F9] p-10 text-center">
            <h2 id="partner-form-title" className="text-[24px] font-bold">{t('partner_login_title')}</h2>
            <p className="mt-2 text-[15px] text-black/70">{t('partner_login_text')}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register?redirect=/partner" className="btn-orange h-[50px] text-[16px]">{t('create_account')}</Link>
              <Link to="/login?redirect=/partner" className="btn-navy h-[50px] text-[16px]">{t('log_in')}</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-card border border-black bg-ember-card p-6 lg:p-10">
            <h2 id="partner-form-title" className="text-[24px] font-bold lg:text-[28px]">{t('partner_form_title')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('restaurant_name')} *</span><input required minLength={2} value={form.restaurant_name} onChange={set('restaurant_name')} className={input} /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('cuisine_type')}</span><input value={form.cuisine} onChange={set('cuisine')} className={input} /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('contact_person')} *</span><input required minLength={2} autoComplete="name" value={form.contact_name} onChange={set('contact_name')} className={input} /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('phone')} *</span><input required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className={input} placeholder="+993 6X XXXXXX" /></label>
            </div>
            <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('email')} *</span><input required type="email" autoComplete="email" value={form.email} onChange={set('email')} className={input} /></label>
            <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('restaurant_address')} *</span><input required minLength={5} value={form.address} onChange={set('address')} className={input} /></label>
            <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('message_optional')}</span>
              <textarea rows={3} maxLength={1000} value={form.message} onChange={set('message')} className="w-full rounded-[28px] border border-[#CFCFCF] bg-[#F6F6F6] px-6 py-4 text-[15px] outline-none focus:border-ember-orange focus:bg-white" />
            </label>
            {error && <p className="font-semibold text-ember-red" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn-orange h-[56px] w-full text-[18px]">{busy ? t('sending') : t('send_application')}</button>
          </form>
        )}
      </section>
    </div>
  );
}

export function RiderPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: '', email: user?.email || '', vehicle: 'scooter', area: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await base44.market.applyRider(form); setSent(true); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="ember-container space-y-10 pt-6 lg:pt-0">
      <Banner image={RIDER_IMAGE} tab={t('rider_tab_label')} kicker={t('rider_kicker')} title={t('rider_title')} text={t('rider_page_text')} />
      <Benefits items={[
        { icon: Wallet, title: t('rider_b1_title'), text: t('rider_b1_text') },
        { icon: Clock, title: t('rider_b2_title'), text: t('rider_b2_text') },
        { icon: ShieldCheck, title: t('rider_b3_title'), text: t('rider_b3_text') },
      ]} />
      <section className="mx-auto max-w-[760px]" aria-labelledby="rider-form-title">
        {sent ? <Done title={t('application_sent')} text={t('rider_sent_text')} /> : (
          <form onSubmit={submit} className="space-y-4 rounded-card border border-black bg-ember-card p-6 lg:p-10">
            <h2 id="rider-form-title" className="text-[24px] font-bold lg:text-[28px]">{t('rider_form_title')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('full_name')} *</span><input required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} className={input} /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('phone')} *</span><input required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className={input} placeholder="+993 6X XXXXXX" /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('email_optional')}</span><input type="email" autoComplete="email" value={form.email} onChange={set('email')} className={input} /></label>
              <label className="block"><span className="mb-1.5 block pl-6 text-[14px] font-semibold">{t('work_area')}</span><input value={form.area} onChange={set('area')} className={input} /></label>
            </div>
            <fieldset>
              <legend className="mb-2 pl-6 text-[14px] font-semibold">{t('vehicle')}</legend>
              <div className="flex flex-wrap gap-3">
                {['bike', 'scooter', 'car'].map(v => (
                  <label key={v} className={`cursor-pointer rounded-pill border px-6 py-3 text-[15px] ${form.vehicle === v ? 'border-ember-orange bg-ember-orange text-white' : 'border-ember-gray'}`}>
                    <input type="radio" name="vehicle" value={v} checked={form.vehicle === v} onChange={set('vehicle')} className="sr-only" />{t(`vehicle_${v}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <p className="font-semibold text-ember-red" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn-orange h-[56px] w-full text-[18px]">{busy ? t('sending') : t('send_application')}</button>
          </form>
        )}
      </section>
    </div>
  );
}

const LEGAL = ['terms', 'privacy', 'cookies', 'pricing'];
export function LegalPage({ doc }) {
  const { t } = useLanguage();
  const key = LEGAL.includes(doc) ? doc : 'terms';
  return (
    <div className="ember-container max-w-[860px] pt-6 lg:pt-0">
      <h1 className="text-[30px] font-semibold lg:text-[44px]">{t(key)}</h1>
      <p className="mt-2 text-[14px] text-black/60">{t('legal_draft_note')}</p>
      <div className="mt-8 space-y-4 text-[16px] leading-relaxed">
        {t(`legal_${key}_body`).split('\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}
