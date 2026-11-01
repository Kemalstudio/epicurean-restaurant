import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-accent" aria-hidden="true" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">{t('order_confirmed')}</h1>
        {orderNumber && (
          <p className="text-muted-foreground mb-6">
            {t('order_confirmed_desc', { number: orderNumber })}
          </p>
        )}

        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-accent mb-2">
            <Clock className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">{t('estimated_delivery')}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{t('delivery_time_value')}</p>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-4 flex items-start gap-2 text-left">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {t('guest_order_note')}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated && (
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 rounded-xl px-6 w-full">
                {t('track_order')} <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
          )}
          <Link to="/menu">
            <Button variant="outline" className="rounded-xl px-6 w-full">{t('continue_shopping')}</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
