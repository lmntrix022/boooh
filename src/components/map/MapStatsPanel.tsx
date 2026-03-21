import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, MapPin, Users, Calendar, BarChart3 } from 'lucide-react';
import { BusinessCard } from './InteractiveMap';

interface MapStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cards: BusinessCard[];
  userLocation: [number, number] | null;
}

export const MapStatsPanel: React.FC<MapStatsPanelProps> = ({
  isOpen,
  onClose,
  cards,
  userLocation
}) => {
  if (!isOpen) return null;

  // Calculer les statistiques
  const totalCards = cards.length;
  const sectors = cards.reduce((acc, card) => {
    const sector = card.business_sector || 'Non spécifié';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSectors = Object.entries(sectors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const cities = [...new Set(cards.map(card => card.city).filter(Boolean))];
  const uniqueCities = cities.length;

  // Calculer la distance moyenne si userLocation est disponible
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  let averageDistance = null;
  if (userLocation && cards.length > 0) {
    const distances = cards
      .filter(card => card.latitude && card.longitude)
      .map(card => calculateDistance(userLocation[0], userLocation[1], card.latitude!, card.longitude!));
    
    if (distances.length > 0) {
      averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    }
  }

  // Cartes récentes (7 derniers jours)
  const recentCards = cards.filter(card => {
    const cardDate = new Date(card.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return cardDate >= sevenDaysAgo;
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-20 right-6 z-30 w-[380px] max-w-[calc(100vw-2rem)]"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistiques de la carte
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Statistiques principales */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{totalCards}</p>
                  <p className="text-xs text-gray-600 mt-1">professionnels</p>
                </motion.div>

                <motion.div
                  className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">Villes</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{uniqueCities}</p>
                  <p className="text-xs text-gray-600 mt-1">villes différentes</p>
                </motion.div>

                {averageDistance !== null && (
                  <motion.div
                    className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-700">Distance</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{averageDistance.toFixed(1)}</p>
                    <p className="text-xs text-gray-600 mt-1">km en moyenne</p>
                  </motion.div>
                )}

                <motion.div
                  className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-semibold text-gray-700">Récent</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{recentCards}</p>
                  <p className="text-xs text-gray-600 mt-1">7 derniers jours</p>
                </motion.div>
              </div>

              {/* Top secteurs */}
              {topSectors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Secteurs d'activité</h3>
                  <div className="space-y-2">
                    {topSectors.map(([sector, count], index) => (
                      <motion.div
                        key={sector}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <span className="text-sm text-gray-700">{sector}</span>
                        <span className="text-sm font-bold text-blue-600">{count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


