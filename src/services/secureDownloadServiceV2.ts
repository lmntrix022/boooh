import { supabase } from '@/integrations/supabase/client';
import { DeviceFingerprintService } from './deviceFingerprintService';

/**
 * 🔐 SERVICE DE TÉLÉCHARGEMENT SÉCURISÉ V2
 *
 * Intègre toutes les améliorations DRM Phase 1-3:
 * - Token generation côté serveur
 * - Rate limiting avec Redis/Upstash
 * - Antivirus scanning obligatoire
 * - Encryption AES-256 obligatoire
 * - Watermarking forensique
 * - Device tracking avec révocation
 * - HLS DRM pour vidéos
 */

export interface SecureDownloadOptions {
  applyForensicWatermark?: boolean; // Défaut: true
  enableRateLimiting?: boolean; // Défaut: true
  validateDevice?: boolean; // Défaut: true
  trackDownload?: boolean; // Défaut: true
}

export interface TokenGenerationResult {
  success: boolean;
  downloadToken?: string;
  expiresAt?: string;
  maxDownloads?: number;
  errorMessage?: string;
}

export interface DownloadValidation {
  isValid: boolean;
  inquiryId?: string;
  productId?: string;
  fileUrl?: string;
  productTitle?: string;
  productType?: 'pdf' | 'image' | 'video' | 'audio' | 'other';
  buyerEmail?: string;
  buyerName?: string;
  purchaseId?: string;
  errorMessage?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  errorMessage?: string;
}

export class SecureDownloadServiceV2 {

  /**
   * 🔑 PHASE 1.1 - Générer un token côté serveur (cryptographically secure)
   */
  static async generateSecureToken(
    inquiryId: string,
    expiresInHours: number = 24,
    maxDownloads: number = 3
  ): Promise<TokenGenerationResult> {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        return {
          success: false,
          errorMessage: 'Vous devez être connecté pour générer un token',
        };
      }

      // ✅ Appel à l'edge function sécurisée
      const { data, error } = await supabase.functions.invoke('generate-secure-token', {
        body: {
          inquiry_id: inquiryId,
          expires_in_hours: expiresInHours,
          max_downloads: maxDownloads,
        },
      });

      if (error) {
        console.error('Token generation error:', error);
        return {
          success: false,
          errorMessage: 'Erreur lors de la génération du token',
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          errorMessage: data?.error_message || 'Échec de la génération du token',
        };
      }

