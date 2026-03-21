import { useState, useEffect } from 'react';

interface Website {
  id: string;
  image?: string;
}

export const useImageOptimization = (websites: Website[] = []) => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());

  const handleImageLoad = (websiteId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(websiteId);
      return newSet;
    });
  };

  const handleImageStart = (websiteId: string) => {
    setLoadingImages(prev => new Set(prev).add(websiteId));
  };

  // Préchargement optimisé des images des sites web
  useEffect(() => {
    if (!websites?.length) return;
    
    websites.forEach(website => {
      if (website.image && !imageCache.has(website.id) && !loadingImages.has(website.id)) {
        handleImageStart(website.id);
        
        const img = new Image();
        img.onload = () => {
          setImageCache(prev => new Map(prev).set(website.id, website.image));
          handleImageLoad(website.id);
        };
        img.onerror = () => handleImageLoad(website.id);
        img.src = website.image;
      }
    });
  }, [websites, imageCache, loadingImages]);

  return {
    loadingImages,
    imageCache,
    handleImageLoad,
    handleImageStart
  };
};
