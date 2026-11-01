import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

const footerLinks = [
  {
    titleKey: 'footer_menu',
    links: [
      { labelKey: 'full_menu', path: '/menu' },
      { labelKey: 'special_offers', path: '/#offers' },
    ],
  },
  {
    titleKey: 'footer_company',
    links: [
      { labelKey: 'about', path: '/#about' },
      { labelKey: 'all_testimonials', path: '/testimonials' },
    ],
  },
  {
    titleKey: 'footer_support',
    links: [
      { labelKey: 'faq', path: '/#faq' },
      { labelKey: 'contact', path: '/#contact' },
    ],
  },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground/[0.97] text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-bold">Epicurean</p>
            <p className="text-sm mt-4 opacity-70 max-w-xs">{t('footer_desc')}</p>
          </div>
          {footerLinks.map(group => (
            <nav key={group.titleKey} aria-label={t(group.titleKey)}>
              <h2 className="font-heading text-lg font-semibold mb-4">{t(group.titleKey)}</h2>
              <ul className="space-y-2">
                {group.links.map(link => (
                  <li key={link.labelKey}>
                    <Link to={link.path} className="text-sm opacity-60 hover:opacity-100 transition-opacity">{t(link.labelKey)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm opacity-50">
          © {new Date().getFullYear()} Epicurean. {t('copyright')}
        </div>
      </div>
    </footer>
  );
}
