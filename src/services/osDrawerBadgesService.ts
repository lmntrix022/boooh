/**
 * OSDrawer Badges - Rules engine for operational dashboard counters
 * Chaque compteur = appel à l'action (pas une simple donnée).
 */

import { supabase } from '@/integrations/supabase/client';
import { StockService } from '@/services/stockService';

export type OSModuleKey = 'crm' | 'commerce' | 'stock' | 'appointments' | 'portfolio';

export interface BadgeInfo {
  count: number;
  label: string;
  color: 'orange' | 'blue' | 'green' | 'violet';
  tooltip: string;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/** Paramètres pour le calcul des badges (par carte quand cardId fourni). */
export interface GetOSDrawerBadgesParams {
  userId: string;
  /** Si fourni, les compteurs Commandes, RDV, Devis sont calculés pour cette carte uniquement. */
  cardId?: string | null;
}

/**
 * Contacts : nouveaux leads (via carte) non encore consultés.
 * Scope: user (scanned_contacts n'a pas de card_id).
 */
async function getContactsCount(userId: string): Promise<number> {
  const since = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();
  const { count, error } = await supabase
    .from('scanned_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('source_type', ['lead', 'scanner'])
    .gte('created_at', since);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Commandes : pending ou processing (à préparer/expédier).
 * Scope: par carte si cardId fourni.
 */
async function getOrdersCount(userId: string, cardId?: string | null): Promise<number> {
  const cardIds = cardId ? [cardId] : await getCardIdsForUser(userId);
  if (!cardIds.length) return 0;
  const [p, d] = await Promise.all([
    supabase.from('product_inquiries').select('id', { count: 'exact', head: true }).in('card_id', cardIds).in('status', ['pending', 'processing']),
    supabase.from('digital_inquiries').select('id', { count: 'exact', head: true }).in('card_id', cardIds).in('status', ['pending', 'processing']),
  ]);
  return (p.count ?? 0) + (d.count ?? 0);
}

async function getCardIdsForUser(userId: string): Promise<string[]> {
  const { data: cards } = await supabase.from('business_cards').select('id').eq('user_id', userId);
  return cards?.map((c) => c.id) ?? [];
}

/**
 * Stock : produits en rupture imminente (current_stock <= min_stock).
 * Scope: user (stock_items est user-scoped).
 */
async function getStockCount(userId: string): Promise<number> {
  try {
    const stats = await StockService.getStockStats(userId);
    return (stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Rendez-vous : demandes en attente de confirmation (status = pending).
 * Scope: par carte si cardId fourni.
 */
async function getAppointmentsCount(userId: string, cardId?: string | null): Promise<number> {
  const cardIds = cardId ? [cardId] : await getCardIdsForUser(userId);
  if (!cardIds.length) return 0;
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .in('card_id', cardIds)
    .eq('status', 'pending');
  if (error) return 0;
  return count ?? 0;
}

/**
 * Devis : expirés (valid_until < today) ou à relancer (quoted depuis > 48h).
 * Scope: par carte si cardId fourni.
 */
async function getQuotesCount(userId: string, cardId?: string | null): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const fortyEightHoursAgo = new Date(Date.now() - FORTY_EIGHT_HOURS_MS).toISOString();
  let query = supabase
    .from('service_quotes')
    .select('id, status, valid_until, updated_at')
    .eq('user_id', userId);
  if (cardId) query = query.eq('card_id', cardId);
  const { data: quotes, error } = await query;
  if (error || !quotes?.length) return 0;
  return quotes.filter((q) => {
    const validUntil = (q as { valid_until?: string | null }).valid_until;
    const updatedAt = (q as { updated_at?: string | null }).updated_at;
    if (validUntil && validUntil < today) return true;
    if (q.status === 'quoted' && updatedAt && updatedAt < fortyEightHoursAgo) return true;
    return false;
  }).length;
}

/**
 * Récupère tous les compteurs en parallèle (par carte si cardId fourni).
 */
export async function getOSDrawerBadges(params: GetOSDrawerBadgesParams | string): Promise<Record<OSModuleKey, BadgeInfo>> {
  const { userId, cardId } = typeof params === 'string' ? { userId: params, cardId: null as string | null } : params;
  const [contacts, orders, stock, appointments, quotes] = await Promise.all([
    getContactsCount(userId),
    getOrdersCount(userId, cardId),
    getStockCount(userId),
    getAppointmentsCount(userId, cardId),
    getQuotesCount(userId, cardId),
  ]);

  return {
    crm: {
      count: contacts,
      label: String(contacts),
      color: 'blue',
      tooltip: contacts === 0 ? '' : `Vous avez ${contacts} nouveau${contacts > 1 ? 'x' : ''} prospect${contacts > 1 ? 's' : ''} à enregistrer`,
    },
    commerce: {
      count: orders,
      label: String(orders),
      color: 'orange',
      tooltip: orders === 0 ? '' : `Vous avez ${orders} vente${orders > 1 ? 's' : ''} à préparer ou expédier`,
    },
    stock: {
      count: stock,
      label: String(stock),
      color: 'orange',
      tooltip: stock === 0 ? '' : `${stock} produit${stock > 1 ? 's' : ''} en rupture imminente`,
    },
    appointments: {
      count: appointments,
      label: String(appointments),
      color: 'violet',
      tooltip: appointments === 0 ? '' : `${appointments} créneau${appointments > 1 ? 'x' : ''} à confirmer`,
    },
    portfolio: {
      count: quotes,
      label: String(quotes),
      color: 'green',
      tooltip: quotes === 0 ? '' : `${quotes} opportunité${quotes > 1 ? 's' : ''} à relancer`,
    },
  };
}
