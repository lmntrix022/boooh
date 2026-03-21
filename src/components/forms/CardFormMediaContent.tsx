/**
 * CardFormMediaContent Component - Version Premium
 * 
 * Composant modulaire pour l'étape "Contenu Média" du formulaire de carte
 * Gestion des vidéos, audio et contenus multimédias dynamiques
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Plus, Search, X, Edit, Trash2, Music, Video, FileAudio, FileVideo, 
  Youtube, TrendingUp, Film, Radio, ExternalLink, Check
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { MediaManager } from '@/components/media/MediaManager';
import { MediaFormData, MediaType, MEDIA_TYPES } from '@/types/media';

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  suggestions?: Record<string, string[]>;
  cardId?: string;
}

// Catégories de médias
const MEDIA_CATEGORIES = {
  video: {
    name: 'Vidéo',
    types: ['youtube', 'tiktok', 'vimeo', 'video_file'],
    icon: Video
  },
  audio: {
    name: 'Audio',
    types: ['spotify', 'soundcloud', 'audio_file'],
    icon: Music
  }
};

export const CardFormMediaContent: React.FC<StepProps> = ({ 
  data, 
  onChange,
  cardId 
}) => {
  const { t } = useLanguage();
  const safeData = data || {};
  const [showManager, setShowManager] = useState(false);
  const [editingMedia, setEditingMedia] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');

  const mediaContent: MediaFormData[] = safeData.mediaContent || [];

  // Filtrer les médias selon la recherche et la catégorie
  const filteredMedia = useMemo(() => {
    return mediaContent.filter((media: MediaFormData) => {
      const matchesSearch = !searchQuery || 
        media.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        media.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        media.url?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        MEDIA_CATEGORIES[selectedCategory as keyof typeof MEDIA_CATEGORIES]?.types.includes(media.type);
      
      const matchesType = filterType === 'all' || media.type === filterType;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [mediaContent, searchQuery, selectedCategory, filterType]);

  // Statistiques par type
  const statsByType = useMemo(() => {
    const stats: Record<string, number> = {};
    mediaContent.forEach((media: MediaFormData) => {
      stats[media.type] = (stats[media.type] || 0) + 1;
    });
    return stats;
  }, [mediaContent]);

  const handleAddMedia = (mediaData: MediaFormData) => {
    const newMediaContent = [...mediaContent, mediaData];
    onChange('mediaContent', newMediaContent);
    setShowManager(false);
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
        return Youtube;
      case 'audio_file':
        return FileAudio;
      case 'video_file':
        return FileVideo;
      case 'tiktok':
      case 'vimeo':
        return Video;
      case 'soundcloud':
      case 'spotify':
        return Music;
      default:
        return Play;
    }
  };

  const getMediaColor = (type: MediaType) => {
    switch (type) {
      case 'youtube':
        return 'bg-red-600';
      case 'tiktok':
        return 'bg-black';
      case 'vimeo':
        return 'bg-blue-500';
      case 'spotify':
        return 'bg-green-600';
      case 'soundcloud':
        return 'bg-orange-500';
      case 'video_file':
        return 'bg-purple-600';
      case 'audio_file':
        return 'bg-pink-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Play className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              {t('editCardForm.mediaContent.title') || 'Contenu Média'}
            </h2>
            <p className="text-sm font-light text-gray-500"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('editCardForm.mediaContent.description') || 'Ajoutez des vidéos, audio et contenus multimédias'}
            </p>
          </div>
        </div>
        <Button
            onClick={() => setShowManager(true)}
            className="rounded-lg px-4 sm:px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light flex items-center space-x-2 w-full sm:w-auto"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <Plus className="w-5 h-5" />
            <span>
              {mediaContent.length === 0 
                ? (t('editCardForm.mediaContent.addMedia') || 'Ajouter un média')
                : (t('editCardForm.mediaContent.addAnotherMedia') || 'Ajouter un autre média')
              }
            </span>
          </Button>
      </div>

      {/* Statistiques */}
      {mediaContent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Film className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {statsByType['youtube'] || 0}
                </div>
                <div className="text-xs font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Vidéos</div>
              </div>
            </div>
          </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Radio className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {(statsByType['spotify'] || 0) + (statsByType['soundcloud'] || 0) + (statsByType['audio_file'] || 0)}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Audio</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Video className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {(statsByType['video_file'] || 0) + (statsByType['tiktok'] || 0) + (statsByType['vimeo'] || 0)}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Autres vidéos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Play className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{mediaContent.length}</div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Total médias</div>
            </div>
          </div>
        </div>
        </motion.div>
      )}

      {/* Liste des médias */}
      {mediaContent.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300"
        >
          <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
            <Play className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-light text-gray-900 mb-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.mediaContent.noMedia') || 'Aucun média ajouté'}
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            {t('editCardForm.mediaContent.noMediaDescription') || 'Ajoutez des vidéos YouTube, des fichiers audio, ou d\'autres contenus multimédias pour enrichir votre carte.'}
          </p>
          <Button
            onClick={() => setShowManager(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter votre premier média
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Barre de recherche et filtres */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un média..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setFilterType('all');
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  !selectedCategory && filterType === 'all'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({mediaContent.length})
              </button>
              {Object.entries(MEDIA_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const count = mediaContent.filter((m: MediaFormData) => 
                  category.types.includes(m.type)
                ).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(selectedCategory === key ? null : key);
                      setFilterType('all');
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                      selectedCategory === key
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste des médias filtrés */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredMedia.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-gray-500"
                >
                  <Play className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucun média trouvé</p>
                  {searchQuery && (
                    <p className="text-xs text-gray-400 mt-1">Essayez une autre recherche</p>
                  )}
                </motion.div>
              ) : (
                filteredMedia.map((media: MediaFormData, index: number) => {
                  const originalIndex = mediaContent.findIndex((m: MediaFormData) => m === media);
                  const Icon = getMediaIcon(media.type);
                  const colorClass = getMediaColor(media.type);
                  
                  return (
                    <motion.div
                      key={originalIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      {/* Icône du média */}
                      <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm`}>
                          <Icon className="w-7 h-7 text-gray-600" />
                        </div>
                      </div>

                      {/* Informations */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-light text-gray-900 truncate"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{media.title || 'Sans titre'}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {MEDIA_TYPES[media.type]?.label || media.type}
                          </span>
                        </div>
                        {media.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{media.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-700 truncate flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate max-w-[200px]">{media.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMedia(originalIndex);
                            setShowManager(true);
                          }}
                          className="border-gray-200 hover:bg-gray-50 text-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t('editCardForm.mediaContent.edit') || 'Modifier'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMedia(originalIndex)}
                          className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t('editCardForm.mediaContent.delete') || 'Supprimer'}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Section des types de médias supportés */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h4 className="font-light text-gray-900 flex items-center gap-2 mb-4"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
          {t('editCardForm.mediaContent.supportedTypes') || 'Types de médias supportés'}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(MEDIA_TYPES).map(([key, type]) => {
            const Icon = getMediaIcon(key as MediaType);
            const colorClass = getMediaColor(key as MediaType);
            const count = statsByType[key] || 0;
            const isAdded = count > 0;
            
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => setShowManager(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-4 rounded-lg border transition-all flex flex-col items-center text-center ${
                  isAdded
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
                title={type.label}
              >
                <div className={`w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-2`}>
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-xs font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{type.label}</div>
                {isAdded && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                {count > 0 && (
                  <div className="text-xs text-green-600 mt-1 font-medium">{count} ajouté{count > 1 ? 's' : ''}</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Media Manager Modal */}
      {showManager && (
        <MediaManager
          cardId={cardId || "temp"}
          onClose={() => {
            setShowManager(false);
            setEditingMedia(null);
          }}
          onSave={(mediaData) => {
            if (editingMedia !== null) {
              handleEditMedia(editingMedia, mediaData);
            } else {
              handleAddMedia(mediaData);
            }
            setShowManager(false);
            setEditingMedia(null);
          }}
          mediaId={editingMedia !== null && mediaContent[editingMedia] ? (mediaContent[editingMedia] as any).id : undefined}
          initialData={editingMedia !== null ? mediaContent[editingMedia] : undefined}
        />
      )}
    </div>
  );
};

export default CardFormMediaContent;
