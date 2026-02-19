import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { translations } from './translations';

const i18n = new I18n(translations);

// Get device locale
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';

// Map device locale to our supported languages
const supportedLocales: Record<string, string> = {
  en: 'en',
  cs: 'cs',
  es: 'es',
  de: 'de',
};

i18n.locale = supportedLocales[deviceLocale] || 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
