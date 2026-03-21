import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import {
    PortfolioSettings
} from './types';

export class PortfolioSettingsService {
    /**
     * Obtenir les paramètres du portfolio d'un utilisateur
     */
    static async getSettings(userId: string): Promise<PortfolioSettings | null> {
        try {
            const { data, error } = await supabase
                .from('portfolio_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                return null;
            }

            return data as PortfolioSettings | null;
        } catch {
            return null;
        }
    }

    /**
     * Obtenir les paramètres par carte (vue publique)
     */
    static async getCardSettings(cardId: string): Promise<PortfolioSettings | null> {
        try {
            const { data, error } = await supabase
                .from('portfolio_settings')
                .select('*')
                .eq('card_id', cardId)
                .maybeSingle();

            if (error) {
                return null;
            }

            return data as PortfolioSettings | null;
        } catch {
            return null;
        }
    }

    /**
     * Créer des paramètres
     */
    static async createSettings(
        userId: string,
        cardId: string,
        data: Partial<Database['public']['Tables']['portfolio_settings']['Insert']>
    ): Promise<PortfolioSettings> {
        const { data: settings, error } = await supabase
            .from('portfolio_settings')
            .insert({
                user_id: userId,
                card_id: cardId,
                ...data
            })
            .select()
            .single();

        if (error) throw error;
        return settings as PortfolioSettings;
    }

    /**
     * Mettre à jour les paramètres
     */
    static async updateSettings(
        id: string,
        data: Partial<Database['public']['Tables']['portfolio_settings']['Update']>
    ): Promise<PortfolioSettings> {
        const { data: settings, error } = await supabase
            .from('portfolio_settings')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return settings as PortfolioSettings;
    }

    /**
     * Créer ou mettre à jour les paramètres
     */
    static async upsertSettings(
        userId: string,
        data: Partial<Database['public']['Tables']['portfolio_settings']['Insert']>
    ): Promise<PortfolioSettings> {
        if (!data.card_id) {
            throw new Error('card_id is required for portfolio settings');
        }

        const { data: settings, error } = await supabase
            .from('portfolio_settings')
            .upsert({
                user_id: userId,
                card_id: data.card_id,
                ...data
            }, {
                onConflict: 'user_id,card_id'
            })
            .select()
            .single();

        if (error) throw error;
        return settings as PortfolioSettings;
    }
}
