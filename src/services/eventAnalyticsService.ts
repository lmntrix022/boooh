/**
 * BOOH Events - Analytics Service
 * Tracks and reports event metrics and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import type { EventAnalytics } from '@/types/events';

// =====================================================
// TRACKING FUNCTIONS
// =====================================================

/**
 * Track page view for an event
 */
export async function trackEventView(
  eventId: string,
  source?: string
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's analytics record
    const { data: existing } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing record
      const trafficSources = existing.traffic_sources as Record<string, number> || {};
      if (source) {
        trafficSources[source] = (trafficSources[source] || 0) + 1;
      }

      await supabase
        .from('event_analytics')
        .update({
          page_views: existing.page_views + 1,
          traffic_sources: trafficSources,
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      const trafficSources: Record<string, number> = {};
      if (source) {
        trafficSources[source] = 1;
      }

      await supabase.from('event_analytics').insert({
        event_id: eventId,
        date: today,
        page_views: 1,
        unique_visitors: 1,
        traffic_sources: trafficSources,
      });
    }
  } catch (error) {
    console.error('Error tracking event view:', error);
    // Don't throw - analytics should fail silently
  }
}

/**
 * Track unique visitor
 */
export async function trackUniqueVisitor(eventId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('event_analytics')
      .select('unique_visitors')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('event_analytics')
        .update({
          unique_visitors: existing.unique_visitors + 1,
        })
        .eq('event_id', eventId)
        .eq('date', today);
    }
  } catch (error) {
    console.error('Error tracking unique visitor:', error);
  }
}

/**
 * Track event share
 */
export async function trackEventShare(eventId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('event_analytics')
      .select('shares')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('event_analytics')
        .update({
          shares: existing.shares + 1,
        })
        .eq('event_id', eventId)
        .eq('date', today);
    } else {
      await supabase.from('event_analytics').insert({
        event_id: eventId,
        date: today,
        shares: 1,
      });
    }
  } catch (error) {
    console.error('Error tracking event share:', error);
  }
}

/**
 * Track event favorite
 */
export async function trackEventFavorite(eventId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('event_analytics')
      .select('favorites')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('event_analytics')
        .update({
          favorites: existing.favorites + 1,
        })
        .eq('event_id', eventId)
        .eq('date', today);
    } else {
      await supabase.from('event_analytics').insert({
        event_id: eventId,
        date: today,
        favorites: 1,
      });
    }
  } catch (error) {
    console.error('Error tracking event favorite:', error);
  }
}

/**
 * Track ticket sale
 */
export async function trackTicketSale(
  eventId: string,
  amount: number,
  currency: string = 'EUR'
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('event_analytics')
        .update({
          tickets_sold: existing.tickets_sold + 1,
          revenue: existing.revenue + amount,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('event_analytics').insert({
        event_id: eventId,
        date: today,
        tickets_sold: 1,
        revenue: amount,
        currency: currency,
      });
    }
  } catch (error) {
    console.error('Error tracking ticket sale:', error);
  }
}

/**
 * Track ticket validation
 */
export async function trackTicketValidation(eventId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('event_analytics')
      .select('tickets_validated')
      .eq('event_id', eventId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('event_analytics')
        .update({
          tickets_validated: existing.tickets_validated + 1,
        })
        .eq('event_id', eventId)
        .eq('date', today);
    } else {
      await supabase.from('event_analytics').insert({
        event_id: eventId,
        date: today,
        tickets_validated: 1,
      });
    }
  } catch (error) {
    console.error('Error tracking ticket validation:', error);
  }
}

// =====================================================
// ANALYTICS RETRIEVAL
// =====================================================

/**
 * Get analytics for a specific date
 */
export async function getAnalyticsByDate(
  eventId: string,
  date: string
): Promise<EventAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching analytics by date:', error);
    return null;
  }
}

/**
 * Get analytics for a date range
 */
export async function getAnalyticsRange(
  eventId: string,
  startDate: string,
  endDate: string
): Promise<EventAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analytics range:', error);
    return [];
  }
}

/**
 * Get all analytics for an event
 */
export async function getEventAnalytics(
  eventId: string
): Promise<EventAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return [];
  }
}

// =====================================================
// AGGREGATED ANALYTICS
// =====================================================

/**
 * Get total analytics for an event
 */
