/**
 * Script pour forcer le nettoyage des URLs blob orphelines
 * À exécuter dans la console du navigateur si nécessaire
 */

export const forceBlobCleanup = () => {
  // Log removed
  
  // Forcer le garbage collection si disponible
  if (window.gc) {
    window.gc();
    // Log removed
  } else {
    // Log removed
  }
  
  // Nettoyer le cache du navigateur si possible
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('blob') || cacheName.includes('image')) {
          caches.delete(cacheName);
          // Log removed
        }
      });
    });
  }
  
  // Afficher les informations de mémoire si disponibles
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    // Log removed
    // Log removed
    // Log removed
    // Log removed
  }
  
  // Log removed
};

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).forceBlobCleanup = forceBlobCleanup;
  // Log removed
}
