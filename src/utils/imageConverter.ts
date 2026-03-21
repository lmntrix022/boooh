/**
 * Service de conversion et d'optimisation d'images côté client
 * Convertit les images en formats modernes (WebP, AVIF) avec compression
 */

export interface ImageConversionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface ConversionResult {
  blob: Blob;
  url: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

export class ImageConverter {
  /**
   * Convertir une image avec compression et redimensionnement
   */
  static async convertImage(
    file: File,
    options: ImageConversionOptions = {}
  ): Promise<ConversionResult> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp',
      maintainAspectRatio = true
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculer les nouvelles dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight,
            maintainAspectRatio
          );

          // Configurer le canvas
          canvas.width = width;
          canvas.height = height;

          // Dessiner l'image redimensionnée
          ctx?.drawImage(img, 0, 0, width, height);

          // Convertir en blob avec le format souhaité
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erreur lors de la conversion'));
                return;
              }

              const url = URL.createObjectURL(blob);
              const compressionRatio = ((file.size - blob.size) / file.size) * 100;

              resolve({
                blob,
                url,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio,
                format: blob.type
              });
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convertir en WebP avec qualité optimisée
   */
  static async convertToWebP(
    file: File,
    quality: number = 0.8
  ): Promise<ConversionResult> {
    return this.convertImage(file, { format: 'webp', quality });
  }

  /**
   * Convertir en AVIF (format le plus moderne)
   */
  static async convertToAVIF(
    file: File,
    quality: number = 0.8
  ): Promise<ConversionResult> {
    return this.convertImage(file, { format: 'avif', quality });
  }

  /**
   * Redimensionner une image
   */
  static async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<ConversionResult> {
    return this.convertImage(file, {
      maxWidth,
      maxHeight,
      quality,
      format: 'webp'
    });
  }

  /**
   * Créer une version thumbnail
   */
  static async createThumbnail(
    file: File,
    size: number = 200,
    quality: number = 0.7
  ): Promise<ConversionResult> {
    return this.convertImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'webp'
    });
  }

  /**
   * Calculer les dimensions optimales
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Vérifier le support des formats modernes
   */
  static async checkFormatSupport(): Promise<{
    webp: boolean;
    avif: boolean;
  }> {
    const webpSupported = await this.checkWebPSupport();
    const avifSupported = await this.checkAVIFSupport();

    return { webp: webpSupported, avif: avifSupported };
  }

  /**
   * Vérifier le support WebP
   */
  private static checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Vérifier le support AVIF
   */
  private static checkAVIFSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEAwgMgk8AAAAB3d0cHQAAAAAAAAAAQAAAAEAAAAU';
    });
  }

  /**
   * Obtenir le meilleur format supporté
   */
  static async getBestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    const support = await this.checkFormatSupport();
    
    if (support.avif) return 'avif';
    if (support.webp) return 'webp';
    return 'jpeg';
  }

  /**
   * Optimiser une image selon son type
   */
  static async optimizeByType(
    file: File,
    type: 'avatar' | 'logo' | 'cover' | 'product' | 'media'
  ): Promise<ConversionResult> {
    const configs = {
      avatar: { maxWidth: 512, maxHeight: 512, quality: 0.8 },
      logo: { maxWidth: 256, maxHeight: 256, quality: 0.9 },
      cover: { maxWidth: 1920, maxHeight: 1080, quality: 0.85 },
      product: { maxWidth: 800, maxHeight: 800, quality: 0.8 },
      media: { maxWidth: 1280, maxHeight: 720, quality: 0.8 }
    };

    const config = configs[type];
    const bestFormat = await this.getBestFormat();

    return this.convertImage(file, {
      ...config,
      format: bestFormat
    });
  }
}
