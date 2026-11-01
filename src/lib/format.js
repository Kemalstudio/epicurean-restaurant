// Single place for money and date formatting, so every page shows prices the same way.

export const CURRENCY = 'TMT';

const LOCALES = { en: 'en-GB', ru: 'ru-RU', tk: 'tk-TM' };

/** 1234.5 -> "1 234.50 TMT" */
export function formatPrice(amount) {
  const value = Number(amount) || 0;
  const [int, frac] = value.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${frac} ${CURRENCY}`;
}

/** Date in the user's language; falls back to English if the browser lacks that locale. */
export function formatDate(date, lang = 'en', options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(LOCALES[lang] || LOCALES.en, options);
  } catch {
    return d.toLocaleDateString(LOCALES.en, options);
  }
}

export function formatDateTime(date, lang = 'en') {
  return formatDate(date, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
