import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from 'lucide-react';
import { MediaPlayerProps } from '@/types/media';
import { YouTubePlayer } from './YouTubePlayer';
import { AudioPlayer } from './AudioPlayer';
import { TikTokPlayer } from './TikTokPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  media,
  autoplay = false,
  controls = true,
  className = '',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Gérer le chargement
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Gérer les erreurs
  const handleError = (error: string) => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(error);
    onError?.(error);
  };

  // Rendu du player selon le type
  const renderPlayer = () => {
    switch (media.type) {
      case 'youtube':
        return (
          <YouTubePlayer
            media={media}
            autoplay={autoplay}
            controls={controls}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'audio_file':
        return (
          <AudioPlayer
            media={media}
            autoplay={autoplay}
            controls={controls}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'tiktok':
        return (
          <TikTokPlayer
            media={media}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'vimeo':
        return (
          <VimeoPlayer
            media={media}
            autoplay={autoplay}
            controls={controls}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'soundcloud':
        return (
          <SoundCloudPlayer
            media={media}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'spotify':
        return (
          <SpotifyPlayer
            media={media}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      case 'video_file':
        return (
          <VideoFilePlayer
            media={media}
            autoplay={autoplay}
            controls={controls}
            onLoad={handleLoad}
            onError={handleError}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Type de média non supporté</p>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Chargement du média...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 bg-red-50/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-2">Erreur de chargement</p>
                <p className="text-xs text-red-500">{errorMessage}</p>
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

          {/* Media content */}
          {renderPlayer()}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Le composant TikTokPlayer est maintenant importé depuis le fichier dédié

// Composant Vimeo Player
const VimeoPlayer: React.FC<{ media: any; autoplay: boolean; controls: boolean; onLoad: () => void; onError: (error: string) => void }> = ({
  media,
  autoplay,
  controls,
  onLoad,
  onError
}) => {
  const videoId = media.metadata?.video_id;

  if (!videoId) {
    onError('ID vidéo Vimeo manquant');
    return null;
  }

  return (
    <div className="relative w-full aspect-video">
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&rel=0`}
        className="w-full h-full rounded-lg"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={onLoad}
        onError={() => onError('Erreur de chargement de la vidéo Vimeo')}
      />
    </div>
  );
};

// Composant SoundCloud Player
const SoundCloudPlayer: React.FC<{ media: any; onLoad: () => void; onError: (error: string) => void }> = ({
  media,
  onLoad,
  onError
}) => {
  return (
    <div className="relative w-full h-32">
      <iframe
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(media.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
        className="w-full h-full rounded-lg"
        allow="autoplay"
        onLoad={onLoad}
        onError={() => onError('Erreur de chargement du son SoundCloud')}
      />
    </div>
  );
};

// Composant Spotify Player
const SpotifyPlayer: React.FC<{ media: any; onLoad: () => void; onError: (error: string) => void }> = ({
  media,
  onLoad,
  onError
}) => {
  const trackId = media.metadata?.track_id;

  if (!trackId) {
    onError('ID track Spotify manquant');
    return null;
  }

  return (
    <div className="relative w-full h-32">
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
        className="w-full h-full rounded-lg"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        onLoad={onLoad}
        onError={() => onError('Erreur de chargement du track Spotify')}
      />
    </div>
  );
};

// Composant Video File Player
const VideoFilePlayer: React.FC<{ media: any; autoplay: boolean; controls: boolean; onLoad: () => void; onError: (error: string) => void }> = ({
  media,
  autoplay,
  controls,
  onLoad,
  onError
}) => {
  return (
    <div className="relative w-full aspect-video">
      <video
        src={media.url}
        className="w-full h-full rounded-lg object-cover"
        controls={controls}
        autoPlay={autoplay}
        onLoadedData={onLoad}
        onError={() => onError('Erreur de chargement du fichier vidéo')}
        preload="metadata"
      />
    </div>
  );
};
