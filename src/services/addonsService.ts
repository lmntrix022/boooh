/**
 * AddonsService: Manage user addons with persistent storage
 * 
 * This service:
 * - Loads addons from database (not memory)
 * - Applies addons to base features
 * - Handles addon purchases and expiration
 * - Tracks addon compatibility with plans
 */

import { supabase } from '@/integrations/supabase/client';
import { PlanFeatures, AddonType, ADDON_PRICES } from '@/types/subscription';

export interface UserAddon {
  id: string;
  user_id: string;
  addon_type: string;
  quantity: number;
  purchased_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddonEffect {
  name: string;
  price: number;
  targetPlans: string[];
  description: string;
}

const ADDON_EFFECTS: Record<string, AddonEffect> = {
  pack_createur: {
    name: 'Pack Créateur',
    price: 7500,
    targetPlans: ['business', 'pro', 'magic'],
    description: 'DRM + watermarking + monétisation numérique',
  },
  pack_volume: {
    name: 'Pack Volume',
    price: 5000,
    targetPlans: ['business', 'pro'],
    description: 'Ajouter +15 produits à votre boutique',
  },
  pack_equipe: {
    name: 'Pack Équipe',
    price: 5000,
    targetPlans: ['business', 'pro', 'magic'],
    description: 'Ajout de cartes supplémentaires (prix par carte)',
  },
  pack_brand: {
    name: 'Pack Brand',
    price: 8000,
    targetPlans: ['business', 'pro', 'magic'],
    description: 'Domaine personnalisé + logo sur lien Bööh',
  },
  pack_analytics_pro: {
    name: 'Pack Analytics Pro',
    price: 6000,
    targetPlans: ['business', 'pro', 'magic'],
    description: 'Dashboard comparatif + Heatmap',
  },
};

class AddonsServiceClass {
  /**
   * Get all active addons for a user from database
   * Only returns non-expired addons
   */
  async getUserActiveAddons(userId: string): Promise<UserAddon[]> {
    try {
      const { data, error } = await supabase
        .from('user_active_addons')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('[AddonsService] Error fetching active addons:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AddonsService] Failed to fetch active addons:', error);
      return [];
    }
  }

  /**
   * Get all addons for a user (including expired)
   */
  async getUserAllAddons(userId: string): Promise<UserAddon[]> {
    try {
      const { data, error } = await supabase
        .from('user_addons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AddonsService] Error fetching all addons:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AddonsService] Failed to fetch all addons:', error);
      return [];
    }
  }

  /**
   * Check if user has a specific addon (active)
   */
  async userHasAddon(userId: string, addonType: string): Promise<boolean> {
    const addons = await this.getUserActiveAddons(userId);
    return addons.some((a) => a.addon_type === addonType);
  }

  /**
   * Apply addons to base features to get effective features
   * Takes base features from plan and enhances them with active addons
   */
  applyAddonsToFeatures(
    baseFeatures: PlanFeatures,
    activeAddons: UserAddon[]
  ): PlanFeatures {
    const result = { ...baseFeatures };

      for (const addon of activeAddons) {
      switch (addon.addon_type) {
        case 'pack_createur':
          result.drmProtection = true;
          result.watermarking = true;
          result.digitalProducts = true; // ✅ CRITICAL: Enable digital products with PACK_CREATEUR
          console.log('✅ PACK_CREATEUR activated - digitalProducts enabled for user');
          break;

        case 'pack_volume':
          if (result.maxProducts !== -1) {
            result.maxProducts += 15; // Ajouter +15 produits (20 + 15 = 35 pour BUSINESS/MAGIC)
          }
          break;

        case 'pack_equipe':
          // Can stack: each addon adds 1 card
          if (result.maxCards !== -1) {
            result.maxCards += addon.quantity;
          }
          break;

        case 'pack_brand':
          // Custom domain feature
          // This would need to be added to PlanFeatures interface
          break;

        case 'pack_analytics_pro':
          // Advanced analytics
          // This would need to be added to PlanFeatures interface
          break;
      }
    }

    return result;
  }

  /**
   * Calculate total addon cost for a user
   * Returns price in EUR (matching PLAN_PRICES)
   */
  calculateAddonsCost(activeAddons: UserAddon[]): number {
    return activeAddons.reduce((total, addon) => {
      // Use ADDON_PRICES (EUR) instead of ADDON_EFFECTS (FCFA) for consistency
      const priceInEUR = ADDON_PRICES[addon.addon_type as AddonType];
      if (priceInEUR !== undefined) {
        return total + priceInEUR * addon.quantity;
      }
      return total;
    }, 0);
  }

  /**
   * Add an addon for a user
   */
  async addAddon(
    userId: string,
    addonType: string,
    quantity: number = 1,
    expiresAt?: string,
    paymentId?: string
  ): Promise<UserAddon | null> {
    try {
      const { data, error } = await supabase
        .from('user_addons')
        .insert({
          user_id: userId,
          addon_type: addonType,
          quantity,
          expires_at: expiresAt || null,
          payment_id: paymentId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[AddonsService] Error adding addon:', error);
        return null;
      }

      console.log(`[AddonsService] Addon ${addonType} added for user ${userId}`);
      return data;
    } catch (error) {
      console.error('[AddonsService] Failed to add addon:', error);
      return null;
    }
  }

  /**
   * Expire/remove an addon
   */
  async expireAddon(addonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_addons')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', addonId);

      if (error) {
        console.error('[AddonsService] Error expiring addon:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AddonsService] Failed to expire addon:', error);
      return false;
    }
  }

  /**
   * Check if an addon is compatible with a plan
   */
  isAddonCompatible(addonType: string, planName: string): boolean {
    const addon = ADDON_EFFECTS[addonType];
    if (!addon) return false;
    return addon.targetPlans.includes(planName);
  }

  /**
   * Get available addons for a plan
   */
  getAvailableAddonsForPlan(planName: string): AddonEffect[] {
    return Object.entries(ADDON_EFFECTS)
      .filter(([_, addon]) => addon.targetPlans.includes(planName))
      .map(([_, addon]) => addon);
  }

  /**
   * Format addon name for display
   */
  getAddonDisplayName(addonType: string): string {
    return ADDON_EFFECTS[addonType]?.name || addonType;
  }

  /**
   * Get addon effect description
   */
  getAddonDescription(addonType: string): string {
    return ADDON_EFFECTS[addonType]?.description || '';
  }
}

// Export singleton instance
export const AddonsService = new AddonsServiceClass();
