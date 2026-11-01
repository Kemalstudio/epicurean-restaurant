import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Bike, PackageCheck, ShoppingBag, Smartphone, Apple, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useLocationStore } from '@/lib/locationStore.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { DealCard, DealCardSmall, CuisineTile, RestaurantTile, Photo } from '@/components/ember/Cards';
import { EmptyState, errorAnim } from '@/components/ember/LottieAnim';

const HERO_IMAGE = '/img/1604382354936-07c5d9983bd3-1100.webp';
const APP_IMAGE = '/img/1512428559087-560fa5ceab42-1200.webp';
const PARTNER_IMAGE = '/img/1600565193348-f74bd3c7ccdf-1200.webp';
const RIDER_IMAGE = '/img/1617347454431-f49d7ff5c3b1-1200.webp';

/* ---------------- Hero ---------------- */

function NotificationCard({ n, title, text, className }) {
  return (
    <div className={`absolute w-[390px] ${className}`} aria-hidden="true">
      <span className="absolute -top-[66px] right-10 text-[68px] font-semibold leading-none text-transparent [-webkit-text-stroke:1px_white]">{n}</span>
      <div className="rounded-card bg-white/95 p-4 shadow-card-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <img src="/brand/ember-logo.svg" alt="" className="h-[15px] w-auto" />
          <span className="text-[12px] text-black/50">now</span>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-black">{title}</p>
        <p className="text-[12px] text-black/80">{text}</p>
      </div>
    </div>
  );
}

function AddressSearch({ compact = false }) {
  const { t } = useLanguage();
  const { address, setAddress } = useLocationStore();
  const [value, setValue] = useState(address);
  const navigate = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) setAddress(value.trim());
    navigate(value.trim() ? `/restaurants?area=${encodeURIComponent(value.trim())}` : '/restaurants');
  };
  return (
    <form onSubmit={submit} className={compact ? 'w-full' : 'w-[467px] max-w-full'} role="search">
      <label htmlFor={compact ? 'hero-address-m' : 'hero-address'} className={`block text-[13px] text-white ${compact ? 'mb-5 text-center text-[13px]' : 'mb-[15px] pl-[21px]'}`}>
        {t('hero_search_label')}
      </label>
      <div className="relative flex h-[57px]">
        <input
          id={compact ? 'hero-address-m' : 'hero-address'} value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={t('hero_search_placeholder')} autoComplete="street-address"
          className={`input-pill ${compact ? 'pr-16' : 'pr-[110px] md:w-[373px]'}`}
        />
        {compact ? (
          <button type="submit" className="absolute right-0 top-0 flex h-[57px] w-[57px] items-center justify-center rounded-full bg-ember-orange" aria-label={t('search')}>
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-ember-navy"><ChevronRight className="h-5 w-5 text-ember-navy" strokeWidth={3} /></span>
          </button>
        ) : (
          <button type="submit" className="btn-orange absolute right-0 top-0 h-[57px] w-[188px] text-[16px] font-bold">{t('search')}</button>
        )}
      </div>
    </form>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="hero-title">
      {/* Desktop */}
      <div className="relative hidden h-[610px] overflow-hidden rounded-card bg-ember-navy lg:block">
        <div className="absolute bottom-0 right-0 h-[565px] w-[41%] overflow-hidden rounded-tl-[300px] bg-ember-orange">
          <Photo src={HERO_IMAGE} className="h-full w-full opacity-90 mix-blend-multiply" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-center pl-[57px]">
          <p className="text-[16px] text-white">{t('hero_kicker')}</p>
          <h1 id="hero-title" className="mt-2 max-w-[560px] text-[46px] font-semibold leading-[1.22] text-white xl:text-[54px]">
            {t('hero_title_1')}<br /><span className="text-ember-orange">{t('hero_title_2')}</span>
          </h1>
          <div className="mt-10"><AddressSearch /></div>
        </div>
        <NotificationCard n="1" title={t('notif_1_title')} text={t('notif_1_text')} className="right-[108px] top-[112px] hidden xl:block" />
        <NotificationCard n="2" title={t('notif_2_title')} text={t('notif_2_text')} className="right-0 top-[281px] hidden xl:block" />
        <NotificationCard n="3" title={t('notif_3_title')} text={t('notif_3_text')} className="right-[58px] top-[443px] hidden xl:block" />
      </div>

      {/* Mobile (kit: Mobile Home hero card) */}
      <div className="rounded-card bg-ember-navy px-6 py-8 text-center lg:hidden">
        <p className="text-[12px] text-white">{t('hero_kicker')}</p>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] text-white sm:text-[34px]">
          {t('hero_title_1')}<br /><span className="text-ember-orange">{t('hero_title_2')}</span>
        </h1>
        <div className="mx-auto mt-5 max-w-[308px]"><AddressSearch compact /></div>
      </div>
    </section>
  );
}

