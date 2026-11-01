import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MapPin, ShoppingBasket, ChevronDown, UserRound, Menu as MenuIcon, X, LogOut, Package, Store, ShieldCheck, Heart, Globe } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from './Logo';
import { useCart } from '@/lib/cartStore.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useLocationStore } from '@/lib/locationStore.jsx';

export const NAV_ITEMS = [
  { to: '/', key: 'nav_home', end: true },
  { to: '/dishes', key: 'nav_browse_menu' },
  { to: '/offers', key: 'nav_special_offers' },
  { to: '/restaurants', key: 'nav_restaurants' },
  { to: '/orders', key: 'nav_track_order' },
];

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tk', label: 'Türkmençe' },
];

function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`inline-flex items-center gap-1.5 text-[14px] font-medium text-ember-navy ${className}`} aria-label={t('language')}>
        <Globe className="h-4 w-4" aria-hidden="true" />
        {lang.toUpperCase()}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px] rounded-card">
        {LANGS.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className={`cursor-pointer ${lang === l.code ? 'font-semibold text-ember-orange' : ''}`}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Account menu items shared by desktop dropdown and mobile menu. */
export function useAccountLinks() {
  const { user } = useAuth();
  const links = [
    { to: '/orders', key: 'my_orders', icon: Package },
    { to: '/wishlist', key: 'wishlist', icon: Heart },
  ];
  if (user?.role === 'owner' || user?.role === 'admin') links.push({ to: '/owner', key: 'owner_panel', icon: Store });
  if (user?.role === 'admin') links.push({ to: '/admin', key: 'admin_panel', icon: ShieldCheck });
  return links;
}

function AccountButton() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const links = useAccountLinks();

  if (!isAuthenticated) {
    return (
      <Link to="/login" className="btn-navy h-[50px] shrink-0 gap-2.5 px-4 text-[15px] font-semibold xl:h-[56px] xl:px-5 xl:text-[16px] 2xl:h-[61px] 2xl:gap-3 2xl:px-6 2xl:text-[18px]">
        <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full bg-ember-orange" aria-hidden="true">
          <UserRound className="h-4 w-4 text-white" />
        </span>
        {t('login_signup')}
      </Link>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="btn-navy h-[50px] max-w-[200px] shrink-0 gap-2.5 px-4 text-[15px] font-semibold xl:h-[56px] xl:max-w-[230px] xl:text-[16px] 2xl:h-[61px] 2xl:max-w-[260px] 2xl:gap-3 2xl:px-6 2xl:text-[18px]">
        <span className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-ember-orange text-[13px] font-bold" aria-hidden="true">
          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{user?.name || user?.email}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-card p-2">
        <DropdownMenuLabel className="truncate text-xs font-normal text-black/60">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map(l => (
          <DropdownMenuItem key={l.to} asChild className="cursor-pointer gap-2 py-2.5">
            <Link to={l.to}><l.icon className="h-4 w-4" aria-hidden="true" />{t(l.key)}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer gap-2 py-2.5 text-ember-red focus:text-ember-red">
          <LogOut className="h-4 w-4" aria-hidden="true" />{t('log_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop top bar: promo, delivery address, language, green basket block. */
function TopBar() {
  const { t, formatPrice } = useLanguage();
  const { itemCount, total, setIsOpen } = useCart();
  const { address, openPopup } = useLocationStore();

  return (
    <div className="ember-container hidden lg:block">
      <div className="flex h-[70px] items-stretch overflow-hidden rounded-b-card border border-t-0 border-black bg-ember-light">
        <p className="hidden min-w-0 flex-1 items-center gap-2.5 pl-9 text-[15px] font-medium xl:flex">
          <span aria-hidden="true" className="text-[22px]">🌟</span>
          {/* Only the description may be shortened — the promo code itself always stays visible */}
          <span className="min-w-0 truncate">{t('promo_banner')}</span>
          <Link to="/offers" className="shrink-0 whitespace-nowrap text-ember-orange underline underline-offset-2">{t('promo_banner_code', { code: 'WELCOME' })}</Link>
        </p>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-6 text-[15px] font-medium text-ember-navy xl:flex-none">
          <MapPin className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="max-w-[240px] truncate xl:max-w-[150px] 2xl:max-w-[240px]">{address || t('no_address')}</span>
          <button type="button" onClick={openPopup} className="whitespace-nowrap text-[14px] text-ember-orange underline underline-offset-2">
            {t('change_location')}
          </button>
        </div>
        <div className="flex items-center px-5">
          <LanguageSwitcher />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-[320px] shrink-0 items-stretch rounded-b-card bg-ember-green text-[15px] font-semibold text-white 2xl:w-[378px] 2xl:text-[16px]"
          aria-label={t('open_basket')}
        >
          <span className="flex w-[72px] items-center justify-center border-r border-white 2xl:w-[88px]"><ShoppingBasket className="h-9 w-9" aria-hidden="true" /></span>
          <span className="flex flex-1 items-center justify-center border-r border-white">{t('items_short', { count: itemCount })}</span>
          <span className="flex flex-1 items-center justify-center whitespace-nowrap border-r border-white px-2">{formatPrice(total)}</span>
          <span className="flex w-[62px] shrink-0 items-center justify-center">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white"><ChevronDown className="h-6 w-6 text-ember-green" aria-hidden="true" /></span>
          </span>
        </button>
      </div>
    </div>
  );
}

function MobileMenu({ open, onClose }) {
  const { t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const links = useAccountLinks();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-ember-navy lg:hidden" role="dialog" aria-modal="true" aria-label={t('menu')}>
      <div className="flex h-[91px] items-center justify-between border-b border-white/20 px-4">
        <Logo variant="white" className="h-[38px] w-auto" />
        <button type="button" onClick={onClose} className="flex h-[65px] w-[65px] items-center justify-center text-white" aria-label={t('close')}>
          <X className="h-9 w-9" />
        </button>
      </div>
      <nav className="flex flex-col gap-2 px-6 py-8" aria-label={t('menu')}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
            className={({ isActive }) => `rounded-pill px-6 py-3 text-[20px] font-semibold ${isActive ? 'bg-ember-orange text-white' : 'text-white'}`}>
            {t(item.key)}
          </NavLink>
        ))}
        <div className="my-4 h-px bg-white/20" />
        {isAuthenticated ? (
          <>
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-3 px-6 py-2.5 text-[17px] text-white/90">
                <l.icon className="h-5 w-5" aria-hidden="true" />{t(l.key)}
              </Link>
            ))}
            <button type="button" onClick={() => logout()} className="flex items-center gap-3 px-6 py-2.5 text-left text-[17px] text-[#FFB1B1]">
              <LogOut className="h-5 w-5" aria-hidden="true" />{t('log_out')}
            </button>
          </>
        ) : (
          <Link to="/login" onClick={onClose} className="btn-orange mx-2 h-[52px]">{t('login_signup')}</Link>
        )}
        <div className="mt-6 px-6"><LanguageSwitcher className="min-h-[44px] pr-2 text-[16px] text-white" /></div>
      </nav>
    </div>
  );
}

export default function SiteHeader() {
  const { t, formatPrice } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { total, setIsOpen } = useCart();
  const { address, openPopup } = useLocationStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header>
      <TopBar />

      {/* Desktop navigation */}
      <div className="ember-container hidden items-center justify-between gap-4 py-7 lg:flex 2xl:gap-6 2xl:py-[38px]">
        <Logo className="h-[38px] w-auto xl:h-[44px] 2xl:h-[53px]" />
        <nav className="flex min-w-0 items-center gap-0.5 xl:gap-1 2xl:gap-4" aria-label={t('menu')}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex h-[42px] items-center whitespace-nowrap rounded-pill px-3 text-[15px] font-semibold transition-colors xl:px-4 xl:text-[16px] 2xl:h-[45px] 2xl:px-7 2xl:text-[18px] ${isActive ? 'bg-ember-orange text-white' : 'text-black hover:text-ember-orange'}`}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <AccountButton />
      </div>

      {/* Mobile header (kit: Mobile Home) */}
      <div className="lg:hidden">
        <div className="flex h-[91px] items-stretch border-b border-black">
          <div className="flex flex-1 items-center pl-4"><Logo className="h-[38px] w-auto" /></div>
          <button type="button" onClick={() => setMenuOpen(true)} className="flex w-[107px] items-center justify-center border-l border-black" aria-label={t('open_menu')} aria-expanded={menuOpen}>
            <MenuIcon className="h-[52px] w-[52px] stroke-[1.6]" aria-hidden="true" />
          </button>
        </div>
        <div className="grid h-[77px] grid-cols-2">
          <Link to={isAuthenticated ? '/orders' : '/login'} className="flex min-w-0 items-center gap-2.5 bg-ember-orange px-4 text-[14px] font-semibold text-black sm:gap-3 sm:px-6">
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-white text-[16px] font-bold text-ember-orange" aria-hidden="true">
              {isAuthenticated ? (user?.name || user?.email || '?').charAt(0).toUpperCase() : <UserRound className="h-5 w-5" />}
            </span>
            <span className="truncate">{isAuthenticated ? (user?.name || user?.email) : t('log_in')}</span>
          </Link>
          <button type="button" onClick={() => setIsOpen(true)} className="flex min-w-0 items-center justify-center gap-2 bg-ember-green px-2 text-[16px] font-semibold text-white sm:gap-4" aria-label={t('open_basket')}>
            <ShoppingBasket className="h-[45px] w-[45px]" aria-hidden="true" />
            {formatPrice(total)}
          </button>
        </div>
        <button type="button" onClick={openPopup} className="ml-auto flex min-h-[44px] max-w-full items-center justify-end gap-2 px-4 pt-1 text-[14px]">
          <MapPin className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="truncate">{address || t('no_address')}</span>
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
