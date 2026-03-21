import { useCallback } from 'react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateVisitorId, getVisitorIP } from '@/services/analyticsService';

export type LinkType = 'phone' | 'email' | 'social' | 'website' | 'vcard' | 'appointment' | 'marketplace' | 'other';

interface TrackClickParams {
  cardId: string;
  linkType: LinkType;
  linkLabel: string;
  linkUrl?: string;
}

/**
 * Hook pour tracker les clics sur les liens de la carte de visite
 * Utilisation: const trackClick = useClickTracking();
 */
export const useClickTracking = () => {
  const trackClick = useCallback(async ({
    cardId,
    linkType,
    linkLabel,
    linkUrl
  }: TrackClickParams) => {
    try {
      // Récupérer les informations du visiteur
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;

      // Obtenir l'IP (asynchrone, ne bloque pas l'action)
      // Note: Peut échouer si bloqué par AdBlock, mais ce n'est pas bloquant
      let ip: string | null = null;
      try {
        ip = await Promise.race([
          getVisitorIP(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
        ]);
      } catch (error) {
        // Erreur silencieuse - le tracking continue sans IP
      }

      // Générer un visitor_id anonyme
      const visitorId = await generateVisitorId(ip, userAgent);

      // Enregistrer le clic dans Supabase
      const { error } = await supabase
        .from('card_clicks')
        .insert({
          card_id: cardId,
          link_type: linkType,
          link_label: linkLabel,
          link_url: linkUrl || null,
          visitor_id: visitorId,
          viewer_ip: ip,
          user_agent: userAgent,
          referrer: referrer || null,
          clicked_at: new Date().toISOString()
        });

      if (error) {
        console.error('[ClickTracking] Erreur lors de l\'enregistrement du clic:', error);
      } else {
        console.log('[ClickTracking] Clic enregistré avec succès:', { cardId, linkType, linkLabel });
      }
    } catch (error) {
      // Échec silencieux pour ne pas perturber l'expérience utilisateur
      console.error('[ClickTracking] Exception lors du tracking:', error);
    }
  }, []);

  return trackClick;
};

/**
 * Hook pour wrapper un lien avec tracking automatique
 * Utilisation:
 *   const handleClick = useTrackedLink({ cardId, linkType: 'phone', linkLabel: 'WhatsApp' });
 *   <a href="tel:+123" onClick={handleClick}>Appeler</a>
 */
export const useTrackedLink = (params: TrackClickParams) => {
  const trackClick = useClickTracking();

  return useCallback(async (e?: React.MouseEvent) => {
    // Ne pas empêcher l'action par défaut, juste tracker avant
    await trackClick(params);
  }, [trackClick, params]);
};

/**
 * Helper pour créer un composant de lien tracké
 * Usage: const TrackedLink = createTrackedLink(Link, { cardId, linkType: 'phone', linkLabel: 'WhatsApp' });
 * Note: This function is currently unused and commented out due to JSX requirements in .ts files
 */
// export const createTrackedLink = (
//   Component: React.ComponentType<any>,
//   trackingParams: Omit<TrackClickParams, 'linkUrl'>
// ) => {
//   return (props: any) => {
//     const handleClick = useTrackedLink({
//       ...trackingParams,
//       linkUrl: props.href || props.to
//     });
//
//     return React.createElement(Component, {
//       ...props,
//       onClick: (e: React.MouseEvent) => {
//         handleClick(e);
//         props.onClick?.(e);
//       }
//     });
//   };
// };
