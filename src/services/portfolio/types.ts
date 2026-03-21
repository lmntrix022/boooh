import { Database } from '@/types/supabase';

// Base types from Supabase
export type DbPortfolioProject = Database['public']['Tables']['portfolio_projects']['Row'];
export type DbPortfolioService = Database['public']['Tables']['portfolio_services']['Row'];
export type DbServiceQuote = Database['public']['Tables']['service_quotes']['Row'];
export type DbPortfolioSettings = Database['public']['Tables']['portfolio_settings']['Row'];
export type DbPortfolioAnalytics = Database['public']['Tables']['portfolio_analytics']['Row'];
export type DbServiceCard = Database['public']['Tables']['service_cards']['Row'];

// Export types (using database types directly)
export type PortfolioProject = DbPortfolioProject;
export type PortfolioServiceType = DbPortfolioService;
export type ServiceQuote = DbServiceQuote;
export type PortfolioSettings = DbPortfolioSettings;
export type PortfolioAnalytics = DbPortfolioAnalytics;
export type ServiceCard = DbServiceCard;

// Enum types for convenience
export type CTAType = 'contact' | 'booking' | 'quote' | 'custom';
export type QuoteStatus = 'new' | 'in_progress' | 'quoted' | 'accepted' | 'refused' | 'closed';
export type QuotePriority = 'low' | 'normal' | 'high' | 'urgent';
export type Urgency = 'urgent' | 'normal' | 'flexible';
export type PortfolioView = 'grid' | 'list' | 'masonry';
export type AnalyticsEventType = 'view' | 'cta_click' | 'quote_request' | 'booking_click';
export type PriceType = 'fixed' | 'from' | 'custom' | 'free';

// Extended types
export interface PortfolioServiceWithCards extends DbPortfolioService {
    linked_cards?: {
        id: string;
        title: string;
        slug?: string;
    }[];
}

export interface PortfolioStats {
    total_projects: number;
    published_projects: number;
    total_views: number;
    total_quotes: number;
    pending_quotes: number;
    converted_quotes: number;
    quote_conversion_rate: number;
}

// Insert/Update types from Supabase
export type CreateProjectData = Database['public']['Tables']['portfolio_projects']['Insert'];
export type UpdateProjectData = Database['public']['Tables']['portfolio_projects']['Update'];
export type CreateQuoteData = Database['public']['Tables']['service_quotes']['Insert'];
export type UpdateQuoteData = Database['public']['Tables']['service_quotes']['Update'];
export type CreateServiceData = Database['public']['Tables']['portfolio_services']['Insert'];
export type UpdateServiceData = Database['public']['Tables']['portfolio_services']['Update'];
