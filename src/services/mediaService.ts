import { supabase } from '@/integrations/supabase/client';
import { MediaContent, MediaFormData, MediaValidationResult, MediaType, MediaUrlInfo, MEDIA_URL_PATTERNS } from '@/types/media';

class MediaService {
  /**
   * Récupère tous les médias d'une carte
   */
  async getMediaByCardId(cardId: string): Promise<MediaContent[]> {
    try {
      const { data, error } = await supabase
        .from('media_content')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la récupération des médias');
    }
  }

  /**
   * Crée un nouveau média
   */
  async createMedia(media: MediaFormData, cardId: string): Promise<MediaContent> {
    // Log removed
    // Log removed
    // Log removed
    
    try {
      const insertData = {
        card_id: cardId,
        type: media.type,
        title: media.title,
        description: media.description,
        url: media.url,
        thumbnail_url: media.thumbnail_url,
        duration: media.duration,
        order_index: media.order_index || 0,
        is_active: media.is_active ?? true,
        metadata: media.metadata || {}
      };
      
      // Log removed
      
      const { data, error } = await supabase
        .from('media_content')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Error log removed
        throw error;
      }
      
      // Log removed
      return data;
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la création du média');
    }
  }

  /**
   * Met à jour un média existant
   */
  async updateMedia(id: string, media: Partial<MediaFormData>): Promise<MediaContent> {
    try {
      const { data, error } = await supabase
        .from('media_content')
        .update({
          ...media,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la mise à jour du média');
    }
  }

  /**
   * Supprime un média
   */
  async deleteMedia(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('media_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la suppression du média');
    }
  }

  /**
   * Réorganise les médias d'une carte
   */
  async reorderMedia(cardId: string, mediaIds: string[]): Promise<void> {
    try {
      const updates = mediaIds.map((id, index) => ({
        id,
        order_index: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('media_content')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('card_id', cardId);

        if (error) throw error;
      }
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la réorganisation des médias');
    }
  }

  /**
   * Valide une URL de média et extrait les informations
   */
  async validateMediaUrl(url: string, type: MediaType): Promise<MediaValidationResult> {
    // Log removed
    // Log removed
    // Log removed
    
    const errors: string[] = [];
    const warnings: string[] = [];
    let extractedData: any = {};

    try {
      // Vérifier le format de l'URL
      if (!this.isValidUrl(url)) {
        // Log removed
        errors.push('URL invalide');
        return { isValid: false, errors, warnings };
      }

      // Vérifier le pattern spécifique au type
      const pattern = MEDIA_URL_PATTERNS[type];
      // Log removed
      
      if (!pattern) {
        // Log removed
        errors.push(`Type de média non supporté: ${type}`);
        return { isValid: false, errors, warnings };
      }

      const match = url.match(pattern);
      // Log removed
      
      if (!match) {
        // Log removed
        errors.push(`URL ne correspond pas au format ${type}`);
        return { isValid: false, errors, warnings };
      }

      // Extraire les données selon le type
      extractedData = await this.extractMediaData(url, type, match);

      return {
        isValid: true,
        errors: [],
        warnings,
        extractedData
      };
    } catch (error) {
      // Error log removed
      errors.push('Erreur lors de la validation de l\'URL');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Extrait les informations d'un média selon son type
   */
  private async extractMediaData(url: string, type: MediaType, match: RegExpMatchArray): Promise<any> {
    const extractedData: any = {};

    switch (type) {
      case 'youtube':
        extractedData.video_id = match[1];
        extractedData.thumbnail_url = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        break;

      case 'tiktok':
        extractedData.video_id = match[1];
        // TikTok ne fournit pas d'API publique pour les thumbnails
        break;

      case 'vimeo':
        extractedData.video_id = match[1];
        // Vimeo nécessite une API key pour les thumbnails
        break;

      case 'soundcloud':
        // SoundCloud nécessite une API key pour les métadonnées
        break;

      case 'spotify':
        extractedData.track_id = match[1];
        break;

      case 'audio_file':
      case 'video_file':
        // Pour les fichiers, on peut extraire le nom du fichier
        const fileName = url.split('/').pop()?.split('?')[0];
        if (fileName) {
          extractedData.title = fileName;
        }
        break;
    }

    return extractedData;
  }

  /**
   * Vérifie si une URL est valide
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Détecte automatiquement le type de média à partir de l'URL
   */
  detectMediaType(url: string): MediaType | null {
    for (const [type, pattern] of Object.entries(MEDIA_URL_PATTERNS)) {
      if (pattern.test(url)) {
        return type as MediaType;
      }
    }
    return null;
  }

  /**
   * Obtient les informations d'une URL de média
   */
  async getMediaUrlInfo(url: string): Promise<MediaUrlInfo | null> {
    const type = this.detectMediaType(url);
    if (!type) return null;

    const validation = await this.validateMediaUrl(url, type);
    if (!validation.isValid) return null;

    return {
      type,
      id: validation.extractedData?.video_id || (validation.extractedData as any)?.track_id || '',
      isValid: true,
      thumbnail_url: validation.extractedData?.thumbnail_url,
      title: validation.extractedData?.title,
      duration: validation.extractedData?.duration
    };
  }

  /**
   * Met à jour le statut actif d'un média
   */
  async toggleMediaStatus(id: string, isActive: boolean): Promise<MediaContent> {
    try {
      const { data, error } = await supabase
        .from('media_content')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la mise à jour du statut du média');
    }
  }

  /**
   * Récupère les statistiques d'un média
   */
  async getMediaStats(cardId: string): Promise<{
    total: number;
    byType: Record<MediaType, number>;
    totalDuration: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('media_content')
        .select('type, duration')
        .eq('card_id', cardId)
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<MediaType, number>,
        totalDuration: 0
      };

      data?.forEach(media => {
        stats.byType[media.type as MediaType] = (stats.byType[media.type as MediaType] || 0) + 1;
        if (media.duration) {
          stats.totalDuration += media.duration;
        }
      });

      return stats;
    } catch (error) {
      // Error log removed
      throw new Error('Erreur lors de la récupération des statistiques');
    }
  }
}

// Instance singleton
export const mediaService = new MediaService();
export default mediaService;
