import { supabase } from '@/integrations/supabase/client';

export interface StripeCheckoutRequest {
  amount: number; // Montant en EUR (l'Edge Function le convertira en centimes)
  currency: string;
  order_id: string;
  order_type: 'physical' | 'digital';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  success_url: string;
  cancel_url: string;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface StripePaymentStatus {
  status: 'paid' | 'unpaid' | 'complete' | 'pending';
  payment_intent_id?: string;
  customer_email?: string;
}

/**
 * Service pour gérer les paiements Stripe
 */
export class StripePaymentService {
  /**
   * Créer une session Stripe Checkout
   */
  static async createCheckoutSession(request: StripeCheckoutRequest): Promise<StripeCheckoutResponse> {
    const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: request,
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de la création de la session Stripe');
    }

    if (!data?.checkout_url || !data?.session_id) {
      throw new Error('Réponse invalide de la session Stripe');
    }

    return {
      checkout_url: data.checkout_url,
      session_id: data.session_id,
    };
  }

  /**
   * Vérifier le statut d'un paiement Stripe
   */
  static async checkPaymentStatus(sessionId: string): Promise<StripePaymentStatus> {
    const { data, error } = await supabase.functions.invoke('stripe-check-status', {
      body: { session_id: sessionId },
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de la vérification du statut');
    }

    return data as StripePaymentStatus;
  }
}

