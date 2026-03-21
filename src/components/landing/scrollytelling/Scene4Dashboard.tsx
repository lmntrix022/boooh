import React, { useEffect, useRef, useState } from 'react';

/**
 * Scène 4 : Le Dashboard Symphonique
 * Tous les modules volent vers le centre et s'assemblent comme un puzzle
 */
const Scene4Dashboard: React.FC = () => {
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

  // Les 4 pièces du puzzle
  const pieces = [
    { id: 'crm', name: 'CRM', icon: '👥', color: 'bg-blue-500', position: { x: -200, y: -200 } },
    { id: 'portfolio', name: 'Portfolio', icon: '🎨', color: 'bg-purple-500', position: { x: 200, y: -200 } },
    { id: 'drm', name: 'DRM', icon: '🔒', color: 'bg-green-500', position: { x: -200, y: 200 } },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', color: 'bg-orange-500', position: { x: 200, y: 200 } },
  ];

  // Phase d'assemblage (0-0.5 du scroll)
  const assemblyProgress = Math.min(1, scrollProgress * 2);
  
  // Phase de révélation du dashboard (0.5-1 du scroll)
  const dashboardReveal = Math.max(0, (scrollProgress - 0.5) * 2);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden"
    >
      {/* Effet de grille en arrière-plan */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: scrollProgress * 0.2
        }}
      />

      {/* Lumière centrale qui pulse */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, ${assemblyProgress * 0.3}) 0%, transparent 60%)`,
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-4">
        {/* Texte d'introduction */}
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 text-center z-10"
          style={{
            opacity: scrollProgress < 0.3 ? 1 : 0,
            transition: 'opacity 0.6s ease-out'
          }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Tous vos outils.
          </h2>
          <p className="text-xl text-gray-400">
            Enfin réunis.
          </p>
        </div>

        {/* Zone d'assemblage */}
        <div className="relative h-screen flex items-center justify-center">
          {/* Les 4 pièces qui convergent */}
          {pieces.map((piece, index) => {
            const targetX = assemblyProgress * piece.position.x;
            const targetY = assemblyProgress * piece.position.y;
            const finalX = (index % 2 === 0 ? -1 : 1) * (150 - assemblyProgress * 150);
            const finalY = (index < 2 ? -1 : 1) * (150 - assemblyProgress * 150);

            return (
              <div
                key={piece.id}
                className={`absolute w-48 h-48 md:w-64 md:h-64 ${piece.color} rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl transition-all duration-1000`}
                style={{
                  transform: `translate(${-finalX}px, ${-finalY}px) scale(${1 - assemblyProgress * 0.3}) rotate(${(1 - assemblyProgress) * (index * 90)}deg)`,
                  opacity: 0.8 + assemblyProgress * 0.2,
                  zIndex: 10 - index,
                }}
              >
                <div className="text-6xl mb-4">{piece.icon}</div>
                <h3 className="text-xl font-bold">{piece.name}</h3>
                
                {/* Effet de connexion */}
                {assemblyProgress > 0.7 && (
                  <div 
                    className="absolute inset-0 border-2 border-purple-400/50 rounded-2xl"
                    style={{
                      animation: 'pulse 2s ease-in-out infinite',
                      animationDelay: `${index * 0.2}s`
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Dashboard central qui apparaît */}
          {dashboardReveal > 0 && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: dashboardReveal,
                transform: `scale(${0.5 + dashboardReveal * 0.5})`,
                transition: 'all 0.8s ease-out'
              }}
            >
              <div className="relative w-full max-w-5xl aspect-video rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden">
                {/* Header du dashboard */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-xl">ö</span>
                    </div>
                    <div>
                      <h3 className="font-bold">Dashboard Booh</h3>
                      <p className="text-xs text-gray-400">Tout en un coup d'œil</p>
                    </div>
                  </div>
                  
                  {/* Indicateurs */}
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                </div>

                {/* Grille du dashboard */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  {pieces.map((piece, index) => (
                    <div
                      key={piece.id}
                      className={`${piece.color} rounded-xl p-4 bg-opacity-20 border border-white/10`}
                      style={{
                        animation: `fadeInUp 0.6s ease-out forwards`,
                        animationDelay: `${index * 0.2}s`,
                        opacity: 0
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{piece.icon}</div>
                        <h4 className="font-semibold">{piece.name}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-white/20 rounded-full" />
                        <div className="h-2 bg-white/20 rounded-full w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Effet de scan */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  style={{
                    transform: `translateX(${-100 + dashboardReveal * 200}%)`,
                    transition: 'transform 2s ease-out'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Texte final */}
        {dashboardReveal > 0.5 && (
          <div 
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
            style={{
              opacity: (dashboardReveal - 0.5) * 2,
              transform: `translateY(${(1 - (dashboardReveal - 0.5) * 2) * 30}px)`,
              transition: 'all 0.8s ease-out'
            }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Dans une interface.
            </h3>
            <p className="text-xl text-gray-400">
              Qui respire.
            </p>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Scene4Dashboard;

