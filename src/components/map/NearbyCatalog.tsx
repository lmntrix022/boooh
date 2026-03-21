import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MapProduct, MapService } from './types';
import { 
  Package, Sparkles, ShoppingCart, Lightbulb, 
  ChevronLeft, ChevronRight, MapPin, Clock, Star,
  Heart, Share2, Navigation, Zap,
  TrendingUp, Award, Shield, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { QuoteRequestDialog } from '@/components/portfolio/QuoteRequestDialog';

// --- CONSTANTS & TYPES ---
const GAP = 16;
const DRAG_BUFFER = 50;

// Fonction pour calculer la largeur des cartes - Très compact
const getCardWidth = () => {
  if (typeof window === 'undefined') return 180;
  return window.innerWidth < 768 
    ? Math.min(window.innerWidth - 170, 190) // Mobile: très compact, marge de 170px
    : 180; // Desktop: très compact
};

interface NearbyCatalogProps {
  products: MapProduct[];
  services: MapService[];
  userLocation: [number, number] | null;
  onProductClick: (product: MapProduct) => void;
  onServiceClick: (service: MapService) => void;
  onShowRoute?: (destination: { lat: number; lng: number }) => void;
  isLoading?: boolean;
  selectedItemId?: string | null; // ID de l'élément à sélectionner (format: "product-{id}" ou "service-{id}")
  onClearSelection?: () => void; // Callback pour réinitialiser la sélection
  isVisible?: boolean; // Contrôle l'affichage du catalogue
}

// --- ENHANCED SUB-COMPONENTS ---

// 1. Premium Skeleton Loader - Apple Style
const PulseBar: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => (
  <motion.div
    className={`bg-gray-100 ${className}`}
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const LoadingSkeleton = () => (
      <motion.div
    initial={{ y: '100%', opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    className="fixed bottom-0 left-0 right-0"
    style={{ zIndex: 9999 }}
  >
    <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/50 to-transparent" />
    
    <div className="relative bg-white backdrop-blur-2xl shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.1)]">
      <div className="flex justify-center pt-3 pb-2 md:hidden">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-2 pb-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <PulseBar className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <PulseBar className="w-20 md:w-24 h-4 rounded-lg" delay={0.1} />
            <PulseBar className="w-14 md:w-16 h-3 rounded-full" delay={0.15} />
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0">
          <PulseBar className="w-9 h-9 md:w-10 md:h-10 rounded-lg" delay={0.2} />
          <PulseBar className="w-9 h-9 md:w-10 md:h-10 rounded-lg" delay={0.25} />
        </div>
      </div>
      
      {/* Cards */}
      <div className="overflow-hidden pb-4">
        <div className="flex gap-4 px-4 md:px-6">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 400, damping: 30 }}
              className="min-w-[calc(100vw-180px)] md:min-w-[180px] flex-shrink-0 bg-white rounded-[16px] md:rounded-[18px] overflow-hidden ring-1 ring-black/[0.03] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
            >
              <div className="w-full h-28 md:h-32 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  style={{ transform: 'skewX(-20deg)' }}
                  animate={{ translateX: ['-200%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: [0.4, 0, 0.2, 1], delay: i * 0.3 }}
                />
              </div>
              
              <div className="p-2.5 md:p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PulseBar className="w-3 h-3 rounded-full" delay={i * 0.1} />
                    <PulseBar className="w-16 h-3 rounded-full" delay={i * 0.1 + 0.05} />
                  </div>
                  <PulseBar className="w-12 h-5 rounded-full" delay={i * 0.1 + 0.08} />
                </div>
                <PulseBar className="w-4/5 h-4 rounded-lg" delay={i * 0.1 + 0.1} />
                <PulseBar className="w-24 h-5 rounded-lg" delay={i * 0.1 + 0.15} />
                <PulseBar className="w-full h-9 rounded-xl" delay={i * 0.1 + 0.2} />
        </div>
      </motion.div>
    ))}
  </div>
        
        <div className="flex justify-center gap-2 pt-1 pb-4">
          <PulseBar className="w-1.5 h-1.5 rounded-full" delay={0.3} />
          <PulseBar className="w-1.5 h-1.5 rounded-full" delay={0.35} />
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center gap-1.5 pb-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full bg-gray-200 ${i === 0 ? 'w-6' : 'w-1.5'}`}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// 2. Premium Badge Component - Minimal Apple Style
const CategoryBadge = ({ type, promo, rating }: { type: 'product' | 'service', promo?: number, rating?: number }) => (
  <div className="absolute top-3 left-3 z-20 flex gap-1.5">
    <div className={cn(
      "px-2.5 py-1 rounded-full backdrop-blur-xl flex items-center gap-1.5",
        type === 'product' 
        ? "bg-white/90 text-gray-800" 
        : "bg-black/80 text-white"
    )}>
      {type === 'product' ? 
        <Package size={11} strokeWidth={2} /> : 
        <Sparkles size={11} strokeWidth={2} />
      }
      <span className="text-[10px] font-light tracking-wide"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        {type === 'product' ? 'Produit' : 'Service'}
      </span>
    </div>

    {promo && promo > 0 && (
      <div className="px-2 py-1 rounded-full bg-gray-900 text-white flex items-center gap-1">
        <span className="text-[10px] font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >-{promo}%</span>
      </div>
    )}
  </div>
);

// 3. Business Info Component (Avatar seulement)
const BusinessInfo = ({ business }: { business: { name: string; avatar?: string; verified?: boolean } }) => (
  <motion.div 
    className="relative"
    whileHover={{ scale: 1.05 }}
  >
    {business.avatar ? (
      <img 
        src={business.avatar} 
        alt={business.name} 
        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/80 shadow-lg object-cover" 
      />
    ) : (
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full border-2 border-white/80 shadow-lg" />
    )}
    {business.verified && (
      <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white">
        <Shield size={10} className="text-white fill-white" />
      </div>
    )}
  </motion.div>
);

// 4. Minimal Distance Indicator - Affiche même sans localisation
const DistanceIndicator = ({ distance }: { distance: number }) => (
  <div className="flex items-center gap-1 text-gray-500">
    <MapPin size={12} strokeWidth={2} />
    <span className="text-[11px] font-light"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        fontWeight: 300,
      }}
    >
      {distance > 0 ? `${distance.toFixed(1)} km` : 'Libreville'}
    </span>
  </div>
);

// --- MAIN COMPONENT ---

export const NearbyCatalog: React.FC<NearbyCatalogProps> = ({
  products,
  services,
  userLocation,
  onProductClick,
  onServiceClick,
  onShowRoute,
  isLoading = false,
  selectedItemId = null,
  onClearSelection,
  isVisible = true
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<{ cardId: string; userId: string; serviceName: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced items with additional data - TOUJOURS afficher, même sans localisation
  const allNearbyItems = useMemo(() => {
    // Combiner tous les produits et services disponibles
    const items = [
      ...products.map(p => ({ 
        type: 'product' as const, 
        data: p, 
        distance: p.distance || 0,
        itemId: `product-${p.id}`,
        popularity: (p as any).view_count || Math.floor(Math.random() * 100),
        verified: Math.random() > 0.3
      })),
      ...services.map(s => ({ 
        type: 'service' as const, 
        data: s, 
        distance: s.distance || 0,
        itemId: `service-${s.id}`,
        popularity: (s as any).booking_count || Math.floor(Math.random() * 100),
        verified: Math.random() > 0.3
      }))
    ];
    
    // Toujours retourner des items, même sans localisation
    if (items.length === 0) return [];
    
    // Trier intelligemment selon la disponibilité de la localisation
    const sortedItems = items.sort((a, b) => {
      if (userLocation && a.distance > 0 && b.distance > 0) {
        // Avec localisation : tri par distance
        return a.distance - b.distance;
      }
      // Sans localisation : tri par popularité (ou créer un score)
      const scoreA = a.popularity + (a.verified ? 50 : 0);
      const scoreB = b.popularity + (b.verified ? 50 : 0);
      return scoreB - scoreA;
    });
    
    return sortedItems
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        trending: index < 3,
        featured: index < 5 && Math.random() > 0.5
      }));
  }, [products, services, userLocation]);

  // Filtrer pour n'afficher que l'élément sélectionné si selectedItemId est défini
  const nearbyItems = useMemo(() => {
    if (selectedItemId) {
      const selectedItem = allNearbyItems.find(item => item.itemId === selectedItemId);
      return selectedItem ? [selectedItem] : [];
    }
    return allNearbyItems;
  }, [allNearbyItems, selectedItemId]);

  // States pour le responsive
  const [initialPadding, setInitialPadding] = useState(0);
  const [cardWidth, setCardWidth] = useState(getCardWidth());

  // Calculer le padding initial et la largeur des cartes
  useEffect(() => {
    const calculateLayout = () => {
      const newCardWidth = getCardWidth();
      setCardWidth(newCardWidth);
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const padding = (containerWidth - newCardWidth) / 2;
        setInitialPadding(Math.max(16, padding)); // Minimum 16px de marge
      }
    };

    // Calculer au montage et au redimensionnement
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    
    return () => {
      window.removeEventListener('resize', calculateLayout);
    };
  }, [nearbyItems.length]);

  // Enhanced navigation with boundaries
  const calculateNewX = (index: number) => {
    if (!containerRef.current || nearbyItems.length === 0) return 0;
    const itemWidth = cardWidth + GAP;
    // Centrer le premier élément en utilisant le padding initial calculé
    return -(index * itemWidth) + initialPadding;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -DRAG_BUFFER || velocity < -500) {
      setCurrentIndex(prev => Math.min(prev + 1, nearbyItems.length - 1));
    } else if (offset > DRAG_BUFFER || velocity > 500) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  // Auto-advance carousel (seulement si aucun élément n'est sélectionné)
  useEffect(() => {
    if (selectedItemId || nearbyItems.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % nearbyItems.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [nearbyItems.length, isHovered, selectedItemId]);

  // Réinitialiser l'index quand selectedItemId change
  useEffect(() => {
    if (selectedItemId) {
      setCurrentIndex(0); // Toujours le premier (et seul) élément quand sélectionné
      setIsHovered(true); // Pause auto-advance quand un élément est sélectionné
    } else {
      setCurrentIndex(0); // Réinitialiser à 0 quand la sélection est annulée
      setIsHovered(false); // Réactiver auto-advance
    }
  }, [selectedItemId]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="w-full max-w-6xl pointer-events-auto">
          <LoadingSkeleton />
        </div>
      </motion.div>
    );
  }

  // Debug: Afficher les infos
  React.useEffect(() => {
    console.log('📊 NearbyCatalog Debug:', {
      productsCount: products.length,
      servicesCount: services.length,
      allNearbyItemsCount: allNearbyItems.length,
      nearbyItemsCount: nearbyItems.length,
      isVisible,
      isLoading,
      userLocation,
      selectedItemId
    });
  }, [products.length, services.length, allNearbyItems.length, nearbyItems.length, isVisible, isLoading, userLocation, selectedItemId]);

  // TOUJOURS afficher le catalogue, même vide
  return (
    <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 pointer-events-none"
            style={{ 
              touchAction: 'pan-y',
              WebkitTransform: 'translate3d(0,0,0)',
              transform: 'translate3d(0,0,0)',
              willChange: 'transform',
              zIndex: 9999,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
          >
        {/* PREMIUM CONTAINER - AWWWARDS/APPLE LEVEL */}
        <div className="w-full relative pointer-events-auto flex flex-col">
        
        {/* Gradient fade réduit au-dessus */}
        <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-10" />
        
        {/* Glass container - Edge to edge sur mobile */}
        <div className="relative bg-white backdrop-blur-2xl shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.1)]">
          
          {/* Handle premium pour mobile */}
          <div className="flex justify-center pt-3 pb-2 md:hidden">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {/* Border top premium */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        
          {/* Header compact - Edge to edge sur mobile */}
        <motion.div 
            className="flex items-center justify-between px-4 md:px-6 pt-2 pb-3 md:py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2} />
            </div>
              <div className="min-w-0">
                <h2 className="text-[15px] md:text-base font-bold text-gray-900 tracking-tight truncate">
                  {selectedItemId ? 'Sélection' : (userLocation ? 'À proximité' : 'Découvertes')}
              </h2>
                <p className="text-[11px] md:text-xs text-gray-500 font-medium">
                  {nearbyItems.length} {nearbyItems.length > 1 ? 'résultats' : 'résultat'}
                  {!userLocation && ' • Libreville'}
              </p>
            </div>
          </div>

            <div className="flex items-center gap-2 flex-shrink-0">
            {selectedItemId && onClearSelection && (
              <motion.button
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelection();
                }}
                  whileTap={{ scale: 0.92 }}
              >
                  <X className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              </motion.button>
            )}
            
            {!selectedItemId && nearbyItems.length > 1 && (
                <div className="flex bg-gray-100 rounded-xl p-1">
                <motion.button
                  className={cn(
                      "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors",
                    currentIndex === 0 
                        ? "text-gray-300 cursor-not-allowed" 
                        : "text-gray-700 hover:bg-white active:bg-gray-50"
                  )}
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                    whileTap={currentIndex === 0 ? {} : { scale: 0.92 }}
                >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                </motion.button>
                
                <motion.button
                  className={cn(
                      "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors",
                    currentIndex === nearbyItems.length - 1
                        ? "text-gray-300 cursor-not-allowed" 
                        : "text-gray-700 hover:bg-white active:bg-gray-50"
                  )}
                  onClick={() => setCurrentIndex(Math.min(nearbyItems.length - 1, currentIndex + 1))}
                  disabled={currentIndex === nearbyItems.length - 1}
                    whileTap={currentIndex === nearbyItems.length - 1 ? {} : { scale: 0.92 }}
                >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                </motion.button>
                </div>
            )}
          </div>
        </motion.div>

        {/* PREMIUM CAROUSEL - Edge to edge */}
        <div 
          ref={containerRef} 
          className="overflow-hidden pb-4 md:pb-5"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {nearbyItems.length === 0 ? (
            /* État vide - Afficher quand même le catalogue */
            <div className="flex items-center justify-center py-12 px-6">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-light text-gray-900 mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Aucun résultat
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {!userLocation 
                    ? 'Activez la localisation pour voir les produits près de vous'
                    : 'Essayez de modifier vos filtres ou votre zone de recherche'
                  }
                </p>
              </div>
            </div>
          ) : (
          <motion.div
            className="flex items-stretch"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              dragMomentum={true}
            onDragEnd={handleDragEnd}
            animate={{ x: calculateNewX(currentIndex) }}
            transition={{ 
              type: "spring", 
                stiffness: 400, 
                damping: 35
            }}
            style={{ 
              gap: GAP,
              paddingLeft: initialPadding,
                paddingRight: initialPadding,
                cursor: 'grab',
            }}
              whileTap={{ cursor: 'grabbing' }}
          >
            {nearbyItems.map((item, index) => {
              const isActive = index === currentIndex;
              const isSelected = !!selectedItemId;
              const isProduct = item.type === 'product';
              const data = item.data;

              return (
                <motion.div
                  key={`${item.type}-${data.id}-${index}`}
                  className="relative flex-shrink-0 cursor-pointer"
                  style={{ width: cardWidth }}
                  animate={{ 
                    scale: isActive || isSelected ? 1 : 0.95,
                    opacity: isActive || isSelected ? 1 : 0.7,
                  }}
                  whileHover={{ scale: isActive || isSelected ? 1.01 : 0.97 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onClick={() => {
                    if (!isActive && !isSelected) {
                      setCurrentIndex(index);
                    } else {
                      isProduct ? onProductClick(data as MapProduct) : onServiceClick(data as MapService);
                    }
                  }}
                >
                  {/* APPLE-STYLE CARD */}
                  <div className={cn(
                    "h-full bg-white rounded-[18px] md:rounded-[20px] overflow-hidden group transition-all duration-300 ring-1 ring-black/[0.03]",
                    isActive || isSelected
                      ? "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] ring-black/[0.05]" 
                      : "shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                  )}>
                    
                    {/* CARD IMAGE */}
                    <div className="h-28 md:h-32 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      {isProduct ? (
                        (data as MapProduct).image_url ? (
                            <img 
                              src={(data as MapProduct).image_url} 
                              alt="Product" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-gray-300 w-12 h-12" strokeWidth={1.5} />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          {(() => {
                            const iconName = (data as MapService).icon;
                            const Icon = iconName && (LucideIcons as any)[iconName] ? 
                              (LucideIcons as any)[iconName] : Sparkles;
                            return (
                              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white">
                                {Icon && <Icon size={24} strokeWidth={1.8} />}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Badges */}
                      <CategoryBadge 
                        type={item.type} 
                        promo={(data as any).promotion_percent}
                      />

                      {/* Business avatar */}
                      {(data as any).business_avatar && (
                        <div className="absolute top-3 right-3 z-20">
                          <img 
                            src={(data as any).business_avatar} 
                            alt="" 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover" 
                          />
                        </div>
                      )}
                    </div>

                    {/* CARD CONTENT - Optimisé mobile */}
                    <div className="p-2.5 md:p-3">
                      {/* Distance + Trending */}
                      <div className="flex items-center justify-between mb-2">
                        <DistanceIndicator distance={item.distance} />
                        {item.trending && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 text-white rounded-full text-[9px] font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
                            <span>Top</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 text-[13px] leading-tight mb-1.5 line-clamp-2 min-h-[36px]">
                        {(data as any).title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mb-3">
                          {(data as any).is_promotion && (data as any).promotion_percent ? (
                            <>
                            <span className="text-[12px] text-gray-400 line-through font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {(data as any).price?.toLocaleString()}
                              </span>
                            <span className="text-lg font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {Math.round((data as any).price * (1 - (data as any).promotion_percent / 100)).toLocaleString()}
                                </span>
                            </>
                          ) : (
                          <span className="text-lg font-light text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {(data as any).price?.toLocaleString() || 'Sur devis'}
                              </span>
                          )}
                        <span className="text-[11px] text-gray-500 font-light uppercase"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {(data as any).currency || 'XAF'}
                        </span>
                      </div>

                      {/* Action Button Premium */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isProduct) {
                              const product = data as MapProduct;
                              navigate(`/card/${product.card_id}/marketplace/product/${product.id}`);
                            } else {
                              const service = data as MapService;
                              if (service.card_id && service.user_id) {
                                setSelectedServiceForQuote({
                                  cardId: service.card_id,
                                  userId: service.user_id,
                                  serviceName: service.title
                                });
                                setIsQuoteDialogOpen(true);
                              }
                            }
                          }}
                          className={cn(
                          "w-full h-9 rounded-lg text-white text-[13px] font-light flex items-center justify-center gap-1.5 transition-all shadow-sm",
                          isActive || isSelected 
                            ? "bg-gray-900 hover:bg-gray-800" 
                            : "bg-gray-800 hover:bg-gray-700"
                          )}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        whileTap={{ scale: 0.97 }}
                        >
                          {isProduct ? (
                            <>
                            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>Acheter</span>
                            </>
                          ) : (
                            <>
                            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>Réserver</span>
                            </>
                          )}
                        </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          )}
        </div>

        {/* MINIMAL PAGINATION - Plus visible */}
        {!selectedItemId && nearbyItems.length > 1 && (
          <div className="flex justify-center gap-2 pb-4 pt-1">
            {nearbyItems.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex 
                    ? "w-8 bg-gray-900" 
                    : "w-1.5 bg-gray-300 hover:bg-gray-400 active:bg-gray-500"
                )}
                whileTap={{ scale: 0.9 }}
                layout
              />
            ))}
          </div>
        )}
        </div>
      </div>
        </motion.div>
      )}

      {/* Dialog de demande de devis pour les services */}
      {selectedServiceForQuote && (
        <QuoteRequestDialog
          isOpen={isQuoteDialogOpen}
          onClose={() => {
            setIsQuoteDialogOpen(false);
            setSelectedServiceForQuote(null);
          }}
          cardId={selectedServiceForQuote.cardId}
          userId={selectedServiceForQuote.userId}
          brandColor="#8B5CF6"
          defaultServiceName={selectedServiceForQuote.serviceName}
        />
        )}
      </AnimatePresence>
  );
};