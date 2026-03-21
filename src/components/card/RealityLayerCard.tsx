/**
 * RealityLayerCard - Singularity Design
 *
 * Boutons propriétaire : Modifier + Dashboard (icônes seules).
 * Pas de bouton "masquer" - les deux boutons restent toujours visibles.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, LayoutDashboard } from 'lucide-react';
import { useRealityLayer } from '@/contexts/RealityLayerContext';

interface RealityLayerCardProps {
  children: React.ReactNode;
  editInPlaceNavigate?: boolean;
  editPath?: (cardId: string) => string;
}

export function RealityLayerCard({
  children,
  editInPlaceNavigate = true,
  editPath = (id) => `/cards/${id}/edit`,
}: RealityLayerCardProps) {
  const { cardId, isOwner, setShowOSDrawer } = useRealityLayer();
  const navigate = useNavigate();

  const handleDoubleClick = useCallback(() => {
    if (!isOwner || !cardId) return;
    if (editInPlaceNavigate) {
      navigate(editPath(cardId));
    }
  }, [isOwner, cardId, editInPlaceNavigate, editPath, navigate]);

  if (!isOwner) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isOwner ? 'pointer' : undefined }}
    >
      {children}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="absolute top-4 right-4 z-10 flex items-center gap-2"
      >
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(editPath(cardId!));
          }}
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-gray-800 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-shadow"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Modifier la carte"
        >
          <Edit className="h-5 w-5" strokeWidth={2} />
        </motion.button>
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowOSDrawer(true);
          }}
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-gray-800 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-shadow"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Ouvrir le dashboard"
        >
          <LayoutDashboard className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      </motion.div>
    </div>
  );
}
