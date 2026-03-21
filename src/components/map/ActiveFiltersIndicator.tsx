// Indicateur visuel des filtres actifs sur la carte + Notifications animées
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapFilters, MapFilterType, DynamicBadgeType } from './types';

interface ActiveFiltersIndicatorProps {
  filters: MapFilters;
  resultsCount: number;
  onRemoveFilter: (filterKey: string) => void;
  onClearAll: () => void;
}

// Configuration des couleurs par type de filtre
const FILTER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  products: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '📦' },
  services: { bg: 'bg-violet-100', text: 'text-violet-700', icon: '✨' },
  food: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🍔' },
  beauty: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '💅' },
  promotions: { bg: 'bg-red-100', text: 'text-red-700', icon: '🎯' },
  premium: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⭐' },
  popular: { bg: 'bg-rose-100', text: 'text-rose-700', icon: '🔥' },
  carte: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🗺️' },
  distance: { bg: 'bg-sky-100', text: 'text-sky-700', icon: '📍' },
  price: { bg: 'bg-green-100', text: 'text-green-700', icon: '💰' },
  rating: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⭐' },
  badge: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🏷️' },
};

// Composant Chip pour chaque filtre actif
const FilterChip: React.FC<{
  label: string;
  filterKey: string;
  icon: string;
  bgColor: string;
  textColor: string;
  onRemove: () => void;
}> = ({ label, icon, bgColor, textColor, onRemove }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    whileHover={{ scale: 1.05 }}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${bgColor} ${textColor} text-xs font-medium shadow-sm`}
  >
    <span>{icon}</span>
    <span>{label}</span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="ml-0.5 w-4 h-4 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  </motion.div>
);

// Générer la liste des filtres actifs
function getActiveFilters(filters: MapFilters): Array<{
  key: string;
  label: string;
  color: typeof FILTER_COLORS[string];
}> {
  const active: Array<{ key: string; label: string; color: typeof FILTER_COLORS[string] }> = [];

  // Type de filtre
  if (filters.filterType && filters.filterType !== 'all') {
    const labels: Record<MapFilterType, string> = {
      all: 'Tout',
      products: 'Produits',
      services: 'Services',
      food: 'Resto',
      promotions: 'Promos',
      premium: 'Premium',
      beauty: 'Beauté',
      popular: 'Populaire',
      carte: 'Cartes',
    };
    active.push({
      key: 'filterType',
      label: labels[filters.filterType],
      color: FILTER_COLORS[filters.filterType] || FILTER_COLORS.products,
    });
  }

  // Distance
  if (filters.maxDistance !== undefined) {
    active.push({
      key: 'maxDistance',
      label: `< ${filters.maxDistance} km`,
      color: FILTER_COLORS.distance,
    });
  }

  // Prix
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    let label = '';
    if (filters.minPrice && filters.maxPrice) {
      label = `${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} FCFA`;
    } else if (filters.maxPrice) {
      label = `< ${filters.maxPrice.toLocaleString()} FCFA`;
    } else if (filters.minPrice) {
      label = `> ${filters.minPrice.toLocaleString()} FCFA`;
    }
    active.push({
      key: 'price',
      label,
      color: FILTER_COLORS.price,
    });
  }

  // Rating
  if (filters.minRating !== undefined && filters.minRating > 0) {
    active.push({
      key: 'minRating',
      label: `${filters.minRating}+ ⭐`,
      color: FILTER_COLORS.rating,
    });
  }

  // Badges
  if (filters.badges && filters.badges.length > 0) {
    const badgeLabels: Record<DynamicBadgeType, string> = {
      trending: 'Tendance',
      new: 'Nouveau',
      limited: 'Offre limitée',
      flash: 'Flash',
      bestseller: 'Best-seller',
      verified: 'Vérifié',
      eco: 'Éco',
    };
    filters.badges.forEach((badge) => {
      active.push({
        key: `badge-${badge}`,
        label: badgeLabels[badge],
        color: FILTER_COLORS.badge,
      });
    });
  }

  // Options booléennes
  if (filters.hasPromotion) {
    active.push({
      key: 'hasPromotion',
      label: 'En promo',
      color: FILTER_COLORS.promotions,
    });
  }
  if (filters.verified) {
    active.push({
      key: 'verified',
      label: 'Vérifié',
      color: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '✓' },
    });
  }
  if (filters.hasStock) {
    active.push({
      key: 'hasStock',
      label: 'En stock',
      color: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
    });
  }

  return active;
}

export const ActiveFiltersIndicator: React.FC<ActiveFiltersIndicatorProps> = ({
  filters,
  resultsCount,
  onRemoveFilter,
  onClearAll,
}) => {
  const activeFilters = getActiveFilters(filters);

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-28 md:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[90%] sm:max-w-xl pointer-events-auto"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-3 py-2 shadow-lg border border-white/40">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge de compteur */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black rounded-full text-white text-xs font-semibold">
            <span>🔍</span>
            <span>{resultsCount}</span>
          </div>

          {/* Filtres actifs */}
          <AnimatePresence mode="popLayout">
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                filterKey={filter.key}
                icon={filter.color.icon}
                bgColor={filter.color.bg}
                textColor={filter.color.text}
                onRemove={() => onRemoveFilter(filter.key)}
              />
            ))}
          </AnimatePresence>

          {/* Bouton effacer tout */}
          {activeFilters.length > 1 && (
            <motion.button
              onClick={onClearAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              Effacer tout
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Notification animée "Rechercher dans cette zone"
interface SearchInZoneNotificationProps {
  isVisible: boolean;
  onClick: () => void;
  onDismiss: () => void;
}

export const SearchInZoneNotification: React.FC<SearchInZoneNotificationProps> = ({
  isVisible,
  onClick,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50"
        >
          <motion.div
            className="relative"
            animate={{ 
              boxShadow: [
                '0 4px 20px rgba(0,0,0,0.1)',
                '0 8px 30px rgba(59,130,246,0.3)',
                '0 4px 20px rgba(0,0,0,0.1)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Cercle de pulse */}
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <button
              onClick={onClick}
              className="relative flex items-center gap-2 px-5 py-3 bg-black text-white rounded-full font-semibold text-sm shadow-xl hover:bg-gray-900 transition-colors"
            >
              {/* Icône animée */}
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </motion.svg>
              
              <span>Rechercher dans cette zone</span>
              
              {/* Bouton fermer */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </motion.button>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notification toast pour les actions
interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
}) => {
  const colors = {
    success: 'bg-emerald-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const icons = {
    success: '✓',
    info: 'ℹ️',
    warning: '⚠️',
  };

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className={`flex items-center gap-2 px-4 py-3 ${colors[type]} text-white rounded-xl shadow-lg`}>
            <span>{icons[type]}</span>
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActiveFiltersIndicator;

