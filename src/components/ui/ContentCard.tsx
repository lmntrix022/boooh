import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ContentCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  delay?: number;
  maxWidth?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  icon: Icon,
  children,
  delay = 0.4,
  maxWidth = "max-w-3xl"
}) => (
  <motion.div
    className={`glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group ${maxWidth} mx-auto`}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay }}
    whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
  >
    {/* Orbe décoratif animé */}
    <motion.div
      className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[30vw] h-[12vw] max-w-lg rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
      animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    />

    <div className="flex items-center gap-3 px-8 pt-8 pb-2">
      {Icon && (
        <motion.div
          className="h-12 w-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg floating"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="h-7 w-7 text-white animate-pulse" />
        </motion.div>
      )}
      <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
        {title}
      </h2>
    </div>

    <div className="p-8 pt-2">
      {children}
    </div>
  </motion.div>
);
