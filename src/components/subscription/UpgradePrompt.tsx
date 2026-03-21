import React from 'react';
import { Link } from 'react-router-dom';
import { PlanType, PlanFeatures, PLANS_INFO, PLAN_PRICES } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Sparkles, Zap, ArrowRight, Lock } from 'lucide-react';

interface UpgradePromptProps {
  feature?: keyof PlanFeatures;
  requiredPlan?: PlanType;
  currentPlan: PlanType;
  message?: string;
}

const FEATURE_NAMES: Record<keyof PlanFeatures, string> = {
  maxCards: 'Cartes multiples',
  customThemes: 'Thèmes personnalisés',
  removeBranding: 'Suppression du branding Bööh',
  advancedAnalytics: 'Analytics avancés',
  hasEcommerce: 'Boutique en ligne',
  maxProducts: 'Produits illimités',
  digitalProducts: 'Produits numériques',
  drmProtection: 'Protection DRM',
  watermarking: 'Watermarking',
  hasPortfolio: 'Portfolio',
  maxProjects: 'Projets illimités',
  quoteRequests: 'Demandes de devis',
  hasInvoicing: 'Facturation',
  advancedInvoicing: 'Facturation avancée',
  autoInvoicing: 'Facturation automatique',
  hasStockManagement: 'Gestion de stock',
  advancedStock: 'Stock avancé',
  hasAppointments: 'Rendez-vous',
  advancedAppointments: 'Gestion avancée des RDV',
  googleCalendarSync: 'Sync Google Calendar',
  hasCRM: 'CRM',
  aiParsing: 'Parsing IA',
  ocrScanning: 'Scan OCR',
  hasMap: 'Carte interactive',
  mapClustering: 'Clustering de carte',
  multiUser: 'Multi-utilisateurs',
  maxTeamMembers: 'Équipe étendue',
  rolePermissions: 'Permissions par rôle',
  marketplaceCommission: 'Commission réduite',
  supportLevel: 'Support prioritaire',
};

const PLAN_ICONS = {
  [PlanType.FREE]: <Sparkles className="h-6 w-6" />,
  [PlanType.BUSINESS]: <Zap className="h-6 w-6" />,
  [PlanType.MAGIC]: <Crown className="h-6 w-6" />,
};

/**
 * Composant d'invitation à upgrader vers un plan supérieur
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredPlan,
  currentPlan,
  message,
}) => {
  // Déterminer le plan recommandé
  const recommendedPlan = requiredPlan || (feature ? getMinimumPlanForFeature(feature) : PlanType.BUSINESS);
  const planInfo = PLANS_INFO.find(p => p.type === recommendedPlan);

  if (!planInfo) return null;

  const featureName = feature ? FEATURE_NAMES[feature] : 'cette fonctionnalité';

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Fonctionnalité Premium
        </h3>

        <p className="text-gray-600 mb-6">
          {message || (
            <>
              <strong>{featureName}</strong> est disponible avec le plan{' '}
              <span className="font-semibold text-blue-600">{planInfo.name}</span>
            </>
          )}
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-3">
            {PLAN_ICONS[recommendedPlan]}
            <span className="ml-2 text-xl font-bold text-gray-900">{planInfo.name}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {PLAN_PRICES[recommendedPlan].toLocaleString()} FCFA
            <span className="text-lg font-normal text-gray-500">/mois</span>
          </div>
          <p className="text-sm text-gray-600">{planInfo.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Link to="/pricing">
              <Crown className="mr-2 h-5 w-5" />
              Passer à {planInfo.name}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link to="/pricing">Voir tous les plans</Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Débloquez toutes les fonctionnalités et développez votre business
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Détermine le plan minimum requis pour une feature
 */
function getMinimumPlanForFeature(feature: keyof PlanFeatures): PlanType {
  // Vérifier dans l'ordre: FREE -> BUSINESS -> MAGIC
  for (const [planType, features] of Object.entries(PLANS_INFO)) {
    const planFeatures = features.features;
    if (planFeatures[feature]) {
      return features.type;
    }
  }
  return PlanType.BUSINESS; // Par défaut
}
