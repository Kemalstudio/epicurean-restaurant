import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

// Иконки
import Star from 'lucide-react/dist/esm/icons/star';
import Quote from 'lucide-react/dist/esm/icons/quote';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Plus from 'lucide-react/dist/esm/icons/plus';

import { Button } from '@/components/ui/button';
import ReviewFormModal from './ReviewFormModal';

export default function ReviewsSection() {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [index, setIndex] = useState(0);

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews'],
        queryFn: () => base44.entities.Review.list('-created_at'),
    });

    const displayReviews = reviews.slice(index, index + 3);

    const next = () => {
        if (index + 3 < reviews.length) setIndex(index + 1);
        else setIndex(0);
    };

    const prev = () => {
        if (index > 0) setIndex(index - 1);
        else setIndex(Math.max(0, reviews.length - 3));
    };

    return (
        <section className="py-24 bg-muted/30 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <span className="text-primary text-sm font-bold tracking-widest uppercase">{t('guest_voices')}</span>
                        <h2 className="font-display text-4xl sm:text-5xl font-bold mt-2 text-foreground">{t('testimonials')}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Button onClick={() => setShowModal(true)} className="rounded-xl bg-primary gap-2 h-12 px-6 shadow-lg shadow-primary/20">
                                <Plus className="w-5 h-5" /> {t('write_review')}
                            </Button>
                        ) : (
                            <Link to="/login">
                                <Button variant="outline" className="rounded-xl h-12 border-primary/20 text-primary hover:bg-primary/5">
                                    {t('login_to_review')}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="relative">
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="wait">
                                {displayReviews.map((rev) => (
                                    <motion.div
                                        key={rev.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm relative group"
                                    >
                                        <Quote className="w-10 h-10 text-primary/10 absolute top-6 right-8" />
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />
                                            ))}
                                        </div>
                                        <p className="text-foreground/80 leading-relaxed mb-8 italic">"{rev.comment}"</p>
                                        <div className="flex items-center gap-3 mt-auto pt-6 border-t border-border/50">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                                                {rev.author_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{rev.author_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Verified Guest</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 mt-12">
                        <button onClick={prev} className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={next} className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link to="/testimonials">
                        <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 gap-2 text-lg">
                            {t('all_testimonials')} <ChevronRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {showModal && <ReviewFormModal onClose={() => setShowModal(false)} />}
        </section>
    );
}