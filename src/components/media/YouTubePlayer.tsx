import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubePlayerProps {
  media: any;
  autoplay?: boolean;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  media,
  autoplay = false,
  controls = true,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const videoId = media.metadata?.video_id;

  useEffect(() => {
    if (!videoId) {
      setHasError(true);
      onError?.('ID vidéo YouTube manquant');
      return;
    }

    // Simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoad?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [videoId, onLoad, onError]);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">ID vidéo YouTube manquant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-red-900 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <p className="text-sm">Erreur de chargement de la vidéo</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="mt-2"
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&showinfo=0&controls=${controls ? 1 : 0}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={media.title || 'Vidéo YouTube'}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          onError?.('Erreur de chargement de la vidéo YouTube');
        }}
      />

      {/* Overlay avec informations */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
          {media.title}
        </h3>
        {media.description && (
          <p className="text-white/80 text-xs line-clamp-2">
            {media.description}
          </p>
        )}
      </div>
    </div>
  );
};
