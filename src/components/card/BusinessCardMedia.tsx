/**
 * BusinessCardMedia Component
 * 
 * Composant modulaire pour afficher les médias (vidéos, audio, images) dans la carte de visite
 * Extrait de BusinessCardModern.tsx pour améliorer la maintenabilité
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, ShoppingCart } from 'lucide-react';
import { TikTokPlayer } from '@/components/media/TikTokPlayer';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  thumbnail_url?: string;
  metadata?: any;
  duration?: number;
  title?: string;
}

interface BusinessCardMediaProps {
  combinedMediaContent: MediaItem[];
  onSwitchToBoutique?: () => void;
}

export const BusinessCardMedia: React.FC<BusinessCardMediaProps> = ({
  combinedMediaContent,
  onSwitchToBoutique
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % combinedMediaContent.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + combinedMediaContent.length) % combinedMediaContent.length);
  };

  if (combinedMediaContent.length === 0) {
    return null;
  }

  const currentMedia = combinedMediaContent[currentMediaIndex];

  return (
    <div>
      {/* Carrousel de lecteurs média */}
      <div className="relative">
        <motion.div
          key={currentMediaIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl"
        >
          <div className="w-full">
            {/* Video */}
            {currentMedia?.type === 'video' || currentMedia?.type === 'video_file' || currentMedia?.type === 'youtube' || currentMedia?.type === 'digital_video' ? (
              <div className="w-full h-96 bg-black rounded-xl overflow-hidden shadow-2xl">
                {currentMedia?.type === 'youtube' ? (
                  <iframe
                    className="w-full h-full"
                    src={(() => {
                      const url = currentMedia.url;
                      let videoId = '';

                      if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
                      } else if (url.includes('youtube.com/watch?v=')) {
                        videoId = url.split('v=')[1]?.split('&')[0] || '';
                      } else if (url.includes('youtube.com/embed/')) {
                        videoId = url.split('embed/')[1]?.split('?')[0] || '';
                      }

                      return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=1&rel=0`;
                    })()}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentMedia?.type === 'digital_video' ? (
                  <div className="relative w-full h-full">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={currentMedia.url}
                      poster={currentMedia.thumbnail_url}
                    >
                      Votre navigateur ne supporte pas l'élément vidéo.
                    </video>
                    <div className="absolute top-2 right-2 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Aperçu 15s
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {currentMedia.title}
                    </div>
                  </div>
                ) : (
                  <video
                    controls
                    className="w-full h-full object-cover"
                    src={currentMedia.url}
                    poster={currentMedia.thumbnail_url}
                  >
                    Votre navigateur ne supporte pas l'élément vidéo.
                  </video>
                )}
              </div>
            ) : currentMedia?.type === 'audio' || currentMedia?.type === 'audio_file' || currentMedia?.type === 'digital_audio' ? (
              <AudioPlayer media={currentMedia} onSwitchToBoutique={onSwitchToBoutique} />
            ) : currentMedia?.type === 'spotify' ? (
              <div className="w-full h-96 bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  className="w-full h-full"
                  src={(() => {
                    const url = currentMedia.url;
                    if (url.includes('spotify.com/track/')) {
                      const trackId = url.split('track/')[1]?.split('?')[0] || '';
                      return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
                    } else if (url.includes('spotify.com/album/')) {
                      const albumId = url.split('album/')[1]?.split('?')[0] || '';
                      return `https://open.spotify.com/embed/album/${albumId}?utm_source=generator`;
                    }
                    return url;
                  })()}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              </div>
            ) : currentMedia?.type === 'soundcloud' ? (
              <div className="w-full h-96 bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  className="w-full h-full"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentMedia.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                  width="100%"
                  height="352"
                  frameBorder="no"
                  allow="autoplay"
                />
              </div>
            ) : currentMedia?.type === 'vimeo' ? (
              <div className="w-full h-96 bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  className="w-full h-full"
                  src={(() => {
                    const url = currentMedia.url;
                    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0] || url.split('vimeo.com/')[1]?.split('#')[0] || '';
                    return `https://player.vimeo.com/video/${vimeoId}?autoplay=0&controls=1&showinfo=1&rel=0`;
                  })()}
                  title="Vimeo video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : currentMedia?.type === 'tiktok' ? (
              <div className="w-full h-96 bg-black rounded-xl overflow-hidden shadow-2xl relative">
                <TikTokPlayer
                  media={{
                    id: currentMedia.id,
                    title: currentMedia.title || 'TikTok Video',
                    url: currentMedia.url,
                    metadata: currentMedia.metadata
                  }}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    {currentMedia?.type || 'Média'}
                  </p>
                  <button
                    onClick={() => window.open(currentMedia.url, '_blank')}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                  >
                    Ouvrir dans un nouvel onglet
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation du carrousel */}
        {combinedMediaContent.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-md border border-white/40 rounded-full shadow-xl flex items-center justify-center hover:bg-white/40 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-md border border-white/40 rounded-full shadow-xl flex items-center justify-center hover:bg-white/40 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Indicateurs de pagination */}
      {combinedMediaContent.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {combinedMediaContent.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMediaIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${index === currentMediaIndex
                  ? 'bg-blue-950/40 border-blue-950/40 shadow-lg'
                  : 'bg-blue-950/10 border-blue-950/10 hover:bg-blue-950/10'
                }`}
            />
          ))}
        </div>
      )}

      {/* Compteur de position */}
      {combinedMediaContent.length > 1 && (
        <div className="text-center mt-2">
          <span className="text-xs text-gray-600 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
            {currentMediaIndex + 1} / {combinedMediaContent.length}
          </span>
        </div>
      )}

      {/* Indicateur d'aperçu pour audio digital */}
      {currentMedia?.type === 'digital_audio' && currentMedia?.url && currentMedia.url.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="text-orange-300 text-xs font-medium">Aperçu disponible</span>
        </div>
      )}
    </div>
  );
};

/**
 * AudioPlayer Component
 * Lecteur audio avec contrôles personnalisés
 */
const AudioPlayer: React.FC<{ media: MediaItem; onSwitchToBoutique?: () => void }> = ({
  media,
  onSwitchToBoutique
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const diskSpinRef = useRef<HTMLImageElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime + seconds;
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, 15));
  };

  return (
    <div className="w-full h-80 bg-gradient-to-br from-gray-900 via-blue-950 to-blue-950 rounded-2xl p-4 shadow-2xl border border-white/10 overflow-hidden">
      <div className="relative rounded-xl p-3 select-none shadow-lg overflow-hidden h-full flex flex-col justify-center"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
        {/* Image de l'album en arrière-plan */}
        {media.thumbnail_url && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <img
              src={media.thumbnail_url}
              alt={media.title || 'Audio'}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}

        {/* Effets de fond subtils */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-blue-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-200/20 to-blue-300/30 rounded-full blur-lg"></div>
        </div>

        {/* Contenu du lecteur */}
        <div className="relative z-10 flex flex-col justify-center h-full">
          <div className="space-y-2">
            {/* Disque qui tourne */}
            <div className="flex justify-center items-center space-x-3">
              <div className="relative">
                <img
                  ref={diskSpinRef}
                  src="/song/diskk.svg"
                  alt="Disque"
                  className="w-20 h-20 animate-spin"
                  style={{
                    animationDuration: '2s',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              </div>
            </div>

            {/* Titre */}
            <div className="text-center px-2">
              <h3 className="text-xs text-white/90 font-medium truncate">
                {media.title || 'The Beat'}
              </h3>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1 px-2">
              <div className="w-full bg-white/30 rounded-full h-1">
                <div
                  ref={progressBarRef}
                  className="bg-white h-1 rounded-full transition-all duration-300"
                  style={{ width: '0%' }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-white/80">
                <span ref={currentTimeRef}>0:00</span>
                <span>0:15</span>
              </div>
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-center space-x-4 px-2">
              <button
                className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                onClick={() => skip(-15)}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </button>

              <button
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors shadow-lg"
                onClick={togglePlay}
              >
                {!isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                onClick={() => skip(15)}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                </svg>
              </button>
            </div>

            {/* Lecteur audio caché */}
            <audio
              ref={audioRef}
              controls
              controlsList="nodownload nofullscreen noremoteplayback"
              className="w-full h-10 opacity-0 absolute pointer-events-none"
              src={media.url}
              onTimeUpdate={(e) => {
                const audio = e.target as HTMLAudioElement;
                if (currentTimeRef.current) {
                  const minutes = Math.floor(audio.currentTime / 60);
                  const seconds = Math.floor(audio.currentTime % 60);
                  currentTimeRef.current.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }

                if (progressBarRef.current) {
                  const progress = (audio.currentTime / 15) * 100;
                  progressBarRef.current.style.width = `${Math.min(progress, 100)}%`;
                }

                if (audio.currentTime >= 15) {
                  audio.pause();
                  audio.currentTime = 0;
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
        </div>
      </div>

      {/* Bouton Acheter */}
      {onSwitchToBoutique && (
        <div className="mt-4 px-2">
          <button
            onClick={onSwitchToBoutique}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Acheter ce produit
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessCardMedia;
