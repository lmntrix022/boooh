/**
 * Service pour calculer les frais de transaction selon le type de compte
 * FREE = 3% + 0,75 € par transaction
 * BUSINESS et MAGIC = 1% + 0,75 € par transaction
 */

import { PlanType } from '@/types/subscription';

export interface FeeCalculation {
  percentage: number; // Pourcentage de frais (3% ou 1%)
  fixedFee: number; // Frais fixes en EUR (0.75)
  percentageAmount: number; // Montant du pourcentage en EUR
  totalFees: number; // Total des frais en EUR
  originalAmount: number; // Montant original en EUR
  amountWithFees: number; // Montant avec frais en EUR
}

/**
 * Taux de change EUR vers FCFA (approximatif)
 */
const EUR_TO_FCFA_RATE = 655;

/**
 * Calculer les frais de transaction selon le type de compte du VENDEUR
 * IMPORTANT: Le type de compte utilisé est celui du VENDEUR (propriétaire de la carte), pas de l'acheteur
 * 
 * Frais selon le type de compte du vendeur:
 * - FREE: 3% + 0,75 € par transaction
 * - BUSINESS: 1% + 0,75 € par transaction
 * - MAGIC: 1% + 0,75 € par transaction
 * 
 * @param amount - Montant en EUR
 * @param planType - Type de compte du VENDEUR (FREE, BUSINESS, MAGIC)
 * @returns Calcul des frais
 */
export function calculateTransactionFees(
  amount: number,
  planType: PlanType
): FeeCalculation {
  // Définir le pourcentage selon le type de compte du VENDEUR
  // FREE = 3% + 0,75€, BUSINESS/MAGIC = 1% + 0,75€
  const percentage = planType === PlanType.FREE ? 3 : 1;
  const fixedFee = 0.75; // 0,75 € fixe par transaction

  // Calculer le montant du pourcentage
  const percentageAmount = (amount * percentage) / 100;

  // Calculer le total des frais
  const totalFees = percentageAmount + fixedFee;

  // Calculer le montant avec frais
  const amountWithFees = amount + totalFees;

  return {
    percentage,
    fixedFee,
    percentageAmount,
    totalFees,
    originalAmount: amount,
    amountWithFees,
  };
}

/**
 * Calculer les frais de transaction (version FCFA)
 * @param amountFCFA - Montant en FCFA
 * @param planType - Type de compte
 * @returns Calcul des frais en FCFA
 */
export function calculateTransactionFeesFCFA(
  amountFCFA: number,
  planType: PlanType
): FeeCalculation & { totalFeesFCFA: number; amountWithFeesFCFA: number } {
  // Convertir en EUR pour le calcul
  const amountEUR = amountFCFA / EUR_TO_FCFA_RATE;

  // Calculer les frais en EUR
  const fees = calculateTransactionFees(amountEUR, planType);

  // Convertir les frais en FCFA
  const totalFeesFCFA = fees.totalFees * EUR_TO_FCFA_RATE;
  const amountWithFeesFCFA = fees.amountWithFees * EUR_TO_FCFA_RATE;

  return {
    ...fees,
    totalFeesFCFA,
    amountWithFeesFCFA,
  };
}

/**
 * Récupérer le type de compte d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Type de compte ou FREE par défaut
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Essayer d'abord avec status = 'active' (minuscule)
    let { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Si pas de résultat avec 'active', essayer sans filtre de statut
    // et prendre la plus récente (au cas où le statut serait différent)
    if (!data && !error) {
      console.log(`⚠️ Aucune subscription avec status='active' trouvée, recherche sans filtre de statut...`);
      const { data: allData, error: allError } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5); // Prendre les 5 plus récentes pour voir ce qui existe
      
      if (allError) {
        console.error('❌ Erreur lors de la récupération des subscriptions:', allError);
      } else if (allData && allData.length > 0) {
        console.log(`📋 Subscriptions trouvées pour l'utilisateur ${userId}:`, allData);
        // Prendre la première qui a un plan_type valide
        const activeSubscription = allData.find(sub => sub.plan_type && (
          sub.status === 'active' || 
          sub.status === 'ACTIVE' || 
          !sub.status || // Si pas de statut, considérer comme actif
          sub.status === 'trial'
        ));
        
        if (activeSubscription) {
          data = activeSubscription;
          console.log(`✅ Subscription trouvée avec statut: ${activeSubscription.status}`);
        }
      }
    }

    if (error) {
      console.error('❌ Erreur lors de la récupération du type de compte:', error);
      return PlanType.FREE;
    }

    if (!data || !data.plan_type) {
      console.log(`ℹ️ Aucune subscription avec plan_type trouvée pour l'utilisateur ${userId}, utilisation de FREE par défaut`);
      console.log(`📊 Données retournées:`, data);
      return PlanType.FREE;
    }

    // Normaliser la valeur (convertir en minuscules pour correspondre à l'enum)
    const planTypeStr = String(data.plan_type).toLowerCase().trim();
    
    // Mapper les valeurs possibles vers PlanType
    let planType: PlanType;
    if (planTypeStr === 'magic' || planTypeStr === PlanType.MAGIC) {
      planType = PlanType.MAGIC;
    } else if (planTypeStr === 'business' || planTypeStr === PlanType.BUSINESS) {
      planType = PlanType.BUSINESS;
    } else {
      planType = PlanType.FREE;
    }

    console.log(`✅ Type de compte récupéré pour l'utilisateur ${userId}: ${planType} (valeur DB: ${data.plan_type}, statut: ${data.status}, normalisée: ${planTypeStr})`);
    
    return planType;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du type de compte:', error);
    return PlanType.FREE;
  }
}

