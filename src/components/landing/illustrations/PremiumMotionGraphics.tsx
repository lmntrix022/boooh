import React, { useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';

/**
 * PREMIUM MOTION GRAPHICS - AWWWARDS LEVEL
 * Style iPhone 17 + Stripe - Animations cinématiques
 */

// 1. CRM - Device mockup avec animation de tap NFC
export const PremiumCRMIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

  useEffect(() => {
    if (!isInView || !ref.current) return;
    
    const tl = gsap.timeline({ delay: 0.5 });
    
    // Card drops
    tl.to('.premium-card', {
      y: 0,
      rotate: -5,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.7)'
    });
    
    // NFC waves
    gsap.to('.premium-wave', {
      scale: 3,
      opacity: 0,
      duration: 2,
      stagger: 0.3,
      repeat: -1,
      ease: 'power2.out'
    });
    
    // Contact card appears
    tl.to('.premium-contact', {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    }, '+=0.5');
  }, [isInView]);

  return (
    <motion.div 
      ref={ref} 
      className="relative w-full h-full flex items-center justify-center py-12 px-4 min-h-[500px] md:min-h-[600px]"
      style={{ y }}
    >
      {/* Background gradient glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl"
        animate={isInView ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* iPhone 17-style device mockup - RESPONSIVE */}
      <motion.div
        className="relative w-72 md:w-80 h-[500px] md:h-[600px] rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-b from-gray-900 to-black shadow-2xl overflow-hidden border-[10px] md:border-[14px] border-gray-900"
        style={{ scale }}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-gray-900 rounded-b-3xl z-10" />
        
        {/* Screen */}
        <div className="relative h-full bg-white rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="h-12 bg-gradient-to-b from-white to-white/95 flex items-center justify-between px-8 text-xs font-semibold">
            <span>9:41</span>
            <div className="flex gap-2">
              <div className="w-4 h-3 border border-current rounded-sm" />
              <div className="w-4 h-3 border border-current rounded-sm opacity-70" />
              <div className="w-4 h-3 border border-current rounded-sm opacity-40" />
            </div>
          </div>

          {/* App content */}
          <div className="p-6 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-1">Contacts</h3>
              <p className="text-sm text-gray-500">215 contacts enregistrés</p>
            </motion.div>

            {/* Search bar */}
            <motion.div
              className="p-3 bg-gray-100 rounded-xl flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-400 text-sm">Rechercher...</span>
            </motion.div>

            {/* Contact card that appears */}
            <motion.div
              className="premium-contact p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <motion.div 
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"
                  animate={isInView ? { 
                    boxShadow: [
                      '0 0 0 0 rgba(139, 92, 246, 0)',
                      '0 0 30px 10px rgba(139, 92, 246, 0.3)',
                      '0 0 0 0 rgba(139, 92, 246, 0)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                />
                <div className="flex-1">
                  <motion.div 
                    className="h-3 bg-gray-800 rounded-full mb-2"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '100%' } : {}}
                    transition={{ delay: 1.5, duration: 0.6 }}
                  />
                  <motion.div 
                    className="h-2 bg-gray-400 rounded-full w-2/3"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '66%' } : {}}
                    transition={{ delay: 1.7, duration: 0.6 }}
                  />
                </div>
              </div>
              
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.9 }}
              >
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+33 6 12 34 56 78</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>contact@exemple.fr</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Existing contacts */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="p-4 bg-gray-50 rounded-xl flex items-center gap-3 opacity-40"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 0.4, x: 0 } : {}}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-gray-300 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-300 rounded-full w-1/2" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Physical card with NFC - RESPONSIVE */}
      <motion.div
        className="premium-card absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 w-60 md:w-72 h-36 md:h-44 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -100, rotate: -20, opacity: 0 }}
      >
        {/* Card gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800" />
        
        {/* Holographic overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Card content */}
        <div className="relative h-full p-6 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <motion.div 
              className="text-2xl font-bold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Bööh
            </motion.div>
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          </div>
          
          <div>
            <div className="text-lg font-medium mb-1">Jean Dupont</div>
            <div className="text-sm opacity-80">Designer • Paris</div>
          </div>
          
          {/* NFC chip */}
          <motion.div 
            className="absolute bottom-6 right-6 w-12 h-12 border-2 border-white/50 rounded-lg"
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(255, 255, 255, 0)',
                '0 0 20px 5px rgba(255, 255, 255, 0.4)',
                '0 0 0 0 rgba(255, 255, 255, 0)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* NFC waves */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="premium-wave absolute top-28 left-1/2 -translate-x-1/2 border-2 border-purple-500 rounded-full pointer-events-none"
          style={{ 
            width: `${80 + i * 20}px`, 
            height: `${80 + i * 20}px`,
            opacity: 0 
          }}
        />
      ))}
    </motion.div>
  );
};

