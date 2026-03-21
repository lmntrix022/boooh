import React from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// PREMIUM CARD LOADING SKELETON - AWWWARDS/APPLE LEVEL
// ═══════════════════════════════════════════════════════════

// Composant shimmer premium avec effet wave
const Shimmer: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
  <div className={`relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
      style={{ transform: 'skewX(-20deg)' }}
      animate={{ translateX: ['-200%', '200%'] }}
      transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], repeat: Infinity, delay }}
    />
  </div>
);

// Pulse subtil
const PulseCircle: React.FC<{ size: string; delay?: number }> = ({ size, delay = 0 }) => (
  <motion.div
    className={`${size} rounded-full bg-gray-200`}
    animate={{ opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const CardLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#fafafa]" />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.05), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255, 182, 193, 0.04), transparent)
            `
          }}
        />
      </div>

      {/* Main skeleton card */}
      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Ombres multicouches */}
        <div className="absolute -inset-px rounded-[32px] bg-black/[0.02] translate-y-2 scale-[0.99]" />
        
        {/* Card principale */}
        <div className="relative bg-white rounded-[28px] overflow-hidden ring-1 ring-black/[0.04]">
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/80 pointer-events-none z-50" />
          
          {/* Header skeleton */}
          <div className="relative h-72 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            {/* Subtle pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
            
            {/* Avatar centré avec effet pulse */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <div className="relative">
                {/* Cercles de pulse */}
                <motion.div
                  className="absolute -inset-4 rounded-full border border-gray-200"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-gray-100"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
                
                {/* Avatar */}
                <Shimmer className="w-20 h-20 rounded-full" delay={0} />
                
                {/* Spinner élégant */}
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  style={{ 
                    border: '2px solid transparent',
                    borderTopColor: 'rgba(0,0,0,0.1)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              
              {/* Nom et titre */}
              <div className="mt-5 flex flex-col items-center gap-2">
                <Shimmer className="h-6 w-36 rounded-lg" delay={0.1} />
                <Shimmer className="h-4 w-24 rounded-full" delay={0.15} />
              </div>
            </div>
            
            {/* Social icons row */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6">
              {[1, 2, 3, 4].map((i) => (
                <Shimmer 
                  key={i} 
                  className="w-10 h-10 rounded-full" 
                  delay={0.2 + (i * 0.05)} 
                />
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-5 space-y-4">
            {/* Toggle tabs */}
            <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
              <Shimmer className="flex-1 h-10 rounded-lg" delay={0.3} />
              <Shimmer className="flex-1 h-10 rounded-lg" delay={0.35} />
            </div>

            {/* Expandable section */}
            <Shimmer className="h-14 w-full rounded-2xl" delay={0.4} />
            
            {/* Links */}
            <div className="space-y-3">
              <Shimmer className="h-[72px] w-full rounded-2xl" delay={0.45} />
              <Shimmer className="h-[72px] w-full rounded-2xl" delay={0.5} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reviews section skeleton */}
      <motion.div 
        className="relative mt-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="absolute -inset-px rounded-[24px] bg-black/[0.02] translate-y-1" />
        <div className="relative bg-white rounded-[24px] p-5 ring-1 ring-black/[0.04]">
          <div className="flex flex-col items-center gap-3">
            <Shimmer className="h-5 w-20 rounded-lg" delay={0.55} />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Shimmer key={i} className="w-5 h-5 rounded" delay={0.55 + (i * 0.02)} />
              ))}
            </div>
            <Shimmer className="h-10 w-28 rounded-xl mt-2" delay={0.65} />
          </div>
        </div>
      </motion.div>

      {/* CTA section skeleton */}
      <motion.div 
        className="relative mt-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="relative bg-white rounded-[24px] p-6 ring-1 ring-black/[0.04]">
          <div className="flex flex-col items-center gap-4">
            <Shimmer className="h-4 w-48 rounded-lg" delay={0.7} />
            <Shimmer className="h-11 w-36 rounded-full" delay={0.75} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CardLoadingSkeleton; 