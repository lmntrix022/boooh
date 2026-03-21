/**
 * Composant ImageUploader unifié
 *
 * Remplace:
 * - /components/forms/ImageUploader.tsx
 * - /components/forms/OptimizedImageUploader.tsx
 * - /components/CoverImageUploader.tsx
 *
 * Fonctionnalités:
 * - Upload avec drag & drop
 * - Validation (taille, type)
 * - Prévisualisation
 * - Statistiques de compression (optionnel)
 * - Optimisation automatique
 * - Support de 5 types: avatar, logo, cover, product, media
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadService } from '@/services/imageUploadService';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  type: 'avatar' | 'logo' | 'cover' | 'product' | 'media';
  maxSizeMB?: number;
  className?: string;
  userId?: string;
  showCompressionStats?: boolean;
  accept?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  type,
  maxSizeMB = 5,
  className = "",
  userId,
  showCompressionStats = false,
  accept = "image/*",
  disabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    format: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showChangeHover, setShowChangeHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour la prévisualisation quand la valeur change
  React.useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const handleFileUpload = useCallback(async (file: File) => {
    // Validation de la taille
    if (!ImageUploadService.validateFileSize(file, maxSizeMB)) {
      setUploadError(`Fichier trop volumineux. Maximum: ${maxSizeMB}MB`);
      return;
    }

    // Validation du type
    if (!ImageUploadService.validateFileType(file)) {
      setUploadError('Veuillez sélectionner un fichier image valide');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setCompressionStats(null);

    // Créer une prévisualisation temporaire
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    try {
      // Upload avec conversion automatique si demandé
      const result = await ImageUploadService.uploadImage(
        file,
        type,
        userId,
        showCompressionStats // Auto-optimize si on veut les stats
      );

      if (result.error) {
        setUploadError(result.error);
        setPreviewUrl(value || '');
      } else {
        setPreviewUrl(result.url);
        onChange(result.url);

        // Afficher les statistiques de compression
        if (showCompressionStats && result.compressionRatio > 0) {
          setCompressionStats({
            originalSize: result.originalSize || 0,
            compressedSize: result.compressedSize || 0,
            compressionRatio: result.compressionRatio || 0,
            format: result.format || file.type,
          });
        }
      }

      // Nettoyer l'URL temporaire
      URL.revokeObjectURL(tempUrl);
    } catch (error: any) {
      setUploadError(error.message || "Erreur lors de l'upload");
      setPreviewUrl(value || '');
    } finally {
      setIsUploading(false);
    }
  }, [type, userId, onChange, value, maxSizeMB, showCompressionStats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onChange('');
    setCompressionStats(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Zone de drop / Preview */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200",
          dragActive && !disabled && "border-blue-500 bg-blue-50",
          uploadError && "border-red-300 bg-red-50",
          !previewUrl && "p-6 text-center",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Preview Image */}
        {previewUrl ? (
          <div
            className="relative group"
            onMouseEnter={() => !disabled && setShowChangeHover(true)}
            onMouseLeave={() => setShowChangeHover(false)}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className={cn(
                "w-full h-48 object-cover rounded-lg",
                isUploading && "opacity-50"
              )}
            />

            {/* Overlay avec actions */}
            {showChangeHover && !isUploading && !disabled && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center gap-2 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleClickUpload}
                  className="bg-white hover:bg-gray-100"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Changer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}

            {/* Loader pendant l'upload */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          /* Drop Zone - Pas d'image */
          <div
            onClick={handleClickUpload}
            className={cn(
              "cursor-pointer transition-colors",
              !disabled && "hover:bg-gray-50"
            )}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {isUploading
                    ? "Téléchargement en cours..."
                    : "Cliquez ou glissez une image"}
                </p>
                <p className="text-xs text-gray-500">
                  {accept} - Max {maxSizeMB}MB
                </p>
              </div>

              {!disabled && !isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickUpload();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Parcourir
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Messages d'erreur */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Statistiques de compression */}
      {showCompressionStats && compressionStats && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-green-900">
              Image optimisée avec succès
            </p>
            <div className="text-xs text-green-700 space-y-0.5">
              <p>
                Taille originale: {formatFileSize(compressionStats.originalSize)}
              </p>
              <p>
                Taille compressée: {formatFileSize(compressionStats.compressedSize)}
              </p>
              <p>
                Compression: {compressionStats.compressionRatio.toFixed(1)}%
              </p>
              <p>Format: {compressionStats.format}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
