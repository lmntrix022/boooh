export const COLORS = {
  primary: '#7C3AED', // black
  secondary: '#4F46E5', // indigo
  accent: '#06B6D4', // cyan
  success: '#10B981', // green
  warning: '#F59E0B', // amber
  error: '#EF4444', // red
  background: {
    light: '#F8FAFC',
    dark: '#1E293B',
  },
  gradient: {
    primary: 'from-black via-indigo-500 to-cyan-500',
    secondary: 'from-cyan-500 via-purple-500 to-black-500',
    accent: 'from-emerald-400 via-cyan-400 to-black',
  }
}

export const EFFECTS = {
  glow: {
    primary: 'shadow-[0_0_15px_rgba(124,58,237,0.5)]',
    secondary: 'shadow-[0_0_15px_rgba(79,70,229,0.5)]',
    accent: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
  },
  glass: {
    light: 'backdrop-blur-md bg-white/70',
    dark: 'backdrop-blur-md bg-gray-900/70',
  },
  animation: {
    float: 'animate-float',
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
  }
}

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const GOOGLE_MAPS_STYLES = {
  default: 'roadmap',
  satellite: 'satellite',
  hybrid: 'hybrid',
  terrain: 'terrain'
} as const;

export type MapStyle = keyof typeof GOOGLE_MAPS_STYLES; 