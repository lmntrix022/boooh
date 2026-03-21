/**
 * useOSDrawerBadges - Données badges OSDrawer (compteurs + couleurs + tooltips)
 * Gère la priorisation et le mode "ghost" (module désactivé par le plan).
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAdaptedPlan } from '@/hooks/useAdaptedPlan';
import { getOSDrawerBadges, type OSModuleKey, type BadgeInfo } from '@/services/osDrawerBadgesService';
import type { PlanFeatures } from '@/types/subscription';

const FEATURE_BY_MODULE: Record<OSModuleKey, keyof PlanFeatures> = {
  crm: 'hasCRM',
  commerce: 'hasEcommerce',
  stock: 'hasStockManagement',
  appointments: 'hasAppointments',
  portfolio: 'hasPortfolio',
};

export type BadgeState = 
  | { type: 'visible'; count: number; label: string; color: BadgeInfo['color']; tooltip: string }
  | { type: 'ghost'; tooltip: string };

/**
 * @param cardId - Carte affichée : les compteurs Commandes, RDV, Devis sont calculés pour cette carte. Sans cardId, agrégat sur toutes les cartes du user.
 */
export function useOSDrawerBadges(cardId?: string | null): Record<OSModuleKey, BadgeState> {
  const { user } = useAuth();
  const { hasFeature } = useAdaptedPlan();
  const { data: badges, isLoading } = useQuery({
    queryKey: ['os-drawer-badges', user?.id, cardId ?? null],
    queryFn: () => getOSDrawerBadges({ userId: user!.id, cardId: cardId ?? undefined }),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const result: Record<OSModuleKey, BadgeState> = {
    crm: { type: 'ghost', tooltip: '' },
    commerce: { type: 'ghost', tooltip: '' },
    stock: { type: 'ghost', tooltip: '' },
    appointments: { type: 'ghost', tooltip: '' },
    portfolio: { type: 'ghost', tooltip: '' },
  };

  if (isLoading || !badges) return result;

  (Object.keys(FEATURE_BY_MODULE) as OSModuleKey[]).forEach((key) => {
    const enabled = hasFeature(FEATURE_BY_MODULE[key]);
    const info = badges[key];
    if (!enabled) {
      result[key] = { type: 'ghost', tooltip: 'Module non inclus dans votre offre' };
      return;
    }
    if (info.count === 0) {
      result[key] = { type: 'visible', count: 0, label: '', color: info.color, tooltip: '' };
      return;
    }
    result[key] = {
      type: 'visible',
      count: info.count,
      label: info.label,
      color: info.color,
      tooltip: info.tooltip,
    };
  });

  return result;
}
