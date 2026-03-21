/**
 * Hook unifié pour la gestion des images
 *
 * Combine:
 * - useImageOptimization
 * - useImageConversion
 * - useImagePreloader
 * - useImageUpload
 *
 * Fournit:
 * - Upload avec validation
 * - Optimisation/conversion automatique
 * - Préchargement
 * - Gestion d'état
 */

import { useState, useCallback } from 'react';
import { ImageUploadService } from '@/services/imageUploadService';

export interface ImageUploadResult {
  url: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  format?: string;
}

export interface UseImageManagementOptions {
  type: 'avatar' | 'logo' | 'cover' | 'product' | 'media';
  userId?: string;
  maxSizeMB?: number;
  autoOptimize?: boolean;
  onUploadStart?: () => void;
  onUploadSuccess?: (result: ImageUploadResult) => void;
  onUploadError?: (error: string) => void;
}

export function useImageManagement(options: UseImageManagementOptions) {
  const {
    type,
    userId,
    maxSizeMB = 5,
    autoOptimize = true,
    onUploadStart,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageUploadResult | null>(null);

  /**
   * Valider un fichier image
   */
  const validateImage = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Vérifier le type
      if (!ImageUploadService.validateFileType(file)) {
        return {
          valid: false,
          error: 'Veuillez sélectionner un fichier image valide (JPEG, PNG, WebP, GIF)',
        };
      }

      // Vérifier la taille
      if (!ImageUploadService.validateFileSize(file, maxSizeMB)) {
        return {
          valid: false,
          error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`,
        };
      }

      return { valid: true };
    },
    [maxSizeMB]
  );

  /**
   * Uploader une image
   */
  const uploadImage = useCallback(
    async (file: File): Promise<ImageUploadResult> => {
      // Validation
      const validation = validateImage(file);
      if (!validation.valid) {
        const errorMessage = validation.error || 'Fichier invalide';
        setError(errorMessage);
        onUploadError?.(errorMessage);
        throw new Error(errorMessage);
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      onUploadStart?.();

      try {
        // Upload avec optimisation optionnelle
        const uploadResult = await ImageUploadService.uploadImage(
          file,
          type,
          userId,
          autoOptimize
        );

        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }

        const result: ImageUploadResult = {
          url: uploadResult.url,
          originalSize: uploadResult.originalSize,
          compressedSize: uploadResult.compressedSize,
          compressionRatio: uploadResult.compressionRatio,
          format: uploadResult.format,
        };

        setResult(result);
        setUploadProgress(100);
        onUploadSuccess?.(result);

        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Erreur lors de l'upload";
        setError(errorMessage);
        onUploadError?.(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [type, userId, autoOptimize, validateImage, onUploadStart, onUploadSuccess, onUploadError]
  );

  /**
   * Uploader depuis une URL (ex: copier-coller)
   */
  const uploadFromUrl = useCallback(
    async (url: string): Promise<ImageUploadResult> => {
      setIsUploading(true);
      setError(null);

      try {
        // Fetch l'image
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Impossible de charger l\'image depuis cette URL');
        }

        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });

        return await uploadImage(file);
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du chargement de l\'image';
        setError(errorMessage);
        onUploadError?.(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadImage, onUploadError]
  );

  /**
   * Précharger une image
   */
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  }, []);

  /**
   * Précharger plusieurs images
   */
  const preloadImages = useCallback(
    async (urls: string[]): Promise<void> => {
      try {
        await Promise.all(urls.map((url) => preloadImage(url)));
      } catch (err) {
        console.error('Error preloading images:', err);
      }
    },
    [preloadImage]
  );

  /**
   * Réinitialiser l'état
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setResult(null);
  }, []);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    isUploading,
    uploadProgress,
    error,
    result,

    // Méthodes
    uploadImage,
    uploadFromUrl,
    validateImage,
    preloadImage,
    preloadImages,
    reset,
    clearError,
  };
}

export default useImageManagement;
