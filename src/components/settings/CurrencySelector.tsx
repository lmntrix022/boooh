import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { availableCurrencies, getCurrentCurrency, setCurrentCurrency, type CurrencyConfig } from '@/config/currency';

// Événement personnalisé pour la mise à jour de la devise
export const CURRENCY_CHANGE_EVENT = 'currency-changed';

export const CurrencySelector = () => {
  const [currentCurrency, setCurrentCurrencyState] = React.useState(getCurrentCurrency());

  const handleCurrencyChange = (currencyCode: string) => {
    const newCurrency = availableCurrencies.find(c => c.code === currencyCode);
    if (newCurrency) {
      setCurrentCurrency(newCurrency);
      setCurrentCurrencyState(newCurrency);
      
      // Émettre un événement personnalisé pour notifier le changement de devise
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, {
        detail: { currency: newCurrency }
      }));
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="currency-selector" className="text-sm font-medium text-gray-700">
        Devise
      </label>
      <Select
        value={currentCurrency.code}
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sélectionner une devise" />
        </SelectTrigger>
        <SelectContent>
          {availableCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.name} ({currency.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}