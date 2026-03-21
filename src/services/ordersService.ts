import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { MobileMoneyService, CreateInvoiceData, generateOrderReference } from "./mobileMoneyService";

export interface OrderWithProduct {
  id: string;
  card_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  quantity: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  type: 'physical' | 'digital';
  product_name: string;
  product_id: string;
  digital_product_id?: string;
  products: { name: string; price: number | string } | null;
  /** ID de la facture liée (si créée depuis la commande) — utilisé pour considérer payé si la facture est payée */
  invoice_id?: string | null;
  // Nouveaux champs de paiement
  payment_method?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_reference?: string;
  billing_easy_bill_id?: string;
  billing_easy_transaction_id?: string;
  payment_phone_number?: string;
  payment_operator?: string;
  paid_at?: string;
}

export interface OrdersQueryParams {
  cardId: string;
  userId: string;
  limit?: number;
  offset?: number;
  status?: string;
  searchTerm?: string;
}

/**
 * Service optimisé pour récupérer les commandes avec performance maximale
 * Utilise des requêtes parallèles et une seule jointure
 */
export class OrdersService {
  /**
   * Récupère les commandes avec optimisation et cache
   */
  static async getOrders(params: OrdersQueryParams): Promise<OrderWithProduct[]> {
    const { cardId, userId, limit = 100, offset = 0, status, searchTerm } = params;

    // Vérification des permissions en parallèle avec le chargement des données
    const [cardCheck, physicalOrders, digitalOrders] = await Promise.all([
      // Vérifier l'accès à la carte (mise en cache côté Supabase)
      supabase
        .from("business_cards")
        .select("user_id")
        .eq("id", cardId)
        .single(),

      // Récupérer les commandes physiques avec JOIN optimisé
      this.getPhysicalOrders(cardId, { limit, offset, status, searchTerm }),

      // Récupérer les commandes digitales avec JOIN optimisé
      this.getDigitalOrders(cardId, { limit, offset, status, searchTerm })
    ]);

    // Vérifier les permissions
    if (cardCheck.error) {
      throw new Error("Carte introuvable");
    }

    if (cardCheck.data.user_id !== userId) {
      throw new Error("Accès non autorisé");
    }

    // Combiner et trier les commandes
    const allOrders = [
      ...physicalOrders,
      ...digitalOrders
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allOrders.slice(0, limit);
  }

  /**
   * Récupère les commandes physiques avec produits en une seule requête
   */
  private static async getPhysicalOrders(
    cardId: string,
    options: { limit?: number; offset?: number; status?: string; searchTerm?: string }
  ): Promise<OrderWithProduct[]> {
    let query = supabase
      .from("product_inquiries")
      .select(`
        id,
        card_id,
        client_name,
        client_email,
        client_phone,
        quantity,
        status,
        payment_status,
        invoice_id,
        created_at,
        updated_at,
        notes,
        product_id,
        products(id, name, price)
      `)
      .eq("card_id", cardId)
      .order("created_at", { ascending: false });

    // Filtres côté serveur
    if (options.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options.searchTerm) {
      query = query.or(`client_name.ilike.%${options.searchTerm}%,client_email.ilike.%${options.searchTerm}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      // Error log removed
      return [];
    }

    return (data || []).map(order => ({
      ...order,
      type: 'physical' as const,
      product_name: (order.products as any)?.name || 'Produit inconnu',
      products: (order.products as any) ? { 
        name: (order.products as any).name, 
        price: (order.products as any).price || 0 
      } : { name: 'Produit inconnu', price: 0 },
      updated_at: order.updated_at || order.created_at,
      notes: order.notes || null,
      product_id: order.product_id || ''
    }));
  }

  /**
   * Récupère les commandes digitales avec produits en une seule requête
   */
  private static async getDigitalOrders(
    cardId: string,
    options: { limit?: number; offset?: number; status?: string; searchTerm?: string }
  ): Promise<OrderWithProduct[]> {
    let query = supabase
      .from("digital_inquiries")
      .select(`
        id,
        card_id,
        client_name,
        client_email,
        client_phone,
        quantity,
        status,
        payment_status,
        invoice_id,
        created_at,
        updated_at,
        notes,
        digital_product_id,
        digital_products(id, title, price)
      `)
      .eq("card_id", cardId)
      .order("created_at", { ascending: false });

    // Filtres côté serveur
    if (options.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options.searchTerm) {
      query = query.or(`client_name.ilike.%${options.searchTerm}%,client_email.ilike.%${options.searchTerm}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      // Error log removed
      return [];
    }

    return (data || []).map(order => ({
      ...order,
      type: 'digital' as const,
      product_name: (order.digital_products as any)?.title || 'Produit inconnu',
      products: order.digital_products ? { 
        name: (order.digital_products as any).title, 
        price: (order.digital_products as any).price || 0 
      } : { name: 'Produit inconnu', price: 0 },
      updated_at: order.updated_at || order.created_at,
      notes: order.notes || null,
      product_id: order.digital_product_id || '' // Les commandes digitales utilisent digital_product_id
    }));
  }

  /**
   * Récupère les statistiques des commandes de manière optimisée
   * Utilise les fonctions d'agrégation côté serveur
   */
  static async getOrderStats(cardId: string, userId: string) {
    // Vérifier les permissions
    const { data: cardData, error: cardError } = await supabase
      .from("business_cards")
      .select("user_id")
      .eq("id", cardId)
      .single();

    if (cardError || cardData.user_id !== userId) {
      throw new Error("Accès non autorisé");
    }

    // Requêtes parallèles pour les stats
    const [physicalStats, digitalStats] = await Promise.all([
      supabase
        .from("product_inquiries")
        .select("status", { count: "exact", head: false })
        .eq("card_id", cardId),

      supabase
        .from("digital_inquiries")
        .select("status", { count: "exact", head: false })
        .eq("card_id", cardId)
    ]);

    const allOrders = [
      ...(physicalStats.data || []),
      ...(digitalStats.data || [])
    ];

    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === "pending").length,
      processing: allOrders.filter(o => o.status === "processing").length,
      completed: allOrders.filter(o => o.status === "completed").length,
    };
  }

