import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { calculateAnalytics, calculateClickStats, type AnalyticsStats, type ClickStats } from './analyticsService';
import { subDays, startOfDay } from 'date-fns';

type CardViewType = Tables<"card_views">;
type BusinessCardType = Tables<"business_cards">;

export interface StatsData {
  card: BusinessCardType;
  views: CardViewType[];
  clicks: any[];
  analytics: AnalyticsStats;
  clickStats: ClickStats;
}

interface StatsQueryParams {
  cardId: string;
  userId: string;
  dateRange?: number; // days
}

/**
 * Optimized Stats Service
 *
 * Performance improvements:
 * - Parallel queries with Promise.all()
 * - Server-side date filtering
 * - Optimized analytics calculation
 * - Ready for React Query caching
 */
export class StatsService {
  /**
   * Get complete stats data with optimized queries
   */
  static async getStatsData(params: StatsQueryParams): Promise<StatsData> {
    const { cardId, userId, dateRange = 30 } = params;

    const startDate = startOfDay(subDays(new Date(), dateRange));

    // Parallel queries for maximum performance
    const [cardResult, viewsResult, clicksResult] = await Promise.all([
      // Fetch card data
      supabase
        .from("business_cards")
        .select("*")
        .eq("id", cardId)
        .eq("user_id", userId)
        .single(),

      // Fetch card views with date filter
      supabase
        .from("card_views")
        .select("*")
        .eq("card_id", cardId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true }),

      // Fetch card clicks with date filter
      supabase
        .from('card_clicks')
        .select('*')
        .eq('card_id', cardId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
    ]);

    // Handle errors
    if (cardResult.error) {
      throw new Error(`Card not found: ${cardResult.error.message}`);
    }

    if (viewsResult.error) {
      throw new Error(`Failed to load views: ${viewsResult.error.message}`);
    }

    // Clicks table might not exist yet, so we just log warning
    if (clicksResult.error) {
      // Warning log removed
    }

    const card = cardResult.data;
    const views = viewsResult.data || [];
    const clicks = clicksResult.data || [];

    // Calculate analytics (client-side for now, could be moved to RPC)
    const analytics = calculateAnalytics(views);
    const clickStats = calculateClickStats(clicks, analytics.totalViews);

    return {
      card,
      views,
      clicks,
      analytics,
      clickStats
    };
  }

  /**
   * Get only view count for quick stats
   * Useful for dashboard summaries
   */
  static async getViewCount(cardId: string, dateRange: number = 30): Promise<number> {
    const startDate = startOfDay(subDays(new Date(), dateRange));

    // Sum the 'count' column instead of counting rows
    const { data, error } = await supabase
      .from("card_views")
      .select("count")
      .eq("card_id", cardId)
      .gte("created_at", startDate.toISOString());

    if (error) {
      // Error log removed
      return 0;
    }

    return data?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;
  }

  /**
   * Get view trends (for sparkline charts)
   */
  static async getViewTrends(cardId: string, days: number = 7): Promise<Array<{ date: string; count: number }>> {
    const startDate = startOfDay(subDays(new Date(), days));

    const { data, error } = await supabase
      .from("card_views")
      .select("created_at, count")
      .eq("card_id", cardId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      // Error log removed
      return [];
    }

    // Group by date and sum the count column
    const viewsByDate: Record<string, number> = {};
    (data || []).forEach(view => {
      const date = view.created_at.split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + (view.count || 1);
    });

    return Object.entries(viewsByDate).map(([date, count]) => ({ date, count }));
  }
}
