/**
 * Cache Manager - Gestion intelligente du cache et de l'IndexedDB
 * 
 * Optimisations:
 * - Nettoyage automatique du cache
 * - Monitoring de la taille
 * - Gestion des connexions lentes
 */

export interface CacheStats {
  size: number;
  sizeMB: number;
  shouldCleanup: boolean;
  lastCleanup: Date | null;
}

export class CacheManager {
  private static readonly MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly WARNING_SIZE = 3 * 1024 * 1024; // 3MB
  private static readonly CLEANUP_KEY = 'booh-cache-last-cleanup';

  /**
   * Obtenir les statistiques du cache
   */
  static getCacheStats(): CacheStats {
    const size = this.getCacheSize();
    const sizeMB = size / 1024 / 1024;
    const lastCleanup = this.getLastCleanupDate();

    return {
      size,
      sizeMB: Math.round(sizeMB * 100) / 100,
      shouldCleanup: size > this.WARNING_SIZE,
      lastCleanup
    };
  }

  /**
   * Obtenir la taille du cache en bytes
   */
  static getCacheSize(): number {
    try {
      // Vérifier React Query cache
      const queryCache = localStorage.getItem('booh-cache');
      const querySize = queryCache ? new Blob([queryCache]).size : 0;

      // Vérifier autres données importantes
      const otherKeys = ['booh-user-preferences', 'booh-theme', 'booh-language'];
      const otherSize = otherKeys.reduce((total, key) => {
        const data = localStorage.getItem(key);
        return total + (data ? new Blob([data]).size : 0);
      }, 0);

      return querySize + otherSize;
    } catch (error) {
      // Warning log removed
      return 0;
    }
  }

  /**
   * Nettoyer le cache automatiquement
   */
  static async cleanupCache(force = false): Promise<boolean> {
    try {
      const stats = this.getCacheStats();
      
      if (!force && stats.size < this.WARNING_SIZE) {
        // Log removed
        return false;
      }

      // Log removed

      // Nettoyer React Query cache
      await this.cleanupReactQueryCache();

      // Nettoyer IndexedDB
      await this.cleanupIndexedDB();

      // Nettoyer localStorage (garder seulement l'essentiel)
      this.cleanupLocalStorage();

      // Marquer la date de nettoyage
      this.setLastCleanupDate(new Date());

      const newStats = this.getCacheStats();
      // Log removed

      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Nettoyer le cache React Query
   */
  private static async cleanupReactQueryCache(): Promise<void> {
    try {
      // Supprimer le cache React Query
      localStorage.removeItem('booh-cache');
      
      // Si on a accès au QueryClient, on peut aussi le nettoyer
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        await (window as any).queryClient.clear();
      }
    } catch (error) {
      // Warning log removed
    }
  }

  /**
   * Nettoyer IndexedDB
   */
  private static async cleanupIndexedDB(): Promise<void> {
    try {
      if (!('indexedDB' in window)) {
        return;
      }

      // Lister toutes les bases de données
      const databases = await indexedDB.databases();
      
      for (const db of databases) {
        if (db.name && (
          db.name.includes('booh') || 
          db.name.includes('query') || 
          db.name.includes('tanstack')
        )) {
          await this.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      // Warning log removed
    }
  }

  /**
   * Supprimer une base de données IndexedDB
   */
  private static deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(name);
      
      deleteReq.onsuccess = () => {
        // Log removed
        resolve(undefined);
      };
      
      deleteReq.onerror = () => {
        // Warning log removed
        reject(deleteReq.error);
      };
      
      deleteReq.onblocked = () => {
        // Warning log removed
        // On considère quand même comme un succès
        resolve(undefined);
      };
    });
  }

  /**
   * Nettoyer localStorage (garder l'essentiel)
   */
  private static cleanupLocalStorage(): void {
    const essentialKeys = [
      'booh-user-preferences',
      'booh-theme',
      'booh-language',
      'supabase.auth.token'
    ];

    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !essentialKeys.includes(key) && (
        key.includes('booh') || 
        key.includes('query') ||
        key.includes('tanstack')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      // Log removed
    });
  }

  /**
   * Obtenir la date du dernier nettoyage
   */
  private static getLastCleanupDate(): Date | null {
    try {
      const dateStr = localStorage.getItem(this.CLEANUP_KEY);
      return dateStr ? new Date(dateStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Marquer la date du dernier nettoyage
   */
  private static setLastCleanupDate(date: Date): void {
    try {
      localStorage.setItem(this.CLEANUP_KEY, date.toISOString());
    } catch (error) {
      // Warning log removed
    }
  }

  /**
   * Vérifier si un nettoyage est nécessaire
   */
  static shouldCleanup(): boolean {
    const stats = this.getCacheStats();
    return stats.shouldCleanup || stats.size > this.MAX_CACHE_SIZE;
  }

  /**
   * Obtenir des recommandations de performance
   */
  static getRecommendations(): string[] {
    const stats = this.getCacheStats();
    const recommendations: string[] = [];

    if (stats.size > this.MAX_CACHE_SIZE) {
      recommendations.push('🚨 Cache critique: Nettoyage immédiat recommandé');
    } else if (stats.size > this.WARNING_SIZE) {
      recommendations.push('⚠️ Cache volumineux: Nettoyage recommandé');
    }

    if (stats.lastCleanup) {
      const daysSinceCleanup = Math.floor(
        (Date.now() - stats.lastCleanup.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceCleanup > 7) {
        recommendations.push('📅 Cache ancien: Nettoyage préventif recommandé');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Cache en bon état');
    }

    return recommendations;
  }

  /**
   * Nettoyage automatique au démarrage de l'app
   */
  static async autoCleanupOnStartup(): Promise<void> {
    try {
      // Vérifier si on doit nettoyer automatiquement
      const lastCleanup = this.getLastCleanupDate();
      const shouldAutoCleanup = !lastCleanup || 
        (Date.now() - lastCleanup.getTime()) > (7 * 24 * 60 * 60 * 1000); // 7 jours

      if (shouldAutoCleanup && this.shouldCleanup()) {
        // Log removed
        await this.cleanupCache();
      }
    } catch (error) {
      // Warning log removed
    }
  }

  /**
   * Monitoring continu du cache
   */
  static startMonitoring(intervalMs = 60000): () => void {
    const interval = setInterval(() => {
      const stats = this.getCacheStats();
      
      if (stats.shouldCleanup) {
        // Warning log removed
        
        // Nettoyage automatique si critique
        if (stats.size > this.MAX_CACHE_SIZE) {
          // Log removed
          this.cleanupCache();
        }
      }
    }, intervalMs);

    // Retourner la fonction de nettoyage
    return () => clearInterval(interval);
  }
}
