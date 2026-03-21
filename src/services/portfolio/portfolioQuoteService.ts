import { supabase } from '@/integrations/supabase/client';
import {
    ServiceQuote,
    CreateQuoteData,
    UpdateQuoteData,
    QuoteStatus,
    QuotePriority
} from './types';

export interface QuoteWithItems {
    quote: ServiceQuote & { quote_number?: string; public_token?: string; valid_until?: string | null };
    items: Array<{
        id: string;
        title: string;
        description?: string;
        quantity: number;
        unit_price: number;
        unit?: string;
        vat_rate?: number;
        total_ht?: number;
    }>;
    card?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        company?: string;
        company_logo_url?: string;
    };
    company?: {
        company_name?: string;
        company_siret?: string;
        company_address?: string;
        company_phone?: string;
        company_email?: string;
        company_website?: string;
        logo_url?: string;
    };
    brandColor?: string;
}

export class PortfolioQuoteService {
    /**
     * Créer une nouvelle demande de devis
     */
    static async createQuote(userId: string, data: Partial<CreateQuoteData>): Promise<ServiceQuote> {
        let publicToken: string;
        try {
            const { data: tokenData } = await supabase.rpc('generate_quote_public_token' as any);
            publicToken = tokenData || '';
        } catch { publicToken = ''; }
        if (!publicToken) publicToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        const { data: quote, error } = await supabase
            .from('service_quotes')
            .insert({
                user_id: userId,
                client_name: data.client_name || '',
                client_email: data.client_email || '',
                service_requested: data.service_requested || '',
                ...data,
                status: 'new',
                priority: 'normal',
                public_token: publicToken
            })
            .select()
            .single();

        if (error) throw error;

        // Générer quote_number via RPC (si migration appliquée)
        try {
            const { data: qn } = await supabase.rpc('get_next_quote_number', { p_user_id: userId });
            if (qn) {
                await supabase.from('service_quotes').update({ quote_number: qn }).eq('id', (quote as ServiceQuote).id);
                (quote as ServiceQuote & { quote_number?: string }).quote_number = qn;
            }
        } catch { /* RPC peut ne pas exister avant migration */ }
        return quote as ServiceQuote;
    }

    /**
     * Créer une demande de devis publique (par un visiteur)
     */
    static async createPublicQuote(userId: string, data: Partial<CreateQuoteData>): Promise<ServiceQuote> {
        return this.createQuote(userId, data);
    }

    /**
     * Obtenir tous les devis d'un utilisateur avec pagination
     */
    static async getUserQuotes(
        userId: string,
        options: {
            status?: QuoteStatus;
            priority?: QuotePriority;
            limit?: number;
            offset?: number;
            searchTerm?: string;
        } = {}
    ): Promise<{
        quotes: ServiceQuote[];
        total: number;
        hasMore: boolean;
    }> {
        const { status, priority, limit = 20, offset = 0, searchTerm } = options;

        let query = supabase
            .from('service_quotes')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (priority) {
            query = query.eq('priority', priority);
        }

        if (searchTerm) {
            query = query.or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,service_requested.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            quotes: (data || []) as ServiceQuote[],
            total: count || 0,
            hasMore: (offset + limit) < (count || 0)
        };
    }

    /**
     * Mettre à jour un devis
     */
    static async updateQuote(quoteId: string, data: UpdateQuoteData): Promise<ServiceQuote> {
        const { data: quote, error } = await supabase
            .from('service_quotes')
            .update(data)
            .eq('id', quoteId)
            .select()
            .single();

        if (error) throw error;
        return quote as ServiceQuote;
    }

    /**
     * Supprimer un devis
     */
    static async deleteQuote(quoteId: string): Promise<void> {
        const { error } = await supabase
            .from('service_quotes')
            .delete()
            .eq('id', quoteId);

        if (error) throw error;
    }

    /**
     * Récupérer un devis par token public (pour page client, anon)
     */
    static async getQuoteByPublicToken(token: string): Promise<QuoteWithItems | null> {
        const { data, error } = await supabase.rpc('get_quote_by_public_token', { p_token: token });
        if (error || !data) return null;
        return data as QuoteWithItems;
    }

