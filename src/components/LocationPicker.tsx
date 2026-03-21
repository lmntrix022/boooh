import { useState, useCallback, useEffect } from "react";
import { LazyMap, LazyMarker, LazyAutocomplete } from '@/components/LazyMap';
import { MapPin, Navigation, Search } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number } | null;
  onLocationChange: (location: { latitude: number; longitude: number } | null) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
}

export function LocationPicker({
  initialLocation,
  onLocationChange,
  onAddressChange,
  className
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(initialLocation || null);
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [center, setCenter] = useState({
    lat: initialLocation?.latitude || 0.4162,
    lng: initialLocation?.longitude || 9.4673
  });
  const [zoom, setZoom] = useState(11);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  // Geocoding: obtenir l'adresse depuis les coordonnées
  const geocodeLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);
        onAddressChange?.(formattedAddress);
        return formattedAddress;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }, [onAddressChange]);

  // Mettre à jour l'adresse quand la localisation change
  useEffect(() => {
    if (selectedLocation) {
      geocodeLocation(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation, geocodeLocation]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newLocation = {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      onLocationChange(newLocation);
      setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
      geocodeLocation(newLocation.latitude, newLocation.longitude);
    }
  }, [onLocationChange, geocodeLocation]);

  const handleMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newLocation = {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      onLocationChange(newLocation);
      geocodeLocation(newLocation.latitude, newLocation.longitude);
    }
  }, [onLocationChange, geocodeLocation]);

  const handleGeolocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setSelectedLocation(newLocation);
          onLocationChange(newLocation);
          setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
          setZoom(13);
          geocodeLocation(newLocation.latitude, newLocation.longitude);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }, [onLocationChange, geocodeLocation]);

  // Gérer la sélection depuis l'autocomplete
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newLocation = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        };
        setSelectedLocation(newLocation);
        onLocationChange(newLocation);
        setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
        setZoom(15);
        if (place.formatted_address) {
          setAddress(place.formatted_address);
          setSearchAddress(place.formatted_address);
          onAddressChange?.(place.formatted_address);
        }
      }
    }
  }, [autocomplete, onLocationChange, onAddressChange]);

  const clearLocation = () => {
    setSelectedLocation(null);
    onLocationChange(null);
  };

  // isLoaded condition passed to Autocomplete render

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Localisation exacte</h3>
          <p className="text-xs text-gray-500">
            Recherchez une adresse ou cliquez sur la carte pour définir les coordonnées
          </p>
        </div>

        {selectedLocation && (
          <button
            type="button"
            onClick={clearLocation}
            className="text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Recherche d'adresse avec Autocomplete */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isLoaded ? (
          <LazyAutocomplete
            onLoad={(autocomplete) => setAutocomplete(autocomplete)}
            onPlaceChanged={onPlaceChanged}
          >
            <Input
              type="text"
              placeholder="Rechercher une adresse..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="pl-10"
            />
          </LazyAutocomplete>
        ) : (
          <Input
            type="text"
            placeholder="Chargement de la recherche..."
            disabled
            className="pl-10 bg-gray-50"
          />
        )}
      </div>

      <div className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-purple-200 shadow-lg relative">
        <LazyMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onClick={handleMapClick}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={['places']}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true
          }}
        >
          {selectedLocation && (
            <LazyMarker
              position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              icon={{
                url: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#9333EA" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="9" r="3" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: typeof google !== 'undefined' && google.maps ? new google.maps.Size(32, 32) : undefined,
                anchor: typeof google !== 'undefined' && google.maps ? new google.maps.Point(16, 32) : undefined
              }}
            />
          )}
        </LazyMap>

        <button
          type="button"
          onClick={handleGeolocate}
          className="absolute top-3 right-3 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors z-10"
        >
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">Ma position</span>
        </button>
      </div>

      {selectedLocation && (
        <div className="space-y-2">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 mb-2">
              <MapPin className="w-4 h-4" />
              Coordonnées sélectionnées
            </div>
            <p className="text-sm text-gray-700 font-mono">
              {selectedLocation.latitude != null ? selectedLocation.latitude.toFixed(6) : '0.000000'}, {selectedLocation.longitude != null ? selectedLocation.longitude.toFixed(6) : '0.000000'}
            </p>
            {address && (
              <p className="text-sm text-gray-600 mt-2">
                {address}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <MapPin className="w-3 h-3" />
        <span>Recherchez une adresse, utilisez la géolocalisation ou cliquez directement sur la carte</span>
      </div>
    </div>
  );
} 
