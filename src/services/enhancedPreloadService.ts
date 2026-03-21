/**
 * @deprecated Ce service est déprécié. Utilisez cardCacheService à la place.
 * Migration: import { cardCacheService } from '@/services/cache/cardCacheService';
 *
 * Toutes les fonctionnalités ont été migrées vers cardCacheService.
 */
export { cardCacheService as enhancedPreloadService } from './cache/cardCacheService';
export { useCardCache as useEnhancedPreload } from './cache/cardCacheService';
