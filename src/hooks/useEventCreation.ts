/**
 * useEventCreation Hook
 * Manages event creation workflow with validation and state management
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, publishEvent } from '@/services/eventService';
import { useToast } from '@/hooks/use-toast';
import type { EventFormData, Event } from '@/types/events';

interface UseEventCreationOptions {
  userId: string;
  cardId?: string;
  onSuccess?: (event: Event) => void;
  onError?: (error: Error) => void;
}

export function useEventCreation(options: UseEventCreationOptions) {
  const { userId, cardId, onSuccess, onError } = options;
  const [isCreating, setIsCreating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Create event as draft
   */
  const createDraft = async (formData: EventFormData): Promise<Event | null> => {
    setIsCreating(true);

    try {
      // Validate form data
      validateEventData(formData);

      // Create event
      const event = await createEvent(formData, userId, cardId);

      setCreatedEvent(event);
      onSuccess?.(event);

      toast({
        title: 'Event Created',
        description: 'Your event has been saved as a draft.',
      });

      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      const errorObj = error as Error;

      onError?.(errorObj);

      toast({
        title: 'Error',
        description: errorObj.message || 'Failed to create event',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Create and publish event immediately
   */
  const createAndPublish = async (
    formData: EventFormData
  ): Promise<Event | null> => {
    setIsCreating(true);
    setIsPublishing(true);

    try {
      // Validate form data
      validateEventData(formData);

      // Create event as draft first
      const event = await createEvent(formData, userId, cardId);

      // Then publish it
      const publishedEvent = await publishEvent(event.id);

      setCreatedEvent(publishedEvent);
      onSuccess?.(publishedEvent);

      toast({
        title: 'Event Published',
        description: 'Your event has been created and published successfully.',
      });

      return publishedEvent;
    } catch (error) {
      console.error('Error creating and publishing event:', error);
      const errorObj = error as Error;

      onError?.(errorObj);

      toast({
        title: 'Error',
        description: errorObj.message || 'Failed to create and publish event',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsCreating(false);
      setIsPublishing(false);
    }
  };

  /**
   * Validate event data
   */
  const validateEventData = (formData: EventFormData): void => {
    if (!formData.title || formData.title.trim().length === 0) {
      throw new Error('Event title is required');
    }

    if (!formData.event_type) {
      throw new Error('Event type is required');
    }

    if (!formData.start_date) {
      throw new Error('Start date is required');
    }

    if (!formData.end_date) {
      throw new Error('End date is required');
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate physical event has location
    if (
      (formData.event_type === 'physical' || formData.event_type === 'hybrid') &&
      !formData.location_address
    ) {
      throw new Error('Physical events require a location address');
    }

    // Validate paid event has ticket config
    if (!formData.is_free && (!formData.tickets_config || formData.tickets_config.length === 0)) {
      throw new Error('Paid events require at least one ticket tier configuration');
    }

    // Validate max capacity
    if (formData.max_capacity && formData.max_capacity < 1) {
      throw new Error('Maximum capacity must be at least 1');
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setCreatedEvent(null);
    setIsCreating(false);
    setIsPublishing(false);
  };

  /**
   * Navigate to event detail
   */
  const navigateToEvent = (eventId?: string) => {
    const id = eventId || createdEvent?.id;
    if (id) {
      navigate(`/events/${id}`);
    }
  };

  /**
   * Navigate to event edit
   */
  const navigateToEdit = (eventId?: string) => {
    const id = eventId || createdEvent?.id;
    if (id) {
      navigate(`/events/${id}/edit`);
    }
  };

  return {
    // State
    isCreating,
    isPublishing,
    createdEvent,

    // Actions
    createDraft,
    createAndPublish,
    validateEventData,
    reset,

    // Navigation
    navigateToEvent,
    navigateToEdit,
  };
}
