import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Download,
  Lock,
  Clock,
  FileText,
  Music,
  Video,
  Headphones,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DigitalProduct {
  id: string;
  title: string;
  type: 'music_album' | 'music_track' | 'ebook_pdf' | 'ebook_epub' | 'course_video' | 'course_audio' | 'course_pdf' | 'formation_pack';
  preview_url?: string;
  file_url?: string;
  duration?: number;
  preview_duration: number;
  is_premium: boolean;
  is_free: boolean;
}

interface DigitalProductPlayerProps {
  product: DigitalProduct;
  isPreview?: boolean;
  onPurchase?: () => void;
  onDownload?: () => void;
  isPurchased?: boolean;
  className?: string;
  onSwitchToBoutique?: () => void;
}

const PRODUCT_TYPE_ICONS = {
  music_album: Music,
  music_track: Music,
  ebook_pdf: FileText,
  ebook_epub: FileText,
  course_video: Video,
  course_audio: Headphones,
  course_pdf: FileText,
  formation_pack: Download
};

export const DigitalProductPlayer: React.FC<DigitalProductPlayerProps> = ({
  product,
  isPreview = true,
  onPurchase,
  onDownload,
  isPurchased = false,
  className = '',
  onSwitchToBoutique
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(product.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  
  const Icon = PRODUCT_TYPE_ICONS[product.type];
  const isAudio = product.type.includes('music') || product.type.includes('audio');
  const isVideo = product.type.includes('video');
  const isEbook = product.type.includes('ebook');
  
  // Gestion du volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Gestion du temps de prévisualisation
  useEffect(() => {
    if (isPreview && isPlaying && currentTime >= product.preview_duration) {
      setIsPlaying(false);
      setShowPurchaseOverlay(true);
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    }
  }, [currentTime, isPreview, product.preview_duration]);
  
  // Gestion des contrôles audio/vidéo
  useEffect(() => {
    const element = isAudio ? audioRef.current : videoRef.current;
    if (!element) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(element.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(element.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (isPreview) {
        setShowPurchaseOverlay(true);
      }
    };
    
    element.addEventListener('timeupdate', handleTimeUpdate);
    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('ended', handleEnded);
    
    return () => {
      element.removeEventListener('timeupdate', handleTimeUpdate);
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('ended', handleEnded);
    };
  }, [isAudio, isPreview]);
  
  const togglePlayPause = async () => {
    const element = isAudio ? audioRef.current : videoRef.current;
    if (!element) return;
    
    // Vérifier que l'URL est valide
    const mediaUrl = isPreview ? product.preview_url : product.file_url;
    if (!mediaUrl) {
      // Error log removed
      setHasError(true);
      return;
    }
    
    if (isPlaying) {
      element.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // S'assurer que l'élément a la bonne source
        if (element.src !== mediaUrl) {
          element.src = mediaUrl;
        }
        
        await element.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (error) {
        // Error log removed
        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
      }
    }
  };
  
  const handleSeek = (newTime: number) => {
    const element = isAudio ? audioRef.current : videoRef.current;
    if (!element) return;
    
    element.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const toggleMute = () => {
    const element = isAudio ? audioRef.current : videoRef.current;
    if (!element) return;
    
    element.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!isFullscreen) {
      playerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const previewProgress = isPreview ? (currentTime / product.preview_duration) * 100 : 100;
  
  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
        <CardContent className="p-0">
          <div ref={playerRef} className="relative">
            {/* Lecteur audio */}
            {isAudio && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.title}</h3>
                    <p className="text-sm text-gray-600">
                      {isPreview ? 'Prévisualisation' : 'Lecture complète'}
                    </p>
                  </div>
                </div>
                
                {/* Contrôles audio */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={togglePlayPause}
                      disabled={isLoading || hasError}
                      className={`${
                        hasError 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : hasError ? (
                        <span className="text-xs">Erreur</span>
                      ) : isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <Progress 
                        value={progress} 
                        className="h-2"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newTime = (clickX / rect.width) * duration;
                          handleSeek(newTime);
                        }}
                      />
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <audio
                  ref={audioRef}
                  src={isPreview ? product.preview_url : product.file_url}
                  preload="metadata"
                  onPlay={() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                    setHasError(false);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onLoadStart={() => {
                    setIsLoading(true);
                    setHasError(false);
                  }}
                  onCanPlay={() => {
                    setIsLoading(false);
                  }}
                  onError={(e) => {
                    // Error log removed
                    setHasError(true);
                    setIsLoading(false);
                    setIsPlaying(false);
                  }}
                />
              </div>
            )}
            
            {/* Lecteur vidéo */}
            {isVideo && (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={isPreview ? product.preview_url : product.file_url}
                  className="w-full h-64 object-cover"
                  preload="metadata"
                  onPlay={() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                    setHasError(false);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onLoadStart={() => {
                    setIsLoading(true);
                    setHasError(false);
                  }}
                  onCanPlay={() => {
                    setIsLoading(false);
                  }}
                  onError={(e) => {
                    // Error log removed
                    setHasError(true);
                    setIsLoading(false);
                    setIsPlaying(false);
                  }}
                />
                
                {/* Overlay de contrôles vidéo */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={togglePlayPause}
                      disabled={isLoading || hasError}
                      className={`${
                        hasError 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-white/90 hover:bg-white text-gray-800'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                      ) : hasError ? (
                        <span className="text-xs">Erreur</span>
                      ) : isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleMute}
                      className="bg-white/90 hover:bg-white text-gray-800"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFullscreen}
                      className="bg-white/90 hover:bg-white text-gray-800"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Barre de progression vidéo */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <Progress 
                    value={progress} 
                    className="h-1 mb-2"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      handleSeek(newTime);
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lecteur PDF */}
            {isEbook && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.title}</h3>
                    <p className="text-sm text-gray-600">Document PDF</p>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    {isPreview ? 'Aperçu limité disponible' : 'Document complet'}
                  </p>
                  
                  {isPreview && (
                    <div className="text-xs text-gray-500">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Achat requis pour le téléchargement complet
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Barre de progression de prévisualisation */}
            {isPreview && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            )}
            
            {/* Overlay d'achat */}
            <AnimatePresence>
              {showPurchaseOverlay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl p-6 max-w-md text-center"
                  >
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Prévisualisation terminée
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Achetez ce produit pour accéder au contenu complet
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPurchaseOverlay(false)}
                        className="flex-1"
                      >
                        Fermer
                      </Button>
                      <Button
                        onClick={() => {
                          onPurchase?.();
                          onSwitchToBoutique?.();
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Acheter
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
