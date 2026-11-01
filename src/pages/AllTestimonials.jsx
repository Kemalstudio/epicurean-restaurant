import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Star from 'lucide-react/dist/esm/icons/star';
import Quote from 'lucide-react/dist/esm/icons/quote';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

export default function AllTestimonials() {
    const { t, formatDate } = useLanguage();
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews'],
        queryFn: () => base44.entities.Review.list('-created_at'),
    });

    return (
        <div className="pt-32 pb-20 min-h-screen px-4">
            <div className="max-w-7xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:gap-3 transition-all">
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" /> {t('back_to_home')}
                </Link>

                <h1 className="font-display text-5xl font-bold mb-4">{t('all_testimonials')}</h1>
                <p className="text-muted-foreground mb-12">{t('all_reviews_subtitle')}</p>

                {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}
                {!isLoading && reviews.length === 0 && <p className="text-muted-foreground">{t('no_reviews')}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((rev) => (
                        <div key={rev.id} className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm relative">
                            <Quote className="w-10 h-10 text-primary/5 absolute top-6 right-8" />
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />
                                ))}
                            </div>
                            <p className="text-foreground leading-relaxed mb-6 italic">"{rev.comment}"</p>
                            <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{rev.avatar_letter || rev.author_name?.[0]}</div>
                                <div>
                                    <p className="font-bold text-sm">{rev.author_name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{formatDate(rev.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}