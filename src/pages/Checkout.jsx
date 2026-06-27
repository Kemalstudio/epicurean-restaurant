import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, User, CreditCard, Wallet, ArrowLeft, Check, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, discountAmount, deliveryFee, tax, total, promoCode, clearCart } = useCart();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', notes: '', payment: 'cash'
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);

    const orderNumber = 'EP-' + Date.now().toString(36).toUpperCase();
    await base44.entities.Order.create({
      order_number: orderNumber,
      status: 'received',
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_image: i.product_image,
        quantity: i.quantity,
        size: i.size,
        added_ingredients: i.addedIngredients,
        removed_ingredients: i.removedIngredients,
        unit_price: i.unitPrice,
        total_price: i.unitPrice * i.quantity,
      })),
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: deliveryFee,
      tax,
      total,
      promo_code: promoCode,
      delivery_address: form.address,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email,
      customer_notes: form.notes,
      payment_method: form.payment,
      estimated_delivery: '30-45 min',
    });

    clearCart();
    toast({ title: 'Order placed!', description: `Order ${orderNumber} has been confirmed.` });
    navigate('/order-success?order=' + orderNumber);
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some delicious items first</p>
          <Link to="/menu"><Button className="bg-primary rounded-xl">Browse Menu</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
                <h3 className="font-heading text-lg font-bold">Delivery Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="pl-10 rounded-xl h-11" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} required className="pl-10 rounded-xl h-11" />
                  </div>
                </div>
                <Input type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="rounded-xl h-11" />
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Textarea placeholder="Delivery Address" value={form.address} onChange={(e) => update('address', e.target.value)} required className="pl-10 rounded-xl min-h-[80px]" />
                </div>
                <Textarea placeholder="Special instructions (optional)" value={form.notes} onChange={(e) => update('notes', e.target.value)} className="rounded-xl min-h-[60px]" />
              </div>

              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h3 className="font-heading text-lg font-bold mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash on Delivery', icon: Wallet },
                    { value: 'card', label: 'Card Payment', icon: CreditCard },
                  ].map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => update('payment', pm.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        form.payment === pm.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <pm.icon className={`w-5 h-5 ${form.payment === pm.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 h-fit sticky top-24">
              <h3 className="font-heading text-lg font-bold mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}x {item.product_name}</span>
                    <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Discount</span><span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span><span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 rounded-xl h-12 font-semibold text-base shadow-lg shadow-primary/20"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
                <Check className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}