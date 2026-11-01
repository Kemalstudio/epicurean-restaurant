import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import LottieAnim from '@/components/ember/LottieAnim';

export default function PageNotFound() {
    const { t } = useLanguage();

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <LottieAnim name="not_found" size={220} />
                    <p className="text-[56px] font-bold leading-none text-ember-orange/40" aria-hidden="true">404</p>
                    <div className="h-1 w-16 bg-primary/30 mx-auto rounded-full" />
                </div>

                <div className="space-y-3">
                    <h1 className="font-display text-3xl font-bold text-foreground">{t('not_found_title')}</h1>
                    <p className="text-muted-foreground leading-relaxed">{t('not_found_desc')}</p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/">
                        <Button className="rounded-xl px-6 w-full">
                            <Home className="w-4 h-4 mr-2" aria-hidden="true" /> {t('go_home')}
                        </Button>
                    </Link>
                    <Link to="/restaurants">
                        <Button variant="outline" className="rounded-xl px-6 w-full">{t('browse_restaurants')}</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