/* ---------------- Deals ---------------- */

function Deals({ deals, cuisines, loading }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const tabs = useMemo(() => {
    const used = new Set(deals.flatMap(d => d.cuisines.map(c => c.slug)));
    return cuisines.filter(c => used.has(c.slug)).slice(0, 4);
  }, [deals, cuisines]);
  const shown = filter === 'all' ? deals : deals.filter(d => d.cuisines.some(c => c.slug === filter));
  const max = deals.reduce((m, d) => Math.max(m, d.discount_percent), 0);

  if (!loading && deals.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-[63px]" aria-labelledby="deals-title">
      <div className="flex items-center justify-between gap-4 lg:pl-[21px]">
        <h2 id="deals-title" className="text-[16px] font-bold lg:text-[32px]">
          {t('deals_title', { percent: max })} <span aria-hidden="true">🎊</span> <span className="hidden lg:inline">{t('deals_title_suffix')}</span>
        </h2>
        {/* Desktop tabs */}
        <div className="hidden items-center gap-2 lg:flex" role="tablist" aria-label={t('filter_by_cuisine')}>
          {[{ slug: 'all', name: t('filter_all') }, ...tabs].map(tab => (
            <button key={tab.slug} type="button" role="tab" aria-selected={filter === tab.slug} onClick={() => setFilter(tab.slug)}
              className={`h-[61px] rounded-pill px-7 text-[16px] ${filter === tab.slug ? 'border border-ember-orange text-ember-orange' : 'text-black'}`}>
              {tab.name}
            </button>
          ))}
        </div>
        {/* Mobile select */}
        <label className="relative flex h-[38px] shrink-0 items-center rounded-pill border border-ember-navy pl-8 pr-3 lg:hidden">
          <span className="sr-only">{t('filter_by_cuisine')}</span>
          <ChevronDown className="pointer-events-none absolute left-2 h-[18px] w-[18px] rounded-full bg-ember-navy p-0.5 text-white" aria-hidden="true" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[120px] appearance-none bg-transparent text-[10px] outline-none">
            <option value="all">{t('filter_all')}</option>
            {tabs.map(tab => <option key={tab.slug} value={tab.slug}>{tab.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 hidden grid-cols-3 gap-5 lg:mt-[54px] lg:grid">
        {loading ? [0, 1, 2].map(i => <Skeleton key={i} className="aspect-[496/325] rounded-card" />)
          : shown.slice(0, 3).map(d => <DealCard key={d.id} restaurant={d} />)}
      </div>
      <div className="scrollbar-hide -mx-4 mt-6 flex gap-3.5 overflow-x-auto px-4 lg:hidden">
        {loading ? [0, 1, 2].map(i => <Skeleton key={i} className="h-[150px] w-[150px] shrink-0 rounded-card" />)
          : shown.map(d => <DealCardSmall key={d.id} restaurant={d} />)}
      </div>
    </section>
  );
}

/* ---------------- Categories & restaurants ---------------- */

function PopularCategories({ cuisines, loading }) {
  const { t } = useLanguage();
  return (
    <section className="-mx-4 mt-10 bg-ember-section px-4 py-8 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-[63px] lg:bg-transparent lg:p-0" aria-labelledby="cats-title">
      <h2 id="cats-title" className="text-[16px] font-bold lg:pl-[21px] lg:text-[32px]">{t('popular_categories_title')} <span aria-hidden="true">🤩</span></h2>
      <div className="mt-6 grid grid-cols-2 gap-[11px] sm:grid-cols-3 lg:mt-[51px] lg:grid-cols-6 lg:gap-5">
        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[238/266] rounded-card" />)
          : cuisines.slice(0, 6).map(c => <CuisineTile key={c.id} cuisine={c} />)}
      </div>
    </section>
  );
}

function PopularRestaurants({ restaurants, loading }) {
  const { t } = useLanguage();
  return (
    <section className="mt-10 lg:mt-[56px]" aria-labelledby="pop-title">
      <div className="flex items-end justify-between">
        <h2 id="pop-title" className="text-[16px] font-bold lg:pl-[21px] lg:text-[32px]">{t('popular_restaurants')}</h2>
        <Link to="/restaurants" className="text-[14px] font-semibold text-ember-orange underline underline-offset-2">{t('see_all')}</Link>
      </div>
      <div className="scrollbar-hide -mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4 lg:mx-0 lg:mt-[51px] lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-0">
        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[238/266] w-[122px] shrink-0 rounded-card lg:w-auto" />)
          : restaurants.map(r => <div key={r.id} className="w-[122px] shrink-0 lg:w-auto"><RestaurantTile restaurant={r} /></div>)}
      </div>
    </section>
  );
}

/* ---------------- App promo ---------------- */

function StoreBadge({ icon: Icon, small, big }) {
  const { t } = useLanguage();
  return (
    <span className="inline-flex h-[53px] items-center gap-2 rounded-[8px] border border-ember-gray-dark bg-black px-3 text-white" aria-disabled="true" title={t('app_coming_soon')}>
      <Icon className="h-7 w-7" aria-hidden="true" />
      <span className="text-left leading-none"><span className="block text-[9px] uppercase">{small}</span><span className="block text-[17px] font-semibold">{big}</span></span>
    </span>
  );
}

function AppPromo() {
  const { t } = useLanguage();
  return (
    <section className="mt-10 lg:mt-[94px]" aria-labelledby="app-title">
      <div className="relative overflow-hidden rounded-card bg-gradient-to-r from-[#EEEEEE] to-[#E0E1DC] lg:h-[611px]">
        <div className="relative h-[230px] lg:absolute lg:-top-[50px] lg:left-0 lg:h-[651px] lg:w-[54%]">
          <Photo src={APP_IMAGE} className="h-full w-full object-cover lg:[mask-image:linear-gradient(to_right,black_70%,transparent)]" />
        </div>
        <div className="relative px-6 py-8 text-center lg:absolute lg:right-[85px] lg:top-1/2 lg:w-[640px] lg:-translate-y-1/2 lg:p-0">
          <h2 id="app-title" className="flex flex-wrap items-center justify-center gap-x-4 text-[30px] font-bold text-ember-navy lg:flex-nowrap lg:text-[64px] lg:leading-[1.1]">
            <img src="/brand/ember-logo.svg" alt="Ember" className="h-[30px] w-auto lg:h-[64px]" />
            <span className="whitespace-nowrap">{t('app_title_rest')}</span>
          </h2>
          <p className="mx-auto mt-3 inline-block rounded-pill bg-ember-navy px-6 py-2 text-[20px] font-medium text-white lg:mt-5 lg:whitespace-nowrap lg:px-10 lg:py-3 lg:text-[40px]">
            <span className="text-ember-orange underline underline-offset-4">{t('app_personalised')}</span> {t('app_instant')}
          </p>
          <p className="mt-5 text-[15px] lg:text-[22px]">{t('app_download')}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <StoreBadge icon={Apple} small={t('download_on')} big="App Store" />
            <StoreBadge icon={Play} small={t('get_it_on')} big="Google Play" />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-black/60"><Smartphone className="h-4 w-4" aria-hidden="true" />{t('app_coming_soon')}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Partner / rider ---------------- */

function JoinCard({ image, tab, kicker, title, to }) {
  const { t } = useLanguage();
  return (
    <div className="relative aspect-[754/425] min-h-[220px] overflow-hidden rounded-card">
      <Photo src={image} className="absolute inset-0 h-full w-full" />
      <span className="deal-overlay absolute inset-0" aria-hidden="true" />
      <span className="absolute left-[9%] top-0 rounded-b-card bg-white px-5 py-2.5 text-[13px] font-bold text-ember-navy md:px-7 md:py-4 md:text-[18px]">{tab}</span>
      <div className="absolute bottom-[10%] left-[9%]">
        <p className="text-[15px] font-medium text-ember-orange md:text-[18px]">{kicker}</p>
        <h3 className="text-[26px] font-bold leading-tight text-white md:text-[44px]">{title}</h3>
        <Link to={to} className="btn-orange mt-3 h-[34px] px-6 text-[13px] md:mt-6 md:h-[52px] md:w-[205px] md:text-[18px]">{t('get_started')}</Link>
      </div>
    </div>
  );
}

/* ---------------- Know more about us ---------------- */

const ABOUT_TABS = ['faq_tab', 'who_tab', 'partner_tab', 'help_tab'];
const QUESTIONS = {
  faq_tab: ['q_how', 'q_payment', 'q_track', 'q_discounts', 'q_area'],
  who_tab: ['q_who', 'q_quality', 'q_hours'],
  partner_tab: ['q_join', 'q_fees', 'q_menu'],
  help_tab: ['q_late', 'q_wrong', 'q_contact'],
};

function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    { title: t('step_place_title'), text: t('step_place_text'), icon: ShoppingBag, color: 'text-ember-orange' },
    { title: t('step_track_title'), text: t('step_track_text'), icon: Bike, color: 'text-ember-navy' },
    { title: t('step_get_title'), text: t('step_get_text'), icon: PackageCheck, color: 'text-ember-green' },
  ];
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map(s => (
          <div key={s.title} className="flex flex-col items-center rounded-card bg-ember-gray px-4 pb-6 pt-8 text-center">
            <h4 className="text-[18px] font-bold text-ember-navy">{s.title}</h4>
            <s.icon className={`my-6 h-[96px] w-[96px] ${s.color}`} strokeWidth={1.3} aria-hidden="true" />
            <p className="text-[15px] font-medium text-black">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[625px] text-center text-[16px] text-white">{t('how_summary')}</p>
    </div>
  );
}

function KnowMore() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('faq_tab');
  const [question, setQuestion] = useState('q_how');
  const selectTab = (key) => { setTab(key); setQuestion(QUESTIONS[key][0]); };

  return (
    <section id="faq" className="mt-10 rounded-card bg-[#D9D9D9]/30 px-4 py-10 lg:mt-[53px] lg:px-[129px] lg:py-[118px]" aria-labelledby="about-title">
      <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
        <h2 id="about-title" className="text-[28px] font-bold lg:text-[32px]">{t('know_more_title')}</h2>
        <div className="flex flex-wrap justify-center gap-1" role="tablist" aria-label={t('know_more_title')}>
          {ABOUT_TABS.map(key => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => selectTab(key)}
              className={`h-[50px] rounded-pill px-5 text-[14px] lg:h-[61px] lg:px-7 lg:text-[16px] ${tab === key ? 'border border-ember-orange font-semibold' : ''}`}>
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid overflow-hidden rounded-card bg-ember-navy lg:mt-[69px] lg:grid-cols-[474px_1fr]">
        <ul className="flex flex-col gap-2 p-6 lg:border-r lg:border-white/10 lg:px-[72px] lg:py-[78px]" role="tablist" aria-orientation="vertical">
          {QUESTIONS[tab].map(q => (
            <li key={q}>
              <button type="button" role="tab" aria-selected={question === q} onClick={() => setQuestion(q)}
                className={`w-full rounded-pill px-6 py-4 text-center text-[16px] font-bold lg:text-[18px] ${question === q ? 'bg-ember-orange text-black' : 'text-white hover:text-ember-orange'}`}>
                {t(q)}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-6 lg:px-8 lg:py-[88px]" role="tabpanel">
          {question === 'q_how' ? <HowItWorks /> : (
            <div className="mx-auto max-w-[640px] rounded-card bg-white/5 p-8 text-[16px] leading-relaxed text-white">
              <h3 className="mb-3 text-[20px] font-bold text-ember-orange">{t(question)}</h3>
              <p>{t(`${question}_a`)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stats ---------------- */

function Stats({ stats }) {
  const { t } = useLanguage();
  const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);
  const items = [
    { value: stats?.riders, label: t('stat_riders') },
    { value: stats?.orders_delivered, label: t('stat_orders') },
    { value: stats?.restaurants, label: t('stat_restaurants') },
    { value: stats?.food_items, label: t('stat_food') },
  ];
  // Only real, non-zero numbers are shown
  const shown = items.filter(s => Number(s.value) > 0);
  if (!shown.length) return null;
  const cols = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }[shown.length];
  return (
    <section className={`mt-10 grid grid-cols-2 gap-y-6 rounded-card bg-ember-orange px-4 py-8 lg:mt-[44px] lg:h-[158px] lg:py-0 ${cols}`} aria-label={t('stats_label')}>
      {shown.map((s, i) => (
        <div key={s.label} className={`flex flex-col items-center justify-center text-center text-white ${i > 0 ? 'lg:border-l lg:border-ember-gray' : ''} lg:my-[29px]`}>
          <span className="text-[40px] font-light leading-none lg:text-[64px]">{fmt(s.value)}+</span>
          <span className="mt-1 text-[16px] font-bold lg:text-[24px]">{s.label}</span>
        </div>
      ))}
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function Home() {
  const { t } = useLanguage();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['home'], queryFn: base44.market.home });

  return (
    <div className="ember-container pt-4 lg:pt-0">
      <Hero />
      {isError ? (
        <EmptyState anim={errorAnim(error)} title={t('load_failed')} action={t('try_again')} onAction={() => refetch()} />
      ) : (
        <>
          <Deals deals={data?.deals || []} cuisines={data?.cuisines || []} loading={isLoading} />
          <PopularCategories cuisines={data?.cuisines || []} loading={isLoading} />
          <PopularRestaurants restaurants={data?.popular || []} loading={isLoading} />
        </>
      )}
      <AppPromo />
      <div className="mt-10 grid gap-5 lg:mt-[53px] lg:grid-cols-2">
        <JoinCard image={PARTNER_IMAGE} tab={t('partner_tab_label')} kicker={t('partner_kicker')} title={t('partner_title')} to="/partner" />
        <JoinCard image={RIDER_IMAGE} tab={t('rider_tab_label')} kicker={t('rider_kicker')} title={t('rider_title')} to="/rider" />
      </div>
      <KnowMore />
      <Stats stats={data?.stats} />
    </div>
  );
}
