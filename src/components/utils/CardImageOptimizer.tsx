import React, { useState, useEffect, useRef } from 'react';
import { OptimizedImage } from './OptimizedImage';

interface CardImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  type?: 'avatar' | 'logo' | 'cover' | 'product' | 'media';
}

const CardImageOptimizer: React.FC<CardImageOptimizerProps> = ({
  src,
  alt,
  className = "",
  fallbackSrc,
  priority = false,
  onLoad,
  onError,
  type = 'avatar'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Placeholders optimisés par type
  const getPlaceholder = (type: string) => {
    const placeholders = {
      avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23f3f4f6' rx='64'/%3E%3Cpath d='M64 32a32 32 0 100 64 32 32 0 000-64zM32 96c0-17.673 14.327-32 32-32s32 14.327 32 32' fill='%239ca3af'/%3E%3C/svg%3E",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f3f4f6' rx='24'/%3E%3Cpath d='M24 16a8 8 0 100 16 8 8 0 000-16zM12 32c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%239ca3af'/%3E%3C/svg%3E",
      cover: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='320' viewBox='0 0 400 320'%3E%3Crect width='400' height='320' fill='%23f3f4f6'/%3E%3Cpath d='M200 120a40 40 0 100 80 40 40 0 000-80zM120 240c0-44.183 35.817-80 80-80s80 35.817 80 80' fill='%239ca3af'/%3E%3C/svg%3E",
      product: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6' rx='8'/%3E%3Cpath d='M100 60a20 20 0 100 40 20 20 0 000-40zM60 140c0-22.091 17.909-40 40-40s40 17.909 40 40' fill='%239ca3af'/%3E%3C/svg%3E",
      media: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6' rx='8'/%3E%3Cpath d='M150 80a20 20 0 100 40 20 20 0 000-40zM100 140c0-27.614 22.386-50 50-50s50 22.386 50 50' fill='%239ca3af'/%3E%3C/svg%3E"
    };
    return placeholders[type as keyof typeof placeholders] || placeholders.avatar;
  };

  // Fallbacks optimisés par type
  const getFallback = (type: string) => {
    const fallbacks = {
      avatar: "/placeholder-avatar.svg",
      logo: "/placeholder-company.svg", 
      cover: "/placeholder-cover.svg",
      product: "/placeholder-product.svg",
      media: "/placeholder-media.svg"
    };
    return fallbacks[type as keyof typeof fallbacks] || fallbackSrc || "/placeholder.svg";
  };

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (imageSrc !== getFallback(type)) {
      setImageSrc(getFallback(type));
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  // Preload pour les images prioritaires avec timeout
  useEffect(() => {
    if (priority && src) {
      const img = new Image();
      const timeout = setTimeout(() => {
        // Timeout après 2 secondes pour éviter les blocages
        img.src = '';
      }, 2000);
      
      img.onload = () => {
        clearTimeout(timeout);
        // Image préchargée avec succès
      };
      img.onerror = () => {
        clearTimeout(timeout);
        // Erreur de préchargement, on utilisera le fallback
      };
      
      img.src = src;
    }
  }, [priority, src]);

  return (
    <div className={`relative ${className}`}>
      {/* Skeleton loader pendant le chargement */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {/* Image optimisée */}
      <OptimizedImage
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        lazyLoad={!priority}
        fallbackSrc={getFallback(type)}
        placeholderSrc={getPlaceholder(type)}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Indicateur d'erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardImageOptimizer;