import React, { useState, useEffect, forwardRef } from 'react';
import { useMobileOptimizer } from './MobileOptimizer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  fallbackSrc?: string;
  lowQualitySrc?: string;
  lazyLoad?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Placeholder par défaut pour les images
const defaultPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3C/svg%3E";

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  placeholderSrc = defaultPlaceholder,
  fallbackSrc,
  lowQualitySrc,
  lazyLoad = true,
  priority = false,
  className = '',
  onLoad,
  onError,
  ...props
}, ref) => {
  const [imgSrc, setImgSrc] = useState<string>(priority ? src : (placeholderSrc || src));
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const config = useMobileOptimizer();

  // Déterminer la source optimale selon l'appareil
  useEffect(() => {
    if (!priority && lazyLoad) {
      // Utiliser la version basse qualité sur mobile si disponible
      const initialSrc = config.isMobile && lowQualitySrc ? lowQualitySrc : placeholderSrc || '';
      if (initialSrc) {
        setImgSrc(initialSrc);
      }
    } else if (priority) {
      setImgSrc(src);
    }
  }, [priority, src, placeholderSrc, lowQualitySrc, config.isMobile, lazyLoad]);

  // Observer l'entrée dans le viewport pour le lazy loading
  useEffect(() => {
    if (!priority && lazyLoad && typeof IntersectionObserver !== 'undefined') {
      // Utiliser une ref pour l'élément image au lieu de querySelector
      const imgElement = ref && 'current' in ref ? ref.current : null;
      if (!imgElement) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImgSrc(src);
            observer.disconnect();
          }
        });
      }, { rootMargin: '200px' }); // Charger l'image un peu avant qu'elle soit visible

      observer.observe(imgElement);
      return () => observer.disconnect();
    }
  }, [priority, src, lazyLoad, ref]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
    if (onError) onError();
  };

  // Utiliser l'attribut loading="lazy" natif pour le lazy loading
  // Le navigateur gère automatiquement le lazy loading plus efficacement
  return (
    <img
      src={imgSrc}
      alt={alt}
      data-src={src}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      loading={priority ? "eager" : (lazyLoad ? "lazy" : "eager")}
      decoding={priority ? "sync" : "async"}
      fetchpriority={priority ? "high" : "auto"}
      onLoad={handleLoad}
      onError={handleError}
      ref={ref}
      {...props}
    />
  );
});

export default OptimizedImage; 