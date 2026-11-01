import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Music2 } from 'lucide-react';
import Logo from './Logo';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from '@/components/ui/use-toast';

function Subscribe() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.market.subscribe(email);
      toast({ title: t('subscribed'), description: t('subscribed_desc') });
      setEmail('');
    } catch (err) {
      toast({ title: t('subscribe_failed'), description: apiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[485px]">
      <h2 className="mb-4 text-[18px] font-bold text-ember-navy">{t('footer_deals_title')}</h2>
      <div className="relative flex h-[59px] rounded-pill bg-ember-gray shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]">
        <label htmlFor="footer-email" className="sr-only">{t('email')}</label>
        <input
          id="footer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="youremail@gmail.com" autoComplete="email"
          className="min-w-0 flex-1 rounded-pill bg-transparent pl-7 text-[15px] outline-none placeholder:text-black/60"
        />
        <button type="submit" disabled={sending} className="btn-orange h-[59px] w-[130px] shrink-0 px-0 sm:w-[171px]">
          {t('subscribe')}
        </button>
      </div>
      <p className="mt-2 pl-7 text-[13px] text-ember-navy">{t('no_spam')}</p>
    </form>
  );
}

// lucide-react v1 has no brand icons — minimal SVGs (links point to the brand's own pages)
const Facebook = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z" /></svg>
);
const Instagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
);

const SOCIAL = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'TikTok', icon: Music2, href: 'https://tiktok.com' },
  { label: 'Telegram', icon: Send, href: 'https://t.me' },
];

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const legal = [
    { key: 'terms', to: '/legal/terms' },
    { key: 'privacy', to: '/legal/privacy' },
    { key: 'cookies', to: '/legal/cookies' },
  ];
  const important = [
    { key: 'get_help', to: '/#faq' },
    { key: 'add_restaurant', to: '/partner' },
    { key: 'sign_up_deliver', to: '/rider' },
    { key: 'create_business_account', to: '/partner' },
  ];

  return (
    <footer className="mt-16 md:mt-[45px]">
      <div className="bg-[#D9D9D9]/60">
        <div className="ember-container grid grid-cols-[minmax(0,1fr)] gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.8fr_0.9fr] lg:gap-8 lg:py-[81px]">
          <div>
            <Logo className="h-[58px] w-auto" />
            <div className="mt-6 flex flex-wrap gap-1.5" title={t('app_coming_soon')}>
              {[['App Store', t('download_on')], ['Google Play', t('get_it_on')]].map(([big, small]) => (
                <span key={big} aria-disabled="true" className="inline-flex h-[53px] items-center rounded-[8px] border border-ember-gray-dark bg-black px-3 text-white">
                  <span className="leading-none"><span className="block text-[9px] uppercase">{small}</span><span className="block text-[17px] font-semibold">{big}</span></span>
                </span>
              ))}
            </div>
            <p className="mt-6 max-w-[311px] text-[15px] text-black">{t('company_line')}</p>
          </div>

          <div>
            <Subscribe />
            <ul className="mt-5 flex gap-3.5 pl-6" aria-label={t('social')}>
              {SOCIAL.map(s => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-ember-navy text-white transition-colors hover:bg-ember-orange">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('legal_pages')}>
            <h2 className="mb-4 text-[18px] font-bold text-ember-navy">{t('legal_pages')}</h2>
            <ul className="space-y-2 text-[15px]">
              {legal.map(l => <li key={l.key}><Link to={l.to} className="inline-block py-1.5 underline underline-offset-2 hover:text-ember-orange">{t(l.key)}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label={t('important_links')}>
            <h2 className="mb-4 text-[18px] font-bold text-ember-navy">{t('important_links')}</h2>
            <ul className="space-y-2 text-[15px]">
              {important.map(l => <li key={l.key}><Link to={l.to} className="inline-block py-1.5 underline underline-offset-2 hover:text-ember-orange">{t(l.key)}</Link></li>)}
            </ul>
          </nav>
        </div>
      </div>

      <div className="bg-ember-navy text-white">
        <div className="ember-container flex flex-col gap-3 py-6 text-[15px] md:flex-row md:items-center md:justify-between">
          <p>{t('copyright_line', { year })}</p>
          <ul className="flex flex-wrap gap-x-10 gap-y-2">
            <li><Link to="/legal/privacy" className="hover:text-ember-orange">{t('privacy')}</Link></li>
            <li><Link to="/legal/terms" className="hover:text-ember-orange">{t('terms')}</Link></li>
            <li><Link to="/legal/pricing" className="hover:text-ember-orange">{t('pricing')}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
