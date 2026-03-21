import React, { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, QrCode, Calendar, Package, 
  BarChart, Shield, Sparkles, Rocket, Users, ChevronDown 
} from "lucide-react";
import { motion } from "framer-motion";
import { useMobileOptimizer } from "@/components/utils/MobileOptimizer";

const GlitchText = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block">
      <span className="relative z-10 bg-clip-text text-blue-600" 
            style={{animation: "gradient-x 3s ease infinite"}}>
        {text}
      </span>
      {/* Glitch layers */}
      <span className="absolute top-0 left-0 z-0 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 glitch-layer-1" 
            style={{animation: "glitch-anim-1 5s infinite linear alternate-reverse"}}>
        {text}
      </span>
      <span className="absolute top-0 left-0 z-0 bg-clip-text text-transparent bg-gradient-to-r from-black-500 to-purple-600 opacity-0 glitch-layer-2"
            style={{animation: "glitch-anim-2 3s infinite linear alternate-reverse"}}>
        {text}
      </span>
      <style>{`
        @keyframes glitch-anim-1 {
          0%, 100% { opacity: 0; transform: translate(0); }
          5%, 15%, 25% { opacity: 0.4; transform: translate(-2px, 2px); }
          10%, 20% { opacity: 0.4; transform: translate(2px, -2px); }
        }
        @keyframes glitch-anim-2 {
          0%, 100% { opacity: 0; transform: translate(0); }
          5%, 15%, 25% { opacity: 0.3; transform: translate(2px, -2px); }
          10%, 20% { opacity: 0.3; transform: translate(-2px, 2px); }
        }
      `}</style>
      <div className="absolute -inset-1 blur-xl bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-black-500/20 opacity-50 -z-10" />
    </div>
  );
};

