/**
 * useAdaptedPlan - Singularity Design
 *
 * Single hook that exposes the unified plan (Legacy + New) as AdaptedPlan.
 * Use hasFeature(adapted, 'hasEcommerce') instead of branching on plan type.
 */

import { useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { adaptPlan, type AdaptedPlan } from '@/adapters/planFeaturesAdapter';

export function useAdaptedPlan(): {
  adapted: AdaptedPlan | null;
  isLoading: boolean;
  hasFeature: (feature: keyof import('@/types/subscription').PlanFeatures) => boolean;
  isViral: boolean;
  isOperational: boolean;
} {
  const { planType, features, isLoading } = useSubscription();

  const adapted = useMemo<AdaptedPlan | null>(() => {
    if (!planType) return null;
    return adaptPlan(planType, features);
  }, [planType, features]);

  const hasFeature = useMemo(() => {
    return (feature: keyof import('@/types/subscription').PlanFeatures): boolean => {
      if (!adapted) return false;
      const value = adapted.features[feature];
      return value === true;
    };
  }, [adapted]);

  return {
    adapted,
    isLoading,
    hasFeature,
    isViral: adapted?.isViral ?? false,
    isOperational: adapted?.isOperational ?? false,
  };
}
