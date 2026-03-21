import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Scène 5 : L'Appel à l'Action Immersif
 * Full-screen takeover avec formulaire d'inscription minimaliste
 */
const Scene5CTA: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [email, setEmail] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth', { state: { email } });
  };

  // Effet de zoom et de focus progressif
  const zoomProgress = Math.min(1, scrollProgress * 1.5);
  const focusProgress = Math.max(0, (scrollProgress - 0.4) * 1.5);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden"
    >
      {/* Background avec effet de profondeur */}
      <div className="absolute inset-0">
        {/* Orbes animés en arrière-plan */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
          style={{
            transform: `scale(${1 + scrollProgress * 0.5})`,
            opacity: scrollProgress * 0.6,
            transition: 'all 1s ease-out'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
          style={{
            transform: `scale(${1 + scrollProgress * 0.5})`,
            opacity: scrollProgress * 0.6,
            transition: 'all 1s ease-out',
            transitionDelay: '0.2s'
          }}
        />
        
        {/* Grille qui disparaît progressivement */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            opacity: (1 - scrollProgress) * 0.3,
            transform: `scale(${1 + scrollProgress * 0.5})`,
            transition: 'all 1s ease-out'
          }}
        />
      </div>

      {/* Contenu principal */}
      <div 
        className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        style={{
          transform: `scale(${0.9 + zoomProgress * 0.1})`,
          opacity: zoomProgress,
          transition: 'all 0.8s ease-out'
        }}
      >
        {/* Titre principal */}
        <div 
          className="mb-12"
          style={{
            transform: `translateY(${(1 - zoomProgress) * 50}px)`,
            opacity: zoomProgress,
            transition: 'all 0.8s ease-out'
          }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Votre tour.
          </h2>
          <div className="h-2 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-8" />
        </div>

        {/* Sous-titre */}
        <p 
          className="text-2xl md:text-3xl lg:text-4xl text-gray-300 mb-4 font-light"
          style={{
            transform: `translateY(${(1 - zoomProgress) * 30}px)`,
            opacity: zoomProgress,
            transition: 'all 0.8s ease-out',
            transitionDelay: '0.1s'
          }}
        >
          45 secondes.
        </p>
        <p 
          className="text-xl md:text-2xl lg:text-3xl text-gray-400 mb-16 font-light"
          style={{
            transform: `translateY(${(1 - zoomProgress) * 30}px)`,
            opacity: zoomProgress,
            transition: 'all 0.8s ease-out',
            transitionDelay: '0.2s'
          }}
        >
          Une vie professionnelle transformée.
        </p>

        {/* Formulaire d'inscription */}
        <div 
          className="max-w-2xl mx-auto"
          style={{
            transform: `translateY(${(1 - focusProgress) * 40}px) scale(${0.95 + focusProgress * 0.05})`,
            opacity: focusProgress,
            transition: 'all 0.8s ease-out',
            transitionDelay: '0.3s'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input email avec effet glassmorphism */}
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-8 py-5 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder-gray-400 text-lg font-medium focus:outline-none focus:border-purple-500 transition-all duration-300 group-hover:bg-white/15"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              />
              {/* Effet de glow au focus */}
              <div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-500 -z-10"
              />
            </div>

            {/* Bouton CTA principal */}
            <button
              type="submit"
              className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative z-10">Commencer Gratuitement</span>
            </button>

            {/* Informations complémentaires */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gratuit pour toujours</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>Configuration en 45s</span>
              </div>
            </div>
          </form>

          {/* Trust badges */}
          <div 
            className="mt-12 flex flex-wrap items-center justify-center gap-6 opacity-60"
            style={{
              transform: `translateY(${(1 - focusProgress) * 20}px)`,
              opacity: focusProgress * 0.6,
              transition: 'all 0.8s ease-out',
              transitionDelay: '0.5s'
            }}
          >
            <div className="text-xs text-gray-500">Trusted by:</div>
            <div className="flex gap-6">
              <div className="text-gray-600 font-semibold">10 000+ professionnels</div>
              <div className="text-gray-600">•</div>
              <div className="text-gray-600 font-semibold">50+ pays</div>
              <div className="text-gray-600">•</div>
              <div className="text-gray-600 font-semibold">2M$+ traités</div>
            </div>
          </div>
        </div>

        {/* Alternative CTA */}
        <p 
          className="mt-12 text-gray-500 text-sm"
          style={{
            opacity: focusProgress,
            transition: 'opacity 0.8s ease-out',
            transitionDelay: '0.6s'
          }}
        >
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-purple-400 hover:text-purple-300 underline transition-colors"
          >
            Se connecter
          </button>
        </p>
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: scrollProgress * (0.2 + Math.random() * 0.3)
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </section>
  );
};

export default Scene5CTA;

