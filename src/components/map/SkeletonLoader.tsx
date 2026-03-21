import React from 'react';
import { motion } from 'framer-motion';

// Pulse animation component
const Pulse: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => (
  <motion.div
    className={`bg-gray-100 ${className}`}
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

// Shimmer animation component
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

export const SkeletonLoader: React.FC<{ type?: 'list' | 'popup'; count?: number }> = ({ 
  type = 'list', 
  count = 5 
}) => {
  if (type === 'popup') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 min-w-[280px] max-w-[320px] flex flex-col gap-4"
      >
        {/* Avatar */}
        <div className="flex justify-center">
          <Pulse className="w-14 h-14 rounded-2xl" />
        </div>
        
        {/* Title & subtitle */}
        <div className="flex flex-col items-center gap-2">
          <Pulse className="h-5 w-32 rounded-lg" delay={0.1} />
          <Pulse className="h-3 w-20 rounded-full" delay={0.15} />
        </div>
        
        {/* Stats row */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Pulse className="w-8 h-4 rounded" delay={0.2 + i * 0.05} />
              <Pulse className="w-12 h-3 rounded" delay={0.25 + i * 0.05} />
            </div>
          ))}
        </div>
        
        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <Pulse className="h-10 w-full rounded-xl" delay={0.35} />
          <Pulse className="h-10 w-full rounded-xl" delay={0.4} />
      </div>
      </motion.div>
    );
  }

  // Liste
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="divide-y divide-gray-100"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="py-3 flex items-center gap-3 px-4"
        >
          {/* Avatar */}
          <Pulse className="w-10 h-10 rounded-xl flex-shrink-0" delay={i * 0.05} />
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <Pulse className="h-4 w-3/4 rounded-lg" delay={i * 0.05 + 0.05} />
            <Pulse className="h-3 w-1/2 rounded" delay={i * 0.05 + 0.1} />
          </div>
          
          {/* Action */}
          <Pulse className="w-8 h-8 rounded-lg flex-shrink-0" delay={i * 0.05 + 0.15} />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Additional skeleton components for specific use cases

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl overflow-hidden ${className}`}
    style={{ boxShadow: '0 4px 20px -8px rgba(0,0,0,0.1)' }}
  >
    <Shimmer className="w-full h-32" />
    <div className="p-4 space-y-3">
      <Pulse className="h-4 w-3/4 rounded-lg" />
      <Pulse className="h-3 w-1/2 rounded" delay={0.1} />
      <Pulse className="h-10 w-full rounded-xl" delay={0.2} />
    </div>
  </motion.div>
);

export const ProfileSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-3 p-3"
  >
    <Pulse className="w-12 h-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Pulse className="h-4 w-24 rounded-lg" delay={0.1} />
      <Pulse className="h-3 w-16 rounded" delay={0.15} />
    </div>
  </motion.div>
  );

export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Pulse className={`h-10 rounded-xl ${className}`} />
);
