/**
 * Service pour calculer le montant total avec frais
 * Utilise feeCalculator pour calculer le total final
 * 
 * MODÈLE DE FRAIS (transparence):
 * ================================
 * 1. Frais BoohPay (infrastructure de paiement): 1.5% + 1€
 * 2. Commission Bööh (selon le plan du vendeur):
 *    - FREE: 3% + 0.75€
 *    - BUSINESS/MAGIC: 1% + 0.75€
 * 3. TVA (18% au Gabon) - sur le montant des produits uniquement
 */

import { PlanType } from '@/types/subscription';
import { calculateTransactionFeesFCFA, getUserPlanType } from './feeCalculator';

// Taux de change EUR vers FCFA
const EUR_TO_FCFA_RATE = 655;

// Frais BoohPay (fixe, non négociable)
const BOOHPAY_FEE_RATE = 0.015; // 1.5%
const BOOHPAY_FEE_FIXED_EUR = 1; // 1€

// TVA au Gabon
const VAT_RATE = 0.18; // 18%

export interface PaymentBreakdown {
  // Montants de base
  subtotal: number; // Sous-total en FCFA (montant des produits HT)
  
  // TVA (18% au Gabon)
  vat: {
    rate: number; // Taux de TVA (18)
    amountFCFA: number; // Montant de la TVA en FCFA
    description: string; // Description pour affichage
  };

  // Frais BoohPay (infrastructure de paiement)
  boohpayFees: {
    rate: number; // Pourcentage (1.5%)
    fixedEur: number; // Frais fixes en EUR (1€)
    totalEur: number; // Total en EUR
    totalFCFA: number; // Total en FCFA
    description: string; // Description pour affichage
  };

  // Commission Bööh (selon le plan)
  boohCommission: {
    percentage: number; // Pourcentage (3% ou 1%)
    fixedEur: number; // Frais fixes en EUR (0.75€)
    totalEur: number; // Total en EUR
    totalFCFA: number; // Total en FCFA
    description: string; // Description pour affichage
  };
  
  // Frais de transaction (total = BoohPay + Bööh)
  fees: {
    percentage: number; // Pourcentage de frais (3% ou 1%)
    fixedFee: number; // Frais fixes en EUR (0.75)
    percentageAmount: number; // Montant du pourcentage en EUR
    totalFees: number; // Total des frais en EUR
    totalFeesFCFA: number; // Total des frais en FCFA
  };
  
  // Total
  total: number; // Total en FCFA (sous-total + TVA + frais)
  
  // Plan type utilisé pour le calcul
  planType: PlanType;
}

/**
 * Calculer le montant total avec frais et TVA
 * IMPORTANT: Les frais sont calculés selon le type de compte du VENDEUR (propriétaire de la carte)
 * 
 * TOTAL = Sous-total + TVA (18%) + Frais BoohPay + Commission Bööh
 * 
 * 1. TVA (18% au Gabon) - sur le montant des produits
 * 2. Frais BoohPay (infrastructure): 1.5% + 1€
 * 3. Commission Bööh (selon le plan du vendeur):
 *    - FREE: 3% + 0,75€ par transaction
 *    - BUSINESS/MAGIC: 1% + 0,75€ par transaction
 * 
 * @param subtotalFCFA - Sous-total en FCFA (montant des produits HT)
 * @param sellerUserId - ID de l'utilisateur VENDEUR (propriétaire de la carte)
 * @returns Détail du calcul avec frais et TVA
 */
