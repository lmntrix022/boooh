import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { LazyMap } from '@/components/LazyMap';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';
import { logger } from '@/utils/logger';
import { analyzeSearchQuery } from '@/utils/searchInference';
import { MapMarker, MapFilters, PinType, MapProduct, MapService, MapBusiness, MapEvent, MapCluster } from './types';
import { SmartPin } from './SmartPin';
import { MarketplaceFilters } from './MarketplaceFilters';
import { NearbyCatalog } from './NearbyCatalog';
import { BusinessDetailSheet } from './BusinessDetailSheet';
import { LocationButton } from './LocationButton';
import { ChevronDown, List, Moon, Sun, Layers, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Nouveaux imports pour les améliorations
import { useMapClustering } from './hooks/useMapClustering';
import { useMapTheme, DARK_MAP_STYLES, LIGHT_MAP_STYLES } from './hooks/useMapTheme';
import { enrichWithBadges } from './hooks/useDynamicBadges';
import { ClusterMarker } from './ClusterMarker';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { ActiveFiltersIndicator, SearchInZoneNotification } from './ActiveFiltersIndicator';
import { MapLoadingSkeleton } from './EnhancedSkeletonLoader';
import { getEventsNearLocation } from '@/services/eventService';

// Utility pour debounce/throttle
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

const throttle = <T extends (...args: any[]) => void>(func: T, limit: number): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Constante pour les libraries Google Maps (évite le warning de performance)
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ['places'];

// Fonction pour compter les filtres actifs
const countActiveFilters = (filters: MapFilters): number => {
  let count = 0;
  if (filters.maxDistance !== undefined) count++;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
  if (filters.minRating !== undefined && filters.minRating > 0) count++;
  if (filters.badges && filters.badges.length > 0) count++;
  if (filters.hasPromotion) count++;
  if (filters.verified) count++;
  if (filters.hasStock) count++;
  return count;
};

export const MarketplaceMap: React.FC = () => {
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [center, setCenter] = useState({ lat: 0.4162, lng: 9.4673 });
  const [zoom, setZoom] = useState(12);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showBusinessDetail, setShowBusinessDetail] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isMapInteractive, setIsMapInteractive] = useState(true);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);
  const [mapMoved, setMapMoved] = useState(false);
  const [showSearchInZone, setShowSearchInZone] = useState(false);

  // Nouveaux états pour les améliorations
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | undefined>(undefined);

  // Refs pour éviter les re-renders inutiles
  const locationWatchIdRef = useRef<number | null>(null);
  const isUpdatingLocationRef = useRef(false);

  // Hook pour le thème sombre/clair
  const {
    config: mapConfig,
    effectiveTheme,
    mapStyles,
    toggleTheme,
    setClustering
  } = useMapTheme();

  const [filters, setFilters] = useState<MapFilters>({
    search: '',
    filterType: 'all',
    sortBy: 'distance'
  });

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  // useJsApiLoader removed as LazyMap handles it

  // Récupérer les produits
  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['map-products', filters],
    queryFn: async () => {
      logger.log('🔄 Début récupération produits...');
      let productQuery = supabase
        .from('products')
        .select('id, card_id, name, description, price, currency, image_url, stock_quantity')
        .eq('is_available', true);

      if (filters.search) {
        // Recherche optimisée dans name ET description avec OR
        productQuery = productQuery.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Appliquer les filtres de prix
      if (filters.minPrice !== undefined) {
        productQuery = productQuery.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        productQuery = productQuery.lte('price', filters.maxPrice);
      }

      // Appliquer le filtre de stock
      if (filters.hasStock === true) {
        productQuery = productQuery.gt('stock_quantity', 0);
      }

      // Limiter les résultats pour optimiser les performances (max 500)
      productQuery = productQuery.limit(500);

      const { data: productsData, error: productsError } = await productQuery;
      if (productsError) {
        logger.error('❌ Erreur produits:', productsError);
        return [];
      }
      if (!productsData || productsData.length === 0) {
        logger.log('ℹ️ Aucun produit trouvé');
        return [];
      }
      logger.log('✅ Produits récupérés:', productsData.length);

      const cardIds = [...new Set(productsData.map((p: any) => p.card_id).filter(Boolean))];
      logger.log('📋 Card IDs des produits:', cardIds);
      if (cardIds.length === 0) {
        logger.warn('⚠️ Aucun card_id trouvé dans les produits');
        return [];
      }

      const { data: cardsData, error: cardsError } = await supabase
        .from('business_cards')
        .select('id, name, latitude, longitude, city, avatar_url, business_sector, user_id')
        .in('id', cardIds)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (cardsError || !cardsData) {
        logger.error('❌ Erreur récupération cards:', cardsError);
        return [];
      }
      logger.log('✅ Business cards récupérés pour produits:', cardsData.length);

      const cardsMap = new Map(cardsData.map((c: any) => [c.id, c]));

      return productsData
        .map((item: any) => {
          const card = cardsMap.get(item.card_id);
          if (!card) return null;

          return {
            id: item.id,
            card_id: item.card_id,
            title: item.name,
            description: item.description,
            price: item.price,
            currency: item.currency || 'XOF',
            image_url: item.image_url,
            stock_status: item.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
            stock_count: item.stock_quantity,
            is_promotion: false,
            latitude: card.latitude,
            longitude: card.longitude,
            business_name: card.name,
            business_avatar: card.avatar_url,
            user_id: card.user_id
          } as MapProduct;
        })
        .filter(Boolean) as MapProduct[];
    }
  });

  // Récupérer les services
  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useQuery({
    queryKey: ['map-services', filters],
    queryFn: async () => {
      logger.log('🔄 Début récupération services...');

      let serviceQuery = supabase
        .from('portfolio_services')
        .select('id, card_id, title, description, price_type, price, price_label, icon')
        .eq('is_published', true);

      if (filters.search) {
        // Recherche optimisée dans title ET description avec OR
        serviceQuery = serviceQuery.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Appliquer les filtres de prix pour les services
      if (filters.minPrice !== undefined) {
        serviceQuery = serviceQuery.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        serviceQuery = serviceQuery.lte('price', filters.maxPrice);
      }

      // Limiter les résultats pour optimiser les performances (max 500)
      serviceQuery = serviceQuery.limit(500);

      const { data: allServices, error: servicesError } = await serviceQuery;
      if (servicesError) {
        logger.error('❌ Erreur services:', servicesError);
        return [];
      }
      if (!allServices || allServices.length === 0) {
        logger.log('ℹ️ Aucun service trouvé');
        return [];
      }
      logger.log('✅ Services récupérés (tous):', allServices.length);

      const { data: serviceLinks, error: linksError } = await supabase
        .from('service_cards')
        .select('service_id, card_id');

      if (linksError) {
        logger.error('❌ Erreur récupération liens service_cards:', linksError);
      }

      const linkedServicesMap = new Map<string, string[]>();
      (serviceLinks || []).forEach((link: any) => {
        if (!linkedServicesMap.has(link.service_id)) {
          linkedServicesMap.set(link.service_id, []);
        }
        linkedServicesMap.get(link.service_id)!.push(link.card_id);
      });

      const allCardIds = new Set<string>();

      allServices.forEach((service: any) => {
        if (service.card_id) {
          allCardIds.add(service.card_id);
        }
        const linkedCards = linkedServicesMap.get(service.id) || [];
        linkedCards.forEach((cardId: string) => allCardIds.add(cardId));
      });

      const cardIds = Array.from(allCardIds);
      logger.log('📋 Card IDs des services:', cardIds);
      if (cardIds.length === 0) {
        logger.warn('⚠️ Aucun card_id trouvé pour les services');
        return [];
      }

      const { data: cardsData, error: cardsError } = await supabase
        .from('business_cards')
        .select('id, name, latitude, longitude, city, avatar_url, business_sector, user_id')
        .in('id', cardIds)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (cardsError || !cardsData) {
        logger.error('❌ Erreur récupération cards:', cardsError);
        return [];
      }
      logger.log('✅ Business cards récupérés pour services:', cardsData.length);

      const cardsMap = new Map(cardsData.map((c: any) => [c.id, c]));

      const result: MapService[] = [];

      allServices.forEach((service: any) => {
        const cardIdsForService: string[] = [];

        if (service.card_id && cardsMap.has(service.card_id)) {
          cardIdsForService.push(service.card_id);
        }

        const linkedCards = linkedServicesMap.get(service.id) || [];
        linkedCards.forEach((cardId: string) => {
          if (cardsMap.has(cardId) && !cardIdsForService.includes(cardId)) {
            cardIdsForService.push(cardId);
          }
        });

        cardIdsForService.forEach((cardId: string) => {
          const card = cardsMap.get(cardId);
          if (card) {
            result.push({
              id: `${service.id}-${cardId}`,
              card_id: cardId,
              title: service.title,
              description: service.description,
              price_type: service.price_type,
              price: service.price,
              price_label: service.price_label,
              icon: service.icon,
              is_promotion: false,
              latitude: card.latitude,
              longitude: card.longitude,
              business_name: card.name,
              business_avatar: card.avatar_url,
              user_id: card.user_id
            } as MapService);
          }
        });
      });

      logger.log('✅ Services mappés créés:', result.length);
      return result;
    }
  });

  // Récupérer les événements
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError } = useQuery({
    queryKey: ['map-events', center.lat, center.lng, zoom, filters.search],
    queryFn: async () => {
      if (!center.lat || !center.lng || isNaN(center.lat) || isNaN(center.lng)) {
        logger.log('⚠️ Centre invalide pour les événements:', center);
        return [];
      }

      logger.log('🔄 Début récupération événements pour:', { lat: center.lat, lng: center.lng });
      let eventsData = await getEventsNearLocation(center.lat, center.lng, 50);

      // Filtrer par recherche si nécessaire
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        eventsData = eventsData.filter(event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower)
        );
      }

      // Filtrer les événements qui ont des coordonnées valides
      const validEvents = eventsData.filter(e => e.latitude && e.longitude);

      if (validEvents.length === 0) {
        logger.log('ℹ️ Aucun événement avec coordonnées valides');
        return [];
      }

      // Enrichir avec les infos de la carte si card_id existe
      const cardIds = [...new Set(validEvents.map(e => e.card_id).filter(Boolean))] as string[];
      const cardsMap = new Map();

      if (cardIds.length > 0) {
        const { data: cardsData } = await supabase
          .from('business_cards')
          .select('id, name, avatar_url')
          .in('id', cardIds);

        (cardsData || []).forEach(c => cardsMap.set(c.id, c));
      }

      // Enrichir tous les événements
      const enrichedEvents: MapEvent[] = validEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        start_date: event.start_date,
        end_date: event.end_date,
        location_name: event.location_name,
        location_address: event.location_address,
        latitude: event.latitude!,
        longitude: event.longitude!,
        cover_image_url: event.cover_image_url || undefined,
        is_free: event.is_free,
        tickets_config: (event.tickets_config as any) || [],
        current_attendees: event.current_attendees,
        max_capacity: event.max_capacity || undefined,
        status: 'published',
        has_live_stream: event.has_live_stream || false,
        live_stream_status: event.live_stream_status as any,
        card_id: event.card_id,
        user_id: event.user_id,
        business_name: event.card_id ? cardsMap.get(event.card_id)?.name : undefined,
        business_avatar: event.card_id ? cardsMap.get(event.card_id)?.avatar_url : undefined,
      }));

      logger.log('✅ Événements récupérés:', enrichedEvents.length);
      if (enrichedEvents.length > 0) {
        logger.log('📋 Événements:', enrichedEvents.map(e => ({ id: e.id, title: e.title, lat: e.latitude, lng: e.longitude })));
      }
      return enrichedEvents;
    },
    enabled: !!center.lat && !!center.lng && !isNaN(center.lat) && !isNaN(center.lng),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Récupérer les businesses
  const { data: businesses = [], isLoading: isLoadingBusinesses, error: businessesError } = useQuery({
    queryKey: ['map-businesses', filters],
    queryFn: async () => {
      logger.log('🔄 Début récupération businesses...');
      let query = supabase
        .from('business_cards')
        .select('id, name, latitude, longitude, city, avatar_url, business_sector, company, created_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters.search) {
        // Recherche optimisée dans name, company ET business_sector avec OR
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,business_sector.ilike.%${filters.search}%`);
      }

      // Filtre beauté (salons de coiffure et instituts de beauté)
      if (filters.filterType === 'beauty') {
        query = query.or(`business_sector.ilike.%coiffure%,business_sector.ilike.%beauté%,business_sector.ilike.%beaute%,business_sector.ilike.%institut%,business_sector.ilike.%esthétique%,business_sector.ilike.%esthetique%,business_sector.ilike.%salon%`);
      }

      // Limiter les résultats pour optimiser les performances (max 500)
      query = query.limit(500);

      const { data, error } = await query;
      if (error) {
        logger.error('❌ Erreur récupération businesses:', error);
        return [];
      }

      const result = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        city: item.city,
        avatar_url: item.avatar_url,
        business_sector: item.business_sector,
        company: item.company,
        created_at: item.created_at,
        has_promotions: false
      } as MapBusiness));

      logger.log('✅ Businesses récupérés:', result.length);
      return result;
    }
  });

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Enrichir avec distance, filtrer et trier
  const enrichedProducts = useMemo(() => {
    let result = products;

    // Enrichir avec distance si localisation disponible
    if (userLocation) {
      result = result.map(product => ({
        ...product,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          product.latitude, product.longitude
        )
      }));

      // Filtrer par distance maximale seulement si localisation disponible
      if (filters.maxDistance !== undefined) {
        result = result.filter(product =>
          product.distance !== undefined && product.distance <= filters.maxDistance!
        );
      }
    } else {
      // Sans localisation, ajouter une distance par défaut pour le tri
      result = result.map(product => ({
        ...product,
        distance: 0 // Distance neutre
      }));
    }

    // Filtrer par rating minimum (si disponible dans les données)
    // Note: Le rating n'est pas encore dans la base, mais on prépare la structure
    if (filters.sortBy === 'rating') {
      // Pour l'instant, on garde tous les résultats
      // Quand le rating sera disponible, on filtrera ici
    }

    // Trier selon sortBy
    switch (filters.sortBy) {
      case 'distance':
        if (userLocation) {
          result = result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case 'price':
        result = result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'rating':
        // Trier par rating décroissant (quand disponible)
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        // Trier par nombre de reviews décroissant (quand disponible)
        result = result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'newest':
        // Trier par date de création (nécessite d'ajouter created_at aux produits)
        // Pour l'instant, on garde l'ordre original
        break;
    }

    return result;
  }, [products, userLocation, calculateDistance, filters.maxDistance, filters.sortBy]);

  const enrichedServices = useMemo(() => {
    let result = services;

    // Enrichir avec distance si localisation disponible
    if (userLocation) {
      result = result.map(service => ({
        ...service,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          service.latitude, service.longitude
        )
      }));

      // Filtrer par distance maximale seulement si localisation disponible
      if (filters.maxDistance !== undefined) {
        result = result.filter(service =>
          service.distance !== undefined && service.distance <= filters.maxDistance!
        );
      }
    } else {
      // Sans localisation, ajouter une distance par défaut
      result = result.map(service => ({
        ...service,
        distance: 0 // Distance neutre
      }));
    }

    // Filtrer par rating minimum
    if (filters.sortBy === 'rating') {
      // Pour l'instant, on garde tous les résultats
      // Quand le rating sera disponible, on filtrera ici
    }

    // Trier selon sortBy
    switch (filters.sortBy) {
      case 'distance':
        if (userLocation) {
          result = result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case 'price':
        result = result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'rating':
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        result = result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'newest':
        // Trier par date de création
        break;
    }

    return result;
  }, [services, userLocation, calculateDistance, filters.maxDistance, filters.sortBy]);

  // Enrichir les businesses avec distance et filtrer/trier
  const enrichedBusinesses = useMemo(() => {
    let result = businesses;

    // Enrichir avec distance
    if (userLocation) {
      result = result.map(business => ({
        ...business,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          business.latitude, business.longitude
        )
      }));
    }

    // Filtrer par distance maximale
    if (filters.maxDistance !== undefined && userLocation) {
      result = result.filter(business =>
        business.distance !== undefined && business.distance <= filters.maxDistance!
      );
    }

    // Trier selon sortBy
    switch (filters.sortBy) {
      case 'distance':
        if (userLocation) {
          result = result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case 'rating':
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        // Trier par nombre de produits/services
        result = result.sort((a, b) =>
          ((b.products_count || 0) + (b.services_count || 0)) -
          ((a.products_count || 0) + (a.services_count || 0))
        );
        break;
      case 'newest':
        result = result.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return result;
  }, [businesses, userLocation, calculateDistance, filters.maxDistance, filters.sortBy]);

  const productsWithDistance = enrichedProducts;
  const servicesWithDistance = enrichedServices;

  // Enrichir les événements avec distance
  const enrichedEvents = useMemo(() => {
    // Les événements sont déjà enrichis dans la query
    let result = events || [];

    // Enrichir avec distance si localisation disponible
    if (userLocation) {
      result = result.map(event => ({
        ...event,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          event.latitude || 0, event.longitude || 0
        )
      }));

      // Filtrer par distance maximale
      if (filters.maxDistance !== undefined) {
        result = result.filter(event =>
          event.distance !== undefined && event.distance <= filters.maxDistance!
        );
      }
    } else {
      result = result.map(event => ({
        ...event,
        distance: 0
      }));
    }

    // Trier par date de début (événements à venir en premier)
    result = result.sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    return result;
  }, [events, userLocation, calculateDistance, filters.maxDistance]);

  // Calculer le nombre total d'éléments pour le badge
  const totalItemsCount = useMemo(() => {
    return productsWithDistance.length + servicesWithDistance.length + enrichedEvents.length;
  }, [productsWithDistance.length, servicesWithDistance.length, enrichedEvents.length]);

  const markers = useMemo(() => {
    const result: MapMarker[] = [];

    // Si le filtre "carte" est sélectionné, afficher uniquement les businesses
    if (filters.filterType === 'carte') {
      enrichedBusinesses.forEach(business => {
        result.push({
          id: `business-${business.id}`,
          type: 'business',
          position: { lat: business.latitude, lng: business.longitude },
          data: business,
          is_promotion: business.has_promotions
        });
      });
      return result;
    }

    // Sinon, logique normale
    if (filters.filterType === 'all' || filters.filterType === 'products') {
      enrichedProducts.forEach(product => {
        result.push({
          id: `product-${product.id}`,
          type: 'product',
          position: { lat: product.latitude, lng: product.longitude },
          data: product,
          is_promotion: product.is_promotion
        });
      });
    }

    if (filters.filterType === 'all' || filters.filterType === 'services') {
      enrichedServices.forEach(service => {
        result.push({
          id: `service-${service.id}`,
          type: 'service',
          position: { lat: service.latitude, lng: service.longitude },
          data: service,
          is_promotion: service.is_promotion
        });
      });
    }

    // Ajouter les événements si filterType est 'all' ou 'events' (à ajouter dans les filtres)
    if (filters.filterType === 'all') {
      enrichedEvents.forEach(event => {
        result.push({
          id: `event-${event.id}`,
          type: 'event',
          position: { lat: event.latitude || 0, lng: event.longitude || 0 },
          data: event,
        });
      });
    }

    const showBusinesses = filters.filterType === 'all' ||
      filters.filterType === 'products' ||
      filters.filterType === 'services' ||
      filters.filterType === 'beauty' ||
      result.length === 0;

    if (showBusinesses) {
      enrichedBusinesses.forEach(business => {
        const exists = result.some(m =>
          (m.type === 'product' && (m.data as MapProduct).card_id === business.id) ||
          (m.type === 'service' && (m.data as MapService).card_id === business.id) ||
          (m.type === 'business' && (m.data as MapBusiness).id === business.id)
        );

        if (!exists) {
          result.push({
            id: `business-${business.id}`,
            type: 'business',
            position: { lat: business.latitude, lng: business.longitude },
            data: business,
            is_promotion: business.has_promotions
          });
        }
      });
    }

    if (result.length === 0 && enrichedBusinesses.length > 0) {
      logger.warn('⚠️ Aucun marqueur, affichage des businesses par défaut');
      enrichedBusinesses.forEach(business => {
        result.push({
          id: `business-${business.id}`,
          type: 'business',
          position: { lat: business.latitude, lng: business.longitude },
          data: business,
          is_promotion: business.has_promotions
        });
      });
    }

    logger.log('📊 Marqueurs créés:', {
      total: result.length,
      products: result.filter(m => m.type === 'product').length,
      services: result.filter(m => m.type === 'service').length,
      businesses: result.filter(m => m.type === 'business').length,
      events: result.filter(m => m.type === 'event').length,
      filterType: filters.filterType
    });

    return result;
  }, [enrichedProducts, enrichedServices, enrichedEvents, businesses, filters.filterType]);

  // Hook de clustering dynamique
  const {
    clusters: clusteredMarkers,
    getClusterExpansionZoom,
    getClusterLeaves
  } = useMapClustering({
    markers,
    zoom,
    bounds: mapBounds,
    config: {
      radius: 60,
      maxZoom: 15,
      minPoints: 3,
    },
  });

  // Utiliser les clusters si le clustering est activé
  const displayMarkers = useMemo(() => {
    if (mapConfig.clustering && clusteredMarkers.length > 0) {
      return clusteredMarkers;
    }
    return markers;
  }, [mapConfig.clustering, clusteredMarkers, markers]);

  // Fonction pour gérer le clic sur un cluster
  const handleClusterClick = useCallback((cluster: MapCluster) => {
    const clusterId = parseInt(cluster.id.replace('cluster-', ''));
    const expansionZoom = getClusterExpansionZoom(clusterId);
    setCenter(cluster.position);
    setZoom(Math.min(expansionZoom + 1, 18));
  }, [getClusterExpansionZoom]);

  // Fonction pour supprimer un filtre spécifique
  const handleRemoveFilter = useCallback((filterKey: string) => {
    const newFilters = { ...filters };

    if (filterKey === 'filterType') {
      newFilters.filterType = 'all';
    } else if (filterKey === 'maxDistance') {
      delete newFilters.maxDistance;
    } else if (filterKey === 'price') {
      delete newFilters.minPrice;
      delete newFilters.maxPrice;
    } else if (filterKey === 'minRating') {
      delete newFilters.minRating;
    } else if (filterKey.startsWith('badge-')) {
      const badge = filterKey.replace('badge-', '');
      newFilters.badges = (newFilters.badges || []).filter(b => b !== badge);
      if (newFilters.badges.length === 0) delete newFilters.badges;
    } else if (filterKey === 'hasPromotion') {
      delete newFilters.hasPromotion;
    } else if (filterKey === 'verified') {
      delete newFilters.verified;
    } else if (filterKey === 'hasStock') {
      delete newFilters.hasStock;
    }

    setFilters(newFilters);
  }, [filters]);

  // Fonction pour effacer tous les filtres
  const handleClearAllFilters = useCallback(() => {
    setFilters({
      search: filters.search,
      filterType: 'all',
      sortBy: 'distance',
    });
  }, [filters.search]);

  // État pour la permission de géolocalisation
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Afficher le prompt de localisation après un délai (pas de demande automatique)
  useEffect(() => {
    // Afficher le prompt visuel après 3 secondes si pas de localisation
    const timer = setTimeout(() => {
      if (!userLocation) {
        setShowLocationPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [userLocation]);

  // Viewport Management : Zoom automatique basé sur l'intent de recherche
  useEffect(() => {
    if (!filters.search.trim()) return;

    const intent = analyzeSearchQuery(filters.search);
    if (intent.viewportAction) {
      if (intent.viewportAction.centerOnUser && userLocation) {
        // Centrer sur position utilisateur et zoomer
        setCenter({ lat: userLocation[0], lng: userLocation[1] });
        setZoom(intent.viewportAction.zoom || 15);
        setMapMoved(false);
        setShowSearchInZone(false);
      } else if (intent.viewportAction.zoom) {
        // Juste ajuster le zoom pour recherches rares
        setZoom(intent.viewportAction.zoom);
      }
    }
  }, [filters.search, userLocation]);

  // Cleanup de la localisation au unmount - DOIT être avant tous les returns conditionnels
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  // Callbacks optimisés pour la carte (définis avant les returns conditionnels)
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    logger.log('✅ Carte Google Maps chargée');

    // Utiliser requestIdleCallback pour les updates non-critiques
    const updateBounds = () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setMapBounds({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
      const mapCenter = map.getCenter();
      if (mapCenter) {
        setCenter({ lat: mapCenter.lat(), lng: mapCenter.lng() });
      }
    };

    // Délai pour éviter les conflits de rendu initial
    if ('requestIdleCallback' in window) {
      requestIdleCallback(updateBounds, { timeout: 1000 });
    } else {
      setTimeout(updateBounds, 100);
    }
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedMarker(null);
    setShowBusinessDetail(false);
    setSelectedBusinessId(null);
    setSelectedCatalogItemId(null);
  }, []);

  // Détecter si la carte a été déplacée manuellement
  const handleMapDragEnd = useCallback(() => {
    if (mapRef.current) {
      const mapCenter = mapRef.current.getCenter();
      if (mapCenter) {
        setCenter({ lat: mapCenter.lat(), lng: mapCenter.lng() });
      }
    }
    if (filters.search.trim()) {
      setMapMoved(true);
      setShowSearchInZone(true);
    }
  }, [filters.search]);

  const handleMapBoundsChanged = useMemo(() => throttle(() => {
    // Mettre à jour les bounds pour le clustering (throttled pour performance)
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setMapBounds({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
      // Mettre à jour le centre (debounced pour éviter les re-renders excessifs)
      const mapCenter = mapRef.current.getCenter();
      if (mapCenter) {
        // Utiliser requestAnimationFrame pour synchroniser avec le rendu
        requestAnimationFrame(() => {
          setCenter({ lat: mapCenter.lat(), lng: mapCenter.lng() });
        });
      }
    }
  }, 300), []);

  const handleMapZoomChanged = useMemo(() => throttle(() => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom();
      if (newZoom) {
        requestAnimationFrame(() => {
          setZoom(newZoom);
        });
      }
      // Mettre à jour le centre (debounced)
      const mapCenter = mapRef.current.getCenter();
      if (mapCenter) {
        requestAnimationFrame(() => {
          setCenter({ lat: mapCenter.lat(), lng: mapCenter.lng() });
        });
      }
    }
  }, 300), []);


  // Géolocalisation optimisée - Évite les glitches
  const handleLocationClick = useCallback(() => {
    // Si position déjà obtenue, centrer dessus sans re-request
    if (userLocation && !isUpdatingLocationRef.current) {
      setCenter({ lat: userLocation[0], lng: userLocation[1] });
      setZoom(15);
      return;
    }

    // Vérifier support navigateur
    if (!navigator.geolocation) {
      toast.error("Non supporté", "Votre appareil ne supporte pas la géolocalisation");
      return;
    }

    // Éviter les appels multiples simultanés
    if (isUpdatingLocationRef.current) {
      return;
    }

    isUpdatingLocationRef.current = true;

    // Nettoyer le watch précédent si existant
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    // Demander la position avec options optimisées
    navigator.geolocation.getCurrentPosition(
      // Succès
      (position) => {
        const location: [number, number] = [position.coords.latitude, position.coords.longitude];

        // Mettre à jour de manière atomique pour éviter les glitches
        setUserLocation(location);
        setCenter({ lat: location[0], lng: location[1] });
        setZoom(15);
        setLocationPermission('granted');
        setShowLocationPrompt(false);
        isUpdatingLocationRef.current = false;

        toast.success("Position activée");

        // Optionnel: Watch position pour updates (mais avec throttle)
        // Désactivé par défaut pour éviter les glitches
      },
      // Erreur
      (error) => {
        setLocationPermission('denied');
        isUpdatingLocationRef.current = false;

        const messages: Record<number, string> = {
          1: "Accès refusé",
          2: "Position indisponible",
          3: "Délai dépassé"
        };

        toast.error("Localisation impossible", messages[error.code] || "Erreur inconnue");
      },
      // Options optimisées pour performance
      {
        enableHighAccuracy: false, // false = plus rapide, moins de batterie
        timeout: 10000, // Réduit de 15s à 10s
        maximumAge: 60000 // Cache 1 minute pour éviter les requêtes fréquentes
      }
    );
  }, [userLocation, toast]);

  // Fonction pour afficher l'itinéraire sur la carte
  const handleShowRoute = useCallback((destination: { lat: number; lng: number }) => {
    if (!mapRef.current || typeof google === 'undefined') return;

    // Initialiser DirectionsService et DirectionsRenderer si nécessaire
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
    }

    const origin = userLocation
      ? { lat: userLocation[0], lng: userLocation[1] }
      : { lat: center.lat, lng: center.lng };

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && directionsRendererRef.current && result) {
          directionsRendererRef.current.setDirections(result);
          // Ajuster la vue pour afficher l'itinéraire complet
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapRef.current?.fitBounds(bounds);
        } else {
          logger.warn('⚠️ Impossible de calculer l\'itinéraire:', status);
        }
      }
    );
  }, [userLocation, center]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900" style={{ isolation: 'isolate' }}>
      {/* Interface principale - isolation pour éviter les conflits de z-index */}
      <div className="absolute inset-0 z-0" style={{ willChange: 'transform' }}>
        <LazyMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={GOOGLE_MAPS_LIBRARIES}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
          onDragEnd={handleMapDragEnd}
          onBoundsChanged={handleMapBoundsChanged}
          onZoomChanged={handleMapZoomChanged}
          options={{
            styles: mapStyles,
            mapTypeId: 'roadmap',
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            rotateControl: false,
            panControl: false,
            gestureHandling: 'greedy',
            minZoom: 3,
            maxZoom: 20,
            backgroundColor: effectiveTheme === 'dark' ? '#1a1a2e' : '#f8fafc',
            disableDefaultUI: true,
            clickableIcons: true
          }}
        >
          {displayMarkers.length > 0 ? (
            displayMarkers.map((item) => {
              // Afficher un ClusterMarker si c'est un cluster
              if (item.type === 'cluster') {
                const cluster = item as unknown as MapCluster;
                return (
                  <ClusterMarker
                    key={cluster.id}
                    cluster={cluster}
                    onClick={() => handleClusterClick(cluster)}
                    getClusterLeaves={getClusterLeaves}
                  />
                );
              }

              // Sinon afficher un SmartPin normal
              const marker = item as MapMarker;
              return (
                <SmartPin
                  key={marker.id}
                  marker={marker}
                  isSelected={selectedMarker?.id === marker.id}
                  isHovered={false}
                  onClick={() => {
                    setSelectedMarker(marker);
                    if (marker.type === 'business') {
                      setSelectedBusinessId((marker.data as MapBusiness).id);
                      setShowBusinessDetail(true);
                      setSelectedCatalogItemId(null);
                    } else if (marker.type === 'product') {
                      const product = marker.data as MapProduct;
                      setSelectedCatalogItemId(`product-${product.id}`);
                      setCenter({ lat: product.latitude, lng: product.longitude });
                      setZoom(15);
                    } else if (marker.type === 'service') {
                      const service = marker.data as MapService;
                      setSelectedCatalogItemId(`service-${service.id}`);
                      setCenter({ lat: service.latitude, lng: service.longitude });
                      setZoom(15);
                    } else if (marker.type === 'event') {
                      const event = marker.data as MapEvent;
                      // Navigate to event detail page
                      window.open(`/events/${event.id}`, '_blank');
                    }
                  }}
                  onMouseEnter={() => { }}
                  onMouseLeave={() => { }}
                />
              );
            })
          ) : (
            // Empty State Premium - AWWWARDS Level
            (markers.length === 0 && productsWithDistance.length === 0 && servicesWithDistance.length === 0 && enrichedEvents.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="pointer-events-auto mx-4"
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-white/40 rounded-[32px] blur-2xl" />

                  {/* Card */}
                  <div className="relative bg-white/95 backdrop-blur-2xl rounded-[24px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-white/60 max-w-[320px] text-center">

                    {/* Icon avec animation */}
                    <motion.div
                      className="relative w-20 h-20 mx-auto mb-6"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-[20px] shadow-inner" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      {/* Pulse rings */}
                      <motion.div
                        className="absolute inset-0 border border-gray-200 rounded-[20px]"
                        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 border border-gray-200 rounded-[20px]"
                        animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </motion.div>

                    {/* Text content */}
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-tight">
                      Rien à proximité
                    </h3>
                    <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
                      Aucun résultat dans cette zone.<br />
                      Essayez d'élargir votre recherche.
                    </p>

                    {/* Actions */}
                    <div className="space-y-2">
                      <motion.button
                        onClick={() => {
                          setZoom(prev => Math.max(8, prev - 3));
                          setMapMoved(false);
                        }}
                        className="w-full py-3.5 bg-black text-white rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span>Élargir la zone</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          setFilters({ filterType: 'all', sortBy: 'distance', search: '' });
                          setMapMoved(false);
                        }}
                        className="w-full py-3 text-gray-600 rounded-2xl font-medium text-[13px] hover:bg-gray-100 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Réinitialiser les filtres
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          )}

        </LazyMap>
      </div>

      {/* Overlay d'interface */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="container mx-auto p-4 h-full flex flex-col">

          {/* Contrôles de carte - AWWWARDS APPLE LEVEL */}
          <div className="absolute top-4 md:top-6 right-4 md:right-6 z-30">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: 0.2
              }}
              className="pointer-events-auto"
            >
              {/* Container principal avec glassmorphism premium */}
              <div className="relative">
                {/* Glow subtil */}
                <div className="absolute -inset-1 bg-gradient-to-b from-white/80 to-white/40 rounded-[20px] blur-sm" />

                {/* Card principale */}
                <div className="relative bg-white/90 backdrop-blur-2xl rounded-[18px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden">

                  {/* Highlight supérieur */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                  {/* Catalogue avec badge */}
                  <motion.button
                    onClick={() => setShowCatalog(!showCatalog)}
                    className="relative w-12 h-12 flex items-center justify-center group"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <motion.div
                      animate={{
                        scale: showCatalog ? 1 : 1,
                        backgroundColor: showCatalog ? '#000' : 'transparent'
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${showCatalog ? 'text-white shadow-lg' : 'text-gray-700'
                        }`}
                    >
                      <List className="w-[17px] h-[17px]" strokeWidth={1.8} />
                    </motion.div>
                    <AnimatePresence>
                      {totalItemsCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-gray-900 text-white text-[9px] font-light rounded-full flex items-center justify-center shadow-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {totalItemsCount > 99 ? '99' : totalItemsCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Séparateur élégant */}
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />

                  {/* Location */}
                  <motion.button
                    onClick={handleLocationClick}
                    className="relative w-12 h-12 flex items-center justify-center group"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <motion.div
                      animate={{
                        backgroundColor: userLocation ? '#000' : 'transparent'
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${userLocation ? 'text-white shadow-lg' : 'text-gray-700'
                        }`}
                    >
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill={userLocation ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
                        <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </motion.button>

                  {/* Séparateur */}
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />

                  {/* Zoom Controls */}
                  <div className="py-1">
                    <motion.button
                      onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
                      className="w-12 h-10 flex items-center justify-center text-gray-600"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </motion.button>

                    <motion.button
                      onClick={() => setZoom(prev => Math.max(prev - 1, 3))}
                      className="w-12 h-10 flex items-center justify-center text-gray-600"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 12h14" strokeLinecap="round" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Séparateur */}
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />

                  {/* Theme & Clustering */}
                  <div className="py-1">
                    <motion.button
                      onClick={toggleTheme}
                      className="w-12 h-10 flex items-center justify-center text-gray-600"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <motion.div
                        key={effectiveTheme}
                        initial={{ rotate: -30, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {effectiveTheme === 'dark' ? (
                          <Sun className="w-[16px] h-[16px]" strokeWidth={1.8} />
                        ) : (
                          <Moon className="w-[16px] h-[16px]" strokeWidth={1.8} />
                        )}
                      </motion.div>
                    </motion.button>

                    <motion.button
                      onClick={() => setClustering(!mapConfig.clustering)}
                      className="relative w-12 h-10 flex items-center justify-center group"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <motion.div
                        animate={{
                          backgroundColor: mapConfig.clustering ? '#000' : 'transparent'
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${mapConfig.clustering ? 'text-white shadow-md' : 'text-gray-600'
                          }`}
                      >
                        <Layers className="w-[14px] h-[14px]" strokeWidth={1.8} />
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>


          {/* Filtres en haut - positionnement géré par le composant lui-même */}
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={setFilters}
            onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
      </div>

      {/* Notification "Rechercher dans cette zone" améliorée */}
      <SearchInZoneNotification
        isVisible={showSearchInZone}
        onClick={() => {
          setShowSearchInZone(false);
          setMapMoved(false);
        }}
        onDismiss={() => setShowSearchInZone(false)}
      />

      {/* Panneau de filtres avancés */}
      <AdvancedFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        resultsCount={displayMarkers.length}
      />

      {/* Prompt de localisation pour mobile - Centré et compact */}
      <AnimatePresence>
        {showLocationPrompt && !userLocation && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="relative bg-white rounded-2xl p-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.04] w-full max-w-md pointer-events-auto">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60 pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5 tracking-tight">
                    Localisation désactivée
                  </h3>
                  <p className="text-gray-600 text-xs leading-snug">
                    Activez-la pour les distances précises
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    onClick={() => setShowLocationPrompt(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    whileTap={{ scale: 0.92 }}
                  >
                    <X className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowLocationPrompt(false);
                      handleLocationClick();
                    }}
                    className="px-4 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-xs transition-colors whitespace-nowrap"
                    whileTap={{ scale: 0.98 }}
                  >
                    Activer
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Catalogue à proximité - Positionnement géré par le composant lui-même */}
      <NearbyCatalog
        products={productsWithDistance}
        services={servicesWithDistance}
        userLocation={userLocation}
        selectedItemId={selectedCatalogItemId}
        isVisible={showCatalog}
        onProductClick={(product) => {
          setCenter({ lat: product.latitude, lng: product.longitude });
          setZoom(15);
        }}
        onServiceClick={(service) => {
          setCenter({ lat: service.latitude, lng: service.longitude });
          setZoom(15);
        }}
        onShowRoute={handleShowRoute}
        onClearSelection={() => {
          setSelectedCatalogItemId(null);
          setSelectedMarker(null);
        }}
      />

      {/* Fiche business détaillée */}
      <AnimatePresence>
        {showBusinessDetail && selectedBusinessId && (
          <BusinessDetailSheet
            businessId={selectedBusinessId}
            onClose={() => {
              setShowBusinessDetail(false);
              setSelectedBusinessId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* État de chargement overlay */}
      <AnimatePresence>
        {(isLoadingProducts || isLoadingServices || isLoadingBusinesses || isLoadingEvents) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 font-medium">Chargement des données...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};