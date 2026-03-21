import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapFilters } from './types';
import { analyzeSearchQuery, SearchIntent, getContextualSuggestions } from '@/utils/searchInference';
import { useSearchHistory, IconType } from './hooks/useSearchHistory';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { useNavigate } from 'react-router-dom';

export type MapFilterType = 'all' | 'products' | 'services' | 'food' | 'promotions' | 'premium' | 'beauty' | 'popular' | 'carte';

interface MarketplaceFiltersProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  className?: string;
  onOpenAdvancedFilters?: () => void;
  activeFiltersCount?: number;
}

// --- ICÔNES SVG MODERNES (Style Geometric / Minimal) ---
const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>
      <circle cx="19" cy="5" r="2"/>
      <circle cx="5" cy="19" r="1.5"/>
    </svg>
  ),
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  Mic: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 10v1a7 7 0 0014 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  MicActive: () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/>
      <path d="M5 10v1a7 7 0 0014 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Sliders: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 10v11M6 1v3M18 20v1M18 1v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M10 6V4h4v2M6 6v13a2 2 0 002 2h8a2 2 0 002-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 12h16m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trending: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 18L9 11l4 4 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 6h7v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Icônes pour les catégories
  Food: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Beauty: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  Product: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 8V21H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 3h22v5H1V3z" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Service: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
    </svg>
  ),
  Offer: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z"/>
    </svg>
  ),
};

// Fonction pour obtenir l'icône selon le type
const getIconByType = (iconType: IconType): React.ReactNode => {
  switch (iconType) {
    case 'search': return <Icons.Search />;
    case 'clock': return <Icons.Clock />;
    case 'food': return <Icons.Food />;
    case 'beauty': return <Icons.Beauty />;
    case 'product': return <Icons.Product />;
    case 'service': return <Icons.Service />;
    case 'location': return <Icons.Location />;
    case 'trending': return <Icons.Trending />;
    case 'offer': return <Icons.Offer />;
    case 'star': return <Icons.Star />;
    default: return <Icons.Search />;
  }
};

