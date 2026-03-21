import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';

/**
 * ILLUSTRATIONS AVEC MOTION DESIGN AVANCÉ
 * Compréhensibles, animées, engageantes
 */

// 1. CRM - Tap NFC avec ondes et contact qui apparaît
export const CRMFlowIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  useEffect(() => {
    if (!isInView || !ref.current) return;

    const waves = ref.current.querySelectorAll('.nfc-wave');
    waves.forEach((wave, i) => {
      gsap.to(wave, {
        scale: 3 + i * 0.5,
        opacity: 0,
        duration: 2,
        repeat: Infinity,
        delay: i * 0.3,
        ease: 'power2.out'
      });
    });
  }, [isInView]);

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      {/* Smartphone */}
      <motion.div
        className="relative w-32 h-56 border-2 border-current rounded-[2rem] bg-white/5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-current opacity-20 rounded-full" />
        
        {/* Écran */}
        <div className="absolute inset-3 border border-current/20 rounded-2xl p-3 overflow-hidden">
          {/* Contact qui apparaît */}
          <motion.div
            className="flex items-center gap-2 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.div 
              className="w-10 h-10 border-2 border-current rounded-full"
              animate={isInView ? { 
                boxShadow: ['0 0 0 0 rgba(139, 92, 246, 0)', '0 0 20px 5px rgba(139, 92, 246, 0.4)', '0 0 0 0 rgba(139, 92, 246, 0)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            <div className="flex-1 space-y-1.5">
              <motion.div 
                className="h-2 bg-current opacity-50 rounded"
                initial={{ width: 0 }}
                animate={isInView ? { width: '100%' } : {}}
                transition={{ delay: 0.7, duration: 0.6 }}
              />
              <motion.div 
                className="h-1.5 bg-current opacity-30 rounded"
                initial={{ width: 0 }}
                animate={isInView ? { width: '70%' } : {}}
                transition={{ delay: 0.9, duration: 0.6 }}
              />
            </div>
          </motion.div>
          
          <motion.div
            className="text-[8px] font-mono opacity-40"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.4 } : {}}
            transition={{ delay: 1.2 }}
          >
            Contact enregistré ✓
          </motion.div>
        </div>
      </motion.div>

      {/* Carte qui tape */}
      <motion.div
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-28 h-18 border-2 border-current rounded-lg bg-white shadow-xl"
        initial={{ y: -30, rotate: -15, opacity: 0 }}
        animate={isInView ? { y: 0, rotate: -5, opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 200 }}
      >
        <div className="p-2 h-full flex flex-col justify-between">
          <div className="text-[8px] font-mono opacity-60">CARTE</div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 border border-current rounded-full opacity-40" />
            <div className="flex-1 space-y-0.5">
              <div className="h-0.5 bg-current opacity-30" />
              <div className="h-0.5 bg-current opacity-20 w-2/3" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ondes NFC */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="nfc-wave absolute top-20 left-1/2 -translate-x-1/2 border-2 border-current rounded-full pointer-events-none"
          style={{ 
            width: `${40 + i * 10}px`, 
            height: `${40 + i * 10}px`,
            opacity: 0.3
          }}
        />
      ))}
    </div>
  );
};

