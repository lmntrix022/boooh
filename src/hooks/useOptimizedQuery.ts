import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface OptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  // Options spécifiques à l'optimisation
  enableBackgroundRefetch?: boolean;
  enableStaleWhileRevalidate?: boolean;
  retryOnNetworkError?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export function useOptimizedQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const { user } = useAuth();
  
  const {
    enableBackgroundRefetch = true,
    enableStaleWhileRevalidate = true,
    retryOnNetworkError = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    ...restOptions
  } = options;

  return useQuery({
    queryKey,
    queryFn,
    // Optimisations par défaut
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: enableBackgroundRefetch,
    refetchOnReconnect: true,
    retry: retryOnNetworkError ? 3 : false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Optimisations réseau
    networkMode: 'online',
    // Cache intelligent
    placeholderData: (previousData) => previousData,
    // Optimisations pour les connexions lentes
    refetchOnMount: 'always',
    ...restOptions
  });
}

// Hook spécialisé pour les données critiques (user, auth, etc.)
export function useCriticalQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    staleTime: 0, // Toujours frais
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retryOnNetworkError: true,
    retry: 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Hook pour les données qui changent rarement
export function useStaticQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Hook pour les données en temps réel
export function useRealtimeQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    staleTime: 0,
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // 30 secondes
    refetchIntervalInBackground: true,
  });
} 