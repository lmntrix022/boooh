import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { OboMascot } from './OboMascot';

const shell =
  'landing-booh-obo min-h-screen bg-[#faf7f2] pb-24 text-slate-900 antialiased md:pb-28';
const violet = 'text-violet-950';
const orangeBtn =
  'rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';

type ProblemItem = { emoji: string; text: string };

function HeroPhoneVisual() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-violet-900/20">
        <div className="flex aspect-[9/17] flex-col gap-4 bg-gradient-to-b from-violet-950 via-violet-900 to-slate-950 p-5">
          <div className="flex items-center justify-between text-[10px] font-medium text-white/50">
            <span>9:41</span>
            <div className="flex gap-1">
              <span className="h-2 w-8 rounded-full bg-white/20" />
            </div>
          </div>
          <p className="text-center text-xs font-medium tracking-wide text-violet-200/90">BÖÖH</p>
          <div className="mt-2 space-y-3">
            <p className="text-[11px] text-white/60">Ton lien</p>
            <div className="h-11 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
                style={{ width: reduce ? '100%' : undefined }}
                animate={
                  reduce
                    ? undefined
                    : {
                        width: ['0%', '92%', '92%', '0%'],
                      }
                }
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.35, 0.72, 1],
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="h-16 flex-1 rounded-2xl bg-white/5 ring-1 ring-white/10" />
              <div className="h-16 flex-1 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-orange-400/20 via-transparent to-violet-500/25 blur-2xl" />
    </div>
  );
}

function BenefitIcon({ name }: { name: string }) {
  const c = 'h-6 w-6 text-orange-500';
  switch (name) {
    case 'money':
      return <Wallet className={c} />;
    case 'users':
      return <Users className={c} />;
    case 'clock':
      return <Clock className={c} />;
    case 'trophy':
      return <Trophy className={c} />;
    default:
      return <Sparkles className={c} />;
  }
}

