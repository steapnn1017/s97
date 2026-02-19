import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/i18n';
import { Language } from '../i18n/translations';

interface LanguageState {
  language: Language;
  initialized: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  initialized: false,

  initializeLanguage: async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang && ['en', 'cs', 'es', 'de'].includes(savedLang)) {
        i18n.locale = savedLang;
        set({ language: savedLang as Language, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch (error) {
      console.error('Failed to load language:', error);
      set({ initialized: true });
    }
  },

  setLanguage: async (lang: Language) => {
    try {
      i18n.locale = lang;
      await AsyncStorage.setItem('app_language', lang);
      set({ language: lang });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  },
}));
