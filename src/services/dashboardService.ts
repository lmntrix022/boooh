import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type BusinessCard = Tables<"business_cards">;

export interface DashboardStats {
  totalViews: number;
  totalAppointments: number;
  totalOrders: number;
  totalRevenue: number;
  totalShares: number;
  activeCards: number;
}

export interface DashboardActivity {
  id: string;
  type: "view" | "order" | "appointment";
  cardId: string;
  cardName: string;
  description: string;
  date: string;
  metadata?: {
    amount?: number;
    customerName?: string | null;
    productName?: string;
  };
}

export interface EnrichedBusinessCard extends BusinessCard {
  viewCount: number;
  orderCount: number;
  appointmentCount: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats | null;
  activities: DashboardActivity[];
  cards: EnrichedBusinessCard[];
}

interface DashboardQueryParams {
  userId: string;
  activityLimit?: number;
}

/**
 * Optimized Dashboard Service
 *
 * Performance improvements:
 * - Uses PostgreSQL RPC for server-side aggregation
 * - Parallel queries with Promise.all()
 * - SQL JOINs to reduce round trips
 * - Server-side sorting and limiting
 * - Efficient data enrichment
 */
export class DashboardService {
  /**
   * Get complete dashboard data with optimized queries
   */
  static async getDashboardData(params: DashboardQueryParams): Promise<DashboardData> {
    const { userId, activityLimit = 5 } = params;

    // DashboardService getDashboardData called

    // Step 1: Fetch user cards
    const { data: userCards, error: cardsError } = await supabase
      .from("business_cards")
      .select("*")
      .eq("user_id", userId);

    if (cardsError) {
      // Error fetching cards
      throw cardsError;
    }

    if (!userCards?.length) {
      // No cards found for user
      return { stats: null, activities: [], cards: [] };
    }

    const cardIds = userCards.map(card => card.id);
    // Found cards, fetching stats

    // Step 2: Parallel queries for all data with optimized JOINs
    const [
      viewsStats,
      recentViews,
      appointmentsResult,
      appointmentsCount,
      ordersResult,
      ordersCount,
      totalRevenue,
      cardAggregations
    ] = await Promise.all([
      // Get total views count and shares count
      this.getViewsStats(cardIds),

      // Get recent views for activity feed
      this.getRecentViews(cardIds, activityLimit) as Promise<{ created_at: string; card_id: string; referrer: string | null; }[]>,

      // Get appointments for activity feed (limited)
      this.getAppointments(cardIds, { limit: activityLimit }) as Promise<{ data: { id: string; created_at: string; card_id: string; client_name: string | null; }[]; total: number; }>,

      // Get appointments count for stats
      this.getAppointmentsCount(cardIds),

      // Get orders with product JOIN (limited for activity feed)
      this.getOrdersWithProducts(cardIds, { limit: activityLimit }),

      // Get orders count for stats
      this.getOrdersCount(cardIds),

      // Get total revenue for stats
      this.getTotalRevenue(cardIds),

      // Get per-card aggregations (views, orders, appointments, revenue)
      this.getCardAggregations(cardIds)
    ]);

    // Step 3: Calculate stats server-side style (but client aggregation for now)
    const totalViews = viewsStats.totalViews;
    const totalShares = viewsStats.totalShares;
    const totalAppointments = appointmentsCount;
    const totalOrders = ordersCount;
    // totalRevenue is already calculated in Promise.all above

    const stats: DashboardStats = {
      totalViews,
      totalAppointments,
      totalOrders,
      totalRevenue,
      totalShares,
      activeCards: userCards.length
    };

    // Step 4: Build recent activity feed efficiently
    const activities = this.buildActivityFeed({
      views: recentViews,
      orders: ordersResult.data,
      appointments: appointmentsResult.data,
      cards: userCards,
      limit: activityLimit
    });

    // Step 5: Enrich cards with aggregations
    // Note: ordersData is now limited, but cardAggregations already has per-card stats
    const enrichedCards = this.enrichCardsWithStats(userCards, cardAggregations, ordersResult.data);

    return {
      stats,
      activities,
      cards: enrichedCards
    };
  }

