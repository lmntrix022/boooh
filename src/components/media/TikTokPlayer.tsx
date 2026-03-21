import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, AlertCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TikTokPlayerProps {
  media: {
    id: string;
    title: string;
    url: string;
    metadata?: any;
  };
  onLoad?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const TikTokPlayer: React.FC<TikTokPlayerProps> = ({
  media,
  onLoad,
  onError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [videoId, setVideoId] = useState<string>('');

  // Extraire l'ID de la vidéo TikTok depuis l'URL
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // Format: https://www.tiktok.com/@username/video/1234567890123456789
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch && videoMatch[1]) {
      return videoMatch[1];
    }
    
    // Format: https://vm.tiktok.com/xxxxx ou https://www.tiktok.com/t/xxxxx
    const shortMatch = url.split("/").pop()?.split("?")[0];
    if (shortMatch) {
      return shortMatch;
    }
    
    return '';
  };

  // Extraire l'ID de la vidéo au montage
  useEffect(() => {
    const extractedId = extractVideoId(media.url);
    if (!extractedId) {
      setHasError(true);
      setErrorMessage('URL TikTok invalide');
      onError?.('URL TikTok invalide');
      return;
    }
    setVideoId(extractedId);
  }, [media.url, onError]);

  // Charger le script TikTok et initialiser le lecteur
  useEffect(() => {
    if (!videoId) return;

    const loadTikTokScript = () => {
      // Vérifier si le script existe déjà
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
      if (existingScript) {
        // Si le script existe déjà, vérifier si tiktokEmbed est disponible
        if (window.tiktokEmbed && window.tiktokEmbed.load) {
          setScriptLoaded(true);
          // Attendre que le blockquote soit dans le DOM
          setTimeout(() => {
            try {
              window.tiktokEmbed.load();
              setIsLoading(false);
              onLoad?.();
            } catch (error) {
              console.error('Erreur lors de l\'initialisation TikTok:', error);
            }
          }, 300);
        } else {
          // Script chargé mais tiktokEmbed pas encore disponible
          const checkInterval = setInterval(() => {
            if (window.tiktokEmbed && window.tiktokEmbed.load) {
              clearInterval(checkInterval);
              setScriptLoaded(true);
              setTimeout(() => {
                try {
                  window.tiktokEmbed.load();
                  setIsLoading(false);
                  onLoad?.();
                } catch (error) {
                  console.error('Erreur lors de l\'initialisation TikTok:', error);
                }
              }, 300);
            }
          }, 100);
          
          setTimeout(() => clearInterval(checkInterval), 5000);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => {
        // Attendre que tiktokEmbed soit disponible
        const checkTikTokEmbed = setInterval(() => {
          if (window.tiktokEmbed && window.tiktokEmbed.load) {
            clearInterval(checkTikTokEmbed);
            setScriptLoaded(true);
            // Attendre que le blockquote soit dans le DOM
            setTimeout(() => {
              try {
                window.tiktokEmbed.load();
                setIsLoading(false);
                onLoad?.();
              } catch (error) {
                console.error('Erreur lors de l\'initialisation TikTok:', error);
                setHasError(true);
                setErrorMessage('Erreur lors de l\'initialisation du lecteur TikTok');
                onError?.('Erreur lors de l\'initialisation du lecteur TikTok');
              }
            }, 300);
          }
        }, 50);

        // Timeout de sécurité
        setTimeout(() => {
          clearInterval(checkTikTokEmbed);
          if (!scriptLoaded) {
            setHasError(true);
            setErrorMessage('Timeout lors du chargement du script TikTok');
            onError?.('Timeout lors du chargement du script TikTok');
          }
        }, 10000);
      };
      script.onerror = () => {
        setHasError(true);
        setErrorMessage('Erreur de chargement du script TikTok');
        onError?.('Erreur de chargement du script TikTok');
      };
      
      document.body.appendChild(script);
    };

    // Délai pour éviter les conflits
    const timer = setTimeout(loadTikTokScript, 100);
    return () => clearTimeout(timer);
  }, [videoId, onLoad, onError, scriptLoaded]);

  // Réinitialiser le lecteur quand le blockquote est monté
  useEffect(() => {
    if (!scriptLoaded || !videoId) return;

    // Attendre que le blockquote soit dans le DOM
    const checkBlockquote = setInterval(() => {
      const blockquote = document.querySelector(`blockquote[data-video-id="${videoId}"]`);
      if (blockquote && window.tiktokEmbed && window.tiktokEmbed.load) {
        clearInterval(checkBlockquote);
        // Réinitialiser le lecteur
        setTimeout(() => {
          try {
            window.tiktokEmbed.load();
          } catch (error) {
            console.error('Erreur lors de la réinitialisation TikTok:', error);
          }
        }, 500);
      }
    }, 100);

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      clearInterval(checkBlockquote);
    }, 5000);

    return () => {
      clearInterval(checkBlockquote);
      clearTimeout(timeout);
    };
  }, [scriptLoaded, videoId]);

  // Timeout pour éviter l'attente infinie
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasError && scriptLoaded) {
        // Si le script est chargé mais toujours en chargement, forcer l'arrêt
        setIsLoading(false);
        onLoad?.();
      }
    }, 15000); // 15 secondes

    return () => clearTimeout(timeout);
  }, [isLoading, hasError, scriptLoaded, onLoad]);

  // Gérer le clic pour ouvrir dans TikTok
  const handleOpenInTikTok = () => {
    window.open(media.url, '_blank', 'noopener,noreferrer');
  };

  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-800 to-black rounded-lg border border-gray-600 ${className}`}
      >
        {/* Icône TikTok avec animation */}
        <div className="relative mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <Video className="w-8 h-8 text-white" />
          </div>
          <AlertCircle className="w-6 h-6 text-red-400 absolute -top-1 -right-1" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          TikTok non disponible
        </h3>
        <p className="text-sm text-white/70 text-center mb-4 max-w-xs">
          Le lecteur TikTok ne peut pas être chargé. Cliquez pour voir la vidéo directement sur TikTok.
        </p>
        
        <Button
          onClick={handleOpenInTikTok}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Voir sur TikTok</span>
        </Button>
      </motion.div>
    );
  }

  if (!videoId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-800 to-black rounded-lg ${className}`}
      >
        <div className="relative mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <Video className="w-8 h-8 text-white" />
          </div>
          <AlertCircle className="w-6 h-6 text-red-400 absolute -top-1 -right-1" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          URL TikTok invalide
        </h3>
        <p className="text-sm text-white/70 text-center mb-4 max-w-xs">
          Impossible d'extraire l'ID de la vidéo depuis l'URL fournie.
        </p>
        <Button
          onClick={handleOpenInTikTok}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Voir sur TikTok</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full h-full ${className}`}
    >
      {/* Overlay de chargement */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Video className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
          <p className="text-sm text-white/80">Chargement de la vidéo TikTok...</p>
        </div>
      )}
      
      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black relative">
        <style>{`
          .tiktok-embed {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: hidden !important;
            position: relative !important;
          }
          .tiktok-embed iframe {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .tiktok-embed > section {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `}</style>
        <blockquote
          className="tiktok-embed"
          cite={media.url}
          data-video-id={videoId}
          style={{ 
            maxWidth: "100%", 
            minWidth: "100%",
            width: "100%",
            height: "100%",
            minHeight: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            overflow: "hidden",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out"
          }}
        >
          <section style={{ width: "100%", height: "100%", margin: 0, padding: 0 }}></section>
        </blockquote>
      </div>
    </motion.div>
  );
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    tiktokEmbed: {
      load: () => void;
    };
  }
}

export default TikTokPlayer;
