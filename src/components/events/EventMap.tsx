/**
 * EventMap Component
 * Displays events on an interactive Google Map
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  LazyMap,
  LazyMarker,
  LazyInfoWindow,
  LazyDirectionsRenderer,
} from '@/components/LazyMap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Route, X } from 'lucide-react';
import { useEventMap } from '@/hooks/useEventMap';
import type { Event } from '@/types/events';
import { format } from 'date-fns';

interface EventMapProps {
  events?: Event[];
  center?: {
    latitude: number;
    longitude: number;
  };
  zoom?: number;
  onEventSelect?: (event: Event) => void;
  showControls?: boolean;
  height?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export const EventMap: React.FC<EventMapProps> = ({
  events: propEvents,
  center,
  zoom = 12,
  onEventSelect,
  showControls = true,
  height = '600px',
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // useLoadScript removed as LazyMap handles it

  const {
    events: hookEvents,
    getUserLocation,
    isLoading,
  } = useEventMap({
    initialCenter: center,
    autoLoad: !propEvents && !!center,
  });

  const events = propEvents || hookEvents;

  const mapCenter = useMemo(() => {
    if (center) {
      return { lat: center.latitude, lng: center.longitude };
    }
    return { lat: 40, lng: -74 }; // Default to NYC area
  }, [center]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setDirectionsService(new google.maps.DirectionsService());

    // Fit bounds to show all markers
    if (events && events.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      events.forEach((event) => {
        if (event.latitude && event.longitude) {
          bounds.extend({ lat: Number(event.latitude), lng: Number(event.longitude) });
        }
      });

      if (events.length === 1) {
        map.setCenter({ lat: Number(events[0].latitude), lng: Number(events[0].longitude) });
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [events]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (event: Event) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
  };

  const handleLocateMe = async () => {
    try {
      const location = await getUserLocation();
      const userPos = { lat: location.latitude, lng: location.longitude };
      setUserLocation(userPos);

      if (map) {
        map.panTo(userPos);
        map.setZoom(14);
      }
    } catch (error) {
      console.error('Failed to get user location:', error);
    }
  };

  const handleGetDirections = useCallback(async (event: Event) => {
    if (!directionsService || !event.latitude || !event.longitude) return;

    // Try to get user location first
    let origin: { lat: number; lng: number };

    if (userLocation) {
      origin = userLocation;
    } else {
      try {
        const location = await getUserLocation();
        origin = { lat: location.latitude, lng: location.longitude };
        setUserLocation(origin);
      } catch (error) {
        alert('Unable to get your location. Please enable location services.');
        return;
      }
    }

    const destination = { lat: event.latitude, lng: event.longitude };

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
          setShowDirections(true);
        } else {
          console.error('Directions request failed:', status);
          alert('Unable to calculate directions. Please try again.');
        }
      }
    );
  }, [directionsService, userLocation, getUserLocation]);

  // loadError and isLoaded conditions handled by LazyMap internally

  return (
    <div className="relative">
      {showControls && (
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Button
            onClick={handleLocateMe}
            disabled={isLoading}
            variant="secondary"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white rounded-xl"
          >
            <Navigation className="h-4 w-4 mr-2" />
            My Location
          </Button>
          {showDirections && (
            <Button
              onClick={() => {
                setShowDirections(false);
                setDirections(null);
              }}
              variant="secondary"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Route
            </Button>
          )}
        </div>
      )}

      <div className="rounded-lg overflow-hidden shadow-lg" style={{ height }}>
        <LazyMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={mapCenter}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
        >
          {events?.map((event) => {
            const lat = Number(event.latitude);
            const lng = Number(event.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <LazyMarker
                key={event.id}
                position={{ lat, lng }}
                onClick={() => handleMarkerClick(event)}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 12,
                  fillColor: event.is_free ? '#10b981' : '#8b5cf6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            );
          })}

          {/* Directions */}
          {showDirections && directions && (
            <LazyDirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#8b5cf6',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: false,
              }}
            />
          )}

          {selectedEvent && selectedEvent.latitude && selectedEvent.longitude && (
            <LazyInfoWindow
              position={{
                lat: selectedEvent.latitude,
                lng: selectedEvent.longitude,
              }}
              onCloseClick={() => {
                setSelectedEvent(null);
                setShowDirections(false);
                setDirections(null);
              }}
            >
              <div className="p-3 max-w-xs">
                <h3 className="font-bold text-sm mb-2 text-gray-900">{selectedEvent.title}</h3>
                <p className="text-xs text-gray-600 mb-1">
                  {format(new Date(selectedEvent.start_date), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  {selectedEvent.location_name || 'Location TBD'}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  {selectedEvent.is_free ? (
                    <Badge className="bg-green-500 text-white text-xs rounded-xl">FREE</Badge>
                  ) : (
                    selectedEvent.tickets_config.length > 0 && (
                      <Badge className="bg-purple-500 text-white text-xs rounded-xl">
                        From €{Math.min(...selectedEvent.tickets_config.map((t) => t.price)).toFixed(2)}
                      </Badge>
                    )
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGetDirections(selectedEvent)}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Route className="h-3 w-3 mr-2" />
                  Get Directions
                </Button>
              </div>
            </LazyInfoWindow>
          )}
        </LazyMap>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-lg">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto mb-2" />
            <p className="text-sm">Loading events...</p>
          </div>
        </div>
      )}

      {events && events.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="p-6 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">No Events Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search filters or location
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
