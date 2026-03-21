/**
 * Service de calcul des commissions dynamiques
 * Gère les nouveaux plans: ESSENTIEL, CONNEXIONS, COMMERCE, OPERE
 */

import { PlanType, PLAN_COMMISSIONS, CommissionConfig } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';

export interface DynamicCommissionResult {
  commissionAmount: number; // Montant de la commission en FCFA
  monthlyFee: number; // Frais mensuels en FCFA
  setupFee: number | 'custom'; // Frais de setup (0 ou custom pour OPERE)
  totalDue: number; // Total à payer ce mois en FCFA
  breakdown: {
    grossRevenue: number; // CA brut en FCFA
    commissionRate: number; // % de commission
    commissionAmount: number; // Montant calculé en FCFA
    monthlyFee: number; // Abonnement mensuel en FCFA
    minCommission?: number; // Commission minimum (pour OPERE)
    appliedMinimum?: boolean; // Si le minimum a été appliqué
  };
}

/**
 * Calculer la commission dynamique selon le plan
 */
export async function calculateDynamicCommission(
  userId: string,
  transactionAmount: number, // en FCFA
  planType: PlanType
): Promise<DynamicCommissionResult> {
  const config = PLAN_COMMISSIONS[planType];
  
  if (!config) {
    throw new Error(`Configuration non trouvée pour le plan: ${planType}`);
  }
  
  // Calculer la commission sur la transaction
  const commissionAmount = Math.floor((transactionAmount * config.commission) / 100);
  
  // Pour OPERE: vérifier le minimum mensuel
  let finalCommission = commissionAmount;
  let appliedMinimum = false;
  
  if (planType === PlanType.OPERE && config.minCommission) {
    // Récupérer la commission du mois en cours
    const currentMonthCommissions = await getCurrentMonthCommissions(userId);
    const totalWithThisTransaction = currentMonthCommissions + commissionAmount;
    
    if (totalWithThisTransaction < config.minCommission) {
      // Appliquer le minimum
      finalCommission = config.minCommission - currentMonthCommissions;
      appliedMinimum = true;
    }
  }
  
  return {
    commissionAmount: finalCommission,
    monthlyFee: config.monthlyFee,
    setupFee: config.setupFee,
    totalDue: finalCommission + config.monthlyFee,
    breakdown: {
      grossRevenue: transactionAmount,
      commissionRate: config.commission,
      commissionAmount: finalCommission,
      monthlyFee: config.monthlyFee,
      minCommission: config.minCommission,
      appliedMinimum,
    },
  };
}

/**
 * Récupérer les commissions du mois en cours pour un utilisateur
 */
async function getCurrentMonthCommissions(userId: string): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = firstDayOfMonth.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('plan_revenue_tracking')
    .select('commission_amount_fcfa')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .maybeSingle();
  
  if (error) {
    console.error('Erreur récupération commissions:', error);
    return 0;
  }
  
  return data?.commission_amount_fcfa || 0;
}

/**
 * Enregistrer une transaction dans le tracking
 */
