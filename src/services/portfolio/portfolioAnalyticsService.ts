import { supabase } from '@/integrations/supabase/client';
import {
    PortfolioAnalytics,
    PortfolioStats,
    AnalyticsEventType
} from './types';

export class PortfolioAnalyticsService {
    /**
     * Enregistrer un événement analytics
     */
    static async trackEvent(
        userId: string,
        eventType: AnalyticsEventType,
        options?: {
            cardId?: string;
            projectId?: string;
            metadata?: any;
        }
    ): Promise<void> {
        const { error } = await supabase
            .from('portfolio_analytics')
            .insert({
                user_id: userId,
                card_id: options?.cardId,
                project_id: options?.projectId,
                event_type: eventType,
                metadata: options?.metadata
            });

        if (error) {
            // Error log handled implicitly by context
        }
    }

    /**
     * Obtenir les statistiques globales du portfolio
     */
    static async getStats(userId: string): Promise<PortfolioStats> {
        const { data, error } = await supabase
            .rpc('get_portfolio_stats', { user_uuid: userId });

        if (error) throw error;
        return data as unknown as PortfolioStats;
    }

    /**
     * Obtenir les événements analytics avec pagination
     */
    static async getAnalytics(
        userId: string,
        filters?: {
            eventType?: AnalyticsEventType;
            projectId?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
            offset?: number;
        }
    ): Promise<{
        analytics: PortfolioAnalytics[];
        total: number;
        hasMore: boolean;
    }> {
        const {
            eventType,
            projectId,
            startDate,
            endDate,
            limit = 50,
            offset = 0
        } = filters || {};

        let query = supabase
            .from('portfolio_analytics')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (eventType) {
            query = query.eq('event_type', eventType);
        }

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
            query = query.lte('created_at', endDate.toISOString());
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            analytics: (data || []) as PortfolioAnalytics[],
            total: count || 0,
            hasMore: (offset + limit) < (count || 0)
        };
    }
}
