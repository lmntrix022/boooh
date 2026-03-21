import { getCurrentCurrency } from "@/config/currency";
import { convertAmount } from "@/services/exchangeRate";

/**
 * Utilitaires pour le formatage des données
 */

/**
 * Convertit un montant de manière synchrone en utilisant les taux de change en cache
 * Les taux sont basés sur XOF (1 XOF = rate * devise cible)
 * @param amount - Le montant à convertir
 * @param fromCurrency - La devise source (défaut: XOF)
 * @returns Le montant converti dans la devise cible
 */
function convertAmountSync(amount: number, fromCurrency: string = 'XOF'): number {
  const targetCurrency = getCurrentCurrency();
  
  // Si la monnaie source est la même que la monnaie cible
  if (fromCurrency === targetCurrency.code) {
    return amount;
  }

  try {
    // Lire les taux de change depuis le cache (tous basés sur XOF)
    const EXCHANGE_RATES_KEY = 'exchange_rates_cache';
    const cached = localStorage.getItem(EXCHANGE_RATES_KEY);
    
    let rates: Record<string, number>;
    
    if (cached) {
      const { rates: cachedRates } = JSON.parse(cached);
      rates = cachedRates;
    } else {
      // Si pas de cache, utiliser les taux par défaut (basés sur XOF)
      // 1 EUR = 625 FCFA (donc 1 XOF = 1/625 = 0.0016 EUR)
      rates = {
        XOF: 1,
        EUR: 0.0016,  // 1 XOF = 0.0016 EUR (donc 1 EUR = 625 XOF)
        USD: 0.00165,  // 1 XOF = 0.00165 USD (donc 1 USD ≈ 606 XOF)
        XAF: 1,
        FCFA: 1
      };
    }
    
    // Convertir d'abord vers XOF si nécessaire
    let amountInXOF = amount;
    if (fromCurrency !== 'XOF') {
      // Taux de fromCurrency vers XOF (inverse du taux stocké)
      const fromRate = rates[fromCurrency];
      if (fromRate && fromRate !== 0) {
        amountInXOF = amount / fromRate;
      }
    }
    
    // Convertir de XOF vers la devise cible
    if (targetCurrency.code === 'XOF') {
      return amountInXOF;
    }
    
    const targetRate = rates[targetCurrency.code];
    if (targetRate) {
      return amountInXOF * targetRate;
    }
    
    return amount;
  } catch (error) {
    return amount; // En cas d'erreur, retourner le montant original
  }
}

/**
 * Formate un montant avec la devise sélectionnée par l'utilisateur (avec conversion)
 * Utilise un formatage compact : 1000 = 1K, 1000000 = 1M, etc.
 * @param amount - Le montant à formater (en XOF par défaut)
 * @param sourceCurrency - La devise source (défaut: XOF)
 * @returns Le montant formaté avec la devise sélectionnée après conversion
 */
export function formatAmount(amount: number, sourceCurrency: string = 'XOF'): string {
  const config = getCurrentCurrency();
  
  // Convertir le montant
  const convertedAmount = convertAmountSync(amount, sourceCurrency);
  
  // Formater selon la taille du nombre (formatage compact)
  let formatted: string;
  if (convertedAmount < 1000) {
    // Moins de 1000 : affichage normal
    formatted = new Intl.NumberFormat(config.locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
  } else if (convertedAmount < 1000000) {
    // De 1K à 999K
    formatted = `${(convertedAmount / 1000).toFixed(1)}K`.replace(/\.0$/, '');
  } else if (convertedAmount < 1000000000) {
    // De 1M à 999M
    formatted = `${(convertedAmount / 1000000).toFixed(2)}M`.replace(/\.00$/, '').replace(/\.0$/, '');
  } else {
    // 1B et plus
    formatted = `${(convertedAmount / 1000000000).toFixed(2)}B`.replace(/\.00$/, '').replace(/\.0$/, '');
  }

  return config.position === 'before'
    ? `${config.name} ${formatted}`
    : `${formatted} ${config.name}`;
}

/**
 * Formate un nombre en euros
 * @param num - Le nombre à formater
 * @param currency - Le code de la devise (défaut: EUR)
 * @returns Le nombre formaté avec le symbole de la devise
 */
export function formatCurrency(num: number, currency: string = 'EUR'): string {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(num);
}

/**
 * Formate un nombre de manière concise (par exemple 1200 -> 1.2k)
 * @param num - Le nombre à formater
 * @returns Le nombre formaté de manière concise
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export const formatCurrencyAsync = async (amount: number, sourceCurrency?: string) => {
  const config = getCurrentCurrency();

  // Convertir le montant si nécessaire
  const convertedAmount = await convertAmount(amount, sourceCurrency || 'XOF');

  // Formater selon la taille du nombre (formatage compact : 1K, 1M, etc.)
  let formatted: string;
  if (convertedAmount < 1000) {
    // Moins de 1000 : affichage normal
    formatted = new Intl.NumberFormat(config.locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
  } else if (convertedAmount < 1000000) {
    // De 1K à 999K
    formatted = `${(convertedAmount / 1000).toFixed(1)}K`.replace(/\.0$/, '');
  } else if (convertedAmount < 1000000000) {
    // De 1M à 999M
    formatted = `${(convertedAmount / 1000000).toFixed(2)}M`.replace(/\.00$/, '').replace(/\.0$/, '');
  } else {
    // 1B et plus
    formatted = `${(convertedAmount / 1000000000).toFixed(2)}B`.replace(/\.00$/, '').replace(/\.0$/, '');
  }

  return config.position === 'before'
    ? `${config.name} ${formatted}`
    : `${formatted} ${config.name}`;
};

export const formatNumber = (num: number) => {
  if (num < 100000) {
    // Moins de 6 chiffres : affichage normal avec séparateurs
    return num.toLocaleString('fr-FR');
  } else if (num < 1000000) {
    // De 100K à 999K
    return `${(num / 1000).toFixed(0)}K`;
  } else if (num < 1000000000) {
    // De 1M à 999M
    return `${(num / 1000000).toFixed(2)}M`;
  } else {
    // 1B et plus
    return `${(num / 1000000000).toFixed(2)}B`;
  }
}