import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
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
                    <div className="mx-auto h-1 w-16 rounded-full bg-ember-orange/30" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-ember-navy">{t('not_found_title')}</h1>
                    <p className="leading-relaxed text-black/60">{t('not_found_desc')}</p>
                </div>

                <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
                    {/* Kit pill buttons; links styled directly (no <button> inside <a>) */}
                    <Link to="/" className="btn-orange h-[52px] px-7 text-[16px]">
                        <Home className="h-4 w-4" aria-hidden="true" /> {t('go_home')}
                    </Link>
                    <Link to="/restaurants" className="btn-pill h-[52px] border border-ember-navy px-7 text-[16px] text-ember-navy">
                        {t('browse_restaurants')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
