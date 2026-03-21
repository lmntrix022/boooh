import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanType, PlanFeatures } from '@/types/subscription';
import { Loader2 } from 'lucide-react';

interface FeatureProtectedRouteProps {
  children: React.ReactNode;
  feature?: keyof PlanFeatures;
  requiredPlan?: PlanType | PlanType[];
  redirectTo?: string;
}

/**
 * Composant pour protéger les routes selon le plan d'abonnement
 * Redirige vers /pricing si l'utilisateur n'a pas accès
 */
export const FeatureProtectedRoute: React.FC<FeatureProtectedRouteProps> = ({
  children,
  feature,
  requiredPlan,
  redirectTo = '/pricing',
}) => {
  const { isLoading, planType, hasFeature } = useSubscription();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Vérifier l'accès par feature
  if (feature) {
    const hasAccess = hasFeature(feature);
    if (!hasAccess) {
      // Warning log removed
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Vérifier l'accès par plan requis
  if (requiredPlan) {
    const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan];
    const hasAccess = requiredPlans.includes(planType);

    if (!hasAccess) {
      // Warning log removed
      return <Navigate to={redirectTo} replace />;
    }
  }

  // L'utilisateur a accès, afficher la route
  return <>{children}</>;
};
