/**
 * Service de synchronisation des commissions avec BoohPay
 * 
 * Ce service gère la synchronisation de la commission de Bööh vers BoohPay
 * quand un utilisateur change de plan.
 * 
 * MODÈLE DE FRAIS:
 * ================
 * 1. Frais BoohPay (fixe, non négociable): 1.5% + 1€
 *    → Revient à BoohPay pour l'infrastructure de paiement
 * 
 * 2. Commission Bööh (variable selon le plan):
 *    - FREE: 3% + 0.75€
 *    - BUSINESS: 1% + 0.75€
 *    - MAGIC: 1% + 0.75€
 *    → Revient à Bööh comme commission sur les ventes
 * 
 * EXEMPLE - Vente de 10€ avec plan FREE:
 * =====================================
 * - Frais BoohPay: 1.5% + 1€ = 0.15€ + 1€ = 1.15€
 * - Commission Bööh: 3% + 0.75€ = 0.30€ + 0.75€ = 1.05€
 * - Total prélevé: 2.20€
 * - Vendeur reçoit: 7.80€
 */

import { PlanType, PLAN_FEATURES } from '@/types/subscription';
import { boohPayService } from './boohPayService';
import { BoohPayMerchantService } from './boohPayMerchantService';

/**
 * Configuration des commissions par plan
 * Rate = pourcentage (0.03 = 3%)
 * Fixed = montant fixe en centimes (75 = 0.75€)
 */
export const PLAN_COMMISSIONS: Record<PlanType, { rate: number; fixed: number }> = {
  [PlanType.FREE]: {
    rate: 0.03, // 3%
    fixed: 75,  // 0.75€
  },
  [PlanType.BUSINESS]: {
    rate: 0.01, // 1%
    fixed: 75,  // 0.75€
  },
  [PlanType.MAGIC]: {
    rate: 0.01, // 1%
    fixed: 75,  // 0.75€
  },
};

/**
 * Synchroniser la commission d'un utilisateur avec BoohPay
 * À appeler quand l'utilisateur change de plan
 */
export async function syncCommissionWithBoohPay(
  userId: string,
  planType: PlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer le marchand BoohPay associé à cet utilisateur
    const merchantData = await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    if (!merchantData) {
      console.log(`[CommissionSync] Pas de marchand BoohPay pour l'utilisateur ${userId}`);
      return { success: true }; // Pas d'erreur, juste pas de marchand
    }

    // Obtenir la commission pour ce plan
    const commission = PLAN_COMMISSIONS[planType] || PLAN_COMMISSIONS[PlanType.FREE];

    console.log(
      `[CommissionSync] Mise à jour commission pour user=${userId}, ` +
      `plan=${planType}, rate=${commission.rate * 100}%, fixed=${commission.fixed / 100}€`
    );

    // Mettre à jour chez BoohPay
    const result = await boohPayService.updateAppCommission(
      commission.rate,
      commission.fixed,
      merchantData.apiKey
    );

    if (!result.success) {
      console.error(`[CommissionSync] Échec de la mise à jour chez BoohPay`);
      return { success: false, error: 'Échec de la mise à jour chez BoohPay' };
    }

    console.log(`[CommissionSync] Commission mise à jour avec succès`);
    return { success: true };
  } catch (error) {
    console.error('[CommissionSync] Erreur:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Obtenir les informations de frais pour un montant donné
 * Retourne un détail formaté des frais BoohPay et commission Bööh
 */
export async function getFeesBreakdown(
  userId: string,
  amountCents: number
): Promise<{
  amount: { cents: number; formatted: string };
  boohpayFee: { cents: number; formatted: string; description: string };
  appCommission: { cents: number; formatted: string; description: string };
  totalFees: { cents: number; formatted: string };
  sellerReceives: { cents: number; formatted: string };
} | null> {
  try {
    const merchantData = await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    if (!merchantData) {
      return null;
    }

    const result = await boohPayService.simulateFees(amountCents, merchantData.apiKey);
    
    if (!result) {
      return null;
    }

    return {
      amount: { 
        cents: amountCents, 
        formatted: `${(amountCents / 100).toFixed(2)}€` 
      },
      boohpayFee: { 
        cents: result.breakdown.boohpayFee.amount, 
        formatted: `${(result.breakdown.boohpayFee.amount / 100).toFixed(2)}€`,
        description: result.breakdown.boohpayFee.description,
      },
      appCommission: { 
        cents: result.breakdown.appCommission.amount, 
        formatted: `${(result.breakdown.appCommission.amount / 100).toFixed(2)}€`,
        description: result.breakdown.appCommission.description,
      },
      totalFees: { 
        cents: result.breakdown.totalFees, 
        formatted: `${(result.breakdown.totalFees / 100).toFixed(2)}€` 
      },
      sellerReceives: { 
        cents: result.breakdown.sellerReceives, 
        formatted: `${(result.breakdown.sellerReceives / 100).toFixed(2)}€` 
      },
    };
  } catch (error) {
    console.error('[GetFeesBreakdown] Erreur:', error);
    return null;
  }
}

/**
 * Afficher un résumé des frais pour un montant
 * Utile pour le debug ou l'affichage utilisateur
 */
export function formatFeesBreakdown(
  amountCents: number,
  planType: PlanType = PlanType.FREE
): string {
  const commission = PLAN_COMMISSIONS[planType] || PLAN_COMMISSIONS[PlanType.FREE];
  
  // Frais BoohPay: 1.5% + 1€
  const boohpayFee = Math.round(amountCents * 0.015 + 100);
  
  // Commission Bööh
  const appCommission = Math.round(amountCents * commission.rate + commission.fixed);
  
  const totalFees = boohpayFee + appCommission;
  const sellerReceives = amountCents - totalFees;

  const formatCents = (c: number) => `${(c / 100).toFixed(2)}€`;

  return `
┌─────────────────────────────────────────────┐
│       DÉTAIL DES FRAIS (Plan ${planType.padEnd(8)})   │
├─────────────────────────────────────────────┤
│ Montant de la vente:      ${formatCents(amountCents).padStart(10)}       │
│                                             │
│ Frais BoohPay (1.5% + 1€):  ${formatCents(boohpayFee).padStart(10)}       │
│ Commission Bööh:            ${formatCents(appCommission).padStart(10)}       │
│ ─────────────────────────────────           │
│ Total des frais:            ${formatCents(totalFees).padStart(10)}       │
│ Vendeur reçoit:             ${formatCents(sellerReceives).padStart(10)}       │
└─────────────────────────────────────────────┘
  `.trim();
}

