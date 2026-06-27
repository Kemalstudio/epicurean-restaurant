import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export default function ReviewFormModal({ onClose }) {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await base44.entities.Review.create({
                author_name: user.name,
                rating,
                comment,
                avatar_letter: user.name[0].toUpperCase(),
                created_at: new Date().toISOString()
            });
            toast({ title: "Thank you!", description: "Your review has been posted." });
            queryClient.invalidateQueries(['reviews']);
            onClose();
        } catch (err) {
            toast({ title: "Error", description: "Failed to post review.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

                <h2 className="font-display text-3xl font-bold mb-2">Write a Review</h2>
                <p className="text-muted-foreground text-sm mb-6">Share your dining experience with others.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold mb-3 block">Your Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" onClick={() => setRating(s)} className="focus:outline-none">
                                    <Star className={`w-8 h-8 ${s <= rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-3 block">Your Experience</label>
                        <Textarea
                            required
                            placeholder="How was the food and service?"
                            className="rounded-2xl min-h-[120px] bg-muted/50 border-none focus:ring-2 focus:ring-primary/20"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>



                    <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-lg font-bold">
                        {loading ? 'Posting...' : 'Post Review'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}