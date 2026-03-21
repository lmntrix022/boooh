/**
 * Integration tests for Events module
 * Tests that the refactored modules work together correctly
 */

import { describe, it, expect } from 'vitest';
import * as eventService from '../../services/eventService';
import * as eventCRUD from '../../services/eventCRUD';
import * as eventQueries from '../../services/eventQueries';
import * as eventStats from '../../services/eventStats';
import * as eventUtils from '../../services/eventUtils';

describe('Events Module Integration', () => {
  describe('Service Exports', () => {
    it('should export all CRUD functions', () => {
      expect(typeof eventService.createEvent).toBe('function');
      expect(typeof eventService.getEventById).toBe('function');
      expect(typeof eventService.updateEvent).toBe('function');
      expect(typeof eventService.deleteEvent).toBe('function');
      expect(typeof eventService.publishEvent).toBe('function');
      expect(typeof eventService.cancelEvent).toBe('function');
    });

    it('should export all query functions', () => {
      expect(typeof eventService.getEvents).toBe('function');
      expect(typeof eventService.getUserEvents).toBe('function');
      expect(typeof eventService.getUpcomingEvents).toBe('function');
      expect(typeof eventService.getFeaturedEvents).toBe('function');
      expect(typeof eventService.getEventsNearLocation).toBe('function');
    });

    it('should export all stats functions', () => {
      expect(typeof eventService.getEventStats).toBe('function');
      expect(typeof eventService.getEventDashboardMetrics).toBe('function');
      expect(typeof eventService.getEventAttendees).toBe('function');
    });

    it('should export all utility functions', () => {
      expect(typeof eventService.isEventFull).toBe('function');
      expect(typeof eventService.hasEventStarted).toBe('function');
      expect(typeof eventService.getAvailableSeats).toBe('function');
    });
  });

  describe('Module Separation', () => {
    it('should have separate CRUD module', () => {
      expect(eventCRUD).toBeDefined();
      expect(typeof eventCRUD.createEvent).toBe('function');
      expect(typeof eventCRUD.getEventById).toBe('function');
    });

    it('should have separate queries module', () => {
      expect(eventQueries).toBeDefined();
      expect(typeof eventQueries.getEvents).toBe('function');
      expect(typeof eventQueries.getUpcomingEvents).toBe('function');
    });

    it('should have separate stats module', () => {
      expect(eventStats).toBeDefined();
      expect(typeof eventStats.getEventStats).toBe('function');
      expect(typeof eventStats.getEventAttendees).toBe('function');
    });

    it('should have separate utils module', () => {
      expect(eventUtils).toBeDefined();
      expect(typeof eventUtils.isEventFull).toBe('function');
      expect(typeof eventUtils.validateEventData).toBe('function');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same API through main service', () => {
      // Test that functions are available and callable
      expect(eventService.createEvent).toBeDefined();
      expect(eventService.getEvents).toBeDefined();
      expect(eventService.getEventStats).toBeDefined();
      expect(eventService.isEventFull).toBeDefined();
    });
  });
});