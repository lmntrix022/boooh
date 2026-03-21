import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PLANS_INFO, PlanType } from '@/types/subscription';
import FooterDark from '@/components/FooterDark';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { useLanguage } from '@/hooks/useLanguage';
import { useSmartPreload } from '@/hooks/useSmartPreload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  FileText,
  Package,
  Users,
  BarChart3,
  MapPin,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Star,
  Smartphone,
  ShieldCheck,
  Phone,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Globe,
  Wallet,
  QrCode,
  ShoppingBag,
  LayoutGrid,
  Share2,
  Search,
  Command,
  ArrowUpRight,
  CreditCard,
  Bell,
  User,
  Link as LinkIcon,
  LayoutDashboard,
  Plus,
  Eye,
  Activity,
  Settings,
  Check,
  Signal,
  Wifi,
  Battery,
  Clock,
  Cpu,
  List,
  Filter,
  CalendarDays,
  Sliders,
  Box,
  Layers,
  Grid,
  AlertTriangle,
  AlertOctagon,
  Camera,
  Upload,
  AlertCircle,
  Sun,
  Focus,
  Download,
  MessageCircle,
  ArrowRightCircle,
  ShoppingCart,
  Tag,
  Heart,
  Infinity,
  MousePointer2,
  Target,
  BarChart4,
  Navigation as NavigationIcon,
  Map as MapIcon,
  Crosshair,
  ChevronDown,
  Mail,
  Linkedin,
  Crown
} from 'lucide-react';

// Import du nouveau composant pricing
import PricingSection from '@/components/landing/PricingSection';

// Local assets to avoid CSP issues
const imgLocal = {
  heroBg: '/booh-landing/booh-landing1.webp',
  avatar: '/booh-landing/booh-landing2.webp',
  product1: '/booh-landing/booh-landing3.webp',
  product2: '/booh-landing/booh-landing4.webp',
  product3: '/booh-landing/booh-landing5.webp',
  map: '/booh-landing/booh-landing6.webp',
  noise:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
  placeholder: '/booh-landing/booh-landing1.webp'
};

// --- UTILS & HOOKS ---
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
  return mousePosition;
};

function useParallaxTilt(ref: React.RefObject<HTMLDivElement>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  return { handleMouseMove, handleMouseLeave, x, y };
}

// --- ATOMIC COMPONENTS ---
const CustomCursor = () => {
  const { x, y } = useMousePosition();
  return (
    <motion.div
      className="fixed top-0 left-0 w-5 h-5 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
      animate={{ x: x - 10, y: y - 10 }}
      transition={{ 
        type: 'spring', 
        stiffness: 1000, 
        damping: 50, 
        mass: 0.1 
      }}
    />
  );
};

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Compteur de 0% à 100% en 2 secondes (1% toutes les 20ms)
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);
    
    // Délai total de 2500ms (2000ms pour le compteur + 500ms de pause)
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);
  
  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.76, 0, 0.24, 1] // Courbe de Bézier sophistiquée : rapide au début, ralentit à la fin
      }}
      className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white"
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Compteur numérique géant - Typographie monumentale */}
      <motion.div 
        className="text-[12vw] font-light tracking-tighter leading-none text-white select-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontVariantNumeric: 'tabular-nums', // Chiffres à largeur fixe pour éviter les sauts visuels
          willChange: 'transform, opacity',
        }}
      >
        {count}%
      </motion.div>
      
      {/* Micro-typographie technique en bas */}
      <motion.div 
        className="absolute bottom-10 text-xs font-mono uppercase tracking-widest opacity-50 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        Initialisation Booh OS
      </motion.div>
    </motion.div>
  );
};

const MinimalCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  // Si className contient bg-*, on n'applique pas bg-white par défaut
  const hasBg = className.includes('bg-');
  return (
    <div
      className={`relative overflow-hidden ${!hasBg ? 'bg-white' : ''} border border-slate-200/60 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
};

const ShimmerButton = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <button onClick={onClick} className={`relative overflow-hidden group cursor-pointer ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
    {children}
  </button>
);

const MagneticButton = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };
  const reset = () => setPosition({ x: 0, y: 0 });
  const { x, y } = position;
  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

// --- DATA ---
const FEATURES = [
  { 
    id: 1, 
    title: 'Agenda', 
    desc: 'Planification neuronale.', 
    icon: Calendar, 
    visual: 'calendar',
    pain: 'Rendez-vous qui se chevauchent, reports, oublis, confirmations manuelles…',
    painSubtitle: 'Un calendrier impossible à dompter.',
    problem: "Vous n'avez plus de visibilité. Vous subissez votre planning.",
    solution: 'Booh synchronise, organise et confirme vos rendez-vous automatiquement.',
    result: 'Votre planning devient fluide. Prévisible. Sain.',
    cta: 'Organiser mes rendez-vous'
  },
  { 
    id: 2, 
    title: 'Facturation', 
    desc: 'Recouvrement accéléré.', 
    icon: FileText, 
    visual: 'invoice',
    pain: 'Factures oubliées, relances manuelles, trésorerie incertaine…',
    painSubtitle: "Vous perdez de l'argent chaque mois.",
    problem: 'Le temps passé à relancer pourrait servir à vendre.',
    solution: 'Booh génère, envoie et relance vos factures automatiquement.',
    result: 'Vous êtes payé plus vite. Votre trésorerie respire.',
    cta: 'Automatiser ma facturation'
  },
  { 
    id: 3, 
    title: 'Stock', 
    desc: 'Inventaire temps réel.', 
    icon: Package, 
    visual: 'stock',
    pain: 'Ruptures imprévisibles, comptages manuels, surstockage coûteux…',
    painSubtitle: 'Vous ne savez jamais où vous en êtes.',
    problem: "Chaque rupture vous coûte un client. Chaque surplus vous coûte de l'argent.",
    solution: 'Booh suit votre stock en temps réel et anticipe les besoins.',
    result: 'Zéro rupture. Zéro surplus. Stock optimal.',
    cta: 'Optimiser mon inventaire'
  },
  { 
    id: 4, 
    title: 'CRM', 
    desc: 'Contacts digitalisés.', 
    icon: Users, 
    visual: 'ocr',
    pain: 'Cartes égarées, contacts éparpillés, historique introuvable…',
    painSubtitle: 'Votre réseau dort dans vos poches.',
    problem: "Vous oubliez de relancer. Vous perdez des opportunités.",
    solution: 'Booh numérise, centralise et active votre réseau automatiquement.',
    result: 'Chaque contact devient une opportunité tracée.',
    cta: 'Activer mon réseau'
  },
  { 
    id: 5, 
    title: 'Identité', 
    desc: 'Cartes digitales.', 
    icon: QrCode, 
    visual: 'card',
    pain: 'Impression coûteuse, cartes périmées, partage laborieux…',
    painSubtitle: "Votre image souffre d'un support obsolète.",
    problem: "Vos cartes papier finissent à la poubelle. Vos infos ne sont jamais à jour.",
    solution: 'Booh crée votre carte digitale interactive et toujours actualisée.',
    result: 'Vous partagez votre identité en un tap. Mémorable.',
    cta: 'Créer ma carte digitale'
  },
  { 
    id: 6, 
    title: 'Commerce', 
    desc: 'Boutique auto.', 
    icon: ShoppingBag, 
    visual: 'shop',
    pain: 'Commandes manquées, gestion dispersée, clients impatients…',
    painSubtitle: 'Vous perdez des ventes chaque jour.',
    problem: 'Pas de boutique en ligne = pas de ventes automatiques.',
    solution: 'Booh crée votre boutique et gère commandes et paiements 24/7.',
    result: 'Vous vendez pendant que vous dormez.',
    cta: 'Lancer ma boutique'
  },
  { 
    id: 7, 
    title: 'Portfolio', 
    desc: 'Showroom immersif.', 
    icon: LayoutGrid, 
    visual: 'portfolio',
    pain: 'Photos désorganisées, présentation amateur, impact limité…',
    painSubtitle: "Votre talent mérite mieux qu'un album photo.",
    problem: 'Vos prospects ne voient pas la valeur de votre travail.',
    solution: 'Booh transforme vos réalisations en showroom immersif et convaincant.',
    result: 'Vos projets se vendent tout seuls.',
    cta: 'Créer mon portfolio'
  },
  { 
    id: 8, 
    title: 'Analytics', 
    desc: 'Intelligence d\'affaires.', 
    icon: BarChart3, 
    visual: 'chart',
    pain: "Décisions à l'aveugle, KPIs introuvables, croissance incertaine…",
    painSubtitle: 'Vous pilotez sans instruments.',
    problem: 'Vous ne savez pas ce qui marche ni où investir.',
    solution: 'Booh analyse votre activité et vous guide vers la croissance.',
    result: 'Chaque décision devient data-driven. Précise.',
    cta: 'Voir mes insights'
  },
  { 
    id: 9, 
    title: 'Map Géolocalisée', 
    desc: 'Découvrez les business, produits et services près de vous.', 
    icon: MapPin, 
    visual: 'map',
    pain: 'Difficile de trouver les business et services près de vous. Recherche fastidieuse, informations dispersées…',
    painSubtitle: "Vous perdez du temps à chercher ce dont vous avez besoin.",
    problem: 'Comment découvrir rapidement les produits et services disponibles autour de vous ?',
    solution: 'Booh géolocalise automatiquement tous les business, produits et services à proximité. Découvrez, comparez, achetez en un clic.',
    result: 'Trouvez instantanément ce que vous cherchez. À portée de main.',
    cta: 'Découvrir près de moi'
  }
];

const TESTIMONIALS = [
  { name: 'Marie K.', role: 'Fondatrice', text: "Booh n'est pas un outil, c'est une extension de mon cerveau." },
  { name: 'Karim D.', role: 'Tech Lead', text: 'Interface pure, niveau détail inégalé.' },
  { name: 'Aïcha B.', role: 'Traiteur', text: "Enfin une app business qui respecte l'utilisateur." },
  { name: 'Jean-Marc', role: 'Consultant', text: 'Revenus +30% juste en organisant mieux mes relances.' }
];

const FAQS = [
  { q: "Est-ce vraiment gratuit au début ?", a: 'Oui, 30 jours complets sans carte bancaire.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Chiffrement AES-256, serveurs sécurisés, RGPD.' },
  { q: 'Puis-je l\'utiliser hors connexion ?', a: 'Oui, synchronisation automatique au retour du réseau.' },
  { q: 'Comment fonctionne le support ?', a: 'Chat en direct 7j/7 depuis l\'app.' }
];

// PRICING constant removed - Using PLANS_INFO from @/types/subscription instead

// --- SECTIONS ---

