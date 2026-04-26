import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import de from './de.json'
import fr from './fr.json'
import es from './es.json'

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

function getSavedLanguage(): string {
  const saved = localStorage.getItem('language')
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
