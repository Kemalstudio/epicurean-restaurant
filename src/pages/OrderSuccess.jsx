import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function OrderSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('order');

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
          <CheckCircle className="w-12 h-12 text-accent" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Your order <span className="font-semibold text-foreground">{orderNumber}</span> has been placed successfully.
        </p>

        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-accent mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Estimated Delivery</span>
          </div>
          <p className="text-2xl font-bold text-foreground">30-45 minutes</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 rounded-xl px-6">
              Track Order <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/menu">
            <Button variant="outline" className="rounded-xl px-6">Continue Shopping</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}