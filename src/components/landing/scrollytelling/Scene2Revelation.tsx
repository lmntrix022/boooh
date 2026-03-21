import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Scène 2 : La Révélation
 * Technique : Zoom progressif + Rotation 3D + Morphing
 * Une carte physique se transforme en carte digitale puis se déplie en origami
 */
const Scene2Revelation: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const progress = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + rect.height)
      ));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Phases de l'animation
  const cardAppears = Math.min(1, scrollProgress * 2); // 0-0.5 scroll
  const cardTransforms = Math.max(0, Math.min(1, (scrollProgress - 0.3) * 2)); // 0.3-0.8 scroll
  const cardUnfolds = Math.max(0, Math.min(1, (scrollProgress - 0.6) * 2.5)); // 0.6-1 scroll

  // Rotation 3D de la carte
  const rotateY = cardTransforms * 180;
  const scale = 1 + (cardAppears * 0.5);

  // Les 4 modules qui apparaissent
  const modules = [
    { name: 'CRM', icon: '👥', color: 'from-blue-500 to-cyan-500', delay: 0 },
    { name: 'Portfolio', icon: '🎨', color: 'from-purple-500 to-pink-500', delay: 0.1 },
    { name: 'DRM', icon: '🔒', color: 'from-green-500 to-emerald-500', delay: 0.2 },
    { name: 'E-commerce', icon: '🛍️', color: 'from-orange-500 to-red-500', delay: 0.3 },
  ];

  const texts = [
    { text: "Et si une seule chose...", threshold: 0.2 },
    { text: "pouvait tout changer ?", threshold: 0.5 },
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-900/30 to-black text-white overflow-hidden"
    >
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: scrollProgress * (0.3 + Math.random() * 0.4)
            }}
          />
        ))}
      </div>
      
      {/* Effet de lumière centrale qui pulse */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, ${cardTransforms * 0.3}) 0%, transparent 60%)`,
          opacity: cardTransforms,
          transition: 'opacity 1s ease-out'
        }}
      />
      <div className="relative w-full max-w-6xl mx-auto px-4">
        {/* Textes qui apparaissent */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center space-y-4 z-10">
          {texts.map((item, index) => (
            <p
              key={index}
              className="text-3xl md:text-5xl font-bold"
              style={{
                opacity: scrollProgress > item.threshold ? 1 : 0,
                transform: scrollProgress > item.threshold ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out'
              }}
            >
              {item.text}
            </p>
          ))}
        </div>

        {/* Carte qui se transforme */}
        <div className="relative h-screen flex items-center justify-center">
          <div 
            className="relative"
            style={{
              perspective: '1000px',
              transform: `scale(${scale})`,
              transition: 'transform 0.8s ease-out'
            }}
          >
            {/* Carte physique (face avant) */}
            <div
              className={`relative w-80 h-48 rounded-xl shadow-2xl transition-all duration-1000 ${
                cardTransforms > 0.5 ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                transform: `rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full" />
                  <div className="text-xs text-gray-400">Carte Physique</div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Amara Design</h3>
                <p className="text-sm text-gray-400">Designer Freelance</p>
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p>+225 XX XX XX XX</p>
                  <p>amara@design.ci</p>
                </div>
              </div>
            </div>

            {/* Carte digitale (face arrière) */}
            <div
              className={`absolute top-0 left-0 w-80 h-48 rounded-xl shadow-2xl transition-all duration-1000 ${
                cardTransforms > 0.5 ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `rotateY(${rotateY + 180}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 relative overflow-hidden">
                {/* Effet de scan/digital */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    transform: `translateX(${cardTransforms * 200 - 100}%)`,
                    transition: 'transform 1s ease-out'
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">ö</span>
                    </div>
                    <div className="text-xs">Carte Digitale</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Amara Design</h3>
                  <p className="text-sm">Designer Freelance • Booh Verified ✓</p>
                  
                  {/* QR Code animé */}
                  <div className="mt-4 w-16 h-16 bg-white rounded-lg p-1">
                    <div 
                      className="w-full h-full bg-purple-600"
                      style={{
                        opacity: 0.5 + Math.sin(cardTransforms * Math.PI * 2) * 0.5
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Les 4 modules qui se déplient (origami) */}
          {cardUnfolds > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {modules.map((module, index) => {
                  const angle = (index * 90) - 45; // Position en croix
                  const distance = cardUnfolds * 300; // Distance du centre
                  const isVisible = cardUnfolds > module.delay;
                  
                  return (
                    <div
                      key={module.name}
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700`}
                      style={{
                        transform: isVisible 
                          ? `translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px) scale(1)`
                          : 'translate(0, 0) scale(0)',
                        opacity: isVisible ? 1 : 0,
                      }}
                    >
                      <div className={`w-32 h-32 bg-gradient-to-br ${module.color} rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl`}>
                        <div className="text-4xl mb-2">{module.icon}</div>
                        <p className="text-sm font-semibold text-center">{module.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Texte final */}
        {cardUnfolds > 0.8 && (
          <div 
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
            style={{
              opacity: (cardUnfolds - 0.8) * 5,
              transform: `translateY(${(1 - (cardUnfolds - 0.8) * 5) * 20}px)`
            }}
          >
            <p className="text-xl text-gray-300">
              Votre carte devient votre infrastructure complète
            </p>
          </div>
        )}
      </div>

      {/* Effet de lumière ambiante */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, ${cardTransforms * 0.2}) 0%, transparent 50%)`,
        }}
      />
    </section>
  );
};

export default Scene2Revelation;

