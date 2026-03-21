import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music, Video, FileAudio, FileVideo, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TikTokPlayer } from './TikTokPlayer';

// Styles CSS personnalisés pour les animations
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
    50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(236, 72, 153, 0.4); }
  }
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
}

interface MediaItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
}

interface MediaCarouselProps {
  mediaContent: MediaItem[];
  className?: string;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ mediaContent, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!mediaContent || mediaContent.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex < mediaContent.length - 1 ? prevIndex + 1 : 0
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? mediaContent.length - 1 : prevIndex - 1
    );
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=0&rel=0`;
    }
    return '';
  };

  const getSpotifyEmbedUrl = (url: string) => {
    const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    
    if (trackMatch && trackMatch[1]) {
      return `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator`;
    } else if (albumMatch && albumMatch[1]) {
      return `https://open.spotify.com/embed/album/${albumMatch[1]}?utm_source=generator`;
    } else if (playlistMatch && playlistMatch[1]) {
      return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator`;
    }
    
    return '';
  };

  const getSoundCloudEmbedUrl = (url: string) => {
    // SoundCloud URLs peuvent être de différents formats
    // Exemples: https://soundcloud.com/user/track-name
    //          https://soundcloud.com/user/sets/playlist-name
    const soundcloudMatch = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    
    if (soundcloudMatch && soundcloudMatch[1] && soundcloudMatch[2]) {
      const user = soundcloudMatch[1];
      const track = soundcloudMatch[2];
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
    }
    
    return '';
  };

  const getVimeoEmbedUrl = (url: string) => {
    // Vimeo URLs peuvent être de différents formats
    // Exemples: https://vimeo.com/123456789
    //          https://vimeo.com/channels/staffpicks/123456789
    //          https://vimeo.com/groups/name/videos/123456789
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0&title=0&byline=0&portrait=0`;
    }
    
    return '';
  };

  const renderMediaPlayer = (media: MediaItem) => {
    switch (media.type) {
      case 'youtube':
        const youtubeUrl = getYouTubeEmbedUrl(media.url);
        return youtubeUrl ? (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur YouTube qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <iframe
                className="w-full h-full"
                src={youtubeUrl}
                title={media.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
              />
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">YouTube</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">URL YouTube invalide</p>
            </div>
          </div>
        );

      case 'spotify':
        const spotifyUrl = getSpotifyEmbedUrl(media.url);
        return spotifyUrl ? (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur Spotify qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <iframe
                data-testid="embed-iframe"
                src={spotifyUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
                loading="lazy"
                title={media.title}
                className="relative z-10"
              />
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">Spotify</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">URL Spotify invalide</p>
            </div>
          </div>
        );

      case 'soundcloud':
        const soundcloudUrl = getSoundCloudEmbedUrl(media.url);
        return soundcloudUrl ? (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur SoundCloud qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <iframe
                className="w-full h-full"
                src={soundcloudUrl}
                title={media.title}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">SoundCloud</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">URL SoundCloud invalide</p>
            </div>
          </div>
        );

      case 'vimeo':
        const vimeoUrl = getVimeoEmbedUrl(media.url);
        return vimeoUrl ? (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur Vimeo qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <iframe
                className="w-full h-full border-0"
                src={vimeoUrl}
                title={media.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">Vimeo</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">URL Vimeo invalide</p>
            </div>
          </div>
        );

      case 'tiktok':
        return (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur TikTok qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <TikTokPlayer
                media={media}
                onLoad={() => {/* TikTok loaded */}}
                onError={(error) => {/* TikTok error */}}
              />
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">TikTok</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'audio_file':
        return (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur audio qui occupe toute la carte */}
            <div className="w-full h-full relative bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col justify-center items-center p-8">
              <div className="w-full max-w-md">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileAudio className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-800 font-semibold text-lg">{media.title}</h3>
                    <p className="text-gray-600 text-sm">Fichier Audio</p>
                  </div>
                </div>
                
                <audio
                  controls
                  className="w-full h-12 mb-4"
                  src={media.url}
                >
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
              </div>
              
              {/* Overlay avec bouton d'ouverture */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  onClick={() => window.open(media.url, '_blank')}
                  className="bg-white/90 hover:bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 shadow-lg backdrop-blur-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              </div>
            </div>
          </div>
        );

      case 'video_file':
        return (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group">
            {/* Lecteur vidéo qui occupe toute la carte */}
            <div className="w-full h-full relative">
              <video
                controls
                className="w-full h-full"
                src={media.url}
              >
                Votre navigateur ne supporte pas l'élément vidéo.
              </video>
              
              {/* Overlay avec informations et boutons */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{media.title}</h3>
                      <p className="text-white/70 text-xs">Vidéo</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-300 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Type de média non supporté</p>
              <Button
                onClick={() => window.open(media.url, '_blank')}
                className="mt-2"
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir le lien
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header épuré et élégant */}
      <div className="relative mb-6">
        {/* Conteneur principal avec glassmorphism subtil */}
        <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-4 shadow-lg overflow-hidden">
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-6">
              {/* Icône simple et élégante */}
              <div className="relative group/icon">
                <div className="w-12 h-12 bg-blue-950 rounded-xl flex items-center justify-center shadow-md transform group-hover/icon:scale-105 transition-all duration-300">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
              
              
            </div>
        
            {/* Indicateurs simples et élégants */}
            {mediaContent.length > 1 && (
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {mediaContent.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 ease-out ${
                        index === currentIndex 
                          ? 'w-8 h-2' 
                          : 'w-2 h-2'
                      }`}
                    >
                      <div className={`w-full h-full rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-blue-950' 
                          : 'bg-blue-800 hover:bg-blue-400'
                      }`}></div>
                    </button>
                  ))}
                </div>
                
                {/* Badge de compteur simple */}
                <div className="bg-gray-100 rounded-lg px-3 py-1">
                  <span className="text-sm font-medium text-gray-700">
                    {currentIndex + 1}/{mediaContent.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteneur du carrousel épuré */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg h-[500px] bg-white border border-gray-200">
        <motion.div
          className="flex h-full"
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {mediaContent.map((media, index) => (
            <div
              key={media.id}
              className="w-full h-full flex-shrink-0"
            >
              {renderMediaPlayer(media)}
            </div>
          ))}
        </motion.div>
        
        {/* Boutons de navigation transparents */}
        {mediaContent.length > 1 && (
          <>
            {/* Bouton précédent */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Bouton suivant */}
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>


      {/* Indicateurs de navigation simples en bas */}
      {mediaContent.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {mediaContent.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ease-out ${
                index === currentIndex 
                  ? 'w-8 h-2' 
                  : 'w-2 h-2'
              }`}
            >
              <div className={`w-full h-full rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-gray-800' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
