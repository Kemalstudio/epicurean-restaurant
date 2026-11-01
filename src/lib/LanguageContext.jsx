import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { translations } from './translations';
import { queryClientInstance } from './query-client';
import { formatPrice, formatDate, formatDateTime } from './format';

const LanguageContext = createContext();

const SUPPORTED = ['en', 'ru', 'tk'];

function initialLang() {
    const saved = localStorage.getItem('app_lang');
    if (SUPPORTED.includes(saved)) return saved;
    const browser = (navigator.language || 'en').slice(0, 2);
    const lang = SUPPORTED.includes(browser) ? browser : 'en';
    localStorage.setItem('app_lang', lang); // the API client reads it for ?lang=
    return lang;
}

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(initialLang);
    const firstRender = useRef(true);

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
        document.documentElement.lang = lang;
        // Menu names/descriptions come from the server already translated — reload them
        if (firstRender.current) firstRender.current = false;
        else queryClientInstance.invalidateQueries();
    }, [lang]);

    /** t('key') or t('key', { count: 3 }) — replaces {count}; falls back to English, then to the key. */
    const t = useCallback((key, vars) => {
        let text = translations[lang]?.[key] ?? translations.en[key] ?? key;
        if (vars) {
            for (const [name, value] of Object.entries(vars)) {
                text = text.replaceAll(`{${name}}`, String(value));
            }
        }
        return text;
    }, [lang]);

    const value = {
        lang,
        setLang,
        t,
        formatPrice,
        formatDate: (date, options) => formatDate(date, lang, options),
        formatDateTime: (date) => formatDateTime(date, lang),
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