const HeroSection = () => {
  const [user, setUser] = useState(null); // Simule useAuth
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [logoParallax, setLogoParallax] = useState({ x: 0, y: 0 });
  const config = useMobileOptimizer();
  
  // Parallax logo
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current && !config.disableParallax) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 à +10
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      setMousePosition({ x, y });
      setLogoParallax({ x, y });
    }
  };
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Utiliser passive: true pour améliorer les performances de défilement
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation d'entrée au chargement
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animated particle system - Optimisé pour mobile
  const Particles = () => {
    // Réduire le nombre de particules sur mobile
    const particleCount = config.isMobile ? 20 : 60;
    const particles = Array.from({ length: particleCount });
    
    // Désactiver complètement sur les appareils à faibles performances
    if (config.disableEffects) {
      return null;
    }
    
    return (
      <div className="absolute inset-0 overflow-hidden disable-mobile-effect">
        {particles.map((_, i) => {
          // Réduire la taille et la complexité des animations sur mobile
          const size = config.isMobile ? Math.random() * 2 + 1 : Math.random() * 4 + 1;
          const duration = Math.random() * 10 + 10;
          const delay = Math.random() * 5;
          const opacity = config.isMobile ? 0.1 : (Math.random() * 0.5 + 0.1);
          const startPosX = Math.random() * 100;
          const startPosY = Math.random() * 100;
          
          return (
            <div 
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                opacity: opacity,
                left: `${startPosX}%`,
                top: `${startPosY}%`,
                animation: config.disableAnimations ? 'none' : `float ${duration}s infinite ease-in-out ${delay}s`,
                filter: "blur(1px)"
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    );
  };

  // DNA dots animation background - Optimisé pour mobile
  const DNADotsBackground = () => {
    // Réduire le nombre de points sur mobile
    const rows = config.isMobile ? 5 : 10;
    const cols = config.isMobile ? 10 : 20;
    const dots = [];
    
    // Désactiver complètement sur les appareils à faibles performances
    if (config.disableEffects) {
      return null;
    }
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const delay = (i + j) * 0.1;
        dots.push(
          <div 
            key={`${i}-${j}`}
            className="absolute rounded-full bg-black"
            style={{
              width: '4px',
              height: '4px',
              left: `${(j * 100) / cols}%`,
              top: `${(i * 100) / rows}%`,
              opacity: 0.2 + Math.sin((i + j) * 0.5) * 0.2,
              filter: 'blur(1px)',
              animation: config.disableAnimations ? 'none' : `dnaFloat 4s infinite ease-in-out ${delay}s`,
              transform: `translateY(${Math.sin((i + j) * 0.5) * 20}px)`
            }}
            aria-hidden="true"
          />
        );
      }
    }
    
    return (
      <div className="absolute inset-0 overflow-hidden z-0 disable-mobile-effect">
        {dots}
        <style>{`
          @keyframes dnaFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(20px); }
          }
        `}</style>
      </div>
    );
  };

  // 3D Feature card component - Optimisé pour mobile
  const FeatureCard = ({ icon: Icon, text, color, index }: { icon: React.ElementType; text: string; color: string; index: number }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    
    // Désactiver les effets 3D sur mobile
    const handleMouseMove = (e: React.MouseEvent) => {
      if (config.disableHoverEffects) return;
      
      const cardRect = e.currentTarget.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const angle = 15; // Max rotation angle
      
      // Calculate rotation based on mouse position relative to card center
      const rotateY = -((e.clientX - cardCenterX) / (cardRect.width / 2)) * angle;
      const rotateX = ((e.clientY - cardCenterY) / (cardRect.height / 2)) * angle;
      
      setRotateX(rotateX);
      setRotateY(rotateY);
    };
    
    const resetRotation = () => {
      setRotateX(0);
      setRotateY(0);
    };
    
    return (
      <div
        className="perspective-card group relative"
        onMouseEnter={() => !config.disableHoverEffects && setIsHovering(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (!config.disableHoverEffects) {
            setIsHovering(false);
            resetRotation();
          }
        }}
        style={{
          transformStyle: config.disableParallax ? "flat" : "preserve-3d",
          transform: isHovering && !config.disableParallax
            ? `translateZ(30px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` 
            : "translateZ(0) rotateX(0) rotateY(0)",
          transition: isHovering && !config.disableAnimations ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          animationDelay: `${index * 0.1 + 0.3}s`
        }}
        role="listitem"
        aria-label={`Fonctionnalité: ${text}`}
      >
        <div className={`h-full p-6 rounded-2xl backdrop-blur-md bg-gradient-to-br ${color} border border-white/10 shadow-xl`}>
          <div 
            className="relative z-10 flex flex-col items-center text-center"
            style={{ transform: config.disableParallax ? "none" : "translateZ(20px)" }}
          >
            <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md shadow-inner overflow-hidden">
              <div className={config.disableAnimations ? "" : "animate-pulse relative"}>
                <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                <div 
                  className={`absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent ${
                    config.disableEffects || config.disableAnimations ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                  }`} 
                  style={config.disableAnimations ? {} : {animation: "hologram-scan 2s linear infinite"}} 
                  aria-hidden="true"
                />
              </div>
            </div>
            <h3 className="text-white text-lg font-bold">{text}</h3>
            <div 
              className={`absolute -inset-px rounded-2xl ${
                config.disableEffects ? "opacity-0" : "opacity-0 group-hover:opacity-20"
              } bg-white blur-sm`} 
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Holographic reflection effect - désactivé sur mobile */}
        {!config.disableEffects && (
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 bg-gradient-to-t from-transparent via-primary/20 to-transparent disable-mobile-effect" 
            style={config.disableAnimations ? {} : {animation: "hologram-scan 2s linear infinite"}}
            aria-hidden="true"
          />
        )}
        
        {/* Edge glow - désactivé sur mobile */}
        {!config.disableEffects && (
          <div 
            className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-50 bg-gradient-to-r from-black/30 to-purple-500/30 blur-md -z-10 disable-mobile-effect"
            aria-hidden="true"
          />
        )}
        
        {/* Radial highlight - désactivé sur mobile */}
        {!config.disableEffects && !config.disableHoverEffects && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden disable-mobile-effect">
            <div 
              className="absolute w-40 h-40 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: isHovering ? `${rotateY / 15 * 50 + 50}%` : '50%',
                top: isHovering ? `${rotateX / 15 * 50 + 50}%` : '50%',
                transition: "opacity 0.3s ease-out, left 0.1s, top 0.1s"
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  };

  // NeonButton avec lens/glow
  const NeonButton = ({ children, href = "#", ariaLabel }: { children: React.ReactNode; href?: string; ariaLabel: string }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e: React.MouseEvent) => {
      if (isHovering) {
        const btnRect = e.currentTarget.getBoundingClientRect();
        setMousePos({ 
          x: ((e.clientX - btnRect.left) / btnRect.width) * 100, 
          y: ((e.clientY - btnRect.top) / btnRect.height) * 100 
        });
      }
    };
    return (
      <a 
        href={href} 
        aria-label={ariaLabel}
        className="group inline-block focus:outline-none focus:ring-2 focus:ring-blue-400"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        tabIndex={0}
      >
        <div className="relative rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-black to-purple-600 animate-gradient-x" />
          <div className="absolute inset-px rounded-full bg-black" />
          {/* Lens effect */}
          {isHovering && (
            <div 
              className="absolute w-32 h-32 rounded-full opacity-20 bg-white/40 blur-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
                transition: "opacity 0.2s ease-out"
              }}
            />
          )}
          <button 
            className="relative z-10 px-8 py-4 rounded-full font-bold text-white bg-black hover:bg-white hover:text-black hover:shadow-lg hover:shadow-black/50 transition-all duration-300 text-lg flex items-center gap-3 focus:outline-none"
            tabIndex={-1}
          >
            <Sparkles className="h-6 w-6 animate-bounce text-white" />
            {children}
          </button>
          {/* Glow effect */}
          <div 
            className="absolute inset-0 bg-black blur-xl opacity-0 group-hover:opacity-30 rounded-full -z-10 transition-opacity duration-300"
          />
        </div>
      </a>
    );
  };

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-[80vh] w-full overflow-hidden bg-gradient-to-br from-white via-booh-light-purple/30 to-white pt-24 pb-16 md:pt-32 md:pb-24"
      onMouseMove={handleMouseMove}
    >
      {/* Fond halo doux */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] max-w-4xl rounded-full bg-gradient-to-br from-black/30 via-blue-300/20 to-black-200/10 blur-3xl opacity-60 animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tr from-black-200/30 to-transparent blur-2xl opacity-40" />
      </div>
      {/* Particules douces */}
      <Particles />
      {/* Carte centrale glassmorphism */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center px-8 py-12 md:px-16 md:py-16 rounded-3xl bg-white/60 backdrop-blur-2xl shadow-2xl border border-white/30 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ boxShadow: '0 8px 40px 0 rgba(80,80,180,0.10), 0 1.5px 8px 0 rgba(180,180,255,0.08)' }}
      >
        {/* Reflet animé Apple/Awwwards */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(120deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 60%,transparent 100%)',
            mixBlendMode: 'lighten',
            zIndex: 20
          }}
          animate={{ x: ['-60%', '120%'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Badge "Nouveau" animé */}
        <motion.div
          className="absolute -top-6 right-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg z-30 animate-pulse"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Nouveau
        </motion.div>
        {/* Logo avec parallax */}
        <motion.img 
          src="/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp" 
          alt="Logo" 
          className="w-60 h-50 mb-2 select-none"
          style={{
            transform: `translate3d(${logoParallax.x}px, ${logoParallax.y}px, 0)`,
            transition: 'transform 0.2s cubic-bezier(.4,0,.2,1)'
          }}
          draggable={false}
        />
        <h1 className="text-4xl md:text-6xl font-extrabold text-center text-blue-600 drop-shadow-lg mb-4 tracking-tight" style={{letterSpacing: '-0.03em'}}>
          La carte <GlitchText text="digitale" /> nouvelle génération
        </h1>
        <p className="text-lg md:text-2xl text-center text-gray-700/80 font-medium mb-8 max-w-xl mx-auto">
          Créez, partagez et gérez votre identité professionnelle avec élégance. Simple. Moderne. Premium.
        </p>
        <NeonButton href="/auth" ariaLabel="Essayez gratuitement">
          Essayez gratuitement
        </NeonButton>
        
      </motion.div>
      
    </section>
  );
};

export default HeroSection;