import React from 'react';
import { motion } from 'framer-motion';

/**
 * ILLUSTRATIONS INTERACTIVES MINIMALISTES
 * Style Stripe - Wireframes épurés avec animations
 */

// 1. CRM - Scan de carte avec flux
export const CRMFlowIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Carte physique */}
    <motion.div
      className="absolute left-8 w-32 h-20 border-2 border-current rounded-lg"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 1 }}
    >
      <div className="absolute top-2 left-2 w-8 h-8 border border-current rounded-full" />
      <div className="absolute bottom-2 left-2 right-2 space-y-1">
        <div className="h-1 bg-current opacity-30 w-3/4" />
        <div className="h-1 bg-current opacity-30 w-1/2" />
      </div>
    </motion.div>

    {/* Flèche animée */}
    <motion.svg 
      className="absolute left-44 w-16 h-16"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
    >
      <motion.path 
        d="M 0 8 L 48 8" 
        stroke="currentColor" 
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      />
      <motion.path 
        d="M 42 2 L 48 8 L 42 14" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      />
    </motion.svg>

    {/* Contact dans CRM */}
    <motion.div
      className="absolute right-8 w-40 h-32 border-2 border-current rounded-lg p-3"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.6, duration: 1 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 border border-current rounded-full" />
        <div className="flex-1 space-y-1">
          <div className="h-1 bg-current opacity-40 w-full" />
          <div className="h-1 bg-current opacity-30 w-2/3" />
        </div>
      </div>
      <div className="space-y-1 mt-3">
        <div className="h-1 bg-current opacity-20 w-full" />
        <div className="h-1 bg-current opacity-20 w-4/5" />
        <div className="h-1 bg-current opacity-20 w-3/5" />
      </div>
    </motion.div>
  </div>
);

// 2. Scan OCR - Photo vers données
export const ScanOCRIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Téléphone avec caméra */}
    <motion.div
      className="w-24 h-40 border-2 border-current rounded-2xl relative"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-current opacity-30 rounded-full" />
      <motion.div 
        className="absolute inset-4 border border-current rounded-lg flex items-center justify-center"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </motion.div>
    </motion.div>

    {/* Flash de scan */}
    <motion.div
      className="absolute inset-0 bg-current opacity-0"
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{ delay: 1.5, duration: 0.3 }}
    />

    {/* Données extraites */}
    <motion.div
      className="absolute right-0 space-y-2"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      {[1, 0.8, 0.6, 0.4].map((opacity, i) => (
        <motion.div
          key={i}
          className="h-1 bg-current rounded-full"
          style={{ opacity, width: `${120 - i * 20}px` }}
          initial={{ width: 0 }}
          animate={{ width: `${120 - i * 20}px` }}
          transition={{ delay: 2.2 + i * 0.1, duration: 0.6 }}
        />
      ))}
    </motion.div>
  </div>
);

// 3. Agenda - Calendrier avec créneaux
export const AgendaIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="w-64 h-48 border-2 border-current rounded-lg p-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header calendrier */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-current/30">
        <div className="text-[10px] font-mono">JUIN 2025</div>
        <div className="flex gap-1">
          <div className="w-3 h-3 border border-current rounded" />
          <div className="w-3 h-3 border border-current rounded" />
        </div>
      </div>

      {/* Grille calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <motion.div
            key={i}
            className={`aspect-square border ${i === 10 || i === 17 ? 'border-current bg-current/20' : 'border-current/20'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
          />
        ))}
      </div>

      {/* Indicateur créneau */}
      <motion.div
        className="absolute right-6 top-24 px-2 py-1 border border-current rounded text-[8px] font-mono"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        14:00
      </motion.div>
    </motion.div>
  </div>
);

// 4. Stock - Graphique temps réel
export const StockIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.svg 
      className="w-64 h-48" 
      viewBox="0 0 240 180"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Axes */}
      <line x1="20" y1="160" x2="220" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="20" y1="20" x2="20" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />

      {/* Barres animées */}
      {[40, 80, 120, 160, 200].map((x, i) => {
        const height = [80, 120, 90, 140, 100][i];
        return (
          <motion.rect
            key={i}
            x={x - 8}
            y={160 - height}
            width="16"
            height={height}
            fill="currentColor"
            opacity="0.6"
            initial={{ height: 0, y: 160 }}
            animate={{ height, y: 160 - height }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
          />
        );
      })}

      {/* Ligne de tendance */}
      <motion.path
        d="M 32 80 Q 72 40, 112 70 T 192 60"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.5, duration: 1.5 }}
      />
    </motion.svg>
  </div>
);

