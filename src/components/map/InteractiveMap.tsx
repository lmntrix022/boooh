import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { LazyMap, LazyMarker, LazyInfoWindow } from '@/components/LazyMap';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, ExternalLink, Search, Layers, Filter, ChevronDown, Mail, Send, Heart, HeartOff, X, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import debounce from 'lodash/debounce';
import { OptimizedImage } from '@/components/utils/OptimizedImage';
import { usePremiumToast } from '@/hooks/usePremiumToast';
import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';
import { SkeletonLoader } from './SkeletonLoader';
import { MapOnboarding } from './MapOnboarding';
import { PremiumFiltersPanel } from './PremiumFiltersPanel';
import { MapStatsPanel } from './MapStatsPanel';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_STYLES } from '@/lib/constants';

// Types
interface BusinessCard {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  avatar_url?: string;
  business_sector?: string;
  company?: string;
  tags?: string[];
  created_at: string;
}

interface MapFilters {
  search: string;
  business_sector?: string;
  tags?: string[];
  sortBy?: string;
  maxDistance?: number;
  dateRange?: 'all' | 'week' | 'month' | 'year';
  sortByPopularity?: boolean;
}

const BUSINESS_SECTORS = [
  'Services',
  'Commerce',
  'Artisanat',
  'Santé',
  'Education',
  'Art et Culture',
  'Technologies',
  'Finance',
  'Immobilier',
  'Restauration',
  'Tourisme',
  'Transport'
];

const BUSINESS_TAGS = [
  'Startup',
  'PME',
  'Grande Entreprise',
  'Freelance',
  'International',
  'Local',
  'B2B',
  'B2C',
  'Innovation',
  'Eco-responsable'
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'recent', label: 'Plus récent' }
];

const MAP_STYLES = [
  { id: 'default', name: 'Rues', mapTypeId: 'roadmap' as google.maps.MapTypeId },
  { id: 'satellite', name: 'Satellite', mapTypeId: 'satellite' as google.maps.MapTypeId },
  { id: 'hybrid', name: 'Hybride', mapTypeId: 'hybrid' as google.maps.MapTypeId },
  { id: 'terrain', name: 'Terrain', mapTypeId: 'terrain' as google.maps.MapTypeId },
];

// Fonction utilitaire pour résoudre l'URL de l'avatar
function getAvatarUrl(avatar_url?: string): string {
  if (!avatar_url || avatar_url.trim() === '') {
    return '/placeholder.svg'; // Fallback local (mets le chemin de ton vrai placeholder si besoin)
  }
  if (avatar_url.startsWith('http://') || avatar_url.startsWith('https://')) {
    return avatar_url;
  }
  if (avatar_url.startsWith('/')) {
    return window.location.origin + avatar_url;
  }
  return '/placeholder.svg';
}

