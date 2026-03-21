// Hook pour gérer le thème de la carte (sombre/clair/auto)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapTheme, MapConfig } from '../types';

const STORAGE_KEY = 'booh_map_config';

// Styles Google Maps pour le mode sombre
export const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64779e' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#334e87' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#023e58' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#283d6a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6f9ba5' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#023e58' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3C7680' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#98a5be' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c6675' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#255763' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b0d5ce' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#023e58' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#98a5be' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry.fill',
    stylers: [{ color: '#283d6a' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#3a4762' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4e6d70' }],
  },
];

// Styles Google Maps pour le mode clair (minimal)
export const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'on' }],
  },
];

// Configuration par défaut
const DEFAULT_CONFIG: MapConfig = {
  theme: 'auto',
  clustering: true,
  showLabels: true,
  animationsEnabled: true,
};

// Détecter le thème système
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Détecter basé sur l'heure (sombre après 19h, avant 7h)
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? 'dark' : 'light';
}

// Charger la configuration depuis localStorage
function loadConfig(): MapConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Sauvegarder la configuration
function saveConfig(config: MapConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

interface UseMapThemeResult {
  config: MapConfig;
  effectiveTheme: 'light' | 'dark';
  mapStyles: google.maps.MapTypeStyle[];
  setTheme: (theme: MapTheme) => void;
  setClustering: (enabled: boolean) => void;
  setShowLabels: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;
  resetConfig: () => void;
}

export function useMapTheme(): UseMapThemeResult {
  const [config, setConfig] = useState<MapConfig>(loadConfig);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // Écouter les changements du thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Calculer le thème effectif
  const effectiveTheme = useMemo((): 'light' | 'dark' => {
    if (config.theme === 'auto') {
      // Priorité: système > heure
      return systemTheme;
    }
    return config.theme;
  }, [config.theme, systemTheme]);

  // Obtenir les styles de carte
  const mapStyles = useMemo((): google.maps.MapTypeStyle[] => {
    return effectiveTheme === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
  }, [effectiveTheme]);

  // Actions
  const setTheme = useCallback((theme: MapTheme) => {
    setConfig((prev) => ({ ...prev, theme }));
  }, []);

  const setClustering = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, clustering: enabled }));
  }, []);

  const setShowLabels = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, showLabels: enabled }));
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, animationsEnabled: enabled }));
  }, []);

  const toggleTheme = useCallback(() => {
    setConfig((prev) => {
      const themes: MapTheme[] = ['light', 'dark', 'auto'];
      const currentIndex = themes.indexOf(prev.theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      return { ...prev, theme: themes[nextIndex] };
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    effectiveTheme,
    mapStyles,
    setTheme,
    setClustering,
    setShowLabels,
    setAnimationsEnabled,
    toggleTheme,
    resetConfig,
  };
}

// Export des styles pour utilisation directe
export { DEFAULT_CONFIG };

