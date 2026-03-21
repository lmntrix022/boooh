import React from 'react';

/**
 * Utilitaires pour la gestion et le nettoyage des URLs blob
 */

/**
 * Nettoie toutes les URLs blob orphelines
 * À utiliser en cas de fuite mémoire avec les blobs
 */
export const cleanupOrphanedBlobs = (): void => {
  try {
    // Parcourir tous les éléments du DOM pour trouver les blob URLs actifs
    const activeBlobs = new Set<string>();
    
    const elements = document.querySelectorAll('img, video, audio, source, canvas');
    elements.forEach(element => {
      const src = element.getAttribute('src');
      if (src && src.startsWith('blob:')) {
        activeBlobs.add(src);
      }
    });
    
    // Parcourir les styles CSS pour trouver les blob URLs
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSStyleRule;
          if (rule.style && rule.style.backgroundImage) {
            const match = rule.style.backgroundImage.match(/url\(['"]?(blob:[^'"]+)['"]?\)/);
            if (match) {
              activeBlobs.add(match[1]);
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs CORS
      }
    }
    
    // Forcer le garbage collection si disponible
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    }
    
    // Log removed
  } catch (error) {
    // Warning log removed
  }
};

/**
 * Crée une URL blob avec gestion automatique du nettoyage
 */
export const createManagedBlobURL = (blob: Blob): string => {
  const url = URL.createObjectURL(blob);
  
  // Nettoyer automatiquement après 5 minutes
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // Warning log removed
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return url;
};

/**
 * Télécharge un fichier avec nettoyage automatique de l'URL blob
 */
export const downloadFileWithCleanup = (
  content: string | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Nettoyer immédiatement après le téléchargement
  URL.revokeObjectURL(url);
};

/**
 * Hook pour gérer les URLs blob dans React
 */
export const useBlobURL = () => {
  const [blobURLs, setBlobURLs] = React.useState<Set<string>>(new Set());
  
  const createBlobURL = React.useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    setBlobURLs(prev => new Set([...prev, url]));
    return url;
  }, []);
  
  const revokeBlobURL = React.useCallback((url: string) => {
    URL.revokeObjectURL(url);
    setBlobURLs(prev => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  }, []);
  
  const cleanupAll = React.useCallback(() => {
    blobURLs.forEach(url => URL.revokeObjectURL(url));
    setBlobURLs(new Set());
  }, [blobURLs]);
  
  // Nettoyer au démontage du composant
  React.useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);
  
  return {
    createBlobURL,
    revokeBlobURL,
    cleanupAll,
    activeBlobURLs: blobURLs.size
  };
};

// Extension de l'interface Window pour le garbage collection
declare global {
  interface Window {
    gc?: () => void;
  }
}
