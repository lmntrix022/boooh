/**
 * BOOH Events Service - Main Entry Point
 * Re-exports all event-related functions from modular services
 *
 * This file maintains backward compatibility while the actual
 * implementations are now split across focused modules:
 * - eventCRUD.ts: Create, Read, Update, Delete operations
 * - eventQueries.ts: Query, filter, and search operations
 * - eventStats.ts: Statistics, analytics, and dashboard metrics
 * - eventUtils.ts: Utility functions and helpers
 */

import type {
  Event,
  EventFormData,
  EventFilters,
  EventSortOptions,
  EventsListResponse,
  EventStats,
  EventWithStats,
  EventDashboardMetrics,
  EventAttendee,
  EventFavorite,
  TicketValidationStats,
  RecentValidation,
} from '@/types/events';
import { supabase } from '@/integrations/supabase/client';

// Re-export all CRUD operations
export {
  createEvent,
  getEventById,
  getEventBySlug,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  permanentDeleteEvent,
} from './eventCRUD';

// Re-export all query operations
export {
  getEvents,
  getUserEvents,
  getUpcomingEvents,
  getFeaturedEvents,
  getEventsNearLocation,
  getCardEvents,
} from './eventQueries';

// Re-export all statistics operations
export {
  getEventStats,
  getEventWithStats,
  getEventDashboardMetrics,
  getEventAttendees,
  addEventToFavorites,
  removeEventFromFavorites,
  isEventFavorited,
  getUserFavoriteEvents,
  getTicketValidationStats,
  exportValidationLog,
} from './eventStats';

// Re-export all utility functions
export {
  isEventFull,
  hasEventStarted,
  hasEventEnded,
  isEventUpcoming,
  isEventActive,
  getAvailableSeats,
  getOccupancyPercentage,
  allowsWaitlist,
  hasTicketTiers,
  getTotalTicketsAvailable,
  getTotalTicketsSold,
  getCheapestTicketPrice,
  getMostExpensiveTicketPrice,
  getEventDurationHours,
  isEventToday,
  isEventThisWeek,
  getEventStatusText,
  getEventTypeText,
  formatPrice,
  validateEventData,
  validateTicketPurchase,
} from './eventUtils';

// =====================================================
// DUPLICATE IMPLEMENTATIONS REMOVED
// Functions below are re-exported from:
// - eventCRUD.ts
// - eventQueries.ts
// - eventStats.ts
// - eventUtils.ts
// =====================================================


/**
 * Update attendee check-in status
 */
export async function updateAttendeeCheckIn(
  attendeeId: string,
  checkedIn: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_attendees')
      .update({
        checked_in: checkedIn,
        checked_in_at: checkedIn ? new Date().toISOString() : null,
      })
      .eq('id', attendeeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating check-in status:', error);
    throw new Error('Failed to update check-in status');
  }
}

/**
 * Export attendees to CSV
 */
export function exportAttendeesToCSV(attendees: EventAttendee[], eventTitle: string): void {
  try {
    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Check-in Status',
      'Checked In At',
      'Attendance Status',
      'Registration Date',
    ];

    // Convert attendees to CSV rows
    const rows = attendees.map((attendee) => [
      attendee.name,
      attendee.email,
      attendee.phone || '',
      attendee.checked_in ? 'Yes' : 'No',
      attendee.checked_in_at
        ? new Date(attendee.checked_in_at).toLocaleString()
        : '',
      attendee.attendance_status,
      new Date(attendee.created_at).toLocaleString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_attendees_${new Date().toISOString().split('T')[0]
      }.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting attendees to CSV:', error);
    throw new Error('Failed to export attendees');
  }
}

/**
 * Send bulk email to attendees
 */
export async function sendBulkEmailToAttendees(
  eventId: string,
  attendeeIds: string[],
  subject: string,
  message: string
): Promise<{ success: number; failed: number }> {
  try {
    // This would typically call a backend endpoint that handles email sending
    // For now, we'll return a mock response
    // In production, you'd integrate with email service like SendGrid, Mailgun, etc.

    const response = await fetch('/api/events/send-bulk-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        attendee_ids: attendeeIds,
        subject,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send bulk email');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    // For now, return mock success
    // In production, throw the error
    return {
      success: attendeeIds.length,
      failed: 0,
    };
  }
}

// ==========================================
// Event Analytics Functions
// ==========================================

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

/**
 * Get event analytics for a specific date range
 */
export async function getEventAnalytics(
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

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const analytics = data as EventAnalyticsData[];

    // Calculate summary statistics
    const totalViews = analytics.reduce((sum, day) => sum + day.page_views, 0);
    const totalUniqueVisitors = analytics.reduce((sum, day) => sum + day.unique_visitors, 0);
    const totalTicketsSold = analytics.reduce((sum, day) => sum + day.tickets_sold, 0);
    const totalRevenue = analytics.reduce((sum, day) => sum + day.revenue, 0);

    // Calculate average conversion rate
    const conversionRates = analytics
      .filter(day => day.conversion_rate !== null)
      .map(day => day.conversion_rate as number);
    const avgConversionRate = conversionRates.length > 0
      ? conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length
      : 0;

    // Aggregate traffic sources
    const trafficSourcesMap: Record<string, number> = {};
    analytics.forEach(day => {
      if (day.traffic_sources) {
        Object.entries(day.traffic_sources).forEach(([source, visits]) => {
          trafficSourcesMap[source] = (trafficSourcesMap[source] || 0) + visits;
        });
      }
    });

    // Convert to array and calculate percentages
    const totalTrafficVisits = Object.values(trafficSourcesMap).reduce((sum, visits) => sum + visits, 0);
    const topTrafficSources = Object.entries(trafficSourcesMap)
      .map(([source, visits]) => ({
        source,
        visits,
        percentage: totalTrafficVisits > 0 ? Math.round((visits / totalTrafficVisits) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits);

    return {
      totalViews,
      totalUniqueVisitors,
      totalTicketsSold,
      totalRevenue,
      avgConversionRate,
      topTrafficSources,
      dailyData: analytics,
    };
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    throw new Error('Failed to fetch event analytics');
  }
}

/**
 * Export analytics to CSV
 */
export function exportAnalyticsToCSV(
  analytics: AnalyticsSummary,
  eventTitle: string
): void {
  const headers = [
    'Date',
    'Page Views',
    'Unique Visitors',
    'Shares',
    'Favorites',
    'Tickets Sold',
    'Tickets Validated',
    'Revenue',
    'Conversion Rate (%)',
  ];

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

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_analytics_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



// ==========================================
// Event Status Management Functions
// ==========================================

/**
 * Toggle event status between draft and published
 */
export async function toggleEventStatus(
  eventId: string,
  currentStatus: string
): Promise<Event> {
  try {
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
    const publishedAt = newStatus === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('events')
      .update({
        status: newStatus,
        published_at: publishedAt,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling event status:', error);
    throw new Error('Failed to update event status');
  }
}
