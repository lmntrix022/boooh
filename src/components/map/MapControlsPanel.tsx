import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Ruler,
  Share2,
  Download,
  Maximize,
  Minimize,
  Navigation,
  BarChart3,
  Calendar,
  TrendingUp,
  MapPin,
  List,
  X,
  Info,
  Route,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MapControlsPanelProps {
  onMeasureDistance: () => void;
  onShare: () => void;
  onExport: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  onGoToLocation: () => void;
  onShowStats: () => void;
  onShowList: () => void;
  showList: boolean;
  totalMarkers: number;
  userLocation: [number, number] | null;
  mapRef: React.RefObject<google.maps.Map | null>;
}

export const MapControlsPanel: React.FC<MapControlsPanelProps> = ({
  onMeasureDistance,
  onShare,
  onExport,
  onFullscreen,
  isFullscreen,
  onGoToLocation,
  onShowStats,
  onShowList,
  showList,
  totalMarkers,
  userLocation,
  mapRef
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Carte Interactive Bööh',
          text: 'Découvrez les professionnels sur la carte interactive',
          url: window.location.href
        });
      } catch (err) {
        console.error('Erreur lors du partage:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleExport = () => {
    if (!mapRef.current) return;
    
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const exportData = {
      bounds: {
        north: ne.lat(),
        east: ne.lng(),
        south: sw.lat(),
        west: sw.lng()
      },
      markers: totalMarkers,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carte-bööh-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Contrôles principaux */}
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Géolocalisation */}
          {userLocation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={onGoToLocation}
                  className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Navigation className="w-5 h-5 text-blue-600" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aller à ma position</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Mesure de distance */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onMeasureDistance}
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Ruler className="w-5 h-5 text-purple-600" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mesurer une distance</p>
            </TooltipContent>
          </Tooltip>

          {/* Statistiques */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onShowStats}
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Statistiques</p>
            </TooltipContent>
          </Tooltip>

          {/* Vue liste */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onShowList}
                className={`w-12 h-12 rounded-xl backdrop-blur-md border shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
                  showList 
                    ? 'bg-blue-600/90 border-blue-300 text-white' 
                    : 'bg-white/90 border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <List className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vue liste</p>
            </TooltipContent>
          </Tooltip>

          {/* Partage */}
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-5 h-5 text-indigo-600" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-xl">
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="justify-start hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager la carte
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="justify-start hover:bg-gray-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Lien copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le lien
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="justify-start hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter les données
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Plein écran */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onFullscreen}
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-gray-700" />
                ) : (
                  <Maximize className="w-5 h-5 text-gray-700" />
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Légende */}
          <Popover open={showLegend} onOpenChange={setShowLegend}>
            <PopoverTrigger asChild>
              <motion.button
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info className="w-5 h-5 text-gray-700" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-xl">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Légende</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
                    <span className="text-sm text-gray-700">Professionnel</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-700 border-2 border-white shadow-md"></div>
                    <span className="text-sm text-gray-700">Sélectionné</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">Votre position</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {totalMarkers} professionnel{totalMarkers > 1 ? 's' : ''} sur la carte
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};

