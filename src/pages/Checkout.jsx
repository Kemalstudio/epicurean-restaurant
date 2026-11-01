import React, { useState } from 'react';
import { MapPin, Phone, User, CreditCard, Wallet, ArrowLeft, Check, ShoppingBag, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const PAYMENT_OPTIONS = [
  { value: 'cash', labelKey: 'pay_cash', icon: Wallet },
  { value: 'card', labelKey: 'pay_card', icon: CreditCard },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, formatPrice } = useLanguage();
  const { items, subtotal, discountAmount, deliveryFee, tax, total, promoCode, clearCart } = useCart();
  const [form, setForm] = useState({
    name: user?.name || '', phone: '', email: user?.email || '', address: '', notes: '', payment: 'cash'
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      // Prices are calculated by the server from the menu — only the selection is sent
      const order = await base44.orders.place({
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size,
          added_ingredient_ids: i.addedIngredientIds || [],
          removed_ingredient_ids: i.removedIngredientIds || [],
        })),
        promo_code: promoCode,
        delivery_address: form.address,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_notes: form.notes,
        payment_method: form.payment,
      });

      clearCart();
      toast({ title: t('order_placed'), description: t('order_placed_desc', { number: order.order_number }) });
      navigate('/order-success?order=' + encodeURIComponent(order.order_number));
    } catch (error) {
      toast({ title: t('order_failed'), description: apiErrorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold mb-2">{t('cart_empty')}</h2>
          <p className="text-muted-foreground mb-6">{t('cart_empty_desc')}</p>
          <Link to="/menu"><Button className="bg-primary rounded-xl">{t('browse_menu')}</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t('back_to_menu')}
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-8">{t('checkout_title')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
                <h3 className="font-heading text-lg font-bold">{t('delivery_details')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input aria-label={t('full_name')} placeholder={t('full_name')} autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} required minLength={2} maxLength={100} className="pl-10 rounded-xl h-11" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input type="tel" aria-label={t('phone')} placeholder="+993 6X XXXXXX" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required pattern="\+?[\d\s\(\)\-]{6,20}" className="pl-10 rounded-xl h-11" />
                  </div>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input type="email" aria-label={t('email_optional')} placeholder={t('email_optional')} autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-10 rounded-xl h-11" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Textarea aria-label={t('delivery_address')} placeholder={t('delivery_address')} autoComplete="street-address" value={form.address} onChange={(e) => update('address', e.target.value)} required minLength={5} maxLength={500} className="pl-10 rounded-xl min-h-[80px]" />
                </div>
                <Textarea aria-label={t('notes_optional')} placeholder={t('notes_optional')} value={form.notes} onChange={(e) => update('notes', e.target.value)} maxLength={1000} className="rounded-xl min-h-[60px]" />
              </div>

              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h3 className="font-heading text-lg font-bold mb-4">{t('payment_method')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t('payment_method')}>
                  {PAYMENT_OPTIONS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      role="radio"
                      aria-checked={form.payment === pm.value}
                      onClick={() => update('payment', pm.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        form.payment === pm.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <pm.icon className={`w-5 h-5 ${form.payment === pm.value ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                      <span className="text-sm font-medium">{t(pm.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 h-fit lg:sticky lg:top-24">
              <h3 className="font-heading text-lg font-bold mb-4">{t('order_summary')}</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.key} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}× {item.product_name}
                      {item.size && <span className="text-xs"> · {item.size}</span>}
                    </span>
                    <span className="font-medium whitespace-nowrap">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('subtotal')}</span><span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>{t('discount')} ({promoCode})</span><span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('delivery')}</span><span>{deliveryFee > 0 ? formatPrice(deliveryFee) : t('free')}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('tax')}</span><span>{formatPrice(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>{t('total')}</span><span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-primary hover:bg-primary/90 rounded-xl h-12 font-semibold text-base shadow-lg shadow-primary/20"
              >
                {submitting ? t('placing_order') : t('place_order')}
                <Check className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
