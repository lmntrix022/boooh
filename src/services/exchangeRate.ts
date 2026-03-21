import { getCurrentCurrency } from "@/config/currency";

const EXCHANGE_RATES_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

interface ExchangeRates {
  rates: Record<string, number>;
  timestamp: number;
}

export const fetchExchangeRates = async (baseCurrency: string = 'XOF'): Promise<Record<string, number>> => {
  // Vérifier le cache
  const cached = localStorage.getItem(EXCHANGE_RATES_KEY);
  if (cached) {
    const { rates, timestamp }: ExchangeRates = JSON.parse(cached);
    // Si le cache est encore valide (moins de 24h)
    if (Date.now() - timestamp < CACHE_DURATION) {
      return rates;
    }
  }

  // Désactiver l'API externe pour éviter les erreurs CORS
  // Utiliser des taux fixes jusqu'à configuration d'une clé API
  // 1 EUR = 625 FCFA (donc 1 XOF = 1/625 = 0.0016 EUR)
  const defaultRates = {
    XOF: 1,
    EUR: 0.0016,  // 1 XOF = 0.0016 EUR (1 EUR = 625 XOF)
    USD: 0.00165,
    XAF: 1,
    FCFA: 1
  };

  try {
    // Pour l'instant, retourner les taux fixes sans appel API
    // Sauvegarder dans le cache
    const exchangeRates: ExchangeRates = {
      rates: defaultRates,
      timestamp: Date.now()
    };
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(exchangeRates));
    
    return defaultRates;
  } catch (error) {
    // En cas d'erreur, retourner les taux par défaut
    return defaultRates;
  }
};

export const convertAmount = async (amount: number, fromCurrency: string = 'XOF'): Promise<number> => {
  const targetCurrency = getCurrentCurrency();
  
  // Si la monnaie source est la même que la monnaie cible
  if (fromCurrency === targetCurrency.code) {
    return amount;
  }

  try {
    // Les taux sont toujours basés sur XOF
    const rates = await fetchExchangeRates('XOF');
    
    // Convertir d'abord vers XOF si nécessaire
    let amountInXOF = amount;
    if (fromCurrency !== 'XOF') {
      const fromRate = rates[fromCurrency];
      if (fromRate && fromRate !== 0) {
        // Si 1 XOF = 0.00152 EUR, alors 1 EUR = 1 / 0.00152 XOF
        amountInXOF = amount / fromRate;
      }
    }
    
    // Convertir de XOF vers la devise cible
    if (targetCurrency.code === 'XOF') {
      return amountInXOF;
    }
    
    const targetRate = rates[targetCurrency.code];
    if (!targetRate) {
      throw new Error(`Taux de change non trouvé pour ${targetCurrency.code}`);
    }

    return amountInXOF * targetRate;
  } catch (error) {
    // Error log removed
    return amount; // En cas d'erreur, retourner le montant original
  }
}; 