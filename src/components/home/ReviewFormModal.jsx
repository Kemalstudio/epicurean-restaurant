import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export default function ReviewFormModal({ onClose }) {
    const { t } = useLanguage();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Author name is taken from the account on the server
            await base44.entities.Review.create({ rating, comment });
            toast({ title: t('review_thanks'), description: t('review_posted') });
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            onClose();
        } catch (err) {
            toast({ title: t('review_failed'), description: apiErrorMessage(err), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                <button onClick={onClose} aria-label={t('close')} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

                <h2 className="font-display text-3xl font-bold mb-2">{t('write_review')}</h2>
                <p className="text-muted-foreground text-sm mb-6">{t('review_subtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold mb-3 block">{t('your_rating')}</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} / 5`} aria-pressed={s === rating} className="rounded focus-visible:ring-2 focus-visible:ring-primary">
                                    <Star className={`w-8 h-8 ${s <= rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-3 block">{t('your_review')}</label>
                        <Textarea
                            required
                            placeholder={t('review_placeholder')}
                            maxLength={1000}
                            className="rounded-2xl min-h-[120px] bg-muted/50 border-none focus:ring-2 focus:ring-primary/20"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>



                    <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-lg font-bold">
                        {loading ? t('posting') : t('post_review')}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}