// 2. OCR - Photo qui scanne avec données qui apparaissent
export const ScanOCRIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      {/* Téléphone avec caméra */}
      <motion.div
        className="relative w-28 h-48 border-2 border-current rounded-2xl bg-white/5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-current opacity-20 rounded-full" />
        
        {/* Écran caméra */}
        <motion.div 
          className="absolute inset-3 border-2 border-current rounded-xl flex items-center justify-center"
          animate={isInView ? { 
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </motion.div>

        {/* Flash */}
        <motion.div
          className="absolute inset-0 bg-white rounded-xl"
          animate={isInView ? { opacity: [0, 0.5, 0] } : {}}
          transition={{ delay: 1.5, duration: 0.2 }}
        />
      </motion.div>

      {/* Données extraites */}
      <motion.div
        className="absolute right-0 space-y-3"
        initial={{ x: 40, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ delay: 2, duration: 0.8 }}
      >
        {['Nom', 'Téléphone', 'Email'].map((label, i) => (
          <motion.div
            key={i}
            className="space-y-1"
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 2.2 + i * 0.15 }}
          >
            <div className="text-[8px] font-mono opacity-40 uppercase">{label}</div>
            <motion.div 
              className="h-2 bg-current opacity-40 rounded"
              style={{ width: `${[100, 80, 90][i]}%` }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${[100, 80, 90][i]}%` } : {}}
              transition={{ delay: 2.4 + i * 0.1, duration: 0.6 }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// 3. Agenda - Calendrier avec créneaux qui se remplissent
export const AgendaIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      <motion.div
        className="w-72 h-64 border-2 border-current rounded-xl p-4 bg-white/5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-current/30">
          <div className="text-xs font-mono">JUIN 2025</div>
          <div className="flex gap-1">
            <div className="w-4 h-4 border border-current rounded" />
            <div className="w-4 h-4 border border-current rounded" />
          </div>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 21 }).map((_, i) => {
            const isBooked = i === 10 || i === 17;
            return (
              <motion.div
                key={i}
                className={`aspect-square border rounded flex items-center justify-center text-[10px] ${
                  isBooked 
                    ? 'border-current bg-current/20' 
                    : 'border-current/20'
                }`}
                initial={{ scale: 0, rotate: -90 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{ 
                  delay: 0.3 + i * 0.02, 
                  duration: 0.4,
                  type: 'spring',
                  stiffness: 200 
                }}
                whileHover={isBooked ? { scale: 1.1 } : {}}
              >
                {i + 1}
              </motion.div>
            );
          })}
        </div>

        {/* Badge créneau */}
        <motion.div
          className="absolute right-6 top-32 px-3 py-1.5 border border-current rounded-lg bg-white text-[10px] font-mono"
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 1.5, type: 'spring' }}
        >
          14:00 ✓
        </motion.div>
      </motion.div>
    </div>
  );
};

// 4. Stock - Graphique animé avec alertes
export const StockIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      <motion.svg 
        className="w-full max-w-md h-64" 
        viewBox="0 0 300 200"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
      >
        {/* Axes */}
        <line x1="30" y1="170" x2="270" y2="170" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <line x1="30" y1="30" x2="30" y2="170" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

        {/* Barres */}
        {[60, 100, 140, 180, 220, 260].map((x, i) => {
          const heights = [100, 140, 90, 160, 120, 80];
          const height = heights[i];
          return (
            <motion.rect
              key={i}
              x={x - 12}
              y={170 - height}
              width="24"
              height={height}
              fill="currentColor"
              opacity="0.6"
              initial={{ height: 0, y: 170 }}
              animate={isInView ? { height, y: 170 - height } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
            />
          );
        })}

        {/* Ligne de tendance */}
        <motion.path
          d="M 42 70 Q 82 30, 122 60 T 202 50"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ delay: 1.5, duration: 1.5 }}
        />

        {/* Point d'alerte */}
        <motion.circle
          cx="260"
          cy="90"
          r="6"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: [0, 1.5, 1] } : {}}
          transition={{ delay: 2.5, duration: 0.6 }}
        />
      </motion.svg>

      {/* Badge alerte */}
      <motion.div
        className="absolute -bottom-4 right-0 px-3 py-1.5 border border-current rounded-lg bg-white text-[10px] font-mono"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2.8 }}
      >
        Alerte stock bas
      </motion.div>
    </div>
  );
};

// 5. Map - Carte avec pins animés
export const MapIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      <motion.div
        className="w-80 h-64 border-2 border-current rounded-xl relative overflow-hidden bg-white/5"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        {/* Grille map */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute inset-x-0 h-px bg-current opacity-10"
            style={{ top: `${25 + i * 15}%` }}
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`v-${i}`}
            className="absolute inset-y-0 w-px bg-current opacity-10"
            style={{ left: `${25 + i * 15}%` }}
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
          />
        ))}

        {/* Pins */}
        {[
          { x: '30%', y: '35%' },
          { x: '60%', y: '50%' },
          { x: '45%', y: '70%' }
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-8"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, y: -30 }}
            animate={isInView ? { scale: 1, y: 0 } : {}}
            transition={{ delay: 1 + i * 0.2, type: 'spring', stiffness: 200 }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {/* Pulse */}
            <motion.div
              className="absolute inset-0 border-2 border-current rounded-full"
              animate={isInView ? { 
                scale: [1, 2, 1],
                opacity: [0.6, 0, 0.6]
              } : {}}
              transition={{ 
                delay: 1.5 + i * 0.3,
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// 6. Paiement - Multi-providers connectés
export const PaymentFlowIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      {/* Device central */}
      <motion.div
        className="w-36 h-56 border-2 border-current rounded-2xl p-4 relative bg-white/5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center text-xs font-mono mb-4 opacity-60">PAIEMENT</div>
        
        {/* Options */}
        {['Moov Money', 'Wave', 'Carte'].map((method, i) => (
          <motion.div
            key={i}
            className="mb-2 p-2.5 border border-current rounded-lg flex items-center justify-center text-[10px] font-mono"
            initial={{ x: -30, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.05, backgroundColor: 'currentColor' }}
          >
            {method}
          </motion.div>
        ))}
      </motion.div>

      {/* Providers connectés */}
      {[
        { x: -80, y: -40, label: 'Moov' },
        { x: -80, y: 40, label: 'Wave' },
        { x: 80, y: 0, label: 'Stripe' }
      ].map((provider, i) => (
        <React.Fragment key={i}>
          <motion.div
            className="absolute w-20 h-14 border border-current rounded-lg flex items-center justify-center text-[10px] font-mono bg-white"
            style={{ transform: `translate(${provider.x}px, ${provider.y}px)` }}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 1 + i * 0.2, type: 'spring' }}
          >
            {provider.label}
          </motion.div>
          
          <motion.line
            x1="0"
            y1="0"
            x2={provider.x * 0.5}
            y2={provider.y * 0.5}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.3"
            strokeDasharray="3 3"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ delay: 1.3 + i * 0.2, duration: 0.8 }}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

// 7. Portfolio - Grille projets avec hover
export const PortfolioGridIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-24 h-24 border-2 border-current rounded-lg relative overflow-hidden"
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ 
              delay: 0.3 + i * 0.05, 
              duration: 0.6,
              type: 'spring',
              stiffness: 200 
            }}
            whileHover={{ 
              scale: 1.15,
              zIndex: 10,
              transition: { duration: 0.3 }
            }}
          >
            <div className="w-full h-full opacity-20 bg-current" />
            {i === 4 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-[8px] font-mono"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                HD
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 8. DRM - Protection avec cadenas
export const DRMIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      {/* Document */}
      <motion.div
        className="w-36 h-52 border-2 border-current rounded-lg p-4 relative bg-white/5"
        initial={{ y: 20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="space-y-1.5 mb-4">
          {[1, 0.9, 1, 0.7].map((w, i) => (
            <motion.div
              key={i}
              className="h-1.5 bg-current opacity-40 rounded"
              style={{ width: `${w * 100}%` }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${w * 100}%` } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
            />
          ))}
        </div>

        {/* Watermark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-xs font-mono opacity-10 rotate-45"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.1 } : {}}
          transition={{ delay: 0.8 }}
        >
          ID:X7F2
        </motion.div>
      </motion.div>

      {/* Cadenas */}
      <motion.svg
        className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20"
        initial={{ scale: 0, rotate: -180 }}
        animate={isInView ? { scale: 1, rotate: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.8, type: 'spring', stiffness: 150 }}
      >
        <rect x="8" y="12" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M 10 12 L 10 8 Q 10 4, 16 4 Q 22 4, 22 8 L 22 12" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="16" cy="19" r="2" fill="currentColor" />
      </motion.svg>

      {/* Particules */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-current rounded-full"
          style={{
            left: `${35 + Math.random() * 30}%`,
            top: `${35 + Math.random() * 30}%`
          }}
          animate={isInView ? {
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          } : {}}
          transition={{
            delay: 1.5 + i * 0.15,
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      ))}
    </div>
  );
};

export default {
  CRMFlowIllustration,
  ScanOCRIllustration,
  AgendaIllustration,
  StockIllustration,
  MapIllustration,
  PaymentFlowIllustration,
  PortfolioGridIllustration,
  DRMIllustration
};

