import { supabase } from '@/integrations/supabase/client';
import {
    PortfolioProject,
    CreateProjectData,
    UpdateProjectData
} from './types';

export class PortfolioProjectService {
    /**
     * Créer un nouveau projet
     */
    static async createProject(userId: string, data: Partial<CreateProjectData>): Promise<PortfolioProject> {
        const title = data.title || 'Untitled';
        const { data: slugData, error: slugError } = await supabase
            .rpc('generate_unique_slug', {
                title_text: title,
                user_uuid: userId
            });

        if (slugError) throw slugError;

        const { data: project, error } = await supabase
            .from('portfolio_projects')
            .insert({
                user_id: userId,
                slug: slugData as string,
                title,
                ...data
            })
            .select()
            .single();

        if (error) throw error;
        return project!;
    }

    /**
     * Obtenir tous les projets d'un utilisateur avec pagination
     */
    static async getUserProjects(
        userId: string,
        options: {
            publishedOnly?: boolean;
            limit?: number;
            offset?: number;
            searchTerm?: string;
        } = {}
    ): Promise<{
        projects: PortfolioProject[];
        total: number;
        hasMore: boolean;
    }> {
        const { publishedOnly = false, limit = 20, offset = 0, searchTerm } = options;

        let query = supabase
            .from('portfolio_projects')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (publishedOnly) {
            query = query.eq('is_published', true);
        }

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            projects: (data || []) as PortfolioProject[],
            total: count || 0,
            hasMore: (offset + limit) < (count || 0)
        };
    }

    /**
     * Obtenir un projet par ID
     */
    static async getProject(projectId: string): Promise<PortfolioProject | null> {
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as PortfolioProject | null;
    }

    /**
     * Obtenir les projets par carte (vue publique) with pagination
     */
    static async getCardProjects(
        cardId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<PortfolioProject[]> {
        const { limit, offset = 0 } = options || {};

        let query = supabase
            .from('portfolio_projects')
            .select('*')
            .eq('card_id', cardId)
            .eq('is_published', true)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []) as PortfolioProject[];
    }

    /**
     * Obtenir un projet par slug
     */
    static async getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as PortfolioProject | null;
    }

    /**
     * Mettre à jour un projet
     */
    static async updateProject(projectId: string, data: UpdateProjectData): Promise<PortfolioProject> {
        const { data: project, error } = await supabase
            .from('portfolio_projects')
            .update(data)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return project as PortfolioProject;
    }

    /**
     * Supprimer un projet
     */
    static async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase
            .from('portfolio_projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    }

    /**
     * Incrémenter le compteur de vues d'un projet
     */
    static async incrementProjectViews(projectId: string): Promise<void> {
        const { error } = await supabase.rpc('increment', {
            row_id: projectId,
            table_name: 'portfolio_projects',
            column_name: 'view_count'
        });

        if (error) {
            const { data: project } = await supabase
                .from('portfolio_projects')
                .select('view_count')
                .eq('id', projectId)
                .single();

            if (project) {
                await supabase
                    .from('portfolio_projects')
                    .update({ view_count: (project.view_count || 0) + 1 })
                    .eq('id', projectId);
            }
        }
    }

    /**
     * Obtenir les projets les plus consultés
     */
    static async getTopProjects(userId: string, limit = 10): Promise<PortfolioProject[]> {
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .eq('user_id', userId)
            .eq('is_published', true)
            .order('view_count', { ascending: false })
            .limit(Math.min(limit, 50));

        if (error) throw error;
        return (data || []) as PortfolioProject[];
    }
}
