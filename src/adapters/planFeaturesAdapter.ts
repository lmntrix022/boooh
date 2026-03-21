/**
 * PlanFeaturesAdapter - Singularity Design
 *
 * Unifies Legacy (FREE, BUSINESS, MAGIC) and New (ESSENTIEL, CONNEXIONS, COMMERCE, OPERE)
 * plans into a single interface. FREE = viral (vitrine), PAID = operational (gestion).
 *
 * Single responsibility: normalize plan type + DB features → effective PlanFeatures + mode.
 */

import type { PlanFeatures } from '@/types/subscription';
import {
  PlanType,
  PLAN_FEATURES,
  NEW_PLAN_FEATURES,
  isLegacyPlan,
  isNewPlan,
} from '@/types/subscription';

export type PlanMode = 'viral' | 'operational';

export interface AdaptedPlan {
  planType: PlanType;
  features: PlanFeatures;
  mode: PlanMode;
  isViral: boolean;
  isOperational: boolean;
}

/** Plans that are "vitrine only" (no e-commerce/CRM/stock management by default) */
const VIRAL_PLAN_TYPES: PlanType[] = [
  PlanType.FREE,
  PlanType.ESSENTIEL,
];

/**
 * Returns true if the plan is focused on virality (showcase) rather than full operations.
 */
export function isViralPlan(planType: PlanType): boolean {
  return VIRAL_PLAN_TYPES.includes(planType);
}

/**
 * Adapter: from plan type + optional DB-parsed features → single AdaptedPlan.
 * Use this everywhere instead of branching on isLegacyPlan / isNewPlan.
 */
export function adaptPlan(
  planType: PlanType,
  dbFeatures?: PlanFeatures | null
): AdaptedPlan {
  const features: PlanFeatures =
    dbFeatures ??
    (isNewPlan(planType) ? NEW_PLAN_FEATURES[planType] : PLAN_FEATURES[planType]);

  const isViral = isViralPlan(planType);
  const mode: PlanMode = isViral ? 'viral' : 'operational';

  return {
    planType,
    features,
    mode,
    isViral,
    isOperational: !isViral,
  };
}

/**
 * Check a single feature from adapted plan (single source of truth).
 */
export function hasFeature(
  adapted: AdaptedPlan,
  feature: keyof PlanFeatures
): boolean {
  const value = adapted.features[feature];
  return value === true;
}

/**
 * Get effective limits (e.g. maxProducts, maxCards) from adapted plan.
 */
export function getLimit(
  adapted: AdaptedPlan,
  limitKey: keyof PlanFeatures
): number {
  const v = adapted.features[limitKey];
  if (typeof v !== 'number') return 0;
  return v;
}
