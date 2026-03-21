import React from 'react';
import { motion } from 'framer-motion';

interface BusinessCardToggleProps {
  shouldShowSlider: boolean;
  activeSlider: 'liens' | 'boutique';
  setActiveSlider: (slider: 'liens' | 'boutique') => void;
}

const BusinessCardToggle: React.FC<BusinessCardToggleProps> = ({
  shouldShowSlider,
  activeSlider,
  setActiveSlider
}) => {
  if (!shouldShowSlider) return null;

  return (
    <div className="flex justify-center mt-6">
      <div className="relative flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-0 shadow-xl">
        {/* Indicateur animé */}
        <motion.div
          className="absolute top-1 bottom-1 bg-white/30 backdrop-blur-md rounded-xl shadow-lg"
          style={{ willChange: 'transform' }}
          initial={false}
          animate={{
            x: activeSlider === 'liens' ? 0 : '100%',
            width: '50%'
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
        
        <motion.button
          onClick={() => setActiveSlider('liens')}
          className={`relative z-10 px-6 py-2 rounded-xl font-semibold text-sm ${
            activeSlider === 'liens'
              ? 'text-gray-900'
              : 'text-white hover:text-white'
          }`}
          style={{ willChange: 'transform' }}
          whileHover={{ 
            scale: 1.05, 
            y: -1,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              duration: 0.2
            } 
          }}
          whileTap={{ 
            scale: 0.95,
            transition: { 
              type: "spring", 
              stiffness: 500, 
              damping: 20,
              duration: 0.15
            }
          }}
        >
          Liens
        </motion.button>
        
        <motion.button
          onClick={() => setActiveSlider('boutique')}
          className={`relative z-10 px-4 py-2 rounded-xl font-semibold text-sm ${
            activeSlider === 'boutique'
              ? 'text-gray-900'
              : 'text-white hover:text-white'
          }`}
          style={{ willChange: 'transform' }}
          whileHover={{ 
            scale: 1.05, 
            y: -1,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              duration: 0.2
            } 
          }}
          whileTap={{ 
            scale: 0.95,
            transition: { 
              type: "spring", 
              stiffness: 500, 
              damping: 20,
              duration: 0.15
            }
          }}
        >
          Boutique
        </motion.button>
      </div>
    </div>
  );
};

export default BusinessCardToggle;
