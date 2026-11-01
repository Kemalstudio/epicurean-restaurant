import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';

export default function PageNotFound() {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <p className="font-display text-8xl font-bold text-primary/20" aria-hidden="true">404</p>
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
                    <Link to="/menu">
                        <Button variant="outline" className="rounded-xl px-6 w-full">{t('browse_menu')}</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
