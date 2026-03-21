// Types pour la nouvelle map "Products & Services"

export type PinType = 'business' | 'product' | 'service' | 'event' | 'cluster';

// Badges dynamiques pour engagement utilisateur
export type DynamicBadgeType = 
  | 'trending'      // 🔥 Tendance
  | 'new'           // 🆕 Nouveau (< 7 jours)
  | 'limited'       // ⏳ Offre limitée
  | 'flash'         // ⚡ Flash deal
  | 'bestseller'    // 🏆 Best-seller
  | 'verified'      // ✓ Vérifié
  | 'eco';          // 🌱 Éco-responsable

export interface DynamicBadge {
  type: DynamicBadgeType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  priority: number; // Pour afficher le badge le plus important en premier
}

export interface MapProduct {
  id: string;
  card_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  thumbnail_url?: string;
  stock_status: 'in_stock' | 'out_of_stock' | 'arriving_tomorrow' | 'low_stock';
  stock_count?: number;
  is_promotion: boolean;
  promotion_percent?: number;
  promotion_label?: string;
  rating?: number;
  review_count?: number;
  category?: string;
  tags?: string[];
  latitude: number;
  longitude: number;
  distance?: number; // en km
  business_name: string;
  business_avatar?: string;
  user_id?: string; // user_id du propriétaire de la carte
  // Nouveaux champs pour badges dynamiques
  created_at?: string;
  views_count?: number;
  sales_count?: number;
  badges?: DynamicBadge[];
}

export interface MapService {
  id: string;
  card_id: string;
  title: string;
  description?: string;
  price_type: 'fixed' | 'from' | 'custom' | 'free';
  price?: number;
  price_label?: string;
  icon: string; // nom de l'icône lucide-react
  duration?: number; // en minutes
  is_promotion: boolean;
  promotion_percent?: number;
  rating?: number;
  review_count?: number;
  category?: string;
  tags?: string[];
  latitude: number;
  longitude: number;
  distance?: number; // en km
  business_name: string;
  business_avatar?: string;
  user_id?: string; // user_id du propriétaire de la carte
}

export interface MapBusiness {
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
  products_count?: number;
  services_count?: number;
  has_promotions: boolean;
  rating?: number;
  distance?: number; // en km
}

export interface MapEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'physical' | 'online' | 'hybrid';
  start_date: string;
  end_date: string;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  cover_image_url?: string;
  is_free: boolean;
  tickets_config: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    soldCount: number;
  }>;
  current_attendees: number;
  max_capacity?: number;
  status: 'published';
  has_live_stream?: boolean;
  live_stream_status?: 'scheduled' | 'live' | 'ended';
  card_id?: string;
  user_id: string;
  business_name?: string; // Nom du propriétaire de la carte
  business_avatar?: string; // Avatar du propriétaire de la carte
  distance?: number; // Distance depuis user (calculé) en km
}

export interface MapMarker {
  id: string;
  type: PinType;
  position: { lat: number; lng: number };
  data: MapBusiness | MapProduct | MapService | MapEvent;
  is_promotion?: boolean;
  is_selected?: boolean;
}

export type MapFilterType = 
  | 'all'
  | 'products'
  | 'services'
  | 'food'
  | 'promotions'
  | 'premium'
  | 'beauty'
  | 'popular'
  | 'carte';

export interface MapFilters {
  search: string;
  filterType: MapFilterType;
  category?: string;
  maxDistance?: number;
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
  sortBy: 'distance' | 'price' | 'rating' | 'popularity' | 'newest';
  // Nouveaux filtres multi-critères
  minRating?: number;
  badges?: DynamicBadgeType[];
  openNow?: boolean;
  verified?: boolean;
  hasPromotion?: boolean;
}

// Configuration du clustering
export interface ClusterConfig {
  radius: number;        // Rayon de clustering en pixels
  minZoom: number;       // Zoom minimum pour clustering
  maxZoom: number;       // Zoom maximum (après = pas de cluster)
  minPoints: number;     // Nombre minimum de points pour former un cluster
}

export interface MapCluster {
  id: string;
  type: 'cluster';
  position: { lat: number; lng: number };
  pointCount: number;
  markers: MapMarker[];
  expansion_zoom: number;
}

export interface ProductMiniCard {
  product: MapProduct;
  position: { lat: number; lng: number };
}

export interface ServiceMiniCard {
  service: MapService;
  position: { lat: number; lng: number };
}

// Historique de recherche pour suggestions personnalisées
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  category?: string;
  resultCount?: number;
}

// Thème (sombre/clair)
export type MapTheme = 'light' | 'dark' | 'auto';

// Configuration de la carte
export interface MapConfig {
  theme: MapTheme;
  clustering: boolean;
  showLabels: boolean;
  animationsEnabled: boolean;
}

