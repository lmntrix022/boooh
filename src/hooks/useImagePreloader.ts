import { useState, useEffect, useCallback } from 'react';

interface ImagePreloaderOptions {
  priority?: boolean;
  timeout?: number;
  retries?: number;
}

interface ImagePreloaderResult {
  isLoaded: boolean;
  hasError: boolean;
  progress: number;
  isComplete: boolean;
}

export const useImagePreloader = (
  src: string,
  options: ImagePreloaderOptions = {}
): ImagePreloaderResult => {
  const { priority = false, timeout = 3000, retries = 1 } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const preloadImage = useCallback(async (imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout;

      // Timeout pour éviter les chargements infinis
      timeoutId = setTimeout(() => {
        reject(new Error('Image loading timeout'));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        setIsLoaded(true);
        setHasError(false);
        setProgress(100);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Image loading failed'));
      };

      // Simulation du progrès plus rapide pour les images prioritaires
      if (priority) {
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 80) {
              clearInterval(progressInterval);
              return 80;
            }
            return prev + Math.random() * 30;
          });
        }, 50); // Plus rapide
      }

      img.src = imageSrc;
    });
  }, [priority, timeout]);

  useEffect(() => {
    if (!src) return;

    const loadImage = async () => {
      try {
        setProgress(0);
        setHasError(false);
        await preloadImage(src);
      } catch (error) {
        if (retryCount < retries) {
          setRetryCount(prev => prev + 1);
          // Retry avec un délai exponentiel
          setTimeout(() => {
            loadImage();
          }, Math.pow(2, retryCount) * 1000);
        } else {
          setHasError(true);
          setProgress(0);
        }
      }
    };

    loadImage();
  }, [src, preloadImage, retryCount, retries]);

  return { isLoaded, hasError, progress, isComplete: isLoaded || hasError };
};

// Hook pour précharger plusieurs images
export const useMultipleImagePreloader = (
  imageSources: string[],
  options: ImagePreloaderOptions = {}
) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (!imageSources.length) return;

    const loadAllImages = async () => {
      const promises = imageSources.map(async (src) => {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
          });
          setLoadedImages(prev => new Set([...prev, src]));
        } catch {
          setFailedImages(prev => new Set([...prev, src]));
        }
      });

      // Calculer le progrès global
      const progressInterval = setInterval(() => {
        const loaded = loadedImages.size + failedImages.size;
        const total = imageSources.length;
        setOverallProgress((loaded / total) * 100);
        
        if (loaded >= total) {
          clearInterval(progressInterval);
        }
      }, 100);

      await Promise.allSettled(promises);
      clearInterval(progressInterval);
    };

    loadAllImages();
  }, [imageSources]);

  return {
    loadedImages: Array.from(loadedImages),
    failedImages: Array.from(failedImages),
    progress: overallProgress,
    isComplete: loadedImages.size + failedImages.size === imageSources.length
  };
};
