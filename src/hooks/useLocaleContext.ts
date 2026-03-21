/**
 * useLocaleContext - Singularity Design
 *
 * Localisation intelligente: détecte devise/culture (FCFA/Mobile Money vs USD/Stripe)
 * pour que l'app soit "indigène partout".
 */

import { getCurrentCurrency } from '@/config/currency';

export type PaymentPreference = 'mobile_money' | 'card' | 'both';

export interface LocaleContext {
  /** ISO currency code (XOF, EUR, USD) */
  currency: string;
  /** Preferred payment methods for the region */
  paymentPreference: PaymentPreference;
  /** Locale for number/date formatting */
  locale: string;
  /** True if FCFA/XAF zone (West/Central Africa) */
  isFcfaZone: boolean;
  /** True if EUR/USD (card-first) */
  isCardZone: boolean;
}

const XOF_CODES = ['XOF', 'XAF', 'XAF'];
const CARD_ZONE_CODES = ['EUR', 'USD', 'GBP', 'CHF'];

/**
 * Derive payment preference and zone from currency code.
 */
function deriveContext(currencyCode: string): Omit<LocaleContext, 'locale'> {
  const isFcfaZone = XOF_CODES.includes(currencyCode.toUpperCase());
  const isCardZone = CARD_ZONE_CODES.includes(currencyCode.toUpperCase());
  const paymentPreference: PaymentPreference = isFcfaZone
    ? 'mobile_money'
    : isCardZone
      ? 'card'
      : 'both';

  return {
    currency: currencyCode,
    paymentPreference,
    isFcfaZone,
    isCardZone,
  };
}

/**
 * Hook: returns current locale/currency context from stored config.
 * Reads localStorage each render so that a currency change in settings is reflected.
 */
export function useLocaleContext(): LocaleContext {
  const config = getCurrentCurrency();
  const derived = deriveContext(config.code);
  return { ...derived, locale: config.locale };
}

/**
 * Server-safe / non-hook version for utils or SSR.
 */
export function getLocaleContext(): LocaleContext {
  const config = getCurrentCurrency();
  const derived = deriveContext(config.code);
  return { ...derived, locale: config.locale };
}