export const BoohOboLandingView: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [hoverPrimary, setHoverPrimary] = useState(false);
  const [hoverSecondary, setHoverSecondary] = useState(false);
  const [hoverFinal, setHoverFinal] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [howStep, setHowStep] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  const problemItems = t('landingObo.problem.items', { returnObjects: true }) as ProblemItem[];
  const howSteps = t('landingObo.howItWorks.steps', { returnObjects: true }) as {
    n: string;
    title: string;
    desc: string;
  }[];
  const benefitItems = t('landingObo.benefits.items', { returnObjects: true }) as {
    icon: string;
    title: string;
    desc: string;
  }[];
  const testimonials = t('landingObo.testimonials.items', { returnObjects: true }) as {
    name: string;
    role: string;
    quote: string;
  }[];
  const objections = t('landingObo.objections.items', { returnObjects: true }) as { q: string; a: string }[];

  const goApp = useCallback(() => {
    navigate(user ? '/dashboard' : '/auth');
  }, [navigate, user]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 7000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setHowStep((s) => (s + 1) % 3), 3800);
    return () => clearInterval(id);
  }, [reduce]);

  const breakRef = useRef<HTMLElement>(null);
  const { scrollYProgress: breakProgress } = useScroll({
    target: breakRef,
    offset: ['start 0.85', 'end 0.25'],
  });
  const oboSlideX = useTransform(breakProgress, [0, 1], [-28, 28]);

  const transformRef = useRef<HTMLElement>(null);
  const { scrollYProgress: tfProgress } = useScroll({
    target: transformRef,
    offset: ['start 0.8', 'end 0.3'],
  });
  const splitOboX = useTransform(tfProgress, [0, 1], ['-12%', '12%']);

  const giftSteps = t('landingObo.finalOffer.giftSteps', { returnObjects: true }) as string[];

  const problemCards = useMemo(
    () =>
      Array.isArray(problemItems)
        ? problemItems
        : [
            { emoji: '📱', text: '' },
            { emoji: '💸', text: '' },
            { emoji: '💬', text: '' },
          ],
    [problemItems]
  );

  return (
    <div className={shell}>
      <PublicNavbar />

      {/* 1 Hero */}
      <section id="hero" className="relative overflow-hidden pt-8 pb-16 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(109,40,217,0.12),transparent)]" />
        <div className="relative z-[1] mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <motion.h1
              className={cn('font-sans text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl', violet)}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="block text-orange-500">💥 {t('landingObo.hero.titleLine1')}</span>
              <span className="mt-2 block">
                🚀 {t('landingObo.hero.titleLine2')}
              </span>
            </motion.h1>
            <motion.div
              className="mt-6 space-y-2 text-lg text-slate-600 md:text-xl"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55 }}
            >
              <p>{t('landingObo.hero.subtitle1')}</p>
              <p className="font-medium text-slate-800">{t('landingObo.hero.subtitle2')}</p>
              <p>{t('landingObo.hero.subtitle3')}</p>
            </motion.div>
            <motion.div
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <button
                type="button"
                onClick={goApp}
                onMouseEnter={() => setHoverPrimary(true)}
                onMouseLeave={() => setHoverPrimary(false)}
                className={cn(orangeBtn, 'relative min-h-[52px] w-full sm:w-auto')}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  👉{' '}
                  {hoverPrimary
                    ? t('landingObo.hero.ctaPrimaryHover')
                    : t('landingObo.hero.ctaPrimary')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => scrollTo('solution')}
                onMouseEnter={() => setHoverSecondary(true)}
                onMouseLeave={() => setHoverSecondary(false)}
                className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-violet-200 bg-white px-6 py-4 text-base font-semibold text-violet-950 shadow-sm transition-all hover:border-orange-400 hover:bg-orange-50 sm:w-auto"
              >
                👉{' '}
                <span className="transition-transform group-hover:translate-x-0.5">
                  {hoverSecondary
                    ? t('landingObo.hero.ctaSecondaryHover')
                    : t('landingObo.hero.ctaSecondary')}
                </span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </button>
            </motion.div>
          </div>

          <div className="relative flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-end">
            <HeroPhoneVisual />
            <div className="flex flex-col items-center lg:pb-8">
              <OboMascot variant="point-cta" className="scale-90 lg:scale-100" />
            </div>
            <p className="absolute bottom-0 left-1/2 w-full max-w-xs -translate-x-1/2 text-center text-xs text-slate-500 lg:static lg:translate-x-0">
              {t('landingObo.hero.phoneCaption')}
            </p>
          </div>
        </div>
      </section>

      {/* 2 Problem */}
      <section id="problem" className="border-y border-violet-100 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center md:flex-row md:justify-center md:text-left">
            <span className="inline-flex items-center rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-900">
              💡 {t('landingObo.problem.badge')}
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {problemCards.map((item, i) => (
              <motion.div
                key={i}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <p className="text-base leading-relaxed text-slate-700">{item.text}</p>
                </div>
                <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.07] transition-transform group-hover:scale-110">
                  <OboMascot variant="react" className="scale-50" showLabel={false} />
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/80 p-6 text-center md:flex-row md:justify-center md:gap-4 md:text-left"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-800">
                {t('landingObo.problem.resultLabel')}
              </p>
              <p className="text-lg font-medium text-slate-900">{t('landingObo.problem.result')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Break pattern */}
      <section
        ref={breakRef}
        id="break"
        className="relative overflow-hidden py-16 md:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:gap-0 md:px-8">
          <motion.div
            className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-slate-200 bg-slate-100/80 p-8 md:rounded-r-none"
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Avant</p>
            <p className="mt-2 text-xl font-semibold text-slate-800">{t('landingObo.breakPattern.before')}</p>
          </motion.div>
          <motion.div
            className="flex min-h-[220px] flex-col justify-center rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 to-violet-900 p-8 text-white shadow-xl md:rounded-l-none"
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-violet-200">Après</p>
            <p className="mt-2 text-xl font-semibold">{t('landingObo.breakPattern.after')}</p>
          </motion.div>
        </div>
        <motion.div
          className="pointer-events-none relative mx-auto mt-10 flex max-w-3xl justify-center"
          style={{ x: oboSlideX }}
        >
          <OboMascot variant="slide" />
        </motion.div>
        <p className="mx-auto mt-6 max-w-2xl px-4 text-center text-xl font-semibold text-violet-950 md:text-2xl">
          🎯 {t('landingObo.breakPattern.keyMessage')}
        </p>
      </section>

      {/* 4 Solution */}
      <section id="solution" className="bg-[#faf7f2] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className={cn('text-center font-sans text-3xl font-bold md:text-4xl', violet)}>
            {t('landingObo.solution.title')}
          </h2>
          <ul className="mx-auto mt-8 max-w-2xl space-y-3 text-center text-lg text-slate-700">
            {(t('landingObo.solution.bullets', { returnObjects: true }) as string[]).map((line, i) => (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="leading-relaxed"
              >
                {line}
              </motion.li>
            ))}
          </ul>
          <div className="relative mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative flex justify-center md:col-span-3">
              <div className="relative rounded-[2rem] border border-violet-200 bg-white p-8 shadow-xl">
                <OboMascot variant="default" className="scale-75" />
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-2 ring-orange-400/20 ring-offset-4" />
              </div>
            </div>
            {(['landingObo.solution.tip1', 'landingObo.solution.tip2', 'landingObo.solution.tip3'] as const).map(
              (tipKey, i) => (
              <motion.div
                key={tipKey}
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/50 p-6 text-center shadow-sm transition-shadow hover:shadow-lg"
              >
                <p className="text-sm font-bold text-orange-600">{t(tipKey)}</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-orange-100">
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 How it works */}
      <section id="how" className="border-y border-violet-100 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className={cn('text-center font-sans text-3xl font-bold md:text-4xl', violet)}>
            {t('landingObo.howItWorks.title')}
          </h2>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-1/2 hidden h-1 -translate-y-1/2 bg-gradient-to-r from-violet-200 via-orange-300 to-violet-200 md:block" />
            <div className="grid gap-8 md:grid-cols-3">
              {howSteps.map((step, i) => (
                <motion.div
                  key={step.n}
                  className={cn(
                    'relative rounded-2xl border p-6 text-center transition-all',
                    howStep === i
                      ? 'border-orange-400 bg-orange-50 shadow-lg shadow-orange-500/10'
                      : 'border-slate-200 bg-slate-50/80'
                  )}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                    {step.n}
                  </div>
                  {howStep === i && (
                    <motion.div
                      layoutId="step-check"
                      className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </motion.div>
                  )}
                  <h3 className="mt-4 text-lg font-bold text-violet-950">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <OboMascot variant="default" className="scale-[0.65]" />
            </div>
          </div>
        </div>
      </section>

      {/* 6 Benefits */}
      <section id="benefits" className="bg-[#faf7f2] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className={cn('text-center font-sans text-3xl font-bold md:text-4xl', violet)}>
            {t('landingObo.benefits.title')}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {benefitItems.map((b, i) => (
              <motion.div
                key={b.title}
                initial={reduce ? false : { opacity: 0, rotateX: -8 }}
                whileInView={{ opacity: 1, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6, rotateY: 4 }}
                style={{ perspective: 1000 }}
                className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-6 shadow-md transition-shadow hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-violet-50 p-3">
                    <BenefitIcon name={b.icon} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-violet-950">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.desc}</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <OboMascot variant="celebrate" className="scale-[0.35]" showLabel={false} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 Transformation */}
      <section
        ref={transformRef}
        id="transform"
        className="relative overflow-hidden border-y border-violet-100 bg-slate-900 py-16 text-white md:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(109,40,217,0.35),transparent)]" />
        <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              {t('landingObo.transformation.beforeTitle')}
            </p>
            <ul className="mt-4 space-y-3">
              {(t('landingObo.transformation.beforeList', { returnObjects: true }) as string[]).map((x) => (
                <li key={x} className="flex items-center gap-2 text-slate-300">
                  <span className="text-red-400">✕</span> {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">
              {t('landingObo.transformation.afterTitle')}
            </p>
            <ul className="mt-4 space-y-3">
              {(t('landingObo.transformation.afterList', { returnObjects: true }) as string[]).map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <Check className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={3} /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <motion.div className="relative z-[1] mt-12 flex justify-center" style={{ x: splitOboX }}>
          <OboMascot variant="slide" className="scale-75" />
        </motion.div>
      </section>

      {/* 8 Social proof */}
      <section id="proof" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className={cn('text-center font-sans text-3xl font-bold md:text-4xl', violet)}>
            {t('landingObo.testimonials.title')}
          </h2>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-8 shadow-inner md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-6 md:flex-row md:items-center"
              >
                <OboMascot variant="react" className="mx-auto scale-[0.55] md:mx-0" />
                <div>
                  <p className="text-lg leading-relaxed text-slate-800 md:text-xl">
                    “{testimonials[testimonialIdx]?.quote}”
                  </p>
                  <p className="mt-4 font-semibold text-violet-900">
                    {testimonials[testimonialIdx]?.name}
                    <span className="font-normal text-slate-500"> — {testimonials[testimonialIdx]?.role}</span>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Previous"
                className="rounded-full border border-slate-200 p-2 hover:bg-slate-50"
                onClick={() =>
                  setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === testimonialIdx ? 'w-8 bg-orange-500' : 'w-2 bg-slate-300'
                    )}
                    onClick={() => setTestimonialIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next"
                className="rounded-full border border-slate-200 p-2 hover:bg-slate-50"
                onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Objections */}
      <section id="objections" className="bg-[#faf7f2] py-16 md:py-24">
        <div className="mx-auto grid max-w-3xl gap-10 px-4 md:grid-cols-[1fr_auto] md:items-start md:gap-12">
          <div>
            <h2 className={cn('font-sans text-3xl font-bold md:text-4xl', violet)}>
              {t('landingObo.objections.title')}
            </h2>
            <Accordion type="single" collapsible className="mt-6 w-full">
              {objections.map((row, i) => (
                <AccordionItem key={i} value={`o-${i}`} className="border-violet-100">
                  <AccordionTrigger className="text-left text-base font-semibold text-violet-950 hover:no-underline">
                    {row.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600">{row.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="flex justify-center md:sticky md:top-28">
            <OboMascot variant="default" />
          </div>
        </div>
      </section>

      {/* 10 Final offer */}
      <section id="offer" className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-violet-800 to-slate-900 py-20 text-white md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.25),transparent)]" />
        <div className="relative z-[1] mx-auto max-w-3xl px-4 text-center">
          <p className="text-4xl">🎁</p>
          <h2 className="mt-4 font-sans text-3xl font-bold md:text-4xl">
            {t('landingObo.finalOffer.giftTitle')}
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-lg font-medium">
            {giftSteps.map((s, i) => (
              <React.Fragment key={s}>
                <span>{s}</span>
                {i < giftSteps.length - 1 && <span className="text-orange-300">→</span>}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-10 text-xl font-semibold text-orange-100 md:text-2xl">
            🔴 {t('landingObo.finalOffer.urgency')}
          </p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-6"
            whileHover="hover"
          >
            <OboMascot variant="celebrate" className="scale-75" />
            <button
              type="button"
              onClick={goApp}
              onMouseEnter={() => setHoverFinal(true)}
              onMouseLeave={() => setHoverFinal(false)}
              className={cn(
                orangeBtn,
                'min-h-[56px] px-10 text-lg shadow-orange-500/40 animate-[pulse-soft_2.8s_ease-in-out_infinite]'
              )}
            >
              👉 {hoverFinal ? t('landingObo.finalOffer.ctaHover') : t('landingObo.finalOffer.cta')}
            </button>
          </motion.div>
        </div>
      </section>

      <FooterDark />

      {/* Sticky CTA */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[100] border-t border-violet-200/80 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(76,29,149,0.12)] backdrop-blur-md md:py-4"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-2">
              <button type="button" onClick={goApp} className={cn(orangeBtn, 'w-full max-w-lg py-3 text-sm md:text-base')}>
                {t('landingObo.sticky.cta')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-soft {
          0%, 100% { box-shadow: 0 12px 40px -10px rgba(234, 88, 12, 0.45); }
          50% { box-shadow: 0 16px 50px -8px rgba(234, 88, 12, 0.65); }
        }
        .landing-booh-obo {
          font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
};
