import { supabase } from '@/integrations/supabase/client';
import { WatermarkService, WatermarkMetadata } from './watermarkService';
import { DeviceFingerprintService } from './deviceFingerprintService';

export interface DownloadOptions {
  applyWatermark?: boolean;
  applyEncryption?: boolean;
  validateDevice?: boolean;
  trackDownload?: boolean;
}

export interface DownloadValidation {
  isValid: boolean;
  fileUrl?: string;
  productTitle?: string;
  productType?: string;
  buyerEmail?: string;
  buyerName?: string;
  errorMessage?: string;
}

/**
 * Service de téléchargement sécurisé avec DRM et Watermarking
 * Gère le téléchargement des produits numériques avec toutes les protections
 */
export class SecureDownloadService {

  /**
   * Valide un token de téléchargement et récupère les informations
   */
  static async validateDownloadToken(downloadToken: string): Promise<DownloadValidation> {
    try {
      // 🔧 CORRECTION : Utiliser l'Edge Function corrigée au lieu de la fonction RPC
      const { data, error } = await supabase.functions.invoke('validate-download-fixed', {
        body: { download_token: downloadToken }
      });

      if (error) {
        console.error('Error calling validate-download-fixed:', error);
        return {
          isValid: false,
          errorMessage: 'Erreur lors de la validation du token',
        };
      }

      if (!data || !data.is_valid) {
        return {
          isValid: false,
          errorMessage: data?.error_message || 'Token invalide ou expiré',
        };
      }

      return {
        isValid: true,
        fileUrl: data.file_url,
        productTitle: data.product_title,
        buyerEmail: data.buyer_email,
        buyerName: data.buyer_name,
      };

    } catch (error) {
      console.error('Error in validateDownloadToken:', error);
      return {
        isValid: false,
        errorMessage: 'Erreur système',
      };
    }
  }

  /**
   * Vérifie si l'utilisateur a le watermarking activé
   * Basé sur son abonnement
   */
  static async hasWatermarkingEnabled(cardId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('business_cards')
        .select('subscription_plan')
        .eq('id', cardId)
        .single();

      // Watermarking actif uniquement pour MAGIC et PACK_CREATEUR
      const plan = data?.subscription_plan || 'free';
      return plan === 'magic' || plan === 'pack_createur';
    } catch (error) {
      // Warning log removed
      return false;
    }
  }

  /**
   * Télécharge un fichier avec toutes les protections appliquées
   */
  static async downloadFile(
    downloadToken: string,
    options: DownloadOptions = {}
  ): Promise<void> {
    const {
      applyWatermark = true,
      applyEncryption = false,
      validateDevice = true,
      trackDownload = true,
    } = options;

    try {
      // 1. Valider le token
      const validation = await this.validateDownloadToken(downloadToken);

      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Token invalide');
      }

      // Log removed

      // 2. Valider l'appareil (si activé)
      if (validateDevice) {
        const deviceFingerprint = await DeviceFingerprintService.generateFingerprint();
        // Log removed
        
        // Pour l'instant, on enregistre l'appareil
        // Dans une implémentation stricte, on vérifierait qu'il est déjà enregistré
        await DeviceFingerprintService.registerDevice(downloadToken, deviceFingerprint);
      }

      // 3. Déterminer le type de fichier
      const fileUrl = validation.fileUrl!;
      const fileType = this.getFileType(fileUrl);
      
      // Log removed

      // 4. Appliquer le watermark si nécessaire
      let fileBlob: Blob;

      if (applyWatermark && validation.buyerEmail && validation.buyerName) {
        const watermarkMetadata: WatermarkMetadata = {
          email: validation.buyerEmail,
          name: validation.buyerName,
          purchaseDate: new Date().toISOString(),
          productId: validation.productTitle,
        };

        // Log removed
        fileBlob = await WatermarkService.applyWatermark(
          fileUrl,
          fileType,
          watermarkMetadata
        );
        // Log removed
      } else {
        // Télécharger sans watermark
        // Log removed
        const response = await fetch(fileUrl);
        fileBlob = await response.blob();
      }

      // 5. Appliquer l'encryption si demandé
      if (applyEncryption) {
        // Log removed
        // L'encryption serait appliquée côté serveur et stockée
        // Le déchiffrement se ferait lors de la lecture
      }

      // 6. Générer un nom de fichier sécurisé
      const fileName = this.generateSecureFileName(
        validation.productTitle || 'product',
        fileType,
        validation.buyerName
      );

      // 7. Déclencher le téléchargement
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log removed

      // 8. Tracker le téléchargement (analytics)
      if (trackDownload) {
        await this.trackDownload(downloadToken, fileType);
      }

    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Détermine le type MIME d'un fichier basé sur son URL
   */
  private static getFileType(fileUrl: string): string {
    const extension = fileUrl.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'epub': 'application/epub+zip',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Génère un nom de fichier sécurisé avec métadonnées
   */
  private static generateSecureFileName(
    productTitle: string,
    fileType: string,
    buyerName?: string
  ): string {
    const sanitizedTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = this.getFileExtension(fileType);
    const timestamp = Date.now();
    const buyerPrefix = buyerName 
      ? buyerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10) + '_'
      : '';

    return `${buyerPrefix}${sanitizedTitle}_${timestamp}.${extension}`;
  }

  /**
   * Obtient l'extension de fichier depuis le type MIME
   */
  private static getFileExtension(fileType: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': 'pdf',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/epub+zip': 'epub',
    };

    return extensions[fileType] || 'bin';
  }

  /**
   * Enregistre le téléchargement pour analytics
   */
  private static async trackDownload(
    downloadToken: string,
    fileType: string
  ): Promise<void> {
    try {
      const deviceInfo = DeviceFingerprintService.getDeviceInfo();

      await supabase
        .from('digital_downloads')
        .insert({
          download_token: downloadToken,
          file_type: fileType,
          device_info: deviceInfo,
          downloaded_at: new Date().toISOString(),
        });

      // Log removed
    } catch (error) {
      // Warning log removed
    }
  }

  /**
   * Génère un lien de streaming HLS sécurisé pour les vidéos
   */
  static generateHLSStreamUrl(
    downloadToken: string,
    productId: string
  ): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/hls-stream?token=${downloadToken}&manifest=true`;
  }
}

export default SecureDownloadService;


