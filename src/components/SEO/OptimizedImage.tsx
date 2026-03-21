import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Composant OptimizedImage pour afficher les images en WebP avec fallback
 * Améliore les performances et le SEO via le lazy loading
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  title,
  loading = 'lazy',
  width,
  height,
  className
}) => {
  // Convert image path to WebP if not already
  const getWebpPath = (imageSrc: string): string => {
    if (imageSrc.includes('webp')) return imageSrc;
    return imageSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  };

  const webpSrc = getWebpPath(src);
  
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        title={title || alt}
        loading={loading}
        width={width}
        height={height}
        className={className}
        decoding="async"
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          objectFit: 'cover'
        }}
      />
    </picture>
  );
};
