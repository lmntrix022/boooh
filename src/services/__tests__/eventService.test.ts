/**
 * Unit tests for eventService.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEvent,
  getEventById,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
} from '../eventService';
import { mockSupabaseClient } from '../../tests/mocks/supabase';
import { mockEvent, mockEventFormData } from '../../tests/mocks/eventData';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('eventService - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const cardId = 'card-123';
      const expectedEvent = { ...mockEvent };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: expectedEvent,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await createEvent(mockEventFormData, userId, cardId);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const userId = 'user-123';
      const error = new Error('Database error');

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createEvent(mockEventFormData, userId)).rejects.toThrow('Failed to create event');
    });
  });

  describe('getEventById', () => {
    it('should return event when found', async () => {
      // Arrange
      const eventId = 'event-123';
      const expectedEvent = { ...mockEvent };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: expectedEvent,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await getEventById(eventId);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
    });

    it('should return null when event not found', async () => {
      // Arrange
      const eventId = 'non-existent';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found error code
            }),
          }),
        }),
      });

      // Act
      const result = await getEventById(eventId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getEventBySlug', () => {
    it('should return event when found by slug', async () => {
      // Arrange
      const slug = 'test-event';
      const expectedEvent = { ...mockEvent };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: expectedEvent,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await getEventBySlug(slug);

      // Assert
      expect(result).toEqual(expectedEvent);
    });

    it('should return null when slug not found', async () => {
      // Arrange
      const slug = 'non-existent-slug';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Act
      const result = await getEventBySlug(slug);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      // Arrange
      const eventId = 'event-123';
      const updates = { title: 'Updated Title' };
      const expectedEvent = { ...mockEvent, title: 'Updated Title' };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedEvent,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateEvent(eventId, updates);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
    });

    it('should filter out Phase 2 fields', async () => {
      // Arrange
      const eventId = 'event-123';
      const updates = {
        title: 'Updated Title',
        has_live_stream: true, // Phase 2 field - should be filtered out
        live_stream_url: 'test-url', // Phase 2 field - should be filtered out
      };
      const expectedUpdates = { title: 'Updated Title' }; // Only valid fields

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockEvent, title: 'Updated Title' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      });

      // Act
      await updateEvent(eventId, updates);

      // Assert
      expect(updateMock).toHaveBeenCalledWith(expectedUpdates);
    });
  });

  describe('publishEvent', () => {
    it('should publish event successfully', async () => {
      // Arrange
      const eventId = 'event-123';
      const expectedEvent = { ...mockEvent, status: 'published' };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedEvent,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await publishEvent(eventId);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(result.status).toBe('published');
    });
  });

  describe('cancelEvent', () => {
    it('should cancel event successfully', async () => {
      // Arrange
      const eventId = 'event-123';
      const expectedEvent = { ...mockEvent, status: 'cancelled' };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedEvent,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await cancelEvent(eventId);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(result.status).toBe('cancelled');
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete event (set to archived)', async () => {
      // Arrange
      const eventId = 'event-123';

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      });

      // Act
      await deleteEvent(eventId);

      // Assert
      expect(updateMock).toHaveBeenCalledWith({ status: 'archived' });
    });
  });
});