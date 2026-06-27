import React from 'react';
import { motion } from 'framer-motion';
import Leaf from 'lucide-react/dist/esm/icons/leaf';
import Award from 'lucide-react/dist/esm/icons/award';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Heart from 'lucide-react/dist/esm/icons/heart';
import { useLanguage } from '@/lib/LanguageContext';

export default function AboutSection() {
  const { t } = useLanguage();

  const values = [
    { icon: Leaf, title: t('farm_fresh_title'), desc: t('farm_fresh_desc') },
    { icon: Award, title: t('award_title'), desc: t('award_desc') },
    { icon: Clock, title: t('fast_delivery_title'), desc: t('fast_delivery_desc') },
    { icon: Heart, title: t('made_love_title'), desc: t('made_love_desc') },
  ];

  return (
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
              <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('our_story')}</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-6">
                {t('about_title_1')}<br />{t('about_title_2')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('about_desc_1')}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t('about_desc_2')}
              </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-2 gap-4"
            >
              {values.map((v, idx) => (
                  <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-500"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <v.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-1">{v.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{v.desc}</p>
                  </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
  );
}