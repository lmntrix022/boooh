// Hook pour le clustering dynamique des marqueurs avec Supercluster
import { useMemo, useCallback, useRef } from 'react';
import Supercluster from 'supercluster';
import { MapMarker, MapCluster, ClusterConfig } from '../types';

// Configuration par défaut optimisée
const DEFAULT_CONFIG: ClusterConfig = {
  radius: 60,      // Rayon de clustering en pixels
  minZoom: 0,      // Zoom minimum pour clustering
  maxZoom: 16,     // Zoom maximum (après = pas de cluster)
  minPoints: 2,    // Nombre minimum de points pour former un cluster
};

interface UseMapClusteringProps {
  markers: MapMarker[];
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  config?: Partial<ClusterConfig>;
}

interface ClusterResult {
  clusters: (MapMarker | MapCluster)[];
  supercluster: Supercluster | null;
  getClusterExpansionZoom: (clusterId: number) => number;
  getClusterLeaves: (clusterId: number, limit?: number) => MapMarker[];
}

// Conversion marqueur vers GeoJSON Feature
const markerToFeature = (marker: MapMarker): Supercluster.PointFeature<MapMarker> => ({
  type: 'Feature',
  properties: marker,
  geometry: {
    type: 'Point',
    coordinates: [marker.position.lng, marker.position.lat],
  },
});

// Conversion GeoJSON Feature vers MapCluster
const featureToCluster = (feature: Supercluster.ClusterFeature<MapMarker>): MapCluster => ({
  id: `cluster-${feature.id}`,
  type: 'cluster',
  position: {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  },
  pointCount: feature.properties.point_count || 0,
  markers: [],
  expansion_zoom: feature.properties.cluster_id ? 0 : 16,
});

export function useMapClustering({
  markers,
  zoom,
  bounds,
  config,
}: UseMapClusteringProps): ClusterResult {
  // Utiliser useRef pour stocker le dernier markersKey
  const lastMarkersKeyRef = useRef<string>('');
  const superclusterRef = useRef<Supercluster | null>(null);

  // Créer une clé stable pour les markers
  const markersKey = useMemo(() => {
    return markers.map(m => m.id).join(',');
  }, [markers]);

  // Merge configuration avec valeurs par défaut stables
  const radius = config?.radius ?? DEFAULT_CONFIG.radius;
  const maxZoom = config?.maxZoom ?? DEFAULT_CONFIG.maxZoom;
  const minZoom = config?.minZoom ?? DEFAULT_CONFIG.minZoom;
  const minPoints = config?.minPoints ?? DEFAULT_CONFIG.minPoints;

  // Créer l'instance Supercluster uniquement quand markers change réellement
  const supercluster = useMemo(() => {
    if (markers.length === 0) {
      superclusterRef.current = null;
      return null;
    }

    // Si les markers n'ont pas changé, réutiliser l'instance existante
    if (markersKey === lastMarkersKeyRef.current && superclusterRef.current) {
      return superclusterRef.current;
    }

    const cluster = new Supercluster({
      radius,
      maxZoom,
      minZoom,
      minPoints,
    });

    const features = markers.map(markerToFeature);
    cluster.load(features);
    
    lastMarkersKeyRef.current = markersKey;
    superclusterRef.current = cluster;
    
    return cluster;
  }, [markers, markersKey, radius, maxZoom, minZoom, minPoints]);

  // Calculer les clusters pour le viewport actuel
  const clusters = useMemo(() => {
    if (!supercluster || !bounds) {
      return markers;
    }

    const bbox: [number, number, number, number] = [
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north,
    ];

    try {
      const clusterFeatures = supercluster.getClusters(bbox, Math.floor(zoom));

      return clusterFeatures.map((feature) => {
        if (feature.properties.cluster) {
          return featureToCluster(feature as Supercluster.ClusterFeature<MapMarker>);
        }
        return feature.properties as MapMarker;
      });
    } catch {
      return markers;
    }
  }, [supercluster, bounds, zoom, markers]);

  // Obtenir le zoom d'expansion pour un cluster
  const getClusterExpansionZoom = useCallback((clusterId: number): number => {
    if (!superclusterRef.current) return 16;
    try {
      return superclusterRef.current.getClusterExpansionZoom(clusterId);
    } catch {
      return 16;
    }
  }, []);

  // Obtenir les marqueurs enfants d'un cluster
  const getClusterLeaves = useCallback((clusterId: number, limit = 100): MapMarker[] => {
    if (!superclusterRef.current) return [];
    try {
      const leaves = superclusterRef.current.getLeaves(clusterId, limit);
      return leaves.map((leaf) => leaf.properties as MapMarker);
    } catch {
      return [];
    }
  }, []);

  return {
    clusters,
    supercluster,
    getClusterExpansionZoom,
    getClusterLeaves,
  };
}

// Fonction utilitaire pour calculer l'icône du cluster
export function getClusterIcon(pointCount: number): {
  size: number;
  color: string;
  textColor: string;
} {
  if (pointCount < 10) {
    return { size: 40, color: '#3B82F6', textColor: '#FFFFFF' };
  }
  if (pointCount < 50) {
    return { size: 48, color: '#8B5CF6', textColor: '#FFFFFF' };
  }
  if (pointCount < 100) {
    return { size: 56, color: '#EC4899', textColor: '#FFFFFF' };
  }
  return { size: 64, color: '#EF4444', textColor: '#FFFFFF' };
}

// Fonction pour générer les couleurs du cluster en fonction du contenu
export function getClusterColors(markers: MapMarker[]): {
  primary: string;
  secondary: string;
} {
  const types = markers.map((m) => m.type);
  const hasProducts = types.includes('product');
  const hasServices = types.includes('service');

  if (hasProducts && hasServices) {
    return { primary: '#8B5CF6', secondary: '#3B82F6' }; // Purple-Blue gradient
  }
  if (hasProducts) {
    return { primary: '#10B981', secondary: '#34D399' }; // Green gradient
  }
  if (hasServices) {
    return { primary: '#8B5CF6', secondary: '#A78BFA' }; // Purple gradient
  }
  return { primary: '#3B82F6', secondary: '#60A5FA' }; // Blue gradient
}