// 2. OCR - Scan animation premium avec morphing RESPONSIVE
export const PremiumOCRIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]), { stiffness: 100, damping: 30 });

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center py-8 md:py-12 px-4 min-h-[500px] md:min-h-[600px]"
      style={{ scale }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-3xl"
        animate={isInView ? { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] } : {}}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-12 lg:gap-16 w-full max-w-5xl">
        {/* Physical card RESPONSIVE */}
        <motion.div
          className="w-full md:w-72 lg:w-80 h-44 md:h-48 lg:h-52 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl relative flex-shrink-0"
          initial={{ x: -50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white" />
          
          {/* Card content RESPONSIVE */}
          <div className="relative p-4 md:p-6 lg:p-8 h-full flex flex-col justify-between">
            <div className="text-xs md:text-sm text-gray-500 font-mono">CARTE DE VISITE</div>
            
            <div>
              <div className="text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2">Sophie Martin</div>
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-gray-600">
                <div>+33 6 45 67 89 01</div>
                <div className="truncate">sophie.martin@studio.fr</div>
                <div>Design Studio • Lyon</div>
              </div>
            </div>
          </div>
          
          {/* Scan grid overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0"
            initial={{ y: '-100%' }}
            animate={isInView ? { y: '200%' } : {}}
            transition={{ delay: 1.5, duration: 1.5, ease: 'linear' }}
          />
          
          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-1 bg-blue-500 shadow-lg shadow-blue-500/50"
            style={{ top: '50%' }}
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: [0, 1, 0] } : {}}
            transition={{ delay: 1.5, duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Arrow with particles RESPONSIVE */}
        <motion.div
          className="relative flex-shrink-0"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 3, type: 'spring' }}
        >
          <svg width="60" height="60" viewBox="0 0 80 80" className="text-blue-500 md:w-20 md:h-20 rotate-90 md:rotate-0">
            <motion.path
              d="M 10 40 L 60 40"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 3, duration: 0.8 }}
            />
            <motion.path
              d="M 50 30 L 60 40 L 50 50"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 3.5, duration: 0.5 }}
            />
          </svg>
          
          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              style={{
                left: '50%',
                top: '50%'
              }}
              animate={isInView ? {
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40],
                opacity: [1, 0],
                scale: [1, 0]
              } : {}}
              transition={{
                delay: 3.5 + i * 0.1,
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          ))}
        </motion.div>

        {/* Data panel RESPONSIVE */}
        <motion.div
          className="w-full md:w-72 lg:w-80 space-y-3 md:space-y-4"
          initial={{ x: 50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 3.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-wider mb-4 md:mb-6">
            Données extraites • 2.3s
          </div>
          
          {[
            { label: 'Nom', value: 'Sophie Martin', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { label: 'Téléphone', value: '+33 6 45 67 89 01', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
            { label: 'Email', value: 'sophie.martin@studio.fr', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { label: 'Entreprise', value: 'Design Studio • Lyon', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
          ].map((field, i) => (
            <motion.div
              key={i}
              className="group p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg md:rounded-xl border border-blue-200 hover:border-blue-400 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 4 + i * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.02, x: 5 }}
            >
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={field.icon} />
                </svg>
                <span className="text-[10px] md:text-xs font-mono text-gray-500 uppercase">{field.label}</span>
              </div>
              <motion.div 
                className="text-xs md:text-sm font-medium text-gray-900 break-words"
                initial={{ width: 0, opacity: 0 }}
                animate={isInView ? { width: 'auto', opacity: 1 } : {}}
                transition={{ delay: 4.2 + i * 0.15, duration: 0.6 }}
              >
                {field.value}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

// 3. Agenda - Calendar interface premium
export const PremiumAgendaIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]), { stiffness: 100, damping: 30 });

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center min-h-[600px]"
      style={{ scale }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-green-500/20 via-transparent to-transparent blur-3xl"
        animate={isInView ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Mac-style window */}
      <motion.div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white"
        initial={{ y: 50, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Window header */}
        <div className="h-12 bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-200 flex items-center px-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center text-sm font-medium text-gray-600">
            Agenda Bööh
          </div>
        </div>

        {/* Calendar content */}
        <div className="p-8">
          {/* Header avec mois */}
          <div className="flex items-center justify-between mb-8">
            <motion.h3 
              className="text-3xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              Juin 2025
            </motion.h3>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
              <motion.div
                key={i}
                className="text-center text-sm font-medium text-gray-400"
                initial={{ opacity: 0, y: -10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                {day}
              </motion.div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const isBooked = [10, 17, 24].includes(i);
              const isToday = i === 15;
              
              return (
                <motion.div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isBooked 
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg' 
                      : isToday
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ 
                    delay: 0.6 + i * 0.02,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                >
                  {i + 1}
                  {isBooked && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(139, 92, 246, 0)',
                          '0 0 20px 5px rgba(139, 92, 246, 0.4)',
                          '0 0 0 0 rgba(139, 92, 246, 0)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Event card */}
          <motion.div
            className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 text-center">
                <div className="text-3xl font-bold">15</div>
                <div className="text-xs text-gray-500">JUN</div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold mb-1">Réunion client • 14:00</div>
                <div className="text-sm text-gray-600 mb-3">Présentation portfolio</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-500" />
                  <span className="text-sm text-gray-600">Sophie Martin</span>
                </div>
              </div>
              <motion.button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Confirmer
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 4. Stock - Dashboard avec graphiques premium
export const PremiumStockIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center min-h-[600px]"
    >
      {/* Dashboard-style panel */}
      <motion.div
        className="w-full max-w-2xl p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h3 
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              Gestion de stock
            </motion.h3>
            <motion.p 
              className="text-gray-400"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              Mise à jour en temps réel
            </motion.p>
          </div>
          <motion.div
            className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-mono"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.6, type: 'spring' }}
          >
            ● Live
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <svg className="w-full h-64" viewBox="0 0 600 200">
            {/* Grid */}
            {[0, 50, 100, 150, 200].map((y, i) => (
              <motion.line
                key={i}
                x1="0"
                y1={y}
                x2="600"
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
              />
            ))}

            {/* Bars */}
            {[
              { x: 50, h: 120, color: '#10b981' },
              { x: 150, h: 160, color: '#3b82f6' },
              { x: 250, h: 100, color: '#8b5cf6' },
              { x: 350, h: 180, color: '#10b981' },
              { x: 450, h: 140, color: '#3b82f6' },
              { x: 550, h: 80, color: '#ef4444' }
            ].map((bar, i) => (
              <motion.rect
                key={i}
                x={bar.x - 25}
                y={200 - bar.h}
                width="50"
                height={bar.h}
                fill={`url(#gradient-${i})`}
                initial={{ height: 0, y: 200 }}
                animate={isInView ? { height: bar.h, y: 200 - bar.h } : {}}
                transition={{ delay: 1.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
              />
            ))}

            {/* Gradients */}
            <defs>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={['#10b981', '#3b82f6', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444'][i]} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={['#10b981', '#3b82f6', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444'][i]} stopOpacity="0.2" />
                </linearGradient>
              ))}
            </defs>

            {/* Trend line */}
            <motion.path
              d="M 75 80 Q 175 40, 275 100 T 475 60"
              stroke="#fff"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 2.5, duration: 1.5 }}
            />
          </svg>
        </motion.div>

        {/* Products list */}
        <div className="space-y-3">
          {[
            { name: 'Produit A', stock: 127, trend: '+12%', color: 'green' },
            { name: 'Produit B', stock: 89, trend: '+8%', color: 'green' },
            { name: 'Produit C', stock: 15, trend: '-24%', color: 'red', alert: true }
          ].map((product, i) => (
            <motion.div
              key={i}
              className={`p-4 rounded-xl flex items-center justify-between ${
                product.alert 
                  ? 'bg-red-500/10 border-2 border-red-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 3 + i * 0.15 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className={`text-sm ${product.alert ? 'text-red-400' : 'text-gray-400'}`}>
                    {product.stock} unités {product.alert && '• Alerte stock bas'}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-bold ${product.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
                {product.trend}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// 5. Map - 3D map avec pins animés
export const PremiumMapIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  
  const rotateY = useTransform(scrollYProgress, [0, 1], [10, -10]);

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center min-h-[600px]"
      style={{ perspective: 1000 }}
    >
      {/* Map container with 3D effect */}
      <motion.div
        className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
        animate={isInView ? { scale: 1, opacity: 1, rotateX: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Map background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900" />
        
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {[...Array(10)].map((_, i) => (
            <motion.line
              key={`h-${i}`}
              x1="0"
              y1={i * 10 + '%'}
              x2="100%"
              y2={i * 10 + '%'}
              stroke="white"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
            />
          ))}
          {[...Array(16)].map((_, i) => (
            <motion.line
              key={`v-${i}`}
              x1={i * 6.25 + '%'}
              y1="0"
              x2={i * 6.25 + '%'}
              y2="100%"
              stroke="white"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.03, duration: 0.8 }}
            />
          ))}
        </svg>

        {/* Location pins with pulse effect */}
        {[
          { x: '25%', y: '30%', name: 'Abidjan', count: 127 },
          { x: '60%', y: '50%', name: 'Dakar', count: 89 },
          { x: '45%', y: '70%', name: 'Libreville', count: 64 },
          { x: '75%', y: '40%', name: 'Lagos', count: 203 }
        ].map((location, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: location.x, top: location.y, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, y: -50 }}
            animate={isInView ? { scale: 1, y: 0 } : {}}
            transition={{ delay: 1.5 + i * 0.2, type: 'spring', stiffness: 200 }}
          >
            {/* Pulse rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 border-2 border-white rounded-full"
                animate={{
                  scale: [1, 2.5, 2.5],
                  opacity: [0.6, 0, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: ring * 0.4 + i * 0.2
                }}
              />
            ))}

            {/* Pin */}
            <motion.div
              className="relative w-12 h-12"
              whileHover={{ scale: 1.2 }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="drop-shadow-lg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              
              {/* Info card on hover */}
              <motion.div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 bg-white rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100"
                initial={{ y: -10, opacity: 0 }}
                whileHover={{ y: 0, opacity: 1 }}
              >
                <div className="text-sm font-bold text-gray-900">{location.name}</div>
                <div className="text-xs text-gray-600">{location.count} professionnels</div>
              </motion.div>
            </motion.div>

            {/* Count badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 1.8 + i * 0.2, type: 'spring' }}
            >
              {location.count}
            </motion.div>
          </motion.div>
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {[[0, 1], [1, 2], [2, 3]].map(([from, to], i) => {
            const locations = [
              { x: '25%', y: '30%' },
              { x: '60%', y: '50%' },
              { x: '45%', y: '70%' },
              { x: '75%', y: '40%' }
            ];
            return (
              <motion.line
                key={i}
                x1={locations[from].x}
                y1={locations[from].y}
                x2={locations[to].x}
                y2={locations[to].y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ delay: 2.5 + i * 0.3, duration: 1 }}
              />
            );
          })}
        </svg>
      </motion.div>
    </motion.div>
  );
};

// 6. Payment - Multiple providers interface
export const PremiumPaymentIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const providers = [
    { name: 'Moov Money', color: 'from-blue-500 to-blue-600', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { name: 'Wave', color: 'from-green-500 to-green-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Orange Money', color: 'from-orange-500 to-orange-600', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
    { name: 'Visa/Mastercard', color: 'from-purple-500 to-purple-600', icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' }
  ];

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center min-h-[600px]"
    >
      <div className="relative flex items-center gap-12">
        {/* Central payment hub */}
        <motion.div
          className="relative w-80 h-96 rounded-3xl bg-gradient-to-br from-gray-900 to-black p-8 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative h-full flex flex-col">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white text-2xl font-bold mb-2">Paiement</h3>
              <p className="text-gray-400 text-sm">Choisissez votre méthode</p>
            </motion.div>

            {/* Amount */}
            <motion.div
              className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              <div className="text-gray-400 text-sm mb-2">Montant</div>
              <motion.div 
                className="text-white text-4xl font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                12 500 <span className="text-2xl">FCFA</span>
              </motion.div>
            </motion.div>

            {/* Payment methods */}
            <div className="space-y-3 flex-1">
              {['Moov Money', 'Wave', 'Carte bancaire'].map((method, i) => (
                <motion.button
                  key={i}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/30 text-white text-left transition-all duration-300 flex items-center justify-between group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <span>{method}</span>
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                </motion.button>
              ))}
            </div>

            {/* Pay button */}
            <motion.button
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Payer maintenant
            </motion.button>
          </div>
        </motion.div>

        {/* Provider cards floating around */}
        {providers.map((provider, i) => {
          const positions = [
            { x: 350, y: -120, rotate: -10 },
            { x: 350, y: 0, rotate: 5 },
            { x: 350, y: 120, rotate: -5 },
            { x: 350, y: 240, rotate: 10 }
          ];
          
          return (
            <motion.div
              key={i}
              className="absolute w-48 h-28 rounded-2xl shadow-xl overflow-hidden"
              style={{
                transform: `translate(${positions[i].x}px, ${positions[i].y}px) rotate(${positions[i].rotate}deg)`
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 1.5 + i * 0.15, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${provider.color}`} />
              <div className="relative h-full p-4 flex flex-col justify-between text-white">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d={provider.icon} />
                </svg>
                <div className="font-bold text-sm">{provider.name}</div>
              </div>
              
              {/* Connection line */}
              <motion.div
                className="absolute top-1/2 right-full w-32 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 1.8 + i * 0.15, duration: 0.6 }}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// 7. Portfolio - Grid with hover effects RESPONSIVE
export const PremiumPortfolioIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center py-8 md:py-12 px-4 min-h-[500px] md:min-h-[600px]"
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl"
        animate={isInView ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Portfolio grid RESPONSIVE */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 lg:gap-4 w-full max-w-2xl">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="group aspect-square rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden shadow-xl relative cursor-pointer"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={isInView ? { scale: 1, rotate: 0, opacity: 1 } : {}}
            transition={{ 
              delay: 0.3 + i * 0.08,
              type: 'spring',
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.15, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              ['from-purple-400 to-pink-400', 'from-blue-400 to-cyan-400', 'from-green-400 to-emerald-400', 
               'from-yellow-400 to-orange-400', 'from-red-400 to-rose-400', 'from-indigo-400 to-purple-400',
               'from-teal-400 to-green-400', 'from-orange-400 to-red-400', 'from-pink-400 to-purple-400'][i]
            }`} />
            
            {/* Image placeholder with pattern */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <pattern id={`pattern-${i}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.5" />
                </pattern>
                <rect width="100" height="100" fill={`url(#pattern-${i})`} />
              </svg>
            </div>

            {/* Overlay on hover RESPONSIVE */}
            <motion.div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-500 flex items-center justify-center p-2"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <motion.div
                className="text-white text-center opacity-0 group-hover:opacity-100"
                initial={{ y: 20 }}
                whileHover={{ y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-sm md:text-base lg:text-lg font-bold mb-1 md:mb-2">Projet {i + 1}</div>
                <motion.button
                  className="px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 bg-white/20 backdrop-blur-sm rounded-md md:rounded-lg text-xs md:text-sm"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Corner badge RESPONSIVE */}
            {i === 4 && (
              <motion.div
                className="absolute top-1 md:top-2 right-1 md:right-2 px-1.5 md:px-2 py-0.5 md:py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-bold text-gray-900"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: 1.5, type: 'spring' }}
              >
                HD
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Floating badges RESPONSIVE */}
      <motion.div
        className="absolute -top-3 md:-top-4 right-0 md:right-4 px-3 md:px-4 py-1 md:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs md:text-sm font-bold shadow-lg"
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { 
          opacity: 1, 
          x: 0,
          y: [0, -10, 0]
        } : {}}
        transition={{ 
          opacity: { delay: 1.5 },
          x: { delay: 1.5 },
          y: { duration: 2, repeat: Infinity, delay: 2 }
        }}
      >
        +25 Projets
      </motion.div>
    </motion.div>
  );
};

// 8. DRM - Security visualization RESPONSIVE
export const PremiumDRMIllustration = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full flex items-center justify-center py-8 md:py-12 px-4 min-h-[500px] md:min-h-[600px]"
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl"
        animate={isInView ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16 w-full max-w-4xl">
        {/* Document RESPONSIVE */}
        <motion.div
          className="w-full md:w-60 lg:w-72 h-72 md:h-80 lg:h-96 rounded-xl md:rounded-2xl bg-white shadow-2xl p-6 md:p-8 relative overflow-hidden flex-shrink-0"
          initial={{ x: -50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Document content RESPONSIVE */}
          <div className="space-y-3 md:space-y-4">
            {[1, 0.9, 1, 0.7, 1, 0.8].map((w, i) => (
              <motion.div
                key={i}
                className="h-2 md:h-3 bg-gray-300 rounded-full"
                style={{ width: `${w * 100}%` }}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${w * 100}%` } : {}}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              />
            ))}
          </div>

          {/* Watermark overlay RESPONSIVE */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-3xl md:text-5xl lg:text-6xl font-bold text-purple-500/10 rotate-45"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.1 } : {}}
            transition={{ delay: 1 }}
          >
            PROTECTED
          </motion.div>

          {/* Lock animation overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent"
            initial={{ y: '100%' }}
            animate={isInView ? { y: '0%' } : {}}
            transition={{ delay: 1.5, duration: 1 }}
          />
        </motion.div>

        {/* Lock icon with particles RESPONSIVE */}
        <motion.div
          className="relative flex-shrink-0"
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: 2, type: 'spring', stiffness: 200 }}
        >
          <motion.svg
            className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-purple-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            animate={{ 
              filter: [
                'drop-shadow(0 0 0px rgba(139, 92, 246, 0))',
                'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6))',
                'drop-shadow(0 0 0px rgba(139, 92, 246, 0))'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277c-.595-.347-1-.984-1-1.723 0-1.103.897-2 2-2s2 .897 2 2c0 .738-.404 1.376-1 1.723z"/>
          </motion.svg>

          {/* Encryption particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-500 rounded-full"
              style={{
                left: '50%',
                top: '50%'
              }}
              animate={isInView ? {
                x: [0, Math.cos(i * 30 * Math.PI / 180) * 80],
                y: [0, Math.sin(i * 30 * Math.PI / 180) * 80],
                opacity: [1, 0],
                scale: [1, 0]
              } : {}}
              transition={{
                delay: 2.5 + i * 0.05,
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          ))}
        </motion.div>

        {/* Security badge RESPONSIVE */}
        <motion.div
          className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 3 }}
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-xs md:text-sm whitespace-nowrap">256-bit Encryption</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Export all
export default {
  PremiumCRMIllustration,
  PremiumOCRIllustration,
  PremiumAgendaIllustration,
  PremiumStockIllustration,
  PremiumMapIllustration,
  PremiumPaymentIllustration,
  PremiumPortfolioIllustration,
  PremiumDRMIllustration
};

