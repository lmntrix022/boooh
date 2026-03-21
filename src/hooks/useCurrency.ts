import { useState, useEffect } from 'react';
import { getCurrentCurrency } from '@/config/currency';
import { CURRENCY_CHANGE_EVENT } from '@/components/settings/CurrencySelector';

/**
 * Hook pour obtenir la devise actuelle et écouter les changements
 * @returns La configuration de la devise actuelle
 */
export function useCurrency() {
  const [currency, setCurrency] = useState(getCurrentCurrency());

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(getCurrentCurrency());
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    };
  }, []);

  return currency;
}