  /**
   * Met à jour le statut d'une commande
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    type: 'physical' | 'digital'
  ): Promise<void> {
    const tableName = type === 'physical' ? 'product_inquiries' : 'digital_inquiries';

    const { error } = await supabase
      .from(tableName)
      .update({ status })
      .eq("id", orderId);

    if (error) {
      throw error;
    }
  }

  /**
   * Supprime des commandes
   */
  static async deleteOrders(orders: { id: string; type: 'physical' | 'digital' }[]): Promise<void> {
    const physicalOrderIds = orders.filter(o => o.type === 'physical').map(o => o.id);
    const digitalOrderIds = orders.filter(o => o.type === 'digital').map(o => o.id);

    const promises = [];

    if (physicalOrderIds.length > 0) {
      promises.push(
        supabase
          .from("product_inquiries")
          .delete()
          .in("id", physicalOrderIds)
      );
    }

    if (digitalOrderIds.length > 0) {
      promises.push(
        supabase
          .from("digital_inquiries")
          .delete()
          .in("id", digitalOrderIds)
      );
    }

    const results = await Promise.all(promises);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error("Erreur lors de la suppression");
    }
  }

  /**
   * Initier un paiement Mobile Money pour une commande
   * Crée une facture BillingEasy et retourne l'URL de paiement
   */
  static async initiateMobileMoneyPayment(
    orderId: string,
    orderType: 'physical' | 'digital',
    options: {
      amount: number;
      phone_number: string;
      operator?: 'MTN_BJ' | 'MOOV_BJ' | 'ORANGE_CI' | 'MTN_CI' | 'FLOOZ_BJ' | 'ORABANK_NG';
    }
  ): Promise<{
    success: boolean;
    bill_id?: string;
    payment_url?: string;
    reference?: string;
    error?: string;
  }> {
    try {
      // 1. Récupérer les informations de la commande
      const tableName = orderType === 'physical' ? 'product_inquiries' : 'digital_inquiries';
      const { data: order, error: orderError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande introuvable');
      }

      // 2. Générer une référence unique
      const reference = generateOrderReference(orderId, orderType);

      // 3. Préparer les données pour BillingEasy
      const invoiceData: CreateInvoiceData = {
        amount: options.amount,
        payer_name: order.client_name,
        payer_email: order.client_email,
        payer_msisdn: options.phone_number,
        short_description: `Paiement commande ${reference}`,
        external_reference: reference,
        expiry_period: '60', // 60 minutes
      };

      // 4. Initier le paiement via BillingEasy (crée facture + génère URL)
      const paymentResult = await (MobileMoneyService as any).initiateMobileMoneyPayment(
        invoiceData,
        options.operator
      );

      // 5. Mettre à jour la commande avec les informations de paiement
      const updateData = {
        payment_method: 'mobile_money',
        payment_status: 'pending', // En attente du paiement
        payment_amount: options.amount,
        payment_reference: reference,
        billing_easy_bill_id: paymentResult.bill_id,
        payment_phone_number: options.phone_number,
        payment_operator: options.operator || null,
      };

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        // Error log removed
        throw new Error('Impossible de mettre à jour la commande');
      }

      return {
        success: true,
        bill_id: paymentResult.bill_id,
        payment_url: paymentResult.payment_url,
        reference: paymentResult.reference,
      };
    } catch (error) {
      // Error log removed
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement et mettre à jour la commande
   */
  static async checkPaymentStatus(
    orderId: string,
    orderType: 'physical' | 'digital'
  ): Promise<{
    status: string;
    paid_at?: string;
  }> {
    const tableName = orderType === 'physical' ? 'product_inquiries' : 'digital_inquiries';

    // Récupérer le bill_id de la commande
    const { data: order, error: orderError } = await supabase
      .from(tableName)
      .select('billing_easy_bill_id, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order || !order.billing_easy_bill_id) {
      throw new Error('Commande ou bill_id introuvable');
    }

    // Vérifier le statut auprès de BillingEasy
    const paymentStatus = await MobileMoneyService.checkPaymentStatus(order.billing_easy_bill_id);

    // Mettre à jour la commande si le statut a changé
    if (paymentStatus.status === 'SUCCESS' && order.payment_status !== 'completed') {
      await supabase
        .from(tableName)
        .update({
          payment_status: 'completed',
          status: 'processing', // La commande passe à "en traitement"
          paid_at: paymentStatus.paid_at || new Date().toISOString(),
        })
        .eq('id', orderId);
    } else if (paymentStatus.status === 'FAILED' && order.payment_status !== 'failed') {
      await supabase
        .from(tableName)
        .update({
          payment_status: 'failed',
        })
        .eq('id', orderId);
    }

    return {
      status: paymentStatus.status,
      paid_at: paymentStatus.paid_at,
    };
  }

  /**
   * Callback handler pour les notifications de paiement BillingEasy
   * À appeler depuis la page /payment/callback après redirection
   */
  static async handlePaymentCallback(callbackData: {
    bill_id: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    reference?: string;
    amount?: string;
    paid_at?: string;
  }): Promise<void> {
    // Trouver la commande correspondante dans les deux tables
    const [physicalOrder, digitalOrder] = await Promise.all([
      supabase
        .from('product_inquiries')
        .select('id, payment_status')
        .eq('billing_easy_bill_id', callbackData.bill_id)
        .single(),
      supabase
        .from('digital_inquiries')
        .select('id, payment_status')
        .eq('billing_easy_bill_id', callbackData.bill_id)
        .single(),
    ]);

    let orderId: string | null = null;
    let orderType: 'physical' | 'digital' | null = null;

    if (physicalOrder.data) {
      orderId = physicalOrder.data.id;
      orderType = 'physical';
    } else if (digitalOrder.data) {
      orderId = digitalOrder.data.id;
      orderType = 'digital';
    }

    if (!orderId || !orderType) {
      // Error log removed
      return;
    }

    // Mettre à jour le statut de paiement
    const tableName = orderType === 'physical' ? 'product_inquiries' : 'digital_inquiries';

    const updateData: any = {
      payment_status: callbackData.status === 'SUCCESS' ? 'completed' : callbackData.status === 'FAILED' ? 'failed' : 'pending',
    };

    if (callbackData.status === 'SUCCESS') {
      updateData.paid_at = callbackData.paid_at || new Date().toISOString();
      updateData.status = 'processing'; // La commande passe automatiquement en traitement
    } else if (callbackData.status === 'FAILED') {
      updateData.status = 'cancelled';
    }

    await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', orderId);

    // Log removed
  }

  /**
   * Récupérer les statistiques de paiement pour un utilisateur
   */
  static async getPaymentStats(userId: string): Promise<{
    total_payments: number;
    completed_payments: number;
    pending_payments: number;
    failed_payments: number;
    total_revenue: number;
    mobile_money_revenue: number;
  }> {
    // Récupérer toutes les cartes de l'utilisateur
    const { data: cards } = await supabase
      .from('business_cards')
      .select('id')
      .eq('user_id', userId);

    if (!cards || cards.length === 0) {
      return {
        total_payments: 0,
        completed_payments: 0,
        pending_payments: 0,
        failed_payments: 0,
        total_revenue: 0,
        mobile_money_revenue: 0,
      };
    }

    const cardIds = cards.map(c => c.id);

    // Récupérer les statistiques en parallèle
    const [physicalPayments, digitalPayments] = await Promise.all([
      supabase
        .from('product_inquiries')
        .select('payment_status, payment_amount, payment_method')
        .in('card_id', cardIds)
        .not('payment_method', 'is', null),
      supabase
        .from('digital_inquiries')
        .select('payment_status, payment_amount, payment_method')
        .in('card_id', cardIds)
        .not('payment_method', 'is', null),
    ]);

    const allPayments = [
      ...(physicalPayments.data || []),
      ...(digitalPayments.data || []),
    ];

    return {
      total_payments: allPayments.length,
      completed_payments: allPayments.filter(p => p.payment_status === 'completed').length,
      pending_payments: allPayments.filter(p => p.payment_status === 'pending' || p.payment_status === 'processing').length,
      failed_payments: allPayments.filter(p => p.payment_status === 'failed').length,
      total_revenue: allPayments
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + (p.payment_amount || 0), 0),
      mobile_money_revenue: allPayments
        .filter(p => p.payment_status === 'completed' && p.payment_method === 'mobile_money')
        .reduce((sum, p) => sum + (p.payment_amount || 0), 0),
    };
  }
}
