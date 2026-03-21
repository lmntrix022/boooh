// Service de préchargement intelligent pour optimiser les performances

interface PreloadConfig {
  priority: 'high' | 'medium' | 'low';
  type: 'image' | 'script' | 'style' | 'data';
  url: string;
  condition?: () => boolean;
  as?: string;
}

class PreloadService {
  private preloadedResources = new Set<string>();
  private preloadQueue: PreloadConfig[] = [];
  private isProcessing = false;

  // Précharger une ressource
  preload(config: PreloadConfig): void {
    if (this.preloadedResources.has(config.url)) return;
    
    this.preloadQueue.push(config);
    this.processQueue();
  }

  // Traiter la file d'attente de préchargement
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return;
    
    this.isProcessing = true;
    
    // Trier par priorité
    const sortedQueue = this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const config of sortedQueue) {
      if (config.condition && !config.condition()) continue;
      
      try {
        await this.preloadResource(config);
        this.preloadedResources.add(config.url);
      } catch (error) {
        // Warning log removed
      }
    }

    this.preloadQueue = [];
    this.isProcessing = false;
  }

  // Précharger une ressource spécifique
  private async preloadResource(config: PreloadConfig): Promise<void> {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = config.url;

    // Déterminer le type 'as' approprié
    let asType = config.as;
    if (!asType) {
      switch (config.type) {
        case 'image':
          asType = 'image';
          break;
        case 'script':
          asType = 'script';
          break;
        case 'style':
          asType = 'style';
          break;
        case 'data':
          asType = 'fetch';
          break;
        default:
          asType = 'fetch';
      }
    }

    link.as = asType;

    // Ajouter des attributs supplémentaires selon le type
    if (config.type === 'image') {
      link.setAttribute('type', 'image/webp');
    } else if (config.type === 'script') {
      link.setAttribute('type', 'text/javascript');
    } else if (config.type === 'style') {
      link.setAttribute('type', 'text/css');
    }

    document.head.appendChild(link);

    // Attendre que la ressource soit chargée
    return new Promise((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Échec du préchargement: ${config.url}`));
      
      // Timeout de sécurité
      setTimeout(() => resolve(), 5000);
    });
  }

  // Précharger les images critiques seulement
  preloadCriticalImages(): void {
    const criticalImages = [
      '/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp'
    ];

    criticalImages.forEach(url => {
      this.preload({
        priority: 'high',
        type: 'image',
        url,
        as: 'image',
        condition: () => {
          // Ne précharger que si l'image n'est pas déjà chargée
          return !document.querySelector(`img[src="${url}"]`);
        }
      });
    });
  }

  // Précharger les pages probables de manière plus intelligente
  preloadLikelyPages(): void {
    const { pathname } = window.location;
    
    // Basé sur la page actuelle, précharger les pages probables
    const likelyPages = {
      '/': ['/auth'],
      '/auth': ['/dashboard'],
      '/dashboard': ['/cards'],
      '/cards': ['/create-card'],
      '/profile': ['/settings']
    };

    const pagesToPreload = likelyPages[pathname] || [];
    
    pagesToPreload.forEach(page => {
      this.preload({
        priority: 'medium',
        type: 'data',
        url: page,
        as: 'fetch',
        condition: () => {
          // Ne précharger que si l'utilisateur n'est pas déjà sur cette page
          return window.location.pathname !== page && navigator.onLine;
        }
      });
    });
  }

  // Précharger les données utilisateur seulement si nécessaire
  preloadUserData(userId: string): void {
    // Ne précharger que si l'utilisateur est connecté et que les données ne sont pas déjà en cache
    if (!userId) return;

    const userDataEndpoints = [
      `/api/users/${userId}/profile`,
      `/api/users/${userId}/cards`
    ];

    userDataEndpoints.forEach(endpoint => {
      this.preload({
        priority: 'medium',
        type: 'data',
        url: endpoint,
        as: 'fetch',
        condition: () => {
          // Ne précharger que si les données ne sont pas déjà en cache
          return !sessionStorage.getItem(`cache_${endpoint}`) && navigator.onLine;
        }
      });
    });
  }

  // Précharger les composants React de manière plus sélective
  preloadReactComponents(): void {
    const { pathname } = window.location;
    
    // Précharger seulement les composants pertinents selon la page actuelle
    const componentMap = {
      '/dashboard': ['Dashboard'],
      '/cards': ['Cards', 'CreateCard'],
      '/profile': ['Profile', 'Settings'],
      '/auth': ['Auth']
    };

    const componentsToPreload = componentMap[pathname] || [];
    
    componentsToPreload.forEach(component => {
      this.preload({
        priority: 'low',
        type: 'script',
        url: `/src/pages/${component}.tsx`,
        as: 'script',
        condition: () => {
          // Ne précharger que si le composant n'est pas déjà chargé
          return !(window as any).__REACT_LAZY_COMPONENTS__?.includes(component) && navigator.onLine;
        }
      });
    });
  }

  // Optimiser pour les connexions lentes
  optimizeForSlowConnection(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Réduire drastiquement le préchargement sur les connexions lentes
      // Log removed
      return;
    }
  }

  // Nettoyer les ressources préchargées
  cleanup(): void {
    this.preloadedResources.clear();
    this.preloadQueue = [];
    
    // Supprimer les liens de préchargement non utilisés
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    preloadLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !this.isResourceUsed(href)) {
        link.remove();
      }
    });
  }

  // Vérifier si une ressource est utilisée
  private isResourceUsed(url: string): boolean {
    // Vérifier si l'URL est utilisée dans le DOM
    const imgElements = document.querySelectorAll(`img[src="${url}"]`);
    const linkElements = document.querySelectorAll(`link[href="${url}"]`);
    const scriptElements = document.querySelectorAll(`script[src="${url}"]`);
    
    return imgElements.length > 0 || linkElements.length > 0 || scriptElements.length > 0;
  }
}

// Instance singleton
export const preloadService = new PreloadService();

// Hook pour utiliser le service de préchargement
export const usePreloadService = () => {
  return {
    preloadCriticalImages: () => preloadService.preloadCriticalImages(),
    preloadLikelyPages: () => preloadService.preloadLikelyPages(),
    preloadUserData: (userId: string) => preloadService.preloadUserData(userId),
    preloadReactComponents: () => preloadService.preloadReactComponents(),
    optimizeForSlowConnection: () => preloadService.optimizeForSlowConnection(),
    cleanup: () => preloadService.cleanup()
  };
}; 