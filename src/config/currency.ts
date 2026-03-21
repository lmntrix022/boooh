export interface CurrencyConfig {
  code: string;        // Code ISO de la monnaie (ex: XOF, EUR, USD)
  name: string;        // Nom d'affichage (ex: FCFA, €, $)
  locale: string;      // Locale pour le formatage (ex: fr-FR, en-US)
  position: 'before' | 'after';  // Position du symbole monétaire
}

// Configuration par défaut
export const defaultCurrency: CurrencyConfig = {
  code: 'XOF',
  name: 'FCFA',
  locale: 'fr-FR',
  position: 'after'
};

// Liste des monnaies disponibles
export const availableCurrencies: CurrencyConfig[] = [
  defaultCurrency,
  {
    code: 'EUR',
    name: '€',
    locale: 'fr-FR',
    position: 'after'
  },
  {
    code: 'USD',
    name: '$',
    locale: 'en-US',
    position: 'before'
  }
];

// Clé de stockage local
export const CURRENCY_STORAGE_KEY = 'app_currency_config';

// Fonction pour obtenir la configuration de la monnaie actuelle
export const getCurrentCurrency = (): CurrencyConfig => {
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultCurrency;
    }
  }
  return defaultCurrency;
};

// Fonction pour définir la monnaie actuelle
export const setCurrentCurrency = (config: CurrencyConfig): void => {
  localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(config));
}; 