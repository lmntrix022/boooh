/**
 * BOOH Events - Statistics & Analytics Service
 * Handles event statistics, analytics, and dashboard metrics
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Event,
  EventStats,
  EventWithStats,
  EventDashboardMetrics,
  EventAttendee,
  EventFavorite,
  TicketValidationStats,
  RecentValidation,
  EventTicket,
} from '@/types/events';

// =====================================================
// EVENT STATISTICS
// =====================================================

/**
 * Get event statistics
 */
export async function getEventStats(eventId: string): Promise<EventStats> {
  try {
    const { data, error } = await supabase.rpc('get_event_stats', {
      event_uuid: eventId,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0];
    }

    // Return default stats if no data
    return {
      total_tickets: 0,
      tickets_sold: 0,
      tickets_validated: 0,
      total_revenue: 0,
      current_attendees: 0,
      max_capacity: 0,
      availability_rate: 0,
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw new Error('Failed to fetch event stats');
  }
}

/**
 * Get event with stats
 */
export async function getEventWithStats(
  eventId: string
): Promise<EventWithStats | null> {
  try {
    // Import here to avoid circular dependency
    const { getEventById } = await import('./eventCRUD');

    const [event, stats] = await Promise.all([
      getEventById(eventId),
      getEventStats(eventId),
    ]);

    if (!event) return null;

    return {
      ...event,
      stats,
    };
  } catch (error) {
    console.error('Error fetching event with stats:', error);
    return null;
  }
}

// =====================================================
// DASHBOARD METRICS
// =====================================================

/**
 * Get dashboard metrics for user
 */
export async function getEventDashboardMetrics(
  userId: string
): Promise<EventDashboardMetrics> {
  try {
    // Get all user events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);

    if (eventsError) throw eventsError;

    const now = new Date();
    const upcomingEvents = events?.filter(
      (e) => new Date(e.start_date) > now && e.status === 'published'
    ) || [];

    const activeEvents = events?.filter(
      (e) =>
        new Date(e.start_date) <= now &&
        new Date(e.end_date) >= now &&
        e.status === 'published'
    ) || [];

    // Get all tickets for user events
    const eventIds = events?.map((e) => e.id) || [];
    let totalRevenue = 0;
    let totalTicketsSold = 0;

    if (eventIds.length > 0) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('price, payment_status')
        .in('event_id', eventIds)
        .eq('payment_status', 'completed');

      if (!ticketsError && tickets) {
        totalRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
        totalTicketsSold = tickets.length;
      }
    }

    const totalAttendees = events?.reduce(
      (sum, e) => sum + (e.current_attendees || 0),
      0
    ) || 0;

    return {
      total_events: events?.length || 0,
      upcoming_events: upcomingEvents.length,
      active_events: activeEvents.length,
      total_attendees: totalAttendees,
      total_revenue: totalRevenue,
      average_ticket_price:
        totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0,
      conversion_rate: 0, // Will be calculated from analytics
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
}

// =====================================================
// ATTENDEES MANAGEMENT
// =====================================================

/**
 * Get event attendees
 */
export async function getEventAttendees(
  eventId: string
): Promise<EventAttendee[]> {
  try {
    const { data, error } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as EventAttendee[]) || [];
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    return [];
  }
}

// =====================================================
// FAVORITES MANAGEMENT
// =====================================================

/**
 * Add event to favorites
 */
export async function addEventToFavorites(
  eventId: string,
  userId: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('event_favorites')
      .insert({
        event_id: eventId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding event to favorites:', error);
    throw new Error('Failed to add event to favorites');
  }
}

/**
 * Remove event from favorites
 */
export async function removeEventFromFavorites(
  eventId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_favorites')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing event from favorites:', error);
    throw new Error('Failed to remove event from favorites');
  }
}

/**
 * Check if event is favorited by user
 */
export async function isEventFavorited(
  eventId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('event_favorites')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking if event is favorited:', error);
    return false;
  }
}

/**
 * Get user's favorite events
 */
export async function getUserFavoriteEvents(userId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('event_favorites')
      .select('event_id, events(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return (data as any)?.map((f: any) => f.events).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching user favorite events:', error);
    return [];
  }
}

// =====================================================
// TICKET VALIDATION STATS
// =====================================================

/**
 * Get ticket validation stats for dashboard
 */
export async function getTicketValidationStats(
  eventId: string,
  filter: 'today' | 'week' | 'all' = 'all'
): Promise<TicketValidationStats> {
  try {
    const { data: tickets, error } = await supabase
      .from('event_tickets')
      .select('id, ticket_number, attendee_name, attendee_email, ticket_type, validated_at, created_at')
      .eq('event_id', eventId);

    if (error) throw error;

    const totalTickets = tickets?.length || 0;
    const validatedTickets = tickets?.filter(t => t.validated_at).length || 0;
    const pendingValidation = totalTickets - validatedTickets;

    // Group by hour
    const hourlyData: Record<string, number> = {};
    (tickets as unknown as EventTicket[] || []).forEach((t: EventTicket) => {
      if (t.validated_at) {
        const hour = new Date(t.validated_at).getHours();
        const hourStr = `${hour}:00`;
        hourlyData[hourStr] = (hourlyData[hourStr] || 0) + 1;
      }
    });

    // Group by type
    const typeData: Record<string, number> = {};
    (tickets as unknown as EventTicket[] || []).forEach((t: EventTicket) => {
      const type = t.ticket_type || 'Standard';
      typeData[type] = (typeData[type] || 0) + 1;
    });

    // Recent validations
    const recentValidations: RecentValidation[] = (tickets as unknown as EventTicket[] || [])
      .filter((t: EventTicket) => !!t.validated_at)
      .sort((a: EventTicket, b: EventTicket) => new Date(b.validated_at!).getTime() - new Date(a.validated_at!).getTime())
      .slice(0, 10)
      .map((t: EventTicket) => ({
        id: t.id,
        attendee_name: t.attendee_name,
        attendee_email: t.attendee_email,
        ticket_number: t.ticket_number,
        ticket_type: t.ticket_type || 'Standard',
        validated_at: t.validated_at!,
      }));

    return {
      totalTickets,
      validatedTickets,
      pendingValidation,
      validationRate: totalTickets > 0 ? (validatedTickets / totalTickets) * 100 : 0,
      validationsByHour: Object.entries(hourlyData).map(([hour, count]) => ({ hour, count })),
      validationsByType: Object.entries(typeData).map(([type, count]) => ({ type, count })),
      recentValidations,
    };
  } catch (error) {
    console.error('Error fetching ticket validation stats:', error);
    throw new Error('Failed to fetch ticket validation stats');
  }
}

/**
 * Export validation log as CSV
 */
export function exportValidationLog(stats: TicketValidationStats, eventTitle: string): void {
  try {
    const headers = ['Attendee', 'Email', 'Ticket #', 'Type', 'Validated At'];
    const rows = stats.recentValidations.map(v => [
      v.attendee_name,
      v.attendee_email,
      v.ticket_number,
      v.ticket_type,
      new Date(v.validated_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `validation_log_${eventTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting validation log:', error);
  }
}