export async function calculatePaymentWithFeesAndTax(
  subtotalFCFA: number,
  sellerUserId: string
): Promise<PaymentBreakdown> {
  // Récupérer le type de compte du VENDEUR (pas de l'acheteur)
  const planType = await getUserPlanType(sellerUserId);

  // Calculer la TVA (18% sur le sous-total)
  const vatAmountFCFA = Math.round(subtotalFCFA * VAT_RATE);

  // Calculer les frais de transaction Bööh (commission selon le plan)
  const fees = calculateTransactionFeesFCFA(subtotalFCFA, planType);

  // Calculer les frais BoohPay séparément
  const subtotalEur = subtotalFCFA / EUR_TO_FCFA_RATE;
  const boohpayTotalEur = (subtotalEur * BOOHPAY_FEE_RATE) + BOOHPAY_FEE_FIXED_EUR;
  const boohpayTotalFCFA = Math.round(boohpayTotalEur * EUR_TO_FCFA_RATE);

  // Commission Bööh
  const boohCommissionTotalEur = fees.totalFees;
  const boohCommissionTotalFCFA = fees.totalFeesFCFA;

  // Total des frais (BoohPay + Bööh)
  const totalFeesFCFA = boohpayTotalFCFA + boohCommissionTotalFCFA;

  // Calculer le total (sous-total + TVA + tous les frais)
  const totalFCFA = subtotalFCFA + vatAmountFCFA + totalFeesFCFA;

  return {
    subtotal: subtotalFCFA,
    
    // TVA (18%)
    vat: {
      rate: VAT_RATE * 100, // 18%
      amountFCFA: vatAmountFCFA,
      description: `${(VAT_RATE * 100).toFixed(0)}%`,
    },
    
    // Frais BoohPay (infrastructure de paiement)
    boohpayFees: {
      rate: BOOHPAY_FEE_RATE * 100, // En pourcentage (1.5)
      fixedEur: BOOHPAY_FEE_FIXED_EUR,
      totalEur: boohpayTotalEur,
      totalFCFA: boohpayTotalFCFA,
      description: `${(BOOHPAY_FEE_RATE * 100).toFixed(1)}% + ${BOOHPAY_FEE_FIXED_EUR}€`,
    },

    // Commission Bööh
    boohCommission: {
      percentage: fees.percentage,
      fixedEur: fees.fixedFee,
      totalEur: boohCommissionTotalEur,
      totalFCFA: boohCommissionTotalFCFA,
      description: `${fees.percentage}% + ${fees.fixedFee}€`,
    },

    // Frais totaux (pour compatibilité)
    fees: {
      percentage: fees.percentage,
      fixedFee: fees.fixedFee,
      percentageAmount: fees.percentageAmount,
      totalFees: fees.totalFees,
      totalFeesFCFA: totalFeesFCFA, // BoohPay + Bööh (sans TVA)
    },
    
    total: totalFCFA,
    planType,
  };
}

/**
 * Calculer le montant total avec frais et TVA (synchronisé)
 * Version synchronisée qui nécessite le planType
 * @param subtotalFCFA - Sous-total en FCFA (montant HT)
 * @param planType - Type de compte du vendeur
 * @returns Détail du calcul avec frais et TVA
 */
export function calculatePaymentWithFeesAndTaxSync(
  subtotalFCFA: number,
  planType: PlanType
): PaymentBreakdown {
  // Calculer la TVA (18% sur le sous-total)
  const vatAmountFCFA = Math.round(subtotalFCFA * VAT_RATE);

  // Calculer les frais de transaction Bööh
  const fees = calculateTransactionFeesFCFA(subtotalFCFA, planType);

  // Calculer les frais BoohPay séparément
  const subtotalEur = subtotalFCFA / EUR_TO_FCFA_RATE;
  const boohpayTotalEur = (subtotalEur * BOOHPAY_FEE_RATE) + BOOHPAY_FEE_FIXED_EUR;
  const boohpayTotalFCFA = Math.round(boohpayTotalEur * EUR_TO_FCFA_RATE);

  // Commission Bööh
  const boohCommissionTotalEur = fees.totalFees;
  const boohCommissionTotalFCFA = fees.totalFeesFCFA;

  // Total des frais (BoohPay + Bööh)
  const totalFeesFCFA = boohpayTotalFCFA + boohCommissionTotalFCFA;

  // Calculer le total (sous-total + TVA + tous les frais)
  const totalFCFA = subtotalFCFA + vatAmountFCFA + totalFeesFCFA;

  return {
    subtotal: subtotalFCFA,
    
    // TVA (18%)
    vat: {
      rate: VAT_RATE * 100,
      amountFCFA: vatAmountFCFA,
      description: `${(VAT_RATE * 100).toFixed(0)}%`,
    },

    // Frais BoohPay
    boohpayFees: {
      rate: BOOHPAY_FEE_RATE * 100,
      fixedEur: BOOHPAY_FEE_FIXED_EUR,
      totalEur: boohpayTotalEur,
      totalFCFA: boohpayTotalFCFA,
      description: `${(BOOHPAY_FEE_RATE * 100).toFixed(1)}% + ${BOOHPAY_FEE_FIXED_EUR}€`,
    },

    // Commission Bööh
    boohCommission: {
      percentage: fees.percentage,
      fixedEur: fees.fixedFee,
      totalEur: boohCommissionTotalEur,
      totalFCFA: boohCommissionTotalFCFA,
      description: `${fees.percentage}% + ${fees.fixedFee}€`,
    },

    fees: {
      percentage: fees.percentage,
      fixedFee: fees.fixedFee,
      percentageAmount: fees.percentageAmount,
      totalFees: fees.totalFees,
      totalFeesFCFA: totalFeesFCFA,
    },
    total: totalFCFA,
    planType,
  };
}

