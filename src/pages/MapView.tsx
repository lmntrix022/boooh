import React from 'react';
import { MarketplaceMap } from '@/components/map/MarketplaceMap';
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';

// AnimatedOrbs premium background
const AnimatedOrbs = () => (
  <div className="absolute inset-0 pointer-events-none z-0">
    <motion.div
      className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-[30vw] max-w-2xl rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/20 to-white/0 blur-3xl opacity-40 animate-pulse-slow"
      animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-0 right-0 w-1/3 h-1/4 bg-gradient-to-tr from-violet-400/20 to-blue-400/10 blur-2xl opacity-20"
      animate={{ y: [0, 20, 0], opacity: [0.2, 0.3, 0.2] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-1/3 left-0 w-1/4 h-1/4 bg-gradient-to-br from-violet-400/20 to-blue-400/10 blur-2xl opacity-30"
      animate={{ x: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

const MapView: React.FC = () => {

  // SEO Meta Tags
  useSEO({
    title: 'Carte Interactive | Booh - Découvrez nos utilisateurs',
    description: 'Découvrez la carte interactive de Booh et explorez les professionnels utilisant nos cartes de visite digitales.',
    image: 'https://booh.ga/og-image-map.png',
    url: 'https://booh.ga/map',
    type: 'website',
    keywords: 'carte, localisation, professionnels, réseau, utilisateurs'
  });

  const breadcrumbs = [
    { name: 'Accueil', url: 'https://booh.ga' },
    { name: 'Carte', url: 'https://booh.ga/map' }
  ];

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden apple-minimal-font"
      style={{ 
        isolation: 'isolate',
        willChange: 'auto' // Évite les optimisations de rendu qui causent des glitches
      }}
    >
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* Carte en plein écran - Optimisé pour performance */}
      <div 
        className="h-screen w-screen relative"
        style={{ 
          zIndex: 0,
          contain: 'layout style paint' // Optimisation CSS pour isolation
        }}
      >
        <div 
          className="h-full w-full relative"
          style={{ 
            zIndex: 1,
            transform: 'translateZ(0)' // Force GPU acceleration sans conflit
          }}
        >
          <MarketplaceMap />
        </div>
      </div>
    </div>
  );
};

export default MapView; 