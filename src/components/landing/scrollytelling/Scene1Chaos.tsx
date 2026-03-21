import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Scène 1 : Le Chaos Actuel
 * Technique : Split Screen avec chaos grandissant à gauche vs calme à droite
 */
const Scene1Chaos: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculer la progression du scroll pour cette section (0 à 1)
      const progress = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + rect.height)
      ));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculer l'intensité du chaos (0 à 1)
  const chaosIntensity = Math.min(1, scrollProgress * 2);
  
  // Applications chaotiques qui se superposent
  const chaosApps = [
    { name: 'WhatsApp', color: 'bg-green-500', delay: 0 },
    { name: 'Excel', color: 'bg-emerald-600', delay: 0.1 },
    { name: 'PayPal', color: 'bg-blue-500', delay: 0.2 },
    { name: 'Gmail', color: 'bg-red-500', delay: 0.3 },
    { name: 'Dropbox', color: 'bg-blue-400', delay: 0.4 },
    { name: 'Wave', color: 'bg-purple-500', delay: 0.5 },
    { name: 'Calendar', color: 'bg-yellow-500', delay: 0.6 },
    { name: 'Notes', color: 'bg-orange-500', delay: 0.7 },
  ];

  // Textes qui apparaissent progressivement
  const texts = [
    { text: "Vous utilisez combien d'outils pour gérer votre business ?", threshold: 0.2 },
    { text: "10 ? 12 ?", threshold: 0.4 },
    { text: "C'est épuisant.", threshold: 0.6 },
    { text: "Et ça coûte cher.", threshold: 0.8 },
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden"
    >
      {/* Effet de grain/texture subtil */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        backgroundSize: '200px 200px'
      }} />
      
      {/* Gradient radial lumineux au centre */}
      <div className="absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
      }} />

      <div className="w-full h-screen flex relative z-10">
        {/* GAUCHE : Le Chaos */}
        <div className="w-1/2 relative overflow-hidden border-r border-white/5 backdrop-blur-sm">
          {/* Effet de vignette rouge */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-orange-900/10" />
          
          <div className="absolute inset-0 p-8 md:p-12">
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-red-400 tracking-tight">
                Avant Booh
              </h3>
              <div className="h-1 w-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6" />
            </div>
            
            {/* Applications qui se superposent progressivement */}
            <div className="relative h-full">
              {chaosApps.map((app, index) => {
                const isVisible = chaosIntensity > app.delay;
                const transform = isVisible 
                  ? `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) rotate(${Math.random() * 30 - 15}deg)`
                  : 'translate(0, 0) rotate(0deg)';
                
                return (
                  <div
                    key={app.name}
                    className={`absolute top-1/2 left-1/2 ${app.color} p-6 rounded-lg shadow-2xl transition-all duration-700`}
                    style={{
                      transform,
                      opacity: isVisible ? 0.8 : 0,
                      zIndex: index,
                    }}
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-lg mb-2" />
                    <p className="text-xs font-medium">{app.name}</p>
                  </div>
                );
              })}
              
              {/* Notifications chaotiques */}
              <div 
                className="absolute top-10 right-10 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                style={{
                  opacity: chaosIntensity > 0.5 ? 1 : 0,
                  transform: chaosIntensity > 0.5 ? 'translateY(0)' : 'translateY(-20px)',
                  transition: 'all 0.5s ease-out'
                }}
              >
                24 notifications non lues
              </div>
              
              {/* Effet de surcharge visuelle */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm"
                style={{
                  opacity: chaosIntensity * 0.5,
                }}
              />
            </div>
          </div>
        </div>

        {/* DROITE : Le Calme (Booh) */}
        <div className="w-1/2 relative flex items-center justify-center backdrop-blur-sm">
          {/* Effet de lumière douce */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
          
          <div className="text-center max-w-md p-8 md:p-12">
            {/* Logo Booh épuré avec glow */}
            <div 
              className="w-32 h-32 mx-auto mb-12 rounded-full border-4 border-purple-500/30 flex items-center justify-center relative"
              style={{
                boxShadow: `
                  0 0 60px rgba(139, 92, 246, ${scrollProgress * 0.4}),
                  0 0 100px rgba(139, 92, 246, ${scrollProgress * 0.2}),
                  inset 0 0 30px rgba(139, 92, 246, ${scrollProgress * 0.1})
                `,
                opacity: Math.min(1, scrollProgress * 2),
                transform: `scale(${Math.min(1, scrollProgress * 2)})`,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <span className="text-5xl font-light">ö</span>
              
              {/* Points tréma avec glow */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-4">
                <div 
                  className="w-4 h-4 rounded-full bg-purple-400"
                  style={{
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.8)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
                <div 
                  className="w-4 h-4 rounded-full bg-purple-400"
                  style={{
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.8)',
                    animation: 'pulse 2s ease-in-out infinite 0.5s'
                  }}
                />
              </div>
              
              {/* Cercle de lumière animé */}
              <div 
                className="absolute inset-0 rounded-full border border-purple-400/20"
                style={{
                  animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
            </div>

            {/* Interface minimaliste avec effet glassmorphism */}
            <div className="space-y-3 mb-10 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                opacity: Math.min(1, scrollProgress * 1.5),
                transition: 'opacity 0.6s ease-out'
              }}
            >
              <div className="h-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full w-3/4 mx-auto" />
              <div className="h-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full w-1/2 mx-auto" />
              <div className="h-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full w-2/3 mx-auto" />
            </div>

            <p className="text-lg font-light text-gray-300 tracking-wide">
              Interface épurée. <span className="text-purple-400 font-medium">Zéro chaos.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Textes qui apparaissent au centre avec effet de glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="text-center space-y-6 px-4">
          {texts.map((item, index) => (
            <div key={index} className="relative">
              <p
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white relative z-10"
                style={{
                  opacity: scrollProgress > item.threshold ? 1 : 0,
                  transform: scrollProgress > item.threshold ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: `${index * 0.15}s`,
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }}
              >
                {item.text}
              </p>
              {/* Glow effect derrière le texte */}
              <div 
                className="absolute inset-0 blur-2xl"
                style={{
                  opacity: scrollProgress > item.threshold ? 0.3 : 0,
                  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                  transform: 'scale(1.2)',
                  transition: 'opacity 0.8s ease-out',
                  transitionDelay: `${index * 0.15 + 0.2}s`
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicateur de scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
};

export default Scene1Chaos;

