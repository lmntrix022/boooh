import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.8,
    },
  },
};

// Animation "glitch" et "shake" pour le logo
const logoVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: [0, 1, 0.7, 1],
    scale: [0.8, 1.05, 0.95, 1],
    rotate: [0, 0, 3, -3, 0],
    transition: {
      times: [0, 0.2, 0.6, 0.8, 1],
      duration: 1.5,
      delay: 0.2,
    },
  },
};

// Animation de l'onde de choc lumineuse
const glowVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: [0, 1, 0],
    scale: [0, 4, 0],
    transition: {
      duration: 1.2,
      delay: 1.5, // Se déclenche après l'apparition du logo
    },
  },
};

const AnimatedSplashScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Vérifier si c'est la première visite
    const hasVisited = localStorage.getItem('booh_has_visited');

    if (!hasVisited) {
      // Première visite : afficher le splash screen
      setShouldShow(true);
      setIsVisible(true);

      // Marquer comme visité
      localStorage.setItem('booh_has_visited', 'true');

      // Masquer automatiquement le splash screen après 2.5 secondes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
    // Si déjà visité, ne rien afficher
  }, []);

  if (!shouldShow) return null;
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onAnimationComplete={(definition) => {
        // Masquer complètement après l'animation de sortie
        if (definition === 'exit') {
          setTimeout(() => setIsVisible(false), 100);
        }
      }}
    >
      {/* L'onde de choc */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          backgroundColor: '#a78bfa', // Une nuance de violet
          boxShadow: '0 0 80px 40px #7c3aed, 0 0 120px 60px #a78bfa', // Lueur intense
        }}
        variants={glowVariants}
      />

      {/* Le Logo, positionné au-dessus de la lueur */}
      <motion.img
        src="/booh.svg"
        alt="bööh Logo"
        className="w-48 h-8"
        variants={logoVariants}
      />
    </motion.div>
  );
};

export default AnimatedSplashScreen; 