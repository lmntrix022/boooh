/**
 * Performance Monitor - Monitoring des performances de l'application
 * 
 * Fonctionnalités:
 * - Monitoring des requêtes
 * - Métriques de cache
 * - Alertes de performance
 * - Dashboard de monitoring
 */

export interface PerformanceMetrics {
  queryTimes: Map<string, number>;
  cacheStats: {
    size: number;
    sizeMB: number;
    hitRate: number;
  };
  memoryUsage: number;
  lastUpdated: Date;
}

export interface QueryPerformance {
  queryName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private queryTimes = new Map<string, number[]>();
  private queryHistory: QueryPerformance[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 seconde
  private readonly CRITICAL_QUERY_THRESHOLD = 3000; // 3 secondes

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enregistrer une requête
   */
  static logQuery(queryName: string, duration: number, success = true, error?: string): void {
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordQuery(queryName, duration, success, error);
  }

  /**
   * Enregistrer une requête avec wrapper
   */
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await queryFn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      PerformanceMonitor.logQuery(queryName, duration, success, error);
    }
  }

  /**
   * Obtenir les métriques de performance
   */
  static getMetrics(): PerformanceMetrics {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.calculateMetrics();
  }

  /**
   * Obtenir l'historique des requêtes
   */
  static getQueryHistory(limit = 20): QueryPerformance[] {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.queryHistory.slice(-limit);
  }

  /**
   * Obtenir les requêtes les plus lentes
   */
  static getSlowQueries(limit = 10): QueryPerformance[] {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.queryHistory
      .filter(q => q.duration > monitor.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Obtenir les statistiques par requête
   */
  static getQueryStats(): Record<string, {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  }> {
    const monitor = PerformanceMonitor.getInstance();
    const stats: Record<string, any> = {};

    monitor.queryTimes.forEach((times, queryName) => {
      const queryHistory = monitor.queryHistory.filter(q => q.queryName === queryName);
      const successCount = queryHistory.filter(q => q.success).length;
      
      stats[queryName] = {
        count: times.length,
        avgDuration: times.reduce((sum, time) => sum + time, 0) / times.length,
        minDuration: Math.min(...times),
        maxDuration: Math.max(...times),
        successRate: (successCount / queryHistory.length) * 100
      };
    });

    return stats;
  }

  /**
   * Obtenir les alertes de performance
   */
  static getAlerts(): string[] {
    const monitor = PerformanceMonitor.getInstance();
    const alerts: string[] = [];

    // Vérifier les requêtes lentes
    const slowQueries = monitor.getSlowQueries(5);
    if (slowQueries.length > 0) {
      alerts.push(`🐌 ${slowQueries.length} requête(s) lente(s) détectée(s)`);
    }

    // Vérifier les requêtes critiques
    const criticalQueries = monitor.queryHistory.filter(q => q.duration > monitor.CRITICAL_QUERY_THRESHOLD);
    if (criticalQueries.length > 0) {
      alerts.push(`🚨 ${criticalQueries.length} requête(s) critique(s) détectée(s)`);
    }

    // Vérifier le taux d'erreur
    const recentQueries = monitor.queryHistory.slice(-20);
    if (recentQueries.length > 0) {
      const errorRate = (recentQueries.filter(q => !q.success).length / recentQueries.length) * 100;
      if (errorRate > 10) {
        alerts.push(`❌ Taux d'erreur élevé: ${errorRate.toFixed(1)}%`);
      }
    }

    // Vérifier la taille du cache
    const cacheSize = this.getCacheSize();
    if (cacheSize > 3 * 1024 * 1024) {
      alerts.push(`💾 Cache volumineux: ${(cacheSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return alerts;
  }

  /**
   * Obtenir la taille du cache
   */
  private static getCacheSize(): number {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('booh')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      }
      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * Enregistrer une requête
   */
  private recordQuery(queryName: string, duration: number, success: boolean, error?: string): void {
    // Ajouter à l'historique des temps
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }
    const times = this.queryTimes.get(queryName)!;
    times.push(duration);
    
    // Garder seulement les 50 derniers temps par requête
    if (times.length > 50) {
      times.shift();
    }

    // Ajouter à l'historique complet
    this.queryHistory.push({
      queryName,
      duration,
      timestamp: new Date(),
      success,
      error
    });

    // Garder seulement les 100 dernières requêtes
    if (this.queryHistory.length > this.MAX_HISTORY) {
      this.queryHistory.shift();
    }

    // Log des requêtes lentes
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      const level = duration > this.CRITICAL_QUERY_THRESHOLD ? '🚨' : '🐌';
      // Warning log removed
    }

    // Log des erreurs
    if (!success && error) {
      // Error log removed
    }
  }

  /**
   * Calculer les métriques
   */
  private calculateMetrics(): PerformanceMetrics {
    const totalQueries = this.queryHistory.length;
    const successfulQueries = this.queryHistory.filter(q => q.success).length;
    const hitRate = totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 100;

    return {
      queryTimes: new Map(Array.from(this.queryTimes.entries()).map(([key, values]) => [key, values[values.length - 1] || 0])),
      cacheStats: {
        size: PerformanceMonitor.getCacheSize(),
        sizeMB: Math.round((PerformanceMonitor.getCacheSize() / 1024 / 1024) * 100) / 100,
        hitRate: Math.round(hitRate * 100) / 100
      },
      memoryUsage: this.getMemoryUsage(),
      lastUpdated: new Date()
    };
  }

  /**
   * Obtenir l'usage mémoire
   */
  private getMemoryUsage(): number {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Obtenir les requêtes lentes
   */
  private getSlowQueries(limit: number): QueryPerformance[] {
    return this.queryHistory
      .filter(q => q.duration > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Exporter les métriques pour debugging
   */
  static exportMetrics(): string {
    const metrics = this.getMetrics();
    const stats = this.getQueryStats();
    const alerts = this.getAlerts();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      stats,
      alerts,
      queryHistory: this.getQueryHistory(50)
    }, null, 2);
  }

  /**
   * Réinitialiser les métriques
   */
  static reset(): void {
    const monitor = PerformanceMonitor.getInstance();
    monitor.queryTimes.clear();
    monitor.queryHistory = [];
    // Log removed
  }
}

// Export des fonctions utilitaires
export const logQuery = PerformanceMonitor.logQuery;
export const measureQuery = PerformanceMonitor.measureQuery;
export const getMetrics = PerformanceMonitor.getMetrics;
export const getQueryHistory = PerformanceMonitor.getQueryHistory;
export const getSlowQueries = PerformanceMonitor.getSlowQueries;
export const getQueryStats = PerformanceMonitor.getQueryStats;
export const getAlerts = PerformanceMonitor.getAlerts;
export const exportMetrics = PerformanceMonitor.exportMetrics;
export const resetMetrics = PerformanceMonitor.reset;