export async function getTotalAnalytics(eventId: string) {
  try {
    const analytics = await getEventAnalytics(eventId);

    const total = {
      total_page_views: 0,
      total_unique_visitors: 0,
      total_shares: 0,
      total_favorites: 0,
      total_tickets_sold: 0,
      total_tickets_validated: 0,
      total_revenue: 0,
      currency: 'EUR',
      traffic_sources: {} as Record<string, number>,
      conversion_rate: 0,
    };

    analytics.forEach((day) => {
      total.total_page_views += day.page_views;
      total.total_unique_visitors += day.unique_visitors;
      total.total_shares += day.shares;
      total.total_favorites += day.favorites;
      total.total_tickets_sold += day.tickets_sold;
      total.total_tickets_validated += day.tickets_validated;
      total.total_revenue += day.revenue;

      // Aggregate traffic sources
      const sources = day.traffic_sources as Record<string, number> || {};
      Object.entries(sources).forEach(([source, count]) => {
        total.traffic_sources[source] =
          (total.traffic_sources[source] || 0) + count;
      });
    });

    // Calculate conversion rate
    if (total.total_unique_visitors > 0) {
      total.conversion_rate =
        (total.total_tickets_sold / total.total_unique_visitors) * 100;
    }

    return total;
  } catch (error) {
    console.error('Error calculating total analytics:', error);
    return null;
  }
}

/**
 * Get analytics summary (last 7 days)
 */
export async function getAnalyticsSummary(eventId: string) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const analytics = await getAnalyticsRange(
      eventId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const summary = {
      last_7_days: {
        page_views: 0,
        unique_visitors: 0,
        tickets_sold: 0,
        revenue: 0,
      },
      today: {
        page_views: 0,
        unique_visitors: 0,
        tickets_sold: 0,
        revenue: 0,
      },
      trend: {
        page_views: 0,
        tickets_sold: 0,
      },
    };

    const today = new Date().toISOString().split('T')[0];

    analytics.forEach((day) => {
      summary.last_7_days.page_views += day.page_views;
      summary.last_7_days.unique_visitors += day.unique_visitors;
      summary.last_7_days.tickets_sold += day.tickets_sold;
      summary.last_7_days.revenue += day.revenue;

      if (day.date === today) {
        summary.today = {
          page_views: day.page_views,
          unique_visitors: day.unique_visitors,
          tickets_sold: day.tickets_sold,
          revenue: day.revenue,
        };
      }
    });

    // Calculate trend (compare last 3 days vs previous 4 days)
    if (analytics.length >= 7) {
      const recent = analytics.slice(-3);
      const previous = analytics.slice(0, 4);

      const recentViews = recent.reduce((sum, d) => sum + d.page_views, 0);
      const previousViews = previous.reduce((sum, d) => sum + d.page_views, 0);
      summary.trend.page_views =
        previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0;

      const recentSales = recent.reduce((sum, d) => sum + d.tickets_sold, 0);
      const previousSales = previous.reduce((sum, d) => sum + d.tickets_sold, 0);
      summary.trend.tickets_sold =
        previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;
    }

    return summary;
  } catch (error) {
    console.error('Error calculating analytics summary:', error);
    return null;
  }
}

// =====================================================
// CONVERSION TRACKING
// =====================================================

/**
 * Calculate conversion rate
 */
export async function calculateConversionRate(
  eventId: string,
  startDate?: string,
  endDate?: string
): Promise<number> {
  try {
    let analytics: EventAnalytics[];

    if (startDate && endDate) {
      analytics = await getAnalyticsRange(eventId, startDate, endDate);
    } else {
      analytics = await getEventAnalytics(eventId);
    }

    const totalVisitors = analytics.reduce(
      (sum, day) => sum + day.unique_visitors,
      0
    );
    const totalSales = analytics.reduce(
      (sum, day) => sum + day.tickets_sold,
      0
    );

    if (totalVisitors === 0) return 0;
    return (totalSales / totalVisitors) * 100;
  } catch (error) {
    console.error('Error calculating conversion rate:', error);
    return 0;
  }
}

/**
 * Update conversion rate for today
 */
export async function updateConversionRate(eventId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analytics = await getAnalyticsByDate(eventId, today);

    if (!analytics) return;

    let conversionRate = 0;
    if (analytics.unique_visitors > 0) {
      conversionRate =
        (analytics.tickets_sold / analytics.unique_visitors) * 100;
    }

    await supabase
      .from('event_analytics')
      .update({ conversion_rate: conversionRate })
      .eq('id', analytics.id);
  } catch (error) {
    console.error('Error updating conversion rate:', error);
  }
}

// =====================================================
// EXPORT & REPORTING
// =====================================================

/**
 * Export analytics to CSV format
 */
