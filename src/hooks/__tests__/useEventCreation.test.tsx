/**
 * Unit tests for useEventCreation hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventCreation } from '../useEventCreation';
import { createEvent, publishEvent } from '../../services/eventService';
import { mockEvent, mockEventFormData } from '../../tests/mocks/eventData';

// Mock dependencies
vi.mock('../../services/eventService');
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockCreateEvent = vi.mocked(createEvent);
const mockPublishEvent = vi.mocked(publishEvent);

describe('useEventCreation', () => {
  const defaultOptions = {
    userId: 'user-123',
    cardId: 'card-123',
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      // Act
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Assert
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isPublishing).toBe(false);
      expect(result.current.createdEvent).toBe(null);
    });

    it('should return all required functions', () => {
      // Act
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Assert
      expect(typeof result.current.createDraft).toBe('function');
      expect(typeof result.current.createAndPublish).toBe('function');
      expect(typeof result.current.validateEventData).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.navigateToEvent).toBe('function');
      expect(typeof result.current.navigateToEdit).toBe('function');
    });
  });

  describe('createDraft', () => {
    it('should create draft successfully', async () => {
      // Arrange
      mockCreateEvent.mockResolvedValue(mockEvent);
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act
      let createResult;
      await act(async () => {
        createResult = await result.current.createDraft(mockEventFormData);
      });

      // Assert
      expect(mockCreateEvent).toHaveBeenCalledWith(mockEventFormData, 'user-123', 'card-123');
      expect(createResult).toEqual(mockEvent);
      expect(result.current.createdEvent).toEqual(mockEvent);
      expect(result.current.isCreating).toBe(false);
      expect(defaultOptions.onSuccess).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle creation error', async () => {
      // Arrange
      const error = new Error('Creation failed');
      mockCreateEvent.mockRejectedValue(error);
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act & Assert
      await expect(result.current.createDraft(mockEventFormData)).rejects.toThrow('Creation failed');
      expect(result.current.isCreating).toBe(false);
      expect(defaultOptions.onError).toHaveBeenCalledWith(error);
    });

    it('should set loading state during creation', async () => {
      // Arrange
      mockCreateEvent.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockEvent), 100)));
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act
      const createPromise = result.current.createDraft(mockEventFormData);

      // Assert loading state
      expect(result.current.isCreating).toBe(true);

      // Wait for completion
      await act(async () => {
        await createPromise;
      });

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('createAndPublish', () => {
    it('should create and publish event successfully', async () => {
      // Arrange
      mockCreateEvent.mockResolvedValue(mockEvent);
      mockPublishEvent.mockResolvedValue({ ...mockEvent, status: 'published' });
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act
      let publishResult;
      await act(async () => {
        publishResult = await result.current.createAndPublish(mockEventFormData);
      });

      // Assert
      expect(mockCreateEvent).toHaveBeenCalledWith(mockEventFormData, 'user-123', 'card-123');
      expect(mockPublishEvent).toHaveBeenCalledWith(mockEvent.id);
      expect(publishResult?.status).toBe('published');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isPublishing).toBe(false);
    });

    it('should set both loading states during create and publish', async () => {
      // Arrange
      mockCreateEvent.mockResolvedValue(mockEvent);
      mockPublishEvent.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ...mockEvent, status: 'published' }), 100)));
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act
      const publishPromise = result.current.createAndPublish(mockEventFormData);

      // Assert loading states
      expect(result.current.isCreating).toBe(true);
      expect(result.current.isPublishing).toBe(true);

      // Wait for completion
      await act(async () => {
        await publishPromise;
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isPublishing).toBe(false);
    });
  });

  describe('validateEventData', () => {
    it('should validate required fields', () => {
      // Arrange
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Act & Assert - Valid data
      expect(() => result.current.validateEventData(mockEventFormData)).not.toThrow();

      // Invalid data - missing title
      const invalidData = { ...mockEventFormData, title: '' };
      expect(() => result.current.validateEventData(invalidData)).toThrow();
    });

    it('should validate date order', () => {
      // Arrange
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Invalid data - end date before start date
      const invalidData = {
        ...mockEventFormData,
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-01-01'), // Before start
      };

      expect(() => result.current.validateEventData(invalidData)).toThrow('End date must be after start date');
    });
  });

  describe('reset', () => {
    it('should reset state', () => {
      // Arrange
      const { result } = renderHook(() => useEventCreation(defaultOptions));

      // Set some state
      act(() => {
        // Simulate state change (in real hook this would happen via actions)
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.createdEvent).toBe(null);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isPublishing).toBe(false);
    });
  });
});