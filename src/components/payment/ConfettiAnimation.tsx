import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
}

const CONFETTI_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const generateConfetti = (count: number = 150): ConfettiPiece[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    size: 8 + Math.random() * 12,
  }));
};

interface ConfettiAnimationProps {
  duration?: number; // Durée de l'animation en millisecondes
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ 
  duration = 3000,
  onComplete 
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Générer les confettis
    setConfetti(generateConfetti(150));

    // Disparaître après la durée spécifiée
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 500); // Attendre que l'animation de sortie se termine
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getShapeStyle = (piece: ConfettiPiece) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${piece.x}%`,
      backgroundColor: piece.color,
      width: `${piece.size}px`,
      height: `${piece.size}px`,
    };

    switch (piece.shape) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%',
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: '2px',
          transform: `rotate(${Math.random() * 360}deg)`,
        };
      case 'triangle':
        return {
          ...baseStyle,
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderLeft: `${piece.size / 2}px solid transparent`,
          borderRight: `${piece.size / 2}px solid transparent`,
          borderBottom: `${piece.size}px solid ${piece.color}`,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              style={getShapeStyle(piece)}
              initial={{
                y: -50,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 100,
                opacity: [1, 1, 0],
                rotate: 360 + Math.random() * 360,
                x: [
                  0,
                  (Math.random() - 0.5) * 200,
                  (Math.random() - 0.5) * 300,
                ],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeOut',
              }}
            />
          ))}
          
          {/* Particules supplémentaires avec effet de souffle au centre */}
          {Array.from({ length: 50 }).map((_, i) => {
            const angle = (i / 50) * Math.PI * 2;
            const radius = 150 + Math.random() * 100;
            return (
              <motion.div
                key={`burst-${i}`}
                className="absolute rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  width: `${6 + Math.random() * 6}px`,
                  height: `${6 + Math.random() * 6}px`,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
                initial={{
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0],
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.02,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiAnimation;

