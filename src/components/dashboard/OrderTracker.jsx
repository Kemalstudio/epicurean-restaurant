import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import LottieAnim from '@/components/ember/LottieAnim';

const steps = [
  { key: 'received', icon: CheckCircle },
  { key: 'preparing', icon: Clock },
  { key: 'packaging', icon: Package },
  { key: 'out_for_delivery', icon: Truck },
  { key: 'delivered', icon: Home },
];

export default function OrderTracker({ order, onClose }) {
  const { t } = useLanguage();

  if (order.status === 'cancelled') {
    return (
      <div className="bg-card rounded-2xl border border-destructive/20 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading text-lg font-bold text-foreground">{t('tracking_order', { number: order.order_number })}</h3>
          <button onClick={onClose} aria-label={t('close')}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 text-destructive">
          <XCircle className="w-8 h-8" aria-hidden="true" />
          <span className="font-semibold">{t('order_was_cancelled')}</span>
        </div>
      </div>
    );
  }

  const currentIdx = Math.max(0, steps.findIndex(s => s.key === order.status));

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">{t('tracking_order', { number: order.order_number })}</h3>
          <p className="text-xs text-muted-foreground">{t('estimated_time', { time: t('delivery_time_value') })}</p>
        </div>
        <button onClick={onClose} className="p-1" aria-label={t('close')}><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>

      {/* Live animation while the order is cooked or on the way */}
      {['preparing', 'packaging', 'out_for_delivery'].includes(order.status) && (
        <LottieAnim name={order.status === 'out_for_delivery' ? 'delivery' : 'loader'} size={130} className="mb-4" />
      )}

      {/* Timeline */}
      <ol className="relative">
        {steps.map((step, idx) => {
          const isComplete = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <li key={step.key} className="flex gap-4 pb-6 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    isComplete
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted text-muted-foreground'
                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                >
                  <step.icon className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 ${idx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
              <div className="pt-2 pb-4">
                <p className={`text-sm font-semibold ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t(`status_${step.key}`)}
                </p>
                <p className="text-xs text-muted-foreground">{t(`step_${step.key}_desc`)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {t('step_of', { current: currentIdx + 1, total: steps.length })}
        </p>
      </div>
    </div>
  );
}
