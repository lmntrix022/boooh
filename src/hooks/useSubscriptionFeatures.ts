import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionFeatures {
  // E-commerce
  hasEcommerce: boolean;
  digitalProducts: boolean;
  drmProtection: boolean;
  watermarking: boolean;
  
  // Autres fonctionnalités
  hasPortfolio: boolean;
  hasInvoicing: boolean;
  hasStockManagement: boolean;
  hasAppointments: boolean;
  hasCRM: boolean;
  hasMap: boolean;
  
  // Limites
  maxProducts: number;
  maxCards: number;
  maxProjects: number;
  
  // Plan
  planType: string;
  planName: string;
}

/**
 * Hook pour vérifier les fonctionnalités disponibles selon l'abonnement
 */
export function useSubscriptionFeatures(cardId?: string) {
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) {
      setLoading(false);
      return;
    }

    async function fetchFeatures() {
      try {
        const { data: card, error: cardError } = await supabase
          .from('business_cards')
          .select('subscription_plan, user_id')
          .eq('id', cardId)
          .single();

        if (cardError) throw cardError;

        const plan = card.subscription_plan || 'free';

        // Mapper les plans aux fonctionnalités
        const featureMap: Record<string, SubscriptionFeatures> = {
          'free': {
            hasEcommerce: false,
            digitalProducts: false,
            drmProtection: false,
            watermarking: false,
            hasPortfolio: false,
            hasInvoicing: false,
            hasStockManagement: false,
            hasAppointments: false,
            hasCRM: false,
            hasMap: false,
            maxProducts: 0,
            maxCards: 1,
            maxProjects: 0,
            planType: 'free',
            planName: 'Gratuit',
          },
          'business': {
            hasEcommerce: true,
            digitalProducts: true,
            drmProtection: false,
            watermarking: false, // Watermarking nécessite MAGIC
            hasPortfolio: true,
            hasInvoicing: true,
            hasStockManagement: true,
            hasAppointments: true,
            hasCRM: false,
            hasMap: true,
            maxProducts: 20,
            maxCards: 1,
            maxProjects: 10,
            planType: 'business',
            planName: 'Business',
          },
          'magic': {
            hasEcommerce: true,
            digitalProducts: true,
            drmProtection: true, // ✅ DRM activé
            watermarking: true,  // ✅ Watermarking activé
            hasPortfolio: true,
            hasInvoicing: true,
            hasStockManagement: true,
            hasAppointments: true,
            hasCRM: true,
            hasMap: true,
            maxProducts: -1, // Illimité
            maxCards: 5,
            maxProjects: -1, // Illimité
            planType: 'magic',
            planName: 'Magic',
          },
          'pack_createur': {
            hasEcommerce: true,
            digitalProducts: true,
            drmProtection: true, // ✅ DRM activé
            watermarking: true,  // ✅ Watermarking activé
            hasPortfolio: true,
            hasInvoicing: true,
            hasStockManagement: true,
            hasAppointments: true,
            hasCRM: true,
            hasMap: true,
            maxProducts: -1, // Illimité
            maxCards: 5,
            maxProjects: -1, // Illimité
            planType: 'pack_createur',
            planName: 'Pack Créateur',
          },
        };

        setFeatures(featureMap[plan] || featureMap['free']);
        setLoading(false);

      } catch (err: any) {
        // Error log removed
        setError(err.message);
        setLoading(false);
      }
    }

    fetchFeatures();
  }, [cardId]);

  return { features, loading, error };
}

/**
 * Hook simplifié pour vérifier une fonctionnalité spécifique
 */
export function useHasFeature(cardId: string | undefined, featureName: keyof SubscriptionFeatures): boolean {
  const { features } = useSubscriptionFeatures(cardId);
  return features?.[featureName] as boolean || false;
}

/**
 * Hook pour vérifier si le watermarking est activé
 */
export function useHasWatermarking(cardId?: string): boolean {
  return useHasFeature(cardId, 'watermarking');
}

/**
 * Hook pour vérifier si le DRM est activé
 */
export function useHasDRM(cardId?: string): boolean {
  return useHasFeature(cardId, 'drmProtection');
}

export default useSubscriptionFeatures;





