    /**
     * Récupérer les lignes d'un devis
     */
    static async getQuoteItems(quoteId: string): Promise<Array<{ id: string; title: string; description?: string; quantity: number; unit_price: number; unit?: string; vat_rate?: number; order_index: number }>> {
        const { data, error } = await supabase
            .from('quote_items')
            .select('id, title, description, quantity, unit_price, unit, vat_rate, order_index')
            .eq('quote_id', quoteId)
            .order('order_index')
            .order('created_at');
        if (error) throw error;
        return (data || []).map((r: any) => ({
            id: r.id,
            title: r.title || '',
            description: r.description || undefined,
            quantity: Number(r.quantity) || 1,
            unit_price: Number(r.unit_price) || 0,
            unit: r.unit || 'unité',
            vat_rate: Number(r.vat_rate) || 0,
            order_index: r.order_index ?? 0,
        }));
    }

    /**
     * Appliquer un template à un devis (Phase 2)
     * Crée les quote_items et met à jour quote_amount.
     * Si product_id/card_id sont fournis (ligne issue du catalogue), ils sont enregistrés pour déduction stock à la facture payée.
     */
    static async applyTemplateToQuote(
        quoteId: string,
        templateItems: Array<{ title: string; description?: string; quantity: number; unit_price: number; unit?: string; vat_rate?: number; product_id?: string; card_id?: string }>
    ): Promise<void> {
        const { error: deleteErr } = await supabase.from('quote_items').delete().eq('quote_id', quoteId);
        if (deleteErr) throw new Error(`Erreur suppression lignes: ${deleteErr.message}`);

        const total = templateItems.reduce((sum, it) => sum + (it.quantity || 1) * (it.unit_price || 0), 0);

        for (let i = 0; i < templateItems.length; i++) {
            const it = templateItems[i];
            const row: Record<string, unknown> = {
                quote_id: quoteId,
                title: it.title,
                description: it.description || null,
                quantity: it.quantity ?? 1,
                unit_price: Number(it.unit_price),
                unit: it.unit || 'unité',
                vat_rate: it.vat_rate ?? 0,
                order_index: i,
            };
            if (it.product_id) row.product_id = it.product_id;
            if (it.card_id) row.card_id = it.card_id;
            const { error: insertErr } = await supabase.from('quote_items').insert(row);
            if (insertErr) throw new Error(`Erreur ligne "${it.title}": ${insertErr.message}`);
        }

        const { error: updateErr } = await supabase.from('service_quotes').update({ quote_amount: total }).eq('id', quoteId);
        if (updateErr) throw new Error(`Erreur mise à jour montant: ${updateErr.message}`);
    }

    /**
     * Obtenir les métriques de conversion (temps de réponse, délai de décision)
     * Nécessite la migration 20260203_quote_improvements
     */
    static async getQuoteConversionStats(userId: string): Promise<{
        avg_response_hours?: number;
        avg_decision_hours?: number;
    } | null> {
        try {
            const { data, error } = await supabase.rpc('get_quote_conversion_stats', { p_user_id: userId });
            if (error) return null;
            const r = data as Record<string, unknown>;
            const parseNum = (v: unknown): number | undefined => {
                if (typeof v === 'number' && !Number.isNaN(v)) return v;
                if (typeof v === 'string') {
                    const n = parseFloat(v);
                    return !Number.isNaN(n) ? n : undefined;
                }
                return undefined;
            };
            return {
                avg_response_hours: parseNum(r?.avg_response_hours),
                avg_decision_hours: parseNum(r?.avg_decision_hours),
            };
        } catch {
            return null;
        }
    }

    /**
     * Accepter ou refuser un devis (côté client, anon)
     * @param clientSignature - Signature électronique en base64 data URL (optionnel)
     */
    static async respondQuotePublic(
        token: string,
        action: 'accept' | 'reject',
        rejectionReason?: string,
        clientSignature?: string
    ): Promise<{ success: boolean; error?: string }> {
        const { data, error } = await supabase.rpc('respond_quote_public', {
            p_token: token,
            p_action: action,
            p_rejection_reason: rejectionReason || null,
            p_client_signature: clientSignature || null
        });
        if (error) return { success: false, error: error.message };
        const result = data as { success?: boolean; error?: string };
        return { success: result?.success ?? false, error: result?.error };
    }
}
