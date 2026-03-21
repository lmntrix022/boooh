import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedImageOptimizerProps {
  src: string;
  alt: string;
  webpSrc?: string;
  avifSrc?: string;
  placeholderSrc?: string;
  lowQualitySrc?: string;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackDelay?: number;
  blur?: boolean;
  aspectRatio?: number;
}

export const AdvancedImageOptimizer: React.FC<AdvancedImageOptimizerProps> = ({
  src,
  alt,
  webpSrc,
  avifSrc,
  placeholderSrc,
  lowQualitySrc,
  className = '',
  priority = false,
  lazy = true,
  onLoad,
  onError,
  fallbackDelay = 300,
  blur = true,
  aspectRatio
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholderSrc || lowQualitySrc || src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Détection du support des formats modernes
  const supportsWebP = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    try {
      ctx.drawImage(new Image(), 0, 0);
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }, []);

  const supportsAvif = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }, []);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority || !lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Charger 200px avant
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, lazy]);

  // Gestion du chargement des images
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        // Vérifier le support des formats modernes
        const webpSupported = supportsWebP();
        const avifSupported = await supportsAvif();

        // Choisir le meilleur format supporté
        let optimalSrc = src;
        if (avifSupported && avifSrc) {
          optimalSrc = avifSrc;
        } else if (webpSupported && webpSrc) {
          optimalSrc = webpSrc;
        }

        // Charger l'image optimale
        const img = new Image();
        img.onload = () => {
          setCurrentSrc(optimalSrc);
          setIsLoaded(true);
          onLoad?.();
        };
        img.onerror = () => {
          // Fallback vers le format original
          setCurrentSrc(src);
          setIsLoaded(true);
          onLoad?.();
        };
        img.src = optimalSrc;
      } catch (error) {
        setHasError(true);
        onError?.();
      }
    };

    loadImage();
  }, [isInView, src, webpSrc, avifSrc, onLoad, onError, supportsWebP, supportsAvif]);

  // Preload des images prioritaires
  useEffect(() => {
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = webpSrc || src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, webpSrc, src]);

  const containerStyle = aspectRatio ? { aspectRatio: aspectRatio.toString() } : {};

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Placeholder avec blur */}
      {!isLoaded && placeholderSrc && blur && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <img
            src={placeholderSrc}
            alt=""
            className="w-full h-full object-cover filter blur-sm scale-110"
            style={{ transform: 'scale(1.1)' }}
          />
        </motion.div>
      )}

      {/* Image principale */}
      <AnimatePresence>
        {isInView && (
          <motion.img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={lazy && !priority ? 'lazy' : 'eager'}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              onError?.();
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Skeleton loader */}
      {!isLoaded && !placeholderSrc && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}

      {/* Indicateur d'erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-400 text-sm">Erreur de chargement</div>
        </div>
      )}
    </div>
  );
}; 