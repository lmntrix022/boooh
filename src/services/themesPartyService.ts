import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

export type Party = Tables['party']['Row'];
export type ThemeParty = Tables['themes_party']['Row'];
export type CreatePartyData = Tables['party']['Insert'];
export type UpdatePartyData = Tables['party']['Update'];
export type CreateThemePartyData = Tables['themes_party']['Insert'];
export type UpdateThemePartyData = Tables['themes_party']['Update'];

export interface PartyWithThemes extends Party {
  themes: ThemeParty[];
}

export interface ThemePartyWithParty extends ThemeParty {
  party: Party;
}

export class ThemesPartyService {
  /**
   * Récupère toutes les fêtes avec leurs thèmes
   */
  static async getAllPartiesWithThemes(): Promise<PartyWithThemes[]> {
    try {
      const { data, error } = await supabase
        .from('party')
        .select(`
          *,
          themes:themes_party(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère toutes les fêtes
   */
  static async getAllParties(): Promise<Party[]> {
    try {
      const { data, error } = await supabase
        .from('party')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère tous les thèmes d'une fête
   */
  static async getThemesByPartyId(partyId: string): Promise<ThemeParty[]> {
    try {
      const { data, error } = await supabase
        .from('themes_party')
        .select('*')
        .eq('party_id', partyId)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère tous les thèmes avec leurs fêtes
   */
  static async getAllThemesWithParty(): Promise<ThemePartyWithParty[]> {
    try {
      const { data, error } = await supabase
        .from('themes_party')
        .select(`
          *,
          party:party(*)
        `)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Crée une nouvelle fête
   */
  static async createParty(partyData: CreatePartyData): Promise<Party> {
    try {
      const { data, error } = await supabase
        .from('party')
        .insert(partyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Met à jour une fête
   */
  static async updateParty(id: string, partyData: UpdatePartyData): Promise<Party> {
    try {
      const { data, error } = await supabase
        .from('party')
        .update(partyData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Supprime une fête
   */
  static async deleteParty(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('party')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Crée un nouveau thème
   */
  static async createTheme(themeData: CreateThemePartyData): Promise<ThemeParty> {
    try {
      const { data, error } = await supabase
        .from('themes_party')
        .insert(themeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Met à jour un thème
   */
  static async updateTheme(id: string, themeData: UpdateThemePartyData): Promise<ThemeParty> {
    try {
      const { data, error } = await supabase
        .from('themes_party')
        .update(themeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Supprime un thème
   */
  static async deleteTheme(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('themes_party')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Met à jour l'ordre des thèmes
   */
  static async updateThemeOrder(themeIds: string[]): Promise<void> {
    try {
      const updates = themeIds.map((id, index) => ({
        id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('themes_party')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Upload une image de thème
   */
  static async uploadThemeImage(file: File, themeId: string, type: 'image' | 'preview' = 'image'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt) {
        throw new Error('Extension de fichier invalide');
      }

      const fileName = `${type}-${themeId}-${Date.now()}.${fileExt}`;
      const filePath = `themes/${fileName}`;

      const { data, error } = await supabase.storage
        .from('themes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        // Error log removed
        throw new Error(`Erreur d'upload: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('themes')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Supprime une image de thème
   */
  static async deleteThemeImage(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('themes')
        .remove([filePath]);

      if (error) {
        // Error log removed
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
    } catch (error) {
      // Error log removed
      throw error;
    }
  }
}
