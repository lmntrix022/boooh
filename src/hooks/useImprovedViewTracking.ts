import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateVisitorId, getVisitorIP } from '@/services/analyticsService';

interface UseImprovedViewTrackingParams {
  cardId: string;
  enabled?: boolean; // Permet de désactiver le tracking (ex: en mode preview)
}

/**
 * Hook amélioré pour tracker les vues de carte avec IP et visitor_id
 * Remplace ou complète le système de tracking existant
 *
 * Usage:
 * useImprovedViewTracking({ cardId: '123', enabled: true });
 */
export const useImprovedViewTracking = ({
  cardId,
  enabled = true
}: UseImprovedViewTrackingParams) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || !cardId || hasTracked.current) {
      return;
    }

    const trackView = async () => {
      try {
        // Récupérer les informations du visiteur
        const userAgent = navigator.userAgent;
        const referrer = document.referrer;

        // Obtenir l'IP de manière asynchrone
        let ip: string | null = null;
        try {
          ip = await getVisitorIP();
        } catch (error) {
          // Warning log removed
        }

        // Générer un visitor_id anonyme pour identifier les visiteurs uniques
        const visitorId = await generateVisitorId(ip, userAgent);

        // Enregistrer la vue dans Supabase
        const { error } = await supabase
          .from('card_views')
          .insert({
            card_id: cardId,
            count: 1,
            viewed_at: new Date().toISOString(),
            viewer_ip: ip,
            visitor_id: visitorId,
            user_agent: userAgent,
            referrer: referrer || null
          });

        if (error) {
          // Error log removed
        } else {
          hasTracked.current = true;
        }
      } catch (error) {
        // Error log removed
      }
    };

    // Petit délai pour s'assurer que la page est chargée
    const timeoutId = setTimeout(trackView, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [cardId, enabled]);
};

/**
 * Hook pour mettre à jour une vue existante avec IP si elle manque
 * Utile pour migrer les anciennes vues sans IP
 */
export const useUpdateViewWithIP = () => {
  const updateView = async (viewId: string) => {
    try {
      const ip = await getVisitorIP();
      const userAgent = navigator.userAgent;
      const visitorId = await generateVisitorId(ip, userAgent);

      const { error } = await supabase
        .from('card_views')
        .update({
          viewer_ip: ip,
          visitor_id: visitorId
        })
        .eq('id', viewId)
        .is('viewer_ip', null); // Seulement si l'IP est manquante

      if (error) {
        // Error log removed
      }
    } catch (error) {
      // Error log removed
    }
  };

  return updateView;
};
