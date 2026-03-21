import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ExternalLink, Music, Video, FileAudio, FileVideo, Clock, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
}

interface IntegratedMediaPlayerProps {
  media: MediaItem;
  className?: string;
}

const IntegratedMediaPlayer: React.FC<IntegratedMediaPlayerProps> = ({ media, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Video className="w-6 h-6 text-white" />;
      case 'spotify':
        return <Music className="w-6 h-6 text-white" />;
      case 'soundcloud':
        return <Music className="w-6 h-6 text-white" />;
      case 'tiktok':
        return <Video className="w-6 h-6 text-white" />;
      case 'vimeo':
        return <Video className="w-6 h-6 text-white" />;
      case 'audio_file':
        return <FileAudio className="w-6 h-6 text-white" />;
      case 'video_file':
        return <FileVideo className="w-6 h-6 text-white" />;
      default:
        return <Play className="w-6 h-6 text-white" />;
    }
  };

  const getMediaGradient = (type: string) => {
    switch (type) {
      case 'youtube':
        return 'from-red-500 to-red-600';
      case 'spotify':
        return 'from-green-500 to-green-600';
      case 'soundcloud':
        return 'from-orange-500 to-orange-600';
      case 'tiktok':
        return 'from-gray-800 to-black';
      case 'vimeo':
        return 'from-blue-500 to-blue-600';
      case 'audio_file':
        return 'from-purple-500 to-purple-600';
      case 'video_file':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPlatformName = (type: string) => {
    switch (type) {
      case 'youtube': return 'YouTube';
      case 'spotify': return 'Spotify';
      case 'soundcloud': return 'SoundCloud';
      case 'tiktok': return 'TikTok';
      case 'vimeo': return 'Vimeo';
      case 'audio_file': return 'Audio';
      case 'video_file': return 'Vidéo';
      default: return type;
    }
  };

  const handlePlay = () => {
    if (media.type === 'youtube') {
      // Pour YouTube, ouvrir dans un modal avec iframe
      setShowPlayer(true);
    } else if (media.type === 'spotify') {
      // Pour Spotify, ouvrir dans un modal avec iframe intégré
      setShowPlayer(true);
    } else if (media.type === 'audio_file' || media.type === 'video_file') {
      // Pour les fichiers audio/vidéo, utiliser le lecteur natif
      setShowPlayer(true);
    } else {
      // Pour les autres plateformes, ouvrir dans un nouvel onglet
      window.open(media.url, '_blank');
    }
  };

  const renderPlayer = () => {
    if (!showPlayer) return null;

    switch (media.type) {
      case 'youtube':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getMediaGradient(media.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                    {getMediaIcon(media.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{media.title}</h3>
                    <p className="text-sm text-gray-600">YouTube</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayer(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10"
                >
                  ✕
                </Button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(media.url)}
                  title={media.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        );

      case 'spotify':
        const spotifyEmbedUrl = getSpotifyEmbedUrl(media.url);
        // Log removed
        
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getMediaGradient(media.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                    {getMediaIcon(media.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{media.title}</h3>
                    <p className="text-sm text-gray-600">Spotify</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayer(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10"
                >
                  ✕
                </Button>
              </div>
              
              {spotifyEmbedUrl ? (
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
                  <iframe
                    data-testid="embed-iframe"
                    style={{ borderRadius: '12px' }}
                    src={spotifyEmbedUrl}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={media.title}
                    onError={() => {/* Spotify iframe failed to load */}}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    <Music className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-lg font-medium">URL Spotify invalide</p>
                    <p className="text-sm">Impossible de charger le lecteur Spotify</p>
                  </div>
                  <div className="space-y-2 text-xs text-gray-400">
                    <p>URL fournie: {media.url}</p>
                    <p>Format attendu: spotify.com/track/...</p>
                  </div>
                  <Button
                    onClick={() => window.open(media.url, '_blank')}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Ouvrir dans Spotify
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        );

      case 'audio_file':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getMediaGradient(media.type)} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <Volume2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{media.title}</h3>
                    <p className="text-sm text-gray-600">Fichier Audio</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayer(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10"
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <audio
                    controls
                    className="w-full h-12"
                    src={media.url}
                  >
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                </div>
                {media.description && (
                  <p className="text-sm text-gray-600 text-center leading-relaxed">
                    {media.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        );

      case 'video_file':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getMediaGradient(media.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                    {getMediaIcon(media.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{media.title}</h3>
                    <p className="text-sm text-gray-600">Fichier Vidéo</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayer(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10"
                >
                  ✕
                </Button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  controls
                  className="w-full h-full"
                  src={media.url}
                >
                  Votre navigateur ne supporte pas l'élément vidéo.
                </video>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1`;
    }
    return '';
  };

  const getSpotifyEmbedUrl = (url: string) => {
    // Log removed
    
    // Extraire l'ID de la piste, album ou playlist depuis l'URL Spotify
    // Les IDs Spotify peuvent contenir des caractères spéciaux comme des tirets
    const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    
    // Log removed
    // Log removed
    // Log removed
    
    if (trackMatch && trackMatch[1]) {
      const embedUrl = `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator`;
      // Log removed
      return embedUrl;
    } else if (albumMatch && albumMatch[1]) {
      const embedUrl = `https://open.spotify.com/embed/album/${albumMatch[1]}?utm_source=generator`;
      // Log removed
      return embedUrl;
    } else if (playlistMatch && playlistMatch[1]) {
      const embedUrl = `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator`;
      // Log removed
      return embedUrl;
    }
    
    // Log removed
    return '';
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-purple-300/50 transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${getMediaGradient(media.type)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
            {getMediaIcon(media.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 truncate text-sm">
              {media.title}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-gray-600 font-medium">
                {getPlatformName(media.type)}
              </p>
              {media.duration && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {Math.floor(media.duration / 60)}:{String(media.duration % 60).padStart(2, '0')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                className={`text-white bg-gradient-to-r ${getMediaGradient(media.type)} hover:opacity-90 rounded-xl w-10 h-10 shadow-lg`}
              >
                <Play className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(media.url, '_blank')}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl w-10 h-10"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
        {media.description && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-2"
          >
            {media.description}
          </motion.p>
        )}
      </motion.div>
      <AnimatePresence>
        {renderPlayer()}
      </AnimatePresence>
    </>
  );
};

export default IntegratedMediaPlayer;
