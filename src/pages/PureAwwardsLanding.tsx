import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import * as THREE from 'three';
import PremiumIllustrations from '@/components/landing/illustrations/PremiumMotionGraphics';

gsap.registerPlugin(ScrollTrigger);

/**
 * PURE AWWWARDS EXPERIENCE
 * Minimalisme extrême : Noir + Blanc + Purple
 * Zéro distraction. Maximum impact.
 */
const PureAwwardsLanding: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const storiesTrackRef = useRef<HTMLDivElement>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [activeStory, setActiveStory] = useState(0);
  const storyCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const { scrollYProgress } = useScroll();
  const cardOpacity = useSpring(useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [1, 0.3, 0.3, 1]), { stiffness: 100, damping: 30 });

  // Carte 3D épurée
  const ENABLE_3D = false;

  /* 3D logic commented out to reduce bundle size as ENABLE_3D is currently false
  useEffect(() => {
    ... existing 3D code ...
  }, []);
  */

  // GSAP Text animations
  useEffect(() => {
    const titles = document.querySelectorAll('.gsap-title');
    const localTriggers: ScrollTrigger[] = [];
    titles.forEach((title, index) => {
      const anim = gsap.fromTo(title,
        { opacity: 0, y: 100, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.5,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 80%',
            end: 'top 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );
      if (anim.scrollTrigger) localTriggers.push(anim.scrollTrigger);
    });

    const details = document.querySelectorAll('.gsap-detail');
    details.forEach((detail) => {
      const anim = gsap.fromTo(detail,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: detail,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
      if (anim.scrollTrigger) localTriggers.push(anim.scrollTrigger);
    });

    return () => {
      localTriggers.forEach(t => t.kill());
    };
  }, []);

  const handleDemoClick = () => {
    if (pricingRef.current) {
      pricingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate('/pricing');
  };

  useEffect(() => {
    const track = storiesTrackRef.current;
    if (!track) return;
    const handleScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) {
        setStoryProgress(0);
        return;
      }
      setStoryProgress(Math.min(1, Math.max(0, track.scrollLeft / max)));
    };
    handleScroll();
    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const track = storiesTrackRef.current;
    const cards = storyCardsRef.current.filter(Boolean);
    if (!track || cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio - a.intersectionRatio));
        if (visible[0]) {
          const idx = cards.indexOf(visible[0].target as HTMLDivElement);
          if (idx !== -1) setActiveStory(idx);
        }
      },
      {
        root: track,
        threshold: [0.5, 0.7, 0.9]
      }
    );

    cards.forEach(card => observer.observe(card!));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = storiesTrackRef.current;
    if (!track) return;
    const handleWheel = (e: WheelEvent) => {
      // Laisser le scroll natif sur mobile/tablette pour éviter les blocages
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      track.scrollBy({ left: e.deltaY * 1.05, behavior: 'smooth' });
    };
    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, []);

  const handleStoryNav = (direction: 'prev' | 'next') => {
    const track = storiesTrackRef.current;
    if (!track) return;
    const cardWidth = storyCardsRef.current[activeStory]?.clientWidth ?? track.clientWidth;
    const delta = cardWidth * 0.9;
    track.scrollBy({ left: direction === 'next' ? delta : -delta, behavior: 'smooth' });
  };

  const stories = [
    {
      num: '01',
      pain: 'Vous distribuez 80 cartes. Seulement 3 personnes vous rappellent.',
      sol: 'Ils tapent leur téléphone. Contact enregistré.',
      detail: 'Le contact s\'enregistre automatiquement dans leur téléphone. Plus jamais de cartes perdues.',
      Illustration: PremiumIllustrations.PremiumCRMIllustration
    },
    {
      num: '02',
      pain: 'Vous passez 2 heures à taper 50 cartes de visite à la main.',
      sol: 'Prenez une photo. Terminé.',
      detail: 'L\'IA reconnaît nom, téléphone et email en 2 secondes. 98% de précision.',
      Illustration: PremiumIllustrations.PremiumOCRIllustration
    },
    {
      num: '03',
      pain: 'Un client veut vous voir. Vous oubliez. Il part chez le concurrent.',
      sol: 'Le client choisit une heure. Confirmé automatiquement.',
      detail: 'Rappel SMS envoyé la veille à vous deux. Zéro oubli, zéro stress.',
      Illustration: PremiumIllustrations.PremiumAgendaIllustration
    },
    {
      num: '04',
      pain: 'Client commande 5 produits. Vous découvrez qu\'il en reste 2.',
      sol: 'Le stock se met à jour à chaque vente.',
      detail: 'Alerte avant rupture de stock. Prévisions IA pour anticiper.',
      Illustration: PremiumIllustrations.PremiumStockIllustration
    },
    {
      num: '05',
      pain: 'Les clients cherchent un designer. Ils ne vous trouvent pas.',
      sol: 'Vous apparaissez sur la carte de votre ville.',
      detail: 'Comme Google Maps, mais pour les professionnels. Géolocalisation instantanée.',
      Illustration: PremiumIllustrations.PremiumMapIllustration
    },
    {
      num: '06',
      pain: 'Client demande : Moov, Wave ou Orange Money ? Vous galérez.',
      sol: 'Le client choisit. Vous recevez l\'argent.',
      detail: 'Moov Money, Wave, Orange Money, Visa, Mastercard. Tous au même endroit.',
      Illustration: PremiumIllustrations.PremiumPaymentIllustration
    },
    {
      num: '07',
      pain: 'Client : "Montrez-moi vos projets." Vous cherchez dans 10 dossiers.',
      sol: 'Vous envoyez un lien. Tout est là.',
      detail: 'Galerie HD professionnelle. Bouton "Demander un devis" intégré. Conversion +240%.',
      Illustration: PremiumIllustrations.PremiumPortfolioIllustration
    },
    {
      num: '08',
      pain: 'Votre ebook à 10 000 F est piraté sur Telegram le jour même.',
      sol: 'Même volé, impossible à ouvrir.',
      detail: 'Chiffrement 256-bit. Code secret unique par acheteur. Protection militaire.',
      Illustration: PremiumIllustrations.PremiumDRMIllustration
    }
  ];

  return (
    <div className="relative bg-white text-black apple-minimal-font">
      {/* 3D Background (désactivé) */}
      {ENABLE_3D && (
        <motion.div ref={canvasRef} className="fixed inset-0 z-0" style={{ opacity: cardOpacity }} />
      )}

      {/* Grain ultra-fin */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />

      <div className="relative z-20" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

        {/* HERO - Proposition de valeur immédiate RESPONSIVE */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-0 bg-white">
          <motion.div
            className="max-w-5xl text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            {/* Tag valeur RESPONSIVE */}
            <motion.div
              className="inline-block px-3 md:px-4 py-1.5 md:py-2 border border-black/20 rounded-full text-xs md:text-sm font-mono mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Une seule plateforme. Tous vos outils.
            </motion.div>

            {/* Titre principal - Bénéfice clair RESPONSIVE */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 md:mb-8"
              style={{ lineHeight: '1.1', letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Arrêtez de perdre<br />
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 1, type: "spring", stiffness: 80 }}
              >
                des clients.
              </motion.span>
            </motion.h1>

            <motion.div
              className="w-24 h-px bg-black mx-auto my-12"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 1.2, duration: 1 }}
            />

            {/* USP clair RESPONSIVE */}
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-gray-600 font-light max-w-3xl mx-auto mb-12 md:mb-16 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
            >
              Bööh transforme chaque contact en opportunité.<br className="hidden md:block" />
              <span className="md:hidden"> </span>CRM, Agenda, Paiements, Portfolio — tout en un.
            </motion.p>

            {/* CTA Principal RESPONSIVE */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center justify-center w-full max-w-md sm:max-w-none px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              <motion.button
                onClick={() => navigate('/auth')}
                className="group relative px-8 md:px-10 py-4 md:py-5 bg-black text-white rounded-full text-base md:text-lg font-light overflow-hidden w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative z-10">Commencer gratuitement</span>
              </motion.button>

              <motion.button
                onClick={handleDemoClick}
                className="px-8 md:px-10 py-4 md:py-5 border-2 border-black text-black rounded-full text-base md:text-lg font-light hover:bg-black hover:text-white transition-colors duration-300 w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Voir la démo
              </motion.button>
            </motion.div>

            {/* Trust signals RESPONSIVE */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 mt-12 md:mt-16 text-xs md:text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              <div>✓ Gratuit pour commencer</div>
              <div className="hidden sm:block w-px h-4 bg-gray-300" />
              <div>✓ Aucune carte requise</div>
              <div className="hidden sm:block w-px h-4 bg-gray-300" />
              <div>✓ 2 min de setup</div>
            </motion.div>
          </motion.div>
        </section>

        {/* Les 8 histoires - Scroller horizontal immersive */}
        <section className="relative min-h-screen bg-white text-black flex flex-col justify-center px-4 sm:px-6 md:px-8 py-14 lg:py-20 overflow-hidden">
          {/* Halo et gradations apple-like */}
          <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.1),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_28%)]" />

          <div className="relative max-w-6xl lg:max-w-7xl mx-auto w-full mb-7 md:mb-11 px-1 sm:px-0">
            <div className="text-xs font-mono text-gray-500 tracking-[0.35em] uppercase mb-3">Problèmes & Solutions</div>
            <div className="flex flex-col gap-4">
              <h2 className="font-light leading-[1.05] tracking-[-0.03em] text-[clamp(2.25rem,6vw,5rem)]">
                Chaque douleur, <span className="text-black/50 font-light">une réponse immédiate.</span>
              </h2>
            </div>
          </div>

          {/* Progress bar + bullets */}
          <div className="relative max-w-6xl lg:max-w-7xl mx-auto w-full mb-5 md:mb-8 px-1 sm:px-0">
            <div className="h-1.5 md:h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-black via-[#8b5cf6] to-[#60a5fa] rounded-full transition-[width] duration-200 ease-out"
                style={{ width: `${Math.round(storyProgress * 100)}%` }}
              />
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {stories.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const card = storyCardsRef.current[idx];
                    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${activeStory === idx ? 'bg-black' : 'bg-black/20'}`}
                  aria-label={`Aller à l'histoire ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative max-w-full">
            {/* Edge fades for depth */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-16 md:w-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-16 md:w-20 bg-gradient-to-l from-white via-white/80 to-transparent" />

            {/* Navigation buttons */}
            <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
              <button
                onClick={() => handleStoryNav('prev')}
                className="pointer-events-auto hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-lg border border-black/5 hover:-translate-x-0.5 hover:shadow-xl transition-all duration-200"
                aria-label="Précédent"
              >
                ←
              </button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <button
                onClick={() => handleStoryNav('next')}
                className="pointer-events-auto hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white shadow-lg border border-white/10 hover:translate-x-0.5 hover:shadow-xl transition-all duration-200"
                aria-label="Suivant"
              >
                →
              </button>
            </div>

            <div
              ref={storiesTrackRef}
              className="horizontal-scroll flex gap-8 sm:gap-10 md:gap-12 overflow-x-auto snap-x snap-mandatory pb-10 md:pb-12 px-1 sm:px-2 pt-8 scroll-px-4 sm:scroll-px-6"
            >
              {stories.map((s, i) => (
                <motion.div
                  key={s.num}
                  ref={(el) => { storyCardsRef.current[i] = el; }}
                  className="snap-center min-w-[94vw] sm:min-w-[84vw] md:min-w-[70vw] lg:min-w-[60vw] xl:min-w-[54vw] 2xl:min-w-[48vw] bg-black text-white rounded-[40px] md:rounded-[48px] overflow-hidden shadow-[0_38px_110px_-30px_rgba(0,0,0,0.5)] border border-white/6"
                  initial={{ opacity: 0, y: 20, scale: 0.94 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, scale: 1.006, transition: { duration: 0.28 } }}
                  animate={{
                    scale: activeStory === i ? 1 : 0.965,
                    opacity: activeStory === i ? 1 : 0.87,
                    boxShadow: activeStory === i
                      ? '0 46px 140px -28px rgba(0,0,0,0.58)'
                      : '0 28px 90px -32px rgba(0,0,0,0.34)'
                  }}
                  transition={{ delay: i * 0.03, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Bloc texte */}
                    <div className="p-7 sm:p-9 md:p-12 lg:p-14 flex flex-col gap-6 sm:gap-7 md:gap-8 bg-gradient-to-br from-black via-[#0b0b12] to-[#0f0f1a]">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.35em] text-white/55">Problème {s.num}</div>
                        <div className="h-[3px] w-14 sm:w-16 rounded-full bg-white/20" />
                      </div>
                      <h3 className="gsap-title font-light leading-[1.05] tracking-[-0.02em] text-[clamp(1.9rem,4.8vw,3.2rem)] text-white">
                        {s.pain}
                      </h3>
                      <div>
                        <div className="text-[11px] sm:text-[12px] font-mono uppercase tracking-[0.3em] text-white/55 mb-3 sm:mb-4">Solution</div>
                        <h4 className="gsap-title font-bold leading-[1.08] text-[clamp(1.65rem,3.5vw,2.4rem)] mb-4 sm:mb-5">
                          {s.sol}
                        </h4>
                        <p className="gsap-detail text-[0.98rem] sm:text-[1.05rem] md:text-[1.1rem] text-white/82 leading-relaxed">
                          {s.detail}
                        </p>
                      </div>
                    </div>

                    {/* Illustration */}
                    <div className="relative min-h-[360px] sm:min-h-[440px] md:min-h-[560px] bg-white text-black">
                      <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0.9, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <s.Illustration />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof - Résultats mesurables RESPONSIVE */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-8 py-12 md:py-0 bg-white">
          <motion.div
            className="max-w-6xl text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="text-sm font-mono text-gray-400 mb-12 tracking-[0.3em] uppercase"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
            >
              Résultats réels
            </motion.div>

            <motion.h2
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-6 md:mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1, type: "spring", stiffness: 80 }}
            >
              +220%
            </motion.h2>

            <motion.p
              className="text-xl sm:text-2xl md:text-3xl text-gray-600 font-light mb-16 md:mb-24 px-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              de revenus en moyenne après 6 mois
            </motion.p>

            {/* Stats Grid - Benefits clairs RESPONSIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12">
              {[
                { n: '10 000+', t: 'Professionnels', desc: 'nous font confiance' },
                { n: '89%', t: 'Satisfaction', desc: 'recommandent Bööh' },
                { n: '2 min', t: 'Setup', desc: 'pour commencer' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="p-6 md:p-8 border border-black/10 rounded-xl md:rounded-2xl hover:border-black/30 transition-colors duration-500"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + idx * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2 md:mb-3">{stat.n}</div>
                  <div className="text-base md:text-lg font-light text-gray-800 mb-1 md:mb-2">{stat.t}</div>
                  <div className="text-xs md:text-sm text-gray-500">{stat.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonial - Social Proof */}
        <section className="min-h-screen flex items-center justify-center px-8 bg-black text-white">
          <motion.div
            className="max-w-5xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              <p className="text-3xl md:text-5xl font-light leading-relaxed mb-16">
                "Avant, je perdais au moins 5 clients par mois parce que je n'avais pas le temps de les suivre.
                Maintenant, tout est automatique. Je me concentre sur mon travail."
              </p>
            </motion.div>

            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20"
                whileHover={{ scale: 1.1 }}
              />
              <div>
                <div className="text-xl font-light mb-1">Amara Koné</div>
                <div className="text-gray-400">Designer Freelance • Abidjan</div>
                <div className="text-sm text-gray-500 mt-2">+172% de revenus en 8 mois</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Système - Grid épuré */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 bg-white">
          <div className="text-[10px] font-mono text-gray-400 mb-16 tracking-[0.3em] uppercase">Huit Modules</div>

          <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 border-t border-l border-black/10">
            {['CRM', 'Agenda', 'Stock', 'Map', 'Portfolio', 'Shop', 'DRM', 'Pay'].map((m, i) => (
              <motion.div
                key={i}
                className="aspect-square flex items-center justify-center border-r border-b border-black/10 hover:bg-black hover:text-white transition-all duration-700 cursor-pointer group relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.3, type: "spring", stiffness: 400 }
                }}
              >
                {/* Ligne de scan au hover */}
                <motion.div
                  className="absolute inset-x-0 h-px bg-white opacity-0 group-hover:opacity-30"
                  initial={{ top: '0%' }}
                  whileHover={{
                    top: ['0%', '100%'],
                    transition: { duration: 1.5, ease: 'linear', repeat: Infinity }
                  }}
                />

                <motion.span
                  className="text-lg font-light relative z-10"
                  initial={{ y: 0 }}
                  whileHover={{
                    y: [0, -5, 0],
                    transition: { duration: 0.5, ease: 'easeInOut' }
                  }}
                >
                  {m}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing - Simple et transparent RESPONSIVE */}
        <section ref={pricingRef} id="pricing" className="min-h-screen flex items-center justify-center px-4 md:px-8 py-12 md:py-0 bg-black text-white">
          <div className="max-w-6xl w-full">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-4 md:mb-6">Tarifs simples</h2>
              <p className="text-lg md:text-xl text-gray-400 px-4">Commencez gratuitement. Évoluez quand vous voulez.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  name: 'Free',
                  price: '0',
                  period: 'Gratuit',
                  desc: 'Pour commencer',
                  features: ['CRM basique', '100 contacts', 'Portfolio simple'],
                  cta: 'Commencer'
                },
                {
                  name: 'Pro',
                  price: '12 500',
                  period: 'FCFA/mois',
                  desc: 'Pour scaler',
                  features: ['Tout Free +', 'Contacts illimités', 'Paiements', 'DRM', 'Agenda'],
                  highlight: true,
                  cta: 'Essayer 14 jours'
                },
                {
                  name: 'Business',
                  price: '25 000',
                  period: 'FCFA/mois',
                  desc: 'Pour équipes',
                  features: ['Tout Pro +', 'Multi-utilisateurs', 'Support prioritaire', 'API'],
                  cta: 'Contacter'
                }
              ].map((plan, idx) => (
                <motion.div
                  key={idx}
                  className={`group relative p-6 md:p-8 border rounded-xl md:rounded-2xl transition-all duration-500 ${plan.highlight
                      ? 'border-white bg-white/10 scale-105'
                      : 'border-white/20 hover:border-white/40'
                    }`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: idx * 0.15,
                    duration: 1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 px-3 md:px-4 py-0.5 md:py-1 bg-white text-black text-[10px] md:text-xs font-mono rounded-full">
                      POPULAIRE
                    </div>
                  )}

                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xl md:text-2xl font-light mb-1 md:mb-2">{plan.name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6">{plan.desc}</p>

                    <div className="flex items-baseline gap-2 mb-1 md:mb-2">
                      <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                      {plan.period !== 'Gratuit' && (
                        <span className="text-sm text-gray-500">{plan.period}</span>
                      )}
                    </div>
                    {plan.period === 'Gratuit' && (
                      <span className="text-sm text-gray-500">Pour toujours</span>
                    )}
                  </div>

                  <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-2 text-xs md:text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 + 0.3 + i * 0.1 }}
                      >
                        <span className="text-green-400">✓</span>
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    className={`w-full py-2.5 md:py-3 rounded-lg text-sm md:text-base font-light transition-colors ${plan.highlight
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-gray-500 mt-8 md:mt-12 text-xs md:text-sm px-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              ✓ Sans engagement • ✓ Annulation en 1 clic • ✓ Support 24/7
            </motion.p>
          </div>
        </section>

        {/* CTA Final - Single Clear CTA */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 bg-white">
          <motion.div
            className="max-w-4xl text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          >
            <motion.h2
              className="text-6xl md:text-8xl font-light mb-8 leading-tight"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Prêt à transformer<br />chaque contact<br />en opportunité ?
            </motion.h2>

            <motion.p
              className="text-2xl text-gray-600 font-light mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              Rejoignez 10 000+ professionnels qui utilisent Bööh.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                onClick={() => navigate('/auth')}
                className="group relative px-12 py-6 bg-black text-white rounded-full text-xl font-light overflow-hidden"
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative z-10">Créer mon compte gratuit</span>
              </motion.button>
            </motion.div>

            <motion.p
              className="text-gray-400 mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
            >
              Gratuit pour toujours • Aucune carte requise • Setup en 2 minutes
            </motion.p>
          </motion.div>
        </section>

        {/* Footer - Minimal absolu */}
        <section className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
          <motion.h2
            className="text-8xl md:text-[12rem] font-light mb-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Ready?
          </motion.h2>

          <motion.button
            onClick={() => navigate('/auth')}
            className="group relative px-12 py-5 border-2 border-white text-white rounded-full text-lg font-light overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            whileHover={{
              scale: 1.12,
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.6, type: "spring", stiffness: 300 }
            }}
            whileTap={{ scale: 0.92 }}
          >
            {/* Background fill au hover */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{
                scale: 1.5,
                opacity: 1,
                transition: { duration: 0.5, ease: 'easeOut' }
              }}
            />
            <span className="relative z-10 group-hover:text-black transition-colors duration-500">
              Créer ma Booh
            </span>
          </motion.button>

          <div className="absolute bottom-8 w-full px-8 flex justify-between text-[9px] font-mono text-gray-700 uppercase tracking-[0.25em]">
            <div>© 2025 Miscoch IT</div>
            <div className="hidden md:block">Designed for Ambition</div>
            <div>Libreville</div>
          </div>
        </section>

      </div>

      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.35); border-radius: 9999px; }
        .horizontal-scroll { scrollbar-width: thin; }
        .horizontal-scroll::-webkit-scrollbar { height: 8px; }
        .horizontal-scroll::-webkit-scrollbar-track { background: transparent; }
        .horizontal-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.35); border-radius: 9999px; }
      `}</style>
    </div>
  );
};

export default PureAwwardsLanding;

