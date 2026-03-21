import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Send, X, RotateCcw, Bookmark, Layers, Sparkles, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Styles CSS pour les animations personnalisées
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
}

interface MapFilters {
  search: string;
  business_sector?: string;
  tags?: string[];
  sortBy?: string;
  maxDistance?: number;
}

interface PremiumFiltersPanelProps {
  filters: MapFilters;
  setFilters: (filters: MapFilters) => void;
  searchInput: string;
  setSearchInput: (input: string) => void;
  onSearch: () => void;
  onSaveSearch: () => void;
  onResetFilters: () => void;
  resultsCount: number;
  userLocation: [number, number] | null;
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
  savedSearches: any[];
  onLoadSearch: (search: any) => void;
  onDeleteSearch: (index: number) => void;
}


const MAP_STYLES = [
  { id: 'default', name: 'Rues', mapTypeId: 'roadmap' },
  { id: 'satellite', name: 'Satellite', mapTypeId: 'satellite' },
  { id: 'hybrid', name: 'Hybride', mapTypeId: 'hybrid' },
  { id: 'terrain', name: 'Terrain', mapTypeId: 'terrain' },
];

export const PremiumFiltersPanel: React.FC<PremiumFiltersPanelProps> = ({
  filters,
  setFilters,
  searchInput,
  setSearchInput,
  onSearch,
  onSaveSearch,
  onResetFilters,
  resultsCount,
  userLocation,
  mapStyle,
  onMapStyleChange,
  savedSearches,
  onLoadSearch,
  onDeleteSearch
}) => {
  const navigate = useNavigate();
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  
  const hasActiveFilters = isSearchFormOpen && (
    filters.business_sector || 
    (filters.tags && filters.tags.length > 0) || 
    filters.maxDistance
  );

  return (
    <div className="absolute top-20 left-4 z-10 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full flex items-start justify-start"
      >
        {isSearchFormOpen ? (
          <Card className="bg-white/98 backdrop-blur-2xl border border-white/50 shadow-3xl rounded-3xl overflow-hidden relative h-full flex flex-col group">
          {/* Fond décoratif minimaliste et élégant */}
          <div className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(156,163,175,0.08) 0, transparent 70%),
                radial-gradient(circle at 70% 80%, rgba(107,114,128,0.06) 0, transparent 70%),
                radial-gradient(circle at 50% 50%, rgba(75,85,99,0.04) 0, transparent 80%)
              `
            }}
          />
          
          {/* Effet de brillance subtil */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              transform: 'translateX(-100%)'
            }}
            animate={{ transform: 'translateX(100%)' }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          <CardContent className="p-0 relative flex-1 overflow-y-auto">
          {/* Header minimaliste et élégant */}
          <div className="p-6 pb-5 border-b border-gray-200/40 bg-gradient-to-br from-white/98 via-white/95 to-white/90 backdrop-blur-2xl relative overflow-hidden group">
            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-50" />
            
            {/* Effet de halo subtil */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(156,163,175,0.1) 0%, transparent 70%)'
              }}
              animate={{ 
                opacity: [0.2, 0.3, 0.2],
                scale: [1, 1.01, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Bouton Retour Accueil - Mêmes animations que le bouton "o" */}
                  <motion.button 
                    onClick={() => navigate('/')}
                    className="w-10 h-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-pointer border-2 border-gray-600/30 backdrop-blur-sm"
                    whileHover={{ 
                      scale: 1.08, 
                      rotate: 5,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                      borderColor: "rgba(156, 163, 175, 0.5)"
                    }}
                    whileTap={{ 
                      scale: 0.85,
                      rotate: -2,
                      boxShadow: "0 10px 20px -8px rgba(0, 0, 0, 0.3)"
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      mass: 0.8
                    }}
                    aria-label="Retour à l'accueil"
                  >
                    {/* Effet de brillance sophistiqué */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    {/* Effet de halo pulsant */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    <motion.div
                      className="relative z-10"
                      whileHover={{ rotate: [0, -10, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      <Home className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={2.5} />
                    </motion.div>
                  </motion.button>

                  {/* Bouton Recherche */}
                  <motion.button 
                    onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
                    className="w-10 h-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-pointer border-2 border-gray-600/30 backdrop-blur-sm"
                    whileHover={{ 
                      scale: 1.08, 
                      rotate: 5,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                      borderColor: "rgba(156, 163, 175, 0.5)"
                    }}
                    whileTap={{ 
                      scale: 0.85,
                      rotate: -2,
                      boxShadow: "0 10px 20px -8px rgba(0, 0, 0, 0.3)"
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      mass: 0.8
                    }}
                    aria-label="Ouvrir le formulaire de recherche"
                  >
                    {/* Effet de brillance sophistiqué */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    {/* Effet de halo pulsant */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    <motion.span 
                      className="text-white font-bold text-3xl relative z-10 drop-shadow-lg"
                      animate={{ 
                        rotate: 0,
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 0.4, ease: "easeInOut" },
                        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                      }}
                      whileTap={{
                        scale: 0.9,
                        rotate: 5
                      }}
                    >
                      o
                    </motion.span>
                  </motion.button>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMapStyleChange(MAP_STYLES[(MAP_STYLES.findIndex(s => s.mapTypeId === mapStyle) + 1) % MAP_STYLES.length].mapTypeId)}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50/80 rounded-2xl p-3 transition-all duration-300 w-12 h-12 flex items-center justify-center shadow-md hover:shadow-lg border border-gray-200/40 backdrop-blur-sm group"
                    >
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Layers className="w-5 h-5 group-hover:text-gray-800 transition-colors" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Barre de recherche ultra-sophistiquée */}
            <AnimatePresence>
              {isSearchFormOpen && (
                <motion.div 
                  className="relative group"
                  initial={{ opacity: 0, y: 15, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, y: -15, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 transition-colors group-focus-within:text-gray-600" />
                    <Input
                      value={searchInput}
                      placeholder="Recherche globale : nom, entreprise, ville, secteur..."
                      className="pl-12 pr-16 py-4 rounded-2xl bg-white/98 backdrop-blur-xl border border-gray-200/60 focus:border-gray-400 focus:ring-2 focus:ring-gray-100/50 transition-all duration-300 text-sm shadow-lg hover:shadow-xl h-14 font-medium placeholder:text-gray-400"
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
                    />
                    <motion.button
                      onClick={onSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl w-10 h-10 flex items-center justify-center group"
                      aria-label="Rechercher"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  {/* Effet de focus subtil */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gray-100/20 to-gray-200/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                    initial={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section des résultats et actions améliorée */}
          <AnimatePresence>
            {isSearchFormOpen && (
              <motion.div 
                className="p-6 pt-4 space-y-4"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
              >
            
            {/* Filtres actifs avec design premium amélioré */}
            {hasActiveFilters && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-5 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-xl relative overflow-hidden"
              >
                {/* Effet de brillance subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div 
                      className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-bold text-gray-800">Filtres actifs</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {filters.business_sector && (
                      <motion.span 
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {filters.business_sector}
                      </motion.span>
                    )}
                    {filters.tags && filters.tags.length > 0 && (
                      <motion.span 
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {filters.tags.length} tag{filters.tags.length > 1 ? 's' : ''}
                      </motion.span>
                    )}
                    {filters.maxDistance && (
                      <motion.span 
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {filters.maxDistance}km
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Résumé des résultats avec design premium */}
            <motion.div 
              className="flex justify-between items-center mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-md relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative z-10 flex justify-between items-center w-full">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-10 h-10 bg-blue-950 rounded-lg flex items-center justify-center shadow-md relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-white font-bold text-sm">{resultsCount}</span>
                  </motion.div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-semibold text-gray-800 leading-tight">
                      Résultat{resultsCount > 1 ? 's' : ''} trouvé{resultsCount > 1 ? 's' : ''}
                    </span>
                    <p className="text-xs text-gray-600 leading-tight font-medium">sur la carte</p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                    className="text-xs rounded-lg border border-gray-300/50 bg-white/80 hover:bg-gray-50/80 transition-all shadow-sm hover:shadow-md h-8 px-3 ml-4 flex items-center justify-center backdrop-blur-sm"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Réinitialiser
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Actions avec design premium amélioré */}
            <div className="space-y-3 mt-6">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveSearch}
                  className="w-full rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-white/90 to-white/70 hover:from-indigo-50/90 hover:to-purple-50/70 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl h-12 group"
                >
                  <motion.div
                    className="flex items-center justify-center space-x-3"
                    whileHover={{ x: 2 }}
                  >
                    <Bookmark className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                    <span className="font-semibold text-sm text-gray-700 group-hover:text-gray-800">Sauvegarder cette recherche</span>
                  </motion.div>
                </Button>
              </motion.div>
            </div>

              {/* Recherches sauvegardées */}
              {savedSearches.length > 0 && (
                <motion.div 
                  className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-md relative overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="relative z-10">
                    <div className="text-xs text-gray-600 font-bold mb-3 flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      </motion.div>
                      <span>Recherches sauvegardées</span>
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {savedSearches.map((search, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + idx * 0.1 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2 py-1 h-8 flex-1 justify-start text-left rounded-lg hover:bg-blue-50/50 transition-all duration-300"
                              onClick={() => onLoadSearch(search)}
                            >
                              {search.filters.search ? `"${search.filters.search}"` : `Recherche #${idx + 1}`}
                            </Button>
                          </motion.div>
                          <motion.button
                            onClick={() => onDeleteSearch(idx)}
                            className="text-xs text-red-400 hover:text-red-600 px-1 rounded-lg w-7 h-7 flex items-center justify-center hover:bg-red-50/50 transition-all duration-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Supprimer"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              </motion.div>
            )}
          </AnimatePresence>

          </CardContent>
        </Card>
        ) : (
          /* Bouton "b" seul avec design premium */
          <motion.div
            className="relative flex items-start justify-start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Fond décoratif pour le bouton seul */}
            <div className="absolute top-0 left-0 w-20 h-20 -z-10 pointer-events-none"
              style={{
                background: `
                  radial-gradient(circle at 50% 50%, rgba(156,163,175,0.1) 0, transparent 70%)
                `
              }}
            />
            
            <motion.button 
              onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
              className="w-10 h-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-pointer border-2 border-gray-600/30 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.08, 
                rotate: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                borderColor: "rgba(156, 163, 175, 0.5)"
              }}
              whileTap={{ 
                scale: 0.85,
                rotate: -2,
                boxShadow: "0 10px 20px -8px rgba(0, 0, 0, 0.3)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                mass: 0.8
              }}
              aria-label="Ouvrir le formulaire de recherche"
            >
              {/* Effet de brillance sophistiqué */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Effet de halo pulsant */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent"
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <motion.span 
                className="text-white font-bold text-3xl relative z-10 drop-shadow-lg"
                animate={{ 
                  rotate: 180,
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 0.4, ease: "easeInOut" },
                  scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                }}
                whileTap={{
                  scale: 0.9,
                  rotate: 185
                }}
              >
                o
              </motion.span>
            </motion.button>
            
            {/* Indicateur visuel subtil */}
            <motion.div
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PremiumFiltersPanel;
