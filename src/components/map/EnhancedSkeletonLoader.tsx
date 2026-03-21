// Premium Skeleton Loaders - AWWWARDS / Apple Level
import React from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// SHIMMER COMPONENT - Apple-style pulse animation
// ═══════════════════════════════════════════════════════════

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
      animate={{ translateX: ['calc(-100%)', 'calc(100%)'] }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: [0.4, 0, 0.2, 1],
      }}
    />
  </div>
);

// Pulse variant for subtle animation
const PulseShimmer: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => (
  <motion.div
    className={`bg-gray-100 ${className}`}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
      delay,
    }}
  />
);

// ═══════════════════════════════════════════════════════════
// MAP MARKER SKELETON
// ═══════════════════════════════════════════════════════════

export const MapMarkerSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
    className="absolute"
    style={{
      left: `${Math.random() * 60 + 20}%`,
      top: `${Math.random() * 60 + 20}%`,
    }}
  >
    <div className="relative">
      <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
        <PulseShimmer className="w-6 h-6 rounded-full" delay={delay} />
      </div>
      <motion.div
        className="absolute -inset-1 rounded-full border border-gray-200"
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay }}
      />
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// SEARCH BAR SKELETON
// ═══════════════════════════════════════════════════════════

export const SearchBarSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className="w-12 h-12"
  >
    <div className="w-full h-full bg-white/90 backdrop-blur-xl rounded-[14px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] border border-white/50 flex items-center justify-center">
      <PulseShimmer className="w-5 h-5 rounded-lg" />
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// CONTROLS SKELETON (Right panel)
// ═══════════════════════════════════════════════════════════

export const ControlsSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
    className="relative"
  >
    <div className="absolute -inset-1 bg-gradient-to-b from-white/80 to-white/40 rounded-[20px] blur-sm" />
    <div className="relative bg-white/90 backdrop-blur-2xl rounded-[18px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden p-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          <div className="w-12 h-12 flex items-center justify-center">
            <PulseShimmer className="w-8 h-8 rounded-xl" delay={i * 0.1} />
          </div>
          {i < 5 && i % 2 === 0 && (
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
          )}
        </React.Fragment>
      ))}
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// CATALOG CARD SKELETON
// ═══════════════════════════════════════════════════════════

export const CatalogCardSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, type: 'spring', stiffness: 400, damping: 30 }}
    className="min-w-[260px] bg-white rounded-[20px] overflow-hidden"
    style={{ boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}
  >
    {/* Image */}
    <Shimmer className="w-full h-32" />
    
    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Distance */}
      <div className="flex items-center gap-1.5">
        <PulseShimmer className="w-3 h-3 rounded-full" delay={index * 0.1} />
        <PulseShimmer className="w-12 h-3 rounded-full" delay={index * 0.1 + 0.05} />
      </div>
      
      {/* Title */}
      <PulseShimmer className="w-3/4 h-4 rounded-lg" delay={index * 0.1 + 0.1} />
      
      {/* Price */}
      <PulseShimmer className="w-20 h-5 rounded-lg" delay={index * 0.1 + 0.15} />
      
      {/* Button */}
      <PulseShimmer className="w-full h-10 rounded-xl" delay={index * 0.1 + 0.2} />
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// CATALOG CONTAINER SKELETON
// ═══════════════════════════════════════════════════════════

export const CatalogSkeleton: React.FC = () => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    className="fixed bottom-0 left-0 right-0 z-[60]"
  >
    <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    
    <div className="relative bg-white/80 backdrop-blur-2xl border-t border-white/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <PulseShimmer className="w-8 h-8 rounded-xl" />
          <div className="space-y-1.5">
            <PulseShimmer className="w-20 h-3 rounded-full" delay={0.1} />
            <PulseShimmer className="w-14 h-2 rounded-full" delay={0.15} />
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          <PulseShimmer className="w-8 h-8 rounded-[10px]" delay={0.2} />
          <PulseShimmer className="w-8 h-8 rounded-[10px]" delay={0.25} />
        </div>
      </div>
      
      {/* Cards */}
      <div className="flex gap-4 px-6 pb-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <CatalogCardSkeleton key={i} index={i} />
        ))}
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