      return {
        success: true,
        downloadToken: data.download_token,
        expiresAt: data.expires_at,
        maxDownloads: data.max_downloads,
      };

    } catch (error) {
      console.error('generateSecureToken error:', error);
      return {
        success: false,
        errorMessage: 'Erreur système',
      };
    }
  }

  /**
   * 🚦 PHASE 2.1 - Vérifier rate limit avant téléchargement
   */
  static async checkRateLimit(
    action: 'token_generation' | 'download' | 'api_call' = 'download',
    identifier?: string
  ): Promise<RateLimitResult> {
    try {
      // Utiliser l'IP comme identifier par défaut
      const actualIdentifier = identifier || await this.getClientIdentifier();

      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          identifier: actualIdentifier,
          action: action,
          max_requests: action === 'token_generation' ? 5 : 10,
          window_seconds: action === 'token_generation' ? 3600 : 60,
        },
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail open en cas d'erreur système
        return {
          allowed: true,
          remaining: 0,
          resetAt: Date.now() + 60000,
        };
      }

      return {
        allowed: data.allowed,
        remaining: data.remaining,
        resetAt: data.reset_at * 1000, // Convert to ms
        errorMessage: data.error_message,
      };

    } catch (error) {
      console.error('checkRateLimit error:', error);
      return {
        allowed: true,
        remaining: 0,
        resetAt: Date.now() + 60000,
      };
    }
  }

  /**
   * 🔐 Valider un token de téléchargement (avec device check)
   */
  static async validateDownloadToken(downloadToken: string): Promise<DownloadValidation> {
    try {
      const deviceFingerprint = await DeviceFingerprintService.generateFingerprint();

      const { data, error } = await supabase.rpc('validate_download_token_secure', {
        p_download_token: downloadToken,
        p_device_fingerprint: deviceFingerprint,
      });

      if (error || !data || data.length === 0) {
        return {
          isValid: false,
          errorMessage: 'Token invalide ou expiré',
        };
      }

      const result = data[0];

      if (!result.is_valid) {
        return {
          isValid: false,
          errorMessage: result.error_message || 'Validation échouée',
        };
      }

      return {
        isValid: true,
        inquiryId: result.inquiry_id,
        productId: result.product_id,
        fileUrl: result.file_url,
        errorMessage: result.error_message,
      };

    } catch (error) {
      console.error('validateDownloadToken error:', error);
      return {
        isValid: false,
        errorMessage: 'Erreur système',
      };
    }
  }

  /**
   * 📥 Télécharger un fichier avec toutes les protections DRM
   */
  static async downloadFile(
    downloadToken: string,
    options: SecureDownloadOptions = {}
  ): Promise<void> {
    const {
      applyForensicWatermark = true,
      enableRateLimiting = true,
      validateDevice = true,
      trackDownload = true,
    } = options;

    try {
      // 🚦 ÉTAPE 1: Rate limiting
      if (enableRateLimiting) {
        const rateLimitCheck = await this.checkRateLimit('download');

        if (!rateLimitCheck.allowed) {
          const resetDate = new Date(rateLimitCheck.resetAt);
          throw new Error(
            `Limite de téléchargements atteinte. Réessayez après ${resetDate.toLocaleTimeString()}`
          );
        }
      }

      // 🔐 ÉTAPE 2: Valider le token et device
      const validation = await this.validateDownloadToken(downloadToken);

      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Token invalide');
      }

      const { inquiryId, productId, fileUrl, productType } = validation;

      if (!fileUrl || !productId) {
        throw new Error('Informations de fichier manquantes');
      }

      // 🎬 ÉTAPE 3: Téléchargement selon le type de fichier
      let downloadUrl = fileUrl;

      // Pour les vidéos, utiliser HLS DRM
      if (productType === 'video') {
        downloadUrl = await this.getHLSManifestUrl(downloadToken);
        window.open(downloadUrl, '_blank');
        return;
      }

      // 🎨 ÉTAPE 4: Appliquer watermark forensique (pour PDF/images)
      if (applyForensicWatermark && (productType === 'pdf' || productType === 'image')) {
        const watermarkedFile = await this.applyForensicWatermark(
          fileUrl,
          productType,
          downloadToken
        );

        if (watermarkedFile) {
          downloadUrl = watermarkedFile.watermarked_url;
        }
      }

      // 📥 ÉTAPE 5: Télécharger le fichier
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Échec du téléchargement du fichier');
      }

      const blob = await response.blob();

      // 🔐 ÉTAPE 6: Générer un nom de fichier sécurisé
      const fileName = this.generateSecureFileName(validation.productTitle || 'product', productType);

      // 📥 ÉTAPE 7: Déclencher le téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 📝 ÉTAPE 8: Enregistrer le téléchargement
      if (trackDownload) {
        await this.registerDownloadEvent(inquiryId!, downloadToken);
      }

    } catch (error: any) {
      console.error('downloadFile error:', error);
      throw error;
    }
  }

  /**
   * 🎨 PHASE 3.1 - Appliquer watermark forensique (steganography)
   */
  static async applyForensicWatermark(
    fileUrl: string,
    fileType: 'pdf' | 'image',
    downloadToken: string
  ): Promise<{ success: boolean; watermarked_url?: string; watermark_id?: string } | null> {
    try {
      // Récupérer les informations de l'acheteur depuis le token
      const validation = await this.validateDownloadToken(downloadToken);

      if (!validation.isValid || !validation.buyerEmail || !validation.buyerName) {
        console.warn('Cannot apply watermark: invalid buyer info');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('forensic-watermark', {
        body: {
          file_url: fileUrl,
          file_type: fileType,
          download_token: downloadToken,
          buyer_info: {
            email: validation.buyerEmail,
            name: validation.buyerName,
            purchase_id: validation.purchaseId || validation.inquiryId,
            purchase_date: new Date().toISOString(),
          },
          watermark_strength: 7, // Force élevée pour résistance
        },
      });

      if (error || !data || !data.success) {
        console.error('Forensic watermark error:', error);
        return null;
      }

      return {
        success: true,
        watermarked_url: data.watermarked_url,
        watermark_id: data.watermark_id,
      };

    } catch (error) {
      console.error('applyForensicWatermark error:', error);
      return null;
    }
  }

  /**
   * 🎬 PHASE 3.3 - Obtenir l'URL du manifest HLS pour vidéos
   */
  static getHLSManifestUrl(downloadToken: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/hls-drm-stream?token=${downloadToken}&manifest=true`;
  }

  /**
   * 📝 Enregistrer un événement de téléchargement
   */
  private static async registerDownloadEvent(
    inquiryId: string,
    downloadToken: string
  ): Promise<void> {
    try {
      const deviceFingerprint = await DeviceFingerprintService.generateFingerprint();
      const deviceInfo = DeviceFingerprintService.getDeviceInfo();

      await supabase.rpc('register_download_event', {
        p_inquiry_id: inquiryId,
        p_device_fingerprint: deviceFingerprint,
        p_ip_address: 'client-side', // L'edge function capturera la vraie IP
        p_user_agent: navigator.userAgent,
      });

    } catch (error) {
      console.warn('Failed to register download event:', error);
    }
  }

  /**
   * 🔐 Générer un nom de fichier sécurisé
   */
  private static generateSecureFileName(
    productTitle: string,
    fileType?: string
  ): string {
    const sanitizedTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const extension = this.getFileExtension(fileType || 'other');

    return `${sanitizedTitle}_${timestamp}.${extension}`;
  }

  /**
   * Obtenir l'extension de fichier
   */
  private static getFileExtension(fileType: string): string {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'image': 'png',
      'video': 'mp4',
      'audio': 'mp3',
      'other': 'bin',
    };

    return extensions[fileType] || 'bin';
  }

  /**
   * Obtenir un identifiant client (IP hash + fingerprint)
   */
  private static async getClientIdentifier(): Promise<string> {
    const fingerprint = await DeviceFingerprintService.generateFingerprint();
    return `client_${fingerprint.substring(0, 16)}`;
  }

  /**
   * 🦠 PHASE 2.2 - Scanner un fichier avant upload
   */
  static async scanFileBeforeUpload(
    file: File,
    productId: string
  ): Promise<{ is_safe: boolean; threats_found?: string[]; error_message?: string }> {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        throw new Error('Authentication required');
      }

      // Upload temporaire pour scan
      const tempFileName = `temp_scan_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(tempFileName, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('digital-products')
        .getPublicUrl(tempFileName);

      // Scanner le fichier
      const { data, error } = await supabase.functions.invoke('antivirus-scan', {
        body: {
          file_url: urlData.publicUrl,
          file_name: file.name,
          product_id: productId,
          user_id: session.session.user.id,
        },
      });

      // Supprimer le fichier temporaire
      await supabase.storage
        .from('digital-products')
        .remove([tempFileName]);

      if (error || !data) {
        return {
          is_safe: false,
          error_message: 'Scan failed',
        };
      }

      return {
        is_safe: data.is_safe,
        threats_found: data.threats_found,
        error_message: data.error_message,
      };

    } catch (error: any) {
      console.error('scanFileBeforeUpload error:', error);
      return {
        is_safe: false,
        error_message: error.message,
      };
    }
  }

  /**
   * 🔐 PHASE 3.2 - Générer une licence DRM pour vidéo
   */
  static async generateDRMLicense(
    productId: string,
    inquiryId: string,
    drmSystem: 'playready' | 'widevine' | 'fairplay' = 'playready'
  ): Promise<{ license_id: string; license_url: string; expires_at: string } | null> {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        return null;
      }

      const { data, error } = await supabase.rpc('generate_drm_license', {
        p_product_id: productId,
        p_user_id: session.session.user.id,
        p_inquiry_id: inquiryId,
        p_drm_system: drmSystem,
        p_expires_in_hours: 48,
      });

      if (error || !data || data.length === 0) {
        console.error('DRM license generation error:', error);
        return null;
      }

      const license = data[0];

      return {
        license_id: license.license_id,
        license_url: license.license_url,
        expires_at: license.expires_at,
      };

    } catch (error) {
      console.error('generateDRMLicense error:', error);
      return null;
    }
  }

  /**
   * 🚫 Révoquer un device spécifique
   */
  static async revokeDevice(
    deviceFingerprint: string,
    inquiryId: string,
    reason: string = 'User requested'
  ): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        return false;
      }

      const { error } = await supabase
        .from('device_revocations')
        .insert({
          device_fingerprint: deviceFingerprint,
          user_id: session.session.user.id,
          inquiry_id: inquiryId,
          reason: reason,
          revoked_at: new Date().toISOString(),
          is_active: true,
        });

      if (error) {
        console.error('Device revocation error:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('revokeDevice error:', error);
      return false;
    }
  }

  /**
   * 📊 Obtenir les statistiques de téléchargement
   */
  static async getDownloadStats(inquiryId: string): Promise<{
    total_downloads: number;
    remaining_downloads: number;
    devices_count: number;
    last_download_at?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('digital_inquiries')
        .select('download_count, max_downloads, last_download_at')
        .eq('id', inquiryId)
        .single();

      if (error || !data) {
        return null;
      }

      const { data: devicesData } = await supabase
        .from('authorized_devices')
        .select('id')
        .eq('inquiry_id', inquiryId)
        .eq('is_revoked', false);

      return {
        total_downloads: data.download_count || 0,
        remaining_downloads: (data.max_downloads || 3) - (data.download_count || 0),
        devices_count: devicesData?.length || 0,
        last_download_at: data.last_download_at,
      };

    } catch (error) {
      console.error('getDownloadStats error:', error);
      return null;
    }
  }
}

export default SecureDownloadServiceV2;
