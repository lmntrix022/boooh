import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaSectionProps } from '@/types/media';
import { MediaPlayer } from './MediaPlayer';
import { MediaManager } from './MediaManager';
import { useMedia } from '@/hooks/useMedia';

export const MediaSection: React.FC<MediaSectionProps> = ({
  cardId,
  mediaItems = [],
  isEditable = false,
  onMediaUpdate,
  onMediaDelete,
  onMediaReorder
}) => {
  const [showManager, setShowManager] = useState(false);
  const [editingMedia, setEditingMedia] = useState<string | null>(null);

  const {
    media,
    isLoading,
    createMedia,
    updateMedia,
    deleteMedia,
    reorderMedia
  } = useMedia({ cardId });

  // Utiliser les médias du hook ou ceux passés en props
  const displayMedia = media.length > 0 ? media : mediaItems;

  const handleCreateMedia = async (mediaData: any) => {
    try {
      await createMedia(mediaData);
      setShowManager(false);
    } catch (error) {
      // Error log removed
    }
  };

  const handleUpdateMedia = async (id: string, mediaData: any) => {
    try {
      await updateMedia(id, mediaData);
      setEditingMedia(null);
      onMediaUpdate?.(mediaData);
    } catch (error) {
      // Error log removed
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await deleteMedia(id);
      onMediaDelete?.(id);
    } catch (error) {
      // Error log removed
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateMedia(id, { is_active: isActive });
    } catch (error) {
      // Error log removed
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Play className="w-6 h-6 text-purple-500" />
            <span>Mon Contenu</span>
          </h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Play className="w-6 h-6 text-purple-500" />
          <span>Mon Contenu</span>
          {displayMedia.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({displayMedia.length} média{displayMedia.length > 1 ? 's' : ''})
            </span>
          )}
        </h2>

        {isEditable && (
          <Button
            onClick={() => setShowManager(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un média
          </Button>
        )}
      </div>

      {/* Media Grid */}
      {displayMedia.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Play className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucun contenu média
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Ajoutez des vidéos, de la musique ou d'autres contenus pour enrichir votre carte.
            </p>
            {isEditable && (
              <Button
                onClick={() => setShowManager(true)}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter votre premier média
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {displayMedia.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Media Player */}
                    <MediaPlayer
                      media={media}
                      autoplay={false}
                      controls={true}
                    />

                    {/* Overlay pour les actions d'édition */}
                    {isEditable && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingMedia(media.id)}
                            className="bg-white/90 hover:bg-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleActive(media.id, !media.is_active)}
                            className="bg-white/90 hover:bg-white"
                          >
                            {media.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMedia(media.id)}
                            className="bg-red-500/90 hover:bg-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Drag handle */}
                    {isEditable && (
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white cursor-grab"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Media Manager Modal */}
      {showManager && (
        <MediaManager
          cardId={cardId}
          onClose={() => setShowManager(false)}
          onSave={handleCreateMedia}
        />
      )}

      {/* Edit Media Modal */}
      {editingMedia && (
        <MediaManager
          cardId={cardId}
          mediaId={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={(mediaData) => handleUpdateMedia(editingMedia, mediaData)}
        />
      )}
    </div>
  );
};
