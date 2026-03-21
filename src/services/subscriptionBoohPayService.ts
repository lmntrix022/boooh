/**
 * Service pour gérer les abonnements via BoohPay
 * 
 * Ce service gère les abonnements récurrents avec paiements automatiques via BoohPay
 * Il synchronise avec la table user_subscriptions dans Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { SubscriptionService } from './subscriptionService';
import { PaymentService } from './paymentService';
import { PlanType } from '@/types/subscription';
import { PaymentMethod } from './boohPayService';
import { BoohPayMerchantService } from './boohPayMerchantService';
import { syncCommissionWithBoohPay } from './commissionSyncService';

// Déclaration pour window.location
declare const window: { location: { origin: string } };

export interface CreateRecurringSubscriptionRequest {
  planType: PlanType;
  billingInterval: 'month' | 'year';
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  amount: number; // Montant en EUR
}

/**
 * Service pour créer et gérer les abonnements récurrents via BoohPay
 */
export class SubscriptionBoohPayService {
  /**
   * Créer un abonnement récurrent via BoohPay
   * 
   * Cette méthode :
   * 1. Crée un abonnement dans BoohPay
   * 2. Crée le premier paiement pour activer l'abonnement
   * 3. Synchronise avec user_subscriptions dans Supabase
   */
  static async createRecurringSubscription(
    userId: string,
    request: CreateRecurringSubscriptionRequest
  ): Promise<{
    subscriptionId: string;
    paymentId: string;
    checkout?: {
      type: 'CLIENT_SECRET' | 'REDIRECT';
      clientSecret?: string;
      url?: string;
    };
  }> {
    // Créer l'abonnement dans BoohPay
    const subscription = await SubscriptionService.createSubscription(userId, {
      planType: request.planType,
      billingInterval: request.billingInterval,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      paymentMethod: request.paymentMethod,
      metadata: {
        planType: request.planType,
        userId,
      },
    });

    // Créer le premier paiement pour activer l'abonnement
    const orderId = `SUBSCRIPTION-${subscription.subscriptionId}-${Date.now()}`;
    
    let payment;
    if (request.paymentMethod === PaymentMethod.Card) {
      payment = await PaymentService.createStripePayment(
        userId,
        orderId,
        request.amount,
        'EUR',
        {
          email: request.customerEmail,
          name: request.customerEmail.split('@')[0],
          phone: request.customerPhone,
        },
        `${window.location.origin}/payment-callback?payment_id={payment_id}`
      );
    } else {
      payment = await PaymentService.createMobileMoneyPayment(
        userId,
        orderId,
        request.amount * 655, // Convertir EUR en FCFA
        'XOF',
        {
          email: request.customerEmail,
          phone: request.customerPhone || '',
          name: request.customerEmail.split('@')[0],
        },
        `${window.location.origin}/payment-callback?payment_id={payment_id}`
      );
    }

    return {
      subscriptionId: subscription.subscriptionId,
      paymentId: payment.paymentId,
      checkout: payment.checkout,
    };
  }

  /**
   * Mettre à jour un plan d'abonnement (changement de plan)
   * 
   * Cette méthode met à jour le plan localement ET crée un nouvel abonnement BoohPay
   * si l'utilisateur n'en avait pas encore.
   * 
   * Elle synchronise également la commission avec BoohPay selon le nouveau plan.
   */
  static async upgradePlan(
    userId: string,
    newPlanType: PlanType,
    billingInterval: 'month' | 'year' = 'month'
  ): Promise<void> {
    // S'assurer que le merchant BoohPay existe
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Créer le merchant si nécessaire
    await BoohPayMerchantService.getOrCreateMerchant(
      userId,
      user.user_metadata?.full_name || user.email || 'User'
    );

    // Synchroniser la commission avec BoohPay selon le nouveau plan
    // FREE: 3% + 0.75€, BUSINESS/MAGIC: 1% + 0.75€
    const syncResult = await syncCommissionWithBoohPay(userId, newPlanType);
    if (!syncResult.success) {
      console.warn(`[UpgradePlan] Impossible de synchroniser la commission: ${syncResult.error}`);
      // On continue quand même, ce n'est pas bloquant
    }

    // Récupérer l'abonnement actuel
    const { data: currentSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // Si l'utilisateur a déjà un abonnement BoohPay, le mettre à jour
    if (currentSubscription?.boohpay_subscription_id) {
      // Récupérer le montant du nouveau plan (en EUR)
      const monthlyPrices: Record<PlanType, number> = {
        [PlanType.FREE]: 0,
        [PlanType.BUSINESS]: 20,
        [PlanType.MAGIC]: 40,
      };
      const monthlyPrice = monthlyPrices[newPlanType] || 0;
      const amount = billingInterval === 'year' ? monthlyPrice * 12 * 0.9 : monthlyPrice;
      
      // Mettre à jour l'abonnement BoohPay
      await SubscriptionService.updateSubscription(
        userId,
        currentSubscription.boohpay_subscription_id,
        {
          amount,
          billingInterval,
        }
      );

      // Mettre à jour l'abonnement local
      await supabase
        .from('user_subscriptions')
        .update({
          plan_type: newPlanType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id);
    } else {
      // Si pas d'abonnement BoohPay, juste mettre à jour le plan local
      // (pour compatibilité avec le système actuel)
      if (currentSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({
            plan_type: newPlanType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSubscription.id);
      } else {
        // Créer un nouvel abonnement local (sans BoohPay pour l'instant)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_type: newPlanType,
            status: 'active',
            start_date: new Date().toISOString(),
            auto_renew: false, // Pas d'auto-renew sans BoohPay
          });
      }
    }
  }

  /**
   * Annuler un abonnement récurrent
   */
  static async cancelRecurringSubscription(userId: string): Promise<void> {
    // S'assurer que le merchant BoohPay existe
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Créer le merchant si nécessaire
    await BoohPayMerchantService.getOrCreateMerchant(
      userId,
      user.user_metadata?.full_name || user.email || 'User'
    );

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) {
      throw new Error('Aucun abonnement actif trouvé');
    }

    if (subscription.boohpay_subscription_id) {
      // Annuler l'abonnement BoohPay
      await SubscriptionService.cancelSubscription(
        userId,
        subscription.boohpay_subscription_id
      );
    } else {
      // Annuler l'abonnement local seulement
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }
  }

  /**
   * Synchroniser l'abonnement local avec BoohPay
   */
  static async syncSubscription(userId: string): Promise<void> {
    await SubscriptionService.syncSubscription(userId);
  }
}

