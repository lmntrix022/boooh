// Panneau de filtres avancés - Design Premium AWWWARDS/APPLE Level
import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { MapFilters, DynamicBadgeType } from './types';

// Icônes SVG Modernes - Style Geometric / Minimal
const Icons = {
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Star: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z"/>
    </svg>
  ),
  // Icônes de tri
  Distance: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
    </svg>
  ),
  Price: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6v12M15 9H10.5a2 2 0 100 4h3a2 2 0 110 4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Rating: () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z" fill="currentColor"/>
    </svg>
  ),
  Fire: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3-6.36V8c0-.55.45-1 1-1s1 .45 1 1v.78c.63-.44 1.3-.78 2-.97V6c0-.55.45-1 1-1s1 .45 1 1v1.26c.64.09 1.26.26 1.85.51L15 5.41c.39-.39 1.02-.39 1.41 0s.39 1.02 0 1.41l-.41.41c.52.45.99.97 1.37 1.54l.63-.63c.39-.39 1.02-.39 1.41 0s.39 1.02 0 1.41l-.41.41C20.3 11.14 21 12.98 21 15c0 4.42-4.03 8-9 8z"/>
    </svg>
  ),
  New: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  // Badges
  Trending: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M2 18L9 11l4 4 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 6h7v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>
    </svg>
  ),
  Timer: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 9v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 2h6M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Lightning: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 4H4a2 2 0 00-2 2v1a4 4 0 004 4M18 4h2a2 2 0 012 2v1a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 4h12v6a6 6 0 01-12 0V4zM9 21h6M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Verified: () => (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

interface AdvancedFiltersPanelProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  resultsCount?: number;
}

// Configuration des filtres avec icônes React
const SORT_OPTIONS: { value: MapFilters['sortBy']; label: string; Icon: React.FC }[] = [
  { value: 'distance', label: 'Distance', Icon: Icons.Distance },
  { value: 'price', label: 'Prix', Icon: Icons.Price },
  { value: 'rating', label: 'Note', Icon: Icons.Rating },
  { value: 'popularity', label: 'Tendance', Icon: Icons.Fire },
  { value: 'newest', label: 'Récent', Icon: Icons.New },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: undefined, label: '∞' },
];

const PRICE_OPTIONS = [
  { min: undefined, max: 5000, label: '5K' },
  { min: undefined, max: 10000, label: '10K' },
  { min: undefined, max: 25000, label: '25K' },
  { min: undefined, max: 50000, label: '50K' },
  { min: 50000, max: undefined, label: '50K+' },
  { min: undefined, max: undefined, label: 'Tous' },
];

const BADGE_OPTIONS: { value: DynamicBadgeType; label: string; gradient: string; Icon: React.FC }[] = [
  { value: 'trending', label: 'Tendance', gradient: 'from-orange-500 to-red-500', Icon: Icons.Trending },
  { value: 'new', label: 'Nouveau', gradient: 'from-emerald-500 to-teal-500', Icon: Icons.Sparkle },
  { value: 'limited', label: 'Limité', gradient: 'from-purple-500 to-pink-500', Icon: Icons.Timer },
  { value: 'flash', label: 'Flash', gradient: 'from-yellow-500 to-orange-500', Icon: Icons.Lightning },
  { value: 'bestseller', label: 'Best', gradient: 'from-violet-500 to-purple-500', Icon: Icons.Trophy },
  { value: 'verified', label: 'Vérifié', gradient: 'from-blue-500 to-cyan-500', Icon: Icons.Verified },
];

// Composant Pill élégant avec animation et icônes React
const PillSelector: React.FC<{
  options: { value: any; label: string; Icon?: React.FC }[];
  value: any;
  onChange: (value: any) => void;
  allowMultiple?: boolean;
}> = ({ options, value, onChange, allowMultiple }) => {
  const isSelected = (optionValue: any) => {
    if (allowMultiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        const IconComponent = option.Icon;
        return (
          <motion.button
            key={option.label}
            onClick={() => onChange(option.value)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-4 py-2.5 rounded-2xl text-sm font-medium
              transition-all duration-500 ease-out
              ${selected 
                ? 'text-white shadow-lg' 
                : 'text-gray-600 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200/80'
              }
            `}
          >
            {/* Background animé pour état actif */}
            {selected && (
              <motion.div
                layoutId={`pill-bg-${options[0].label}`}
                className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black rounded-2xl"
                initial={false}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            
            <span className="relative z-10 flex items-center gap-2">
              {IconComponent && (
                <span className={`transition-colors ${selected ? 'text-white' : 'text-gray-500'}`}>
                  <IconComponent />
                </span>
              )}
              {option.label}
              {selected && (
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <Icons.Check />
                </motion.span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Composant Badge avec gradient et icône React
const BadgePill: React.FC<{
  label: string;
  gradient: string;
  Icon: React.FC;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}> = ({ label, gradient, Icon, isSelected, onClick, index }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05, type: "spring" }}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    className={`
      relative px-4 py-2.5 rounded-2xl text-sm font-semibold overflow-hidden
      transition-all duration-300
      ${isSelected 
        ? 'text-white shadow-xl' 
        : 'text-gray-500 bg-gray-100/60 hover:bg-gray-100'
      }
    `}
  >
    {isSelected && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 bg-gradient-to-r ${gradient}`}
      />
    )}
    <span className="relative z-10 flex items-center gap-2">
      <span className={`transition-transform ${isSelected ? 'scale-110' : ''}`}>
        <Icon />
      </span>
      {label}
      {isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.6 }}
        >
          <Icons.Check />
        </motion.span>
      )}
    </span>
  </motion.button>
);

