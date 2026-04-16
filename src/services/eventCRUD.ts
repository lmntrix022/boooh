/**
 * BOOH Events - CRUD Operations Service
 * Handles Create, Read, Update, Delete operations for events
 */

import { supabase } from '@/integrations/supabase/client';
import type { Event, EventFormData } from '@/types/events';

// =====================================================
// CREATE OPERATIONS
// =====================================================

/**
 * Create a new event
 */
export async function createEvent(
  eventData: EventFormData,
  userId: string,
  cardId?: string
): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        card_id: cardId,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.event_type,
        category: eventData.category,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        timezone: eventData.timezone || 'UTC',
        location_name: eventData.location_name,
        location_address: eventData.location_address,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        max_capacity: eventData.max_capacity,
        allow_waitlist: eventData.allow_waitlist || false,
        cover_image_url: eventData.cover_image_url,
        promo_video_url: eventData.promo_video_url,
        images_urls: eventData.images_urls || [],
        is_free: eventData.is_free,
        tickets_config: eventData.tickets_config || [],
        is_public: eventData.is_public !== false, // default true
        tags: eventData.tags || [],
        status: 'draft', // Always start as draft
        metadata: eventData.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
}

// =====================================================
// READ OPERATIONS
// =====================================================

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
}

/**
 * Get event by slug
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return null;
  }
}

// =====================================================
// UPDATE OPERATIONS
// =====================================================

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<EventFormData>
): Promise<Event> {
  try {
    // Filter out Phase 2 fields that don't exist in the database yet
    const {
      enable_chat,
      enable_tips,
      live_stream_platform,
      has_live_stream,
      live_stream_url,
      ...validUpdates
    } = updates;

    const { data, error } = await supabase
      .from('events')
      .update(validUpdates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
}

/**
 * Publish event
 */
export async function publishEvent(eventId: string): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error publishing event:', error);
    throw new Error('Failed to publish event');
  }
}

/**
 * Cancel event
 */
export async function cancelEvent(eventId: string): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling event:', error);
    throw new Error('Failed to cancel event');
  }
}

// =====================================================
// DELETE OPERATIONS
// =====================================================

/**
 * Delete event (soft delete by setting status to archived)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
}

/**
 * Hard delete event (permanent deletion)
 */
export async function permanentDeleteEvent(eventId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    console.error('Error permanently deleting event:', error);
    throw new Error('Failed to permanently delete event');
  }
}

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