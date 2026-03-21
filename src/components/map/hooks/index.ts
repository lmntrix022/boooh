// Export de tous les hooks de la carte
export { useMapClustering, getClusterIcon, getClusterColors } from './useMapClustering';
export { 
  useProductBadges, 
  useServiceBadges, 
  useBusinessBadges, 
  enrichWithBadges,
  BADGE_CONFIG,
  NEW_THRESHOLD_DAYS,
} from './useDynamicBadges';
export { useSearchHistory, TRENDING_SUGGESTIONS } from './useSearchHistory';
export { useMapTheme, DARK_MAP_STYLES, LIGHT_MAP_STYLES, DEFAULT_CONFIG } from './useMapTheme';
export { useVoiceSearch, VoiceSearchButton } from './useVoiceSearch';

