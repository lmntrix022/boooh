// Service de préchargement intelligent basé sur les actions utilisateur

interface SmartPreloadConfig {
  trigger: 'hover' | 'click' | 'focus' | 'scroll';
  resource: string;
  type: 'image' | 'script' | 'data';
  priority: 'high' | 'medium' | 'low';
}

class SmartPreloadService {
  private preloadedResources = new Set<string>();
  private hoverTimeouts = new Map<string, NodeJS.Timeout>();

  // Précharger une ressource sur hover
  preloadOnHover(element: HTMLElement, config: SmartPreloadConfig): (() => void) | void {
    if (config.trigger !== 'hover') return;

    const handleMouseEnter = () => {
      // Attendre 200ms avant de précharger pour éviter les préchargements accidentels
      const timeout = setTimeout(() => {
        this.preloadResource(config.resource, config.type, config.priority);
      }, 200);

      this.hoverTimeouts.set(config.resource, timeout);
    };

    const handleMouseLeave = () => {
      const timeout = this.hoverTimeouts.get(config.resource);
      if (timeout) {
        clearTimeout(timeout);
        this.hoverTimeouts.delete(config.resource);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Nettoyer les event listeners
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }

  // Précharger une ressource sur click
  preloadOnClick(element: HTMLElement, config: SmartPreloadConfig): (() => void) | void {
    if (config.trigger !== 'click') return;

    const handleClick = () => {
      this.preloadResource(config.resource, config.type, config.priority);
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  }

  // Précharger une ressource sur focus
  preloadOnFocus(element: HTMLElement, config: SmartPreloadConfig): (() => void) | void {
    if (config.trigger !== 'focus') return;

    const handleFocus = () => {
      this.preloadResource(config.resource, config.type, config.priority);
    };

    element.addEventListener('focus', handleFocus);

    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }

  // Précharger une ressource sur scroll (lazy loading)
  preloadOnScroll(selector: string, config: SmartPreloadConfig): (() => void) | void {
    if (config.trigger !== 'scroll') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.preloadResource(config.resource, config.type, config.priority);
          observer.disconnect();
        }
      });
    }, {
      rootMargin: '200px' // Précharger 200px avant
    });

    const element = document.querySelector(selector);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }

  // Précharger une ressource spécifique
  private preloadResource(url: string, type: string, priority: string): void {
    if (this.preloadedResources.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    // Déterminer le type 'as' approprié
    switch (type) {
      case 'image':
        link.as = 'image';
        link.setAttribute('type', 'image/webp');
        break;
      case 'script':
        link.as = 'script';
        link.setAttribute('type', 'text/javascript');
        break;
      case 'data':
        link.as = 'fetch';
        break;
      default:
        link.as = 'fetch';
    }

    // Ajouter la priorité
    if (priority === 'high') {
      link.setAttribute('importance', 'high');
    }

    document.head.appendChild(link);
    this.preloadedResources.add(url);

    // Nettoyer après utilisation
    setTimeout(() => {
      if (!this.isResourceUsed(url)) {
        link.remove();
        this.preloadedResources.delete(url);
      }
    }, 30000); // 30 secondes
  }

  // Vérifier si une ressource est utilisée
  private isResourceUsed(url: string): boolean {
    const imgElements = document.querySelectorAll(`img[src="${url}"]`);
    const linkElements = document.querySelectorAll(`link[href="${url}"]`);
    const scriptElements = document.querySelectorAll(`script[src="${url}"]`);
    
    return imgElements.length > 0 || linkElements.length > 0 || scriptElements.length > 0;
  }

  // Précharger les images critiques seulement si elles sont visibles
  preloadCriticalImages(): void {
    const criticalImages = [
      '/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp'
    ];

    criticalImages.forEach(url => {
      this.preloadOnScroll(`img[src="${url}"]`, {
        trigger: 'scroll',
        resource: url,
        type: 'image',
        priority: 'high'
      });
    });
  }

  // Précharger les pages seulement sur hover des liens
  preloadPagesOnHover(): void {
    const pageLinks = document.querySelectorAll('a[href^="/"]');
    
    pageLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      this.preloadOnHover(link as HTMLElement, {
        trigger: 'hover',
        resource: href,
        type: 'data',
        priority: 'medium'
      });
    });
  }

  // Nettoyer les ressources
  cleanup(): void {
    this.hoverTimeouts.forEach(timeout => clearTimeout(timeout));
    this.hoverTimeouts.clear();
    this.preloadedResources.clear();
  }
}

// Instance singleton
export const smartPreloadService = new SmartPreloadService();

// Hook pour utiliser le service de préchargement intelligent
export const useSmartPreload = () => {
  return {
    preloadOnHover: (element: HTMLElement, config: SmartPreloadConfig) => 
      smartPreloadService.preloadOnHover(element, config),
    preloadOnClick: (element: HTMLElement, config: SmartPreloadConfig) => 
      smartPreloadService.preloadOnClick(element, config),
    preloadOnFocus: (element: HTMLElement, config: SmartPreloadConfig) => 
      smartPreloadService.preloadOnFocus(element, config),
    preloadOnScroll: (selector: string, config: SmartPreloadConfig) => 
      smartPreloadService.preloadOnScroll(selector, config),
    preloadCriticalImages: () => smartPreloadService.preloadCriticalImages(),
    preloadPagesOnHover: () => smartPreloadService.preloadPagesOnHover(),
    cleanup: () => smartPreloadService.cleanup()
  };
}; 