/**
 * Stratégie de préchargement intelligent pour optimiser le chargement
 * Charge les ressources de manière progressive selon la connexion et le comportement utilisateur
 */

interface ConnectionInfo {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  saveData?: boolean;
}

/**
 * Détecte la qualité de la connexion
 */
export function getConnectionQuality(): 'poor' | 'good' | 'excellent' {
  if (!navigator.connection) return 'good'; // Par défaut si pas de Connection API

  const conn = (navigator as any).connection as ConnectionInfo;
  
  // Si l'utilisateur a activé "économie de données"
  if (conn.saveData) return 'poor';
  
  // Basé sur le type de connexion
  if (conn.effectiveType === '4g' && conn.downlink && conn.downlink > 5) {
    return 'excellent';
  }
  
  if (conn.effectiveType === '4g' || (conn.downlink && conn.downlink > 2)) {
    return 'good';
  }
  
  return 'poor';
}

/**
 * Précharge une route de manière intelligente
 */
export function prefetchRoute(path: string): void {
  const quality = getConnectionQuality();
  
  // Ne précharge pas si mauvaise connexion
  if (quality === 'poor') return;
  
  // Utilise <link rel="prefetch"> pour précharger la route
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Précharge les routes critiques après le chargement initial
 */
export function prefetchCriticalRoutes(): void {
  if (typeof window === 'undefined') return;
  
  const quality = getConnectionQuality();
  
  // Attend que la page soit complètement chargée
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Routes à précharger selon la qualité de connexion
      const routes = {
        excellent: ['/auth', '/pricing', '/dashboard', '/map'],
        good: ['/auth', '/pricing'],
        poor: ['/auth'], // Uniquement la page de connexion
      };
      
      routes[quality].forEach(route => prefetchRoute(route));
    }, 3000); // Attend 3 secondes après le chargement
  });
}

/**
 * Détecte si on est sur mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Précharge les images critiques de manière progressive
 */
export function prefetchImages(urls: string[], priority: 'high' | 'low' = 'low'): void {
  const quality = getConnectionQuality();
  
  // Ne précharge pas les images si mauvaise connexion
  if (quality === 'poor' && priority === 'low') return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Initialise toutes les stratégies de préchargement
 */
export function initPrefetchStrategy(): void {
  if (typeof window === 'undefined') return;
  
  // Précharge les routes critiques
  prefetchCriticalRoutes();
  
  // Log pour debug (enlever en production)
  const quality = getConnectionQuality();
  console.log(`📡 Connexion détectée: ${quality}`);
}

