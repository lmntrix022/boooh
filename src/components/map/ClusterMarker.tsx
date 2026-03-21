// Composant pour afficher un cluster de marqueurs
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { LazyMarker } from '@/components/LazyMap';
import { motion, AnimatePresence } from 'framer-motion';
import { MapCluster, MapMarker, MapProduct, MapService, MapBusiness } from './types';
import { getClusterIcon } from './hooks/useMapClustering';

// Cache global pour les icônes de cluster
const clusterIconCache = new Map<string, google.maps.Icon>();

interface ClusterMarkerProps {
  cluster: MapCluster;
  onClick: () => void;
  onHover?: (isHovered: boolean) => void;
  getClusterLeaves?: (clusterId: number, limit?: number) => MapMarker[];
}

// Composant pour afficher un aperçu du cluster au survol
const ClusterPreview: React.FC<{
  markers: MapMarker[];
  position: { lat: number; lng: number };
}> = ({ markers }) => {
  const products = markers.filter((m) => m.type === 'product').slice(0, 3);
  const services = markers.filter((m) => m.type === 'service').slice(0, 3);
  const businesses = markers.filter((m) => m.type === 'business').slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-gray-200 min-w-[200px] max-w-[280px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            {markers.length} éléments
          </span>
          <div className="flex gap-1">
            {products.length > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                {products.length} 📦
              </span>
            )}
            {services.length > 0 && (
              <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                {services.length} ✨
              </span>
            )}
            {businesses.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                {businesses.length} 🏪
              </span>
            )}
          </div>
        </div>

        {/* Aperçu des produits */}
        {products.length > 0 && (
          <div className="mb-2">
            <div className="flex gap-1 overflow-hidden">
              {products.map((m, idx) => {
                const product = m.data as MapProduct;
                return (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        📦
                      </div>
                    )}
                  </div>
                );
              })}
              {products.length < markers.filter((m) => m.type === 'product').length && (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                  +{markers.filter((m) => m.type === 'product').length - products.length}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Cliquez pour zoomer
        </p>
      </div>
    </motion.div>
  );
};

// Fonction pour générer l'icône en dehors du composant
const generateClusterIcon = (pointCount: number, isHovered: boolean): google.maps.Icon | null => {
  if (typeof document === 'undefined' || typeof google === 'undefined') return null;

  const iconConfig = getClusterIcon(pointCount);
  const hoverSuffix = isHovered ? '-hover' : '';
  const cacheKey = `cluster-${pointCount}-${iconConfig.size}${hoverSuffix}`;

  // Vérifier le cache
  if (clusterIconCache.has(cacheKey)) {
    return clusterIconCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const scale = 2; // Retina support
  const size = isHovered ? iconConfig.size * 1.15 : iconConfig.size;
  const padding = 10;
  const canvasSize = (size + padding * 2) * scale;

  canvas.width = canvasSize;
  canvas.height = canvasSize;
  ctx.scale(scale, scale);

  const centerX = (size + padding * 2) / 2;
  const centerY = (size + padding * 2) / 2;
  const radius = size / 2;

  // Ombre
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = isHovered ? 16 : 10;
  ctx.shadowOffsetY = isHovered ? 6 : 4;

  // Cercle extérieur avec dégradé
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, isHovered ? '#60A5FA' : iconConfig.color);
  gradient.addColorStop(1, iconConfig.color);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset ombre
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Bordure blanche
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Texte (nombre)
  ctx.fillStyle = iconConfig.textColor;
  ctx.font = `bold ${size * 0.4}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayCount = pointCount > 99 ? '99+' : pointCount.toString();
  ctx.fillText(displayCount, centerX, centerY);

  // Créer l'icône
  const totalSize = size + padding * 2;
  const iconResult: google.maps.Icon = {
    url: canvas.toDataURL('image/png'),
    scaledSize: new google.maps.Size(totalSize, totalSize),
    anchor: new google.maps.Point(totalSize / 2, totalSize / 2),
  };

  clusterIconCache.set(cacheKey, iconResult);
  return iconResult;
};

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  cluster,
  onClick,
  onHover,
  getClusterLeaves,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewMarkers, setPreviewMarkers] = useState<MapMarker[]>([]);
  const iconGeneratedRef = useRef(false);

  // Générer l'icône de manière stable
  const icon = useMemo(() => {
    if (typeof google === 'undefined' || !google.maps) return undefined;
    return generateClusterIcon(cluster.pointCount, isHovered) || undefined;
  }, [cluster.pointCount, isHovered]);

  // Charger les marqueurs pour l'aperçu au survol
  useEffect(() => {
    if (isHovered && getClusterLeaves) {
      const clusterId = parseInt(cluster.id.replace('cluster-', ''));
      const leaves = getClusterLeaves(clusterId, 6);
      setPreviewMarkers(leaves);
    } else {
      setPreviewMarkers([]);
    }
  }, [isHovered, getClusterLeaves, cluster.id]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(false);
  }, [onHover]);

  if (!icon) return null;

  return (
    <>
      <LazyMarker
        position={cluster.position}
        icon={icon}
        onClick={onClick}
        onMouseOver={handleMouseEnter}
        onMouseOut={handleMouseLeave}
        zIndex={isHovered ? 3000 : 2000}
        title={`${cluster.pointCount} éléments`}
      />

      {/* Aperçu au survol */}
      <AnimatePresence>
        {isHovered && previewMarkers.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: cluster.position.lng,
              top: cluster.position.lat,
            }}
          >
            <ClusterPreview
              markers={previewMarkers}
              position={cluster.position}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClusterMarker;
