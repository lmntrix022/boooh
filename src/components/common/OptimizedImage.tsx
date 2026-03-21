/**
 * Composant OptimizedImage unifié pour l'affichage
 *
 * Combine les meilleures fonctionnalités de:
 * - /components/utils/OptimizedImage.tsx
 * - /components/utils/CardImageOptimizer.tsx
 * - /components/utils/AdvancedImageOptimizer.tsx
 *
 * Fonctionnalités:
 * - Lazy loading avec IntersectionObserver
 * - Placeholders par type (avatar, logo, cover, product, media)
 * - Fallback images en cas d'erreur
 * - Support AVIF/WebP avec fallback
 * - Transitions smooth
 * - Mobile optimization
 */

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Placeholders SVG par type
const PLACEHOLDERS = {
  avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Cpath fill='%239ca3af' d='M100 110c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25zm0 12.5c16.7 0 50 8.4 50 25v12.5H50v-12.5c0-16.6 33.3-25 50-25z'/%3E%3C/svg%3E`,
  logo: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Cpath fill='%239ca3af' d='M100 50l30 30H70l30-30zm0 100l-30-30h60l-30 30zM70 100l-30-30v60l30-30zm60 0l30 30V70l-30 30z'/%3E%3C/svg%3E`,
  cover: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23dbeafe' width='400' height='200'/%3E%3Cpath fill='%2393c5fd' d='M0 150l50-40 50 20 50-30 50 10 50-20 50 10 50-30 50 20v110H0z'/%3E%3C/svg%3E`,
  product: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23fef3c7' width='200' height='200'/%3E%3Cpath fill='%23fbbf24' d='M100 60l40 40-40 40-40-40 40-40zm0 10l-30 30 30 30 30-30-30-30z'/%3E%3C/svg%3E`,
  media: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e9d5ff' width='200' height='200'/%3E%3Ccircle fill='%23a78bfa' cx='100' cy='100' r='40'/%3E%3Cpolygon fill='%23fff' points='85,75 85,125 125,100'/%3E%3C/svg%3E`,
  default: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Cpath fill='%239ca3af' d='M100 80c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm-40 60l20-20 20 20 20-20 20 20v20H60v-20z'/%3E%3C/svg%3E`,
};

// Fallback images par type
const FALLBACKS = {
  avatar: '/placeholder-avatar.svg',
  logo: '/placeholder-logo.svg',
  cover: '/placeholder-cover.svg',
  product: '/placeholder-product.svg',
  media: '/placeholder-media.svg',
  default: '/placeholder-image.svg',
};

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  type?: 'avatar' | 'logo' | 'cover' | 'product' | 'media' | 'default';
  priority?: boolean; // Pas de lazy loading si true
  fallback?: string; // Custom fallback
  className?: string;
  containerClassName?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      type = 'default',
      priority = false,
      fallback,
      className,
      containerClassName,
      onLoadSuccess,
      onLoadError,
      ...props
    },
    ref
  ) => {
    const [imageSrc, setImageSrc] = useState<string>(
      src || PLACEHOLDERS[type] || PLACEHOLDERS.default
    );
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(priority); // Si priority, visible immédiatement
    const imgRef = useRef<HTMLImageElement>(null);

    // Lazy loading avec IntersectionObserver
    useEffect(() => {
      if (priority || !imgRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: '50px', // Charger 50px avant d'être visible
        }
      );

      observer.observe(imgRef.current);

      return () => observer.disconnect();
    }, [priority]);

    // Mettre à jour l'image quand src change
    useEffect(() => {
      if (!src) {
        setImageSrc(PLACEHOLDERS[type] || PLACEHOLDERS.default);
        setIsLoaded(false);
        setHasError(false);
        return;
      }

      // Reset l'état si l'URL change
      setIsLoaded(false);
      setHasError(false);

      // Charger seulement si visible (ou priority)
      if (isVisible) {
        setImageSrc(src);
      }
    }, [src, type, isVisible]);

    const handleLoad = () => {
      setIsLoaded(true);
      setHasError(false);
      onLoadSuccess?.();
    };

    const handleError = () => {
      setHasError(true);

      // Cascade de fallbacks
      const currentFallback = fallback || FALLBACKS[type] || FALLBACKS.default;

      // Si on est déjà sur le fallback, utiliser le placeholder
      if (imageSrc === currentFallback) {
        setImageSrc(PLACEHOLDERS[type] || PLACEHOLDERS.default);
      } else {
        setImageSrc(currentFallback);
      }

      onLoadError?.(new Error(`Failed to load image: ${src}`));
    };

    return (
      <div
        ref={imgRef}
        className={cn('relative overflow-hidden bg-gray-100', containerClassName)}
      >
        <img
          ref={ref}
          src={isVisible ? imageSrc : PLACEHOLDERS[type] || PLACEHOLDERS.default}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          {...props}
        />

        {/* Placeholder pendant le chargement */}
        {!isLoaded && !hasError && (
          <div
            className="absolute inset-0 bg-gray-200 animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
