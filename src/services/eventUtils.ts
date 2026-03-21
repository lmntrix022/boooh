/**
 * BOOH Events - Utility Functions
 * Helper functions for event operations and validations
 */

import type { Event } from '@/types/events';

// =====================================================
// EVENT STATUS UTILITIES
// =====================================================

/**
 * Check if event is full
 */
export function isEventFull(event: Event): boolean {
  if (!event.max_capacity) return false;
  return (event.current_attendees || 0) >= event.max_capacity;
}

/**
 * Check if event has started
 */
export function hasEventStarted(event: Event): boolean {
  return new Date(event.start_date) <= new Date();
}

/**
 * Check if event has ended
 */
export function hasEventEnded(event: Event): boolean {
  return new Date(event.end_date) < new Date();
}

/**
 * Check if event is upcoming
 */
export function isEventUpcoming(event: Event): boolean {
  return new Date(event.start_date) > new Date();
}

/**
 * Check if event is currently active (happening now)
 */
export function isEventActive(event: Event): boolean {
  const now = new Date();
  return new Date(event.start_date) <= now && new Date(event.end_date) >= now;
}

// =====================================================
// CAPACITY & AVAILABILITY
// =====================================================

/**
 * Get available seats for an event
 */
export function getAvailableSeats(event: Event): number | null {
  if (!event.max_capacity) return null;
  return Math.max(0, event.max_capacity - (event.current_attendees || 0));
}

/**
 * Get occupancy percentage
 */
export function getOccupancyPercentage(event: Event): number {
  if (!event.max_capacity) return 0;
  return Math.round(((event.current_attendees || 0) / event.max_capacity) * 100);
}

/**
 * Check if event allows waitlist
 */
export function allowsWaitlist(event: Event): boolean {
  return event.allow_waitlist && isEventFull(event);
}

// =====================================================
// TICKETING UTILITIES
// =====================================================

/**
 * Check if event has ticket tiers configured
 */
export function hasTicketTiers(event: Event): boolean {
  return !event.is_free && event.tickets_config && event.tickets_config.length > 0;
}

/**
 * Get total tickets available across all tiers
 */
export function getTotalTicketsAvailable(event: Event): number {
  if (event.is_free || !event.tickets_config) return 0;
  return event.tickets_config.reduce((total, tier) => total + tier.quantity, 0);
}

/**
 * Get total tickets sold across all tiers
 */
export function getTotalTicketsSold(event: Event): number {
  if (event.is_free || !event.tickets_config) return 0;
  return event.tickets_config.reduce((total, tier) => total + tier.soldCount, 0);
}

/**
 * Get cheapest ticket price
 */
export function getCheapestTicketPrice(event: Event): number | null {
  if (event.is_free || !event.tickets_config || event.tickets_config.length === 0) {
    return event.is_free ? 0 : null;
  }

  const prices = event.tickets_config.map(tier => tier.price);
  return Math.min(...prices);
}

/**
 * Get most expensive ticket price
 */
export function getMostExpensiveTicketPrice(event: Event): number | null {
  if (event.is_free || !event.tickets_config || event.tickets_config.length === 0) {
    return event.is_free ? 0 : null;
  }

  const prices = event.tickets_config.map(tier => tier.price);
  return Math.max(...prices);
}

// =====================================================
// TIME & DATE UTILITIES
// =====================================================

/**
 * Get event duration in hours
 */
export function getEventDurationHours(event: Event): number {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
}

/**
 * Check if event is happening today
 */
export function isEventToday(event: Event): boolean {
  const today = new Date();
  const eventDate = new Date(event.start_date);
  return eventDate.toDateString() === today.toDateString();
}

/**
 * Check if event is happening this week
 */
export function isEventThisWeek(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.start_date);
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return eventDate >= weekStart && eventDate <= weekEnd;
}

// =====================================================
// DISPLAY UTILITIES
// =====================================================

/**
 * Get event status display text
 */
export function getEventStatusText(event: Event): string {
  switch (event.status) {
    case 'draft':
      return 'Brouillon';
    case 'published':
      return isEventActive(event) ? 'En cours' : isEventUpcoming(event) ? 'Publié' : 'Terminé';
    case 'cancelled':
      return 'Annulé';
    case 'completed':
      return 'Terminé';
    case 'archived':
      return 'Archivé';
    default:
      return 'Inconnu';
  }
}

/**
 * Get event type display text
 */
export function getEventTypeText(event: Event): string {
  switch (event.event_type) {
    case 'physical':
      return 'Présentiel';
    case 'online':
      return 'En ligne';
    case 'hybrid':
      return 'Hybride';
    default:
      return 'Inconnu';
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate event data
 */
export function validateEventData(data: any): void {
  if (!data.title?.trim()) {
    throw new Error('Le titre de l\'événement est requis');
  }

  if (!data.start_date) {
    throw new Error('La date de début est requise');
  }

  if (!data.end_date) {
    throw new Error('La date de fin est requise');
  }

  if (new Date(data.start_date) >= new Date(data.end_date)) {
    throw new Error('La date de fin doit être après la date de début');
  }

  if (data.max_capacity && data.max_capacity < 1) {
    throw new Error('La capacité maximale doit être supérieure à 0');
  }

  if (!data.is_free && (!data.tickets_config || data.tickets_config.length === 0)) {
    throw new Error('Au moins un type de ticket doit être configuré pour les événements payants');
  }

  // Validate ticket tiers if present
  if (data.tickets_config) {
    for (const tier of data.tickets_config) {
      if (!tier.name?.trim()) {
        throw new Error('Le nom du type de ticket est requis');
      }
      if (tier.price < 0) {
        throw new Error('Le prix du ticket ne peut pas être négatif');
      }
      if (tier.quantity < 1) {
        throw new Error('La quantité de tickets doit être supérieure à 0');
      }
    }
  }
}

/**
 * Validate ticket purchase data
 */
export function validateTicketPurchase(data: any): void {
  if (!data.event_id) {
    throw new Error('L\'ID de l\'événement est requis');
  }

  if (!data.ticket_type?.trim()) {
    throw new Error('Le type de ticket est requis');
  }

  if (!data.attendee_name?.trim()) {
    throw new Error('Le nom du participant est requis');
  }

  if (!data.attendee_email?.trim()) {
    throw new Error('L\'email du participant est requis');
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.attendee_email)) {
    throw new Error('L\'email n\'est pas valide');
  }

  if (data.quantity && data.quantity < 1) {
    throw new Error('La quantité doit être supérieure à 0');
  }
}