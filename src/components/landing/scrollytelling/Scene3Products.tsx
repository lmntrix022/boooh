import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Scène 3 : L'Expérience Produit Interactive
 * Chaque module (CRM, Portfolio, DRM, E-commerce) a son mini-scrollytelling
 */
const Scene3Products: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
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

  // Les 4 modules avec leurs animations
  const modules = [
    {
      id: 'crm',
      name: 'CRM avec IA',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      title: 'Scannez. Mémorisez. Convertissez.',
      features: [
        { icon: '📸', text: 'Scan OCR instantané', progress: 0.05 },
        { icon: '🤖', text: 'Enrichissement IA', progress: 0.10 },
        { icon: '📊', text: 'Segmentation RFM', progress: 0.15 },
      ],
      demoProgress: 0.0
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      title: 'Montrez. Vendez. Gagnez.',
      features: [
        { icon: '🖼️', text: 'Galerie responsive', progress: 0.25 },
        { icon: '💬', text: 'Devis automatiques', progress: 0.30 },
        { icon: '💳', text: 'Paiement Mobile Money', progress: 0.35 },
      ],
      demoProgress: 0.2
    },
    {
      id: 'drm',
      name: 'Protection DRM',
      icon: '🔒',
      color: 'from-green-500 to-emerald-500',
      title: 'Protégez. Tracez. Contrôlez.',
      features: [
        { icon: '🔐', text: 'Chiffrement 256-bit', progress: 0.50 },
        { icon: '🏷️', text: 'Filigrane dynamique', progress: 0.55 },
        { icon: '📱', text: 'Limite d\'appareils', progress: 0.60 },
      ],
      demoProgress: 0.45
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      icon: '🛍️',
      color: 'from-orange-500 to-red-500',
      title: 'Vendez. Encaissez. Livrez.',
      features: [
        { icon: '🏪', text: 'Boutique en ligne', progress: 0.70 },
        { icon: '📦', text: 'Gestion du stock', progress: 0.75 },
        { icon: '💰', text: 'Paiement instantané', progress: 0.80 },
      ],
      demoProgress: 0.65
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative bg-black text-white"
    >
      {/* Titre de section */}
      <div className="min-h-screen flex items-center justify-center border-b border-white/5">
        <div 
          className="text-center px-4"
          style={{
            opacity: Math.min(1, scrollProgress * 3),
            transform: `translateY(${(1 - Math.min(1, scrollProgress * 3)) * 50}px)`,
            transition: 'all 0.8s ease-out'
          }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            Une Infrastructure.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Quatre Superpowers.
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Chaque module est conçu pour transformer votre façon de travailler
          </p>
        </div>
      </div>

      {/* Les 4 modules */}
      {modules.map((module, index) => {
        const moduleProgress = Math.max(0, Math.min(1, (scrollProgress - module.demoProgress) * 5));
        const isActive = scrollProgress > module.demoProgress && scrollProgress < (module.demoProgress + 0.2);
        
        return (
          <div 
            key={module.id}
            className="min-h-screen flex items-center justify-center relative border-b border-white/5"
          >
            {/* Background gradient animé */}
            <div 
              className={`absolute inset-0 opacity-${isActive ? '20' : '0'} transition-opacity duration-1000`}
              style={{
                background: `radial-gradient(circle at 50% 50%, ${module.color.split(' ')[1].replace('to-', '')} 0%, transparent 70%)`,
              }}
            />

            <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
              {/* Partie gauche : Infos */}
              <div
                style={{
                  opacity: moduleProgress,
                  transform: `translateX(${(1 - moduleProgress) * -50}px)`,
                  transition: 'all 0.8s ease-out'
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-3xl shadow-2xl`}>
                    {module.icon}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold">{module.name}</h3>
                </div>

                <p className="text-2xl md:text-3xl font-light mb-8 text-gray-300">
                  {module.title}
                </p>

                {/* Features avec animation en cascade */}
                <div className="space-y-4">
                  {module.features.map((feature, fIndex) => {
                    const featureProgress = Math.max(0, Math.min(1, (scrollProgress - feature.progress) * 10));
                    
                    return (
                      <div
                        key={fIndex}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                        style={{
                          opacity: featureProgress,
                          transform: `translateX(${(1 - featureProgress) * -30}px)`,
                          transition: 'all 0.6s ease-out',
                          transitionDelay: `${fIndex * 0.1}s`
                        }}
                      >
                        <div className="text-3xl">{feature.icon}</div>
                        <p className="text-lg font-medium">{feature.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <button
                  className={`mt-8 px-6 py-3 rounded-full bg-gradient-to-r ${module.color} font-semibold text-white hover:scale-105 transition-transform duration-300 shadow-xl`}
                  onClick={() => navigate('/auth')}
                  style={{
                    opacity: moduleProgress,
                    transform: `scale(${moduleProgress})`,
                    transition: 'all 0.8s ease-out',
                    transitionDelay: '0.3s'
                  }}
                >
                  Essayer {module.name}
                </button>
              </div>

              {/* Partie droite : Visuel/Demo */}
              <div
                className="relative"
                style={{
                  opacity: moduleProgress,
                  transform: `translateX(${(1 - moduleProgress) * 50}px) rotateY(${(1 - moduleProgress) * -15}deg)`,
                  transition: 'all 0.8s ease-out',
                  perspective: '1000px'
                }}
              >
                {/* Mockup device */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${module.color} p-1 shadow-2xl`}>
                  <div className="w-full h-full rounded-xl bg-black/90 backdrop-blur-xl p-6 overflow-hidden">
                    {/* Contenu simulé du module */}
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-white/10 rounded-lg animate-pulse"
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            opacity: 0.3 + (i * 0.15)
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Badge "Live" */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium">Live</span>
                    </div>
                  </div>
                </div>

                {/* Effet de glow */}
                <div 
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${module.color} blur-3xl opacity-30 -z-10`}
                  style={{
                    transform: 'scale(0.9)',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default Scene3Products;