// Slider de rating premium
const PremiumRatingSelector: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Note minimum</span>
        <motion.span 
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"
        >
          {value > 0 ? `${value}+ étoiles` : 'Toutes'}
        </motion.span>
      </div>
      
      <div className="flex gap-1.5 p-1 bg-gray-100/50 rounded-2xl">
        <button
          onClick={() => onChange(0)}
          onMouseEnter={() => setHovered(0)}
          onMouseLeave={() => setHovered(null)}
          className={`
            flex-1 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider
            transition-all duration-300
            ${value === 0 
              ? 'bg-white text-gray-900 shadow-md' 
              : 'text-gray-400 hover:text-gray-600'
            }
          `}
        >
          Tous
        </button>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-1 py-3 rounded-xl flex items-center justify-center gap-0.5
              transition-all duration-300
              ${star <= value && value > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : hovered !== null && star <= hovered
                ? 'bg-amber-100 text-amber-600'
                : 'text-gray-300 hover:text-gray-400'
              }
            `}
          >
            <span className="text-sm font-bold">{star}</span>
            <Icons.Star />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Toggle Switch premium
const PremiumToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  index: number;
}> = ({ label, description, checked, onChange, index }) => {
  const spring = useSpring(checked ? 1 : 0, { stiffness: 500, damping: 30 });
  const backgroundColor = useTransform(spring, [0, 1], ['#E5E7EB', '#000000']);
  
  useEffect(() => {
    spring.set(checked ? 1 : 0);
  }, [checked, spring]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onChange}
      className={`
        group flex items-center justify-between p-4 rounded-2xl cursor-pointer
        transition-all duration-300
        ${checked 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }
      `}
    >
      <div className="flex-1 pr-4">
        <span className={`text-sm font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </span>
        {description && (
          <p className={`text-xs mt-0.5 ${checked ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      
      <motion.div
        className="relative w-12 h-7 rounded-full p-1 cursor-pointer"
        style={{ backgroundColor }}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </motion.div>
  );
};

// Section avec titre stylé
const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="space-y-4"
  >
    <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium pl-1">
      {title}
    </h3>
    {children}
  </motion.div>
);

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
  resultsCount = 0,
}) => {
  const activeFiltersCount = [
    filters.maxDistance !== undefined,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.minRating !== undefined && filters.minRating > 0,
    filters.badges && filters.badges.length > 0,
    filters.hasPromotion,
    filters.verified,
    filters.hasStock,
  ].filter(Boolean).length;

  // Handlers optimisés
  const handleDistanceChange = useCallback((maxDistance?: number) => {
    onFiltersChange({ ...filters, maxDistance });
  }, [filters, onFiltersChange]);

  const handlePriceChange = useCallback((option: typeof PRICE_OPTIONS[0]) => {
    onFiltersChange({ ...filters, minPrice: option.min, maxPrice: option.max });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((minRating: number) => {
    onFiltersChange({ ...filters, minRating: minRating > 0 ? minRating : undefined });
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: MapFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy });
  }, [filters, onFiltersChange]);

  const handleBadgeToggle = useCallback((badge: DynamicBadgeType) => {
    const currentBadges = filters.badges || [];
    const newBadges = currentBadges.includes(badge)
      ? currentBadges.filter((b) => b !== badge)
      : [...currentBadges, badge];
    onFiltersChange({ ...filters, badges: newBadges.length > 0 ? newBadges : undefined });
  }, [filters, onFiltersChange]);

  const handleToggleFilter = useCallback((key: keyof MapFilters) => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  }, [filters, onFiltersChange]);

  const handleResetFilters = useCallback(() => {
    onFiltersChange({
      search: filters.search,
      filterType: filters.filterType,
      sortBy: 'distance',
    });
  }, [filters.search, filters.filterType, onFiltersChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur élégant */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[70]"
          />

          {/* Panel principal */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-[80] flex flex-col"
          >
            {/* Container avec effet glassmorphism */}
            <div className="absolute inset-0 bg-white/95 backdrop-blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/30" />
            
            {/* Ligne décorative supérieure */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"
            />

            {/* Header minimaliste */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-gray-200/50"
            >
              <div className="flex items-center gap-4">
                {/* Logo/Icon animé */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center shadow-xl shadow-black/20"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-lg"
                  >
                    ⚡
                  </motion.span>
                </motion.div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                    Filtres
                  </h2>
                  <motion.p 
                    key={`${resultsCount}-${activeFiltersCount}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 mt-0.5"
                  >
                    {resultsCount.toLocaleString()} résultat{resultsCount !== 1 ? 's' : ''}
                    {activeFiltersCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-black text-white text-[10px] rounded-full font-medium">
                        {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </motion.p>
                </div>
              </div>

              {/* Bouton fermer élégant */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Icons.Close />
              </motion.button>
            </motion.div>

            {/* Contenu scrollable */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-8">
              
              {/* Tri */}
              <FilterSection title="Trier par" delay={0.15}>
                <PillSelector
                  options={SORT_OPTIONS}
                  value={filters.sortBy || 'distance'}
                  onChange={handleSortChange}
                />
              </FilterSection>

              {/* Distance - Design compact et élégant */}
              <FilterSection title="Distance" delay={0.2}>
                <div className="flex gap-1.5 p-1.5 bg-gray-100/60 rounded-2xl">
                  {DISTANCE_OPTIONS.map((option, index) => {
                    const isSelected = filters.maxDistance === option.value;
                    return (
                      <motion.button
                        key={option.label}
                        onClick={() => handleDistanceChange(option.value)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex-1 py-3 rounded-xl text-sm font-medium
                          transition-all duration-300
                          ${isSelected 
                            ? 'bg-white text-gray-900 shadow-md' 
                            : 'text-gray-500 hover:text-gray-700'
                          }
                        `}
                      >
                        {option.label}
                      </motion.button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Prix - Grid compact */}
              <FilterSection title="Budget" delay={0.25}>
                <div className="grid grid-cols-3 gap-2">
                  {PRICE_OPTIONS.map((option, index) => {
                    const isSelected = filters.minPrice === option.min && filters.maxPrice === option.max;
                    return (
                      <motion.button
                        key={option.label}
                        onClick={() => handlePriceChange(option)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + index * 0.04 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          relative py-3.5 rounded-2xl text-sm font-semibold overflow-hidden
                          transition-all duration-300
                          ${isSelected 
                            ? 'bg-gray-900 text-white shadow-lg' 
                            : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/80'
                          }
                        `}
                      >
                        {option.label !== 'Tous' && option.max && (
                          <span className="text-[10px] opacity-60 block -mb-0.5">max</span>
                        )}
                        {option.label}
                        <span className="text-[10px] opacity-60 ml-0.5">
                          {option.label !== 'Tous' && option.label !== '50K+' ? 'F' : ''}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Note */}
              <FilterSection title="Évaluation" delay={0.3}>
                <PremiumRatingSelector
                  value={filters.minRating || 0}
                  onChange={handleRatingChange}
                />
              </FilterSection>

              {/* Badges */}
              <FilterSection title="Badges" delay={0.35}>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map((option, index) => (
                    <BadgePill
                      key={option.value}
                      label={option.label}
                      gradient={option.gradient}
                      Icon={option.Icon}
                      isSelected={(filters.badges || []).includes(option.value)}
                      onClick={() => handleBadgeToggle(option.value)}
                      index={index}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Options */}
              <FilterSection title="Préférences" delay={0.4}>
                <div className="space-y-2">
                  <PremiumToggle
                    label="Promotions uniquement"
                    description="Afficher les offres spéciales"
                    checked={filters.hasPromotion || false}
                    onChange={() => handleToggleFilter('hasPromotion')}
                    index={0}
                  />
                  <PremiumToggle
                    label="Vendeurs vérifiés"
                    description="Vendeurs avec badge de confiance"
                    checked={filters.verified || false}
                    onChange={() => handleToggleFilter('verified')}
                    index={1}
                  />
                  <PremiumToggle
                    label="En stock"
                    description="Disponible immédiatement"
                    checked={filters.hasStock || false}
                    onChange={() => handleToggleFilter('hasStock')}
                    index={2}
                  />
                </div>
              </FilterSection>

              {/* Spacer pour le footer */}
              <div className="h-4" />
            </div>

            {/* Footer avec boutons premium */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 px-6 py-5 border-t border-gray-200/50 bg-gradient-to-t from-white via-white to-transparent"
            >
              <div className="flex gap-3">
                <motion.button
                  onClick={handleResetFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-4 rounded-2xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser
                </motion.button>
                
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-[2] py-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-gray-900 to-black shadow-xl shadow-black/20 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    Voir les résultats
                    <motion.span
                      key={resultsCount}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 bg-white/20 rounded-lg text-xs"
                    >
                      {resultsCount}
                    </motion.span>
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdvancedFiltersPanel;
