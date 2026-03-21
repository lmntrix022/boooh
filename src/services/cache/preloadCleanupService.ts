/**
 * Service unifié de nettoyage des préchargements
 *
 * Remplace:
 * - utils/cleanupPreloads.ts
 * - utils/preloadCleanup.ts
 *
 * Gère le nettoyage des liens <link rel="preload"> et <link rel="prefetch"> du DOM
 */

const USED_RESOURCES_KEY = 'booh_used_resources';
const CLEANUP_INTERVAL = 10000; // 10 secondes

class PreloadCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private originalAppendChild: ((node: Node) => Node) | null = null;

  /**
   * Retirer tous les liens de préchargement du DOM
   */
  cleanupAllPreloads(): void {
    const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"], link[rel="modulepreload"]');
    preloadLinks.forEach(link => link.remove());
  }

  /**
   * Retirer des URLs spécifiques
   */
  cleanupSpecificPreloads(urls: string[]): void {
    urls.forEach(url => {
      const link = document.querySelector(`link[href="${url}"]`);
      if (link) {
        link.remove();
      }
    });
  }

  /**
   * Retirer les préchargements non utilisés
   */
  cleanupUnusedPreloads(): void {
    setTimeout(() => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');

      preloadLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !this.isResourceUsed(href)) {
          link.remove();
        }
      });
    }, 5000); // Délai de 5 secondes pour laisser le temps aux ressources d'être utilisées
  }

  /**
   * Bloquer l'ajout de nouveaux liens de préchargement
   */
  preventNewPreloads(): void {
    if (!document.head || this.originalAppendChild) return;

    this.originalAppendChild = document.head.appendChild;

    document.head.appendChild = ((node: Node) => {
      // Bloquer les liens de préchargement
      if (node.nodeName === 'LINK') {
        const link = node as HTMLLinkElement;
        if (link.rel === 'preload' || link.rel === 'prefetch' || link.rel === 'modulepreload') {
          return node; // Ignorer sans ajouter au DOM
        }
      }
      // Appeler la fonction originale pour les autres éléments
      return this.originalAppendChild!.call(document.head, node);
    }) as any;
  }

  /**
   * Restaurer le comportement normal d'appendChild
   */
  restorePreloads(): void {
    if (this.originalAppendChild && document.head) {
      document.head.appendChild = this.originalAppendChild;
      this.originalAppendChild = null;
    }
  }

  /**
   * Marquer une ressource comme utilisée
   */
  markResourceAsUsed(url: string): void {
    try {
      const used = this.getUsedResources();
      used.add(url);
      sessionStorage.setItem(USED_RESOURCES_KEY, JSON.stringify([...used]));
    } catch (error) {
      // SessionStorage peut être indisponible (mode privé)
    }
  }

  /**
   * Vérifier si une ressource est utilisée
   */
  isResourceUsed(url: string): boolean {
    // Vérifier si la ressource est dans le DOM
    const inDOM = document.querySelector(`[src="${url}"], [href="${url}"]`) !== null;
    if (inDOM) return true;

    // Vérifier si la ressource est dans le cache du navigateur
    if (performance && performance.getEntriesByName) {
      const entries = performance.getEntriesByName(url);
      if (entries.length > 0) return true;
    }

    // Vérifier dans sessionStorage
    const used = this.getUsedResources();
    return used.has(url);
  }

  /**
   * Récupérer les ressources utilisées depuis sessionStorage
   */
  private getUsedResources(): Set<string> {
    try {
      const stored = sessionStorage.getItem(USED_RESOURCES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      return new Set();
    }
  }

  /**
   * Obtenir des statistiques sur les préchargements
   */
  getPreloadStats(): { total: number; used: number; unused: number } {
    const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
    const total = preloadLinks.length;
    let used = 0;

    preloadLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && this.isResourceUsed(href)) {
        used++;
      }
    });

    return {
      total,
      used,
      unused: total - used,
    };
  }

  /**
   * Démarrer le nettoyage automatique
   */
  startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedPreloads();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Initialisation complète: nettoyage + blocage
   */
  initialize(): void {
    this.cleanupAllPreloads();
    this.preventNewPreloads();

    // Démarrer le nettoyage automatique après le chargement de la page
    if (document.readyState === 'loading') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.startAutoCleanup();
        }, 5000);
      });
    } else {
      setTimeout(() => {
        this.startAutoCleanup();
      }, 5000);
    }
  }

  /**
   * Nettoyage complet et arrêt
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.restorePreloads();
    this.cleanupAllPreloads();
  }
}

// Instance singleton
export const preloadCleanupService = new PreloadCleanupService();

// Export pour rétrocompatibilité
export class ImmediatePreloadCleanup {
  static cleanupAllPreloads = () => preloadCleanupService.cleanupAllPreloads();
  static cleanupSpecificPreloads = (urls: string[]) => preloadCleanupService.cleanupSpecificPreloads(urls);
  static cleanupUnusedPreloads = () => preloadCleanupService.cleanupUnusedPreloads();
  static preventNewPreloads = () => preloadCleanupService.preventNewPreloads();
  static restorePreloads = () => preloadCleanupService.restorePreloads();
}

export class PreloadCleanup {
  static startAutoCleanup = () => preloadCleanupService.startAutoCleanup();
  static stopAutoCleanup = () => preloadCleanupService.stopAutoCleanup();
  static cleanupUnusedPreloads = () => preloadCleanupService.cleanupUnusedPreloads();
  static getPreloadStats = () => preloadCleanupService.getPreloadStats();
  static cleanupAllPreloads = () => preloadCleanupService.cleanupAllPreloads();
  static markResourceAsUsed = (url: string) => preloadCleanupService.markResourceAsUsed(url);
  static isResourceUsed = (url: string) => preloadCleanupService.isResourceUsed(url);
}

export default preloadCleanupService;