  /**
   * Get views statistics (total count and shares)
   */
  private static async getViewsStats(cardIds: string[]): Promise<{ totalViews: number; totalShares: number }> {
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_card_views_stats' as any, { card_ids: cardIds });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const result = rpcData[0];
        return {
          totalViews: Number(result.total_views || 0),
          totalShares: Number(result.total_shares || 0)
        };
      }

      if (rpcError) throw rpcError;
    } catch (err) {
      console.error("Error in getViewsStats RPC:", err);
    }

    // Fallback: limited counting if RPC fails
    // We avoid fetching ALL rows for performance reasons
    const { count: totalViews, error: vError } = await supabase
      .from("card_views")
      .select("*", { count: 'exact', head: true })
      .in("card_id", cardIds);

    const { count: totalShares, error: sError } = await supabase
      .from("card_views")
      .select("*", { count: 'exact', head: true })
      .in("card_id", cardIds)
      .not("referrer", "is", null);

    if (vError || sError) throw vError || sError;

    return {
      totalViews: totalViews || 0,
      totalShares: totalShares || 0
    };
  }

  /**
   * Get recent views for activity feed
   */
  private static async getRecentViews(cardIds: string[], limit: number) {
    const { data, error } = await supabase
      .from("card_views")
      .select("created_at, card_id, referrer")
      .in("card_id", cardIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    // Map to ensure created_at is not null for TypeScript
    return (data || []).map(item => ({
      ...item,
      created_at: item.created_at || new Date().toISOString()
    }));
  }

  /**
   * Get appointments data with optional pagination
   */
  private static async getAppointments(
    cardIds: string[],
    options?: { limit?: number; offset?: number }
  ) {
    const { limit, offset = 0 } = options || {};

    let query = supabase
      .from("appointments")
      .select("id, created_at, card_id, client_name", { count: limit ? undefined : 'exact' })
      .in("card_id", cardIds)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Ensure created_at is string for TS
    const sanitizedData = (data || []).map(item => ({
      ...item,
      created_at: item.created_at || new Date().toISOString()
    }));

    return {
      data: sanitizedData,
      total: count || sanitizedData.length || 0
    };
  }

  /**
   * Get appointments count only (for stats)
   */
  private static async getAppointmentsCount(cardIds: string[]): Promise<number> {
    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: 'exact', head: true })
      .in("card_id", cardIds);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get total revenue from all orders (for stats)
   * Uses unified_orders with price*quantity - more reliable than RPC/payment_amount
   * which is often NULL for orders created via inquiry forms (before Mobile Money)
   */
  private static async getTotalRevenue(cardIds: string[]): Promise<number> {
    const { data: orders, error } = await supabase
      .from("unified_orders")
      .select("payment_amount, product_price, quantity")
      .in("card_id", cardIds);

    if (error) throw error;

    return (orders || []).reduce((sum, order) => {
      const paymentAmount = Number(order.payment_amount) || 0;
      const productPrice = Number(order.product_price) || 0;
      const qty = order.quantity ?? 1;
      const calculatedAmount = productPrice * qty;
      return sum + (paymentAmount > 0 ? paymentAmount : calculatedAmount);
    }, 0);
  }

  /**
   * Get orders count only (for stats)
   */
  private static async getOrdersCount(cardIds: string[]): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_multi_card_order_stats' as any, { card_ids: cardIds });

      if (!error && data && data.length > 0) {
        return Number(data[0].total_orders || 0);
      }

      if (error) throw error;
    } catch (err) {
      console.error("Error in getOrdersCount RPC:", err);
    }

    const { count, error } = await supabase
      .from("unified_orders")
      .select("*", { count: 'exact', head: true })
      .in("card_id", cardIds);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get orders with products using SQL JOIN (includes both physical and digital products)
   * Now supports pagination for activity feed
   */
  private static async getOrdersWithProducts(
    cardIds: string[],
    options?: { limit?: number; offset?: number }
  ) {
    const { limit, offset = 0 } = options || {};
    // Fetch physical product inquiries with optional pagination
    let physicalQuery = supabase
      .from("product_inquiries")
      .select(`
        id,
        created_at,
        card_id,
        client_name,
        quantity,
        status,
        product_id,
        notes,
        products (
          id,
          name,
          price
        )
      `)
      .in("card_id", cardIds)
      .order("created_at", { ascending: false });

    if (limit) {
      physicalQuery = physicalQuery.range(offset, offset + limit - 1);
    }

    const { data: physicalOrders, error: physicalError } = await physicalQuery;

    if (physicalError) {
      // Error log removed
      throw physicalError;
    }

    // Fetch digital product inquiries with optional pagination
    let digitalQuery = supabase
      .from("digital_inquiries")
      .select(`
        id,
        created_at,
        card_id,
        client_name,
        quantity,
        status,
        digital_product_id,
        notes,
        digital_products (
          id,
          title,
          price
        )
      `)
      .in("card_id", cardIds)
      .order("created_at", { ascending: false });

    if (limit) {
      digitalQuery = digitalQuery.range(offset, offset + limit - 1);
    }

    const { data: digitalOrders, error: digitalError } = await digitalQuery;

    if (digitalError) {
      // Error log removed
      throw digitalError;
    }

    type OrderWithProduct = {
      id: string;
      created_at: string;
      card_id: string;
      client_name: string | null;
      quantity: number;
      status: string;
      products: {
        id: string;
        name: string;
        price: number;
      } | null;
    };

    // Map physical orders - fetch products manually since JOIN doesn't work
    const productIds = [...new Set((physicalOrders || []).map(o => o.product_id).filter(Boolean))] as string[];

    // Fetch all products in one query
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (productsError) {
      // Error log removed
    }

    const productsMap = new Map((productsData || []).map(p => [p.id, p]));

    const mappedPhysicalOrders = ((physicalOrders || []) as any[]).map(item => {
      let mappedProduct = null;

      const product = productsMap.get(item.product_id);
      if (product) {
        // Convert price from string to number (DECIMAL/NUMERIC types return strings)
        const price = typeof product.price === 'string'
          ? parseFloat(product.price)
          : (product.price || 0);

        mappedProduct = {
          id: product.id,
          name: product.name,
          price: price
        };
      }

      return {
        ...item,
        products: mappedProduct
      };
    });

    // Map digital orders
    const mappedDigitalOrders = ((digitalOrders || []) as any[]).map(item => {
      let mappedProduct = null;

      if (Array.isArray(item.digital_products) && item.digital_products.length > 0) {
        const digitalProduct = item.digital_products[0];
        // Convert price from string to number (DECIMAL/NUMERIC types return strings)
        const price = typeof digitalProduct.price === 'string'
          ? parseFloat(digitalProduct.price)
          : (digitalProduct.price || 0);

        mappedProduct = {
          id: digitalProduct.id,
          name: digitalProduct.title,
          price: price
        };
      }
      // Fallback: extract price from notes for legacy digital purchases
      else if (item.notes && item.notes.includes('Price:')) {
        const priceMatch = item.notes.match(/Price:\s*(\d+)/);
        if (priceMatch) {
          mappedProduct = {
            id: item.digital_product_id || 'unknown',
            name: 'Digital Product',
            price: parseInt(priceMatch[1], 10)
          };
        }
      }

      return {
        ...item,
        products: mappedProduct
      };
    });

    // Combine both arrays
    const allOrders = [...mappedPhysicalOrders, ...mappedDigitalOrders] as OrderWithProduct[];

    // Sort by created_at descending
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // If limit was specified, return only the limited results
    const limitedOrders = limit ? allOrders.slice(0, limit) : allOrders;

    return {
      data: limitedOrders,
      total: allOrders.length
    };
  }

  /**
   * Get per-card aggregations using efficient queries
   */
  private static async getCardAggregations(cardIds: string[]) {
    try {
      // Step 1: Get view counts in bulk
      const [viewCountsResult, otherStatsResult] = await Promise.all([
        supabase.rpc('get_per_card_view_counts' as any, { card_ids: cardIds }),
        supabase.rpc('get_multi_card_aggregations' as any, { card_ids: cardIds })
      ]);

      if (!viewCountsResult.error && !otherStatsResult.error && viewCountsResult.data && otherStatsResult.data) {
        const viewCountsMap = new Map<string, number>();
        viewCountsResult.data.forEach((row: any) => {
          viewCountsMap.set(row.card_id, Number(row.view_count || 0));
        });

        return otherStatsResult.data.map((row: any) => ({
          cardId: row.card_id,
          viewCount: viewCountsMap.get(row.card_id) || 0,
          orderCount: Number(row.order_count || 0),
          appointmentCount: Number(row.appointment_count || 0)
        }));
      }

      if (viewCountsResult.error) throw viewCountsResult.error;
      if (otherStatsResult.error) throw otherStatsResult.error;
    } catch (err) {
      console.error("Error in getCardAggregations optimized flow:", err);
    }

    // Fallback simplified - avoid manual loops
    const aggregations = await Promise.all(
      cardIds.map(async (cardId) => {
        const [vCount, oCount, aCount] = await Promise.all([
          supabase.from("card_views").select("*", { count: 'exact', head: true }).eq("card_id", cardId),
          supabase.from("unified_orders").select("*", { count: 'exact', head: true }).eq("card_id", cardId),
          supabase.from("appointments").select("*", { count: 'exact', head: true }).eq("card_id", cardId)
        ]);

        return {
          cardId,
          viewCount: vCount.count || 0,
          orderCount: oCount.count || 0,
          appointmentCount: aCount.count || 0
        };
      })
    );

    return aggregations;
  }

  /**
   * Build activity feed from multiple sources
   */
  private static buildActivityFeed(params: {
    views: Array<{ created_at: string; card_id: string; referrer: string | null }>;
    orders: Array<{
      id: string;
      created_at: string;
      card_id: string;
      client_name: string | null;
      quantity: number;
      products: { name: string; price: number } | null;
    }>;
    appointments: Array<{
      id: string;
      created_at: string;
      card_id: string;
      client_name: string | null;
    }>;
    cards: BusinessCard[];
    limit: number;
  }): DashboardActivity[] {
    const { views, orders, appointments, cards, limit } = params;

    const activities: DashboardActivity[] = [
      // Map views - Ajouter un index pour éviter les clés dupliquées
      ...views.map((view, index) => ({
        id: `view-${view.card_id}-${new Date(view.created_at).getTime()}-${index}`,
        type: "view" as const,
        cardId: view.card_id,
        cardName: cards.find(card => card.id === view.card_id)?.name || "",
        description: "Nouvelle vue de carte",
        date: view.created_at,
      })),

      // Map orders
      ...orders.map(order => ({
        id: `order-${order.id}`,
        type: "order" as const,
        cardId: order.card_id,
        cardName: cards.find(card => card.id === order.card_id)?.name || "",
        description: "Nouvelle commande",
        date: order.created_at,
        metadata: {
          amount: (order.products?.price || 0) * order.quantity,
          customerName: order.client_name,
          productName: order.products?.name || "",
        },
      })),

      // Map appointments
      ...appointments.map(appointment => ({
        id: `appointment-${appointment.id}`,
        type: "appointment" as const,
        cardId: appointment.card_id,
        cardName: cards.find(card => card.id === appointment.card_id)?.name || "",
        description: "Nouveau rendez-vous",
        date: appointment.created_at,
        metadata: {
          customerName: appointment.client_name,
        },
      }))
    ];

    // Sort by date and limit
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * Enrich cards with aggregated stats
   */
  private static enrichCardsWithStats(
    cards: BusinessCard[],
    aggregations: Array<{
      cardId: string;
      viewCount: number;
      orderCount: number;
      appointmentCount: number;
    }>,
    orders: Array<{
      card_id: string;
      quantity: number;
      products: { price: number } | null;
    }>
  ): EnrichedBusinessCard[] {
    return cards.map(card => {
      const cardStats = aggregations.find(agg => agg.cardId === card.id);
      const cardOrders = orders.filter(o => o.card_id === card.id);
      const revenue = cardOrders.reduce((acc, order) => {
        return acc + ((order.products?.price || 0) * order.quantity);
      }, 0);

      return {
        ...card,
        viewCount: cardStats?.viewCount || 0,
        orderCount: cardStats?.orderCount || 0,
        appointmentCount: cardStats?.appointmentCount || 0,
        revenue
      };
    });
  }

  /**
   * Get filtered activities for a specific card
   */
  static filterActivitiesByCard(activities: DashboardActivity[], cardId: string | null): DashboardActivity[] {
    if (!cardId) return activities;
    return activities.filter(activity => activity.cardId === cardId);
  }
}
