/**
 * Hook pour gérer les nouveaux plans de souscription
 * Compatible avec les anciens plans (FREE, BUSINESS, MAGIC)
 * et les nouveaux (ESSENTIEL, CONNEXIONS, COMMERCE, OPERE)
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { 
  PlanType, 
  NEW_PLAN_FEATURES, 
  ExtendedPlanFeatures,
  PLAN_COMMISSIONS,
  isLegacyPlan,
  isNewPlan 
} from '@/types/subscription';

export function useNewSubscription() {
  const { subscription, planType: currentPlanType, loading, error } = useSubscription();
  
  // Déterminer si c'est un ancien ou nouveau plan
  const planCategory = useMemo(() => {
    if (!currentPlanType) return 'unknown';
    if (isLegacyPlan(currentPlanType)) return 'legacy';
    if (isNewPlan(currentPlanType)) return 'new';
    return 'unknown';
  }, [currentPlanType]);
  
  // Features du plan actuel
  const features: ExtendedPlanFeatures | null = useMemo(() => {
    if (!currentPlanType) return null;
    return NEW_PLAN_FEATURES[currentPlanType] || null;
  }, [currentPlanType]);
  
  // Configuration des commissions
  const commissionConfig = useMemo(() => {
    if (!currentPlanType) return null;
    return PLAN_COMMISSIONS[currentPlanType] || null;
  }, [currentPlanType]);
  
  // Vérifications des fonctionnalités
  const canUseEcommerce = useMemo(() => {
    return features?.hasEcommerce || false;
  }, [features]);
  
  const canUseCRM = useMemo(() => {
    return features?.hasCRM || false;
  }, [features]);
  
  const canUseAppointments = useMemo(() => {
    return features?.hasAppointments || false;
  }, [features]);
  
  const canUsePortfolio = useMemo(() => {
    return features?.hasPortfolio || false;
  }, [features]);
  
  const canUseInvoicing = useMemo(() => {
    return features?.hasInvoicing || false;
  }, [features]);
  
  // Informations sur les limites
  const limits = useMemo(() => {
    if (!features) return null;
    
    return {
      cards: {
        max: features.maxCards,
        unlimited: features.maxCards === -1,
      },
      products: {
        max: features.maxProducts,
        unlimited: features.maxProducts === -1,
      },
      projects: {
        max: features.maxProjects,
        unlimited: features.maxProjects === -1,
      },
      contacts: {
        max: features.maxContacts,
        unlimited: features.maxContacts === 'unlimited',
      },
      storage: {
        gb: features.storageGB,
        unlimited: features.storageGB === -1,
      },
      monthlyViews: {
        max: features.monthlyViews,
        unlimited: features.monthlyViews === 'unlimited',
      },
    };
  }, [features]);
  
  // Informations sur le pricing
  const pricing = useMemo(() => {
    if (!commissionConfig) return null;
    
    return {
      monthlyFee: commissionConfig.monthlyFee,
      commissionRate: commissionConfig.commission,
      setupFee: commissionConfig.setupFee,
      minCommission: commissionConfig.minCommission,
      hasMonthlyFee: commissionConfig.monthlyFee > 0,
      hasCommission: commissionConfig.commission > 0,
      hasSetupFee: commissionConfig.setupFee !== 0,
    };
  }, [commissionConfig]);
  
  // Flags rapides pour les plans
  const planFlags = useMemo(() => ({
    isEssentiel: currentPlanType === PlanType.ESSENTIEL,
    isConnexions: currentPlanType === PlanType.CONNEXIONS,
    isCommerce: currentPlanType === PlanType.COMMERCE,
    isOpere: currentPlanType === PlanType.OPERE,
    isLegacy: planCategory === 'legacy',
    isNew: planCategory === 'new',
  }), [currentPlanType, planCategory]);
  
  // Niveau de support
  const supportLevel = useMemo(() => {
    return features?.supportLevel || 'community';
  }, [features]);
  
  // Services premium (Opéré)
  const premiumServices = useMemo(() => {
    if (!features) return null;
    
    return {
      dedicatedAccountManager: features.dedicatedAccountManager || false,
      onboardingType: features.onboardingType || 'self',
      training: features.training || false,
      strategicConsulting: features.strategicConsulting || false,
      monthlyReview: features.monthlyReview || false,
      sla: features.sla,
      customIntegrations: features.customIntegrations || false,
      apiAccess: features.apiAccess || false,
      webhooks: features.webhooks || false,
      whiteLabel: features.whiteLabel || false,
      customDomain: features.customDomain || false,
    };
  }, [features]);
  
  // Message d'upgrade personnalisé
  const getUpgradeMessage = (featureName: string): string => {
    if (planFlags.isEssentiel) {
      if (featureName === 'ecommerce') {
        return 'Passez au plan COMMERCE (5% sur vos ventes) pour vendre en ligne';
      }
      if (featureName === 'appointments' || featureName === 'crm') {
        return 'Passez au plan CONNEXIONS (15K FCFA/mois) pour gérer vos contacts et rendez-vous';
      }
    }
    
    if (planFlags.isConnexions) {
      if (featureName === 'ecommerce') {
        return 'Ajoutez le plan COMMERCE (5% commission) pour vendre des produits';
      }
    }
    
    if (planFlags.isCommerce) {
      if (featureName === 'appointments') {
        return 'Ajoutez le module CONNEXIONS pour gérer vos rendez-vous';
      }
      if (featureName === 'premium') {
        return 'Passez au plan OPÉRÉ pour un accompagnement dédié';
      }
    }
    
    return 'Mettez à niveau votre plan pour accéder à cette fonctionnalité';
  };
  
  // Recommander le meilleur plan selon l'usage
  const recommendPlan = (usage: {
    needsEcommerce?: boolean;
    needsAppointments?: boolean;
    needsCRM?: boolean;
    expectedMonthlyRevenue?: number; // en FCFA
  }): PlanType | null => {
    // Si besoin e-commerce avec gros CA → OPERE
    if (usage.needsEcommerce && usage.expectedMonthlyRevenue && usage.expectedMonthlyRevenue >= 5000000) {
      return PlanType.OPERE;
    }
    
    // Si besoin e-commerce → COMMERCE
    if (usage.needsEcommerce) {
      return PlanType.COMMERCE;
    }
    
    // Si besoin RDV/CRM → CONNEXIONS
    if (usage.needsAppointments || usage.needsCRM) {
      return PlanType.CONNEXIONS;
    }
    
    // Par défaut → ESSENTIEL
    return PlanType.ESSENTIEL;
  };
  
  return {
    // État de base
    subscription,
    planType: currentPlanType,
    planCategory,
    loading,
    error,
    
    // Features et limites
    features,
    limits,
    pricing,
    commissionConfig,
    
    // Vérifications
    canUseEcommerce,
    canUseCRM,
    canUseAppointments,
    canUsePortfolio,
    canUseInvoicing,
    
    // Flags
    ...planFlags,
    
    // Support et services
    supportLevel,
    premiumServices,
    
    // Helpers
    getUpgradeMessage,
    recommendPlan,
  };
}

/**
 * Hook pour vérifier l'accès à une fonctionnalité spécifique
 */
export function useFeatureAccess(featureKey: keyof ExtendedPlanFeatures) {
  const { features, getUpgradeMessage } = useNewSubscription();
  
  const hasAccess = useMemo(() => {
    if (!features) return false;
    const value = features[featureKey];
    
    // Gérer les différents types de valeurs
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0 || value === -1;
    if (value === 'unlimited') return true;
    return !!value;
  }, [features, featureKey]);
  
  const upgradeMessage = useMemo(() => {
    return getUpgradeMessage(featureKey);
  }, [featureKey, getUpgradeMessage]);
  
  return {
    hasAccess,
    upgradeMessage,
    feature: features?.[featureKey],
  };
}

/**
 * Hook pour obtenir les packages Opéré disponibles
 */
export function useOperePackages() {
  const { planType } = useNewSubscription();
  
  const canAccessOpere = useMemo(() => {
    return planType === PlanType.OPERE;
  }, [planType]);
  
  return {
    canAccessOpere,
  };
}
