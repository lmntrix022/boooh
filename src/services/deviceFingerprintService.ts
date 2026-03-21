/**
 * Service de fingerprinting d'appareil
 * Génère un identifiant unique pour chaque appareil
 * Utilisé pour limiter les téléchargements à des appareils spécifiques
 */
export class DeviceFingerprintService {
  
  /**
   * Génère un fingerprint unique pour l'appareil actuel
   * Combine plusieurs caractéristiques du navigateur/appareil
   */
  static async generateFingerprint(): Promise<string> {
    const components: string[] = [];

    // 1. User Agent
    components.push(navigator.userAgent);

    // 2. Langue
    components.push(navigator.language);

    // 3. Fuseau horaire
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // 4. Résolution d'écran
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // 5. Platform
    components.push(navigator.platform);

    // 6. Hardware Concurrency (nombre de processeurs)
    components.push(String(navigator.hardwareConcurrency || 'unknown'));

    // 7. Device Memory (si disponible)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory) {
      components.push(String(deviceMemory));
    }

    // 8. Canvas Fingerprint (technique avancée)
    try {
      const canvasFingerprint = await this.getCanvasFingerprint();
      components.push(canvasFingerprint);
    } catch (error) {
      // Warning log removed
    }

    // 9. WebGL Fingerprint
    try {
      const webglFingerprint = this.getWebGLFingerprint();
      components.push(webglFingerprint);
    } catch (error) {
      // Warning log removed
    }

    // Combiner tous les composants
    const fingerprint = components.join('|');

    // Créer un hash SHA-256
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(fingerprint)
    );

    // Convertir en string hexadécimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  /**
   * Génère un fingerprint basé sur Canvas
   * Technique courante de device fingerprinting
   */
  private static async getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas non supporté');
    }

    // Dessiner du texte avec différentes polices
    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Booh DRM 🔐', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Booh DRM 🔐', 4, 17);

    // Convertir en dataURL
    const dataUrl = canvas.toDataURL();

    // Hasher le dataURL
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(dataUrl)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Génère un fingerprint basé sur WebGL
   */
  private static getWebGLFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

    if (!gl) {
      throw new Error('WebGL non supporté');
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'unknown';
    const vendor = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : 'unknown';

    return `${vendor}|${renderer}`;
  }

  /**
   * Enregistre un fingerprint d'appareil pour un achat
   */
  static async registerDevice(
    purchaseId: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('device_registrations')
        .insert({
          purchase_id: purchaseId,
          device_fingerprint: deviceFingerprint,
          registered_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        });

      if (error) {
        // Error log removed
        return false;
      }

      // Log removed
      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Valide qu'un appareil est autorisé à télécharger
   */
  static async validateDevice(
    purchaseId: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { data, error } = await supabase
        .from('device_registrations')
        .select('*')
        .eq('purchase_id', purchaseId)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (error || !data) {
        // Warning log removed
        return false;
      }

      // Log removed
      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Récupère les informations de l'appareil actuel
   */
  static getDeviceInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenResolution: string;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
    };
  }

  /**
   * Vérifie si le fingerprinting est supporté par le navigateur
   */
  static isSupported(): boolean {
    return !!(
      crypto?.subtle &&
      window.TextEncoder &&
      document.createElement('canvas').getContext('2d')
    );
  }
}

export default DeviceFingerprintService;





















