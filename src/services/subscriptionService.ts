/**
 * Service d'abonnement utilisant BoohPay
 * 
 * Ce service remplace subscription.ts et utilise BoohPay pour gérer les abonnements récurrents
 * Il maintient la synchronisation avec la table user_subscriptions dans Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { boohPayService, PaymentMethod } from './boohPayService';
import { BoohPayMerchantService } from './boohPayMerchantService';
import { PlanType, UserSubscription } from '@/types/subscription';

export interface CreateSubscriptionRequest {
  planType: PlanType;
  billingInterval: 'month' | 'year';
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionResult {
  subscriptionId: string; // ID BoohPay
  localSubscriptionId: string; // ID dans user_subscriptions
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

/**
 * Service d'abonnement via BoohPay
 */
export class SubscriptionService {
  /**
   * Convertir PlanType vers nom de plan
   */
  private static planTypeToName(planType: PlanType): string {
    const mapping: Record<PlanType, string> = {
      [PlanType.FREE]: 'free',
      [PlanType.BUSINESS]: 'business',
      [PlanType.MAGIC]: 'magic',
    };
    return mapping[planType] || 'free';
  }

  /**
   * Convertir billingInterval vers format BoohPay
   */
  private static convertBillingInterval(interval: 'month' | 'year'): 'month' | 'year' {
    return interval;
  }

  /**
   * Calculer le montant en centimes selon le plan
   */
  private static getPlanAmount(planType: PlanType, interval: 'month' | 'year'): number {
    // Prix en EUR
    const monthlyPrices: Record<PlanType, number> = {
      [PlanType.FREE]: 0,
      [PlanType.BUSINESS]: 20, // 20 EUR
      [PlanType.MAGIC]: 40, // 40 EUR
    };

    const monthlyPrice = monthlyPrices[planType] || 0;
    
    if (interval === 'year') {
      // Annuel avec réduction (par exemple 10%)
      return Math.round(monthlyPrice * 12 * 0.9 * 100); // En centimes
    }
    
    return Math.round(monthlyPrice * 100); // En centimes
  }

  /**
   * Créer un abonnement via BoohPay
   */
  static async createSubscription(
    userId: string,
    request: CreateSubscriptionRequest
  ): Promise<SubscriptionResult> {
    // Initialiser BoohPay pour l'utilisateur
    const initialized = await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    if (!initialized) {
      // Créer automatiquement un merchant si nécessaire
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      await BoohPayMerchantService.getOrCreateMerchant(
        userId,
        user.user_metadata?.full_name || user.email || 'User'
      );
      
      await BoohPayMerchantService.initializeBoohPayForUser(userId);
    }

    // Récupérer ou créer le merchant BoohPay
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const merchant = await BoohPayMerchantService.getOrCreateMerchant(
      userId,
      user.user_metadata?.full_name || user.email || 'User'
    );

    // Créer l'abonnement dans BoohPay
    const amountMinor = this.getPlanAmount(request.planType, request.billingInterval);
    
    const boohPaySubscription = await boohPayService.createSubscription({
      merchantId: merchant.boohpay_merchant_id,
      customerEmail: request.customerEmail,
      amount: amountMinor, // En centimes
      currency: 'EUR',
      interval: this.convertBillingInterval(request.billingInterval),
      paymentMethod: request.paymentMethod,
      metadata: {
        planType: request.planType,
        userId,
        ...request.metadata,
      },
    });

    // Créer ou mettre à jour l'abonnement local dans Supabase
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    let localSubscriptionId: string;

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: request.planType,
          status: 'active',
          start_date: new Date(boohPaySubscription.currentPeriodStart).toISOString(),
          end_date: new Date(boohPaySubscription.currentPeriodEnd).toISOString(),
          auto_renew: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) throw error;
      localSubscriptionId = data.id;
    } else {
      // Créer un nouvel abonnement
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_type: request.planType,
          status: 'active',
          start_date: new Date(boohPaySubscription.currentPeriodStart).toISOString(),
          end_date: new Date(boohPaySubscription.currentPeriodEnd).toISOString(),
          auto_renew: true,
          boohpay_subscription_id: boohPaySubscription.id, // Stocker l'ID BoohPay
        })
        .select()
        .single();

      if (error) throw error;
      localSubscriptionId = data.id;
    }

    return {
      subscriptionId: boohPaySubscription.id,
      localSubscriptionId,
      status: boohPaySubscription.status,
      currentPeriodStart: boohPaySubscription.currentPeriodStart,
      currentPeriodEnd: boohPaySubscription.currentPeriodEnd,
    };
  }

  /**
   * Récupérer un abonnement
   */
  static async getSubscription(userId: string, subscriptionId: string): Promise<any> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    return await boohPayService.getSubscription(subscriptionId);
  }

  /**
   * Mettre à jour un abonnement
   */
  static async updateSubscription(
    userId: string,
    subscriptionId: string,
    updates: {
      amount?: number;
      billingInterval?: 'month' | 'year';
      customerEmail?: string;
    }
  ): Promise<any> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    const boohPayUpdates: any = {};
    if (updates.amount !== undefined) {
      boohPayUpdates.amount = Math.round(updates.amount * 100); // Convertir en centimes
    }
    if (updates.billingInterval !== undefined) {
      boohPayUpdates.interval = updates.billingInterval;
    }
    if (updates.customerEmail !== undefined) {
      boohPayUpdates.customerEmail = updates.customerEmail;
    }

    const updated = await boohPayService.updateSubscription(subscriptionId, boohPayUpdates);

    // Mettre à jour l'abonnement local si nécessaire
    if (updates.amount || updates.billingInterval) {
      const { data: localSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('boohpay_subscription_id', subscriptionId)
        .maybeSingle();

      if (localSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({
            end_date: new Date(updated.currentPeriodEnd).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', localSubscription.id);
      }
    }

    return updated;
  }

  /**
   * Annuler un abonnement
   */
  static async cancelSubscription(
    userId: string,
    subscriptionId: string,
    cancelAt?: Date
  ): Promise<void> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    await boohPayService.cancelSubscription(subscriptionId, cancelAt);

    // Mettre à jour l'abonnement local
    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('boohpay_subscription_id', subscriptionId)
      .maybeSingle();

    if (localSubscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          end_date: cancelAt ? cancelAt.toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', localSubscription.id);
    }
  }

  /**
   * Mettre en pause un abonnement
   */
  static async pauseSubscription(userId: string, subscriptionId: string): Promise<any> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    return await boohPayService.pauseSubscription(subscriptionId);
  }

  /**
   * Reprendre un abonnement
   */
  static async resumeSubscription(userId: string, subscriptionId: string): Promise<any> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    return await boohPayService.resumeSubscription(subscriptionId);
  }

  /**
   * Synchroniser l'abonnement local avec BoohPay
   */
  static async syncSubscription(userId: string): Promise<void> {
    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!localSubscription?.boohpay_subscription_id) {
      return; // Pas d'abonnement BoohPay à synchroniser
    }

    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    const boohPaySubscription = await boohPayService.getSubscription(
      localSubscription.boohpay_subscription_id
    );

    // Mettre à jour l'abonnement local avec les données BoohPay
    await supabase
      .from('user_subscriptions')
      .update({
        status: boohPaySubscription.status === 'ACTIVE' ? 'active' : 'cancelled',
        end_date: new Date(boohPaySubscription.currentPeriodEnd).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', localSubscription.id);
  }
}

