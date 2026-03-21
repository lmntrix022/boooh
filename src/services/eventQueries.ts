/**
 * BOOH Events - Query Operations Service
 * Handles event queries, filtering, and search operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Event, EventFilters, EventSortOptions, EventsListResponse } from '@/types/events';

// =====================================================
// GENERAL QUERY OPERATIONS
// =====================================================

/**
 * Get events with filters and pagination
 */
export async function getEvents(
  filters?: EventFilters,
  sort?: EventSortOptions,
  page: number = 1,
  pageSize: number = 20
): Promise<EventsListResponse> {
  try {
    let query = supabase.from('events').select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.event_type && filters.event_type.length > 0) {
        query = query.in('event_type', filters.event_type);
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.start_date_from) {
        query = query.gte('start_date', filters.start_date_from);
      }

      if (filters.start_date_to) {
        query = query.lte('start_date', filters.start_date_to);
      }

      if (filters.is_free !== undefined) {
        query = query.eq('is_free', filters.is_free);
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Location-based filtering (geo search)
      if (filters.location) {
        // This requires PostGIS extension for accurate radius search
        // For now, we use a simple bounding box
        const { latitude, longitude, radius } = filters.location;
        const latDelta = radius / 111; // Approx km to degrees
        const lonDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

        query = query
          .gte('latitude', latitude - latDelta)
          .lte('latitude', latitude + latDelta)
          .gte('longitude', longitude - lonDelta)
          .lte('longitude', longitude + lonDelta);
      }
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('start_date', { ascending: true });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      events: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }
}

// =====================================================
// USER-SPECIFIC QUERIES
// =====================================================

/**
 * Get user's events
 */
export async function getUserEvents(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<EventsListResponse> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      events: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw new Error('Failed to fetch user events');
  }
}

// =====================================================
// PUBLIC EVENT QUERIES
// =====================================================

/**
 * Get upcoming public events
 */
export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_upcoming_events', { limit_count: limit });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

/**
 * Get featured events
 */
export async function getFeaturedEvents(limit: number = 6): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .eq('is_public', true)
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return [];
  }
}

// =====================================================
// LOCATION-BASED QUERIES
// =====================================================

/**
 * Search events by location (for map display)
 */
export async function getEventsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Event[]> {
  try {
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'published')
      .in('event_type', ['physical', 'hybrid'])
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lonDelta)
      .lte('longitude', longitude + lonDelta)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('start_date', new Date().toISOString()) // Only upcoming events
      .order('start_date', { ascending: true })
      .limit(100); // Limit to 100 events

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events near location:', error);
    return [];
  }
}

// =====================================================
// CARD-SPECIFIC QUERIES
// =====================================================

/**
 * Get all events for a specific card
 */
export async function getCardEvents(cardId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('card_id', cardId)
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching card events:', error);
    throw new Error('Failed to fetch card events');
  }
}