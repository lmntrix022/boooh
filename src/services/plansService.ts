/**
 * PlansService: Single Source of Truth for Subscription Plans
 * Loads all plans from Supabase database instead of hardcoding
 * 
 * This service eliminates the double system (3 plans in TS vs 5 plans in DB)
 * and ensures all plan data comes from a single source
 */

import { supabase } from '@/integrations/supabase/client';
import { PlanFeatures } from '@/types/subscription';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CachedPlan extends SubscriptionPlan {
  parsedFeatures: PlanFeatures;
}

class PlansServiceClass {
  private plansCache: CachedPlan[] | null = null;
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Get all subscription plans from database with caching
   * Cache is refreshed every hour or on manual call with forceRefresh
   */
  async getPlans(forceRefresh: boolean = false): Promise<CachedPlan[]> {
    const now = Date.now();

    // Return cached plans if valid
    if (this.plansCache && !forceRefresh && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.plansCache;
    }

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('[PlansService] Error fetching plans:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('[PlansService] No plans found in database');
        return [];
      }

      // Parse features for each plan
      this.plansCache = data.map((plan: SubscriptionPlan) => ({
        ...plan,
        parsedFeatures: this.parseFeaturesFromDB(plan.features),
      }));

      this.cacheTimestamp = now;
      return this.plansCache;
    } catch (error) {
      console.error('[PlansService] Failed to load plans:', error);
      throw error;
    }
  }

  /**
   * Get a single plan by name (e.g., 'free', 'business', 'magic')
   */
  async getPlanByName(name: string): Promise<CachedPlan | null> {
    const plans = await this.getPlans();
    return plans.find((p) => p.name === name) || null;
  }

  /**
   * Get a single plan by ID
   */
  async getPlanById(id: string): Promise<CachedPlan | null> {
    const plans = await this.getPlans();
    return plans.find((p) => p.id === id) || null;
  }

  /**
   * Parse features from database JSONB format to typed PlanFeatures
   * Handles different naming conventions between DB and application
   */
  private parseFeaturesFromDB(features: Record<string, any>): PlanFeatures {
    return {
      // Cartes de visite
      maxCards: features.max_cards ?? features.maxCards ?? 1,
      customThemes: features.custom_themes ?? features.customThemes ?? false,
      removeBranding: features.remove_branding ?? features.removeBranding ?? false,
      advancedAnalytics: features.advanced_analytics ?? features.advancedAnalytics ?? false,

      // E-commerce
      hasEcommerce: features.has_ecommerce ?? features.hasEcommerce ?? false,
      maxProducts: features.max_products ?? features.maxProducts ?? 1,
      digitalProducts: features.digital_products ?? features.digitalProducts ?? false,
      drmProtection: features.drm_protection ?? features.drmProtection ?? false,
      watermarking: features.watermarking ?? false,

      // Portfolio
      hasPortfolio: features.has_portfolio ?? features.hasPortfolio ?? false,
      maxProjects: features.max_projects ?? features.maxProjects ?? 0,
      quoteRequests: features.quote_requests ?? features.quoteRequests ?? false,

      // Facturation
      hasInvoicing: features.has_invoicing ?? features.hasInvoicing ?? false,
      advancedInvoicing: features.advanced_invoicing ?? features.advancedInvoicing ?? false,
      autoInvoicing: features.auto_invoicing ?? features.autoInvoicing ?? false,

      // Stock
      hasStockManagement: features.has_stock_management ?? features.hasStockManagement ?? false,
      advancedStock: features.advanced_stock ?? features.advancedStock ?? false,

      // Rendez-vous
      hasAppointments: features.has_appointments ?? features.hasAppointments ?? false,
      advancedAppointments:
        features.advanced_appointments ?? features.advancedAppointments ?? false,
      googleCalendarSync: features.google_calendar_sync ?? features.googleCalendarSync ?? false,

      // CRM
      hasCRM: features.has_crm ?? features.hasCRM ?? false,
      aiParsing: features.ai_parsing ?? features.aiParsing ?? false,
      ocrScanning: features.ocr_scanning ?? features.ocrScanning ?? false,

      // Carte interactive
      hasMap: features.has_map ?? features.hasMap ?? false,
      mapClustering: features.map_clustering ?? features.mapClustering ?? false,

      // Équipe
      multiUser: features.multi_user ?? features.multiUser ?? false,
      maxTeamMembers: features.max_team_members ?? features.maxTeamMembers ?? 1,
      rolePermissions: features.role_permissions ?? features.rolePermissions ?? false,

      // Commissions
      marketplaceCommission: features.marketplace_commission ?? features.marketplaceCommission ?? 0,

      // Support
      supportLevel: (features.support_level ?? features.supportLevel ?? 'community') as
        | 'community'
        | 'email'
        | 'priority',
    };
  }

  /**
   * Clear cache to force refresh on next call
   */
  clearCache(): void {
    this.plansCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get pricing for display
   */
  async getPricingInfo() {
    const plans = await this.getPlans();
    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      features: plan.parsedFeatures,
    }));
  }
}

// Export singleton instance
export const PlansService = new PlansServiceClass();
