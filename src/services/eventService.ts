/**
 * BOOH Events Service - Main Entry Point
 * Re-exports all event-related functions from modular services
 *
 * This file maintains backward compatibility while the actual
 * implementations are now split across focused modules:
 * - eventCRUD.ts: Create, Read, Update, Delete operations
 * - eventQueries.ts: Query, filter, and search operations
 * - eventStats.ts: Statistics and dashboard metrics
 * - eventUtils.ts: Utility functions and helpers
 * - eventAttendeesService.ts: Attendee management and exports
 * - eventAnalyticsService.ts: Analytics and reporting
 */

export type * from '@/types/events';

// ==========================================
// Re-export all CRUD operations
// ==========================================
export {
  createEvent,
  getEventById,
  getEventBySlug,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  permanentDeleteEvent,
  toggleEventStatus,
} from './eventCRUD';

// ==========================================
// Re-export all query operations
// ==========================================
export {
  getEvents,
  getUserEvents,
  getUpcomingEvents,
  getFeaturedEvents,
  getEventsNearLocation,
  getCardEvents,
} from './eventQueries';

// ==========================================
// Re-export all statistics operations
// ==========================================
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

// ==========================================
// Re-export all utility functions
// ==========================================
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

// ==========================================
// Re-export all attendees operations
// ==========================================
export {
  updateAttendeeCheckIn,
  exportAttendeesToCSV,
  sendBulkEmailToAttendees,
} from './eventAttendeesService';

// ==========================================
// Re-export all analytics operations
// ==========================================
export {
  getEventAnalyticsDashboard as getEventAnalytics,
  downloadAnalyticsCSV as exportAnalyticsToCSV,
  getAnalyticsByDate,
  getAnalyticsRange,
  getTotalAnalytics,
  getAnalyticsSummary,
  calculateConversionRate,
  updateConversionRate,
  exportAnalyticsToCSV as exportAnalyticsCSVString,
  getPerformanceReport,
} from './eventAnalyticsService';

export type {
  EventAnalyticsData,
  AnalyticsSummary,
} from './eventAnalyticsService';
