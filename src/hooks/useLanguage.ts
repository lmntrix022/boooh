import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

/**
 * Hook personnalisé pour gérer la langue de l'application
 * Utilise react-i18next pour les traductions
 */
export function useLanguage() {
  const { i18n, t } = useTranslation();

  // Mettre à jour l'attribut lang du HTML quand la langue change
  useEffect(() => {
    if (document.documentElement) {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // La langue est automatiquement sauvegardée dans localStorage par i18next
  };

  const currentLanguage = i18n.language;

  return {
    t, // Fonction de traduction
    currentLanguage,
    changeLanguage,
    i18n,
  };
}



