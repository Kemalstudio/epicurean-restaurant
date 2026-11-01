import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Phone, Store } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import LottieAnim from '@/components/ember/LottieAnim';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const order = state?.order;
  const orderNumber = searchParams.get('order');
  const { isAuthenticated } = useAuth();
  const { t, formatPrice } = useLanguage();

  return (
    <div className="ember-container flex min-h-[60vh] items-center justify-center py-12">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-[560px] overflow-hidden rounded-card border border-black bg-[#F9F9F9] text-center">
        <div className="bg-ember-green px-8 py-10 text-white">
          <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white"><LottieAnim name="success" size={112} loop={false} /></div>
          <h1 className="mt-4 text-[30px] font-semibold">{t('order_confirmed')}</h1>
          {orderNumber && <p className="mt-2 text-[16px]">{t('order_confirmed_desc', { number: orderNumber })}</p>}
        </div>
        <div className="space-y-5 p-8">
          {order && (
            <p className="flex items-center justify-center gap-2 text-[16px] font-semibold"><Store className="h-5 w-5 text-ember-orange" aria-hidden="true" />{order.restaurant_name} · {formatPrice(order.total)}</p>
          )}
          <div className="flex items-center justify-center gap-4 rounded-[8px] bg-ember-orange/80 px-6 py-5 text-white">
            <Clock className="h-9 w-9" aria-hidden="true" />
            <div className="text-left">
              <p className="text-[15px] font-semibold">{order?.fulfillment === 'collection' ? t('ready_for_pickup') : t('estimated_delivery')}</p>
              <p className="text-[24px] font-semibold">{order?.estimated_delivery || t('delivery_time_value')}</p>
            </div>
          </div>
          {!isAuthenticated && (
            <p className="flex items-start gap-2 text-left text-[14px] text-black/70"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{t('guest_order_note')}</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/orders${orderNumber ? `?order=${encodeURIComponent(orderNumber)}` : ''}`} className="btn-green relative h-[56px] px-10 text-[18px]">
              {t('track_order')} <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link to="/restaurants" className="btn-pill h-[56px] border border-ember-navy text-[16px] text-ember-navy">{t('continue_shopping')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
