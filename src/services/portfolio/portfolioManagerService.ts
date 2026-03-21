import { supabase } from '@/integrations/supabase/client';
import {
    PortfolioServiceType,
    PortfolioServiceWithCards,
    CreateServiceData,
    UpdateServiceData,
    ServiceCard
} from './types';

export class PortfolioManagerService {
    /**
     * Obtenir tous les services d'un utilisateur avec pagination
     */
    static async getUserServices(
        userId: string,
        options: {
            limit?: number;
            offset?: number;
            searchTerm?: string;
            publishedOnly?: boolean;
        } = {}
    ): Promise<{
        services: PortfolioServiceType[];
        total: number;
        hasMore: boolean;
    }> {
        const { limit = 20, offset = 0, searchTerm, publishedOnly = false } = options;

        let query = supabase
            .from('portfolio_services')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('order_index', { ascending: true })
            .range(offset, offset + limit - 1);

        if (publishedOnly) {
            query = query.eq('is_published', true);
        }

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            services: (data || []) as PortfolioServiceType[],
            total: count || 0,
            hasMore: (offset + limit) < (count || 0)
        };
    }

    /**
     * Créer un nouveau service
     */
    static async createService(
        service: CreateServiceData
    ): Promise<PortfolioServiceType> {
        const { data, error } = await supabase
            .from('portfolio_services')
            .insert([service])
            .select()
            .single();

        if (error) throw error;
        return data as PortfolioServiceType;
    }

    /**
     * Mettre à jour un service
     */
    static async updateService(
        serviceId: string,
        updates: UpdateServiceData
    ): Promise<PortfolioServiceType> {
        const { data, error } = await supabase
            .from('portfolio_services')
            .update(updates)
            .eq('id', serviceId)
            .select()
            .single();

        if (error) throw error;
        return data as PortfolioServiceType;
    }

    /**
     * Supprimer un service
     */
    static async deleteService(serviceId: string): Promise<void> {
        const { error } = await supabase
            .from('portfolio_services')
            .delete()
            .eq('id', serviceId);

        if (error) throw error;
    }

    /**
     * Réorganiser les services
     */
    static async reorderServices(serviceIds: string[]): Promise<void> {
        const updates = serviceIds.map((id, index) => ({
            id,
            order_index: index
        }));

        for (const update of updates) {
            await supabase
                .from('portfolio_services')
                .update({ order_index: update.order_index })
                .eq('id', update.id);
        }
    }

    // =====================================================
    // SERVICE-CARD LINKS
    // =====================================================

    /**
     * Lier un service à une carte
     */
    static async linkServiceToCard(serviceId: string, cardId: string): Promise<ServiceCard> {
        const { data, error } = await supabase
            .from('service_cards')
            .insert({ service_id: serviceId, card_id: cardId })
            .select()
            .single();

        if (error) throw error;
        return data as ServiceCard;
    }

    /**
     * Délier un service d'une carte
     */
    static async unlinkServiceFromCard(serviceId: string, cardId: string): Promise<void> {
        const { error } = await supabase
            .from('service_cards')
            .delete()
            .eq('service_id', serviceId)
            .eq('card_id', cardId);

        if (error) throw error;
    }

    /**
     * Mettre à jour tous les liens d'un service
     */
    static async updateServiceCards(serviceId: string, cardIds: string[]): Promise<void> {
        await supabase
            .from('service_cards')
            .delete()
            .eq('service_id', serviceId);

        if (cardIds.length > 0) {
            const links = cardIds.map(cardId => ({
                service_id: serviceId,
                card_id: cardId
            }));

            const { error } = await supabase
                .from('service_cards')
                .insert(links);

            if (error) throw error;
        }
    }

    /**
     * Obtenir les cartes liées à un service
     */
    static async getServiceCards(serviceId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('service_cards')
            .select('card_id')
            .eq('service_id', serviceId);

        if (error) throw error;
        return (data || []).map(link => link.card_id);
    }

    /**
     * Obtenir les services d'un utilisateur avec leurs cartes liées (avec pagination)
     */
    static async getUserServicesWithCards(
        userId: string,
        options: {
            limit?: number;
            offset?: number;
            searchTerm?: string;
            publishedOnly?: boolean;
        } = {}
    ): Promise<{
        services: PortfolioServiceWithCards[];
        total: number;
        hasMore: boolean;
    }> {
        const { limit = 20, offset = 0, searchTerm, publishedOnly = false } = options;

        let servicesQuery = supabase
            .from('portfolio_services')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('order_index', { ascending: true })
            .range(offset, offset + limit - 1);

        if (publishedOnly) {
            servicesQuery = servicesQuery.eq('is_published', true);
        }

        if (searchTerm) {
            servicesQuery = servicesQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data: services, error: servicesError, count } = await servicesQuery;

        if (servicesError) throw servicesError;
        if (!services || services.length === 0) {
            return {
                services: [],
                total: count || 0,
                hasMore: false
            };
        }

        const { data: userCards, error: cardsError } = await supabase
            .from('business_cards')
            .select('id, name')
            .eq('user_id', userId);

        if (cardsError) throw cardsError;

        const serviceIds = services.map(s => s.id);
        const { data: links, error: linksError } = await supabase
            .from('service_cards')
            .select('service_id, card_id')
            .in('service_id', serviceIds);

        if (linksError) throw linksError;

        const cardsMap = new Map(
            userCards?.map(card => [
                card.id,
                { id: card.id, title: card.name, slug: undefined }
            ]) || []
        );
        const linksMap = new Map<string, string[]>();

        (links || []).forEach(link => {
            if (!linksMap.has(link.service_id)) {
                linksMap.set(link.service_id, []);
            }
            linksMap.get(link.service_id)!.push(link.card_id);
        });

        const servicesWithCards = services.map(service => ({
            ...(service as PortfolioServiceType),
            linked_cards: (linksMap.get(service.id) || [])
                .map(cardId => cardsMap.get(cardId))
                .filter(Boolean) as { id: string; title: string; slug?: string }[]
        })) as PortfolioServiceWithCards[];

        return {
            services: servicesWithCards,
            total: count || 0,
            hasMore: (offset + limit) < (count || 0)
        };
    }

    /**
     * Obtenir les services publiés d'une carte spécifique
     */
    static async getPublishedCardServices(cardId: string): Promise<PortfolioServiceType[]> {
        const { data: links, error: linksError } = await supabase
            .from('service_cards')
            .select('service_id')
            .eq('card_id', cardId);

        if (linksError) throw linksError;

        const serviceIdsFromLinks = (links || []).map(link => link.service_id);

        const { data: directServices, error: directError } = await supabase
            .from('portfolio_services')
            .select('id')
            .eq('card_id', cardId)
            .eq('is_published', true);

        if (directError) throw directError;

        const serviceIdsFromDirect = (directServices || []).map(s => s.id);

        const allServiceIds = [...new Set([
            ...serviceIdsFromLinks,
            ...serviceIdsFromDirect
        ])];

        if (allServiceIds.length === 0) return [];

        const { data: services, error: servicesError } = await supabase
            .from('portfolio_services')
            .select('*')
            .in('id', allServiceIds)
            .eq('is_published', true)
            .order('order_index', { ascending: true });

        if (servicesError) throw servicesError;
        return (services || []) as PortfolioServiceType[];
    }
}
