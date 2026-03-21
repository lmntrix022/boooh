import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  media: any;
  autoplay?: boolean;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  media,
  autoplay = false,
  controls = true,
  onLoad,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Gérer le chargement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
        setIsLoading(false);
        onLoad?.();
      });

      audioRef.current.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
        onError?.('Erreur de chargement du fichier audio');
      });

      if (autoplay) {
        audioRef.current.play().catch(() => {
          // Autoplay bloqué par le navigateur
        });
      }
    }
  }, [autoplay, onLoad, onError]);

  // Gérer la lecture/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          onError?.('Erreur de lecture du fichier audio');
        });
      }
    }
  };

  // Gérer le changement de temps
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Gérer le changement de volume
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Gérer le mute/unmute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Gérer le changement de position
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Formater le temps
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Gérer les événements audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={media.url}
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
      />

      <div className="flex items-center space-x-4">
        {/* Thumbnail/Icon */}
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {media.thumbnail_url ? (
            <img 
              src={media.thumbnail_url} 
              alt={media.title} 
              className="w-full h-full rounded-xl object-cover" 
            />
          ) : (
            <Music className="w-8 h-8" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-bold text-lg truncate mb-1">
            {media.title}
          </h3>

          {/* Description */}
          {media.description && (
            <p className="text-white/80 text-sm truncate mb-3">
              {media.description}
            </p>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="text-red-200 text-sm">
              Erreur de chargement du fichier audio
            </div>
          )}

          {/* Controls */}
          {controls && !isLoading && !hasError && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-white/80 w-10">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-white/80 w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Volume control */}
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-white/80" />
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
