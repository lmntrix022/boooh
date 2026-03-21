import { useMemo } from 'react';

interface UseCardContentProps {
  products?: Array<any>;
  digitalProducts?: Array<any>;
  mediaContent?: Array<any>;
  description?: string;
}

export const useCardContent = ({
  products = [],
  digitalProducts = [],
  mediaContent = [],
  description
}: UseCardContentProps) => {
  const hasPhysicalProducts = products && Array.isArray(products) && products.length > 0;
  const hasDigitalProducts = digitalProducts && Array.isArray(digitalProducts) && digitalProducts.length > 0;
  const hasProducts = hasPhysicalProducts || hasDigitalProducts;
  const hasMedia = mediaContent && mediaContent.length > 0;
  
  // Créer un tableau combiné de médias et d'aperçus de produits numériques
  const combinedMediaContent = useMemo(() => {
    const media = [...(mediaContent || [])];
    
    // Ajouter les aperçus de produits numériques vidéo/audio pour le lecteur média
    const digitalPreviews = (digitalProducts || [])
      .filter(product => 
        product.type.includes('video') || 
        product.type.includes('audio') || 
        product.type.includes('music')
      )
      .map(product => {
        // Générer les URLs publiques correctes
        const fileUrl = (product as any).file_url;
        const previewUrl = (product as any).preview_url;
        const thumbnailUrl = product.thumbnail_url;

        // Helper function to check if URL is a valid media file (not an image)
        const isValidMediaFile = (url: string | null | undefined): boolean => {
          if (!url) return false;
          const lowerUrl = url.toLowerCase();
          // Check if it's an image file (should NOT be used as audio/video source)
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
          const isImage = imageExtensions.some(ext => lowerUrl.endsWith(ext));
          if (isImage) return false;

          // Check if it's a valid audio/video file
          const mediaExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm', '.mov'];
          return mediaExtensions.some(ext => lowerUrl.endsWith(ext));
        };

        // Use preview_url if it's a valid media file, otherwise use file_url
        // This prevents loading thumbnail images as audio sources
        let mediaUrl = '';
        if (isValidMediaFile(previewUrl)) {
          mediaUrl = previewUrl!;
        } else if (isValidMediaFile(fileUrl)) {
          mediaUrl = fileUrl!;
        }

        // If the URL contains '/storage/v1/object/' but not 'public', convert to public URL
        if (mediaUrl && mediaUrl.includes('/storage/v1/object/') && !mediaUrl.includes('/public/')) {
          mediaUrl = mediaUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
        }

        // Only include this product in the media carousel if we have a valid media URL
        if (!mediaUrl) {
          // Warning log removed
          return null;
        }

        return {
          id: `digital-preview-${product.id}`,
          type: product.type.includes('video') ? 'digital_video' : 'digital_audio',
          url: mediaUrl,
          thumbnail_url: thumbnailUrl,
          title: product.title,
          duration: 15, // Aperçu de 15 secondes
          isPreview: true,
          digitalProduct: product
        };
      })
      .filter(Boolean); // Remove null entries
    
    return [...media, ...digitalPreviews];
  }, [mediaContent, digitalProducts]);
  
  const hasCombinedMedia = combinedMediaContent && combinedMediaContent.length > 0;
  const hasBoutiqueContent = hasProducts;
  const shouldShowSlider = hasBoutiqueContent && (hasPhysicalProducts || hasDigitalProducts);
  const hasLiensContent = hasCombinedMedia || description || true;
  const shouldShowMediaSection = hasCombinedMedia;

  return {
    hasPhysicalProducts,
    hasDigitalProducts,
    hasProducts,
    hasMedia,
    hasCombinedMedia,
    hasBoutiqueContent,
    shouldShowSlider,
    hasLiensContent,
    shouldShowMediaSection,
    combinedMediaContent
  };
};
