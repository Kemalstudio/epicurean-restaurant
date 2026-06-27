import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Clock, MapPin, Heart, Award, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import OrderTracker from '@/components/dashboard/OrderTracker';

const statusLabels = {
  received: 'Received',
  preparing: 'Preparing',
  packaging: 'Packaging',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusColors = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  packaging: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  out_for_delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Dashboard() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 50),
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const loyaltyPoints = Math.floor(totalSpent);

  return (
    <div className="pt-24 pb-12 min-h-screen px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-8">My Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: ShoppingBag, label: 'Total Orders', value: orders.length, color: 'text-primary' },
            { icon: Clock, label: 'Active Orders', value: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length, color: 'text-secondary' },
            { icon: Award, label: 'Loyalty Points', value: loyaltyPoints, color: 'text-accent' },
            { icon: Heart, label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, color: 'text-primary' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5"
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Loyalty Progress */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-bold">Loyalty Rewards</h3>
            <span className="text-sm text-muted-foreground">{loyaltyPoints}/100 points</span>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(loyaltyPoints, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {100 - loyaltyPoints > 0 ? `${100 - loyaltyPoints} more points to unlock $10 reward` : '🎉 Reward unlocked!'}
          </p>
        </div>

        {/* Order Tracker */}
        {selectedOrder && (
          <div className="mb-8">
            <OrderTracker order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          </div>
        )}

        {/* Orders */}
        <h2 className="font-heading text-xl font-bold mb-4">Order History</h2>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
              <Link to="/menu" className="text-primary text-sm font-semibold mt-2 inline-block">Browse Menu</Link>
            </div>
          ) : (
            orders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Badge className={`${statusColors[order.status]} border-0`}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {order.items?.slice(0, 3).map((item, idx) => (
                    item.product_image ? (
                      <img key={idx} src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div key={idx} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs">🍽️</div>
                    )
                  ))}
                  {(order.items?.length || 0) > 3 && (
                    <span className="text-xs text-muted-foreground">+{order.items.length - 3} more</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{order.items?.length || 0} items</span>
                  <span className="font-bold text-primary">${order.total?.toFixed(2)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}