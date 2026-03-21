import React from 'react';

/**
 * TOUS LES ICÔNES SVG - VERSION PREMIUM
 * Design système cohérent, pas d'emojis
 */

// Icons de features
export const LightningIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M18 2L6 18h10l-2 12 12-16H16l2-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2" />
    <path d="M18 2L6 18h10l-2 12 12-16H16l2-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const BrainIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 4c-3.5 0-6.5 2.5-7 6-.5-.2-1-.3-1.5-.3-2.2 0-4 1.8-4 4s1.8 4 4 4c.5 0 1-.1 1.5-.3.5 3.5 3.5 6 7 6s6.5-2.5 7-6c.5.2 1 .3 1.5.3 2.2 0 4-1.8 4-4s-1.8-4-4-4c-.5 0-1 .1-1.5.3-.5-3.5-3.5-6-7-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    <circle cx="20" cy="14" r="1.5" fill="currentColor" />
    <path d="M13 18c.5.8 1.5 1.5 3 1.5s2.5-.7 3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const TargetIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
  </svg>
);

export const CameraIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="17" r="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="17" r="3" fill="currentColor" opacity="0.3" />
    <circle cx="24" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const SparklesIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" fill="currentColor" opacity="0.8" />
    <path d="M8 6l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" fill="currentColor" opacity="0.5" />
    <path d="M24 20l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" fill="currentColor" opacity="0.5" />
  </svg>
);

export const ClockIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
    <path d="M16 8v8l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BellIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 6a6 6 0 0 0-6 6v6l-2 2h16l-2-2v-6a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 24a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="24" r="1" fill="currentColor" />
  </svg>
);

export const WalletIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M4 14h24" stroke="currentColor" strokeWidth="2" />
    <circle cx="22" cy="20" r="2" fill="currentColor" />
  </svg>
);

export const ChartIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M6 24v-8M12 24v-12M18 24v-16M24 24V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="6" cy="16" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="18" cy="8" r="2" fill="currentColor" />
    <circle cx="24" cy="8" r="2" fill="currentColor" />
  </svg>
);

export const CrystalBallIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="14" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M9 20c0 2 3 4 7 4s7-2 7-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="16" cy="20" rx="7" ry="2" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12c1-1 2-2 4-2s3 1 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const TagIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 14l10-10h14v14L18 28 4 14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="22" cy="10" r="2" fill="currentColor" />
    <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PhoneIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="8" y="4" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M14 25h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
  </svg>
);

export const CreditCardIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="3" y="8" width="26" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 14h26" stroke="currentColor" strokeWidth="2" />
    <circle cx="8" cy="20" r="1.5" fill="currentColor" />
    <circle cx="13" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

export const GalleryIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="8" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <rect x="17" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <rect x="8" y="19" width="7" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
);

export const MessageIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 8c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-6l-4 4-4-4H6c-1.1 0-2-.9-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 14h12M10 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const MoneyIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
    <path d="M16 10v12M13 12c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const LockIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="8" y="14" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M12 14V10c0-2.2 1.8-4 4-4s4 1.8 4 4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="21" r="2" fill="currentColor" />
    <path d="M16 23v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WatermarkIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M10 12h12M10 16h12M10 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <circle cx="22" cy="20" r="4" fill="currentColor" opacity="0.2" />
    <path d="M20 20l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DevicesIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="8" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="16" y="4" width="14" height="20" rx="1.5" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CheckShieldIcon = ({ className = "" }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 4l10 4v8c0 6-4 10-10 12-6-2-10-6-10-12V8l10-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M11 16l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowRightIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M15 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const PlusIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

