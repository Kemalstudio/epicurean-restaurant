import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BasketPanel from './BasketPanel';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/LanguageContext';

/** Slide-in basket (kit "Mobile Cart"), opened from the top bar / mobile header. */
export default function BasketDrawer() {
  const { isOpen, setIsOpen } = useCart();
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => setIsOpen(false), [location.pathname, setIsOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={t('my_basket')}>
          <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} />
          <motion.div
            className="absolute bottom-0 right-0 top-0 w-full max-w-[400px] overflow-y-auto bg-white"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <button type="button" onClick={() => setIsOpen(false)} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ember-navy shadow-soft" aria-label={t('close')}>
              <X className="h-5 w-5" />
            </button>
            <BasketPanel compact onCheckout={() => setIsOpen(false)} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
