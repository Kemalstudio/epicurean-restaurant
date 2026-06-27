import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqSection() {
    const { t } = useLanguage();

    const faqs = [
        { q: t('faq_q1'), a: t('faq_a1') },
        { q: t('faq_q2'), a: t('faq_a2') },
        { q: t('faq_q3'), a: t('faq_a3') },
        { q: t('faq_q4'), a: t('faq_a4') },
        { q: t('faq_q5'), a: t('faq_a5') },
        { q: t('faq_q6'), a: t('faq_a6') },
    ];

    return (
        <section id="faq" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
            >
                <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('help_center')}</span>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2">{t('faq_title')}</h2>
            </motion.div>

            <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <AccordionItem
                            value={`faq-${idx}`}
                            className="bg-card rounded-xl border border-border/50 px-6 data-[state=open]:border-primary/20 data-[state=open]:shadow-lg transition-all"
                        >
                            <AccordionTrigger className="text-left font-heading text-base font-semibold text-foreground hover:no-underline py-5">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    </motion.div>
                ))}
            </Accordion>
        </section>
    );
}