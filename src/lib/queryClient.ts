import { QueryClient } from '@tanstack/react-query'
import { indexedDBPersister } from './indexedDBPersister'
import { CacheManager } from '@/utils/cacheManager'
import { PerformanceMonitor } from '@/utils/performanceMonitor'

// Configuration optimisée du QueryClient pour les performances
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes - données fraîches pendant 3min (réduit de 5min)
      gcTime: 1000 * 60 * 30, // 30 minutes - garde en cache 30min (réduit de 1h)
      refetchOnWindowFocus: false, // Pas de refetch automatique au focus
      refetchOnMount: false, // Pas de refetch au montage si données fraîches
      refetchOnReconnect: 'always' as const, // Toujours refetch à la reconnexion
      retry: 2, // 2 tentatives (réduit de 3)
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s (réduit de 30s)
      networkMode: 'offlineFirst' as const, // Offline-first pour PWA
      
      // Nouvelles optimisations
      refetchInterval: false as const, // Pas de refetch automatique
      refetchIntervalInBackground: false, // Pas de refetch en arrière-plan
    },
    mutations: {
      retry: 1, // 1 tentative pour les mutations
      networkMode: 'offlineFirst' as const,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5s pour mutations
    },
  },
}

// Singleton QueryClient - Une seule instance dans toute l'app
let queryClientInstance: QueryClient | null = null

export const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient(queryClientConfig)
    
    // Nettoyage automatique au démarrage (sans monitoring pour éviter les conflits)
    try {
      CacheManager.autoCleanupOnStartup()
    } catch (error) {
      // Erreur lors de l'initialisation du CacheManager
    }
  }
  return queryClientInstance
}

// Monitoring désactivé temporairement pour éviter les conflits de versions

// Export par défaut pour compatibilité
export const queryClient = getQueryClient()

// Persister pour IndexedDB (plus performant que localStorage)
export const persister = indexedDBPersister

// Préfetch utilities optimisées
export const prefetchQuery = async (
  queryKey: string[], 
  queryFn: () => Promise<any>,
  options: {
    staleTime?: number;
    gcTime?: number;
  } = {}
) => {
  const { staleTime = 1000 * 60 * 3, gcTime = 1000 * 60 * 30 } = options;
  
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
    gcTime,
  });
}

// Préchargement intelligent avec vérification de connexion
export const smartPrefetch = async (
  queryKey: string[], 
  queryFn: () => Promise<any>,
  options: {
    connectionCheck?: boolean;
    cacheSizeCheck?: boolean;
  } = {}
) => {
  const { connectionCheck = true, cacheSizeCheck = true } = options;
  
  // Vérifier la connexion
  if (connectionCheck && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                           connection.effectiveType === '2g' ||
                           connection.saveData;
    
    if (isSlowConnection) {
      // Log removed
      return;
    }
  }
  
  // Vérifier la taille du cache
  if (cacheSizeCheck) {
    try {
      const cacheStats = CacheManager.getCacheStats();
      if (cacheStats.shouldCleanup) {
        // Log removed
        return;
      }
    } catch (error) {
      // Warning log removed
    }
  }
  
  return prefetchQuery(queryKey, queryFn);
}

// Nettoyage du cache React Query
export const clearQueryCache = async () => {
  try {
    await CacheManager.cleanupCache();
    queryClient.clear();
    // Log removed
  } catch (error) {
    // Warning log removed
    queryClient.clear(); // Nettoyage basique même en cas d'erreur
  }
}

// Obtenir les statistiques du cache
export const getCacheStats = () => {
  try {
    return {
      queryClient: {
        queries: queryClient.getQueryCache().getAll().length,
        mutations: queryClient.getMutationCache().getAll().length,
      },
      ...CacheManager.getCacheStats(),
    };
  } catch (error) {
    // Warning log removed
    return {
      queryClient: {
        queries: 0,
        mutations: 0,
      },
      size: 0,
      sizeMB: 0,
      shouldCleanup: false,
      lastCleanup: null
    };
  }
}
