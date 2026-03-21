import { supabase } from '@/integrations/supabase/client';
import { ScannedContact } from './scannedContactsService';

export interface ContactActivity {
  id: string;
  type: 'appointment' | 'quote' | 'order_physical' | 'order_digital' | 'purchase_digital' | 'invoice';
  title: string;
  description: string;
  amount?: number;
  status: string;
  date: string;
  metadata?: any;
}

export interface ContactRelations {
  appointments: any[];
  quotes: any[];
  physicalOrders: any[];
  digitalOrders: any[];
  digitalPurchases: any[];
  invoices: any[];
}

export interface ContactStats {
  totalRevenue: number;
  totalOrders: number;
  totalAppointments: number;
  totalQuotes: number;
  conversionRate: number;
  averageOrderValue: number;
  lastActivity: string;
  leadScore: number;
}

export interface ContactTimeline {
  activities: ContactActivity[];
  totalCount: number;
}

export class CRMService {
  /**
   * Récupère toutes les relations d'un contact avec pagination optionnelle
   */
  static async getContactRelations(
    userId: string,
    contactEmail: string,
    options?: {
      limit?: number;
      offset?: number;
      perTypeLimit?: number; // Limite par type de relation
    }
  ): Promise<ContactRelations> {
    try {
      const { limit, offset = 0, perTypeLimit = 50 } = options || {};
      
      // Helper function to apply pagination
      const applyPagination = (query: any) => {
        if (perTypeLimit) {
          return query.range(offset, offset + perTypeLimit - 1);
        }
        return query;
      };

      // Récupérer toutes les données en parallèle
      const [
        appointmentsData,
        quotesData,
        physicalOrdersData,
        digitalOrdersData,
        digitalPurchasesData,
        invoicesData
      ] = await Promise.all([
        // Rendez-vous
        applyPagination(
        supabase
          .from('appointments')
            .select('*', { count: perTypeLimit ? undefined : 'exact' })
          .eq('client_email', contactEmail)
            .order('date', { ascending: false })
        ),
        
        // Devis
        applyPagination(
        supabase
          .from('service_quotes')
            .select('*', { count: perTypeLimit ? undefined : 'exact' })
          .eq('client_email', contactEmail)
            .order('created_at', { ascending: false })
        ),
        
        // Commandes physiques
        applyPagination(
        supabase
          .from('product_inquiries')
          .select(`
            *,
            products (
              id,
              name,
              price,
              currency,
              image_url
            )
            `, { count: perTypeLimit ? undefined : 'exact' })
          .eq('client_email', contactEmail)
            .order('created_at', { ascending: false })
        ),
        
        // Commandes digitales
        applyPagination(
        supabase
          .from('digital_inquiries')
          .select(`
            *,
            digital_products (
              id,
              title,
              price,
              currency,
              thumbnail_url
            )
            `, { count: perTypeLimit ? undefined : 'exact' })
          .eq('client_email', contactEmail)
            .order('created_at', { ascending: false })
        ),
        
        // Achats digitaux (digital_purchases)
        applyPagination(
        supabase
          .from('digital_purchases')
          .select(`
            *,
            digital_products (
              id,
              title,
              price,
              currency,
              thumbnail_url
            )
            `, { count: perTypeLimit ? undefined : 'exact' })
          .eq('buyer_email', contactEmail)
            .order('created_at', { ascending: false })
        ),
        
        // Factures
        applyPagination(
        supabase
          .from('invoices')
            .select('*', { count: perTypeLimit ? undefined : 'exact' })
          .eq('client_email', contactEmail)
          .order('created_at', { ascending: false })
        )
      ]);

      return {
        appointments: appointmentsData.data || [],
        quotes: quotesData.data || [],
        physicalOrders: physicalOrdersData.data || [],
        digitalOrders: digitalOrdersData.data || [],
        digitalPurchases: digitalPurchasesData.data || [],
        invoices: invoicesData.data || []
      };
    } catch (error) {
      console.error('Error fetching contact relations:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques d'un contact
   */
  static calculateContactStats(
    relations: ContactRelations
  ): ContactStats {
    // Calculer le CA total
    const physicalRevenue = relations.physicalOrders
      .filter(o => o.status === 'confirmed' || o.status === 'completed')
      .reduce((sum, o) => {
        const product = o.products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0);

    const digitalRevenue = relations.digitalOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const product = o.digital_products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0);

    const purchaseRevenue = relations.digitalPurchases
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const invoiceRevenue = relations.invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_ttc || 0), 0);

    const totalRevenue = physicalRevenue + digitalRevenue + purchaseRevenue + invoiceRevenue;

    // Compter les commandes
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;

    // Taux de conversion (devis → commande)
    const quotesCount = relations.quotes.length;
    const convertedQuotes = relations.quotes.filter(
      q => q.status === 'accepted' || q.converted_to_invoice_id
    ).length;
    const conversionRate = quotesCount > 0 ? (convertedQuotes / quotesCount) * 100 : 0;

    // Valeur moyenne commande
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Dernière activité
    const allDates = [
      ...relations.appointments.map(a => a.date),
      ...relations.quotes.map(q => q.created_at),
      ...relations.physicalOrders.map(o => o.created_at),
      ...relations.digitalOrders.map(o => o.created_at),
      ...relations.digitalPurchases.map(p => p.created_at),
      ...relations.invoices.map(i => i.created_at)
    ].filter(Boolean).sort().reverse();

    const lastActivity = allDates[0] || '';

    // Lead Score (0-100)
    const leadScore = this.calculateLeadScore(relations, {
      totalRevenue,
      totalOrders,
      conversionRate
    });

    return {
      totalRevenue,
      totalOrders,
      totalAppointments: relations.appointments.length,
      totalQuotes: relations.quotes.length,
      conversionRate,
      averageOrderValue,
      lastActivity,
      leadScore
    };
  }

  /**
   * Calcule le score de lead (0-100)
   */
  private static calculateLeadScore(
    relations: ContactRelations,
    stats: { totalRevenue: number; totalOrders: number; conversionRate: number }
  ): number {
    let score = 0;

    // Activité récente (+30 points)
    const hasRecentActivity = relations.appointments.some(
      a => new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ) || relations.quotes.some(
      q => new Date(q.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (hasRecentActivity) score += 30;

    // Commandes (+25 points)
    if (stats.totalOrders > 0) score += 15;
    if (stats.totalOrders > 3) score += 10;

    // CA généré (+20 points)
    if (stats.totalRevenue > 50000) score += 10;
    if (stats.totalRevenue > 200000) score += 10;

    // Devis actifs (+15 points)
    const activeQuotes = relations.quotes.filter(
      q => q.status === 'new' || q.status === 'in_progress' || q.status === 'quoted'
    );
    if (activeQuotes.length > 0) score += 15;

    // Taux de conversion (+10 points)
    if (stats.conversionRate > 50) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Génère la timeline d'activités
   */
  static generateTimeline(relations: ContactRelations): ContactTimeline {
    const activities: ContactActivity[] = [];

    // Rendez-vous
    relations.appointments.forEach(apt => {
      activities.push({
        id: apt.id,
        type: 'appointment',
        title: 'Rendez-vous',
        description: apt.notes || 'Rendez-vous planifié',
        status: apt.status || 'pending',
        date: apt.date,
        metadata: apt
      });
    });

    // Devis
    relations.quotes.forEach(quote => {
      activities.push({
        id: quote.id,
        type: 'quote',
        title: 'Demande de devis',
        description: quote.service_requested,
        amount: quote.quote_amount,
        status: quote.status || 'new',
        date: quote.created_at,
        metadata: quote
      });
    });

    // Commandes physiques
    relations.physicalOrders.forEach(order => {
      const product = order.products as any;
      activities.push({
        id: order.id,
        type: 'order_physical',
        title: `Commande: ${product?.name || 'Produit'}`,
        description: `Quantité: ${order.quantity}`,
        amount: (product?.price || 0) * (order.quantity || 1),
        status: order.status || 'pending',
        date: order.created_at,
        metadata: order
      });
    });

    // Commandes digitales
    relations.digitalOrders.forEach(order => {
      const product = order.digital_products as any;
      activities.push({
        id: order.id,
        type: 'order_digital',
        title: `Produit digital: ${product?.title || 'Produit'}`,
        description: `Quantité: ${order.quantity}`,
        amount: (product?.price || 0) * (order.quantity || 1),
        status: order.status || 'pending',
        date: order.created_at,
        metadata: order
      });
    });

    // Achats digitaux
    relations.digitalPurchases.forEach(purchase => {
      const product = purchase.digital_products as any;
      activities.push({
        id: purchase.id,
        type: 'purchase_digital',
        title: `Achat: ${product?.title || 'Produit digital'}`,
        description: `Téléchargements: ${purchase.download_count || 0}/${purchase.max_downloads || 1}`,
        amount: purchase.amount,
        status: purchase.payment_status || 'completed',
        date: purchase.created_at,
        metadata: purchase
      });
    });

    // Factures
    relations.invoices.forEach(invoice => {
      activities.push({
        id: invoice.id,
        type: 'invoice',
        title: `Facture ${invoice.invoice_number}`,
        description: `${invoice.items?.length || 0} article(s)`,
        amount: invoice.total_ttc,
        status: invoice.status || 'draft',
        date: invoice.created_at,
        metadata: invoice
      });
    });

    // Trier par date décroissante
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      activities,
      totalCount: activities.length
    };
  }

  /**
   * Récupère les données CRM complètes d'un contact
   */
  static async getContactCRM(
    userId: string,
    contactEmail: string
  ): Promise<{
    relations: ContactRelations;
    stats: ContactStats;
    timeline: ContactTimeline;
  }> {
    const relations = await this.getContactRelations(userId, contactEmail);
    const stats = this.calculateContactStats(relations);
    const timeline = this.generateTimeline(relations);

    return { relations, stats, timeline };
  }

  /**
   * Suggestions d'actions pour un contact
   */
  static getActionSuggestions(
    contact: ScannedContact,
    relations: ContactRelations,
    stats: ContactStats
  ): Array<{ 
    type: string; 
    title: string; 
    description: string; 
    priority: 'high' | 'medium' | 'low' 
  }> {
    const suggestions = [];

    // Devis non suivis
    const pendingQuotes = relations.quotes.filter(
      q => q.status === 'quoted' && 
      new Date(q.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (pendingQuotes.length > 0) {
      suggestions.push({
        type: 'follow_up_quote',
        title: 'Relancer devis',
        description: `${pendingQuotes.length} devis sans réponse depuis 7 jours`,
        priority: 'high' as const
      });
    }

    // Client inactif
    const daysSinceLastActivity = stats.lastActivity 
      ? Math.floor((Date.now() - new Date(stats.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
      : 999;
    
    if (daysSinceLastActivity > 30 && stats.totalOrders > 0) {
      suggestions.push({
        type: 'reactivate',
        title: 'Réactiver client',
        description: `Aucune activité depuis ${daysSinceLastActivity} jours`,
        priority: 'medium' as const
      });
    }

    // Lead chaud sans commande
    if (stats.leadScore > 70 && stats.totalOrders === 0) {
      suggestions.push({
        type: 'convert_lead',
        title: 'Convertir le lead',
        description: 'Lead très engagé sans commande',
        priority: 'high' as const
      });
    }

    // Upsell (client ayant commandé)
    if (stats.totalOrders > 2 && stats.averageOrderValue > 10000) {
      suggestions.push({
        type: 'upsell',
        title: 'Opportunité upsell',
        description: `Client régulier (${stats.totalOrders} commandes)`,
        priority: 'medium' as const
      });
    }

    // Facture impayée
    const unpaidInvoices = relations.invoices.filter(
      i => i.status === 'sent' && 
      i.due_date &&
      new Date(i.due_date) < new Date()
    );
    if (unpaidInvoices.length > 0) {
      suggestions.push({
        type: 'invoice_reminder',
        title: 'Relancer facture',
        description: `${unpaidInvoices.length} facture(s) impayée(s)`,
        priority: 'high' as const
      });
    }

    return suggestions;
  }
}

