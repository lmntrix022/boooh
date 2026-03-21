import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import { ImageConverter } from '@/utils/imageConverter';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  format?: string;
}

export class ImageUploadService {
  /**
   * Upload une image vers Supabase Storage avec conversion automatique
   */
  static async uploadImage(
    file: File, 
    type: 'avatar' | 'logo' | 'cover' | 'media' | 'product' | 'service',
    userId?: string,
    enableConversion: boolean = true
  ): Promise<UploadResult> {
    try {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      let processedFile = file;
      let conversionResult = null;

      // Conversion et optimisation de l'image
      if (enableConversion) {
        try {
          // Log removed
          conversionResult = await ImageConverter.optimizeByType(file, type);
          processedFile = new File([conversionResult.blob], file.name, {
            type: conversionResult.format
          });
          
          // Log removed
        } catch (conversionError) {
          // Warning log removed
          // Continuer avec le fichier original en cas d'erreur de conversion
        }
      }

      // Déterminer le bucket et le nom de fichier
      const { bucket, fileName } = this.getBucketAndFileName(processedFile, type, userId);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Error log removed
        throw new Error(`Erreur upload: ${error.message}`);
      }

      // Obtenir l'URL publique
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        url: publicData.publicUrl,
        path: data.path,
        originalSize: conversionResult?.originalSize || file.size,
        compressedSize: conversionResult?.compressedSize || file.size,
        compressionRatio: conversionResult?.compressionRatio || 0,
        format: conversionResult?.format || file.type
      };

    } catch (error: any) {
      // Error log removed
      return {
        url: '',
        path: '',
        error: error.message || 'Erreur lors de l\'upload'
      };
    }
  }

  /**
   * Supprimer une image de Supabase Storage
   */
  static async deleteImage(path: string, bucket: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        // Error log removed
        return false;
      }

      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Obtenir le bucket et le nom de fichier selon le type
   */
  private static getBucketAndFileName(
    file: File, 
    type: 'avatar' | 'logo' | 'cover' | 'media' | 'product' | 'service',
    userId?: string
  ) {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const baseFileName = `${timestamp}-${Math.random().toString(36).substring(2)}`;

    switch (type) {
      case 'avatar':
        return {
          bucket: 'avatars',
          fileName: `avatar-${baseFileName}.${fileExtension}`
        };
      
      case 'logo':
        return {
          bucket: 'avatars',
          fileName: `logo-${baseFileName}.${fileExtension}`
        };
      
      case 'cover':
        return {
          bucket: 'card-covers',
          fileName: `cover-${baseFileName}.${fileExtension}`
        };
      
      case 'media':
        return {
          bucket: 'media',
          fileName: `media-${baseFileName}.${fileExtension}`
        };
      
      case 'product':
        return {
          bucket: 'products',
          fileName: `product-${baseFileName}.${fileExtension}`
        };
      
      case 'service':
        return {
          bucket: 'media',  // Utiliser bucket media pour les images de services
          fileName: `service-${baseFileName}.${fileExtension}`
        };
      
      default:
        return {
          bucket: 'avatars',
          fileName: `image-${baseFileName}.${fileExtension}`
        };
    }
  }

  /**
   * Valider la taille du fichier
   */
  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Valider le type de fichier
   */
  static validateFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  /**
   * Obtenir l'URL publique d'une image
   */
  static getPublicUrl(path: string, bucket: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Upload une image de service (helper method)
   */
  static async uploadServiceImage(userId: string, file: File): Promise<string> {
    const result = await this.uploadImage(file, 'service', userId, true);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.url;
  }

  /**
   * Supprimer une image en utilisant l'URL complète
   */
  static async deleteImageByUrl(imageUrl: string): Promise<boolean> {
    try {
      // Extraire le path de l'URL
      // Format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
      const urlParts = imageUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        console.error('Format URL invalide');
        return false;
      }
      
      const [bucket, ...pathParts] = urlParts[1].split('/');
      const path = pathParts.join('/');
      
      return await this.deleteImage(path, bucket);
    } catch (error) {
      console.error('Erreur suppression image:', error);
      return false;
    }
  }
}

// Hook pour utiliser le service d'upload
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  const uploadImage = async (
    file: File, 
    type: 'avatar' | 'logo' | 'cover',
    userId?: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadError('');

    try {
      const result = await ImageUploadService.uploadImage(file, type, userId);
      
      if (result.error) {
        setUploadError(result.error);
      }

      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadError,
    clearError: () => setUploadError('')
  };
};
