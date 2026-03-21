import { supabase } from '@/integrations/supabase/client';

export interface WatermarkMetadata {
  email: string;
  name: string;
  purchaseDate?: string;
  productId?: string;
}

export interface WatermarkOptions {
  opacity?: number;
  fontSize?: number;
  position?: 'footer' | 'header' | 'diagonal';
}

/**
 * Service de watermarking pour produits numériques
 * Applique des watermarks personnalisés sur les fichiers téléchargés
 */
export class WatermarkService {
  
  /**
   * Applique un watermark sur un fichier PDF
   * Utilise l'Edge Function apply-watermark-pdf
   */
  static async watermarkPDF(
    fileUrl: string,
    buyerInfo: WatermarkMetadata,
    options?: WatermarkOptions
  ): Promise<Blob> {
    try {
      // Log removed

      const { data, error } = await supabase.functions.invoke(
        'apply-watermark-pdf',
        {
          body: {
            fileUrl,
            buyerInfo,
            watermarkOptions: options,
          },
        }
      );

      if (error) {
        // Error log removed
        throw new Error('Impossible d\'appliquer le watermark PDF');
      }

      // La réponse est le PDF watermarké en bytes
      return new Blob([data], { type: 'application/pdf' });
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Applique des métadonnées copyright sur un fichier audio
   * Utilise l'Edge Function apply-audio-metadata
   */
  static async watermarkAudio(
    fileUrl: string,
    buyerInfo: WatermarkMetadata,
    productInfo?: { title?: string; artist?: string; album?: string }
  ): Promise<Blob> {
    try {
      // Log removed

      const { data, error } = await supabase.functions.invoke(
        'apply-audio-metadata',
        {
          body: {
            fileUrl,
            buyerInfo,
            productInfo,
          },
        }
      );

      if (error) {
        // Error log removed
        throw new Error('Impossible d\'appliquer les métadonnées audio');
      }

      // La réponse est le fichier audio avec métadonnées
      return new Blob([data], { type: 'audio/mpeg' });
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Applique un watermark sur une image
   * Utilise Canvas API côté client
   */
  static async watermarkImage(
    file: Blob,
    watermarkText: string,
    options?: WatermarkOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas non supporté'));
          return;
        }

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          // Dessiner l'image originale
          ctx.drawImage(img, 0, 0);

          // Configurer le watermark
          const fontSize = options?.fontSize || 20;
          const opacity = options?.opacity || 0.3;
          
          ctx.globalAlpha = opacity;
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'center';

          // Position du watermark
          const x = canvas.width / 2;
          const y = canvas.height - 40;

          // Ajouter le watermark
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);

          // Convertir en blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erreur conversion blob'));
              }
            },
            'image/png',
            0.95
          );
        };

        img.onerror = () => reject(new Error('Erreur chargement image'));
        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Détermine si le watermarking doit être appliqué
   * basé sur le type de fichier et l'abonnement
   */
  static shouldApplyWatermark(
    fileType: string,
    subscriptionPlan: string
  ): boolean {
    // Watermarking uniquement pour le plan MAGIC
    if (subscriptionPlan !== 'pack_createur' && subscriptionPlan !== 'magic') {
      return false;
    }

    // Types de fichiers supportés
    const supportedTypes = [
      'application/pdf',
      'audio/mpeg',
      'audio/mp3',
      'image/jpeg',
      'image/png',
    ];

    return supportedTypes.includes(fileType);
  }

  /**
   * Applique le watermark approprié selon le type de fichier
   */
  static async applyWatermark(
    fileUrl: string,
    fileType: string,
    buyerInfo: WatermarkMetadata,
    options?: WatermarkOptions
  ): Promise<Blob> {
    // Log removed

    // PDF
    if (fileType === 'application/pdf') {
      return await this.watermarkPDF(fileUrl, buyerInfo, options);
    }

    // Audio (MP3)
    if (fileType === 'audio/mpeg' || fileType === 'audio/mp3') {
      return await this.watermarkAudio(fileUrl, buyerInfo);
    }

    // Image (watermarking côté client)
    if (fileType.startsWith('image/')) {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const watermarkText = `© ${buyerInfo.name} - ${buyerInfo.email}`;
      return await this.watermarkImage(blob, watermarkText, options);
    }

    // Type non supporté - retourner le fichier original
    // Warning log removed
    const response = await fetch(fileUrl);
    return await response.blob();
  }

  /**
   * Télécharge un fichier avec watermark appliqué
   */
  static async downloadWithWatermark(
    fileUrl: string,
    fileName: string,
    fileType: string,
    buyerInfo: WatermarkMetadata,
    applyWatermark: boolean = true
  ): Promise<void> {
    try {
      let blob: Blob;

      if (applyWatermark && this.shouldApplyWatermark(fileType, 'magic')) {
        // Appliquer le watermark
        blob = await this.applyWatermark(fileUrl, fileType, buyerInfo);
        // Log removed
      } else {
        // Télécharger sans watermark
        const response = await fetch(fileUrl);
        blob = await response.blob();
        // Log removed
      }

      // Créer le lien de téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log removed
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Génère un lien de téléchargement sécurisé avec watermark
   * Pour usage dans les emails ou interfaces
   */
  static generateSecureDownloadLink(
    downloadToken: string,
    productId: string
  ): string {
    // Le lien pointe vers une route qui validera le token
    // et appliquera le watermark avant le téléchargement
    const baseUrl = window.location.origin;
    return `${baseUrl}/download/${downloadToken}?product=${productId}`;
  }
}

export default WatermarkService;





