// Composant Smart Tag Premium
const SmartTag: React.FC<{ 
  tag: { label: string; key: string; removable?: boolean }; 
  onRemove?: () => void;
  index: number;
}> = ({ tag, onRemove, index }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, x: -10 }}
    animate={{ scale: 1, opacity: 1, x: 0 }}
    exit={{ scale: 0, opacity: 0, x: -10 }}
    transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 30 }}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-sm"
  >
    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
    <span className="text-xs font-medium text-gray-700">{tag.label}</span>
    {tag.removable && onRemove && (
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="ml-0.5 w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Icons.Close />
      </motion.button>
    )}
  </motion.div>
);

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFiltersChange,
  className = '',
  onOpenAdvancedFilters,
  activeFiltersCount = 0
}) => {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchIntent, setSearchIntent] = useState<SearchIntent | null>(null);
  const [activeTags, setActiveTags] = useState<Array<{ label: string; key: string; removable?: boolean }>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // Hooks personnalisés
  const { history, suggestions, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { isListening, transcript, isSupported: voiceSupported, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceSearch();
  
  // Gérer le résultat de la recherche vocale
  useEffect(() => {
    if (!isListening && transcript) {
      setLocalSearch(transcript);
      resetTranscript();
    }
  }, [isListening, transcript, resetTranscript]);
  
  // Dernières intentions basées sur l'historique
  const lastIntents = useMemo(() => {
    return history.slice(0, 3).map((item) => ({
      label: item.query,
      query: item.query,
      iconType: (item.category === 'food' ? 'food' : item.category === 'beauty' ? 'beauty' : 'clock') as IconType,
    }));
  }, [history]);

  // Suggestions contextuelles
  const contextualSuggestions = useMemo(() => getContextualSuggestions(), []);

  // Analyse intelligente de la recherche
  const analyzedIntent = useMemo(() => {
    if (!localSearch.trim()) return null;
    return analyzeSearchQuery(localSearch);
  }, [localSearch]);

  // Mise à jour des états basés sur l'intent analysé
  useEffect(() => {
    if (!localSearch.trim()) {
      setSearchIntent(null);
      setActiveTags([]);
      setIsAnalyzing(false);
      return;
    }
    
    setIsAnalyzing(true);
    
    if (analyzedIntent) {
      setSearchIntent(analyzedIntent);
      setActiveTags(analyzedIntent.tags || []);
    }
    
    const timer = setTimeout(() => setIsAnalyzing(false), 300);
    return () => clearTimeout(timer);
  }, [localSearch, analyzedIntent]);

  // Fonction pour retirer un tag
  const handleRemoveTag = useCallback((tagKey: string) => {
    setActiveTags(prev => prev.filter(t => t.key !== tagKey));
    const newFilters = { ...filters };
    
    if (tagKey === 'premium') delete newFilters.minPrice;
    else if (tagKey === 'economy') delete newFilters.maxPrice;
    else if (tagKey === 'rating' && newFilters.sortBy === 'rating') {
      newFilters.sortBy = 'distance';
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Appliquer les filtres intelligents automatiquement
  useEffect(() => {
    if (analyzedIntent && analyzedIntent.tags.length > 0 && localSearch.trim()) {
      const newFilters = { ...filters };
      let hasChanges = false;
      
      if (analyzedIntent.promotions && newFilters.filterType !== 'promotions') {
        newFilters.filterType = 'promotions';
        hasChanges = true;
      } else if (analyzedIntent.category) {
        const categoryMap: Record<string, MapFilterType> = {
          food: 'food', beauty: 'beauty', products: 'products', services: 'services'
        };
        const filterType = categoryMap[analyzedIntent.category];
        if (filterType && newFilters.filterType !== filterType) {
          newFilters.filterType = filterType;
          hasChanges = true;
        }
      }
      
      if (analyzedIntent.sortBy && newFilters.sortBy !== analyzedIntent.sortBy) {
        newFilters.sortBy = analyzedIntent.sortBy;
        hasChanges = true;
      }
      
      if (analyzedIntent.priceRange === 'economy' && newFilters.maxPrice !== 50000) {
        newFilters.maxPrice = 50000;
        hasChanges = true;
      } else if (analyzedIntent.priceRange === 'premium' && newFilters.minPrice !== 100000) {
        newFilters.minPrice = 100000;
        hasChanges = true;
      }

      if (analyzedIntent.minRating && analyzedIntent.minRating >= 4) {
        newFilters.sortBy = 'rating';
        hasChanges = true;
      }
      
      if (hasChanges) onFiltersChange(newFilters);
    } else if (!localSearch.trim() && (filters.maxPrice || filters.minPrice)) {
      const newFilters = { ...filters };
      delete newFilters.maxPrice;
      delete newFilters.minPrice;
      onFiltersChange(newFilters);
    }
  }, [analyzedIntent, localSearch]);

  // Debounce pour la recherche textuelle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
        if (localSearch.trim().length >= 2) {
          addToHistory(localSearch, analyzedIntent?.category);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters, onFiltersChange, analyzedIntent, addToHistory]);

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchIntent(null);
    onFiltersChange({ ...filters, search: '', filterType: 'all', sortBy: 'distance' });
  };

  const hasSmartTags = activeTags.length > 0;
  const isActive = isFocused || localSearch.trim() || hasSmartTags;

  // Fonction pour ouvrir la recherche
  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Fonction pour fermer la recherche
  const handleCollapse = () => {
    if (!localSearch.trim()) {
      setIsExpanded(false);
      setIsFocused(false);
    }
  };

  return (
    <div className={`absolute top-4 md:top-6 left-4 md:left-6 z-40 flex flex-col gap-2 md:gap-3 pointer-events-auto ${className}`}>
      
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* BOUTONS - HOME + SEARCH */
          <div className="flex gap-3">
            {/* BOUTON HOME - Mêmes animations que Search */}
            <motion.button
              key="home-button"
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="relative group"
            >
              {/* Glow subtil - identique au bouton Search */}
              <div className="absolute -inset-1 bg-gradient-to-b from-white/60 to-white/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Bouton principal - identique au bouton Search */}
              <div className="relative w-12 h-12 rounded-[14px] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </motion.button>

            {/* BOUTON SEARCH - AWWWARDS LEVEL */}
            <motion.button
              key="search-toggle"
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExpand}
              className="relative group"
            >
              {/* Glow subtil */}
              <div className="absolute -inset-1 bg-gradient-to-b from-white/60 to-white/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Bouton principal */}
              <div className="relative w-12 h-12 rounded-[14px] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700 transition-all">
                <Icons.Search />
              </div>

              {/* Badge filtres actifs */}
              <AnimatePresence>
                {activeFiltersCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-black text-white text-[9px] font-semibold rounded-full flex items-center justify-center shadow-lg"
                  >
                    {activeFiltersCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        ) : (
          /* BARRE DE RECHERCHE ÉTENDUE - PREMIUM */
          <motion.div
            key="search-expanded"
            initial={{ width: 48, opacity: 0, scale: 0.9 }}
            animate={{ width: 'auto', opacity: 1, scale: 1 }}
            exit={{ width: 48, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-[calc(100vw-120px)] sm:w-[calc(100vw-140px)] md:w-[380px] max-w-[400px]"
          >
            {/* Glow effet */}
            <div className="absolute -inset-1 bg-gradient-to-r from-white/60 via-white/40 to-white/60 rounded-[22px] blur-sm" />
            
            {/* Container principal */}
            <div className="relative flex items-center bg-white/90 backdrop-blur-2xl rounded-[18px] border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
              
              {/* Highlight supérieur */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              
              {/* Bouton retour */}
              <motion.button
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={handleCollapse}
                className="ml-1 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-black/[0.03] transition-all flex-shrink-0"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </motion.button>
              
              {/* Input - font-size 16px pour éviter le zoom iOS */}
              <input
                ref={inputRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => {
                  setIsFocused(false);
                  if (!localSearch.trim()) {
                    setTimeout(handleCollapse, 150);
                  }
                }, 200)}
                placeholder="Rechercher..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="flex-1 min-w-0 py-3 px-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder:text-gray-400 font-medium tracking-[-0.01em]"
                style={{ fontSize: '16px' }}
              />

              {/* Actions à droite */}
              <div className="flex items-center gap-1 pr-1.5 flex-shrink-0">
                {/* Indicateur analyse IA */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-gray-400"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Icons.Sparkles />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton Clear */}
                <AnimatePresence>
                  {localSearch && (
                    <motion.button 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearSearch}
                      className="w-7 h-7 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
                    >
                      <Icons.Close />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Bouton Recherche Vocale */}
                {voiceSupported && !localSearch && (
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isListening 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-500 hover:bg-black/[0.03]'
                    }`}
                  >
                    {isListening && (
                      <motion.span
                        className="absolute inset-0 rounded-xl bg-red-500"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <span className="relative z-10">
                      {isListening ? <Icons.MicActive /> : <Icons.Mic />}
                    </span>
                  </motion.button>
                )}

                {/* Bouton Filtres Avancés */}
                {onOpenAdvancedFilters && (
                  <motion.button
                    onClick={onOpenAdvancedFilters}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20 transition-all"
                  >
                    <Icons.Sliders />
                    <AnimatePresence>
                      {activeFiltersCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-white text-black text-[9px] font-semibold rounded-full flex items-center justify-center shadow-sm"
                        >
                          {activeFiltersCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DROPDOWN SUGGESTIONS - Mobile Optimized */}
      <AnimatePresence>
        {isExpanded && isFocused && !localSearch.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="relative w-[calc(100vw-120px)] sm:w-[calc(100vw-140px)] md:w-[380px] max-w-[400px]"
          >
            {/* Main container */}
            <div className="relative bg-white/[0.98] backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
              
              {/* Recherches récentes */}
              {history.length > 0 && (
                <div className="p-3 md:p-4 pb-2 md:pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Récentes
                    </span>
                    {history.length > 1 && (
                      <button
                        onClick={clearHistory}
                        className="text-[10px] md:text-[11px] font-medium text-gray-400 active:text-gray-600 px-2 py-1 rounded-md active:bg-gray-100 transition-all"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    {lastIntents.map((intent, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + idx * 0.02 }}
                        onClick={() => {
                          setLocalSearch(intent.query);
                          addToHistory(intent.query);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 md:py-2.5 rounded-xl active:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-gray-400 flex-shrink-0">
                          {getIconByType(intent.iconType)}
                        </span>
                        <span className="flex-1 text-[13px] md:text-[14px] text-gray-700 truncate">{intent.label}</span>
                        <span className="text-gray-300 flex-shrink-0">
                          <Icons.ArrowRight />
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Divider */}
              {history.length > 0 && (
                <div className="mx-3 md:mx-4 h-px bg-gray-100" />
              )}
              
              {/* Suggestions */}
              <div className="p-3 md:p-4 pt-2 md:pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-gray-700">
                    <Icons.Sparkles />
                  </span>
                  <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                    Suggestions
                  </span>
                </div>
                
                {/* Liste de suggestions - Compacte sur mobile */}
                <div className="space-y-0.5">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + idx * 0.02 }}
                      onClick={() => {
                        setLocalSearch(suggestion.query);
                        addToHistory(suggestion.query, suggestion.category);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 md:py-2.5 rounded-xl active:bg-gray-50 transition-all text-left"
                    >
                      <div className={`
                        w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${suggestion.type === 'trending' 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-500'
                        }
                      `}>
                        {getIconByType(suggestion.iconType)}
                      </div>
                      <span className="flex-1 text-[13px] md:text-[14px] text-gray-700 truncate">{suggestion.query}</span>
                      {suggestion.type === 'trending' && (
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-wider flex-shrink-0">
                          Trend
                        </span>
                      )}
                    </motion.button>
                  ))}
                  
                  {/* Suggestions contextuelles */}
                  {contextualSuggestions.slice(0, 1).map((suggestion, idx) => (
                    <motion.button
                      key={`ctx-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + idx * 0.02 }}
                      onClick={() => {
                        setLocalSearch(suggestion.query);
                        addToHistory(suggestion.query);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 md:py-2.5 rounded-xl active:bg-gray-50 transition-all text-left"
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                        <Icons.Location />
                      </div>
                      <span className="flex-1 text-[13px] md:text-[14px] text-gray-700 truncate">{suggestion.label}</span>
                      <span className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-wider flex-shrink-0">
                        Proche
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message d'erreur vocale */}
              {voiceError && (
                <div className="px-3 md:px-4 pb-3 md:pb-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 text-[12px] md:text-[13px] rounded-xl">
                    <span>{voiceError}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMART TAGS */}
      <AnimatePresence>
        {isExpanded && activeTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-2 px-1"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              IA :
            </motion.span>
            {activeTags.map((tag, index) => (
              <SmartTag 
                key={tag.key || index} 
                tag={tag}
                index={index}
                onRemove={tag.removable ? () => handleRemoveTag(tag.key) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
