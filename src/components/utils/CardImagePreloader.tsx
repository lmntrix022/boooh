import React, { useEffect, useState } from 'react';
import { useImagePreloader } from '@/hooks/useImagePreloader';

interface CardImagePreloaderProps {
  cardData: {
    avatar_url?: string;
    cover_image_url?: string;
    company_logo_url?: string;
    products?: Array<{ image_url?: string }>;
    media_content?: Array<{ thumbnail_url?: string }>;
  };
  onPreloadComplete?: () => void;
}

const CardImagePreloader: React.FC<CardImagePreloaderProps> = ({
  cardData,
  onPreloadComplete
}) => {
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(true);

  // Collecter toutes les URLs d'images
  const imageUrls = React.useMemo(() => {
    const urls: string[] = [];
    
    if (cardData.avatar_url) urls.push(cardData.avatar_url);
    if (cardData.cover_image_url) urls.push(cardData.cover_image_url);
    if (cardData.company_logo_url) urls.push(cardData.company_logo_url);
    
    cardData.products?.forEach(product => {
      if (product.image_url) urls.push(product.image_url);
    });
    
    cardData.media_content?.forEach(media => {
      if (media.thumbnail_url) urls.push(media.thumbnail_url);
    });
    
    return urls;
  }, [cardData]);

  // Précharger les images prioritaires (avatar, cover, logo)
  const priorityImages = React.useMemo(() => [
    cardData.avatar_url,
    cardData.cover_image_url,
    cardData.company_logo_url
  ].filter(Boolean) as string[], [cardData]);

  // Précharger les images secondaires
  const secondaryImages = React.useMemo(() => {
    const urls: string[] = [];
    cardData.products?.forEach(product => {
      if (product.image_url) urls.push(product.image_url);
    });
    cardData.media_content?.forEach(media => {
      if (media.thumbnail_url) urls.push(media.thumbnail_url);
    });
    return urls;
  }, [cardData]);

  // Hook pour précharger les images prioritaires
  const { progress: priorityProgress } = useImagePreloader(
    priorityImages[0] || '',
    { priority: true }
  );

  // Hook pour précharger les images secondaires
  const { progress: secondaryProgress, isComplete } = useImagePreloader(
    secondaryImages[0] || '',
    { priority: false }
  );

  // Calculer le progrès global avec priorité aux images critiques
  useEffect(() => {
    const totalImages = imageUrls.length;
    if (totalImages === 0) {
      setPreloadProgress(100);
      setIsPreloading(false);
      onPreloadComplete?.();
      return;
    }

    // Prioriser les images critiques (avatar, cover, logo)
    const criticalImages = priorityImages.length;
    const secondaryImages = imageUrls.length - criticalImages;
    
    // Les images critiques comptent pour 70% du progrès
    const criticalWeight = 0.7;
    const secondaryWeight = 0.3;
    
    const criticalProgress = criticalImages > 0 ? (priorityProgress * criticalWeight) : 0;
    const secondaryProgressValue = secondaryImages > 0 ? (secondaryProgress * secondaryWeight) : 0;
    
    const globalProgress = criticalProgress + secondaryProgressValue;
    setPreloadProgress(globalProgress);

    // Arrêter le preloading dès que les images critiques sont chargées
    if (priorityProgress >= 100 || globalProgress >= 70) {
      setIsPreloading(false);
      onPreloadComplete?.();
    }
  }, [priorityProgress, secondaryProgress, imageUrls.length, priorityImages.length, onPreloadComplete]);

  // Afficher le preloader seulement si nécessaire et pas trop longtemps
  if (!isPreloading || imageUrls.length === 0 || preloadProgress > 80) {
    return null;
  }

  // Timeout pour éviter un chargement trop long
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 2000); // Masquer après 2 secondes maximum

    return () => clearTimeout(timeout);
  }, []);

  if (showTimeout) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner animé plus petit et plus rapide */}
        <div className="relative w-12 h-12 mx-auto mb-3">
          <div className="absolute inset-0 border-3 border-gray-200 rounded-full"></div>
          <div 
            className="absolute inset-0 border-3 border-indigo-500 rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '0.8s' }}
          ></div>
        </div>
        
        {/* Progrès plus discret */}
        <div className="w-32 h-1.5 bg-gray-200 rounded-full mx-auto mb-2">
          <div 
            className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200"
            style={{ width: `${preloadProgress}%` }}
          ></div>
        </div>
        
        {/* Texte plus court */}
        <p className="text-xs text-gray-600">
          {Math.round(preloadProgress)}%
        </p>
      </div>
    </div>
  );
};

export default CardImagePreloader;