// 5. Map - Carte avec pins
export const MapIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="w-64 h-48 border-2 border-current rounded-lg relative overflow-hidden"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Lignes de map */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-x-0 h-px bg-current opacity-10"
          style={{ top: `${20 + i * 16}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
        />
      ))}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-y-0 w-px bg-current opacity-10"
          style={{ left: `${20 + i * 16}%` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
        />
      ))}

      {/* Pins de localisation */}
      {[
        { x: '30%', y: '35%' },
        { x: '60%', y: '50%' },
        { x: '45%', y: '70%' }
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-6 h-6"
          style={{ left: pos.x, top: pos.y }}
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 1 + i * 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

// 6. Paiement - Multiple providers
export const PaymentFlowIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Device central */}
    <motion.div
      className="w-32 h-48 border-2 border-current rounded-2xl p-3 relative"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="text-center text-[10px] font-mono mb-3 opacity-60">PAIEMENT</div>
      
      {/* Options de paiement */}
      {['MM', 'CC', 'QR'].map((method, i) => (
        <motion.div
          key={i}
          className="mb-2 p-2 border border-current rounded flex items-center justify-center text-[8px] font-mono"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.2, duration: 0.6 }}
          whileHover={{ scale: 1.05, backgroundColor: 'currentColor' }}
        >
          {method}
        </motion.div>
      ))}
    </motion.div>

    {/* Providers connectés */}
    {[
      { x: -60, y: -30, label: 'Moov' },
      { x: -60, y: 30, label: 'Wave' },
      { x: 60, y: 0, label: 'Stripe' }
    ].map((provider, i) => (
      <React.Fragment key={i}>
        <motion.div
          className="absolute w-16 h-12 border border-current rounded flex items-center justify-center text-[8px] font-mono"
          style={{ transform: `translate(${provider.x}px, ${provider.y}px)` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 + i * 0.2, type: 'spring' }}
        >
          {provider.label}
        </motion.div>
        
        <motion.line
          x1="0"
          y1="0"
          x2={provider.x * 0.6}
          y2={provider.y * 0.6}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="2 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.3 + i * 0.2, duration: 0.8 }}
        />
      </React.Fragment>
    ))}
  </div>
);

// 7. Portfolio - Grille projets
export const PortfolioGridIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-20 h-20 border-2 border-current rounded"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: i * 0.08, 
            duration: 0.6,
            type: 'spring',
            stiffness: 200 
          }}
          whileHover={{ 
            scale: 1.1,
            zIndex: 10,
            transition: { duration: 0.3 }
          }}
        >
          <div className="w-full h-full opacity-20 bg-current" />
        </motion.div>
      ))}
    </div>

    {/* Badge "HD" */}
    <motion.div
      className="absolute -top-2 -right-2 px-2 py-1 border border-current rounded text-[8px] font-mono bg-white"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring' }}
    >
      HD
    </motion.div>
  </div>
);

// 8. DRM - Système de protection
export const DRMIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Document */}
    <motion.div
      className="w-32 h-44 border-2 border-current rounded-lg p-3 relative"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="space-y-1 mb-4">
        <div className="h-1 bg-current opacity-40 w-full" />
        <div className="h-1 bg-current opacity-40 w-4/5" />
        <div className="h-1 bg-current opacity-40 w-full" />
        <div className="h-1 bg-current opacity-40 w-3/5" />
      </div>

      {/* Watermark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-[8px] font-mono opacity-10 rotate-45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.8 }}
      >
        ID:X7F2
      </motion.div>
    </motion.div>

    {/* Cadenas */}
    <motion.svg
      className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.6, duration: 0.8, type: 'spring', stiffness: 150 }}
    >
      <rect x="6" y="8" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 8 8 L 8 5 Q 8 2, 12 2 Q 16 2, 16 5 L 16 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </motion.svg>

    {/* Particules de chiffrement */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-current rounded-full"
        style={{
          left: `${30 + Math.random() * 40}%`,
          top: `${30 + Math.random() * 40}%`
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0]
        }}
        transition={{
          delay: 1.5 + i * 0.1,
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2
        }}
      />
    ))}
  </div>
);

// 9. Système - Modules connectés
export const SystemDiagramIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg className="w-full h-full" viewBox="0 0 300 200">
      {/* Module central */}
      <motion.circle
        cx="150"
        cy="100"
        r="20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
      />

      {/* Modules périphériques */}
      {[
        { x: 80, y: 50, a: 0 },
        { x: 220, y: 50, a: 1 },
        { x: 80, y: 150, a: 2 },
        { x: 220, y: 150, a: 3 }
      ].map((node, i) => (
        <React.Fragment key={i}>
          {/* Connexion */}
          <motion.line
            x1="150"
            y1="100"
            x2={node.x}
            y2={node.y}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.2"
            strokeDasharray="2 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
          />
          
          {/* Noeud */}
          <motion.rect
            x={node.x - 15}
            y={node.y - 15}
            width="30"
            height="30"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.6, type: 'spring' }}
          />

          {/* Pulse sur noeud */}
          <motion.circle
            cx={node.x}
            cy={node.y}
            r="3"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ 
              delay: 1.5 + i * 0.3,
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
          />
        </React.Fragment>
      ))}
    </svg>
  </div>
);

export default {
  CRMFlowIllustration,
  ScanOCRIllustration,
  AgendaIllustration,
  StockIllustration,
  MapIllustration,
  PaymentFlowIllustration,
  PortfolioGridIllustration,
  DRMIllustration,
  SystemDiagramIllustration
};

