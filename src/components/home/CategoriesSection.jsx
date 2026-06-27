import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/LanguageContext';

export default function CategoriesSection() {
    const { t } = useLanguage();
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => base44.entities.Category.list('sort_order'),
    });

    return (
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">{t('explore')}</span>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mt-2">{t('categories')}</h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {isLoading
                    ? Array(8).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-2xl" />
                    ))
                    : categories.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                        >
                            <Link
                                to={`/menu?cat=${cat.slug || cat.name.toLowerCase()}`}
                                className="group relative block overflow-hidden rounded-2xl aspect-[4/3]"
                            >
                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-5xl">
                                        {cat.icon || '🍽️'}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-500" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="font-display text-xl font-bold text-white">{cat.name}</h3>
                                    <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{cat.description}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
}