// Composant Marker avec icône asynchrone
const MarkerWithIcon: React.FC<{
  position: { lat: number; lng: number };
  onClick: () => void;
  avatarUrl?: string;
  name: string;
  isSelected: boolean;
  createMarkerIcon: (avatarUrl: string | undefined, name: string, isSelected: boolean) => Promise<google.maps.Icon | undefined>;
  zIndex: number;
  animation?: google.maps.Animation;
  children?: React.ReactNode;
}> = ({ position, onClick, avatarUrl, name, isSelected, createMarkerIcon, zIndex, animation, children }) => {
  const [icon, setIcon] = useState<google.maps.Icon | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    createMarkerIcon(avatarUrl, name, isSelected).then((newIcon) => {
      if (!cancelled) {
        setIcon(newIcon);
      }
    }).catch((error) => {
      console.error('Erreur lors de la création de l\'icône:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [avatarUrl, name, isSelected, createMarkerIcon]);

  if (!icon) return null;

  return (
    <LazyMarker
      position={position}
      onClick={onClick}
      icon={icon}
      visible={true}
      zIndex={zIndex}
      title={name}
      animation={animation}
      options={{
        optimized: true
      }}
    >
      {children}
    </LazyMarker>
  );
};

const CustomMarker: React.FC<{ onClick: () => void; avatar?: string; name: string; isSelected?: boolean }> = ({
  onClick,
  avatar,
  name,
  isSelected
}) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={isSelected ? { scale: [1, 1.2, 1], y: [0, -8, 0], opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut'
      }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <div className={`relative w-12 h-12 transition-all duration-300 ${isSelected ? 'scale-125' : ''}`}>
          {/* Halo/glow effect - plus visible */}
          <div className={`absolute -inset-2 rounded-full blur-md opacity-90 animate-pulse
            ${isSelected ? 'bg-gradient-to-r from-blue-400/80 to-purple-400/80' : 'bg-gradient-to-r from-blue-500/60 to-purple-500/60'}`} />
          {/* Cercle de fond avec effet glassy - plus opaque et bordure marquée */}
          <div className={`absolute inset-0 rounded-full backdrop-blur-sm border-4 shadow-xl
            ${isSelected
              ? 'bg-white border-blue-500 shadow-blue-200/80'
              : 'bg-white border-blue-400 shadow-lg'
            }`} />
          {/* Avatar optimisé ou fallback initiales */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-lg">
              {getAvatarUrl(avatar) && !getAvatarUrl(avatar).includes('placeholder') ? (
                <img src={getAvatarUrl(avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-black flex items-center justify-center text-white text-xs font-bold">
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
            </div>
          </div>
          {/* Indicateur de position avec animation - plus visible */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full shadow-lg border-2 border-white
                ${isSelected ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} />
              <div className={`absolute -inset-3 bg-gradient-to-r from-blue-400/70 to-purple-400/70 rounded-full animate-ping
                ${isSelected ? 'opacity-90' : 'opacity-60'}`} />
            </div>
          </div>
        </div>
        {/* Ombre portée améliorée */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black/30 blur-sm rounded-full" />
      </div>
    </motion.div>
  );
};

// Hook custom pour favoris et recherches sauvegardées
function useMapFavorites() {
  const FAVORITES_KEY = 'map_favorites';
  const SEARCHES_KEY = 'map_saved_searches';
  const [favorites, setFavorites] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [savedSearches, setSavedSearches] = React.useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const addFavorite = (id: string) => {
    if (!favorites.includes(id)) {
      const updated = [...favorites, id];
      setFavorites(updated);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  };
  const removeFavorite = (id: string) => {
    const updated = favorites.filter(fav => fav !== id);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };
  const isFavorite = (id: string) => favorites.includes(id);
  const saveSearch = (search: any) => {
    const updated = [...savedSearches, search];
    setSavedSearches(updated);
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(updated));
  };
  return { favorites, addFavorite, removeFavorite, isFavorite, savedSearches, saveSearch, setSavedSearches };
}

// Badges et gamification
const BADGES = [
  { id: 'discoverer', label: 'Découvreur', condition: (count) => count >= 1, description: 'A visité son premier pro.' },
  { id: 'superfan', label: 'Super fan', condition: (count) => count >= 5, description: 'A visité 5 pros.' },
  { id: 'globetrotter', label: 'Globe-trotter', condition: (count) => count >= 10, description: 'A visité 10 pros.' },
  { id: 'explorer', label: 'Explorateur de zones', condition: (zones) => zones.length >= 3, description: 'A découvert 3 villes différentes.' }
];

function useGamification() {
  const VISITED_KEY = 'map_visited_pros';
  const ZONES_KEY = 'map_discovered_zones';
  const [visited, setVisited] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'); } catch { return []; }
  });
  const [zones, setZones] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ZONES_KEY) || '[]'); } catch { return []; }
  });
  const addVisited = (id: string) => {
    if (!visited.includes(id)) {
      const updated = [...visited, id];
      setVisited(updated);
      localStorage.setItem(VISITED_KEY, JSON.stringify(updated));
    }
  };
  const addZone = (zone: string) => {
    if (!zones.includes(zone)) {
      const updated = [...zones, zone];
      setZones(updated);
      localStorage.setItem(ZONES_KEY, JSON.stringify(updated));
    }
  };
  return { visited, addVisited, zones, addZone };
}

const MAP_STYLE_KEY = 'map_style_default';
const MAP_VIEWPORT_KEY = 'map_last_viewport';

const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  willChange: 'transform',
  transform: 'translateZ(0)'
};

export const InteractiveMap: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState({
    lat: 0.4162,
    lng: 9.4673
  });
  const [zoom, setZoom] = useState(8);

  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [mapStyle, setMapStyle] = useState<google.maps.MapTypeId>(MAP_STYLES[0].mapTypeId);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // useJsApiLoader removed as LazyMap handles it

  const [filters, setFilters] = useState<MapFilters>({
    search: '',
    business_sector: undefined,
    tags: [],
    sortBy: 'distance',
    maxDistance: undefined,
    dateRange: 'all',
    sortByPopularity: false
  });

  const { data: businessCards = [] } = useQuery({
    queryKey: ['users-map', filters],
    queryFn: async () => {
      let query = supabase
        .from('business_cards')
        .select('id, name, latitude, longitude, city, avatar_url, business_sector, company, custom_fields')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Filtre de recherche textuelle globale
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,city.ilike.%${filters.search}%,business_sector.ilike.%${filters.search}%`);
      }

      // Filtre par secteur d'activité
      if (filters.business_sector) {
        query = query.eq('business_sector', filters.business_sector);
      }

      const { data, error } = await query;

      if (error) {
        // Error log removed
        return [];
      }

      // Filtrage côté client pour les tags et recherche globale dans les champs personnalisés
      let filteredData = data.map(item => {
        const card = item as any;
        return {
          ...card,
          created_at: card.created_at || new Date().toISOString()
        } as BusinessCard;
      });

      // Recherche globale dans tous les champs si une recherche est active
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();

        // Recherche dans les champs personnalisés pour tous les résultats
        const dataWithCustomSearch = data.filter(card => {
          const customFields = (card as any).custom_fields;
          if (!customFields) return false;

          // Recherche dans tous les champs personnalisés
          const searchableFields = [
            customFields.title,
            customFields.description,
            customFields.phone,
            customFields.email,
            customFields.website,
            customFields.address,
            customFields.bio,
            customFields.skills?.join(' '),
            customFields.services?.join(' '),
            customFields.products?.join(' '),
            customFields.social_links?.join(' '),
            customFields.education?.join(' '),
            customFields.experience?.join(' '),
            customFields.certifications?.join(' '),
            customFields.languages?.join(' '),
            customFields.interests?.join(' '),
            customFields.awards?.join(' '),
            customFields.publications?.join(' '),
            customFields.projects?.join(' '),
            customFields.testimonials?.join(' '),
            customFields.portfolio?.join(' '),
            customFields.contact_info?.join(' '),
            customFields.additional_info?.join(' ')
          ].filter(Boolean).join(' ').toLowerCase();

          return searchableFields.includes(searchTerm);
        }).map(item => {
          const card = item as any;
          return {
            ...card,
            created_at: card.created_at || new Date().toISOString()
          } as BusinessCard;
        });

        // Recherche dans les tags
        const dataWithTagSearch = data.filter(card => {
          const customFields = (card as any).custom_fields;
          const cardTags = customFields?.skills || [];

          return cardTags.some((tag: string) =>
            tag.toLowerCase().includes(searchTerm)
          );
        }).map(item => {
          const card = item as any;
          return {
            ...card,
            created_at: card.created_at || new Date().toISOString()
          } as BusinessCard;
        });

        // Combiner tous les résultats de recherche (base + champs personnalisés + tags)
        const allSearchResults = [...filteredData, ...dataWithCustomSearch, ...dataWithTagSearch];

        // Supprimer les doublons basés sur l'ID
        const uniqueResults = allSearchResults.filter((card, index, self) =>
          index === self.findIndex(c => c.id === card.id)
        );

        filteredData = uniqueResults;
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredData = filteredData.filter(card => {
          const customFields = (card as any).custom_fields;
          const cardTags = customFields?.skills || [];
          return filters.tags!.some(tag =>
            cardTags.some((cardTag: string) =>
              cardTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
        });
      }

      // Filtrage par distance si l'utilisateur a une position
      if (filters.maxDistance && userLocation) {
        filteredData = filteredData.filter(card => {
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            card.latitude,
            card.longitude
          );
          return distance <= filters.maxDistance!;
        });
      }

      return filteredData;
    }
  });

  const { favorites, addFavorite, removeFavorite, isFavorite, savedSearches, saveSearch, setSavedSearches } = useMapFavorites();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const { visited, addVisited, zones, addZone } = useGamification();

  const handleMarkerClick = useCallback((card: BusinessCard) => {
    setSelectedCard(card);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: card.latitude, lng: card.longitude });
      const currentZoom = mapRef.current.getZoom() || 8;
      if (currentZoom < 12) {
        mapRef.current.setZoom(12);
      }
    }
    addVisited(card.id);
    if (card.city) addZone(card.city);
  }, [addVisited, addZone]);

  const handleViewCard = useCallback((cardId: string) => {
    navigate(`/card/${cardId}`);
  }, [navigate]);

  const handleSearchChange = debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300);

  const handleFitBounds = useCallback(() => {
    if (businessCards.length === 0 || !mapRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    businessCards.forEach(card => {
      bounds.extend({ lat: card.latitude, lng: card.longitude });
    });

    mapRef.current.fitBounds(bounds, 50);
  }, [businessCards]);

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fonction pour trier et filtrer les résultats
  const filteredAndSortedCards = useMemo(() => {
    let results = [...businessCards];

    // Filtrage par date
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      results = results.filter(card => {
        const cardDate = new Date(card.created_at);
        return cardDate >= cutoffDate;
      });
    }

    // Tri des résultats
    if (filters.sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'recent') {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'distance' && userLocation) {
      results.sort((a, b) => {
        const distanceA = calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude);
        const distanceB = calculateDistance(userLocation[0], userLocation[1], b.latitude, b.longitude);
        return distanceA - distanceB;
      });
    }

    // Tri par popularité (basé sur la date de création - plus récent = plus populaire)
    if (filters.sortByPopularity) {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return results;
  }, [businessCards, filters, userLocation]);

  // Filtrage favoris
  const displayedCards = useMemo(() => {
    if (showOnlyFavorites) {
      return filteredAndSortedCards.filter(card => isFavorite(card.id));
    }
    return filteredAndSortedCards;
  }, [filteredAndSortedCards, showOnlyFavorites, isFavorite]);

  // Gérer la géolocalisation de l'utilisateur
  const handleUserLocation = useCallback((position: GeolocationPosition) => {
    setUserLocation([position.coords.latitude, position.coords.longitude]);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleUserLocation);
    }
  }, [handleUserLocation]);

  const [showSearch, setShowSearch] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [measuringDistance, setMeasuringDistance] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<google.maps.LatLng[]>([]);
  const popoverLayersRef = useRef<HTMLButtonElement>(null);

  const handleGoToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo({ lat: userLocation[0], lng: userLocation[1] });
      mapRef.current.setZoom(13);
    }
  };

  // Handlers pour les nouvelles fonctionnalités
  const handleMeasureDistance = () => {
    setMeasuringDistance(!measuringDistance);
    if (measuringDistance) {
      setMeasurePoints([]);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleShare = () => {
    // Géré par MapControlsPanel
  };

  const handleExport = () => {
    // Géré par MapControlsPanel
  };

  // Gestion du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Ajout de l'état local pour la saisie de recherche
  const [searchInput, setSearchInput] = useState('');

  // Affichage direct des marqueurs sans clustering - optimisé avec mémorisation
  // DOIT être défini avant les useEffect qui l'utilisent
  const markers = useMemo(() => {
    const validCards = businessCards.filter(card =>
      card.latitude &&
      card.longitude &&
      !isNaN(card.latitude) &&
      !isNaN(card.longitude) &&
      card.latitude >= -90 &&
      card.latitude <= 90 &&
      card.longitude >= -180 &&
      card.longitude <= 180
    );

    return validCards.map(card => ({
      type: 'Feature',
      properties: { cluster: false, cardId: card.id, ...card },
      geometry: { type: 'Point', coordinates: [card.longitude, card.latitude] }
    }));
  }, [businessCards]);

  // Fonction pour charger une image et la convertir en base64
  const loadImageAsBase64 = useCallback((url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  const createMarkerIcon = useCallback(async (avatarUrl: string | undefined, name: string, isSelected: boolean = false): Promise<google.maps.Icon | undefined> => {
    // Check if google is available (might be loaded lazily)
    if (typeof google === 'undefined' || !google.maps) return undefined;

    try {
      const size = isSelected ? 72 : 64;
      const avatarSize = isSelected ? 48 : 42;
      const borderWidth = 0.5; // Bordure fine fixe

      // Scale factor pour améliorer la qualité de l'image (2x pour retina)
      const scale = 2;
      const displaySize = size;
      const canvasSize = size * scale;

      const avatarImg = getAvatarUrl(avatarUrl);
      const hasAvatar = avatarImg && !avatarImg.includes('placeholder');
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      // Créer un canvas haute résolution pour dessiner le marqueur
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      // Activer l'anti-aliasing pour une meilleure qualité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Mettre à l'échelle le contexte pour le rendu haute résolution
      ctx.scale(scale, scale);

      // Fond transparent
      ctx.clearRect(0, 0, displaySize, displaySize);

      // Ombre portée subtile circulaire (pas de flèche)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Cercle externe avec couleur principale du design system (blue-600)
      // Réduire l'épaisseur du cercle bleu en augmentant le rayon
      const primaryColor = isSelected ? '#1D4ED8' : '#2563EB'; // blue-700 si sélectionné, blue-600 sinon
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2 / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Réinitialiser l'ombre pour la bordure
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Bordure blanche très fine (design system - border-white)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1; // Bordure très fine
      ctx.stroke();

      // Cercle blanc pour l'avatar (design system - bg-white)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(displaySize / 2, displaySize / 2, avatarSize / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Avatar ou initiales
      if (hasAvatar) {
        try {
          const avatarBase64 = await loadImageAsBase64(avatarImg);
          const avatarImage = new Image();
          avatarImage.src = avatarBase64;
          await new Promise((resolve, reject) => {
            avatarImage.onload = resolve;
            avatarImage.onerror = reject;
          });

          // Clipping pour l'avatar circulaire
          ctx.save();
          ctx.beginPath();
          ctx.arc(displaySize / 2, displaySize / 2, avatarSize / 2, 0, 2 * Math.PI);
          ctx.clip();

          // Dessiner l'image avec meilleure qualité
          ctx.drawImage(avatarImage, displaySize / 2 - avatarSize / 2, displaySize / 2 - avatarSize / 2, avatarSize, avatarSize);
          ctx.restore();
        } catch (error) {
          // Fallback vers initiales si l'image ne charge pas (design system - text-gray-900)
          ctx.fillStyle = '#111827'; // gray-900
          ctx.font = `600 ${avatarSize / 2.2}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, displaySize / 2, displaySize / 2);
        }
      } else {
        // Initiales (design system - text-gray-900)
        ctx.fillStyle = '#111827'; // gray-900
        ctx.font = `600 ${avatarSize / 2.2}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, displaySize / 2, displaySize / 2);
      }

      // Bordure intérieure très subtile (design system - border-gray-300)
      ctx.strokeStyle = '#D1D5DB'; // gray-300
      ctx.lineWidth = 0; // Bordure très fine
      ctx.beginPath();
      ctx.arc(displaySize / 2, displaySize / 2, avatarSize / 2, 0, 2 * Math.PI);
      ctx.stroke();

      return {
        url: canvas.toDataURL('image/png'),
        scaledSize: new google.maps.Size(displaySize, displaySize),
        anchor: new google.maps.Point(displaySize / 2, displaySize / 2)
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du marqueur personnalisé:', error);
      return undefined;
    }
  }, [isLoaded, loadImageAsBase64]);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (businessCards && businessCards.length > 0) {
      setIsLoading(false); // Suppression du délai artificiel
    }
  }, [businessCards]);

  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('map_onboarding_done'));
  useEffect(() => {
    if (!showOnboarding) {
      localStorage.setItem('map_onboarding_done', '1');
    }
  }, [showOnboarding]);

  const { success, info } = usePremiumToast();

  // Détection de badges débloqués
  const unlockedBadges = BADGES.filter(b => b.id === 'explorer' ? b.condition(zones) : b.condition(visited.length));
  useEffect(() => {
    if (unlockedBadges.length > 0) {
      const lastBadge = unlockedBadges[unlockedBadges.length - 1];
      success(`Badge débloqué : ${lastBadge.label}`, lastBadge.description);
    }
  }, [unlockedBadges.length]);

  // Restaurer le style de carte par défaut
  useEffect(() => {
    const savedStyle = localStorage.getItem(MAP_STYLE_KEY);
    if (savedStyle) {
      const style = MAP_STYLES.find(s => s.id === savedStyle);
      if (style) setMapStyle(style.mapTypeId);
    }
    const savedViewport = localStorage.getItem(MAP_VIEWPORT_KEY);
    if (savedViewport) {
      try {
        const v = JSON.parse(savedViewport);
        setCenter({ lat: v.latitude || v.lat, lng: v.longitude || v.lng });
        setZoom(v.zoom || 8);
      } catch { }
    }
  }, []);

  // Sauvegarder le style de carte choisi
  const handleSetMapStyle = (styleId: string) => {
    const style = MAP_STYLES.find(s => s.id === styleId);
    if (style) {
      setMapStyle(style.mapTypeId);
      localStorage.setItem(MAP_STYLE_KEY, styleId);
    }
  };

  // Debouncer la sauvegarde de la position/zoom
  const debouncedSaveViewport = useMemo(
    () => debounce((lat: number, lng: number, zoom: number) => {
      localStorage.setItem(MAP_VIEWPORT_KEY, JSON.stringify({ lat, lng, zoom }));
    }, 1000),
    []
  );

  // Sauvegarder la position/zoom à chaque déplacement (debounced)
  useEffect(() => {
    debouncedSaveViewport(center.lat, center.lng, zoom);
  }, [center, zoom, debouncedSaveViewport]);

  // Ajuster automatiquement la vue pour afficher tous les marqueurs au chargement
  useEffect(() => {
    if (isLoaded && markers.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      let validCount = 0;

      markers.forEach((feature: any) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
          bounds.extend({ lat: latitude, lng: longitude });
          validCount++;
        }
      });

      if (!bounds.isEmpty() && validCount > 0) {
        try {
          mapRef.current.fitBounds(bounds, 50);
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajustement de la vue:', error);
        }
      }
    } else if (isLoaded && markers.length > 0 && !mapRef.current) {
      setTimeout(() => {
        if (mapRef.current && markers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          markers.forEach((feature: any) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
              bounds.extend({ lat: latitude, lng: longitude });
            }
          });
          if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, 50);
          }
        }
      }, 500);
    }
  }, [isLoaded, markers.length, markers]);

  return (
    <div className="fixed inset-0 w-screen h-screen z-0 !p-0 !m-0 bg-black">
      {isLoading && <PremiumMapLoader />}


      {/* Panneau de filtres premium unifié */}
      {showSearch && (
        <PremiumFiltersPanel
          filters={filters}
          setFilters={setFilters}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onSearch={() => setFilters(prev => ({ ...prev, search: searchInput }))}
          onSaveSearch={() => saveSearch({ filters, viewport: { lat: center.lat, lng: center.lng, zoom } })}
          onResetFilters={() => setFilters({
            search: '',
            business_sector: undefined,
            tags: [],
            sortBy: 'distance',
            maxDistance: undefined,
            dateRange: 'all',
            sortByPopularity: false
          })}
          resultsCount={filteredAndSortedCards.length}
          userLocation={userLocation}
          mapStyle={mapStyle}
          onMapStyleChange={(styleId) => handleSetMapStyle(styleId)}
          savedSearches={savedSearches}
          onLoadSearch={(search) => {
            setFilters(search.filters);
            if (search.viewport) {
              setCenter({ lat: search.viewport.latitude || search.viewport.lat, lng: search.viewport.longitude || search.viewport.lng });
              setZoom(search.viewport.zoom || 8);
            }
          }}
          onDeleteSearch={(idx) => {
            const updated = savedSearches.filter((_, i) => i !== idx);
            setSavedSearches(updated);
            localStorage.setItem('map_saved_searches', JSON.stringify(updated));
          }}
        />
      )}

      {/* Sidebar liste améliorée */}
      <AnimatePresence>
        {showList && (
          <motion.div
            className={`fixed top-20 z-[60] w-[380px] max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-blue-500 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col ${showSearch ? 'left-[420px]' : 'left-4'
              }`}
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Liste des cartes
                </h3>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOnlyFavorites(v => !v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showOnlyFavorites
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  <Heart className={`w-4 h-4 inline mr-1.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                  Favoris
                </button>
                <span className="text-sm text-white/80">
                  {displayedCards.length} résultat{displayedCards.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <SkeletonLoader type="list" />
              ) : displayedCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune carte trouvée</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {displayedCards.map((card, index) => (
                    <motion.li
                      key={card.id}
                      className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-all group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleMarkerClick(card)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <OptimizedImage
                            src={getAvatarUrl(card.avatar_url)}
                            alt={card.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm group-hover:scale-105 transition-transform"
                          />
                          {isFavorite(card.id) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                              <Heart className="w-3 h-3 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{card.name}</div>
                          {card.company && (
                            <div className="text-xs text-gray-600 truncate">{card.company}</div>
                          )}
                          {card.business_sector && (
                            <div className="text-xs text-gray-500 mt-0.5">{card.business_sector}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFavorite(card.id)) {
                              removeFavorite(card.id);
                              info('Retiré des favoris');
                            } else {
                              addFavorite(card.id);
                              success('Ajouté aux favoris');
                            }
                          }}
                          className={`p-2 rounded-lg transition-all ${isFavorite(card.id)
                            ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          title={isFavorite(card.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(card.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style de carte */}
      <div className="absolute top-20 left-2 z-30">
        <Popover>

          <PopoverContent className="w-56 bg-white/90 backdrop-blur-2xl rounded-2xl border-2 border-blue-100 shadow-2xl p-4 flex flex-col gap-2 animate-fade-in-up">
            {MAP_STYLES.map(style => (
              <Button
                key={style.id}
                variant={mapStyle === style.mapTypeId ? 'default' : 'ghost'}
                className={`justify-start rounded-xl px-4 py-3 text-blue-700 font-semibold transition-all ${mapStyle === style.mapTypeId ? 'bg-gradient-to-r from-blue-200 to-purple-100 shadow-lg' : 'hover:bg-blue-50'}`}
                onClick={() => handleSetMapStyle(style.id)}
              >
                {style.name}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {!isLoaded ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Chargement de la carte...</p>
            {loadError && (
              <p className="text-red-600 text-sm">Erreur: {loadError.message}</p>
            )}
          </div>
        </div>
      ) : (
        <LazyMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          onLoad={(map) => {
            mapRef.current = map;
            // On fit les bounds si on a des cartes
            if (businessCards.length > 0) {
              setTimeout(() => {
                const bounds = new google.maps.LatLngBounds();
                let count = 0;
                businessCards.forEach(card => {
                  if (card.latitude && card.longitude) {
                    bounds.extend({ lat: card.latitude, lng: card.longitude });
                    count++;
                  }
                });
                if (!bounds.isEmpty() && count > 0) {
                  map.fitBounds(bounds, 80);
                  setTimeout(() => {
                    const currentZoom = map.getZoom();
                    if (currentZoom && currentZoom > 18) {
                      map.setZoom(15);
                    }
                  }, 200);
                }
              }, 200);
            }
          }}
          onUnmount={() => { mapRef.current = null; }}
          onDragEnd={() => {
            if (mapRef.current) {
              const center = mapRef.current.getCenter();
              if (center) {
                setCenter({ lat: center.lat(), lng: center.lng() });
                setZoom(mapRef.current.getZoom() || 8);
              }
            }
          }}
          onZoomChanged={() => {
            if (mapRef.current) {
              setZoom(mapRef.current.getZoom() || 8);
            }
          }}
          onIdle={() => {
            if (mapRef.current) {
              const center = mapRef.current.getCenter();
              if (center) {
                setCenter({ lat: center.lat(), lng: center.lng() });
              }
            }
          }}
          options={{
            mapTypeId: mapStyle,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            disableDoubleClickZoom: false,
            keyboardShortcuts: true,
            clickableIcons: false,
            maxZoom: 20,
            minZoom: 2,
            draggable: true,
            scrollwheel: true,
            disableDefaultUI: false,
            backgroundColor: '#f5f5f5',
            controlSize: 40,
            rotateControl: false,
            tilt: 0,
            mapTypeControlOptions: {
              style: typeof google !== 'undefined' && google.maps ? google.maps.MapTypeControlStyle.HORIZONTAL_BAR : 0,
              position: typeof google !== 'undefined' && google.maps ? google.maps.ControlPosition.TOP_RIGHT : 0
            },
            zoomControlOptions: {
              position: typeof google !== 'undefined' && google.maps ? google.maps.ControlPosition.RIGHT_CENTER : 0
            }
          }}
        >
          <TooltipProvider>
            {markers.length > 0 ? (
              markers.map((feature: any, i: number) => {
                const [longitude, latitude] = feature.geometry.coordinates;
                const card = feature.properties as BusinessCard;

                if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                  return null;
                }

                const isSelected = selectedCard?.id === card.id;

                return (
                  <React.Fragment key={card.id}>
                    <MarkerWithIcon
                      key={`marker-${card.id}-${i}-${isSelected}`}
                      position={{ lat: latitude, lng: longitude }}
                      onClick={() => {
                        handleMarkerClick(card);
                      }}
                      avatarUrl={card.avatar_url}
                      name={card.name}
                      isSelected={isSelected}
                      createMarkerIcon={createMarkerIcon}
                      zIndex={isSelected ? 2000 : 1000}
                      animation={isSelected && typeof google !== 'undefined' && google.maps ? google.maps.Animation.DROP : undefined}
                    >
                      {selectedCard?.id === card.id && (
                        <LazyInfoWindow
                          onCloseClick={() => setSelectedCard(null)}
                          position={{ lat: latitude, lng: longitude }}
                          options={{
                            pixelOffset: typeof google !== 'undefined' && google.maps ? new google.maps.Size(0, -10) : undefined,
                            maxWidth: 380,
                            disableAutoPan: false
                          }}
                        >
                          <div className="bg-white/98 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl p-5 max-w-sm w-full relative ring-4 ring-blue-500/30" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.2)' }}>
                            {/* Bouton close personnalisé */}
                            <button
                              onClick={() => setSelectedCard(null)}
                              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all z-10 hover:scale-110"
                              aria-label="Fermer"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {/* Header avec avatar */}
                            <div className="flex items-start gap-3 mb-3 pr-6">
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {getAvatarUrl(card.avatar_url) && !getAvatarUrl(card.avatar_url).includes('placeholder') ? (
                                    <img
                                      src={getAvatarUrl(card.avatar_url)}
                                      alt={card.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg font-semibold">
                                      {card.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 font-bold text-lg mb-1.5 line-clamp-2 drop-shadow-sm">
                                  {card.name || 'Nom inconnu'}
                                </h3>
                                {card.company && (
                                  <div className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-1.5">
                                    <ExternalLink className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                    <span className="truncate">{card.company}</span>
                                  </div>
                                )}
                                {card.business_sector && (
                                  <div className="flex items-center gap-1.5 text-gray-600 font-medium text-xs">
                                    <Layers className="w-3.5 h-3.5 flex-shrink-0 text-purple-600" />
                                    <span>{card.business_sector}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {card.tags && card.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {card.tags.slice(0, 3).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {card.tags.length > 3 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-300 shadow-sm">
                                    +{card.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Date d'ajout */}
                            {card.created_at && (
                              <div className="text-xs text-gray-600 font-medium mb-3 bg-gray-50 px-2 py-1 rounded-md">
                                Ajouté le {new Date(card.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <button
                                className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                                onClick={() => handleViewCard(card.id)}
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Voir la carte</span>
                              </button>
                              <button
                                className="w-full py-2 px-3 rounded-lg bg-white border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                                onClick={() => {
                                  if (card.latitude && card.longitude) {
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${card.latitude},${card.longitude}`, '_blank');
                                  }
                                }}
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Itinéraire</span>
                              </button>
                            </div>
                          </div>
                        </LazyInfoWindow>
                      )}
                    </MarkerWithIcon>
                  </React.Fragment>
                );
              })
            ) : null}
          </TooltipProvider>
        </LazyMap>
      )}

      {!isLoading && filteredAndSortedCards.length === 0 && <PremiumEmptyState />}

      {/* Overlay gradient */}
      {/* Optionnel : overlay gradient, à ajuster ou supprimer si besoin */}

      {showOnboarding && (
        <MapOnboarding onClose={() => setShowOnboarding(false)} />
      )}

      {/* Panneau de statistiques */}
      <MapStatsPanel
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        cards={filteredAndSortedCards}
        userLocation={userLocation}
      />

    </div>
  );
};

