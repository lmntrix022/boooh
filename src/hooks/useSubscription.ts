import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlanType,
  AddonType,
  UserSubscription,
  PLAN_FEATURES,
  PLAN_PRICES,
  PlanFeatures,
  ADDON_PRICES,
  NEW_PLAN_FEATURES,
} from '@/types/subscription';
import { PlansService } from '@/services/plansService';
import { AddonsService } from '@/services/addonsService';

/**
 * Hook pour gérer l'abonnement de l'utilisateur
 * Fournit les informations sur le plan actuel, les features disponibles et les méthodes de vérification
 * 
 * UPDATED: Utilise PlansService et AddonsService au lieu de hardcoded values
 */
export function useSubscription() {
  const { user } = useAuth();

  // Charger les plans depuis la DB via PlansService
  const {
    data: dbPlans,
    isLoading: plansLoading,
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => PlansService.getPlans(),
    staleTime: 1000 * 60 * 60, // Cache 1 heure
  });

  // Récupérer l'abonnement de l'utilisateur
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error,
    refetch
  } = useQuery<UserSubscription | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      // Si pas d'abonnement, retourner FREE par défaut
      if (!data) {
        return {
          id: 'default',
          user_id: user.id,
          plan_type: PlanType.FREE,
          status: 'active' as const,
          start_date: new Date().toISOString(),
          end_date: null,
          auto_renew: true,
          addons: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return data as UserSubscription;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Charger les addons actifs depuis la DB via AddonsService
  const {
    data: activeAddons = [],
    isLoading: addonsLoading,
  } = useQuery({
    queryKey: ['user-addons', user?.id],
    queryFn: () => AddonsService.getUserActiveAddons(user?.id!),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Déterminer le type de plan
  const planType = subscription?.plan_type || PlanType.FREE;

  // Récupérer les features du plan
  // NOUVEAU: Essayer d'utiliser les plans depuis la DB d'abord, fallback sur hardcoded
  let features: PlanFeatures;
  
  if (dbPlans && dbPlans.length > 0) {
    // Trouver le plan dans les plans DB
    const dbPlan = dbPlans.find(p => {
      // Mapper les noms de plans entre les deux systèmes
      // Vérifier en minuscules pour éviter problèmes de casse
      const planName = p.name?.toLowerCase() || '';
      return (
        // Anciens plans (legacy)
        (planType === PlanType.FREE && (planName === 'decouverte' || planName === 'free')) ||
        (planType === PlanType.BUSINESS && (planName === 'business')) ||
        (planType === PlanType.MAGIC && (planName === 'pro' || planName === 'magic')) ||
        // Nouveaux plans
        (planType === PlanType.ESSENTIEL && (planName === 'essentiel' || planName === 'decouverte')) ||
        (planType === PlanType.CONNEXIONS && planName === 'connexions') ||
        (planType === PlanType.COMMERCE && planName === 'commerce') ||
        (planType === PlanType.OPERE && planName === 'opere')
      );
    });
    
    if (dbPlan) {
      features = dbPlan.parsedFeatures;
      // Database values are now correct, no need for safety overrides
    } else {
      // Fallback sur hardcoded si pas trouvé
      // Utiliser NEW_PLAN_FEATURES pour les nouveaux plans, PLAN_FEATURES pour les anciens
      features = NEW_PLAN_FEATURES[planType] || PLAN_FEATURES[planType];
    }
  } else {
    // Fallback sur hardcoded si plans pas chargés
    // Utiliser NEW_PLAN_FEATURES pour les nouveaux plans, PLAN_FEATURES pour les anciens
    features = NEW_PLAN_FEATURES[planType] || PLAN_FEATURES[planType];
  }

  // Appliquer les addons aux features
  const featuresWithAddons = AddonsService.applyAddonsToFeatures(features, activeAddons);

  /**
   * Vérifie si l'utilisateur a accès à une fonctionnalité
   */
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    const value = featuresWithAddons[feature];
    return value === true; // Explicitly check for true, not just truthy
  };

  /**
   * Vérifie si l'utilisateur a un addon spécifique
   */
  const hasAddon = (addon: AddonType): boolean => {
    return AddonsService.getUserActiveAddons(user?.id!).then(addons =>
      addons.some(a => a.addon_type === addon)
    );
  };

  /**
   * Vérifie si l'utilisateur peut créer plus de cartes
   */
  const canCreateCard = async (): Promise<{ allowed: boolean; current: number; max: number }> => {
    if (!user?.id) return { allowed: false, current: 0, max: 0 };

    const { count } = await supabase
      .from('business_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const current = count || 0;
    const max = featuresWithAddons.maxCards;

    // Si maxCards est -1, c'est illimité
    if (max === -1) {
      return { allowed: true, current, max: -1 };
    }

    return { allowed: current < max, current, max };
  };

  /**
   * Vérifie si l'utilisateur peut créer plus de produits
   */
  const canCreateProduct = async (cardId: string): Promise<{ allowed: boolean; current: number; max: number }> => {
    if (!hasFeature('hasEcommerce')) {
      return { allowed: false, current: 0, max: 0 };
    }

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', cardId);

    const current = count || 0;
    const max = featuresWithAddons.maxProducts;

    // Si maxProducts est -1, c'est illimité
    if (max === -1) {
      return { allowed: true, current, max: -1 };
    }

    return { allowed: current < max, current, max };
  };

  /**
   * Vérifie si l'utilisateur peut créer plus de projets portfolio
   */
  const canCreateProject = async (): Promise<{ allowed: boolean; current: number; max: number }> => {
    if (!hasFeature('hasPortfolio')) {
      return { allowed: false, current: 0, max: 0 };
    }

    if (!user?.id) return { allowed: false, current: 0, max: 0 };

    const { count } = await supabase
      .from('portfolio_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const current = count || 0;
    const max = featuresWithAddons.maxProjects;

    // Si maxProjects est -1, c'est illimité
    if (max === -1) {
      return { allowed: true, current, max: -1 };
    }

    return { allowed: current < max, current, max };
  };

  /**
   * Calcule le prix total mensuel de l'abonnement (plan + addons)
   * Retourne toujours un prix en EUR pour cohérence avec formatAmount(..., 'EUR')
   * 
   * NOTE: Utilise toujours PLAN_PRICES comme source de vérité pour garantir la cohérence
   * avec les prix affichés dans les cartes de plans. Les prix en DB peuvent être obsolètes.
   */
  const getTotalPrice = (): number => {
    // Utiliser toujours PLAN_PRICES comme source de vérité (prix en EUR)
    // Cela garantit la cohérence avec les prix affichés dans PLANS_INFO
    const planPrice = PLAN_PRICES[planType] || 0;

    // Ajouter le prix des addons (déjà en EUR)
    const addonsPrice = AddonsService.calculateAddonsCost(activeAddons);

    return planPrice + addonsPrice;
  };

  /**
   * Vérifie si le plan est FREE
   */
  const isFree = planType === PlanType.FREE;

  /**
   * Vérifie si le plan est BUSINESS
   */
  const isBusiness = planType === PlanType.BUSINESS;

  /**
   * Vérifie si le plan est MAGIC
   */
  const isMagic = planType === PlanType.MAGIC;

  /**
   * Vérifie si l'abonnement est actif
   */
  const isActive = subscription?.status === 'active';

  /**
   * Vérifie si l'abonnement est en période d'essai
   */
  const isTrial = subscription?.status === 'trial';

  const isLoading = subscriptionLoading || plansLoading || addonsLoading;

  return {
    subscription,
    planType,
    features: featuresWithAddons,
    addons: activeAddons,
    isLoading,
    error,
    refetch,

    // Méthodes de vérification
    hasFeature,
    hasAddon,
    canCreateCard,
    canCreateProduct,
    canCreateProject,
    getTotalPrice,

    // Flags rapides
    isFree,
    isBusiness,
    isMagic,
    isActive,
    isTrial,

    // Fonction pour rafraîchir l'abonnement
    refetchSubscription: refetch,
  };
}
