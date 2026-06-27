import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { key: 'received', label: 'Order Received', icon: CheckCircle, desc: 'Your order has been confirmed' },
  { key: 'preparing', label: 'Preparing', icon: Clock, desc: 'Our chef is crafting your meal' },
  { key: 'packaging', label: 'Packaging', icon: Package, desc: 'Your order is being packed' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, desc: 'Driver is on the way' },
  { key: 'delivered', label: 'Delivered', icon: Home, desc: 'Enjoy your meal!' },
];

export default function OrderTracker({ order, onClose }) {
  if (order.status === 'cancelled') {
    return (
      <div className="bg-card rounded-2xl border border-destructive/20 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading text-lg font-bold text-foreground">Order {order.order_number}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 text-destructive">
          <XCircle className="w-8 h-8" />
          <span className="font-semibold">This order was cancelled</span>
        </div>
      </div>
    );
  }

  const currentIdx = steps.findIndex(s => s.key === order.status);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">Tracking {order.order_number}</h3>
          <p className="text-xs text-muted-foreground">Estimated: {order.estimated_delivery || '30-45 min'}</p>
        </div>
        <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {steps.map((step, idx) => {
          const isComplete = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
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
                  <step.icon className="w-5 h-5" />
                </motion.div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 ${idx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
              <div className="pt-2 pb-4">
                <p className={`text-sm font-semibold ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

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
          Step {currentIdx + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}