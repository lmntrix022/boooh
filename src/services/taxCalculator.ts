/**
 * Service pour calculer la TVA (Taxe sur la Valeur Ajoutée)
 * TVA applicable au Gabon : 18%
 */

/**
 * Taux de TVA au Gabon (en pourcentage)
 */
const VAT_RATE = 18; // 18%

/**
 * Taux de change EUR vers FCFA (approximatif)
 */
const EUR_TO_FCFA_RATE = 655;

export interface TaxCalculation {
  vatRate: number; // Taux de TVA (18%)
  amountExclTax: number; // Montant HT en EUR
  vatAmount: number; // Montant de la TVA en EUR
  amountInclTax: number; // Montant TTC en EUR
}

/**
 * Calculer la TVA sur un montant
 * @param amountExclTax - Montant HT en EUR
 * @returns Calcul de la TVA
 */
export function calculateVAT(amountExclTax: number): TaxCalculation {
  const vatAmount = (amountExclTax * VAT_RATE) / 100;
  const amountInclTax = amountExclTax + vatAmount;

  return {
    vatRate: VAT_RATE,
    amountExclTax,
    vatAmount,
    amountInclTax,
  };
}

/**
 * Calculer la TVA sur un montant (version FCFA)
 * @param amountExclTaxFCFA - Montant HT en FCFA
 * @returns Calcul de la TVA en FCFA
 */
export function calculateVATFCFA(amountExclTaxFCFA: number): TaxCalculation & {
  vatAmountFCFA: number;
  amountInclTaxFCFA: number;
} {
  // Convertir en EUR pour le calcul
  const amountExclTaxEUR = amountExclTaxFCFA / EUR_TO_FCFA_RATE;

  // Calculer la TVA en EUR
  const tax = calculateVAT(amountExclTaxEUR);

  // Convertir en FCFA
  const vatAmountFCFA = tax.vatAmount * EUR_TO_FCFA_RATE;
  const amountInclTaxFCFA = tax.amountInclTax * EUR_TO_FCFA_RATE;

  return {
    ...tax,
    vatAmountFCFA,
    amountInclTaxFCFA,
  };
}

/**
 * Calculer le montant HT à partir d'un montant TTC
 * @param amountInclTax - Montant TTC en EUR
 * @returns Calcul avec montant HT
 */
export function calculateAmountExclTax(amountInclTax: number): TaxCalculation {
  const amountExclTax = amountInclTax / (1 + VAT_RATE / 100);
  const vatAmount = amountInclTax - amountExclTax;

  return {
    vatRate: VAT_RATE,
    amountExclTax,
    vatAmount,
    amountInclTax,
  };
}

/**
 * Calculer le montant HT à partir d'un montant TTC (version FCFA)
 * @param amountInclTaxFCFA - Montant TTC en FCFA
 * @returns Calcul avec montant HT en FCFA
 */
export function calculateAmountExclTaxFCFA(
  amountInclTaxFCFA: number
): TaxCalculation & {
  vatAmountFCFA: number;
  amountInclTaxFCFA: number;
} {
  // Convertir en EUR
  const amountInclTaxEUR = amountInclTaxFCFA / EUR_TO_FCFA_RATE;

  // Calculer en EUR
  const tax = calculateAmountExclTax(amountInclTaxEUR);

  // Convertir en FCFA
  const vatAmountFCFA = tax.vatAmount * EUR_TO_FCFA_RATE;
  const amountInclTaxFCFA = tax.amountInclTax * EUR_TO_FCFA_RATE;

  return {
    ...tax,
    vatAmountFCFA,
    amountInclTaxFCFA,
  };
}








