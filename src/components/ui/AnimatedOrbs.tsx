import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedOrbs: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Orbe principal central */}
    <motion.div
      className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-[30vw] max-w-2xl rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-40"
      animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Orbe secondaire bas-droite */}
    <motion.div
      className="absolute bottom-0 right-0 w-1/3 h-1/4 bg-gradient-to-tr from-black/20 to-transparent blur-2xl opacity-20"
      animate={{ y: [0, 20, 0], opacity: [0.2, 0.3, 0.2] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Orbe tertiaire gauche */}
    <motion.div
      className="absolute top-1/3 left-0 w-1/4 h-1/4 bg-gradient-to-br from-purple-400/20 to-blue-400/10 blur-2xl opacity-30"
      animate={{ x: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);
