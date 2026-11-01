import { useEffect, useState } from 'react';
import { X, MapPinned } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';
import { useLocationStore } from '@/lib/locationStore.jsx';

/** Kit popup shell: white card, orange round close button at the top-right corner. */
export function PopupShell({ open, onClose, children, label, className = 'max-w-[635px]' }) {
  const { t } = useLanguage();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className={`relative my-10 w-full rounded-card bg-white shadow-popup ${className}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute -right-3 -top-6 z-10 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-ember-orange text-white md:-right-7" aria-label={t('close')}>
          <X className="h-8 w-8" strokeWidth={3} />
        </button>
        {children}
      </div>
    </div>
  );
}

/** "Please enter your address" popup (kit: Delivery Popup Desktop). */
export function DeliveryPopup() {
  const { t } = useLanguage();
  const { address, setAddress, popupOpen, closePopup } = useLocationStore();
  const { setFulfillment } = useCart();
  const [value, setValue] = useState(address);
  const [error, setError] = useState(false);

  useEffect(() => { if (popupOpen) { setValue(address); setError(false); } }, [popupOpen, address]);

  const submit = (e) => {
    e.preventDefault();
    if (value.trim().length < 3) { setError(true); return; }
    setAddress(value.trim());
    setFulfillment('delivery');
    closePopup();
  };

  return (
    <PopupShell open={popupOpen} onClose={closePopup} label={t('enter_address_title')} className="max-w-[635px]">
      <div className="flex overflow-hidden rounded-card">
        <div className="relative hidden w-[227px] shrink-0 sm:block">
          <img src="/img/1526367790999-0150786686a2-500.webp" alt="" className="h-full w-full object-cover" />
          <span className="absolute right-0 top-0 h-full w-[6px] bg-ember-orange" aria-hidden="true" />
        </div>
        <form onSubmit={submit} className="relative min-w-0 flex-1 px-6 py-10 sm:px-8 sm:py-12">
          <h2 className="text-[24px] font-bold leading-[1.15] text-ember-navy sm:text-[26px]">
            {t('enter_address_title_1')}<br />
            <span className={`underline underline-offset-4 ${error ? 'text-ember-red' : ''}`}>{t('enter_address_title_2')}</span>
          </h2>
          <p className="mt-6 text-[14px] text-black">{t('enter_address_desc')}</p>
          <div className="mt-7 flex h-[50px]">
            <label htmlFor="popup-address" className="sr-only">{t('delivery_address')}</label>
            <input id="popup-address" value={value} onChange={(e) => { setValue(e.target.value); setError(false); }} autoFocus
              placeholder={t('address_placeholder')} autoComplete="street-address"
              className="min-w-0 flex-1 rounded-l-pill bg-[#EFEFEF] pl-5 text-[15px] outline-none placeholder:text-black/60 sm:pl-7" />
            <button type="submit" className={`shrink-0 whitespace-nowrap rounded-r-pill px-5 text-[17px] font-bold text-white sm:w-[120px] sm:px-0 sm:text-[20px] ${error ? 'bg-ember-navy' : 'bg-ember-orange'}`}>{t('find')}</button>
          </div>
          {error && <p className="mt-4 text-[14px] font-bold text-ember-red" role="alert">{t('address_too_short')}</p>}
          <div className="mt-6 flex items-center gap-3 text-[14px] font-semibold">
            <span className="h-px flex-1 bg-ember-orange" /><span>{t('or_word')}</span><span className="h-px flex-1 bg-ember-orange" />
          </div>
          <button type="button" onClick={() => { setFulfillment('collection'); closePopup(); }} className="mx-auto mt-1 block min-h-[44px] px-3 text-[13px] font-semibold underline underline-offset-2">
            {t('i_will_collect')}
          </button>
          <MapPinned className="absolute bottom-6 left-6 h-16 w-16 text-black/10" aria-hidden="true" />
        </form>
      </div>
    </PopupShell>
  );
}

/** Asked when adding food from a different restaurant than the one in the basket. */
export function BasketConflictPopup() {
  const { t } = useLanguage();
  const { conflict, resolveConflict, restaurant } = useCart();
  return (
    <PopupShell open={!!conflict} onClose={() => resolveConflict(false)} label={t('new_basket_title')} className="max-w-[480px]">
      <div className="px-8 py-10 text-center">
        <h2 className="text-[24px] font-bold text-ember-navy">{t('new_basket_title')}</h2>
        <p className="mt-3 text-[15px] text-black/70">
          {t('new_basket_desc', { current: restaurant?.name || '', next: conflict?.restaurant?.name || '' })}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => resolveConflict(false)} className="btn-pill h-[50px] border border-ember-navy text-[16px] text-ember-navy">{t('keep_basket')}</button>
          <button type="button" onClick={() => resolveConflict(true)} className="btn-orange h-[50px] text-[16px]">{t('start_new_basket')}</button>
        </div>
      </div>
    </PopupShell>
  );
}