// ═══════════════════════════════════════════════════════════
// BUSINESS DETAIL SKELETON
// ═══════════════════════════════════════════════════════════

export const BusinessDetailSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-6 space-y-6"
  >
    {/* Header */}
    <div className="flex items-center gap-4">
      <PulseShimmer className="w-14 h-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <PulseShimmer className="w-32 h-5 rounded-lg" delay={0.1} />
        <PulseShimmer className="w-20 h-3 rounded-full" delay={0.15} />
      </div>
    </div>
    
    {/* Stats */}
    <div className="flex gap-3">
      {[0, 1, 2].map((i) => (
        <PulseShimmer key={i} className="flex-1 h-16 rounded-2xl" delay={0.2 + i * 0.05} />
      ))}
    </div>
    
    {/* Content */}
    <div className="space-y-3">
      <PulseShimmer className="w-full h-4 rounded-lg" delay={0.35} />
      <PulseShimmer className="w-3/4 h-4 rounded-lg" delay={0.4} />
      <PulseShimmer className="w-1/2 h-4 rounded-lg" delay={0.45} />
    </div>
    
    {/* Grid */}
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <PulseShimmer key={i} className="h-28 rounded-2xl" delay={0.5 + i * 0.05} />
      ))}
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// ADVANCED FILTERS SKELETON
// ═══════════════════════════════════════════════════════════

export const AdvancedFiltersSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className="p-5 space-y-6"
  >
    {/* Header */}
    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <PulseShimmer className="w-10 h-10 rounded-xl" />
        <PulseShimmer className="w-28 h-5 rounded-lg" delay={0.05} />
      </div>
      <PulseShimmer className="w-8 h-8 rounded-xl" delay={0.1} />
    </div>
    
    {/* Sections */}
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <PulseShimmer className="w-20 h-3 rounded-full" delay={0.15 + i * 0.1} />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((j) => (
            <PulseShimmer 
              key={j} 
              className="w-20 h-9 rounded-xl" 
              delay={0.2 + i * 0.1 + j * 0.03} 
            />
          ))}
        </div>
      </div>
    ))}
    
    {/* Button */}
    <PulseShimmer className="w-full h-12 rounded-xl" delay={0.6} />
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// MAIN MAP LOADING SKELETON
// ═══════════════════════════════════════════════════════════

export const MapLoadingSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-50 bg-[#f8f9fa]"
  >
    {/* Subtle grid pattern */}
    <div className="absolute inset-0 opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#000" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
    
    {/* Map markers */}
    {[...Array(6)].map((_, i) => (
      <MapMarkerSkeleton key={i} delay={i * 0.1} />
    ))}
    
    {/* Search bar - top left */}
    <div className="absolute top-4 left-4 z-10">
      <SearchBarSkeleton />
    </div>
    
    {/* Controls - top right */}
    <div className="absolute top-4 right-4 z-10">
      <ControlsSkeleton />
    </div>
    
    {/* Catalog - bottom */}
    <CatalogSkeleton />
    
    {/* Center loading indicator */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Premium loader */}
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-2xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinejoin="round" />
            </svg>
          </motion.div>
          
          {/* Pulse ring */}
          <motion.div
            className="absolute -inset-2 rounded-3xl border border-black/20"
            animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        {/* Text */}
        <motion.p
          className="text-sm font-medium text-gray-500 tracking-tight"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Chargement...
        </motion.p>
        
        {/* Progress bar */}
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// INLINE LOADING SPINNER (compact)
// ═══════════════════════════════════════════════════════════

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeOpacity="0.2"
        />
        <path 
          d="M12 2a10 10 0 0 1 10 10" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// BUTTON LOADING STATE
// ═══════════════════════════════════════════════════════════

export const ButtonLoader: React.FC<{ text?: string }> = ({ text = 'Chargement' }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" />
    <span>{text}</span>
  </div>
);

// Export par défaut
export default MapLoadingSkeleton;
