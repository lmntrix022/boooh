/**
 * SocialManager Component - Version Premium
 * 
 * Modal pour ajouter/éditer des liens sociaux avec UX améliorée
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Globe, Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  image?: string | null;
}

interface SocialTypeConfig {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  supportsImage?: boolean;
}

interface SocialManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (socialData: { platform: string; url: string; label: string; image: string | null }) => void;
  editingSocial: SocialLink | null;
  socialTypes: Record<string, SocialTypeConfig>;
  initialPlatform?: string;
}

export const SocialManager: React.FC<SocialManagerProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingSocial, 
  socialTypes,
  initialPlatform
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    platform: editingSocial?.platform || initialPlatform || 'linkedin',
    url: editingSocial?.url || '',
    label: editingSocial?.label || '',
    image: editingSocial?.image || null
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        platform: editingSocial?.platform || initialPlatform || 'linkedin',
        url: editingSocial?.url || '',
        label: editingSocial?.label || '',
        image: editingSocial?.image || null
      });
      setValidationResult(null);
    }
  }, [isOpen, editingSocial, initialPlatform]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Gestion de l'upload d'image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.invalidFile') || 'Fichier invalide' });
      return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB max
      setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.fileTooLarge') || 'Fichier trop volumineux (max 1MB)' });
      return;
    }

    setIsUploadingImage(true);
    setValidationResult(null);

    try {
      // Créer un URL temporaire pour l'aperçu
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: previewUrl }));

      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `social-images/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('social-images')
        .getPublicUrl(fileName);

      // Remplacer l'URL temporaire par l'URL publique
      setFormData(prev => ({ ...prev, image: publicUrl }));
      setValidationResult({ success: true, message: t('editCardForm.socialManager.success.imageUploaded') || 'Image uploadée avec succès' });

    } catch (error) {
      setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.uploadError') || 'Erreur lors de l\'upload' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Supprimer l'image
  const removeImage = async () => {
    if (formData.image) {
      // Si c'est une URL temporaire, la nettoyer
      if (formData.image.startsWith('blob:')) {
        URL.revokeObjectURL(formData.image);
      } else if (formData.image.includes('supabase')) {
        // Si c'est une URL Supabase, supprimer le fichier du storage
        try {
          const fileName = formData.image.split('/').pop();
          await supabase.storage
            .from('social-images')
            .remove([`social-images/${fileName}`]);
        } catch (error) {
          // Error handled silently
        }
      }
    }
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Validation basique
      if (!formData.url.trim()) {
        setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.urlRequired') || 'URL requise' });
        setIsValidating(false);
        return;
      }

      if ((formData.platform === 'website' || formData.platform === 'portfolio') && !formData.label.trim()) {
        setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.labelRequired') || 'Nom du site requis' });
        setIsValidating(false);
        return;
      }

      // Validation de l'URL
      try {
        new URL(formData.url);
      } catch {
        setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.invalidUrl') || 'URL invalide' });
        setIsValidating(false);
        return;
      }

      setValidationResult({ success: true, message: t('editCardForm.socialManager.success.linkAdded') || 'Lien ajouté avec succès' });
      
      // Attendre un peu pour montrer le message de succès
      setTimeout(() => {
        onSave(formData);
      }, 500);

    } catch (error) {
      setValidationResult({ success: false, message: t('editCardForm.socialManager.errors.addError') || 'Erreur lors de l\'ajout' });
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h3 className="text-xl font-light text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {editingSocial ? (t('editCardForm.socialManager.editTitle') || 'Modifier le lien') : (t('editCardForm.socialManager.addTitle') || 'Ajouter un lien')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type de réseau */}
            <div>
              <label className="block text-sm font-light mb-2 text-gray-700"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('editCardForm.socialManager.networkType') || 'Type de réseau'}
              </label>
              <select
                value={formData.platform}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, platform: e.target.value, label: e.target.value === 'website' ? prev.label : '' }));
                  setValidationResult(null);
                }}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {Object.entries(socialTypes).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Label pour sites web */}
            {formData.platform === 'website' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-light mb-2 text-gray-700"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                  {t('editCardForm.socialManager.siteName') || 'Nom du site'}
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder={t('editCardForm.socialManager.siteNamePlaceholder') || 'Ex: Mon Portfolio'}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </motion.div>
            )}

            {/* Image pour sites web */}
            {formData.platform === 'website' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-light mb-2 text-gray-700"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                  {t('editCardForm.socialManager.image.label') || 'Image du site'}
                </label>
                {formData.image ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={formData.image} 
                        alt="Aperçu" 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                        id="change-image"
                      />
                      <label
                        htmlFor="change-image"
                        className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-center cursor-pointer transition-all font-medium"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                            {t('editCardForm.socialManager.image.uploading') || 'Upload...'}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 inline mr-2" />
                            {t('editCardForm.socialManager.image.change') || 'Changer'}
                          </>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-all font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        {t('editCardForm.socialManager.image.delete') || 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="upload-image"
                    />
                    <label
                      htmlFor="upload-image"
                      className="block w-full p-8 border border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-all group"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-10 h-10 mx-auto mb-3 text-gray-400 animate-spin" />
                      ) : (
                        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      )}
                      <p className="text-sm font-light text-gray-700 mb-1"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {isUploadingImage 
                          ? (t('editCardForm.socialManager.image.uploading') || 'Upload en cours...')
                          : (t('editCardForm.socialManager.image.clickToAdd') || 'Cliquez pour ajouter une image')
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('editCardForm.socialManager.image.formats') || 'PNG, JPG, GIF jusqu\'à 1MB'}
                      </p>
                    </label>
                  </div>
                )}
              </motion.div>
            )}

            {/* URL */}
            <div>
              <label className="block text-sm font-light mb-2 text-gray-700"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('editCardForm.socialManager.url') || 'URL'}
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder={socialTypes[formData.platform]?.placeholder || 'https://...'}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>

            {/* Message de validation */}
            <AnimatePresence>
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-lg border ${
                    validationResult.success 
                      ? 'bg-gray-50 text-gray-700 border-gray-200' 
                      : 'bg-gray-50 text-red-600 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {validationResult.success ? (
                      <Check className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{validationResult.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-light transition-all duration-200"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.socialManager.cancel') || 'Annuler'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isValidating}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light transition-all duration-200"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('editCardForm.socialManager.validating') || 'Validation...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {editingSocial ? (t('editCardForm.socialManager.edit') || 'Modifier') : (t('editCardForm.socialManager.add') || 'Ajouter')}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialManager;