// Loader premium (splash animé)
const PremiumMapLoader = () => (
  <motion.div
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-violet-100 to-white/80 backdrop-blur-2xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}
  >
    <motion.img
      src="/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp"
      alt="bööh Logo"
      className="w-[400px] mb-6 drop-shadow-2xl"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [0.8, 1], opacity: [0, 1] }}
      transition={{ duration: 1.2 }}
    />
    <motion.div
      className="w-12 h-12 border-4 border-blue-400/20 border-t-blue-600 rounded-full animate-spin mb-2"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
    />
    <span className="text-lg font-semibold text-blue-700 animate-pulse">Chargement de la carte…</span>
  </motion.div>
);

// Empty state premium
const PremiumEmptyState = () => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center z-50"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 via-violet-200 to-white shadow-2xl mb-6 flex items-center justify-center"
      animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <MapPin className="w-16 h-16 text-blue-400 drop-shadow-xl" />
    </motion.div>
    <h2 className="text-2xl font-bold text-blue-900 mb-2">Aucun pro trouvé</h2>
    <p className="text-base text-gray-600 mb-4">Essayez d'élargir votre recherche ou de réinitialiser les filtres.</p>
    <Button variant="outline" className="rounded-xl border-blue-200 bg-white/70 hover:bg-blue-50 transition-all" onClick={() => window.location.reload()}>Réinitialiser</Button>
  </motion.div>
); 