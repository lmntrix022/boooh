/**
 * Growth Insights Service - Singularity Design
 *
 * Transforms payment barriers into "Growth Insights".
 * Never say "Accès refusé"; say "Active ce module pour gérer les 15 leads captés par ta carte".
 */

import { supabase } from '@/integrations/supabase/client';

export type InsightFeature =
  | 'hasCRM'
  | 'hasEcommerce'
  | 'hasAppointments'
  | 'hasPortfolio'
  | 'hasInvoicing'
  | 'hasStockManagement';

export interface GrowthInsight {
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  metric?: string;
  count?: number;
}

const FEATURE_INSIGHT_MESSAGES: Record<
  InsightFeature,
  (count: number) => { title: string; description: string }
> = {
  hasCRM: (count) => ({
    title: 'Active ton CRM pour ne plus perdre un lead',
    description:
      count > 0
        ? `${count} contact${count > 1 ? 's' : ''} ont consulté ta carte. Gère-les avec un CRM intégré.`
        : 'Chaque visiteur de ta carte peut devenir un contact. Active le CRM pour les capturer.',
  }),
  hasEcommerce: (count) => ({
    title: 'Ouvre ta boutique sur ta carte',
    description:
      count > 0
        ? `${count} consultation${count > 1 ? 's' : ''} de ta carte. Propose des produits directement.`
        : 'Vends sans changer d’outil : ajoute une boutique à ta carte.',
  }),
  hasAppointments: (count) => ({
    title: 'Prends des RDV sans aller-retour',
    description:
      count > 0
        ? `Ta carte a été vue ${count} fois. Propose une prise de RDV en un clic.`
        : 'Laisse tes clients réserver un créneau depuis ta carte.',
  }),
  hasPortfolio: (count) => ({
    title: 'Montre tes réalisations et reçois des devis',
    description:
      count > 0
        ? `${count} vue${count > 1 ? 's' : ''} sur ta carte. Ajoute un portfolio et des demandes de devis.`
        : 'Portfolio + demandes de devis intégrés à ta carte.',
  }),
  hasInvoicing: () => ({
    title: 'Facture depuis ta carte',
    description: 'Génère des factures PDF et suivi des paiements au même endroit.',
  }),
  hasStockManagement: () => ({
    title: 'Gère ton stock en temps réel',
    description: 'Chaque vente met à jour ton stock. Plus de ventes de produits épuisés.',
  }),
};

/**
 * Fetch card-level metrics for growth insight (views, inquiries count).
 */
export async function getCardGrowthMetrics(cardId: string): Promise<{
  viewCount: number;
  inquiryCount: number;
  appointmentRequestCount: number;
}> {
  const [viewsRes, inquiriesRes, appointmentsRes] = await Promise.all([
    supabase
      .from('card_views')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId),
    supabase
      .from('product_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId)
      .in('status', ['pending', 'confirmed']),
  ]);

  return {
    viewCount: viewsRes.count ?? 0,
    inquiryCount: inquiriesRes.count ?? 0,
    appointmentRequestCount: appointmentsRes.count ?? 0,
  };
}

/**
 * Get a growth insight message for a given feature and optional card.
 * Prefer this over "Accès refusé" in the UI.
 */
export async function getGrowthInsight(
  feature: InsightFeature,
  cardId?: string | null
): Promise<GrowthInsight> {
  let count = 0;
  if (cardId) {
    const metrics = await getCardGrowthMetrics(cardId);
    if (feature === 'hasCRM') count = metrics.viewCount;
    if (feature === 'hasEcommerce') count = metrics.viewCount;
    if (feature === 'hasAppointments') count = metrics.appointmentRequestCount || metrics.viewCount;
    if (feature === 'hasPortfolio') count = metrics.viewCount;
  }

  const messages = FEATURE_INSIGHT_MESSAGES[feature](count);

  return {
    title: messages.title,
    description: messages.description,
    actionLabel: 'Voir les offres',
    actionUrl: '/pricing',
    count: count > 0 ? count : undefined,
  };
}

/**
 * Sync helper for components that already have metrics (avoid double fetch).
 */
export function getGrowthInsightSync(
  feature: InsightFeature,
  viewCount?: number,
  inquiryCount?: number
): GrowthInsight {
  const count = viewCount ?? inquiryCount ?? 0;
  const messages = FEATURE_INSIGHT_MESSAGES[feature](count);
  return {
    title: messages.title,
    description: messages.description,
    actionLabel: 'Voir les offres',
    actionUrl: '/pricing',
    count: count > 0 ? count : undefined,
  };
}
