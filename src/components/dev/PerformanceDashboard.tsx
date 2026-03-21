/**
 * Dashboard de Performance - Pour les développeurs
 * 
 * Affiche:
 * - Métriques de cache
 * - Statistiques des requêtes
 * - Alertes de performance
 * - Contrôles de nettoyage
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CacheManager } from '@/utils/cacheManager';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { getCacheStats } from '@/lib/queryClient';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const newStats = getCacheStats();
      setStats(newStats);
      setLastRefresh(new Date());
    } catch (error) {
      // Error log removed
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      const interval = setInterval(refreshStats, 5000); // Rafraîchir toutes les 5s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleCleanup = async () => {
    try {
      await CacheManager.cleanupCache();
      await refreshStats();
    } catch (error) {
      // Error log removed
    }
  };

  const handleExportMetrics = () => {
    const metrics = PerformanceMonitor.exportMetrics();
    const blob = new Blob([metrics], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booh-performance-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetMetrics = () => {
    PerformanceMonitor.reset();
    refreshStats();
  };

  if (!isOpen || !stats) return null;

  const alerts = PerformanceMonitor.getAlerts();
  const slowQueries = PerformanceMonitor.getSlowQueries(5);
  const queryStats = PerformanceMonitor.getQueryStats();

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
                <p className="text-blue-100">Monitoring en temps réel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStats}
                disabled={isRefreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Rafraîchir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Cache Stats */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Cache
                </CardTitle>
                <CardDescription>Statistiques du cache</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taille:</span>
                  <Badge variant={stats.cacheStats.sizeMB > 3 ? 'destructive' : 'default'}>
                    {stats.cacheStats.sizeMB}MB
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Requêtes:</span>
                  <Badge variant="outline">{stats.queryClient.queries}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mutations:</span>
                  <Badge variant="outline">{stats.queryClient.mutations}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dernier nettoyage:</span>
                  <span className="text-xs text-gray-500">
                    {stats.cacheStats.lastCleanup 
                      ? new Date(stats.cacheStats.lastCleanup).toLocaleTimeString()
                      : 'Jamais'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Performance
                </CardTitle>
                <CardDescription>Métriques de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de succès:</span>
                  <Badge variant={stats.performance.cacheStats.hitRate > 90 ? 'default' : 'destructive'}>
                    {stats.performance.cacheStats.hitRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mémoire:</span>
                  <Badge variant="outline">
                    {Math.round((stats.performance.memoryUsage / 1024 / 1024) * 100) / 100}MB
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dernière mise à jour:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(stats.performance.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alertes
                </CardTitle>
                <CardDescription>Alertes de performance</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        {alert}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green-700 bg-green-50 p-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aucune alerte
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slow Queries */}
            <Card className="border-2 border-red-200 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Requêtes Lentes
                </CardTitle>
                <CardDescription>Top 5 des requêtes les plus lentes</CardDescription>
              </CardHeader>
              <CardContent>
                {slowQueries.length > 0 ? (
                  <div className="space-y-2">
                    {slowQueries.map((query, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-mono text-xs truncate flex-1 mr-2">
                          {query.queryName}
                        </span>
                        <Badge variant="destructive">
                          {Math.round(query.duration)}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green-700 bg-green-50 p-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aucune requête lente
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Query Stats */}
            <Card className="border-2 border-purple-200 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Statistiques des Requêtes
                </CardTitle>
                <CardDescription>Performance par type de requête</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(queryStats).map(([queryName, stats]: [string, any]) => (
                    <div key={queryName} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-mono text-xs text-gray-600 mb-2 truncate">
                        {queryName}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Exécutions:</span>
                          <span className="font-medium">{stats.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Moyenne:</span>
                          <span className="font-medium">{Math.round(stats.avgDuration)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Succès:</span>
                          <span className="font-medium">{Math.round(stats.successRate)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button onClick={handleCleanup} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer le Cache
            </Button>
            <Button onClick={handleExportMetrics} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter les Métriques
            </Button>
            <Button onClick={handleResetMetrics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Hook pour utiliser le dashboard
export const usePerformanceDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openDashboard = () => setIsOpen(true);
  const closeDashboard = () => setIsOpen(false);

  // Raccourci clavier pour ouvrir le dashboard (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openDashboard,
    closeDashboard,
    PerformanceDashboard: () => (
      <PerformanceDashboard isOpen={isOpen} onClose={closeDashboard} />
    )
  };
};

export default PerformanceDashboard;