export async function exportAnalyticsToCSV(eventId: string): Promise<string> {
  try {
    const analytics = await getEventAnalytics(eventId);

    const headers = [
      'Date',
      'Page Views',
      'Unique Visitors',
      'Shares',
      'Favorites',
      'Tickets Sold',
      'Tickets Validated',
      'Revenue',
      'Conversion Rate',
    ];

    const rows = analytics.map((day) => [
      day.date,
      day.page_views,
      day.unique_visitors,
      day.shares,
      day.favorites,
      day.tickets_sold,
      day.tickets_validated,
      day.revenue,
      day.conversion_rate || 0,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    return '';
  }
}

/**
 * Get performance report
 */
export async function getPerformanceReport(eventId: string) {
  try {
    const [totalAnalytics, summary] = await Promise.all([
      getTotalAnalytics(eventId),
      getAnalyticsSummary(eventId),
    ]);

    if (!totalAnalytics || !summary) {
      throw new Error('Failed to generate report');
    }

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    return {
      event,
      total: totalAnalytics,
      summary,
      top_traffic_sources: Object.entries(totalAnalytics.traffic_sources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
      metrics: {
        engagement_rate:
          totalAnalytics.total_page_views > 0
            ? (totalAnalytics.total_shares /
                totalAnalytics.total_page_views) *
              100
            : 0,
        attendance_rate:
          totalAnalytics.total_tickets_sold > 0
            ? (totalAnalytics.total_tickets_validated /
                totalAnalytics.total_tickets_sold) *
              100
            : 0,
        average_revenue_per_ticket:
          totalAnalytics.total_tickets_sold > 0
            ? totalAnalytics.total_revenue / totalAnalytics.total_tickets_sold
            : 0,
      },
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    return null;
  }
}

// =====================================================
// DASHBOARD ANALYTICS (Migrated from eventService.ts)
// =====================================================

export interface EventAnalyticsData {
  id: string;
  event_id: string;
  date: string;
  page_views: number;
  unique_visitors: number;
  shares: number;
  favorites: number;
  tickets_sold: number;
  tickets_validated: number;
  revenue: number;
  currency: string;
  traffic_sources: Record<string, number>;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalUniqueVisitors: number;
  totalTicketsSold: number;
  totalRevenue: number;
  avgConversionRate: number;
  topTrafficSources: Array<{ source: string; visits: number; percentage: number }>;
  dailyData: EventAnalyticsData[];
}

export async function getEventAnalyticsDashboard(
  eventId: string,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsSummary> {
  try {
    let query = supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('date', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const analytics = data as EventAnalyticsData[];

    const totalViews = analytics.reduce((sum, day) => sum + day.page_views, 0);
    const totalUniqueVisitors = analytics.reduce((sum, day) => sum + day.unique_visitors, 0);
    const totalTicketsSold = analytics.reduce((sum, day) => sum + day.tickets_sold, 0);
    const totalRevenue = analytics.reduce((sum, day) => sum + day.revenue, 0);

    const conversionRates = analytics.filter(day => day.conversion_rate !== null).map(day => day.conversion_rate as number);
    const avgConversionRate = conversionRates.length > 0 ? conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length : 0;

    const trafficSourcesMap: Record<string, number> = {};
    analytics.forEach(day => {
      if (day.traffic_sources) {
        Object.entries(day.traffic_sources).forEach(([source, visits]) => {
          trafficSourcesMap[source] = (trafficSourcesMap[source] || 0) + visits;
        });
      }
    });

    const totalTrafficVisits = Object.values(trafficSourcesMap).reduce((sum, visits) => sum + visits, 0);
    const topTrafficSources = Object.entries(trafficSourcesMap)
      .map(([source, visits]) => ({ source, visits, percentage: totalTrafficVisits > 0 ? Math.round((visits / totalTrafficVisits) * 100) : 0 }))
      .sort((a, b) => b.visits - a.visits);

    return { totalViews, totalUniqueVisitors, totalTicketsSold, totalRevenue, avgConversionRate, topTrafficSources, dailyData: analytics };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw new Error('Failed to fetch dashboard analytics');
  }
}

export function downloadAnalyticsCSV(analytics: AnalyticsSummary, eventTitle: string): void {
  const headers = ['Date', 'Page Views', 'Unique Visitors', 'Shares', 'Favorites', 'Tickets Sold', 'Tickets Validated', 'Revenue', 'Conversion Rate (%)'];
  const rows = analytics.dailyData.map((day) => [
    day.date,
    day.page_views.toString(),
    day.unique_visitors.toString(),
    day.shares.toString(),
    day.favorites.toString(),
    day.tickets_sold.toString(),
    day.tickets_validated.toString(),
    `${day.revenue.toFixed(2)} ${day.currency}`,
    day.conversion_rate ? day.conversion_rate.toFixed(2) : 'N/A',
  ]);
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

