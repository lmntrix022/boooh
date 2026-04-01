import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export type OboVariant =
  | 'default'
  | 'point-cta'
  | 'point-right'
  | 'celebrate'
  | 'react'
  | 'slide';

type OboMascotProps = {
  variant?: OboVariant;
  className?: string;
  /** Remplace le placeholder SVG (ex. PNG/WebP fourni plus tard) */
  imageSrc?: string;
  /** Affiche la légende sous le placeholder (désactiver en déco mini) */
  showLabel?: boolean;
};

const envOboSrc = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_LANDING_OBO_IMAGE : undefined;

export const OboMascot: React.FC<OboMascotProps> = ({
  variant = 'default',
  className,
  imageSrc,
  showLabel = true,
}) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const src = imageSrc ?? (typeof envOboSrc === 'string' ? envOboSrc : undefined);

  if (src) {
    return (
      <motion.div
        className={cn('relative inline-block', className)}
        animate={
          reduce
            ? undefined
            : variant === 'point-cta'
              ? { rotate: [0, -4, 0], y: [0, -4, 0] }
              : variant === 'celebrate'
                ? { y: [0, -8, 0], rotate: [0, 3, -3, 0] }
                : undefined
        }
        transition={{ duration: 2.2, repeat: variant === 'point-cta' || variant === 'celebrate' ? Infinity : 0, ease: 'easeInOut' }}
      >
        <img
          src={src}
          alt="Obo"
          className="h-full w-full max-h-[min(28rem,70vh)] object-contain drop-shadow-xl"
          draggable={false}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn('relative inline-flex flex-col items-center', className)}
      animate={
        reduce
          ? undefined
          : variant === 'slide'
            ? { x: [0, 24, 0] }
            : variant === 'point-cta'
              ? { x: [0, 6, 0], rotate: [0, -6, 0] }
              : variant === 'celebrate'
                ? { y: [0, -10, 0] }
                : undefined
      }
      transition={{ duration: 2.5, repeat: variant === 'slide' || variant === 'point-cta' ? Infinity : 0, ease: 'easeInOut' }}
    >
      <span className="sr-only">{t('landingObo.mascot.placeholder')}</span>
      <svg
        viewBox="0 0 200 240"
        className="h-48 w-40 sm:h-56 sm:w-48 md:h-64 md:w-56 drop-shadow-2xl"
        aria-hidden
      >
        <defs>
          <linearGradient id="obo-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="obo-glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="220" rx="70" ry="12" fill="url(#obo-glow)" />
        <motion.g
          animate={reduce ? undefined : { rotate: variant === 'point-cta' ? [0, -5, 0] : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 140px' }}
        >
          <rect x="40" y="40" width="120" height="160" rx="48" fill="url(#obo-body)" />
          <motion.ellipse
            cx="78"
            cy="95"
            rx="10"
            ry="14"
            fill="white"
            animate={reduce ? undefined : { scaleY: [1, 0.15, 1, 1, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.08, 0.12, 0.5, 1] }}
          />
          <motion.ellipse
            cx="122"
            cy="95"
            rx="10"
            ry="14"
            fill="white"
            animate={reduce ? undefined : { scaleY: [1, 0.15, 1, 1, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.08, 0.12, 0.5, 1], delay: 0.05 }}
          />
          <ellipse cx="78" cy="100" rx="5" ry="7" fill="#1e1b4b" />
          <ellipse cx="122" cy="100" rx="5" ry="7" fill="#1e1b4b" />
          <path
            d="M 85 128 Q 100 142 115 128"
            stroke="#c4b5fd"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>
        {variant === 'point-cta' && (
          <motion.g
            animate={reduce ? undefined : { x: [0, 5, 0], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M 155 120 L 188 108 L 175 140 Z" fill="#fb923c" />
          </motion.g>
        )}
        {variant === 'celebrate' && (
          <>
            <motion.circle cx="30" cy="60" r="6" fill="#fbbf24" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.circle cx="170" cy="55" r="5" fill="#f97316" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
          </>
        )}
      </svg>
      {showLabel && (
        <p className="mt-2 max-w-[10rem] text-center text-[10px] font-medium uppercase tracking-wider text-violet-700/80 sm:text-xs">
          {t('landingObo.mascot.placeholder')}
        </p>
      )}
    </motion.div>
  );
};
