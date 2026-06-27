import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Send from 'lucide-react/dist/esm/icons/send';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';

export default function ContactSection() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    toast({ title: t('message_sent'), description: t('message_desc') });
    setForm({ name: '', email: '', message: '' });
    setSending(false);
  };

  return (
      <section id="contact" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('get_in_touch')}</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2">{t('contact')}</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
            >
              {[
                { icon: MapPin, label: t('visit_us'), value: 'Ashgabat / Turkmenistan' },
                { icon: Phone, label: t('call_us'), value: '+993 (64) 00-53-74' },
                { icon: Mail, label: t('email_us'), value: 'hello@epicurean.com' },
                { icon: Clock, label: t('hours'), value: 'Mon-Sun: 10:00 AM - 11:00 PM' },
              ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{item.label}</p>
                      <p className="text-muted-foreground text-sm">{item.value}</p>
                    </div>
                  </div>
              ))}
            </motion.div>

            <motion.form
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="bg-card rounded-2xl p-6 sm:p-8 border border-border/50 space-y-4"
            >
              <Input
                  placeholder={t('your_name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="rounded-xl h-12"
              />
              <Input
                  type="email"
                  placeholder={t('your_email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="rounded-xl h-12"
              />
              <Textarea
                  placeholder={t('your_message')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  className="rounded-xl min-h-[120px]"
              />
              <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 font-semibold"
              >
                {sending ? t('sending') : t('send_message')}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
  );
}