const Hero3D = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Détecter réseau faible pour réduire animations
  const isSlowConnection = useMemo(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      return conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.saveData || conn.downlink < 1.5);
    }
    return false;
  }, []);
  
  // Sur mobile, désactiver les animations de souris
  const shouldDisableMouseAnimations = isMobile || isSlowConnection;
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  // Throttle mouse move pour performance - Optimisé avec useCallback
  const lastUpdateRef = useRef(0);
  const throttleDelay = shouldDisableMouseAnimations ? 100 : 16; // Réduire fréquence sur mobile/réseau faible
  
  const handleMouseMove = useCallback(({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    if (shouldDisableMouseAnimations) return; // Désactiver animations souris sur mobile/réseau faible
    
    const now = Date.now();
    if (now - lastUpdateRef.current < throttleDelay) return;
    lastUpdateRef.current = now;
    
    const rect = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - rect.left);
    mouseY.set(clientY - rect.top);
  }, [mouseX, mouseY, shouldDisableMouseAnimations, throttleDelay]);
  
  // Parallaxe optimisée avec useSpring pour fluidité - Memoized
  const containerDimensions = useMemo(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }), []);
  
  const mouseXPercent = useTransform(mouseX, [0, containerDimensions.width], [-1, 1]);
  const mouseYPercent = useTransform(mouseY, [0, containerDimensions.height], [-1, 1]);
  
  // Utiliser useSpring pour des animations plus fluides - Config optimisée
  // Réduire animations sur mobile/réseau faible
  const springConfig = useMemo(() => ({ 
    stiffness: shouldDisableMouseAnimations ? 200 : 400, 
    damping: shouldDisableMouseAnimations ? 50 : 35,
    mass: shouldDisableMouseAnimations ? 1 : 0.5
  }), [shouldDisableMouseAnimations]);
  
  // Réduire l'amplitude des animations sur mobile/réseau faible
  const animationMultiplier = shouldDisableMouseAnimations ? 0 : 1;
  
  const titleX = useSpring(useTransform(mouseXPercent, (v) => v * 12 * animationMultiplier), springConfig);
  const titleY = useSpring(useTransform(mouseYPercent, (v) => v * 8 * animationMultiplier), springConfig);
  const titleRotateX = useSpring(useTransform(mouseYPercent, (v) => v * 2 * animationMultiplier), springConfig);
  const titleRotateY = useSpring(useTransform(mouseXPercent, (v) => v * -2 * animationMultiplier), springConfig);
  
  const logoX = useSpring(useTransform(mouseXPercent, (v) => v * 6 * animationMultiplier), springConfig);
  const logoY = useSpring(useTransform(mouseYPercent, (v) => v * 4 * animationMultiplier), springConfig);
  const logoRotateZ = useSpring(useTransform(mouseXPercent, (v) => v * 5 * animationMultiplier), springConfig);
  
  const subtitleX = useSpring(useTransform(mouseXPercent, (v) => v * 8 * animationMultiplier), springConfig);
  const subtitleY = useSpring(useTransform(mouseYPercent, (v) => v * 5 * animationMultiplier), springConfig);
  
  const ctaX = useSpring(useTransform(mouseXPercent, (v) => v * 4 * animationMultiplier), springConfig);
  const ctaY = useSpring(useTransform(mouseYPercent, (v) => v * 3 * animationMultiplier), springConfig);
  
  // Scroll-away avec rotation 3D
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scrollY = useTransform(scrollYProgress, [0, 0.4], [0, -120]);
  const scrollRotateX = useTransform(scrollYProgress, [0, 0.4], [0, 10]);
  const scrollScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);
  
  const words = useMemo(() => [t('landingV2.hero.word1'), t('landingV2.hero.word2')], [t]);
  
  // Fonction optimisée pour animer les lettres (memoized)
  const animateLetters = useMemo(() => {
    return (text: string, baseDelay: number = 0) => {
      return text.split('').map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ 
            opacity: 0, 
            y: 60, 
            filter: 'blur(10px)',
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            filter: 'blur(0px)',
          }}
          transition={{ 
            delay: baseDelay + i * 0.02, 
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
          style={{
            willChange: 'transform, opacity, filter',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ));
    };
  }, []);
  
  // Positions des particules mémorisées pour éviter les recalculs
  const particlePositions = React.useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      xOffset: (10 + i * 2),
      yOffset: (10 + i * 2),
      animX: Math.random() * 60 - 30,
      duration: 6 + Math.random() * 4,
      delay: Math.random() * 3,
    }));
  }, []);
  
  // Positions des lignes SVG mémorisées
  const linePositions = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      startX: 20 + Math.random() * 60,
      startY: 20 + Math.random() * 60,
      endX: 20 + Math.random() * 60,
      endY: 20 + Math.random() * 60,
      duration: 5 + Math.random() * 3,
      delay: i * 0.4,
    }));
  }, []);
  
  return (
    <section
      ref={containerRef}
      className="relative py-20 sm:py-24 md:py-32 lg:py-40 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white flex flex-col justify-center"
      onMouseMove={handleMouseMove}
      id="manifesto"
      style={{
        perspective: '1000px',
        minHeight: 'calc(100vh - 80px)', // Hauteur adaptative en soustrayant la navbar
      }}
    >
      {/* Background multi-couches sophistiqué */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grille animée avec profondeur optimisée */}
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_50%,transparent_100%)] opacity-25"
          animate={{
            backgroundPosition: ['0% 0%', '4rem 4rem'],
          }}
          transition={{
            duration: 25,
            repeat: -1,
            ease: "linear",
          }}
          style={{
            transform: useMotionTemplate`translateZ(${useSpring(useTransform(mouseYPercent, (v) => v * 15), springConfig)}px)`,
            willChange: 'background-position, transform',
            transformStyle: 'preserve-3d',
          }}
        />
        
        {/* Particules flottantes optimisées */}
        {particlePositions.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-slate-400/40 rounded-full blur-[1px]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              x: useSpring(useTransform(mouseXPercent, (v) => v * particle.xOffset), springConfig),
              y: useSpring(useTransform(mouseYPercent, (v) => v * particle.yOffset), springConfig),
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, particle.animX, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: -1,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Gradients animés multiples avec profondeur */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-slate-200/8 rounded-full blur-[180px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
            x: [0, 80, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 15,
            repeat: -1,
            ease: [0.4, 0, 0.6, 1],
          }}
          style={{
            x: useTransform(mouseXPercent, (v) => v * 30),
            y: useTransform(mouseYPercent, (v) => v * 30),
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-slate-300/6 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.28, 0.15],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: -1,
            ease: [0.4, 0, 0.6, 1],
          }}
          style={{
            x: useTransform(mouseXPercent, (v) => v * -20),
            y: useTransform(mouseYPercent, (v) => v * -20),
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-slate-100/5 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: -1,
            ease: "easeInOut",
          }}
        />
        
        {/* Effet de lumière principal suivant la souris */}
        <motion.div
          className="absolute -inset-40 rounded-full blur-[250px]"
          style={{
            background: useMotionTemplate`radial-gradient( 800px circle at ${mouseX}px ${mouseY}px, rgba(241, 245, 249, 0.5), rgba(226, 232, 240, 0.3), transparent 70% )`,
            opacity: 0.4,
          }}
        />
        
        {/* Lignes de connexion animées optimisées */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateZ(0)', willChange: 'transform' }} aria-hidden="true">
          {linePositions.map((line) => (
            <motion.line
              key={line.id}
              x1={`${line.startX}%`}
              y1={`${line.startY}%`}
              x2={`${line.endX}%`}
              y2={`${line.endY}%`}
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: line.duration,
                repeat: -1,
                delay: line.delay,
                ease: "easeInOut",
              }}
              style={{
                willChange: 'stroke-dasharray, opacity',
              }}
            />
          ))}
        </svg>
        
        {/* Glassmorphism overlay */}
        <motion.div
          className="absolute inset-0 backdrop-blur-[0.5px] bg-white/5"
          style={{
            opacity: useTransform(mouseYPercent, (v) => 0.3 + Math.abs(v) * 0.2),
          }}
        />
      </div>
      
      <div className="container mx-auto px-8 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto text-center"
          style={{
            opacity: scrollOpacity,
            y: scrollY,
            scale: scrollScale,
            rotateX: scrollRotateX,
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Titre principal avec style BentoGrid */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-light mb-6 text-center"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
              x: titleX,
              y: titleY,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            <span className="text-gray-900">{words[0]}</span>
            <br />
            <span className="text-gray-500">{words[1]}</span>
          </motion.h1>
          
          {/* Logo booh avec effet 3D sophistiqué */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
            animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
            transition={{ delay: 1, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 flex justify-center"
            style={{
              x: logoX,
              y: logoY,
              rotateZ: logoRotateZ,
              transformStyle: 'preserve-3d',
            }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08, rotateZ: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Halo autour du logo */}
              <motion.div
                className="absolute inset-0 bg-slate-900/10 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: -1,
                  ease: "easeInOut",
                }}
              />
              <motion.img
                src="/favicon.png"
                alt="Logo Bööh"
                width="112"
                height="112"
                fetchPriority="high"
                loading="eager"
                decoding="sync"
                className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain drop-shadow-2xl"
                onError={(e) => {
                  // Fallback silencieux si logo échoue
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </motion.div>
          </motion.div>
          
          {/* Sous-titre avec animation de révélation */}
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-slate-500 max-w-4xl mx-auto leading-[1.5] font-light mb-8 sm:mb-10 md:mb-12 lg:mb-14 tracking-normal px-4"
            style={{
              x: subtitleX,
              y: subtitleY,
            }}
          >
            {t('landingV2.hero.subtitle').split('entrepreneurs modernes')[0]}
            <motion.span 
              className="text-slate-700 font-light inline-block relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              {t('landingV2.hero.subtitle').includes('entrepreneurs modernes') ? 'entrepreneurs modernes' : t('landingV2.hero.word2')}
              {/* Underline animé */}
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-700/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.span>
            .
          </motion.p>
          
          {/* CTA Premium avec effets avancés */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center items-center"
            style={{
              x: ctaX,
              y: ctaY,
            }}
          >
            <MagneticButton>
              <motion.button
                onClick={() => {
                  if (user) {
                    navigate('/dashboard');
                  } else {
                    navigate('/auth');
                  }
                }}
                className="group relative bg-black text-white px-10 py-5 md:px-14 md:py-6 rounded-full font-light text-base md:text-lg tracking-tight shadow-2xl shadow-black/20 flex items-center gap-3 overflow-hidden"
                whileHover={{ scale: 1.03, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {/* Gradient animé en arrière-plan */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-slate-800 via-black to-slate-800"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: -1,
                    ease: "linear",
                  }}
                />
                
                {/* Effet de brillance sophistiqué */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: -1,
                    ease: "linear",
                  }}
                />
                
                {/* Glow effect au hover */}
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                
                <span className="relative z-10">{t('landingV2.hero.cta')}</span>
                <motion.div 
                  className="relative z-10"
                  whileHover={{ x: 5, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <ArrowRight size={18} strokeWidth={2.5} className="w-4 h-4 md:w-5 md:h-5" />
                </motion.div>
              </motion.button>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const BentoGrid = React.memo(() => {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const stockGlowRef = useRef<HTMLDivElement>(null);
  const stockBarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const handleHover = useCallback((id: string | null) => {
    // Désactiver les effets hover sur mobile pour économiser les ressources
    if (isMobile) return;
    setIsHovered(id);
  }, [isMobile]);
  
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden" id="produit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de Section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className="text-5xl sm:text-6xl md:text-7xl font-light mb-6"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >
            <span className="text-gray-900">L'Ordre modulaire.</span>
            <br />
            <span className="text-gray-500">Laissez le chaos derrière vous.</span>
          </h2>
          {/* Indicateur */}
          <div className="w-24 h-1 bg-black rounded-full mx-auto" />
        </motion.div>

        {/* Grille Bento Asymétrique */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-fr relative">
          {/* A. Carte "Agenda Neural" - Large (4 colonnes) */}
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-4 rounded-2xl bg-white p-6 border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 relative"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-xl font-light text-slate-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Agenda
                </h3>
                <motion.div
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                  <span className="text-xs font-light text-slate-600">En direct</span>
                </motion.div>
              </div>
              
              {/* Timeline Minimaliste */}
              <div className="flex-1 relative bg-slate-50/50 rounded-lg p-4 border border-slate-200/40">
                <div className="space-y-3 relative">
                  {/* Ligne pointillée verticale */}
                  <div className="absolute left-[14px] top-0 bottom-0 w-0.5 border-l border-dashed border-slate-300" />
                  
                  {/* Événement Actif */}
                  <motion.div 
                    className="flex items-start gap-3 relative z-10"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="flex flex-col items-center relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900 z-10 relative" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <div>
                            <span className="text-sm font-light text-slate-900 block">Stratégie Q4</span>
                            <span className="text-xs text-slate-500">Réunion équipe</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-light text-slate-900">14:00</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>Salle A</span>
                        </div>
                        <span>•</span>
                        <span>5 participants</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Événement Passé */}
                  <motion.div 
                    className="flex items-start gap-3 relative z-10 opacity-50"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 0.5, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <div className="flex flex-col items-center relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400 z-10 relative">
                        <CheckCircle className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <div>
                            <span className="text-sm font-light text-slate-600 block">Déjeuner</span>
                            <span className="text-xs text-slate-400">Restaurant Le Jardin</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-light">12:30</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Événement À Venir */}
                  <motion.div 
                    className="flex items-start gap-3 relative z-10 opacity-60"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 0.6, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <div className="flex flex-col items-center relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400 z-10 relative" />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <div>
                            <span className="text-sm font-light text-slate-600 block">Appel Client</span>
                            <span className="text-xs text-slate-400">Suivi projet</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-600 font-light">16:00</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* B. Carte "Stock Vivant" - Haute et Sombre (2 colonnes, row-span-2) */}
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 rounded-2xl bg-slate-900 p-6 border border-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.3)] relative overflow-hidden"
          style={{ position: 'relative', willChange: 'transform, opacity' }}
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-xl font-light text-white"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Stock 
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-full border border-slate-700">
                  <Activity className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-light text-slate-400">Live</span>
                </div>
              </div>
              
              {/* Liste de Produits Minimaliste */}
              <div className="flex-1 space-y-3">
                {/* Produit Critique */}
                <motion.div 
                  className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 relative"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-light text-white">MacBook Pro</span>
                    </div>
                    <span className="text-xs text-slate-400 font-light">CRITIQUE</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">2 / 50</span>
                      <span className="text-slate-300 font-light">4%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        ref={stockBarRef}
                        className="h-full bg-slate-600 rounded-full"
                        initial={{ width: '4%' }}
                        animate={{ width: ['4%', '6%', '4%'] }}
                        transition={{ 
                          duration: 1.2, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Produit Normal */}
                <motion.div 
                  className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-light text-slate-200">iPhone 15</span>
                    </div>
                    <span className="text-xs text-slate-500">OK</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">45 / 50</span>
                      <span className="text-slate-300 font-light">90%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-slate-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '90%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Produit Attention */}
                <motion.div 
                  className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-light text-slate-200">AirPods Pro</span>
                    </div>
                    <span className="text-xs text-slate-500">ATTENTION</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">12 / 50</span>
                      <span className="text-slate-300 font-light">24%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-slate-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '24%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* C. Carte "Flux Financier" - Carré (2 colonnes) */}
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: 'transform, opacity' }}
            className="md:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 relative"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <h3
                  className="text-xl font-light text-slate-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Flux Financier
                </h3>
              </div>
              
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">+108%</span>
                <span className="text-xs text-slate-400">vs mois dernier</span>
              </div>
              
              {/* Histogramme Minimaliste */}
              <div className="flex-1 flex items-end justify-between gap-2 relative" style={{ height: '140px', minHeight: '140px' }}>
                {[
                  { height: 60, month: 'Jan', value: '12k' },
                  { height: 75, month: 'Fév', value: '15k' },
                  { height: 85, month: 'Mar', value: '18k' },
                  { height: 95, month: 'Avr', value: '22k' },
                  { height: 100, month: 'Mai', value: '25k' },
                ].map((bar, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full relative"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    style={{ position: 'relative', willChange: 'opacity' }}
                  >
                    <motion.div 
                      className="w-full bg-slate-800 rounded-t mb-1.5"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ 
                        duration: 0.6, 
                        delay: i * 0.1, 
                        ease: [0.22, 1, 0.36, 1] 
                      }}
                      style={{ 
                        height: `${bar.height}%`,
                        transformOrigin: 'bottom',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none">
                        <span className="text-[10px] font-light text-slate-700">
                          {bar.value}
                        </span>
                      </div>
                    </motion.div>
                    <span className="text-xs text-slate-500">
                      {bar.month}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* D. Carte "CRM 360°" - Carré (2 colonnes) */}
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden"
          style={{ position: 'relative', willChange: 'transform, opacity' }}
          onMouseEnter={() => handleHover('crm')}
          onMouseLeave={() => handleHover(null)}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <h3
                  className="text-xl font-light text-slate-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  CRM 360°
                </h3>
              </div>
              
              {/* Statistiques */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">Contacts actifs</div>
                  <div className="text-base font-light text-slate-900">4,247</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">Nouveaux ce mois</div>
                  <div className="text-base font-light text-slate-900">+127</div>
                </div>
              </div>
              
              {/* Pile d'Avatars */}
              <div className="flex-1 flex items-end justify-end relative min-h-[120px]" style={{ position: 'relative' }}>
                <div className="relative w-40 h-40">
                  {/* Avatar 1 - Se déplace vers la gauche en éventail */}
                  <motion.div 
                    className="absolute bottom-0 right-0 w-14 h-14 rounded-full border-[3px] border-white shadow-xl cursor-pointer group/avatar relative overflow-hidden"
                    role="img"
                    aria-label="Avatar de Le Maneq M."
                    initial={{ x: 0, y: 0, scale: 1, rotate: 0, zIndex: 10 }}
                    animate={isHovered === 'crm' && !isMobile ? {
                      x: -60,
                      y: -20,
                      scale: 1.5,
                      rotate: -15,
                      zIndex: 30,
                    } : {
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                      zIndex: 10,
                    }}
                    transition={{ 
                      duration: isMobile ? 0.3 : 0.7, 
                      ease: [0.22, 1, 0.36, 1],
                      type: "spring",
                      stiffness: isMobile ? 200 : 100
                    }}
                    whileHover={isMobile ? {} : { scale: 1.6, zIndex: 40 }}
                  >
                    <img
                      src="/avatar/Avatar1.jpg"
                      alt="Avatar de Le Maneq M."
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap">
                      <span className="text-[10px] font-light text-slate-700 bg-white px-2 py-1 rounded shadow-lg border border-slate-200">
                        Le Maneq M.
                      </span>
                    </div>
                  </motion.div>
                  
                  {/* Avatar 2 - Reste au centre, s'agrandit */}
                  <motion.div 
                    className="absolute bottom-0 right-0 w-14 h-14 rounded-full border-[3px] border-white shadow-xl cursor-pointer group/avatar relative overflow-hidden"
                    role="img"
                    aria-label="Avatar de Marion K."
                    initial={{ x: 12, y: 0, scale: 1, rotate: 0, zIndex: 20 }}
                    animate={isHovered === 'crm' ? {
                      x: -20,
                      y: -40,
                      scale: 1.5,
                      rotate: 0,
                      zIndex: 30,
                    } : {
                      x: 12,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                      zIndex: 20,
                    }}
                    transition={{ 
                      duration: 0.7, 
                      delay: 0.05,
                      ease: [0.22, 1, 0.36, 1],
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ scale: 1.6, zIndex: 40 }}
                  >
                    <img
                      src="/avatar/Avatar2.jpg"
                      alt="Avatar de Marion K."
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap">
                      <span className="text-[10px] font-light text-slate-700 bg-white px-2 py-1 rounded shadow-lg border border-slate-200">
                        Marion K.
                      </span>
                    </div>
                  </motion.div>
                  
                  {/* Avatar 3 - Se déplace vers la droite en éventail */}
                  <motion.div 
                    className="absolute bottom-0 right-0 w-14 h-14 rounded-full border-[3px] border-white shadow-xl cursor-pointer group/avatar relative overflow-hidden"
                    role="img"
                    aria-label="Avatar de Marie L."
                    initial={{ x: 24, y: 0, scale: 1, rotate: 0, zIndex: 30 }}
                    animate={isHovered === 'crm' && !isMobile ? {
                      x: 20,
                      y: -20,
                      scale: 1.5,
                      rotate: 15,
                      zIndex: 30,
                    } : {
                      x: 24,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                      zIndex: 30,
                    }}
                    transition={{ 
                      duration: isMobile ? 0.3 : 0.7, 
                      delay: isMobile ? 0 : 0.1,
                      ease: [0.22, 1, 0.36, 1],
                      type: "spring",
                      stiffness: isMobile ? 200 : 100
                    }}
                    whileHover={isMobile ? {} : { scale: 1.6, zIndex: 40 }}
                  >
                    <img
                      src="/avatar/Avatar3.jpg"
                      alt="Avatar de Marie L."
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap">
                      <span className="text-[10px] font-light text-slate-700 bg-white px-2 py-1 rounded shadow-lg border border-slate-200">
                        Marie L.
                      </span>
                    </div>
                  </motion.div>
                  
                  {/* Badge +4k - Se déplace vers le haut */}
                  <motion.div 
                    className="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-slate-800 border-[3px] border-white shadow-xl flex items-center justify-center text-white text-xs font-light cursor-pointer"
                    initial={{ x: 36, y: 0, scale: 1, zIndex: 40 }}
                    animate={isHovered === 'crm' && !isMobile ? {
                      x: 0,
                      y: -60,
                      scale: 1.5,
                      zIndex: 30,
                    } : {
                      x: 36,
                      y: 0,
                      scale: 1,
                      zIndex: 40,
                    }}
                    transition={{ 
                      duration: isMobile ? 0.3 : 0.7, 
                      delay: isMobile ? 0 : 0.15,
                      ease: [0.22, 1, 0.36, 1],
                      type: "spring",
                      stiffness: isMobile ? 200 : 100
                    }}
                    whileHover={isMobile ? {} : { scale: 1.6, zIndex: 40 }}
                  >
                    {isHovered === 'crm' ? (
                      <motion.span
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                      >
                        +4k
                      </motion.span>
                    ) : (
                      <span>+4k</span>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* E. Carte "Booh AI" - Carré (2 colonnes) */}
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 rounded-2xl bg-slate-900 p-6 border border-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.3)] relative overflow-hidden"
          style={{ position: 'relative', willChange: 'transform, opacity' }}
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <h3
                    className="text-xl font-light text-white"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    Recommandation de l'Ia
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <span className="text-xs text-slate-400">En ligne</span>
                </div>
              </div>
              
              {/* Interface de Chat Minimaliste */}
              <motion.div 
                className="flex-1 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="space-y-3">
                  {/* Message de l'IA */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-light flex-shrink-0">
                      AI
                    </div>
                    <div className="flex-1 bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-200 font-light">
                            Le stock de <span className="font-light text-white">MacBook Pro</span> baisse.
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Recommander une commande ?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 ml-10">
                    <button className="px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-light rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Commander
                    </button>
                    <button className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-light rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Ignorer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

BentoGrid.displayName = 'BentoGrid';

// --- PHONE COMPONENTS ---
const PhoneScreenContent = ({ visual }: { visual: string }) => {
  // Mémoriser les valeurs aléatoires pour éviter les re-renders
  const qrCodePattern = useMemo(() => {
    return Array.from({ length: 16 }, () => Math.random() > 0.5);
  }, []);
  
  return (
    <div
      className={`w-full h-full relative pt-8 md:pt-12 lg:pt-14 px-2 md:px-4 lg:px-5 flex flex-col font-sans overflow-hidden transition-colors duration-[500ms] ${
        visual === 'ocr' ? 'bg-slate-900' : visual === 'card' ? 'bg-[#0f172a]' : 'bg-[#FAFAFA]'
      }`}
    >
      <div
        className={`absolute top-2 md:top-4 lg:top-5 left-0 w-full px-3 md:px-6 lg:px-8 flex justify-between text-[8px] md:text-[10px] lg:text-[11px] font-light z-50 ${
          visual === 'ocr' || visual === 'card' 
            ? 'text-white' 
            : 'text-slate-950'
        }`}
        style={{
          textShadow: visual === 'ocr' || visual === 'card' 
            ? '0 1px 2px rgba(0,0,0,0.3)' 
            : '0 1px 2px rgba(255,255,255,0.8)',
          WebkitTextStroke: visual === 'ocr' || visual === 'card'
            ? '0.3px rgba(0,0,0,0.2)'
            : '0.3px rgba(255,255,255,0.5)'
        }}
      >
        <span className="font-light text-[8px] md:text-[10px] lg:text-[11px]">9:41</span>
        <div className="flex gap-1 md:gap-1.5 items-center">
          <Signal size={10} strokeWidth={2.5} className={`${visual === 'ocr' || visual === 'card' ? 'text-white' : 'text-slate-950'} w-[10px] h-[10px] md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]`} />
          <Wifi size={10} strokeWidth={2.5} className={`${visual === 'ocr' || visual === 'card' ? 'text-white' : 'text-slate-950'} w-[10px] h-[10px] md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]`} />
          <Battery size={10} strokeWidth={2.5} className={`${visual === 'ocr' || visual === 'card' ? 'text-white' : 'text-slate-950'} w-[10px] h-[10px] md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px]`} />
        </div>
      </div>

      {visual === 'invoice' && (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-3 md:mb-4 lg:mb-6 mt-1 md:mt-1.5 lg:mt-2">
            <div className="p-1.5 md:p-1.5 lg:p-2 bg-white rounded-full shadow-sm border border-slate-100">
              <Menu size={12} className="text-slate-900 w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[18px] lg:h-[18px]" />
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] md:text-[9px] lg:text-[10px] font-light ring-2 ring-white shadow-lg">
              QE
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 lg:p-5 rounded-[16px] md:rounded-[20px] lg:rounded-[24px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] border border-slate-100 mb-3 md:mb-4 lg:mb-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-purple-500/5 rounded-full blur-2xl -mr-8 md:-mr-9 lg:-mr-10 -mt-8 md:-mt-9 lg:-mt-10 group-hover:bg-purple-500/1 transition-colors" />
            <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3 mb-2 md:mb-2.5 lg:mb-3 relative z-10">
              <div className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-lg md:rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <FileText size={12} strokeWidth={2.5} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
              </div>
              <h2 className="text-sm md:text-base lg:text-lg font-light text-slate-900 tracking-tight">Facturation</h2>
            </div>
            <p className="text-[9px] md:text-[10px] lg:text-[11px] text-slate-400 font-light ml-0.5 md:ml-1 relative z-10 leading-tight">Gérez vos factures et devis en temps réel.</p>
          </div>
          <div className="flex gap-2 md:gap-2.5 lg:gap-3 mb-3 md:mb-4 lg:mb-6">
            <button className="flex-1 h-9 md:h-10 lg:h-12 rounded-lg md:rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 active:scale-95 transition-transform" aria-label="Ajouter une facture">
              <Plus size={14} className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
            </button>
            <button className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl bg-white text-slate-900 border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95 transition-transform" aria-label="Voir la liste">
              <List size={14} strokeWidth={1.5} className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
            </button>
            <button className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl bg-white text-slate-900 border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95 transition-transform" aria-label="Paramètres">
              <Settings size={14} strokeWidth={1.5} className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-2.5 lg:gap-3 mb-2 md:mb-3 lg:mb-4 flex-1 overflow-hidden pb-6 md:pb-8 lg:pb-10">
            {[
              { label: 'Total', val: '95', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Payées', val: '62', icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'En attente', val: '7', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Alertes', val: '2', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' }
            ].map((s, i) => (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-white p-2.5 md:p-3 lg:p-4 rounded-[14px] md:rounded-[16px] lg:rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between aspect-square relative overflow-hidden group hover:border-slate-200 transition-colors"
              >
                <div className={`self-end p-1.5 md:p-1.5 lg:p-2 rounded-full ${s.bg} ${s.color} relative z-10`}>
                  <s.icon size={10} strokeWidth={2.5} className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                </div>
                <div className="relative z-10">
                  <div className="text-[7px] md:text-[8px] lg:text-[9px] font-light text-slate-400 uppercase tracking-wide mb-0.5 md:mb-1">{s.label}</div>
                  <div className="text-lg md:text-xl lg:text-2xl font-light text-slate-900 tracking-tighter">{s.val}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {visual === 'stock' && (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 mt-2 px-1">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-light ring-2 ring-white shadow-lg cursor-pointer hover:scale-105 transition-transform">
              QE
            </div>
          </div>
          <div className="bg-white p-6 rounded-[30px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-100 mb-8 relative overflow-hidden text-center flex flex-col items-center justify-center gap-4">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 z-10">
              <Box size={24} strokeWidth={1.5} />
            </div>
            <div className="z-10">
              <h2 className="text-3xl font-light text-slate-900 tracking-tighter leading-none mb-2">
                Gestion
                <br />de <span className="relative inline-block">Stock</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-light max-w-[150px] mx-auto leading-relaxed">
                Gérez votre inventaire et suivez vos stocks
              </p>
            </div>
          </div>
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
              <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20" aria-label="Vue liste">
                <List size={18} strokeWidth={2} aria-hidden="true" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-transparent text-slate-400 hover:bg-slate-50 flex items-center justify-center transition-colors" aria-label="Vue grille">
                <Grid size={18} strokeWidth={2} aria-hidden="true" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-transparent text-slate-400 hover:bg-slate-50 flex items-center justify-center transition-colors" aria-label="Filtrer">
                <Filter size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-1 pb-10 overflow-hidden">
            {[{ label: 'Total Articles', val: '3', icon: Package, accent: 'from-blue-500 to-purple-500' },
              { label: 'En Stock', val: '3', icon: CheckCircle, accent: 'from-emerald-400 to-teal-500' },
              { label: 'Stock Faible', val: '0', icon: AlertTriangle, accent: 'from-amber-400 to-orange-500' },
              { label: 'Rupture', val: '0', icon: AlertOctagon, accent: 'from-red-500 to-pink-600' }].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * (i + 1) }}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex flex-col justify-between h-40 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start z-10">
                  <div className="text-[10px] font-light text-slate-400 uppercase tracking-widest leading-tight">
                    {item.label.replace(' ', '\n')}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <item.icon size={14} />
                  </div>
                </div>
                <div className="text-4xl font-light text-slate-900 tracking-tighter z-10">{item.val}</div>
                <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${item.accent} opacity-80`} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {visual === 'calendar' && (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 mt-2 px-1">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
              <Menu size={18} className="text-slate-900" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-light ring-2 ring-white shadow-lg cursor-pointer hover:scale-105 transition-transform">
              QE
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 mb-1">
                <Clock size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-light text-slate-900 tracking-tight leading-none mb-2">Paramètres de disponibilité</h2>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed max-w-[200px]">Configurez vos horaires de travail.</p>
              </div>
              <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs font-light tracking-wide shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group">
                <Settings size={14} className="group-hover:scale-110 transition-transform" />
                Enregistrer
              </button>
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-5">
            <button className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-light shadow-md transition-all flex items-center justify-center gap-2">
              <CalendarDays size={14} />
              Calendrier
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-slate-500 text-[11px] font-light hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Sliders size={14} />
              Gestion
            </button>
          </div>
          <div className="flex-1 overflow-hidden pb-8">
            <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-light text-slate-900">Horaires de travail</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-light text-slate-900">Lundi</span>
                    <button className="text-[10px] font-light bg-slate-900 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-800 transition-colors">
                      <Plus size={10} strokeWidth={3} />
                      Ajouter
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-light text-slate-700 tracking-wider font-mono">08:00</div>
                    <div className="h-px w-3 bg-slate-300" />
                    <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-light text-slate-700 tracking-wider font-mono">17:00</div>
                    <button className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" aria-label="Supprimer l'horaire">
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-light text-slate-500">Mardi</span>
                  <Plus size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {visual === 'ocr' && (
        <div className="h-full flex flex-col items-center justify-center relative z-20">
          <div className="relative z-10 w-full max-w-[95%] md:max-w-[90%] bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl">
            <div className="px-3 md:px-4 lg:px-5 py-2 md:py-3 lg:py-4 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg md:rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Camera size={10} className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                </div>
                <h2 className="text-xs md:text-sm lg:text-lg font-light text-slate-900">Scanner de carte</h2>
              </div>
              <button className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" aria-label="Fermer le scanner">
                <X size={12} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-2 md:p-3 lg:p-4">
              <div className="relative w-full aspect-[4/3] bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-4 lg:mb-6 group">
                <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-slate-700 to-slate-900" />
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.1)_50%,transparent_100%)] h-[200%] w-full animate-[scan_3s_linear_infinite] pointer-events-none" />
                <div className="absolute top-2 md:top-3 lg:top-4 left-2 md:left-3 lg:left-4 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 border-t-2 md:border-t-3 lg:border-t-4 border-l-2 md:border-l-3 lg:border-l-4 border-emerald-400 rounded-tl-lg md:rounded-tl-xl opacity-80" />
                <div className="absolute top-2 md:top-3 lg:top-4 right-2 md:right-3 lg:right-4 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 border-t-2 md:border-t-3 lg:border-t-4 border-r-2 md:border-r-3 lg:border-r-4 border-emerald-400 rounded-tr-lg md:rounded-tr-xl opacity-80" />
                <div className="absolute bottom-2 md:bottom-3 lg:bottom-4 left-2 md:left-3 lg:left-4 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 border-b-2 md:border-b-3 lg:border-b-4 border-l-2 md:border-l-3 lg:border-l-4 border-emerald-400 rounded-bl-lg md:rounded-bl-xl opacity-80" />
                <div className="absolute bottom-2 md:bottom-3 lg:bottom-4 right-2 md:right-3 lg:right-4 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 border-b-2 md:border-b-3 lg:border-b-4 border-r-2 md:border-r-3 lg:border-r-4 border-emerald-400 rounded-br-lg md:rounded-br-xl opacity-80" />
                <div className="absolute top-2 md:top-3 lg:top-4 left-0 w-full flex flex-col items-center gap-1 md:gap-2 pointer-events-none">
                  <div className="bg-amber-400 text-amber-950 px-2 md:px-2.5 lg:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] lg:text-[10px] font-light flex items-center gap-1 md:gap-1.5 shadow-lg animate-pulse">
                    <Sun size={8} className="w-2 h-2 md:w-2.25 md:h-2.25 lg:w-2.5 lg:h-2.5" />
                    <span className="whitespace-nowrap">Ajustez l'éclairage</span>
                  </div>
                </div>
                <div className="absolute bottom-2 md:bottom-3 lg:bottom-4 left-0 w-full flex justify-center">
                  <button className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform active:scale-95" aria-label="Prendre une photo">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-slate-900 rounded-full" aria-hidden="true" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:gap-3">
                <button className="w-full py-2 md:py-2.5 lg:py-3 text-[10px] md:text-[11px] lg:text-xs font-light text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5 md:gap-2">
                  <X size={10} className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                  Arrêter
                </button>
                <button className="w-full py-2.5 md:py-3 lg:py-3.5 rounded-lg md:rounded-xl border border-slate-200 text-slate-700 text-[10px] md:text-[11px] lg:text-xs font-light hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 md:gap-2">
                  <Upload size={10} className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                  Upload fichier
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 text-white/50 text-[8px] md:text-[9px] lg:text-[10px] font-light tracking-widest uppercase">Scanner Intelligent v2.0</div>
        </div>
      )}

      {visual === 'card' && (
        <div className="h-full flex flex-col text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full px-2 md:px-4 lg:px-5 pt-4 md:pt-6 lg:pt-8 pb-2 md:pb-3 lg:pb-4 overflow-hidden">
            <div className="flex flex-col items-center mt-3 md:mt-4 lg:mt-6 mb-3 md:mb-4 lg:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full p-0.5 md:p-1 bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20 mb-2 md:mb-3 lg:mb-4">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-900">
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                </div>
              </div>
              <h2 className="text-base md:text-xl lg:text-2xl font-light tracking-tight mb-0.5 md:mb-1">John Doe</h2>
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/5 px-2 md:px-2.5 lg:px-3 py-0.5 md:py-1 rounded-full border border-white/10 backdrop-blur-md">
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[6px] md:text-[7px] lg:text-[8px] font-light text-black">
                  M
                </div>
                <span className="text-[9px] md:text-[10px] lg:text-xs font-light text-slate-300">Miscoch IT</span>
              </div>
            </div>
            <div className="flex justify-center gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6 lg:mb-8">
              {[
                { Icon: Phone, label: 'Téléphone' },
                { Icon: Mail, label: 'Email' },
                { Icon: Globe, label: 'Site web' },
                { Icon: Linkedin, label: 'LinkedIn' }
              ].map(({ Icon, label }, i) => (
                <button
                  key={i}
                  className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white hover:scale-110 transition-all backdrop-blur-sm"
                  aria-label={label}
                >
                  <Icon size={12} strokeWidth={1.5} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="bg-slate-900/50 p-0.5 md:p-1 rounded-lg md:rounded-xl flex mb-3 md:mb-4 lg:mb-6 border border-white/5">
              <button className="flex-1 py-1.5 md:py-1.5 lg:py-2 rounded-md md:rounded-lg bg-white text-slate-900 text-[9px] md:text-[10px] lg:text-xs font-light shadow-lg">Liens</button>
              <button className="flex-1 py-1.5 md:py-1.5 lg:py-2 rounded-md md:rounded-lg text-slate-400 text-[9px] md:text-[10px] lg:text-xs font-light hover:text-white transition-colors">Boutique</button>
            </div>
            <div className="space-y-2 md:space-y-2.5 lg:space-y-3 flex-1">
              <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-2.5 md:p-3 lg:p-4 flex justify-between items-center backdrop-blur-sm">
                <span className="text-[10px] md:text-[11px] lg:text-sm font-light">En savoir plus</span>
                <div className="w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Plus size={10} className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl md:rounded-2xl p-2 md:p-2.5 lg:p-3 flex items-center gap-2 md:gap-2.5 lg:gap-3 backdrop-blur-md hover:bg-white/15 transition-colors group cursor-pointer">
                <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg md:rounded-xl bg-slate-900 flex items-center justify-center text-yellow-400 border border-white/10 shadow-lg">
                  <div className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 rounded bg-gradient-to-br from-yellow-400 to-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] md:text-[11px] lg:text-sm font-light truncate">Miscoch IT</div>
                  <div className="text-[8px] md:text-[9px] lg:text-[10px] text-slate-400 truncate">https://miscoch-it.ga</div>
                </div>
                <div className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0">
                  <ArrowRightCircle size={14} className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" />
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl md:rounded-2xl p-2 md:p-2.5 lg:p-3 flex items-center gap-2 md:gap-2.5 lg:gap-3 backdrop-blur-md hover:bg-white/15 transition-colors group cursor-pointer">
                <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg md:rounded-xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-lg text-white font-light text-[10px] md:text-[11px] lg:text-sm">B.</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] md:text-[11px] lg:text-sm font-light truncate">booh</div>
                  <div className="text-[8px] md:text-[9px] lg:text-[10px] text-slate-400 truncate">https://booh.ga</div>
                </div>
                <div className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0">
                  <ArrowRightCircle size={14} className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-2.5 lg:gap-3 mt-2 md:mt-3 lg:mt-4">
              <button className="aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 md:gap-1.5 lg:gap-2 hover:bg-white/20 transition-all backdrop-blur-md group p-1 md:p-1.5">
                <QrCode size={14} className="text-cyan-400 group-hover:scale-110 transition-transform w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                <span className="text-[7px] md:text-[8px] lg:text-[9px] font-light text-center leading-tight">Scanner
                  <br />QR Code</span>
              </button>
              <button className="aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 flex flex-col items-center justify-center gap-1 md:gap-1.5 lg:gap-2 hover:bg-purple-500/30 transition-all backdrop-blur-md group p-1 md:p-1.5">
                <Download size={14} className="text-purple-400 group-hover:scale-110 transition-transform w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                <span className="text-[7px] md:text-[8px] lg:text-[9px] font-light text-center leading-tight">Enregistrer
                  <br />Contact</span>
              </button>
              <button className="aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 md:gap-1.5 lg:gap-2 hover:bg-white/20 transition-all backdrop-blur-md group p-1 md:p-1.5">
                <Calendar size={14} className="text-emerald-400 group-hover:scale-110 transition-transform w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                <span className="text-[7px] md:text-[8px] lg:text-[9px] font-light text-center leading-tight">Prendre
                  <br />RDV</span>
              </button>
            </div>
            <div className="mt-3 md:mt-4 lg:mt-6 mx-auto bg-white p-2 md:p-3 lg:p-4 w-full rounded-t-[20px] md:rounded-t-[25px] lg:rounded-t-[30px] -mb-8 md:-mb-9 lg:-mb-10 opacity-90 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="w-8 md:w-10 lg:w-12 h-0.5 md:h-1 bg-slate-200 rounded-full mx-auto mb-1 md:mb-1.5 lg:mb-2" />
              <div className="text-center text-slate-900 font-light text-[9px] md:text-[10px] lg:text-xs">Avis Clients</div>
            </div>
          </div>
        </div>
      )}

      {visual === 'shop' && (
        <div className="h-full flex flex-col bg-slate-50 relative pt-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-light text-slate-500">3 produits trouvés</span>
          </div>
          <div className="flex-1 overflow-hidden px-5 pb-10 space-y-4">
            {[imgLocal.product1, imgLocal.product2, imgLocal.product3].map((src, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 relative overflow-hidden group"
              >
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-[10px] font-light shadow-sm border border-slate-100 flex items-center gap-1">
                  <Box size={10} />
                  Physique
                </div>
                <div className="w-full h-40 bg-slate-100 rounded-[1.5rem] mb-4 overflow-hidden relative">
                  <img
                    src={src}
                    alt={`Produit ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback vers placeholder si image échoue
                      const target = e.target as HTMLImageElement;
                      target.src = imgLocal.placeholder;
                    }}
                  />
                </div>
                <div className="mb-4 px-1">
                  <h3 className="text-sm font-light text-slate-900 mb-1">Produit signature</h3>
                  <p className="text-[11px] text-slate-400 font-light leading-tight">Edition limitée.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-xl font-light text-slate-900 tracking-tight">350.0K FCFA</div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-light flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
                      <Plus size={14} />
                      Ajouter
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs font-light hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <Eye size={14} />
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visual === 'portfolio' && (
        <div className="h-full flex flex-col bg-[#FAFAFA] relative pt-2">
          <div className="px-5 mb-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                aria-label="Rechercher un projet"
                className="w-full bg-white pl-12 pr-4 py-4 rounded-[20px] text-sm font-light shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" aria-label="Vue grille">
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
                <button className="p-2 rounded-lg bg-slate-900 text-white shadow-md" aria-label="Vue liste" aria-pressed="true">
                  <List size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-light shadow-lg shadow-slate-900/20 flex items-center gap-2">
                  <Filter size={10} />
                  Tous <span className="bg-white/20 px-1.5 rounded-md">1</span>
                </button>
                <button className="px-4 py-2 rounded-xl bg-white text-slate-500 border border-slate-100 text-[10px] font-light hover:bg-slate-50 transition-colors">
                  Design 1
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-5 pb-10">
            <div className="text-[10px] font-light text-slate-400 uppercase tracking-widest mb-4">1 projet trouvé</div>
            <div className="bg-white rounded-[32px] p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 group cursor-pointer hover:scale-[1.02] transition-transform duration-500">
              <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-5 relative">
                <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-light text-slate-900 shadow-sm flex items-center gap-1.5">
                  <Sparkles size={10} className="text-purple-500" />
                  Design
                </div>
                <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-light text-white flex items-center gap-1">
                  <Layers size={10} />
                  3D
                </div>
                <div className="grid grid-cols-2 gap-1 h-full">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200" />
                  <div className="grid grid-rows-2 gap-1 h-full">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200" />
                    <div className="bg-gradient-to-br from-slate-200 to-slate-300" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-light text-slate-900 leading-tight mb-2">TERRE NOIRE : Identité Visuelle</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                Expérience café valorisant la traçabilité et les méthodes artisanales.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Design', 'Branding', 'Café'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-light border border-slate-100">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-light text-slate-400">
                  <Calendar size={12} />
                  Octobre 2025
                </div>
                <button className="flex items-center gap-1 text-xs font-light text-slate-900 group-hover:gap-2 transition-all">
                  Voir le projet
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {visual === 'chart' && (
        <div className="h-full flex flex-col bg-[#FAFAFA] relative pt-2">
          <div className="mx-5 mt-4 bg-gradient-to-br from-white to-slate-50 p-6 rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 mb-1">
                <BarChart4 size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-light text-slate-900 tracking-tight leading-none mb-2">Statistiques</h2>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed max-w-[200px]">Analysez les performances.</p>
              </div>
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex justify-between">
                {['7 jours', '30 jours', '3 mois', '1 an'].map((label, idx) => (
                  <button
                    key={label}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-light ${idx === 1 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900 transition-colors'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-5 grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Vues totales', val: '273', icon: Infinity },
              { label: 'Vues / jour', val: '9.1', icon: Calendar },
              { label: 'Tendance', val: '↗', icon: BarChart3 },
              { label: 'Visiteurs un...', val: '23', icon: Users },
              { label: 'Total des cli...', val: '29', icon: MousePointer2 },
              { label: 'Taux de con...', val: '10.6%', icon: Target }
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-colors"
              >
                <div>
                  <div className="text-[10px] font-light text-slate-400 mb-1">{stat.label}</div>
                  <div className="text-lg font-light text-slate-900 tracking-tight">{stat.val}</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <stat.icon size={14} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden px-5 pb-10">
            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <BarChart3 size={14} />
                </div>
                <h3 className="text-sm font-light text-slate-900">Statistiques détaillées</h3>
              </div>
              <div className="h-32 flex items-end justify-between gap-2 px-2">
                {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                  <div
                    key={i}
                    className="w-full bg-slate-100 rounded-t-lg relative group hover:bg-slate-200 transition-colors"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-light px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}
                    </div>
                    <div className="absolute bottom-0 w-full h-1 bg-slate-900/10" />
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rounded-full border-2 border-white shadow-sm" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 px-1">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span key={i} className="text-[9px] font-light text-slate-400 w-full text-center">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {visual === 'map' && (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
          {/* Fond de carte stylisée */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-slate-50 to-green-50">
            {/* Carte SVG stylisée */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
              {/* Routes principales */}
              <g stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.4">
                {/* Route horizontale principale */}
                <line x1="0" y1="150" x2="400" y2="150" />
                <line x1="0" y1="250" x2="400" y2="250" />
                <line x1="0" y1="350" x2="400" y2="350" />
                <line x1="0" y1="450" x2="400" y2="450" />
                
                {/* Route verticale principale */}
                <line x1="100" y1="0" x2="100" y2="600" />
                <line x1="200" y1="0" x2="200" y2="600" />
                <line x1="300" y1="0" x2="300" y2="600" />
              </g>
              
              {/* Routes secondaires */}
              <g stroke="#e2e8f0" strokeWidth="1" fill="none" opacity="0.3">
                <line x1="0" y1="100" x2="400" y2="100" />
                <line x1="0" y1="200" x2="400" y2="200" />
                <line x1="0" y1="300" x2="400" y2="300" />
                <line x1="0" y1="400" x2="400" y2="400" />
                <line x1="0" y1="500" x2="400" y2="500" />
                
                <line x1="50" y1="0" x2="50" y2="600" />
                <line x1="150" y1="0" x2="150" y2="600" />
                <line x1="250" y1="0" x2="250" y2="600" />
                <line x1="350" y1="0" x2="350" y2="600" />
              </g>
              
              {/* Bâtiments/Blocs */}
              <g fill="#f1f5f9" opacity="0.5">
                {/* Bloc 1 */}
                <rect x="20" y="80" width="60" height="50" rx="2" />
                <rect x="25" y="85" width="50" height="40" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 2 */}
                <rect x="120" y="120" width="70" height="60" rx="2" />
                <rect x="125" y="125" width="60" height="50" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 3 */}
                <rect x="220" y="90" width="80" height="70" rx="2" />
                <rect x="225" y="95" width="70" height="60" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 4 */}
                <rect x="50" y="280" width="90" height="80" rx="2" />
                <rect x="55" y="285" width="80" height="70" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 5 */}
                <rect x="180" y="320" width="100" height="90" rx="2" />
                <rect x="185" y="325" width="90" height="80" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 6 */}
                <rect x="300" y="280" width="70" height="60" rx="2" />
                <rect x="305" y="285" width="60" height="50" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 7 */}
                <rect x="30" y="420" width="80" height="70" rx="2" />
                <rect x="35" y="425" width="70" height="60" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 8 */}
                <rect x="150" y="450" width="90" height="80" rx="2" />
                <rect x="155" y="455" width="80" height="70" fill="#e2e8f0" opacity="0.6" />
                
                {/* Bloc 9 */}
                <rect x="280" y="420" width="100" height="90" rx="2" />
                <rect x="285" y="425" width="90" height="80" fill="#e2e8f0" opacity="0.6" />
              </g>
              
              {/* Parcs/Verts */}
              <g fill="#dcfce7" opacity="0.4">
                <ellipse cx="80" cy="200" rx="40" ry="30" />
                <ellipse cx="250" cy="180" rx="35" ry="25" />
                <ellipse cx="320" cy="380" rx="45" ry="35" />
                <ellipse cx="120" cy="380" rx="30" ry="20" />
              </g>
              
              {/* Routes avec marquage */}
              <g stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3">
                <line x1="0" y1="150" x2="400" y2="150" />
                <line x1="100" y1="0" x2="100" y2="600" />
              </g>
            </svg>
            
            {/* Overlay pour effet de profondeur */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/30" />
          </div>
          
          {/* Top Bar */}
          <div className="relative z-10 px-2 md:px-3 lg:px-4 pt-2 md:pt-2.5 lg:pt-3 pb-1.5 md:pb-1.5 lg:pb-2 flex items-center justify-between bg-white/80 backdrop-blur-sm">
            {/* Hamburger menu */}
            <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-md md:rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors" aria-label="Menu">
              <Menu size={12} strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-[18px] lg:h-[18px]" aria-hidden="true" />
            </button>
            
            {/* Search input */}
            <div className="flex-1 mx-1.5 md:mx-2 lg:mx-3 bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 px-2 md:px-2.5 lg:px-3 py-1.5 md:py-1.5 lg:py-2 flex items-center gap-1.5 md:gap-2">
              <Search size={10} className="text-slate-400 w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" strokeWidth={2} />
              <input
                type="text"
                placeholder="es"
                aria-label="Rechercher sur la carte"
                className="flex-1 bg-transparent text-[9px] md:text-[10px] lg:text-xs font-light text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
            
            {/* Filter avec badge */}
            <button className="relative w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-md md:rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors" aria-label="Filtres (13 résultats)">
              <Sliders size={12} strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
              <span className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 rounded-full bg-slate-900 text-white text-[6px] md:text-[7px] lg:text-[8px] font-light flex items-center justify-center" aria-hidden="true">13</span>
            </button>
            
            {/* Profile icon */}
            <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center ml-1 md:ml-1.5 lg:ml-2 hover:bg-slate-300 transition-colors" aria-label="Profil">
              <User size={12} strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
            </button>
          </div>
          
          {/* Map Section avec Points d'intérêt */}
          <div className="flex-1 relative z-0">
            {/* Points d'intérêt sur la carte */}
            {[
              { x: '15%', y: '25%', type: 'restaurant', name: 'Entre Restaurant', icon: '🍽️' },
              { x: '25%', y: '20%', type: 'restaurant', name: 'La Sauce Créole Restaurant', icon: '🍽️' },
              { x: '35%', y: '30%', type: 'hotel', name: "Hôtel Résidence Le Jomonia", icon: '🏨' },
              { x: '45%', y: '15%', type: 'business', name: "AUBERGE D'AMBOWE", icon: '🏢' },
              { x: '65%', y: '35%', type: 'shop', name: 'Carrefour Market', icon: '🛒' },
              { x: '55%', y: '50%', type: 'location', name: 'Saoti.', icon: '📍' }
            ].map((poi, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: poi.x, top: poi.y, transform: 'translate(-50%, -50%)' }}
              >
                <div className="relative group">
                  <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-white border-2 border-slate-300 shadow-md flex items-center justify-center text-[8px] md:text-[10px] lg:text-xs">
                    {poi.icon}
                  </div>
                  <div className="absolute -bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 bg-white px-1.5 md:px-2 py-0.5 rounded shadow-lg text-[7px] md:text-[7px] lg:text-[8px] font-light text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {poi.name}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Cluster Marker central (13) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-purple-600 border-2 md:border-2.5 lg:border-3 border-white shadow-2xl flex items-center justify-center">
                  <span className="text-white text-[10px] md:text-xs lg:text-sm font-light">13</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-purple-600/30 animate-ping" />
              </div>
            </div>
            
            {/* Contrôles de carte (droite) */}
            <div className="absolute right-2 md:right-2.5 lg:right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 md:gap-2 z-10">
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Navigation">
                <NavigationIcon size={12} className="text-blue-600 w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
              </button>
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Zoom avant">
                <span className="text-sm md:text-base lg:text-lg font-light" aria-hidden="true">+</span>
              </button>
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Zoom arrière">
                <span className="text-sm md:text-base lg:text-lg font-light" aria-hidden="true">−</span>
              </button>
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Couches de carte">
                <Layers size={12} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
              </button>
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Centrer la carte">
                <Crosshair size={12} className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          {/* Bottom Sheet "À proximité" */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-2xl md:rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
            {/* Handle */}
            <div className="w-10 md:w-12 h-1 md:h-1.5 bg-slate-200 rounded-full mx-auto mt-1.5 md:mt-2 mb-2 md:mb-3" />
            
            {/* Header */}
            <div className="px-3 md:px-4 pb-2 md:pb-2.5 lg:pb-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-1.5 md:gap-2">
                <MapPin size={10} className="text-slate-600 w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                <span className="text-[10px] md:text-[11px] lg:text-sm font-light text-slate-900">À proximité</span>
                <span className="text-[8px] md:text-[9px] lg:text-xs text-slate-500">10 résultats</span>
              </div>
              <div className="flex gap-0.5 md:gap-1">
                <button className="w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors text-[8px] md:text-[9px] lg:text-xs" aria-label="Précédent">
                  <span aria-hidden="true">‹</span>
                </button>
                <button className="w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors text-[8px] md:text-[9px] lg:text-xs" aria-label="Suivant">
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
            
            {/* Carousel de cartes produits */}
            <div className="px-3 md:px-4 py-2 md:py-2.5 lg:py-3 overflow-hidden">
              <div className="flex gap-2 md:gap-2.5 lg:gap-3 pb-1.5 md:pb-2">
                {/* Carte 1: Formation GSAP */}
                <div className="flex-shrink-0 w-28 md:w-32 lg:w-36 rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-20 md:h-20 lg:h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HU0FQPC90ZXh0Pjwvc3ZnPg==')] opacity-20" />
                    <div className="text-white text-[8px] md:text-[9px] lg:text-[10px] font-light">Framer Motion</div>
                  </div>
                  <div className="p-2 md:p-2.5">
                    <div className="flex items-center justify-between mb-0.5 md:mb-1">
                      <span className="text-[7px] md:text-[7px] lg:text-[8px] text-slate-500 font-light">Produit</span>
                      <span className="text-[6px] md:text-[6px] lg:text-[7px] bg-emerald-100 text-emerald-700 px-1 md:px-1.5 py-0.5 rounded-full font-light">Top</span>
                    </div>
                    <div className="text-[8px] md:text-[8px] lg:text-[9px] text-slate-400 mb-0.5 md:mb-1">0.0 km</div>
                    <div className="text-[9px] md:text-[10px] lg:text-xs font-light text-slate-900 mb-0.5 md:mb-1">Formation GSAP</div>
                    <div className="text-[10px] md:text-[11px] lg:text-sm font-light text-slate-900 mb-1.5 md:mb-2">350000 FCFA</div>
                    <button className="w-full bg-slate-900 text-white text-[8px] md:text-[8px] lg:text-[9px] font-light py-1 md:py-1.5 rounded-md md:rounded-lg flex items-center justify-center gap-0.5 md:gap-1 hover:bg-slate-800 transition-colors">
                      <ShoppingCart size={8} className="w-2 h-2 md:w-2.25 md:h-2.25 lg:w-2.5 lg:h-2.5" />
                      Acheter
                    </button>
                  </div>
                </div>
                
                {/* Carte 2: Carte bööh */}
                <div className="flex-shrink-0 w-28 md:w-32 lg:w-36 rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-20 md:h-20 lg:h-24 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                    <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full border-2 border-white/30" />
                    <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-white rounded-md md:rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 grid grid-cols-4 gap-0.5 p-0.5 md:p-1">
                        {qrCodePattern.map((shouldFill, i) => (
                          <div key={i} className={`w-full h-full rounded-sm ${shouldFill ? 'bg-slate-900' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 md:p-2.5">
                    <div className="flex items-center justify-between mb-0.5 md:mb-1">
                      <span className="text-[7px] md:text-[7px] lg:text-[8px] text-slate-500 font-light">Produit</span>
                      <span className="text-[6px] md:text-[6px] lg:text-[7px] bg-emerald-100 text-emerald-700 px-1 md:px-1.5 py-0.5 rounded-full font-light">Top</span>
                    </div>
                    <div className="text-[8px] md:text-[8px] lg:text-[9px] text-slate-400 mb-0.5 md:mb-1">0.0 km</div>
                    <div className="text-[9px] md:text-[10px] lg:text-xs font-light text-slate-900 mb-0.5 md:mb-1">Carte bööh</div>
                    <div className="text-[10px] md:text-[11px] lg:text-sm font-light text-slate-900 mb-1.5 md:mb-2">10000 FCFA</div>
                    <button className="w-full bg-slate-900 text-white text-[8px] md:text-[8px] lg:text-[9px] font-light py-1 md:py-1.5 rounded-md md:rounded-lg flex items-center justify-center gap-0.5 md:gap-1 hover:bg-slate-800 transition-colors">
                      <ShoppingCart size={8} className="w-2 h-2 md:w-2.25 md:h-2.25 lg:w-2.5 lg:h-2.5" />
                      Acheter
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Pagination dots */}
              <div className="flex justify-center gap-0.5 md:gap-1 mt-1.5 md:mt-2">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 md:w-1.5 md:h-1.5 lg:w-1.5 lg:h-1.5 rounded-full ${i < 2 ? 'bg-slate-900' : 'bg-slate-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {visual !== 'invoice' &&
        visual !== 'calendar' &&
        visual !== 'stock' &&
        visual !== 'ocr' &&
        visual !== 'card' &&
        visual !== 'shop' &&
        visual !== 'portfolio' &&
        visual !== 'chart' &&
        visual !== 'map' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-xs uppercase tracking-widest font-light">Interface {visual}</span>
          </div>
        )}

      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full z-50 ${
          visual === 'ocr' || visual === 'card' ? 'bg-white/20' : 'bg-slate-900/20'
        }`}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 💳 CARD 3D EXPLODED - Déconstruction logique avec couches
// ═══════════════════════════════════════════════════════════════════════════════
const Card3DExploded = ({ activeFeature, progress }: { activeFeature: number; progress: any }) => {
  const feature = FEATURES[activeFeature];
  
  // Mémoriser les valeurs aléatoires pour éviter les re-renders
  const agendaParticles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 15 + Math.random() * 70,
      top: 30 + Math.random() * 40,
      duration: 3 + Math.random() * 2,
    }));
  }, []);
  
  const stockBarcodeHeights = useMemo(() => {
    return Array.from({ length: 8 }, () => 50 + Math.random() * 50);
  }, []);
  
  const stockParticles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 15 + Math.random() * 70,
      duration: 2.5 + Math.random() * 1.5,
    }));
  }, []);
  
  const qrCodePattern = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      const isCorner = (row < 2 && col < 2) || (row < 2 && col >= 4) || (row >= 4 && col < 2);
      return isCorner || Math.random() > 0.45;
    });
  }, []);
  
  const crmParticles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      top: 20 + Math.random() * 60,
      duration: 3 + Math.random() * 2,
    }));
  }, []);
  
  // Explosion dynamique basée sur le scroll - Optimisé AWWWARDS APPLE LEVEL
  const explosionRaw = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const explosion = useSpring(explosionRaw, { 
    stiffness: 250, 
    damping: 45, 
    mass: 0.5 
  });
  const zGap = useTransform(explosion, [0, 1], [0, 40]); // Écart entre couches
  
  // Rotation 3D ultra-fluide avec spring optimisé
  const rotateYRaw = useTransform(progress, [0, 0.5, 1], [0, 10, 0]);
  const rotateXRaw = useTransform(progress, [0, 0.5, 1], [0, -8, 0]);
  
  const rotateY = useSpring(rotateYRaw, { 
    stiffness: 200, 
    damping: 40, 
    mass: 0.6 
  });
  const rotateX = useSpring(rotateXRaw, { 
    stiffness: 200, 
    damping: 40, 
    mass: 0.6 
  });
  
  const scale = useSpring(1, { stiffness: 200, damping: 30 });

  return (
    <motion.div 
      className="relative w-[340px] h-[680px] sm:w-[360px] sm:h-[720px] md:w-[320px] md:h-[640px] lg:w-[360px] lg:h-[720px]"
      style={{ perspective: '2000px' }}
      animate={{ scale: 1.02 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="w-full h-full relative" 
        style={{ 
          transformStyle: 'preserve-3d', 
          rotateY, 
          rotateX,
          scale,
          willChange: 'transform'
        }}
      >
        {/* 1. BACK SHADOW LAYER - Ombre/profondeur */}
        <motion.div 
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl opacity-80"
          style={{ 
            translateZ: useTransform(zGap, (z) => -z * 2),
            transformStyle: 'preserve-3d' 
          }}
        >
          {/* Effet de texture */}
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]" />
        </motion.div>

        {/* 2. BORDER LAYER - Cadre/structure */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-[5px] border-slate-900 bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl"
          style={{ 
            translateZ: useTransform(zGap, (z) => -z * 1),
            transformStyle: 'preserve-3d',
            opacity: useTransform(explosion, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
          }}
        >
          {/* Effet de grain */}
          <div className="absolute inset-0 rounded-3xl opacity-20" style={{ 
            backgroundImage: imgLocal.noise 
          }} />
        </motion.div>

        {/* 3. FRONT CONTENT LAYER - Contenu principal */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-[5px] border-slate-900 overflow-hidden" 
          style={{ 
            translateZ: useTransform(zGap, (z) => z * 0.5),
            transformStyle: 'preserve-3d' 
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent rounded-3xl" />
          
          {/* Content avec AnimatePresence */}
          <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-between">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  perspective: '1000px'
                }}
                className="space-y-6"
              >
                {/* Icon */}
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.08, 
                    duration: 0.35, 
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                  style={{ 
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  {React.createElement(feature.icon, { size: 28, strokeWidth: 1.5 })}
                </motion.div>
                
                {/* Counter */}
                <motion.div 
                  className="text-xs font-light text-slate-400 uppercase tracking-[0.2em]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  {String(activeFeature + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                </motion.div>
                
                {/* Title */}
                <motion.h3 
                  className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {feature.title}
                </motion.h3>
                
                {/* Description */}
                <motion.p 
                  className="text-xl text-slate-500 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  {feature.desc}
                </motion.p>

                {/* Motion Graphics AWWWARDS-LEVEL - Liquid Glass Effect */}
                <motion.div
                  className="mt-8 h-64 relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ 
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(255,255,255,0.1)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%)'
                  }}
                >
                  {/* Liquid glass texture overlay */}
                  <div className="absolute inset-0 opacity-30" style={{ 
                    backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)'
                  }} />
                  
                  {/* Subtle grid overlay */}
                  <div className="absolute inset-0 opacity-[0.08]" style={{ 
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                  
                  {/* Agenda - Timeline sophistiquée avec synchronisation */}
                  {activeFeature === 0 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Grid de fond subtil */}
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                      
                      {/* Timeline principale avec glow */}
                      <motion.div 
                        className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <motion.div
                          className="absolute inset-0 h-full bg-slate-800/40 blur-sm"
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        />
                      </motion.div>
                      
                      {/* Événements avec effets 3D */}
                      {[
                        { time: '09:00', title: 'Meeting', delay: 0 },
                        { time: '11:30', title: 'Call', delay: 0.1 },
                        { time: '14:00', title: 'Demo', delay: 0.2, active: true },
                        { time: '16:00', title: 'Review', delay: 0.3 },
                        { time: '18:00', title: 'Sync', delay: 0.4 }
                      ].map((event, i) => {
                        const position = 15 + i * 17.5;
                        return (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: `${position}%`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              transformStyle: 'preserve-3d'
                            }}
                            initial={{ opacity: 0, scale: 0, rotateY: -90 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ delay: 0.5 + event.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {/* Glow rings pour événement actif */}
                            {event.active && (
                              <>
                                {[0, 1, 2].map((ring) => (
                                  <motion.div
                                    key={ring}
                                    className="absolute inset-0 rounded-full border border-slate-700/40"
                                    animate={{
                                      scale: [1, 1.8 + ring * 0.3, 1],
                                      opacity: [0.5, 0, 0.5]
                                    }}
                                    transition={{
                                      delay: ring * 0.4,
                                      duration: 2,
                                      repeat: Number.POSITIVE_INFINITY,
                                      ease: "easeOut"
                                    }}
                                  />
                                ))}
                              </>
                            )}
                            
                            {/* Carte événement 3D */}
                            <motion.div
                              className={`relative w-14 h-16 rounded-xl border ${
                                event.active 
                                  ? 'border-slate-800/60 bg-slate-900/50' 
                                  : 'border-slate-700/40 bg-slate-800/30'
                              } backdrop-blur-md shadow-xl`}
                              style={{
                                transformStyle: 'preserve-3d',
                                transform: event.active ? 'translateZ(10px)' : 'translateZ(0px)'
                              }}
                              animate={event.active ? {
                                y: [-3, 3, -3],
                                boxShadow: [
                                  '0 10px 40px rgba(15,23,42,0.3)',
                                  '0 15px 50px rgba(15,23,42,0.4)',
                                  '0 10px 40px rgba(15,23,42,0.3)'
                                ]
                              } : {}}
                              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                            >
                              {/* Contenu */}
                              <div className="h-full flex flex-col items-center justify-center p-1.5 relative z-10">
                                <Calendar size={14} className="text-slate-700 mb-1" strokeWidth={1.5} />
                                <div className="text-[8px] font-light text-slate-900 leading-tight">{event.time}</div>
                                <div className="text-[7px] text-slate-600 uppercase tracking-wider mt-0.5">{event.title}</div>
                              </div>
                              
                              {/* Shine effect */}
                              <motion.div
                                className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-700/30 via-transparent to-transparent"
                                animate={{ opacity: [0, 0.4, 0] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3 }}
                              />
                            </motion.div>
                            
                            {/* Ligne de connexion avec particules */}
                            <motion.div
                              className="absolute top-[calc(50%+32px)] left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-slate-700/50 via-slate-700/30 to-transparent"
                              initial={{ scaleY: 0, originY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: 0.7 + event.delay, duration: 0.4 }}
                            >
                              {/* Particules qui montent */}
                              {event.active && [...Array(3)].map((_, p) => (
                                <motion.div
                                  key={p}
                                  className="absolute w-0.5 h-0.5 rounded-full bg-slate-700/70"
                                  style={{ left: '50%' }}
                                  animate={{
                                    y: [0, -32, -32],
                                    opacity: [0, 1, 0]
                                  }}
                                  transition={{
                                    delay: p * 0.3,
                                    duration: 1.5,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeOut"
                                  }}
                                />
                              ))}
                            </motion.div>
                            
                            {/* Dot sur timeline avec pulse */}
                            <motion.div
                              className="absolute top-[calc(50%+40px)] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-700/60"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.8 + event.delay, duration: 0.2 }}
                            >
                              {event.active && (
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-slate-700/70"
                                  animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                />
                              )}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Particules flottantes */}
                      {agendaParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-0.5 h-0.5 rounded-full bg-slate-700/40"
                          style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`
                          }}
                          animate={{
                            y: [-10, -25, -10],
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.5, 1]
                          }}
                          transition={{
                            delay: particle.id * 0.3,
                            duration: particle.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Facturation - Dashboard financier sophistiqué */}
                  {activeFeature === 1 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Grid de fond animé */}
                      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" aria-hidden="true">
                        <defs>
                          <pattern id="financeGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#financeGrid)" />
                      </svg>
                      
                      {/* Courbe principale avec area fill */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(15,23,42,0.25)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="rgba(15,23,42,0.25)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Area sous la courbe */}
                        <motion.path
                          d="M 5,90 Q 25,75 35,65 T 55,50 T 75,35 T 95,25 L 95,100 L 5,100 Z"
                          fill="url(#areaFill)"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                        
                        {/* Courbe principale */}
                        <motion.path
                          d="M 5,90 Q 25,75 35,65 T 55,50 T 75,35 T 95,25"
                          fill="none"
                          stroke="rgba(15,23,42,0.7)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {/* Glow effect */}
                          <animate
                            attributeName="stroke-opacity"
                            values="0.6;0.9;0.6"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </motion.path>
                      </svg>
                      
                      {/* Points de données avec métriques */}
                      {[
                        { x: 5, y: 90, value: '2.5K', month: 'Jan' },
                        { x: 25, y: 75, value: '5.8K', month: 'Fev' },
                        { x: 35, y: 65, value: '12K', month: 'Mar' },
                        { x: 55, y: 50, value: '18K', month: 'Avr' },
                        { x: 75, y: 35, value: '25K', month: 'Mai' },
                        { x: 95, y: 25, value: '32K', month: 'Jun' }
                      ].map((point, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.7 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {/* Point avec glow */}
                          <motion.div
                            className="relative w-3 h-3"
                            animate={{
                              filter: [
                                'drop-shadow(0 0 4px rgba(15,23,42,0.4))',
                                'drop-shadow(0 0 8px rgba(15,23,42,0.6))',
                                'drop-shadow(0 0 4px rgba(15,23,42,0.4))'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          >
                            <div className="absolute inset-0 rounded-full bg-slate-800 border border-slate-700" />
                            <motion.div
                              className="absolute inset-0 rounded-full bg-slate-700/60"
                              animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                            />
                          </motion.div>
                          
                          {/* Label flottant */}
                          <motion.div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 + i * 0.1, duration: 0.3 }}
                          >
                            <div className="bg-slate-900/60 backdrop-blur-md text-slate-100 text-[9px] font-light px-2 py-1 rounded-lg border border-slate-700/40 shadow-lg">
                              {point.value}€
                            </div>
                          </motion.div>
                          
                          {/* Mois */}
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 font-light">
                            {point.month}
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Métriques en temps réel (top-right) */}
                      <motion.div
                        className="absolute top-2 right-2 space-y-1.5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                      >
                        {[
                          { label: 'MRR', value: '+127%', trend: 'up' },
                          { label: 'Paid', value: '98%', trend: 'up' }
                        ].map((metric, i) => (
                          <motion.div
                            key={i}
                            className="bg-slate-900/40 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-slate-700/30"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + i * 0.1, duration: 0.3 }}
                          >
                            <div className="text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">{metric.label}</div>
                            <div className="flex items-center gap-1">
                              <motion.div
                                className="w-1 h-1 rounded-full bg-slate-700/70"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3 }}
                              />
                              <div className="text-[10px] font-light text-slate-900">{metric.value}</div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* Stock - Visualisation 3D d'entrepôt sophistiquée */}
                  {activeFeature === 2 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Perspective 3D container */}
                      <div className="absolute inset-0" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                        {/* Rayonnages 3D avec profondeur */}
                        {[0, 1, 2, 3, 4].map((shelf, i) => (
                          <motion.div
                            key={shelf}
                            className="absolute"
                            style={{
                              left: `${12 + i * 19}%`,
                              top: '45%',
                              transform: 'translateY(-50%)',
                              transformStyle: 'preserve-3d'
                            }}
                            initial={{ opacity: 0, z: -150, rotateY: -30 }}
                            animate={{ opacity: 1, z: 0, rotateY: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {/* Boxes empilées avec effet 3D */}
                            {[0, 1, 2].map((box) => (
                              <motion.div
                                key={box}
                                className="relative w-14 h-12 mb-1.5 rounded-lg border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm shadow-xl"
                                style={{
                                  transformStyle: 'preserve-3d',
                                  transform: `translateZ(${box * 8}px) rotateX(8deg) rotateY(-12deg)`
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 + box * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ scale: 1.1, rotateY: -20, z: 20 }}
                              >
                                {/* Code-barres stylisé */}
                                <div className="absolute inset-2 flex items-center justify-center gap-[1.5px]">
                                  {stockBarcodeHeights.map((height, barIndex) => (
                                    <motion.div
                                      key={barIndex}
                                      className="w-[1.5px] bg-slate-700/70 rounded-full"
                                      style={{ height: `${height}%` }}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.6 + i * 0.1 + box * 0.06 + barIndex * 0.02, duration: 0.2 }}
                                    />
                                  ))}
                                </div>
                                
                                {/* Indicateur de niveau */}
                                <motion.div
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border border-slate-700/50 bg-slate-800/40 flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.7 + i * 0.1 + box * 0.06, duration: 0.3 }}
                                >
                                  <Package size={8} className="text-slate-600" strokeWidth={2} />
                                </motion.div>
                                
                                {/* Shine effect */}
                                <motion.div
                                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-slate-700/20 via-transparent to-transparent"
                                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 + box * 0.1 }}
                                />
                              </motion.div>
                            ))}
                            
                            {/* Label de niveau */}
                            <motion.div
                              className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 font-light whitespace-nowrap"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.9 + i * 0.1, duration: 0.3 }}
                            >
                              ✓ Optimal
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Scan laser animé */}
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"
                        style={{
                          boxShadow: '0 0 10px rgba(15,23,42,0.4)'
                        }}
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      
                      {/* Particules de données */}
                      {stockParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-0.5 h-0.5 rounded-full bg-slate-700/50"
                          style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`
                          }}
                          animate={{
                            y: [-8, -20, -8],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [1, 1.8, 1]
                          }}
                          transition={{
                            delay: particle.id * 0.2,
                            duration: particle.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                      
                      {/* Stats overlay */}
                      <motion.div
                        className="absolute top-2 right-2 bg-slate-900/40 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-slate-700/30 space-y-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.4 }}
                      >
                        <div className="flex items-center gap-1.5">
                          <motion.div 
                            className="w-1.5 h-1.5 rounded-full bg-slate-700/70"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                          />
                          <span className="text-[8px] text-slate-600">Stock:</span>
                          <span className="text-[9px] text-slate-900 font-light">2,847</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <motion.div 
                            className="w-1.5 h-1.5 rounded-full bg-slate-700/70"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
                          />
                          <span className="text-[8px] text-slate-600">Flow:</span>
                          <span className="text-[9px] text-slate-900 font-light">Real-time</span>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* CRM - Neural network sophistiqué avec data flow */}
                  {activeFeature === 3 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Neural network connections SVG */}
                      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                          const angle1 = (i * 45) * (Math.PI / 180);
                          const angle2 = ((i + 1) * 45) * (Math.PI / 180);
                          const radius = 45;
                          const centerX = 50;
                          const centerY = 50;
                          
                          return (
                            <motion.line
                              key={i}
                              x1={`${centerX + Math.cos(angle1) * radius}%`}
                              y1={`${centerY + Math.sin(angle1) * radius}%`}
                              x2={`${centerX + Math.cos(angle2) * radius}%`}
                              y2={`${centerY + Math.sin(angle2) * radius}%`}
                              stroke="rgba(15,23,42,0.4)"
                              strokeWidth="0.6"
                              strokeOpacity="0.3"
                              strokeDasharray="3 3"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.15 }}
                              transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                            >
                              {/* Animation de flux */}
                              <animate
                                attributeName="stroke-dashoffset"
                                values="0;-6"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </motion.line>
                          );
                        })}
                      </svg>
                      
                      {/* Contact nodes en orbite avec effets */}
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                        const angle = (i * 45) * (Math.PI / 180);
                        const radius = 45;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        return (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: '50%',
                              top: '50%'
                            }}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            animate={{ x, y, scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {/* Glow rings subtils */}
                            {[0, 1].map((ring) => (
                              <motion.div
                                key={ring}
                                className="absolute inset-0 rounded-full border border-slate-700/30"
                                animate={{
                                  scale: [1, 1.6 + ring * 0.3, 1],
                                  opacity: [0.3, 0, 0.3]
                                }}
                                transition={{
                                  delay: ring * 0.5,
                                  duration: 2.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeOut"
                                }}
                              />
                            ))}
                            
                            {/* Node principal */}
                            <motion.div
                            className="relative w-10 h-10 rounded-full border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
                            animate={{
                              boxShadow: [
                                '0 0 10px rgba(15,23,42,0.2)',
                                '0 0 20px rgba(15,23,42,0.3)',
                                '0 0 10px rgba(15,23,42,0.2)'
                              ]
                            }}
                            transition={{ duration: 2 + i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                          >
                            <User size={14} className="text-slate-700" strokeWidth={2} />
                              
                              {/* Data particles flowing vers le centre */}
                              <motion.div
                                className="absolute w-1 h-1 rounded-full bg-slate-700/60"
                                animate={{
                                  x: [0, -x/3, 0],
                                  y: [0, -y/3, 0],
                                  opacity: [1, 0.3, 1],
                                  scale: [1, 0.5, 1]
                                }}
                                transition={{
                                  duration: 2.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                  delay: i * 0.3,
                                  ease: "easeInOut"
                                }}
                              />
                            </motion.div>
                            
                            {/* Status indicator */}
                            <motion.div
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-700/50 bg-slate-800/40"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.7 + i * 0.06, duration: 0.2 }}
                            >
                              <motion.div
                                className="absolute inset-0 rounded-full bg-slate-700/60"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                              />
                            </motion.div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Hub central avec scanning effect */}
                      <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-slate-700/50 bg-slate-900/50 backdrop-blur-md shadow-2xl flex items-center justify-center z-10"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Users size={24} className="text-slate-700" strokeWidth={2.5} />
                        
                        {/* Scanning rings */}
                        {[0, 1].map((ring) => (
                          <motion.div
                            key={ring}
                            className="absolute inset-0 rounded-full border border-slate-700/30"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: ring * 0.5 }}
                          />
                        ))}
                      </motion.div>
                      
                      {/* Activity metrics */}
                      <motion.div
                        className="absolute top-2 right-2 space-y-1.5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.4 }}
                      >
                        {[
                          { label: 'Active', value: '847' },
                          { label: 'Sync', value: '100%' }
                        ].map((metric, i) => (
                          <motion.div
                            key={i}
                            className="bg-slate-900/40 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-slate-700/30 flex items-center gap-1.5"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + i * 0.1, duration: 0.3 }}
                          >
                            <motion.div 
                              className="w-1.5 h-1.5 rounded-full bg-slate-700/70"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3 }}
                            />
                            <div className="text-[8px] text-slate-600">{metric.label}:</div>
                            <div className="text-[10px] font-light text-slate-900">{metric.value}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* Identité - QR Code holographique avec ondes NFC */}
                  {activeFeature === 4 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* QR Code 3D avec effet holographique */}
                      <motion.div
                        className="relative w-28 h-28 rounded-xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-md p-2.5 shadow-2xl"
                        style={{ transformStyle: 'preserve-3d' }}
                        initial={{ scale: 0, rotateY: -90, rotateX: -20 }}
                        animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
                        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Grid QR Code sophistiqué */}
                        <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-[1.5px] relative z-10">
                          {qrCodePattern.map((shouldFill, i) => (
                            <motion.div
                              key={i}
                              className={`${shouldFill ? 'bg-slate-800' : 'bg-slate-700/20'} rounded-[1px]`}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: 0.5 + i * 0.015,
                                duration: 0.2,
                                ease: "easeOut"
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Shine effect holographique */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-700/40 via-transparent to-transparent pointer-events-none"
                          animate={{ 
                            opacity: [0.3, 0.6, 0.3],
                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                          }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        />
                        
                        {/* Scan line */}
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-slate-700/50 blur-sm"
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        />
                      </motion.div>
                      
                      {/* Ondes NFC concentriques */}
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute w-28 h-28 rounded-xl border border-slate-700/30"
                          animate={{ 
                            scale: [1, 1.8 + i * 0.3, 2.5 + i * 0.5],
                            opacity: [0.4, 0.2, 0],
                            borderColor: ['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.1)', 'rgba(15,23,42,0)']
                          }}
                          transition={{ 
                            delay: 0.6 + i * 0.4,
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatDelay: 0.2,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                      
                      {/* Particules de partage */}
                      {[...Array(8)].map((_, i) => {
                        const angle = (i * 45) * (Math.PI / 180);
                        const radius = 50;
                        return (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-slate-700/60"
                            style={{
                              left: '50%',
                              top: '50%'
                            }}
                            animate={{
                              x: [0, Math.cos(angle) * radius, Math.cos(angle) * radius * 1.5],
                              y: [0, Math.sin(angle) * radius, Math.sin(angle) * radius * 1.5],
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0]
                            }}
                            transition={{
                              delay: 0.8 + i * 0.1,
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatDelay: 1,
                              ease: "easeOut"
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Commerce - Mini e-commerce avec flux de commandes */}
                  {activeFeature === 5 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Grid de fond */}
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                        backgroundSize: '15px 15px'
                      }} />
                      
                      {/* Produits avec effet 3D */}
                      <div className="flex items-center justify-center gap-4">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="relative"
                            style={{ transformStyle: 'preserve-3d' }}
                            initial={{ opacity: 0, scale: 0, rotateY: -45 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {/* Carte produit */}
                            <motion.div
                              className="relative w-14 h-16 rounded-xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm shadow-xl overflow-hidden"
                              animate={{
                                y: [0, -3, 0],
                                boxShadow: [
                                  '0 10px 30px rgba(15,23,42,0.2)',
                                  '0 15px 40px rgba(15,23,42,0.3)',
                                  '0 10px 30px rgba(15,23,42,0.2)'
                                ]
                              }}
                              transition={{ duration: 2 + i * 0.3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                            >
                              {/* Icon produit */}
                              <div className="h-full flex items-center justify-center">
                                <ShoppingBag size={18} className="text-slate-700" strokeWidth={1.5} />
                              </div>
                              
                              {/* Shine effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-slate-700/30 via-transparent to-transparent"
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                              />
                              
                              {/* Indicateur de vente */}
                              <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-700/50 bg-slate-800/40 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                              >
                                <motion.div
                                  className="w-1.5 h-1.5 rounded-full bg-slate-700/70"
                                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                                />
                              </motion.div>
                            </motion.div>
                            
                            {/* Ligne de flux vers panier */}
                            {i < 3 && (
                              <motion.div
                                className="absolute top-1/2 -right-2 w-4 h-px bg-slate-700/40"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                              >
                                {/* Particule qui se déplace */}
                                <motion.div
                                  className="absolute w-1 h-1 rounded-full bg-slate-700/60"
                                  animate={{ x: [0, 16, 16], opacity: [0, 1, 0] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.8 + i * 0.1 }}
                                />
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Panier en temps réel (droite) */}
                      <motion.div
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center shadow-lg"
                        initial={{ opacity: 0, scale: 0, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                      >
                        <ShoppingCart size={16} className="text-slate-700" strokeWidth={1.5} />
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <div className="text-[7px] font-light text-slate-900">4</div>
                        </motion.div>
                      </motion.div>
                      
                      {/* Stats de vente */}
                      <motion.div
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-slate-700/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1, duration: 0.4 }}
                      >
                        <div className="text-[8px] text-slate-600 text-center">24/7</div>
                        <div className="text-[9px] font-light text-slate-900 text-center">Auto</div>
                      </motion.div>
                    </div>
                  )}

                  {/* Portfolio - Galerie 3D avec images flottantes */}
                  {activeFeature === 6 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Grid de projets avec effet 3D */}
                      <div className="grid grid-cols-4 gap-2 w-full max-w-[220px]" style={{ perspective: '600px' }}>
                        {[...Array(8)].map((_, i) => {
                          const row = Math.floor(i / 4);
                          const col = i % 4;
                          const depth = (row + col) % 2 === 0 ? 10 : -5;
                          
                          return (
                            <motion.div
                              key={i}
                              className="aspect-square rounded-lg border border-slate-700/30 bg-slate-800/25 backdrop-blur-sm relative overflow-hidden group cursor-pointer"
                              style={{
                                transformStyle: 'preserve-3d',
                                transform: `translateZ(${depth}px)`
                              }}
                              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                              transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              whileHover={{ scale: 1.08, rotateY: 5, z: 20 }}
                            >
                              {/* Pattern de fond */}
                              <div className="absolute inset-0 opacity-30" style={{
                                backgroundImage: `linear-gradient(${i * 45}deg, rgba(15,23,42,0.4) 1px, transparent 1px), linear-gradient(${90 + i * 45}deg, rgba(15,23,42,0.4) 1px, transparent 1px)`,
                                backgroundSize: '8px 8px'
                              }} />
                              
                              {/* Icon Eye */}
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Eye size={14} className="text-slate-600" strokeWidth={1.5} />
                              </div>
                              
                              {/* Shine effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-slate-700/25 via-transparent to-transparent"
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2 + i * 0.2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
                              />
                              
                              {/* Hover glow */}
                              <motion.div
                                className="absolute inset-0 border border-slate-700/50 rounded-lg"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                              
                              {/* Corner accent */}
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-700/50" />
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Particules flottantes */}
                      {crmParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-0.5 h-0.5 rounded-full bg-slate-700/40"
                          style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`
                          }}
                          animate={{
                            y: [-8, -20, -8],
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.5, 1]
                          }}
                          transition={{
                            delay: particle.id * 0.3,
                            duration: particle.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Analytics - Dashboard sophistiqué avec KPIs multiples */}
                  {activeFeature === 7 && (
                    <div className="h-full relative flex items-center justify-center px-8 overflow-hidden">
                      {/* Grid de fond */}
                      <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                      }} />
                      
                      {/* Barres de performance avec labels */}
                      <div className="flex items-end justify-center gap-4 w-full h-full py-6">
                        {[
                          { value: 45, label: 'Users', trend: 'up' },
                          { value: 75, label: 'Sales', trend: 'up' },
                          { value: 60, label: 'Growth', trend: 'up' },
                          { value: 85, label: 'Revenue', trend: 'up' },
                          { value: 55, label: 'ROI', trend: 'up' }
                        ].map((bar, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 max-w-[36px] flex flex-col items-center relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                          >
                            {/* Barre principale */}
                            <motion.div
                              className="w-full bg-slate-800/40 rounded-t-sm border-t border-slate-700/40 relative overflow-hidden"
                              initial={{ height: 0 }}
                              animate={{ height: `${bar.value}%` }}
                              transition={{ delay: 0.5 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {/* Gradient fill animé */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-slate-700/50 to-slate-700/20"
                                animate={{ opacity: [0.6, 0.9, 0.6] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                              />
                              
                              {/* Point sur le sommet */}
                              <motion.div
                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-800 border border-slate-700"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.7 + i * 0.08, duration: 0.3 }}
                              >
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-slate-700/60"
                                  animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                                />
                              </motion.div>
                              
                              {/* Ligne de niveau */}
                              <motion.div
                                className="absolute top-0 left-0 right-0 h-px bg-slate-700/50"
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
                              />
                            </motion.div>
                            
                            {/* Label avec trend */}
                            <motion.div
                              className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.8 + i * 0.08, duration: 0.3 }}
                            >
                              <div className="text-[7px] text-slate-600 font-light mb-0.5">{bar.label}</div>
                              <div className="flex items-center justify-center gap-0.5">
                                <motion.div
                                  className="w-1 h-1 rounded-full bg-slate-700/70"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                                />
                                <div className="text-[8px] text-slate-800 font-light">+{bar.value}%</div>
                              </div>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Métriques globales (top) */}
                      <motion.div
                        className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-slate-700/30 flex items-center gap-3"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.4 }}
                      >
                        {[
                          { label: 'Total', value: '2.4K' },
                          { label: 'Growth', value: '+127%' }
                        ].map((metric, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="text-[7px] text-slate-600">{metric.label}:</div>
                            <div className="text-[9px] font-light text-slate-900">{metric.value}</div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* Map Géolocalisée - Carte interactive avec business, produits et services */}
                  {activeFeature === 8 && (
                    <div className="h-full relative flex items-center justify-center px-6 overflow-hidden">
                      {/* Fond de carte avec grid */}
                      <div className="absolute inset-0 opacity-[0.08]" style={{
                        backgroundImage: 'linear-gradient(to right, rgba(15,23,42,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.3) 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                      }} />
                      
                      {/* Routes de la carte */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        {/* Routes principales */}
                        {[
                          { d: 'M 10,30 L 40,25 L 70,30 L 90,40', delay: 0 },
                          { d: 'M 15,50 L 50,45 L 85,50', delay: 0.1 },
                          { d: 'M 20,70 L 60,65 L 90,70', delay: 0.2 }
                        ].map((route, i) => (
                          <motion.path
                            key={i}
                            d={route.d}
                            fill="none"
                            stroke="rgba(15,23,42,0.3)"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + route.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          />
                        ))}
                      </svg>
                      
                      {/* Points d'intérêt (Business, Restaurants, Hôtels, Magasins) */}
                      {[
                        { x: 25, y: 30, type: 'restaurant', icon: '🍽️', label: 'Restaurant', delay: 0.4 },
                        { x: 50, y: 25, type: 'hotel', icon: '🏨', label: 'Hôtel', delay: 0.5 },
                        { x: 70, y: 35, type: 'shop', icon: '🛒', label: 'Magasin', delay: 0.6 },
                        { x: 35, y: 50, type: 'business', icon: '🏢', label: 'Business', delay: 0.7 },
                        { x: 65, y: 55, type: 'restaurant', icon: '🍽️', label: 'Restaurant', delay: 0.8 },
                        { x: 45, y: 70, type: 'shop', icon: '🛒', label: 'Magasin', delay: 0.9 }
                      ].map((poi, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{
                            left: `${poi.x}%`,
                            top: `${poi.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: poi.delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {/* Marqueur POI */}
                          <motion.div
                            className="relative w-6 h-6 rounded-full border-2 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm flex items-center justify-center shadow-lg"
                            animate={{
                              y: [0, -2, 0],
                              boxShadow: [
                                '0 4px 12px rgba(15,23,42,0.2)',
                                '0 6px 16px rgba(15,23,42,0.3)',
                                '0 4px 12px rgba(15,23,42,0.2)'
                              ]
                            }}
                            transition={{ duration: 2 + i * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          >
                            <span className="text-[10px]">{poi.icon}</span>
                            
                            {/* Pulse ring */}
                            <motion.div
                              className="absolute inset-0 rounded-full border border-slate-700/40"
                              animate={{ scale: [1, 1.8, 1.8], opacity: [0.4, 0, 0] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3 }}
                            />
                          </motion.div>
                          
                          {/* Label */}
                          <motion.div
                            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] text-slate-600 font-light whitespace-nowrap"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: poi.delay + 0.2, duration: 0.3 }}
                          >
                            {poi.label}
                          </motion.div>
                        </motion.div>
                      ))}
                      
                      {/* Cluster marker central (13 résultats) */}
                      <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <motion.div
                          className="relative w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-700/50 flex items-center justify-center shadow-2xl"
                          animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              '0 8px 24px rgba(15,23,42,0.4)',
                              '0 12px 32px rgba(15,23,42,0.5)',
                              '0 8px 24px rgba(15,23,42,0.4)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <div className="text-[14px] font-light text-slate-100">13</div>
                          
                          {/* Rings concentriques */}
                          {[0, 1, 2].map((ring) => (
                            <motion.div
                              key={ring}
                              className="absolute inset-0 rounded-full border border-slate-700/30"
                              animate={{ scale: [1, 1.5 + ring * 0.3, 1.5 + ring * 0.3], opacity: [0.3, 0, 0] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: ring * 0.4 }}
                            />
                          ))}
                        </motion.div>
                      </motion.div>
                      
                      {/* Contrôles de carte (droite) */}
                      <motion.div
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                      >
                        {[
                          { icon: '📍', label: 'Location' },
                          { icon: '+', label: 'Zoom' },
                          { icon: '−', label: 'Zoom' },
                          { icon: '🗺️', label: 'Layers' },
                          { icon: '🎯', label: 'Center' }
                        ].map((control, i) => (
                          <motion.div
                            key={i}
                            className="w-7 h-7 rounded-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/40 flex items-center justify-center text-[10px] text-slate-700 shadow-lg cursor-pointer"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.9 + i * 0.05, duration: 0.3 }}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(15,23,42,0.7)' }}
                          >
                            {control.icon}
                          </motion.div>
                        ))}
                      </motion.div>
                      
                      {/* Panneau "À proximité" (bas) */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-slate-900/50 backdrop-blur-xl border-t border-slate-700/40 rounded-t-2xl p-3"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Handle */}
                        <div className="w-10 h-1 bg-slate-700/40 rounded-full mx-auto mb-2" />
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-600" />
                            <span className="text-[9px] font-light text-slate-900">À proximité</span>
                            <span className="text-[8px] text-slate-600">10 résultats</span>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-[7px] text-slate-700">‹</div>
                            <div className="w-4 h-4 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-[7px] text-slate-700">›</div>
                          </div>
                        </div>
                        
                        {/* Carousel de cartes produits */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {[
                            { label: 'Produit', name: 'Formation GSAP', price: '350000', color: 'from-blue-400 to-purple-500' },
                            { label: 'Produit', name: 'Carte bööh', price: '10000', color: 'from-slate-800 to-slate-900' }
                          ].map((product, i) => (
                            <motion.div
                              key={i}
                              className="flex-shrink-0 w-32 h-20 rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm overflow-hidden shadow-lg"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.1 + i * 0.1, duration: 0.4 }}
                            >
                              {/* Visual */}
                              <div className={`h-12 bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                                <span className="text-[8px] font-light text-white/90">{product.name}</span>
                              </div>
                              
                              {/* Info */}
                              <div className="p-1.5">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[7px] text-slate-600">{product.label}</span>
                                  <span className="text-[6px] bg-slate-700/40 px-1 py-0.5 rounded text-slate-900 font-light">Top</span>
                                </div>
                                <div className="text-[8px] font-light text-slate-900">{product.price} FCFA</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Pagination dots */}
                        <div className="flex justify-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className={`w-1 h-1 rounded-full ${i < 2 ? 'bg-slate-700' : 'bg-slate-700/30'}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1.3 + i * 0.05, duration: 0.2 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                      
                      {/* Stats de découverte */}
                      <motion.div
                        className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-slate-700/30"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.4 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div 
                            className="w-1.5 h-1.5 rounded-full bg-slate-700/70"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                          />
                          <div className="text-[8px] text-slate-600">Découvert:</div>
                          <div className="text-[9px] font-light text-slate-900">13 résultats</div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Glass overlay - Couche de verre avec reflets */}
          <motion.div 
            className="absolute inset-0 rounded-3xl border-[2px] border-white/10 pointer-events-none"
            style={{
              translateZ: useTransform(zGap, (z) => z * 0.8),
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)'
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const Phone3DExploded = ({ activeFeature, progress }: { activeFeature: number; progress: any }) => {
  const visual = FEATURES[activeFeature]?.visual || FEATURES[0].visual;
  
  // Explosion dynamique basée sur le scroll - Optimisé AWWWARDS APPLE LEVEL
  const explosionRaw = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const explosion = useSpring(explosionRaw, { 
    stiffness: 250, 
    damping: 45, 
    mass: 0.5 
  });
  const zGap = useTransform(explosion, [0, 1], [0, 60]); // Plus d'écart entre couches
  
  // Rotation gyroscopique ultra-fluide - effet parallax avec spring optimisé
  const rotateYRaw = useTransform(progress, [0, 0.5, 1], [0, -15, 0]);
  const rotateXRaw = useTransform(progress, [0, 0.5, 1], [0, 10, 0]);
  
  // Springs pour des rotations ultra-fluides AWWWARDS APPLE LEVEL
  const rotateY = useSpring(rotateYRaw, { 
    stiffness: 200, 
    damping: 40, 
    mass: 0.6 
  });
  const rotateX = useSpring(rotateXRaw, { 
    stiffness: 200, 
    damping: 40, 
    mass: 0.6 
  });
  
  // Animation de hover selon la feature active
  const scale = useSpring(1, { stiffness: 200, damping: 30 });

  return (
      <motion.div 
      className="relative w-[340px] h-[680px] sm:w-[360px] sm:h-[720px] md:w-[320px] md:h-[640px] lg:w-[360px] lg:h-[720px] mx-auto"
      style={{ 
        perspective: '2000px', 
        willChange: 'transform',
        flexShrink: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: 'calc(100vw - 16px)'
      }}
      animate={{ scale: 1.0 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div 
        className="w-full h-full relative" 
        style={{ 
          transformStyle: 'preserve-3d', 
          rotateY, 
          rotateX,
          scale,
          willChange: 'transform',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        {/* 1. BACK PLATE - Coque arrière */}
      <motion.div 
          className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-[#444] shadow-2xl"
        style={{ 
            translateZ: useTransform(zGap, (z) => -z * 2.5),
            transformStyle: 'preserve-3d' 
          }}
        >
          {/* Texture caméra simulée */}
          <div className="absolute top-6 right-6 w-32 h-32 bg-[#333] rounded-[30px] opacity-50 blur-[1px]" />
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#555]" />
        </motion.div>

        {/* 2. TECH LAYER - Entrailles avec CPU et Battery */}
        <motion.div
          className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm"
          style={{ 
            translateZ: useTransform(zGap, (z) => -z * 1.5),
            transformStyle: 'preserve-3d',
            opacity: useTransform(explosion, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
          }}
        >
          {/* Circuit board effect */}
          <motion.div
            className="w-[80%] h-[60%] border-2 border-slate-600/40 rounded-2xl flex items-center justify-center relative overflow-hidden"
            animate={{ 
              boxShadow: ['0 0 20px rgba(100,100,255,0.1)', '0 0 30px rgba(100,100,255,0.3)', '0 0 20px rgba(100,100,255,0.1)']
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Cpu size={64} className="text-slate-500/70" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          </motion.div>
          <motion.div 
            className="w-[80%] h-[15%] bg-slate-800/70 rounded-xl mt-4 border-2 border-slate-700/40 flex items-center justify-center"
            animate={{ 
              backgroundColor: ['rgba(30,41,59,0.7)', 'rgba(30,41,59,0.9)', 'rgba(30,41,59,0.7)']
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            <Battery size={32} className="text-slate-500/70" />
          </motion.div>
        </motion.div>

        {/* 3. FRONT SCREEN - Écran principal avec interface */}
            <motion.div
          className="absolute inset-0 rounded-[55px] bg-white overflow-hidden border-[6px] border-black shadow-2xl" 
          style={{ 
            translateZ: useTransform(zGap, (z) => -z * 0.5),
            transformStyle: 'preserve-3d' 
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ 
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              }}
              className="w-full h-full absolute inset-0"
              style={{ 
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                perspective: '1000px'
              }}
            >
              <PhoneScreenContent visual={visual} />
            </motion.div>
          </AnimatePresence>
          </motion.div>

        {/* 4. GLASS OVERLAY - Couche de verre avec reflets */}
          <motion.div 
          className="absolute inset-0 rounded-[55px] border-[2px] border-white/10 pointer-events-none"
          style={{
            translateZ: useTransform(zGap, (z) => z * 0.3),
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.08) 100%)'
          }}
        >
          {/* Notch réaliste */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <div className="w-12 h-3 rounded-full bg-slate-900" />
          </div>
          
          {/* Reflets dynamiques */}
          <motion.div
            className="absolute inset-0 rounded-[55px] opacity-30"
            style={{
              background: useTransform(
                rotateY,
                [-15, 0, 15],
                [
                  'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'linear-gradient(270deg, rgba(255,255,255,0.2) 0%, transparent 50%)'
                ]
              )
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 SCROLLYTELLING - Le Cœur de l'Expérience
// ═══════════════════════════════════════════════════════════════════════════════
// 
// 📖 PRINCIPE :
// 1. Une GRANDE PISTE invisible (h-[500vh]) = 5× la hauteur de l'écran
// 2. Un CONTENU FIXÉ (sticky) qui reste à l'écran pendant le scroll
// 3. Le scroll vertical contrôle un mouvement horizontal + changement d'interface
//
// 🧠 SYNCHRONISATION :
// - scrollYProgress (0% → 100%) pilote TOUT
// - Math.floor(scrollYProgress × FEATURES.length) = index de la feature active
// - Textes et Téléphone reçoivent le MÊME index → impossible d'être désynchronisés
//
// 🎯 RÉSULTAT :
// Vous scrollez ↓ → Les textes défilent ← → Le téléphone change d'interface ✨
// ═══════════════════════════════════════════════════════════════════════════════

const INFINITE_REPEAT = Number.POSITIVE_INFINITY;

const ScrollyTelling = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isInSection, setIsInSection] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const isMobile = useIsMobile();
  
  // 📏 LA GRANDE PISTE DE DÉFILEMENT (h-[320vh])
  // La section fait 3.2× la hauteur de l'écran → crée une longue piste invisible
  // Pendant que l'utilisateur scroll sur cette piste, le contenu reste fixé (sticky)
  // Offset ajusté pour terminer à 85% pour réduire l'espace blanc final
  // Sur mobile, réduire la hauteur de la piste pour moins de scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: isMobile ? ["start start", "end 90%"] : ["start start", "end 85%"] // Moins de scroll sur mobile
  });
  
  // 🎨 Transitions smooth pour entrée/sortie basées sur scrollYProgress
  // Opacité fade in au début (0-15%) et fade out à la fin (75-100%) - zones étendues pour plus de smooth
  const containerOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.85, 1],
    [0, 1, 1, 0]
  );
  
  // Translation Y smooth pour entrée (0-15%) et sortie (75-100%) - zones étendues pour plus de smooth
  const containerY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.75, 1],
    [20, 0, 0, -20]
  );
  
  // Spring pour smoothifier les transitions - Configuration ultra-smooth optimisée
  // Réduire la complexité sur mobile pour meilleures performances
  const springConfig = useMemo(() => ({
    stiffness: isMobile ? 150 : 200,
    damping: isMobile ? 40 : 30,
    mass: isMobile ? 1 : 0.5
  }), [isMobile]);
  
  const smoothOpacity = useSpring(containerOpacity, springConfig);
  const smoothY = useSpring(containerY, springConfig);
  
  // 🎯 PAS DE MOUVEMENT HORIZONTAL !
  // Les cards apparaissent/disparaissent au MÊME endroit
  // Synchronisation PARFAITE avec activeFeature

  // 🧠 MAPPING DE PROGRESSION ULTRA-RAPIDE ET SMOOTH - Memoized
  const featuresLength = useMemo(() => FEATURES.length, []);
  const threshold = useMemo(() => 0.8, []);
  
  // Calcul de l'index cible basé sur scrollYProgress optimisé pour vitesse
  const activeFeatureRaw = useTransform(
    scrollYProgress,
    (latest) => {
      const adjustedProgress = Math.min(1, latest * (1 + (1 - threshold)));
      return Math.min(featuresLength - 1, Math.floor(adjustedProgress * featuresLength));
    }
  );
  
  // Spring ultra-réactif - Configuration optimisée pour vitesse et fluidité
  const activeFeatureSpringConfig = useMemo(() => ({
    stiffness: 350,
    damping: 40,
    mass: 0.3
  }), []);
  
  const activeFeatureSpring = useSpring(activeFeatureRaw, activeFeatureSpringConfig);
  
  // Écouter les changements du spring avec performance optimisée - Memoized callbacks
  const handleActiveFeatureChange = useCallback((latest: number) => {
    const newIndex = Math.round(latest);
    
    // Cacher l'indicateur après le premier scroll
    const progress = scrollYProgress.get();
    if (progress > 0.02 && showScrollIndicator) {
      setShowScrollIndicator(false);
    }
    
    // Mise à jour instantanée si changement
    if (newIndex !== activeFeature && newIndex >= 0 && newIndex < featuresLength) {
      setActiveFeature(newIndex);
    }
  }, [activeFeature, featuresLength, showScrollIndicator, scrollYProgress]);
  
  useMotionValueEvent(activeFeatureSpring, "change", handleActiveFeatureChange);
  
  // Écouter scrollYProgress pour le hasFinished - Débloquer progressivement - Memoized
  const handleScrollProgressChange = useCallback((latest: number) => {
    // 🔒 Débloquer le scroll progressivement pour transition smooth vers section suivante
    // Transition progressive entre 0.8 et 0.85 pour éviter les changements brusques
    if (latest >= 0.85) {
      setHasFinished(true);
    } else if (latest < 0.8) {
      setHasFinished(false);
    }
    // Entre 0.8 et 0.85, on laisse hasFinished dans son état actuel pour transition smooth
  }, []);
  
  useMotionValueEvent(scrollYProgress, "change", handleScrollProgressChange);

  // 🔍 Détecter quand on entre dans la section - Optimisé avec useCallback
  const handleIntersection = useCallback(([entry]: IntersectionObserverEntry[]) => {
    setIsInSection(entry.isIntersecting);
  }, []);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(handleIntersection, { 
      threshold: 0.1,
      rootMargin: '50px'
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [handleIntersection]);

  // 🔒 BLOQUER LE SCROLL AU-DELÀ si pas fini - Optimisé avec useCallback
  const preventScrollBeyond = useCallback((e: WheelEvent) => {
    const progress = scrollYProgress.get();
    
    // Si on scroll vers le bas et qu'on est pas encore à 100%
    if (e.deltaY > 0 && progress < 0.98) {
      // Laisser le scroll natif fonctionner (pour avancer dans le scrollytelling)
      return;
    }
    
    // Si on scroll vers le bas et qu'on est à 98%+, bloquer
    if (e.deltaY > 0 && progress >= 0.98) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Si on scroll vers le haut, toujours autoriser (pour revenir en arrière)
    if (e.deltaY < 0) {
      return;
    }
  }, [scrollYProgress]);
  
  useEffect(() => {
    if (!isInSection || hasFinished) return;

    window.addEventListener('wheel', preventScrollBeyond, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', preventScrollBeyond);
    };
  }, [isInSection, hasFinished, preventScrollBeyond]);

  return (
    <>
    {/* 📏 LA GRANDE PISTE : h-[320vh] = 3.2× la hauteur de l'écran
        Crée une zone de scroll optimisée pour transition fluide vers section suivante
        🔒 FIXATION : Si isInSection ET pas fini → position fixed pour "bloquer" la vue
        Margin-bottom négatif pour réduire l'espace blanc après la dernière animation */}
    <section 
      ref={containerRef} 
      className="relative w-full h-[320vh] bg-white" 
      id="features"
      style={{ marginBottom: '-80vh' }}
    >
      {/* 🎬 LE CONTENU FIXÉ : sticky top-0 h-screen (devient fixed si actif)
          Ce div reste "collé" en haut pendant que vous scrollez la grande piste.
          C'est ce qui donne l'illusion que le téléphone et les textes restent à l'écran
          pendant que vous contrôlez les animations avec le scroll. */}
      <motion.div 
        className="h-screen w-full overflow-y-auto lg:overflow-hidden bg-white z-10"
        style={{
          position: (isInSection && !hasFinished) ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: (isInSection && !hasFinished) ? 50 : 10,
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
          isolation: 'isolate',
          opacity: smoothOpacity,
          y: smoothY
        }}
        transition={{
          position: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        }}
      >
        {/* Indicateur de progression */}
        <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 md:gap-3 bg-white/90 backdrop-blur-xl px-3 md:px-6 py-1.5 md:py-3 rounded-full shadow-lg border border-slate-200">
          <div className="flex gap-1 md:gap-1.5">
            {FEATURES.map((_, index) => (
              <div
                key={index}
                className={`h-1 md:h-1.5 rounded-full transition-all duration-[500ms] ease-out ${
                  index === activeFeature 
                    ? 'w-6 md:w-8 bg-slate-900' 
                    : index < activeFeature 
                    ? 'w-1 md:w-1.5 bg-slate-400' 
                    : 'w-1 md:w-1.5 bg-slate-200'
                }`}
              />
                    ))}
                  </div>
          <div className="text-[9px] md:text-xs font-light text-slate-900 tabular-nums leading-tight">
            {String(activeFeature + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
          </div>
                  </div>
                  
        {/* 🎯 NOUVELLE STRUCTURE : Une seule card visible à la fois, positionnée à côté du phone */}
        <div className="w-full min-h-screen lg:h-full flex flex-col lg:flex-row items-center justify-center px-2 sm:px-4 md:px-6 lg:px-12 xl:px-24 py-4 sm:py-6 md:py-8 lg:py-0 gap-4 md:gap-6 lg:gap-12 xl:gap-0 overflow-y-auto lg:overflow-hidden" style={{ position: 'relative', willChange: 'transform', width: '100%', maxWidth: '100vw', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* 💳 CARD 3D EXPLODED - Caché sur mobile et iPad Pro, visible uniquement sur desktop XL */}
          <div className="hidden xl:flex absolute left-[5%] top-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ willChange: 'transform' }}>
            <Card3DExploded activeFeature={activeFeature} progress={scrollYProgress} />
          </div>

          {/* 🎯 COPYWRITING EXPERT-LEVEL - Centré sur iPad Pro avec flexbox, positionné absolument sur desktop XL */}
          <div className="hidden lg:flex lg:relative xl:absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 z-20 w-full max-w-[440px] pointer-events-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFeature}
                initial={{ 
                  opacity: 0, 
                  y: 20,
                  scale: 0.96,
                  filter: 'blur(4px)',
                  rotateX: -3
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                  rotateX: 0
                }}
                exit={{ 
                  opacity: 0, 
                  y: -20,
                  scale: 0.96,
                  filter: 'blur(4px)',
                  rotateX: 3
                }}
                transition={{ 
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  filter: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity, filter',
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className="w-full"
              >
                <div className="space-y-6 md:space-y-8 lg:space-y-9">
                  {/* Introduction - Expert: Parallax subtil et typographie raffinée */}
                  <motion.div 
                    className="space-y-3.5"
                    initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ 
                      delay: 0.03, 
                      duration: 0.3, 
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }}
                    style={{ 
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <motion.p 
                      className="text-[13.5px] text-slate-600/75 leading-[1.8] font-light text-center tracking-[0.01em]"
                      animate={{
                        opacity: [0.75, 0.85, 0.75]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut"
                      }}
                    >
                      {FEATURES[activeFeature].pain}
                    </motion.p>
                  </motion.div>

                  {/* Pain Section - Expert: Multi-layer glassmorphism avec parallaxe */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.06, 
                      duration: 0.35, 
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className="relative"
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <div className="bg-white/92 backdrop-blur-[40px] border border-red-100/35 rounded-[36px] p-8 shadow-[0_8px_32px_rgba(239,68,68,0.06),0_0_0_0.5px_rgba(239,68,68,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden">
                      {/* Multi-layer gradient system - Réduit pour meilleure lisibilité */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-50/15 via-transparent to-pink-50/10 pointer-events-none rounded-[36px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-red-50/5 via-transparent to-transparent pointer-events-none rounded-[36px]" />
                      
                      {/* Animated light sweep - Réduit pour meilleure lisibilité */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/15 to-transparent pointer-events-none rounded-[36px]"
                        animate={{ 
                          opacity: [0.08, 0.18, 0.08],
                          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                          scale: [1, 1.03, 1]
                        }}
                        transition={{ 
                          duration: 5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: [0.4, 0, 0.6, 1]
                        }}
                      />
                      
                      {/* Subtle noise texture */}
                      <div 
                        className="absolute inset-0 opacity-[0.015] pointer-events-none rounded-[36px]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                          backgroundSize: '100px 100px'
                        }}
                      />
                      
                      <div className="relative z-10">
                        <motion.p 
                          className="text-[13px] text-slate-950 leading-[1.7] font-light text-center mb-4 tracking-[-0.01em]"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.09, 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1],
                            opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                          }}
                          style={{ 
                            willChange: 'transform, opacity',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          {FEATURES[activeFeature].problem}
                        </motion.p>
                        <motion.p 
                          className="text-[11px] text-slate-700/85 font-light text-center italic leading-[1.6]"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.11, 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1],
                            opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                          }}
                          style={{ 
                            willChange: 'transform, opacity',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          {FEATURES[activeFeature].painSubtitle}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Animated Arrow Separator - Expert: Morphing line avec micro-interactions */}
                  <motion.div 
                    className="flex items-center justify-center py-3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 0.08, 
                      duration: 0.35, 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                    style={{ 
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <div className="relative">
                      <motion.div
                        className="w-24 h-[1px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ 
                          delay: 0.1, 
                          duration: 0.35, 
                          ease: [0.22, 1, 0.36, 1] 
                        }}
                        style={{ 
                          willChange: 'transform, opacity',
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                      <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{ 
                          x: [0, 2.5, 0],
                          opacity: [0.4, 0.75, 0.4],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: [0.4, 0, 0.6, 1]
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowRight className="text-slate-400/50" size={19} strokeWidth={1.8} />
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Solution Section - Expert: Multi-layer avec parallaxe 3D */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.06, 
                      duration: 0.35, 
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className="relative space-y-6"
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    {/* Solution principale */}
                    <div className="bg-white/92 backdrop-blur-[40px] border border-emerald-100/35 rounded-[36px] p-8 shadow-[0_8px_32px_rgba(16,185,129,0.06),0_0_0_0.5px_rgba(16,185,129,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden">
                      {/* Multi-layer gradient system - Réduit pour meilleure lisibilité */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/15 via-transparent to-teal-50/10 pointer-events-none rounded-[36px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/5 via-transparent to-transparent pointer-events-none rounded-[36px]" />
                      
                      {/* Animated light sweep - Réduit pour meilleure lisibilité */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/15 to-transparent pointer-events-none rounded-[36px]"
                        animate={{ 
                          opacity: [0.08, 0.18, 0.08],
                          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                          scale: [1, 1.03, 1]
                        }}
                        transition={{ 
                          duration: 5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: [0.4, 0, 0.6, 1],
                          delay: 0.6
                        }}
                      />
                      
                      {/* Subtle noise texture */}
                      <div 
                        className="absolute inset-0 opacity-[0.015] pointer-events-none rounded-[36px]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                          backgroundSize: '100px 100px'
                        }}
                      />
                      
                      <div className="relative z-10">
                        <motion.p 
                          className="text-[10px] text-slate-950 leading-[1.7] font-light text-center tracking-[-0.01em]"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.09, 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1],
                            opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                          }}
                          style={{ 
                            willChange: 'transform, opacity',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          {FEATURES[activeFeature].solution}
                        </motion.p>
                      </div>
                    </div>

                    {/* Result Section - Expert: Fond sombre avec glow animé */}
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.05, 
                      duration: 0.3, 
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }}
                      style={{ 
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                      className="bg-slate-900/92 backdrop-blur-[40px] border border-slate-800/40 rounded-[28px] p-7 shadow-[0_8px_32px_rgba(15,23,42,0.25),0_0_0_0.5px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden"
                      whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
                    >
                      {/* Animated glow effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none rounded-[28px]"
                        animate={{
                          opacity: [0.3, 0.5, 0.3],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Ultra-subtle shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none rounded-[28px]" />
                      
                      <div className="relative z-10">
                        <motion.div 
                          className="flex items-center justify-center gap-3 mb-4"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.11, 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1] 
                          }}
                          style={{ 
                            willChange: 'transform, opacity',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.08, 1],
                              rotate: [0, 360]
                            }}
                            transition={{
                              scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                              rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }
                            }}
                          >
                            <CheckCircle size={16} className="text-emerald-400/85" strokeWidth={1.8} />
                          </motion.div>
                          <span className="text-[10.5px] font-light text-emerald-400/75 uppercase tracking-[0.35em]">
                            Résultat
                          </span>
                        </motion.div>
                        <motion.p 
                          className="text-[12px] text-white/96 leading-[1.6] font-light text-center tracking-[-0.01em]"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.13, 
                            duration: 0.35, 
                            ease: [0.22, 1, 0.36, 1],
                            opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                          }}
                          style={{ 
                            willChange: 'transform, opacity',
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          {FEATURES[activeFeature].result}
                        </motion.p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* CTA Button - Expert: Multi-layer avec micro-interactions avancées */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.14, 
                      duration: 0.35, 
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                    }}
                    style={{ 
                      willChange: 'transform, opacity',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <motion.button
                      whileHover={{ 
                        scale: 1.015,
                        boxShadow: '0_12px_40px_rgba(15,23,42,0.3),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.2)',
                        y: -1.5
                      }}
                      whileTap={{ scale: 0.985 }}
                      className="w-full relative bg-slate-900 text-white text-[13.5px] font-light tracking-[0.3em] py-5 px-9 rounded-full shadow-[0_8px_28px_rgba(15,23,42,0.35),0_0_0_0.5px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_16px_48px_rgba(15,23,42,0.45),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-600 flex items-center justify-center gap-3.5 group overflow-hidden backdrop-blur-md"
                      style={{ willChange: 'transform, box-shadow' }}
                    >
                      {/* Multi-layer shine system - Expert */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: '-100%', opacity: 0 }}
                        whileHover={{ x: '100%', opacity: 1 }}
                        transition={{ duration: 0.9, ease: [0.4, 0, 0.6, 1] }}
                      />
                      
                      {/* Secondary shine layer */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      {/* Animated gradient pulse */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 via-transparent to-teal-500/8 opacity-0 group-hover:opacity-100"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear"
                        }}
                        style={{ backgroundSize: '200% 100%' }}
                      />
                      
                      {/* Subtle noise texture */}
                      <div 
                        className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                          backgroundSize: '80px 80px'
                        }}
                      />
                      
                      <motion.span 
                        className="relative z-10"
                        whileHover={{ letterSpacing: '0.35em' }}
                        transition={{ duration: 0.3 }}
                      >
                        {FEATURES[activeFeature].cta}
                      </motion.span>
                      <motion.div
                        className="relative z-10"
                        animate={{ 
                          x: [0, 2.5, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: [0.4, 0, 0.6, 1]
                        }}
                        whileHover={{ x: 4, scale: 1.1 }}
                      >
                        <ArrowRightCircle size={18} className="group-hover:translate-x-1.5 transition-transform duration-500" strokeWidth={1.8} />
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 📱 TÉLÉPHONE 3D - Visible sur tous les écrans, centré sur mobile et iPad Pro avec flexbox, à droite sur desktop XL */}
          {/* Comme le texte et le téléphone sont pilotés par la MÊME variable (activeFeature),
              ils ne peuvent JAMAIS être désynchronisés ! */}
          <div className="flex flex-shrink-0 lg:relative xl:absolute xl:right-[5%] xl:top-1/2 xl:-translate-y-1/2 z-30 pointer-events-none flex-col items-center justify-center gap-4 lg:gap-8 w-full lg:w-auto" style={{ willChange: 'transform', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            <Phone3DExploded activeFeature={activeFeature} progress={scrollYProgress} />
            
            {/* Label de la feature active - MÊME TIMING que la card */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div 
                key={activeFeature}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className="text-center"
              >
                <div className="text-sm font-light text-slate-900 mb-1">{FEATURES[activeFeature].title}</div>
                <div className="text-xs text-slate-500">{FEATURES[activeFeature].desc}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        
      </motion.div>
    </section>
  </>
  );
};

const TestimonialMarquee = React.memo(() => {
  const { t } = useLanguage();
  const testimonials = useMemo(() => 
    (t('landingV2.testimonials.items', { returnObjects: true }) as any[]) || [], 
    [t]
  );
  
  // Memoized testimonials array pour éviter les recalculs
  const duplicatedTestimonials = useMemo(() => 
    [...testimonials, ...testimonials, ...testimonials], 
    [testimonials]
  );
  
  return (
    <section className="py-40 md:py-56 bg-white overflow-hidden relative" style={{ overflowY: 'hidden' }}>
      {/* Ultra-subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
      </div>
      
      {/* Gradient fades - Ultra subtle */}
      <div className="absolute left-0 top-0 bottom-0 w-40 md:w-64 bg-gradient-to-r from-white via-white/70 to-transparent z-30 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 md:w-64 bg-gradient-to-l from-white via-white/70 to-transparent z-30 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 max-w-[1920px]">
        {/* Header - Apple-level typography */}
        <motion.div 
          className="mb-20 md:mb-28 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="text-[10px] font-light text-slate-500 uppercase tracking-[0.15em] mb-5 inline-block"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('landingV2.testimonials.badge')}
          </motion.div>
          <motion.h2 
            className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 tracking-[-0.03em] leading-[1.05]"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {t('landingV2.testimonials.title')}
          </motion.h2>
        </motion.div>
        
        {/* Marquee Container - Fixed height to prevent vertical scroll */}
        <div className="relative overflow-x-hidden overflow-y-hidden" style={{ height: 'auto', minHeight: '420px' }}>
          <motion.div 
            className="flex gap-5 md:gap-6" 
            animate={{ x: '-50%' }} 
            transition={{ duration: 60, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            style={{ 
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            {duplicatedTestimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: (i % testimonials.length) * 0.06,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.01,
                  transition: { 
                    duration: 0.3, 
                    ease: [0.22, 1, 0.36, 1],
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }
                }}
                className="w-[360px] md:w-[420px] flex-shrink-0 relative group"
                style={{ 
                  height: 'fit-content',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
              >
                {/* Card with ultra-premium glassmorphism */}
                <div className="relative bg-white/85 backdrop-blur-[80px] p-9 md:p-11 rounded-[32px] md:rounded-[36px] border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-500 overflow-hidden">
                  
                  {/* Ultra-subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[36px]" />
                  
                  {/* Subtle shine effect - More refined */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none rounded-[36px]"
                    animate={{
                      opacity: [0, 0.12, 0],
                      backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Subtle border glow on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, transparent 50%)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      margin: '-1px'
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Stars - More refined */}
                    <div className="flex gap-0.5 mb-8">
                      {[...Array(5)].map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            delay: j * 0.06, 
                            type: 'spring', 
                            stiffness: 400,
                            damping: 25
                          }}
                        >
                          <Star 
                            size={13} 
                            fill="currentColor" 
                            className="w-3.5 h-3.5 text-amber-400/85" 
                            strokeWidth={0.3}
                          />
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Quote - Refined Apple typography */}
                    <p className="text-slate-800 text-[18px] md:text-[19px] leading-[1.75] font-light mb-11 relative tracking-[-0.015em]">
                      <span className="text-[52px] text-slate-200/50 font-serif leading-none absolute -left-1.5 -top-4 font-light">"</span>
                      <span className="relative z-10 pl-2">{item.text}</span>
                      <span className="text-[52px] text-slate-200/50 font-serif leading-none font-light">"</span>
                    </p>
                    
                    {/* Author - Ultra minimalist */}
                    <div className="flex items-center gap-4 pt-5 border-t border-slate-100/80">
                      <motion.div 
                        className="w-12 h-12 md:w-13 md:h-13 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center font-light text-slate-700 text-[15px] md:text-[16px] shadow-sm border border-slate-200/60 relative overflow-hidden"
                        whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-transparent" />
                        <span className="relative z-10">{item.name?.charAt(0)}</span>
                      </motion.div>
                      <div>
                        <div className="font-light text-slate-900 text-[16px] md:text-[17px] tracking-[-0.015em]">{item.name}</div>
                        <div className="text-[12px] md:text-[13px] text-slate-500 font-light tracking-[0.02em] mt-1">{item.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

TestimonialMarquee.displayName = 'TestimonialMarquee';

const FAQ = () => {
  const { t } = useLanguage();
  const faqItems = (t('landingV2.faq.items', { returnObjects: true }) as any[]) || FAQS;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <section className="py-32 md:py-40 bg-gradient-to-b from-white via-slate-50/20 to-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/2 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 12, repeat: -1, ease: "easeInOut" }}
        />
      </div>
      
      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <motion.div
          className="mb-20 md:mb-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="text-xs font-light text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50/80 backdrop-blur-sm inline-block px-4 py-2 rounded-full border border-blue-100/50 shadow-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('landingV2.faq.badge')}
          </motion.div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 tracking-tight text-slate-900 leading-[1.05]">
            {t('landingV2.faq.title')}
          </h2>
        </motion.div>
        
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {faqItems.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`border border-slate-200/50 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden transition-all duration-500 ${
                activeIndex === i 
                  ? 'bg-white/90 backdrop-blur-xl border-slate-300/50 shadow-[0_20px_64px_rgba(0,0,0,0.08)]' 
                  : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:border-slate-300/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
              }`}
            >
              <button
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-6 md:p-8 text-left group"
              >
                <span className="font-light text-lg md:text-xl text-slate-900 pr-8 group-hover:text-slate-700 transition-colors">
                  {item.q}
                </span>
                <motion.div 
                  animate={{ rotate: activeIndex === i ? 45 : 0, scale: activeIndex === i ? 1.1 : 1 }} 
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <Plus size={20} strokeWidth={2.5} className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </motion.div>
              </button>
              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 md:px-8 pb-6 md:pb-8 text-slate-600 leading-relaxed text-base md:text-lg">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CalculatorWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [value, setValue] = useState(10);
  const hoursSaved = value * 52;
  const moneySaved = hoursSaved * 5000;
  
  return (
    <div className="relative bg-black py-32 md:py-40 overflow-hidden text-center isolate" id="manifesto">
      {/* Background effects sophistiqués */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 15, repeat: -1, ease: [0.4, 0, 0.6, 1] }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[800px] h-[400px] bg-purple-500/8 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: -1, ease: "easeInOut" }}
        />
        
        {/* Grille subtile */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="darkGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#darkGrid)" />
        </svg>
      </div>
      
      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 max-w-5xl ">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-white mb-6 md:mb-8 tracking-tighter leading-[0.9]">
            Votre temps a de la valeur.
          </h2>
          <p className="text-slate-300/80 text-lg md:text-xl lg:text-2xl mb-16 md:mb-20 max-w-3xl mx-auto font-light leading-relaxed">
            Estimez combien Booh peut vous faire économiser en optimisant votre gestion quotidienne.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 lg:p-16 shadow-2xl shadow-black/20 relative overflow-hidden"
        >
          {/* Gradient overlay animé */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-[4rem]"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: -1,
              ease: "easeInOut",
            }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 mb-12 md:mb-16">
            <motion.div 
              className="text-slate-300/60 text-xs md:text-sm uppercase tracking-[0.2em] font-light"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: -1,
              }}
            >
              Heures économisées / semaine
            </motion.div>
            <motion.div 
              className="text-[80px] md:text-[120px] lg:text-[140px] font-light text-white leading-none tracking-tighter tabular-nums select-none flex items-baseline gap-3 md:gap-4"
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {value}
              <span className="text-2xl md:text-3xl lg:text-4xl text-slate-400 font-light">h</span>
            </motion.div>
            
            {/* Slider amélioré */}
            <div className="w-full max-w-lg relative h-14 md:h-16 flex items-center">
              <div className="absolute w-full h-2 md:h-2.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/30"
                  style={{ width: `${(value / 40) * 100}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Effet de brillance */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: -1,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value))}
                aria-label="Nombre d'heures économisées par semaine"
                aria-valuemin={1}
                aria-valuemax={40}
                aria-valuenow={value}
                className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              <motion.div
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-xl shadow-white/20 absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center"
                style={{ left: `calc(${(value / 40) * 100}% - 20px)` }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <motion.div 
                  className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: -1,
                  }}
                />
              </motion.div>
            </div>
          </div>
          
          {/* Stats cards améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left max-w-3xl mx-auto border-t border-white/10 pt-10 md:pt-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/8 transition-all duration-500 group"
            >
              <div className="text-slate-300/60 mb-3 text-xs md:text-sm font-light uppercase tracking-wider">Gain annuel (heures)</div>
              <motion.div 
                className="text-4xl md:text-5xl lg:text-6xl font-light text-white tabular-nums"
                key={hoursSaved}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {hoursSaved.toLocaleString()} <span className="text-lg md:text-xl text-slate-400">h</span>
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/8 transition-all duration-500 group"
            >
              <div className="text-slate-300/60 mb-3 text-xs md:text-sm font-light uppercase tracking-wider">Économie estimée (FCFA)</div>
              <motion.div 
                className="text-4xl md:text-5xl lg:text-6xl font-light text-emerald-400 tabular-nums"
                key={moneySaved}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {moneySaved.toLocaleString()}
              </motion.div>
            </motion.div>
          </div>
          
          <div className="mt-8 md:mt-10 text-xs md:text-sm text-slate-400/60 font-light text-center">
            * Basé sur 52 semaines actives et un taux horaire estimé à 5.000 FCFA.
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-16 md:mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <MagneticButton className="inline-block">
            <ShimmerButton 
              onClick={() => {
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/auth');
                }
              }}
              className="group relative bg-white text-slate-900 px-10 md:px-14 py-5 md:py-6 rounded-full font-light text-base md:text-lg hover:scale-105 transition-all duration-500 shadow-2xl shadow-white/20 overflow-hidden"
            >
              {/* Effet de brillance */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: -1,
                  ease: "linear",
                }}
              />
              <span className="relative z-10">Démarrer l'essai gratuit</span>
            </ShimmerButton>
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
};

// Ancien composant Pricing supprimé - remplacé par PricingSection


// Lazy loading des composants lourds pour améliorer les performances
// Utilisation de Promise.resolve avec code splitting réel
const LazyScrollyTelling = lazy(() => Promise.resolve({ default: ScrollyTelling }));
const LazyTestimonialMarquee = lazy(() => Promise.resolve({ default: TestimonialMarquee }));
const LazyPricing = lazy(() => Promise.resolve({ default: PricingSection }));
const LazyFAQ = lazy(() => Promise.resolve({ default: FAQ }));
const LazyCalculatorWidget = lazy(() => Promise.resolve({ default: CalculatorWidget }));

// Composant de chargement minimaliste - Optimisé pour réseau faible
const SectionLoader = () => {
  const isSlowConnection = useMemo(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      return conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.saveData);
    }
    return false;
  }, []);
  
  if (isSlowConnection) {
    // Loader minimal sans animation sur réseau faible
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full opacity-50" />
      </div>
    );
  }
  
  return (
    <div className="w-full h-32 flex items-center justify-center">
      <motion.div
        className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </div>
  );
};

// --- MAIN PAGE ---
const AwwardsLevelLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { isSlowConnection, isLowDataMode } = useSmartPreload();
  const isMobile = useIsMobile();
  
  // Skip preloader sur mobile/réseau faible pour affichage immédiat
  useEffect(() => {
    if (isMobile || isSlowConnection || isLowDataMode) {
      setLoading(false);
    }
  }, [isMobile, isSlowConnection, isLowDataMode]);
  
  // Précharger les images critiques seulement si réseau suffisant
  useEffect(() => {
    if (!isSlowConnection && !isLowDataMode && typeof window !== 'undefined') {
      // Précharger les images critiques en arrière-plan avec priorité
      const criticalImages = [
        imgLocal.heroBg,
        imgLocal.avatar,
        imgLocal.product1
      ];
      
      criticalImages.forEach(src => {
        // Vérifier si l'image n'est pas déjà en cache
        const img = new Image();
        img.src = src;
        
        // Ajouter preload link pour priorité
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      });
    }
  }, [isSlowConnection, isLowDataMode]);
  
  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);
  
  // Réduire les animations sur mobile/réseau faible
  const shouldReduceMotion = isMobile || isSlowConnection || isLowDataMode;
  
  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen selection:bg-slate-900 selection:text-white relative cursor-default apple-minimal-font">
      <AnimatePresence mode="wait">
        {loading && !isMobile && !isSlowConnection && !isLowDataMode && (
          <Preloader 
            onComplete={handleLoadingComplete}
          />
        )}
      </AnimatePresence>
      {(!loading || isMobile || isSlowConnection || isLowDataMode) && (
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          {!shouldReduceMotion && <CustomCursor />}
          {!shouldReduceMotion && (
            <div
              className="fixed inset-0 opacity-[0.03] pointer-events-none z-[100] mix-blend-multiply"
              style={{ 
                backgroundImage: imgLocal.noise,
                willChange: 'opacity',
                transform: 'translateZ(0)'
              }}
            />
          )}
          <PublicNavbar />
          {/* Hero3D et BentoGrid chargés immédiatement mais avec lazy loading des images internes */}
          <Hero3D />
          <BentoGrid />
          
          {/* Toutes les sections sont toujours chargées, mais optimisées selon le réseau */}
          <Suspense fallback={<SectionLoader />}>
            <LazyScrollyTelling />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <LazyTestimonialMarquee />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <LazyPricing />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <LazyFAQ />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <LazyCalculatorWidget />
          </Suspense>
          
          <FooterDark />
        </motion.div>
      )}
    </div>
  );
};

export default AwwardsLevelLanding;
