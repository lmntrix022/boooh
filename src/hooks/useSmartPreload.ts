/**
 * Hook pour le préchargement intelligent
 * 
 * Fonctionnalités:
 * - Détection de connexion lente
 * - Préchargement conditionnel
 * - Optimisation des ressources
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheManager } from '@/utils/cacheManager';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

export interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PreloadOptions {
  priority: 'low' | 'medium' | 'high';
  maxSize?: number; // Taille max en bytes
  timeout?: number; // Timeout en ms
  retries?: number;
}

export interface PreloadResult {
  success: boolean;
  duration: number;
  error?: string;
}

export const useSmartPreload = () => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const preloadQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessing = useRef(false);

  // Détecter les informations de connexion
  useEffect(() => {
    const detectConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const info: ConnectionInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        };
        
        setConnectionInfo(info);
        
        // Déterminer si la connexion est lente
        const slow = info.effectiveType === 'slow-2g' || 
                    info.effectiveType === '2g' ||
                    info.downlink < 1.5 ||
                    info.rtt > 1000;
        
        setIsSlowConnection(slow);
        setIsLowDataMode(info.saveData);

        // Log removed
      } else {
        // Fallback: considérer comme connexion normale
        setIsSlowConnection(false);
        setIsLowDataMode(false);
      }
    };

    detectConnection();

    // Écouter les changements de connexion
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', detectConnection);
      
      return () => {
        connection.removeEventListener('change', detectConnection);
      };
    }
  }, []);

  // Traiter la queue de préchargement
  const processPreloadQueue = useCallback(async () => {
    if (isProcessing.current || preloadQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (preloadQueue.current.length > 0) {
      const preloadFn = preloadQueue.current.shift();
      if (preloadFn) {
        try {
          await preloadFn();
          // Petit délai entre les préchargements pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Warning log removed
        }
      }
    }

    isProcessing.current = false;
  }, []);

  // Précharger avec intelligence
  const preloadIfNeeded = useCallback(async (
    preloadFn: () => Promise<any>,
    options: PreloadOptions = { priority: 'medium' }
  ): Promise<PreloadResult> => {
    const startTime = performance.now();

    try {
      // Vérifier si on peut précharger
      if (!canPreload(options)) {
        return {
          success: false,
          duration: performance.now() - startTime,
          error: 'Préchargement désactivé (connexion lente ou mode économie)'
        };
      }

      // Ajouter à la queue si priorité faible
      if (options.priority === 'low') {
        preloadQueue.current.push(preloadFn);
        processPreloadQueue();
        return {
          success: true,
          duration: performance.now() - startTime
        };
      }

      // Exécuter immédiatement pour priorité medium/high
      await preloadFn();
      
      const duration = performance.now() - startTime;
      PerformanceMonitor.logQuery(`preload-${options.priority}`, duration, true);

      return {
        success: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      PerformanceMonitor.logQuery(`preload-${options.priority}`, duration, false, errorMessage);
      
      return {
        success: false,
        duration,
        error: errorMessage
      };
    }
  }, [isSlowConnection, isLowDataMode]);

  // Vérifier si on peut précharger
  const canPreload = useCallback((options: PreloadOptions): boolean => {
    // Mode économie de données
    if (isLowDataMode) {
      return false;
    }

    // Connexion lente - seulement priorité haute
    if (isSlowConnection && options.priority !== 'high') {
      return false;
    }

    // Vérifier la taille du cache
    if (options.maxSize) {
      const cacheStats = CacheManager.getCacheStats();
      if (cacheStats.size > options.maxSize) {
        return false;
      }
    }

    return true;
  }, [isSlowConnection, isLowDataMode]);

  // Précharger une page
  const preloadPage = useCallback(async (
    pageName: string,
    preloadFn: () => Promise<any>,
    options: PreloadOptions = { priority: 'medium' }
  ): Promise<PreloadResult> => {
    // Log removed
    
    const result = await preloadIfNeeded(preloadFn, options);
    
    if (result.success) {
      // Log removed
    } else {
      // Warning log removed
    }

    return result;
  }, [preloadIfNeeded]);

  // Précharger des données
  const preloadData = useCallback(async (
    dataName: string,
    queryFn: () => Promise<any>,
    options: PreloadOptions = { priority: 'low' }
  ): Promise<PreloadResult> => {
    // Log removed
    
    const result = await preloadIfNeeded(queryFn, options);
    
    if (result.success) {
      // Log removed
    } else {
      // Warning log removed
    }

    return result;
  }, [preloadIfNeeded]);

  // Précharger des images
  const preloadImages = useCallback(async (
    imageUrls: string[],
    options: PreloadOptions = { priority: 'low' }
  ): Promise<PreloadResult[]> => {
    if (!canPreload(options)) {
      return imageUrls.map(() => ({
        success: false,
        duration: 0,
        error: 'Préchargement désactivé'
      }));
    }

    const results = await Promise.allSettled(
      imageUrls.map(async (url) => {
        const startTime = performance.now();
        
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          
          return {
            success: true,
            duration: performance.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            duration: performance.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        duration: 0,
        error: result.status === 'rejected' ? String(result.reason) : 'Unknown error'
      }
    );
  }, [canPreload]);

  // Obtenir les recommandations de préchargement
  const getPreloadRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (isSlowConnection) {
      recommendations.push('🐌 Connexion lente: Préchargement minimal recommandé');
    }

    if (isLowDataMode) {
      recommendations.push('💾 Mode économie: Préchargement désactivé');
    }

    const cacheStats = CacheManager.getCacheStats();
    if (cacheStats.shouldCleanup) {
      recommendations.push('🧹 Cache volumineux: Nettoyage recommandé avant préchargement');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Conditions optimales pour le préchargement');
    }

    return recommendations;
  }, [isSlowConnection, isLowDataMode]);

  return {
    // État de la connexion
    connectionInfo,
    isSlowConnection,
    isLowDataMode,
    
    // Fonctions de préchargement
    preloadIfNeeded,
    preloadPage,
    preloadData,
    preloadImages,
    
    // Utilitaires
    canPreload,
    getPreloadRecommendations,
    
    // Queue de préchargement
    queueSize: preloadQueue.current.length,
    isProcessing: isProcessing.current
  };
};

// Hook simplifié pour le préchargement conditionnel
export const useConditionalPreload = (preloadFn: () => Promise<any>, shouldPreload: boolean) => {
  const { preloadIfNeeded, isSlowConnection, isLowDataMode } = useSmartPreload();

  useEffect(() => {
    if (shouldPreload && !isSlowConnection && !isLowDataMode) {
      preloadIfNeeded(preloadFn, { priority: 'low' });
    }
  }, [shouldPreload, preloadFn, preloadIfNeeded, isSlowConnection, isLowDataMode]);
};

export default useSmartPreload;