export async function trackTransaction(
  userId: string,
  planType: PlanType,
  transactionAmount: number, // en FCFA
  commissionAmount: number // en FCFA
): Promise<void> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = firstDayOfMonth.toISOString().split('T')[0];
  
  // Récupérer ou créer l'entrée du mois
  const { data: existing } = await supabase
    .from('plan_revenue_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .maybeSingle();
  
  if (existing) {
    // Mettre à jour
    const newGrossRevenue = existing.gross_revenue_fcfa + transactionAmount;
    const newCommission = existing.commission_amount_fcfa + commissionAmount;
    const newTransactionCount = existing.transaction_count + 1;
    const newAverage = Math.floor(newGrossRevenue / newTransactionCount);
    
    await supabase
      .from('plan_revenue_tracking')
      .update({
        gross_revenue_fcfa: newGrossRevenue,
        commission_amount_fcfa: newCommission,
        transaction_count: newTransactionCount,
        average_transaction_fcfa: newAverage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Créer
    await supabase
      .from('plan_revenue_tracking')
      .insert({
        user_id: userId,
        plan_type: planType,
        month: monthKey,
        gross_revenue_fcfa: transactionAmount,
        commission_amount_fcfa: commissionAmount,
        transaction_count: 1,
        average_transaction_fcfa: transactionAmount,
      });
  }
}

/**
 * Calculer le total à payer pour le mois en cours
 */
export async function calculateMonthlyDue(userId: string, planType: PlanType): Promise<{
  monthlyFee: number;
  commissions: number;
  setupFee: number;
  total: number;
  breakdown: {
    transactionCount: number;
    grossRevenue: number;
    averageTransaction: number;
  };
}> {
  const config = PLAN_COMMISSIONS[planType];
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = firstDayOfMonth.toISOString().split('T')[0];
  
  // Récupérer les données du mois
  const { data: tracking } = await supabase
    .from('plan_revenue_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .maybeSingle();
  
  const commissions = tracking?.commission_amount_fcfa || 0;
  const setupFeePaid = tracking?.setup_fee_paid_fcfa || 0;
  
  // Pour OPERE: vérifier le minimum
  let finalCommissions = commissions;
  if (planType === PlanType.OPERE && config.minCommission) {
    finalCommissions = Math.max(commissions, config.minCommission);
  }
  
  return {
    monthlyFee: config.monthlyFee,
    commissions: finalCommissions,
    setupFee: setupFeePaid,
    total: config.monthlyFee + finalCommissions + setupFeePaid,
    breakdown: {
      transactionCount: tracking?.transaction_count || 0,
      grossRevenue: tracking?.gross_revenue_fcfa || 0,
      averageTransaction: tracking?.average_transaction_fcfa || 0,
    },
  };
}

/**
 * Obtenir la configuration de commission pour un plan
 */
export function getPlanCommissionConfig(planType: PlanType): CommissionConfig {
  const config = PLAN_COMMISSIONS[planType];
  
  if (!config) {
    throw new Error(`Plan non supporté: ${planType}`);
  }
  
  return config;
}

/**
 * Calculer la commission projetée selon différents scénarios de CA
 */
export function calculateCommissionScenarios(
  planType: PlanType,
  monthlyRevenueScenarios: number[] // Array de CA mensuels en FCFA
): Array<{
  revenue: number;
  commission: number;
  monthlyFee: number;
  total: number;
  effectiveRate: number; // Taux effectif (%)
}> {
  const config = PLAN_COMMISSIONS[planType];
  
  return monthlyRevenueScenarios.map(revenue => {
    let commission = Math.floor((revenue * config.commission) / 100);
    
    // Appliquer le minimum pour OPERE
    if (planType === PlanType.OPERE && config.minCommission) {
      commission = Math.max(commission, config.minCommission);
    }
    
    const total = commission + config.monthlyFee;
    const effectiveRate = revenue > 0 ? (total / revenue) * 100 : 0;
    
    return {
      revenue,
      commission,
      monthlyFee: config.monthlyFee,
      total,
      effectiveRate: parseFloat(effectiveRate.toFixed(2)),
    };
  });
}

/**
 * Comparer les coûts entre deux plans selon le CA
 */
export function comparePlans(
  currentPlan: PlanType,
  targetPlan: PlanType,
  monthlyRevenue: number // en FCFA
): {
  currentCost: number;
  targetCost: number;
  savings: number;
  savingsPercent: number;
  recommendation: 'switch' | 'stay';
  reason: string;
} {
  const currentScenario = calculateCommissionScenarios(currentPlan, [monthlyRevenue])[0];
  const targetScenario = calculateCommissionScenarios(targetPlan, [monthlyRevenue])[0];
  
  const savings = currentScenario.total - targetScenario.total;
  const savingsPercent = currentScenario.total > 0 
    ? (savings / currentScenario.total) * 100 
    : 0;
  
  let recommendation: 'switch' | 'stay' = savings > 0 ? 'switch' : 'stay';
  let reason = '';
  
  if (savings > 0) {
    reason = `Économisez ${savings.toLocaleString()} FCFA/mois (${savingsPercent.toFixed(1)}%)`;
  } else if (savings < 0) {
    reason = `Coût supplémentaire de ${Math.abs(savings).toLocaleString()} FCFA/mois`;
  } else {
    reason = 'Coût identique';
  }
  
  return {
    currentCost: currentScenario.total,
    targetCost: targetScenario.total,
    savings,
    savingsPercent: parseFloat(savingsPercent.toFixed(2)),
    recommendation,
    reason,
  };
}
