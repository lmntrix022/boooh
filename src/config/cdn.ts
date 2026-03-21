export const CDN_CONFIG = {
  // Remplacer avec votre URL de CDN en production
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-cdn-url.com'
    : '',
  
  // Helper pour construire les URLs CDN
  getAssetUrl: (path: string): string => {
    if (process.env.NODE_ENV !== 'production') {
      return path
    }
    return `${CDN_CONFIG.baseUrl}/assets${path}`
  },

  // Configuration des types de fichiers à servir via CDN
  assetTypes: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    fonts: ['.woff', '.woff2', '.ttf', '.eot'],
    media: ['.mp4', '.webm', '.mp3', '.wav'],
  },

  // Configuration du cache
  cacheControl: {
    images: 'public, max-age=31536000, immutable', // 1 year
    fonts: 'public, max-age=31536000, immutable',  // 1 year
    media: 'public, max-age=31536000, immutable',  // 1 year
    default: 'public, max-age=3600'                // 1 hour
  }
} 