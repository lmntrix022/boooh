import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

// Configuration de i18next
i18n
  // Détection de la langue du navigateur
  .use(LanguageDetector)
  // Plugin React
  .use(initReactI18next)
  // Initialisation
  .init({
    resources: {
      fr: {
        translation: fr,
      },
      en: {
        translation: en,
      },
    },
    fallbackLng: 'fr', // Langue par défaut
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    detection: {
      // Ordre de détection de la langue
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Clé pour stocker la langue dans localStorage
      lookupLocalStorage: 'i18nextLng',
      // Ne pas utiliser la détection si la langue est déjà définie
      caches: ['localStorage'],
    },
  });

export default i18n;



