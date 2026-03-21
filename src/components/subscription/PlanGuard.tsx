import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanType } from '@/types/subscription';
import { UpgradePrompt } from './UpgradePrompt';
import { Loader2 } from 'lucide-react';

interface PlanGuardProps {
  children: React.ReactNode;
  feature?: keyof import('@/types/subscription').PlanFeatures;
  requiredPlan?: PlanType | PlanType[];
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  customMessage?: string;
}

/**
 * Composant pour protéger l'accès à certaines fonctionnalités selon le plan
 * Affiche un upgrade prompt si l'utilisateur n'a pas accès
 */
export const PlanGuard: React.FC<PlanGuardProps> = ({
  children,
  feature,
  requiredPlan,
  fallback,
  showUpgradePrompt = true,
  customMessage,
}) => {
  const { isLoading, planType, hasFeature } = useSubscription();

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Vérifier l'accès par feature
  if (feature) {
    const hasAccess = hasFeature(feature);
    if (!hasAccess) {
      if (showUpgradePrompt) {
        return (
          <UpgradePrompt
            feature={feature}
            currentPlan={planType}
            message={customMessage}
          />
        );
      }
      return <>{fallback || null}</>;
    }
  }

  // Vérifier l'accès par plan requis
  if (requiredPlan) {
    const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan];
    const hasAccess = requiredPlans.includes(planType);

    if (!hasAccess) {
      if (showUpgradePrompt) {
        return (
          <UpgradePrompt
            requiredPlan={requiredPlans[0]}
            currentPlan={planType}
            message={customMessage}
          />
        );
      }
      return <>{fallback || null}</>;
    }
  }

  // L'utilisateur a accès, afficher le contenu
  return <>{children}</>;
};

/**
 * Hook pour vérifier l'accès programmatiquement sans composant
 */
export const usePlanGuard = () => {
  const { planType, hasFeature } = useSubscription();

  const checkFeatureAccess = (feature: keyof import('@/types/subscription').PlanFeatures): boolean => {
    return hasFeature(feature);
  };

  const checkPlanAccess = (requiredPlan: PlanType | PlanType[]): boolean => {
    const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan];
    return requiredPlans.includes(planType);
  };

  return {
    checkFeatureAccess,
    checkPlanAccess,
    currentPlan: planType,
  };
};
