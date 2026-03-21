import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Home, Search, Sparkles, Compass, Rocket, Zap, Ghost } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════
// 404 PAGE - AWWWARDS/APPLE LEVEL + FUN
// ═══════════════════════════════════════════════════════════

// Messages fun aléatoires
const funMessages = [
  { emoji: "🎯", title: "Oups!", desc: "On dirait que cette page joue à cache-cache" },
  { emoji: "🚀", title: "Houston...", desc: "Cette page s'est envolée dans l'espace" },
  { emoji: "🎪", title: "Spectacle annulé", desc: "Cette page a pris des vacances" },
  { emoji: "🎨", title: "Canvas vierge", desc: "Cette page n'existe que dans votre imagination" },
  { emoji: "🎭", title: "Rideau fermé", desc: "Le spectacle de cette page n'aura pas lieu" },
  { emoji: "🎮", title: "Game Over", desc: "Cette page n'a pas été débloquée" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentMessage, setCurrentMessage] = useState(funMessages[Math.floor(Math.random() * funMessages.length)]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    console.log('404 Page accessed:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen min-h-[-webkit-fill-available] relative overflow-hidden flex flex-col items-center justify-center">
      
      {/* ═══════ PREMIUM BACKGROUND ═══════ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base */}
        <div className="absolute inset-0 bg-[#fafafa]" />
        
        {/* Mesh gradient premium - Fun colors */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(236, 72, 153, 0.06), transparent),
              radial-gradient(ellipse 50% 30% at 0% 80%, rgba(59, 130, 246, 0.06), transparent)
            `
          }}
        />
        
        {/* Grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
        
        {/* Orbes flottants colorés - Fun */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
          }}
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
            scale: [1, 1.15, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-[550px] h-[550px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
            bottom: '-5%',
            left: '-15%',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute w-[450px] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            top: '40%',
            right: '20%',
          }}
          animate={{
            y: [0, 35, 0],
            x: [0, -25, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>

      {/* ═══════ CONTENT - Parfaitement centré ═══════ */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center px-4 md:px-6 py-12">
        
        {/* Main container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl w-full"
        >
          
          {/* 404 Number - Fun & Interactive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative mb-10 md:mb-12"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Emoji géant au-dessus - Fun & Animated */}
            <motion.div
              className="relative flex justify-center mb-6 md:mb-8 select-none"
              initial={{ y: 20, opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                scale: 1,
                rotate: 0
              }}
              transition={{ 
                delay: 0.15, 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {/* Glow derrière l'emoji */}
              <motion.div
                className="absolute inset-0 -m-8 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                  filter: 'blur(30px)'
                }}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <motion.div
                className="relative text-[90px] md:text-[120px] cursor-pointer"
                animate={{
                  y: [0, -10, 0],
                  rotate: isHovering ? [0, -8, 8, -8, 8, 0] : [0, -2, 2, 0]
                }}
                transition={{
                  y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                  rotate: isHovering ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }}
                whileHover={{ 
                  scale: 1.15,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentMessage(funMessages[Math.floor(Math.random() * funMessages.length)])}
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(139,92,246,0.2))'
                }}
              >
                {currentMessage.emoji}
              </motion.div>
            </motion.div>
            
            {/* 4[logo]4 - Creative & Fun - Design amélioré */}
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              {/* Container avec les 4 positionnés absolument */}
              <div className="relative flex items-center justify-center">
                
                {/* Premier 4 - Positionné à gauche, légèrement derrière */}
                <motion.h1 
                  className="absolute left-[calc(50%-80px)] md:left-[calc(50%-120px)] text-[100px] md:text-[180px] font-black leading-none tracking-[-0.02em] cursor-default select-none z-0"
                  style={{
                    background: isHovering 
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)'
                      : 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: isHovering ? '0 0 40px rgba(139,92,246,0.3)' : 'none',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: 0.95
                  }}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.95 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: [-3, 3, -3, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  4
                </motion.h1>
                
                {/* Logo au centre - Au-dessus des 4 */}
                <motion.div
                  className="relative z-20"
                  initial={{ scale: 0, rotate: -180, y: 20 }}
                  animate={{ scale: 1, rotate: 0, y: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 20 }}
                  whileHover={{ 
                    scale: 1.15,
                    y: -8,
                    rotate: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.6 }
                  }}
                >
                  {/* Glow rings premium et dynamiques */}
                  <motion.div
                    className="absolute inset-0 -m-8 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 60%)',
                      filter: 'blur(20px)'
                    }}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 0.2, 0.6],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 -m-12 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 60%)',
                      filter: 'blur(25px)'
                    }}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.1, 0.5],
                      rotate: [360, 180, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                  
                  {/* Particules flottantes autour du logo */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        background: ['#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'][i],
                        top: '50%',
                        left: '50%',
                        boxShadow: `0 0 10px ${['#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'][i]}`
                      }}
                      animate={{
                        x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                        y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                  
                  {/* Logo avec effet 3D */}
                  <motion.div 
                    className="relative"
                    style={{
                      filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
                    }}
                    whileHover={{ 
                      filter: 'drop-shadow(0 20px 50px rgba(139,92,246,0.4))'
                    }}
                  >
                    <motion.img 
                      src="/logo/booh-404.png" 
                      alt="bööh logo" 
                      className="relative w-32 h-32 md:w-40 md:h-40 object-contain"
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      whileHover={{ 
                        scale: [1, 1.05, 0.95, 1.02, 1],
                        rotate: [0, 5, -5, 3, 0],
                        transition: { duration: 0.6 }
                      }}
                    />
                  </motion.div>
                </motion.div>
                
                {/* Deuxième 4 - Positionné à droite, légèrement derrière */}
                <motion.h1 
                  className="absolute right-[calc(50%-80px)] md:right-[calc(50%-120px)] text-[100px] md:text-[180px] font-black leading-none tracking-[-0.02em] cursor-default select-none z-0"
                  style={{
                    background: isHovering 
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)'
                      : 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: isHovering ? '0 0 40px rgba(236,72,153,0.3)' : 'none',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: 0.95
                  }}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.95 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: [3, -3, 3, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  4
                </motion.h1>
              </div>
            </motion.div>
            
            {/* Petit message sous le 4[logo]4 */}
            <motion.div 
              className="mt-6 mb-8 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
              <motion.p
                className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-[0.15em]"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Page Not Found
              </motion.p>
              <motion.div
                className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </motion.div>
            
            {/* Decorative line premium - Morphing gradient */}
            <motion.div
              className="h-1.5 rounded-full mx-auto relative overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{
                boxShadow: '0 4px 20px rgba(139,92,246,0.15)'
              }}
            >
              {/* Gradient animé qui morphe */}
              <motion.div 
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
                    'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
                    'linear-gradient(90deg, #EC4899 0%, #3B82F6 50%, #8B5CF6 100%)',
                    'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Shimmer premium */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ 
                  backgroundPosition: ['0% 0%', '200% 0%']
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
              />
              
              {/* Glow pulsant */}
              <motion.div
                className="absolute inset-0 -m-1 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                  filter: 'blur(8px)'
                }}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
          
          {/* Étoiles décoratives volantes */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl md:text-3xl select-none"
              initial={{ 
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                x: [null, Math.random() * 200 - 100],
                y: [null, -100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 3,
                delay: 1 + i * 0.5,
                repeat: Infinity,
                ease: 'easeOut'
              }}
              style={{
                left: `${30 + i * 20}%`,
                top: '50%'
              }}
            >
              {['✨', '⭐', '💫'][i]}
            </motion.div>
          ))}

          {/* Title & Description - Fun messages */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mb-12 md:mb-16 max-w-md mx-auto px-4"
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 tracking-tight"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring" }}
              >
                {currentMessage.title}
              </motion.h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto">
                {currentMessage.desc}
              </p>
              
              {/* Bouton pour changer de message - Easter egg */}
              <motion.button
                onClick={() => setCurrentMessage(funMessages[Math.floor(Math.random() * funMessages.length)])}
                className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-full inline-flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3 h-3" strokeWidth={2} />
                <span>Changer de message</span>
              </motion.button>
              
              {/* Chemin tenté - Avec icône fun */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-xs text-gray-500"
              >
                <Ghost className="w-3.5 h-3.5" strokeWidth={2} />
                <code className="truncate max-w-[200px] font-mono">{location.pathname}</code>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Actions - Fun & Premium buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md mx-auto"
          >
            {/* Primary action - Retour accueil premium */}
            <motion.button
              onClick={() => navigate('/')}
              className="group relative flex-1 sm:flex-initial overflow-hidden rounded-2xl"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.25)'
              }}
            >
              {/* Glow animé */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3), rgba(59,130,246,0.3))',
                  filter: 'blur(20px)'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Gradient background animé */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
                }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Bouton content */}
              <div className="relative bg-gray-900 group-hover:bg-transparent text-white px-8 py-4 rounded-2xl font-bold text-[15px] transition-all duration-400 flex items-center justify-center gap-2.5">
                {/* Multi-layer shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                  animate={{ translateX: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                />
                
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  className="relative z-10"
                >
                  <Home className="w-5 h-5" strokeWidth={2.5} />
                </motion.div>
                <span className="relative z-10">Retour à l'accueil</span>
              </div>
            </motion.button>

            {/* Secondary action - Explorer premium */}
            <motion.button
              onClick={() => navigate('/map')}
              className="group relative flex-1 sm:flex-initial overflow-hidden rounded-2xl"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow au hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                  filter: 'blur(15px)'
                }}
              />
              
              {/* Bouton content */}
              <div className="relative bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 flex items-center justify-center gap-2.5 ring-1 ring-black/[0.06] group-hover:ring-purple-500/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] group-hover:shadow-[0_12px_40px_-8px_rgba(139,92,246,0.3)]">
                {/* Gradient hover background */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.08) 50%, rgba(59,130,246,0.08) 100%)'
                  }}
                />
                
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="relative z-10"
                >
                  <Compass className="w-5 h-5" strokeWidth={2.5} />
                </motion.div>
                <span className="relative z-10">Explorer la carte</span>
              </div>
            </motion.button>
          </motion.div>

          {/* Suggestions de pages populaires - Icônes SVG premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 mb-8"
          >
            <motion.p 
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3" strokeWidth={2} />
              <span>Ou découvrez</span>
            </motion.p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { 
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  ), 
                  label: 'Accueil', 
                  path: '/', 
                  gradient: 'from-blue-500 via-cyan-500 to-blue-600',
                  iconColor: 'text-blue-600'
                },
                { 
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3"/>
                      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
                    </svg>
                  ), 
                  label: 'Carte', 
                  path: '/map', 
                  gradient: 'from-purple-500 via-pink-500 to-purple-600',
                  iconColor: 'text-purple-600'
                },
                { 
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ), 
                  label: 'Dashboard', 
                  path: '/dashboard', 
                  gradient: 'from-orange-500 via-red-500 to-orange-600',
                  iconColor: 'text-orange-600'
                },
              ].map((link, i) => (
                <motion.button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="group relative overflow-hidden px-6 py-3.5 bg-white text-gray-800 text-sm font-semibold rounded-2xl ring-1 ring-black/[0.06] transition-all shadow-sm"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.1, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.1, y: -6 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Gradient hover background */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-r ${link.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400`}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.12 }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      boxShadow: `0 8px 30px -8px ${link.iconColor === 'text-blue-600' ? 'rgba(59,130,246,0.4)' : link.iconColor === 'text-purple-600' ? 'rgba(139,92,246,0.4)' : 'rgba(249,115,22,0.4)'}`
                    }}
                  />
                  
                  <span className="relative flex items-center gap-2.5">
                    <motion.span 
                      className={`${link.iconColor} group-hover:text-white transition-colors duration-300`}
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {link.icon}
                    </motion.span>
                    <span className="group-hover:text-white transition-colors duration-300">{link.label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Link back - Fun avec bounce */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-10"
          >
            <motion.button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-2 group px-5 py-2.5 hover:bg-white rounded-full ring-1 ring-transparent hover:ring-black/[0.06]"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ x: [-2, 0, -2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              </motion.div>
              <span className="font-medium">Page précédente</span>
            </motion.button>
          </motion.div>

          {/* Éléments décoratifs fun - Dots animés */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-12 flex justify-center gap-3"
          >
            {[
              { color: 'bg-purple-500', delay: 0 },
              { color: 'bg-pink-500', delay: 0.2 },
              { color: 'bg-blue-500', delay: 0.4 },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 ${dot.color} rounded-full`}
                animate={{
                  y: [0, -12, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: dot.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>

        </motion.div>
      </div>

      {/* Footer premium - Miscoch IT */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="relative z-10 w-full py-8 md:py-10"
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Separator line premium */}
          <motion.div 
            className="h-px w-full max-w-md mx-auto mb-8 relative overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.9, duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </motion.div>
          
          {/* Main footer content */}
          <div className="flex flex-col items-center gap-6">
            
            {/* Made by section avec logo */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-xs text-gray-400 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  Créé par
                </motion.span>
                
                {/* Logo Miscoch IT avec animations premium */}
                <motion.a
                  href="https://miscoch-it.ga"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-3 px-4 py-2 bg-white rounded-2xl ring-1 ring-black/[0.06] hover:ring-black/[0.12] transition-all shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Glow au hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl"
                    style={{
                      boxShadow: '0 8px 30px -8px rgba(139,92,246,0.25)'
                    }}
                  />
                  
                  {/* Logo container avec effet 3D */}
                  <motion.div 
                    className="relative w-7 h-7 rounded-lg overflow-hidden ring-1 ring-black/[0.06]"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <img 
                      src="/logo/misc.webp" 
                      alt="Miscoch IT" 
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Shine effect sur le logo */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ translateX: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                  </motion.div>
                  
                  {/* Nom avec gradient au hover */}
                  <motion.span 
                    className="text-sm font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:via-pink-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                  >
                    Miscoch IT
                  </motion.span>
                  
                  {/* Arrow externe */}
                  <motion.svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-gray-400 group-hover:text-purple-600 transition-colors"
                    animate={{ 
                      x: [0, 2, 0],
                      y: [0, -2, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <path d="M7 17L17 7M17 7H7M17 7V17"/>
                  </motion.svg>
                </motion.a>
              </div>
            </motion.div>
            
            {/* Copyright et infos */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1 }}
            >
              <div className="flex items-center gap-2">
                <span>© {new Date().getFullYear()} bööh</span>
                <span className="hidden sm:inline text-gray-300">•</span>
              </div>
              
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <span>Fait avec</span>
                <motion.span
                  className="text-sm"
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  💜
                </motion.span>
                <span>à Libreville</span>
              </motion.div>
            </motion.div>
            
            {/* Tech stack badges (optionnel) */}
            <motion.div
              className="flex items-center gap-2 flex-wrap justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 }}
            >
              {['React', 'TypeScript', 'Tailwind'].map((tech, i) => (
                <motion.span
                  key={tech}
                  className="px-2.5 py-1 bg-gray-50 text-gray-500 text-[10px] font-medium rounded-lg ring-1 ring-black/[0.04]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.3 + i * 0.1 }}
                  whileHover={{ scale: 1.1, backgroundColor: '#fafafa' }}
                >
                  {tech}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default NotFound;
