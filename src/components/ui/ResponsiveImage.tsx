import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: string;
  /** Générer automatiquement des srcSet pour différentes résolutions */
  autoSrcSet?: boolean;
  /** Largeurs personnalisées pour srcSet */
  widths?: number[];
  /** Lazy loading (activé par défaut sauf si priority=true) */
  lazy?: boolean;
  /** Placeholder blur en attendant le chargement */
  blurDataURL?: string;
}

/**
 * Composant d'image responsive avec srcSet automatique et optimisations
 * - srcSet responsive automatique pour plusieurs résolutions
 * - Lazy loading natif
 * - Placeholder blur
 * - Fallback en cas d'erreur
 * - Support WebP/AVIF avec fallback
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
  fallback = '/placeholder.png',
  autoSrcSet = true,
  widths = [320, 640, 768, 1024, 1280, 1536, 1920],
  lazy = true,
  blurDataURL,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(blurDataURL || src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  /**
   * Générer srcSet automatiquement depuis l'URL de base
   * Supporte les URLs Supabase Storage
   */
  const generateSrcSet = (baseUrl: string): string => {
    if (!autoSrcSet) return '';

    // Vérifier si c'est une URL Supabase Storage
    const isSupabase = baseUrl.includes('supabase');

    if (!isSupabase) {
      // Pour les autres URLs, retourner l'URL de base
      return '';
    }

    // Générer srcSet pour différentes largeurs
    const srcSetEntries = widths.map(width => {
      // Pour Supabase, on peut utiliser les transformations d'image
      // https://supabase.com/docs/guides/storage/serving/image-transformations
      const url = new URL(baseUrl);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', '85');
      return `${url.toString()} ${width}w`;
    });

    return srcSetEntries.join(', ');
  };

  /**
   * Détecter le format d'image optimal (WebP, AVIF)
   */
  const getOptimalFormat = (baseUrl: string): { webp: string; avif: string } => {
    const url = new URL(baseUrl);

    const webpUrl = new URL(baseUrl);
    webpUrl.searchParams.set('format', 'webp');

    const avifUrl = new URL(baseUrl);
    avifUrl.searchParams.set('format', 'avif');

    return {
      webp: webpUrl.toString(),
      avif: avifUrl.toString(),
    };
  };

  const handleLoad = () => {
    setIsLoading(false);
    setImageSrc(src);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(fallback);
    onError?.(new Error(`Failed to load image: ${src}`));
  };

  useEffect(() => {
    // Si l'image est prioritaire, précharger immédiatement
    if (priority && imgRef.current) {
      const img = new Image();
      img.src = src;
      img.onload = handleLoad;
      img.onerror = handleError;
    }
  }, [src, priority]);

  const srcSet = generateSrcSet(src);
  const { webp, avif } = src.includes('supabase') ? getOptimalFormat(src) : { webp: '', avif: '' };

  // Si on a des formats optimisés, utiliser <picture>
  if (webp || avif) {
    return (
      <picture className={cn('relative', className)}>
        {avif && (
          <source
            type="image/avif"
            srcSet={generateSrcSet(avif) || avif}
            sizes={sizes}
          />
        )}
        {webp && (
          <source
            type="image/webp"
            srcSet={generateSrcSet(webp) || webp}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100',
            className
          )}
          style={{
            ...(blurDataURL && isLoading && {
              filter: 'blur(10px)',
              transform: 'scale(1.1)',
            }),
          }}
        />
        {isLoading && blurDataURL && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </picture>
    );
  }

  // Image normale avec srcSet
  return (
    <div className={cn('relative', className)}>
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        style={{
          ...(blurDataURL && isLoading && {
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }),
        }}
      />
      {isLoading && blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

/**
 * Composant spécialisé pour les avatars avec srcSet responsive
 */
export const ResponsiveAvatar: React.FC<
  Omit<ResponsiveImageProps, 'widths' | 'sizes'>
> = (props) => {
  return (
    <ResponsiveImage
      {...props}
      widths={[40, 80, 120, 160, 240]}
      sizes="(max-width: 640px) 40px, (max-width: 768px) 80px, (max-width: 1024px) 120px, 160px"
      className={cn('rounded-full', props.className)}
    />
  );
};

/**
 * Composant spécialisé pour les images de cartes avec srcSet responsive
 */
export const ResponsiveCardImage: React.FC<
  Omit<ResponsiveImageProps, 'widths' | 'sizes'>
> = (props) => {
  return (
    <ResponsiveImage
      {...props}
      widths={[320, 640, 768, 1024, 1280]}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 640px, (max-width: 1024px) 768px, 1024px"
      className={cn('w-full h-auto', props.className)}
    />
  );
};

/**
 * Composant spécialisé pour les images de fond avec srcSet responsive
 */
export const ResponsiveBackgroundImage: React.FC<
  Omit<ResponsiveImageProps, 'widths' | 'sizes'> & { children?: React.ReactNode }
> = ({ children, ...props }) => {
  return (
    <div className={cn('relative overflow-hidden', props.className)}>
      <ResponsiveImage
        {...props}
        widths={[640, 768, 1024, 1280, 1536, 1920, 2560]}
        sizes="100vw"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};
