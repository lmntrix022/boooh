import React from 'react';
import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

interface LocationButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export const LocationButton: React.FC<LocationButtonProps> = ({
  onClick,
  isActive = false
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`w-11 h-11 md:w-12 md:h-12 rounded-full transition-all duration-300 flex items-center justify-center ${
        isActive
          ? 'bg-gray-900 text-white shadow-lg'
          : 'bg-white/95 backdrop-blur-xl border border-gray-200/60 text-gray-700 shadow-md'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      whileTap={{ scale: 0.95 }}
      aria-label="Me localiser"
    >
      <Navigation className={`w-5 h-5 ${isActive ? 'fill-white' : ''}`} strokeWidth={2.5} />
    </motion.button>
  );
};

