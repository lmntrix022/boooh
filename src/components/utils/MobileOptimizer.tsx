import React, { createContext, useContext, useEffect, useState } from 'react';

// Configuration interface pour l'optimisation mobile
interface OptimizationConfig {
  isMobile: boolean;
  isTablet: boolean;
  isLowPowerMode: boolean;
  prefersReducedMotion: boolean;
  disableParallax: boolean;
  disableAnimations: boolean;
  disableEffects: boolean;
  disableHoverEffects: boolean;
  throttledScroll: boolean;
}

// Context pour partager les informations d'optimisation
const MobileOptimizerContext = createContext<OptimizationConfig>({
  isMobile: false,
  isTablet: false,
  isLowPowerMode: false,
  prefersReducedMotion: false,
  disableParallax: false,
  disableAnimations: false,
  disableEffects: false,
  disableHoverEffects: false,
  throttledScroll: false,
});

export const useMobileOptimizer = () => useContext(MobileOptimizerContext);

// Helpers pour détecter les capacités de l'appareil
const detectLowPowerMode = () => {
  // Détection basique - à améliorer avec une vraie API quand disponible
  return ('connection' in navigator) && 
    // @ts-ignore - Navigator API pas encore standard
    (navigator.connection?.saveData || navigator.connection?.effectiveType === 'slow-2g' || navigator.connection?.effectiveType === '2g');
};

// Throttle helper
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const MobileOptimizer: React.FC = () => {
  const [config, setConfig] = useState<OptimizationConfig>({
    isMobile: false,
    isTablet: false,
    isLowPowerMode: false,
    prefersReducedMotion: false,
    disableParallax: false,
    disableAnimations: false,
    disableEffects: false,
    disableHoverEffects: false,
    throttledScroll: false,
  });

  useEffect(() => {
    // Vérifications initiales
    const checkDeviceCapabilities = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isLowPowerMode = detectLowPowerMode();
      
      // Vérifier la préférence pour les mouvements réduits
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Adapter la configuration selon l'appareil et les préférences
      const disableParallax = isMobile || isLowPowerMode || prefersReducedMotion;
      const disableAnimations = prefersReducedMotion || (isMobile && isLowPowerMode);
      const disableEffects = isMobile || isLowPowerMode || prefersReducedMotion;
      const disableHoverEffects = isMobile || isTablet;
      
      // Optimisations d'événements
      const throttledScroll = isMobile || isTablet || isLowPowerMode;
      
      setConfig({
        isMobile,
        isTablet,
        isLowPowerMode,
        prefersReducedMotion,
        disableParallax,
        disableAnimations,
        disableEffects,
        disableHoverEffects,
        throttledScroll,
      });
    };

    // Appliquer immédiatement
    checkDeviceCapabilities();
    
    // Appliquer les optimisations globales
    if (config.throttledScroll) {
      const originalScroll = window.onscroll;
      window.onscroll = throttle(function(this: any, ...args: any[]) {
        if (originalScroll) {
          // @ts-ignore
          originalScroll.apply(this, args);
        }
      }, 100);
    }
    
    // Optimisation du style global
    if (config.isMobile || config.isLowPowerMode) {
      document.documentElement.classList.add('optimize-animations');
    }
    
    // Écouter les changements de taille
    window.addEventListener('resize', checkDeviceCapabilities);
    
    // Nettoyage à la destruction du composant
    return () => {
      window.removeEventListener('resize', checkDeviceCapabilities);
      document.documentElement.classList.remove('optimize-animations');
    };
  }, []);

  return (
    <MobileOptimizerContext.Provider value={config}>
      {config.disableAnimations && (
        <style dangerouslySetInnerHTML={{ __html: `
          .optimize-animations * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
          
          @media (max-width: 768px) {
            .disable-mobile-effect {
              display: none !important;
            }
          }
        `}} />
      )}
    </MobileOptimizerContext.Provider>
  );
};

export default MobileOptimizer; 