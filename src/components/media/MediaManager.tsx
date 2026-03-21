import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, AlertCircle, Loader2, Youtube, Music, Video, FileAudio, FileVideo, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaType, MediaFormData, MEDIA_TYPES } from '@/types/media';
import { useMediaValidation } from '@/hooks/useMedia';
import { mediaService } from '@/services/mediaService';

interface MediaManagerProps {
  cardId: string;
  mediaId?: string;
  initialData?: MediaFormData;
  onClose: () => void;
  onSave: (media: MediaFormData) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  cardId,
  mediaId,
  initialData,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<MediaFormData>(
    initialData || {
    card_id: cardId,
    type: 'youtube',
    title: '',
    description: '',
    url: '',
    thumbnail_url: '',
    duration: 0,
    order_index: 0,
    is_active: true,
    metadata: {}
    }
  );

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { validateUrl, detectType, getUrlInfo } = useMediaValidation();

  // Charger les données existantes si on édite
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        card_id: cardId
      });
    } else if (mediaId) {
      // TODO: Charger les données du média existant depuis l'API si nécessaire
      // const existingMedia = await mediaService.getMediaById(mediaId);
      // setFormData(existingMedia);
    }
  }, [initialData, mediaId, cardId]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Détecter automatiquement le type de média
  useEffect(() => {
    if (formData.url) {
      const detectedType = detectType(formData.url);
      if (detectedType && detectedType !== formData.type) {
        setFormData(prev => ({ ...prev, type: detectedType }));
      }
    }
  }, [formData.url, detectType]);

  // Vérifier si le contenu peut être scrollé
  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight + 50); // Marge pour les boutons
      }
    };

    // Vérifier immédiatement
    checkScrollable();
    
    // Vérifier après un délai pour laisser le temps au contenu de se charger
    const timeoutId = setTimeout(checkScrollable, 100);
    
    window.addEventListener('resize', checkScrollable);
    return () => {
      window.removeEventListener('resize', checkScrollable);
      clearTimeout(timeoutId);
    };
  }, [formData, validationResult]);

  // Valider l'URL
  const handleValidateUrl = async () => {
    if (!formData.url) return;

    setIsValidating(true);
    try {
      const result = await validateUrl(formData.url, formData.type);
      setValidationResult(result);

      if (result.isValid && result.extractedData) {
        setFormData(prev => ({
          ...prev,
          title: result.extractedData.title || prev.title,
          description: result.extractedData.description || prev.description,
          thumbnail_url: result.extractedData.thumbnail_url || prev.thumbnail_url,
          duration: result.extractedData.duration || prev.duration,
          metadata: { ...prev.metadata, ...result.extractedData }
        }));
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Erreur lors de la validation'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    
    if (!validationResult?.isValid) {
      // Log removed
      await handleValidateUrl();
      return;
    }

    setIsSubmitting(true);
    try {
      // Log removed
      await onSave(formData);
      // Log removed
    } catch (error) {
      // Error log removed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir l'icône du type de média
  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'audio_file':
        return <FileAudio className="w-5 h-5" />;
      case 'video_file':
        return <FileVideo className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(139,92,246,0.15) 0, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(236,72,153,0.12) 0, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(59,130,246,0.10) 0, transparent 50%)
        `
      }}
    >
      {/* Effet de brillance animé */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          background: [
            'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.15) 0, transparent 50%)',
            'radial-gradient(circle at 80% 80%, rgba(94, 72, 236, 0.12) 0, transparent 50%)',
            'radial-gradient(circle at 40% 60%, rgba(59,130,246,0.10) 0, transparent 50%)'
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-lg shadow-sm border border-gray-200"
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          position: 'relative',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        <Card className="border-0 shadow-none flex flex-col h-full bg-transparent">
          <CardHeader className="flex-shrink-0 relative overflow-hidden">
            {/* Effet de brillance subtil */}
            
            <div className="relative flex items-center justify-between p-4 md:p-6 pb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  {getMediaIcon(formData.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-xl font-light text-gray-900 truncate"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {mediaId ? 'Modifier le média' : 'Ajouter un média'}
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">
                    {mediaId ? 'Modifiez les informations de votre média' : 'Enrichissez votre carte avec du contenu'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl p-2 transition-all duration-200 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent 
            ref={contentRef}
            className="flex-1 overflow-y-auto min-h-0 relative"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6',
              maxHeight: 'calc(100vh - 300px)',
              paddingBottom: '80px'
            }}
          >
            <div className="p-3 md:p-6 pt-1 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Type de média */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>Type de média</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: MediaType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="h-10 bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {Object.entries(MEDIA_TYPES).map(([type, config]) => (
                      <SelectItem key={type} value={type} className="hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium">{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>URL du média</span>
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 h-10 bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateUrl}
                    disabled={!formData.url || isValidating}
                    className="h-10 px-3 bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-lg shadow-sm transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {isValidating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Résultat de validation */}
              <AnimatePresence>
                {validationResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className={`p-4 rounded-lg border ${
                      validationResult.isValid 
                        ? 'bg-green-50/80 border-green-200/50 shadow-green-100' 
                        : 'bg-red-50/80 border-red-200/50 shadow-red-100'
                    } shadow-lg`}
                  >
                    {validationResult.isValid ? (
                      <div className="flex items-center space-x-3 text-green-700">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >URL valide</span>
                          <p className="text-sm text-green-600">Le média peut être ajouté</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 text-red-700">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >URL invalide</span>
                        </div>
                        <div className="ml-11 space-y-1">
                          {validationResult.errors.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-600">
                              • {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>Titre</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du média"
                  required
                  className="h-10 bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>Description (optionnel)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du média"
                  rows={3}
                  className="bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm resize-none font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>URL de la miniature (optionnel)</span>
                </Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                  className="h-10 bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>

              {/* Durée */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-light text-gray-700 flex items-center space-x-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>Durée en secondes (optionnel)</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="h-10 bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all duration-200 rounded-lg shadow-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>

            </form>
            
            {/* Indicateur de scroll */}
            {showScrollIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-2 right-2 flex items-center space-x-2 text-gray-600 text-xs bg-gray-50 rounded-full px-3 py-1 border border-gray-200 shadow-sm z-10 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <ChevronDown className="w-3 h-3 animate-bounce" />
                <span className="font-medium">Scroll</span>
              </motion.div>
            )}
            </div>
          </CardContent>

          {/* Actions fixes en bas */}
          <div className="flex justify-end space-x-3 p-4 pt-2 flex-shrink-0 relative overflow-hidden bg-white border-t border-gray-200">
            {/* Effet de brillance subtil */}
            <div className="relative flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-light rounded-lg shadow-sm transition-all duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!formData.url || !formData.title || isSubmitting}
                className="h-10 px-4 sm:px-6 bg-gray-900 hover:bg-gray-800 text-white font-light rounded-lg shadow-sm transition-all duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{mediaId ? 'Modification...' : 'Ajout...'}</span>
                    <span className="sm:hidden">{mediaId ? 'Modif...' : 'Ajout...'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">{mediaId ? 'Modifier' : 'Ajouter'}</span>
                    <span className="sm:hidden">{mediaId ? 'Modif' : 'Ajouter'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
