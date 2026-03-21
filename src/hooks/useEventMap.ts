/**
 * useEventMap Hook
 * Manages event display on the map with clustering and filtering
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getEventsNearLocation, getEvents } from '@/services/eventService';
import type { Event, EventFilters } from '@/types/events';

interface UseEventMapOptions {
  initialCenter?: {
    latitude: number;
    longitude: number;
  };
  initialRadius?: number; // in km
  autoLoad?: boolean;
  filters?: EventFilters;
}

export function useEventMap(options: UseEventMapOptions = {}) {
  const {
    initialCenter,
    initialRadius = 50,
    autoLoad = true,
    filters: initialFilters,
  } = options;

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [center, setCenter] = useState(initialCenter);
  const [radius, setRadius] = useState(initialRadius);
  const [filters, setFilters] = useState<EventFilters | undefined>(initialFilters);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  /**
   * Load events near location
   */
  const loadEventsNearLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      radiusKm: number = radius
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedEvents = await getEventsNearLocation(
          latitude,
          longitude,
          radiusKm
        );

        setEvents(loadedEvents);
        setCenter({ latitude, longitude });
        setRadius(radiusKm);
      } catch (err) {
        console.error('Error loading events near location:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [radius]
  );

  /**
   * Load events with filters
   */
  const loadEventsWithFilters = useCallback(
    async (customFilters?: EventFilters): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const filterToUse = customFilters || filters;
        const result = await getEvents(filterToUse, undefined, 1, 100);

        // Filter to only show events with location
        const eventsWithLocation = result.events.filter(
          (event) => event.latitude && event.longitude
        );

        setEvents(eventsWithLocation);
        if (customFilters) {
          setFilters(customFilters);
        }
      } catch (err) {
        console.error('Error loading events with filters:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  /**
   * Reload events with current settings
   */
  const reload = useCallback(async (): Promise<void> => {
    if (center) {
      await loadEventsNearLocation(center.latitude, center.longitude, radius);
    } else if (filters) {
      await loadEventsWithFilters(filters);
    }
  }, [center, radius, filters, loadEventsNearLocation, loadEventsWithFilters]);

  /**
   * Update map center and reload
   */
  const updateCenter = useCallback(
    async (latitude: number, longitude: number): Promise<void> => {
      await loadEventsNearLocation(latitude, longitude, radius);
    },
    [radius, loadEventsNearLocation]
  );

  /**
   * Update radius and reload
   */
  const updateRadius = useCallback(
    async (radiusKm: number): Promise<void> => {
      if (center) {
        await loadEventsNearLocation(center.latitude, center.longitude, radiusKm);
      }
    },
    [center, loadEventsNearLocation]
  );

  /**
   * Update filters and reload
   */
  const updateFilters = useCallback(
    async (newFilters: EventFilters): Promise<void> => {
      await loadEventsWithFilters(newFilters);
    },
    [loadEventsWithFilters]
  );

  /**
   * Get user's current location
   */
  const getUserLocation = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }, []);

  /**
   * Center map on user's location
   */
  const centerOnUserLocation = useCallback(async (): Promise<void> => {
    try {
      const location = await getUserLocation();
      await loadEventsNearLocation(location.latitude, location.longitude, radius);
    } catch (err) {
      console.error('Error getting user location:', err);
      setError(err as Error);
    }
  }, [radius, getUserLocation, loadEventsNearLocation]);

  /**
   * Select event on map
   */
  const selectEvent = useCallback((event: Event | null): void => {
    setSelectedEvent(event);
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback((): void => {
    setSelectedEvent(null);
  }, []);

  /**
   * Get event clusters for better map performance
   */
  const getEventClusters = useCallback(() => {
    // Group nearby events (simple clustering)
    const clusters: Array<{
      latitude: number;
      longitude: number;
      events: Event[];
      count: number;
    }> = [];

    const clusterRadius = 0.01; // ~1km

    events.forEach((event) => {
      if (!event.latitude || !event.longitude) return;

      // Find existing cluster nearby
      const nearbyCluster = clusters.find((cluster) => {
        const latDiff = Math.abs(cluster.latitude - event.latitude!);
        const lonDiff = Math.abs(cluster.longitude - event.longitude!);
        return latDiff <= clusterRadius && lonDiff <= clusterRadius;
      });

      if (nearbyCluster) {
        nearbyCluster.events.push(event);
        nearbyCluster.count++;
        // Update cluster center (average)
        nearbyCluster.latitude =
          nearbyCluster.events.reduce((sum, e) => sum + (e.latitude || 0), 0) /
          nearbyCluster.events.length;
        nearbyCluster.longitude =
          nearbyCluster.events.reduce((sum, e) => sum + (e.longitude || 0), 0) /
          nearbyCluster.events.length;
      } else {
        clusters.push({
          latitude: event.latitude,
          longitude: event.longitude,
          events: [event],
          count: 1,
        });
      }
    });

    return clusters;
  }, [events]);

  /**
   * Get bounds for all events
   */
  const getEventsBounds = useCallback(() => {
    if (events.length === 0) return null;

    const validEvents = events.filter((e) => e.latitude && e.longitude);
    if (validEvents.length === 0) return null;

    const latitudes = validEvents.map((e) => e.latitude!);
    const longitudes = validEvents.map((e) => e.longitude!);

    return {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    };
  }, [events]);

  // Stabilize initialCenter and initialFilters to prevent infinite re-renders
  const stableInitialCenter = useMemo(() => {
    if (!initialCenter) return null;
    return { latitude: initialCenter.latitude, longitude: initialCenter.longitude };
  }, [initialCenter?.latitude, initialCenter?.longitude]);
  
  const stableInitialFilters = useMemo(() => {
    if (!initialFilters) return null;
    return initialFilters;
  }, [initialFilters ? JSON.stringify(initialFilters) : null]);

  // Auto-load on mount if enabled (only once)
  const hasAutoLoadedRef = useRef(false);
  useEffect(() => {
    if (!autoLoad || hasAutoLoadedRef.current) return;
    
    if (stableInitialCenter) {
      loadEventsNearLocation(
        stableInitialCenter.latitude,
        stableInitialCenter.longitude,
        initialRadius
      );
      hasAutoLoadedRef.current = true;
    } else if (stableInitialFilters) {
      loadEventsWithFilters(stableInitialFilters);
      hasAutoLoadedRef.current = true;
    }
  }, [autoLoad, stableInitialCenter, stableInitialFilters, initialRadius, loadEventsNearLocation, loadEventsWithFilters]);

  return {
    // Data
    events,
    selectedEvent,
    center,
    radius,
    filters,

    // State
    isLoading,
    error,

    // Actions
    loadEventsNearLocation,
    loadEventsWithFilters,
    reload,
    updateCenter,
    updateRadius,
    updateFilters,
    getUserLocation,
    centerOnUserLocation,
    selectEvent,
    clearSelection,

    // Utilities
    getEventClusters,
    getEventsBounds,
  };
}
