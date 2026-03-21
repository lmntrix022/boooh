import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Music, Video, FileAudio, FileVideo, Youtube, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaManager } from '@/components/media/MediaManager';
import { MediaFormData, MediaType, MEDIA_TYPES } from '@/types/media';
import { useLanguage } from '@/hooks/useLanguage';

interface MediaStepProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
  suggestions?: any;
  cardId?: string;
}

export const MediaStep: React.FC<MediaStepProps> = ({ data, onChange, errors, suggestions, cardId }) => {
  const { t } = useLanguage();
  const [showManager, setShowManager] = useState(false);
  const [editingMedia, setEditingMedia] = useState<number | null>(null);

  const safeData = data || {};
  const mediaContent = safeData.mediaContent || [];

  const handleAddMedia = (mediaData: MediaFormData) => {
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    
    const newMediaContent = [...mediaContent, mediaData];
    // Log removed
    
    onChange('mediaContent', newMediaContent);
    setShowManager(false);
    
    // Log removed
  };

  const handleEditMedia = (index: number, mediaData: MediaFormData) => {
    const newMediaContent = [...mediaContent];
    newMediaContent[index] = mediaData;
    onChange('mediaContent', newMediaContent);
    setEditingMedia(null);
  };

  const handleDeleteMedia = (index: number) => {
    const newMediaContent = mediaContent.filter((_: any, i: number) => i !== index);
    onChange('mediaContent', newMediaContent);
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'audio_file':
        return <FileAudio className="w-5 h-5" />;
      case 'video_file':
        return <FileVideo className="w-5 h-5" />;
      case 'tiktok':
        return <Video className="w-5 h-5" />;
      case 'vimeo':
        return <Video className="w-5 h-5" />;
      case 'soundcloud':
        return <Music className="w-5 h-5" />;
      case 'spotify':
        return <Music className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">{t('editCardForm.mediaContent.title')}</h2>
          <p className="text-gray-600 text-sm sm:text-base">{t('editCardForm.mediaContent.description')}</p>
        </div>
        
        {/* Bouton d'ajout en haut à droite */}
        <Button
          onClick={() => setShowManager(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 sm:px-6 py-3 rounded-lg shadow-md hover:shadow-md transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">
            {mediaContent.length === 0 ? t('editCardForm.mediaContent.addMedia') : t('editCardForm.mediaContent.addAnotherMedia')}
          </span>
          <span className="sm:hidden">
            {mediaContent.length === 0 ? t('editCardForm.mediaContent.addMedia') : t('editCardForm.mediaContent.addAnother')}
          </span>
        </Button>
      </div>

      {/* Liste des médias existants */}
      {mediaContent.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('editCardForm.mediaContent.addedMedia', { count: mediaContent.length })}</h3>
          <div className="grid gap-4">
            {mediaContent.map((media: MediaFormData, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-gray-200 hover:border-gray-200 transition-colors">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getMediaIcon(media.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {media.title}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-sm text-gray-500">
                            <span className="font-medium">{MEDIA_TYPES[media.type]?.label}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[200px] sm:max-w-[300px]" title={media.url}>
                              {media.url}
                            </span>
                          </div>
                          {media.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {media.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMedia(index)}
                          className="text-gray-600 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMedia(index)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}


      {/* Aide contextuelle */}
      <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-4 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <div className="w-2 h-2 bg-gray-900 rounded-full mr-2"></div>
          {t('editCardForm.mediaContent.supportedTypes')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#111827">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <span className="text-gray-900 font-medium">YouTube</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#111827">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </div>
            <span className="text-gray-900 font-medium">TikTok</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#111827">
                <path d="M23.977 6.416c-.105 2.338-1.739 4.545-4.206 5.69-2.266 1.078-5.05.5-6.774-1.4-1.723-1.9-1.723-4.9 0-6.8 1.724-1.9 4.508-2.478 6.774-1.4 2.467 1.145 4.101 3.352 4.206 5.69zM8.5 12.5c0-1.4-1.1-2.5-2.5-2.5s-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5zm2.5-2.5c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5z"/>
              </svg>
            </div>
            <span className="text-gray-900 font-medium">Vimeo</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#111827">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <span className="text-gray-900 font-medium">SoundCloud</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#111827">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <span className="text-gray-900 font-medium">Spotify</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <FileAudio className="w-4 h-4 text-gray-900" />
            <span className="text-gray-900 font-medium">{t('editCardForm.mediaContent.audioFiles')}</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors">
            <FileVideo className="w-4 h-4 text-gray-900" />
            <span className="text-gray-900 font-medium">{t('editCardForm.mediaContent.videoFiles')}</span>
          </div>
        </div>
      </div>

      {/* Media Manager Modal */}
      {showManager && (
        <MediaManager
          cardId={cardId || "temp"} // Utilise le vrai cardId ou temp pour le formulaire
          onClose={() => setShowManager(false)}
          onSave={handleAddMedia}
        />
      )}

      {/* Edit Media Modal */}
      {editingMedia !== null && (
        <MediaManager
          cardId={cardId || "temp"} // Utilise le vrai cardId ou temp pour le formulaire
          onClose={() => setEditingMedia(null)}
          onSave={(mediaData) => handleEditMedia(editingMedia, mediaData)}
        />
      )}
    </div>
  );
};
