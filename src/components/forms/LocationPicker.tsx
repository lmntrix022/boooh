/**
 * LocationPicker Component
 * 
 * Composant pour sélectionner la localisation (géolocalisation ou saisie manuelle)
 * Extrait de ModernCardForm.tsx pour améliorer la maintenabilité
 */

import React, { useState } from 'react';
import { Target, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface LocationPickerProps {
  value: { latitude: number; longitude: number } | null;
  onChange: (location: { latitude: number; longitude: number } | null) => void;
  onAddressChange: (address: string) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ 
  value, 
  onChange, 
  onAddressChange 
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      const location = { latitude, longitude };
      onChange(location);
      
      try {
        const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const placeName = data.results[0].formatted_address;
            setAddress(placeName);
            onAddressChange(placeName);
          }
        }
      } catch (geocodeError) {
        const coordsText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setAddress(coordsText);
        onAddressChange(coordsText);
      }
      
    } catch (error: any) {
      setError(
        error.code === 1 ? t('editCardForm.location.errors.permissionDenied') :
        error.code === 2 ? t('editCardForm.location.errors.positionUnavailable') :
        error.code === 3 ? t('editCardForm.location.errors.timeout') :
        t('editCardForm.location.errors.generic')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-light text-gray-700"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        {t('editCardForm.location.label')}
      </label>
      
      <div className="space-y-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-sm font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Target className="w-4 h-4" />
          )}
          <span>
            {isLoading ? t('editCardForm.location.detecting') : t('editCardForm.location.useCurrent')}
          </span>
        </button>
        
        {error && (
          <p className="text-sm font-light text-red-600"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >{error}</p>
        )}
        
        {value && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-light text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <strong className="font-light">{t('editCardForm.location.detected')}:</strong> {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-light text-gray-500"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          {t('editCardForm.location.orManual')}
        </label>
        <input
          type="text"
          value={address}
          onChange={handleManualInput}
          placeholder={t('editCardForm.location.placeholder')}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 shadow-sm font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        />
      </div>
    </div>
  );
};

export default LocationPicker;
