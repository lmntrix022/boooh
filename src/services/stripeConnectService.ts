import { supabase } from '@/integrations/supabase/client';

export interface StripeConnectAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_type: 'standard' | 'express' | 'custom';
  email: string | null;
  country: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarded: boolean;
  onboarding_url: string | null;
  dashboard_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  email: string;
  country?: string;
  return_url?: string;
  refresh_url?: string;
}

export interface CreateAccountResponse {
  account_id: string;
  onboarding_url: string;
  dashboard_url?: string;
  onboarded: boolean;
  existing?: boolean;
}

export interface CreateConnectPaymentRequest {
  amount: number; // Montant en EUR
  currency?: string;
  card_id: string;
  product_id?: string;
  digital_product_id?: string;
  order_id: string;
  order_type: 'physical' | 'digital';
  customer_email: string;
  customer_name: string;
  commission_rate?: number;
  commission_fixed?: number;
}

export interface CreateConnectPaymentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  platform_fee: number;
  seller_amount: number;
}

/**
 * Service pour gérer Stripe Connect
 */
export class StripeConnectService {
  /**
   * Récupérer le compte Stripe Connect de l'utilisateur
   */
  static async getAccount(userId?: string): Promise<StripeConnectAccount | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return null;
    }

    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as StripeConnectAccount;
  }

  /**
   * Vérifier et mettre à jour le statut du compte Stripe Connect
   */
  static async checkStatus(): Promise<{
    onboarded: boolean;
    dashboard_url: string | null;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-connect-check-status');

    if (error) {
      throw new Error(error.message || 'Erreur lors de la vérification du statut');
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Erreur lors de la vérification du statut');
    }

    return data;
  }

  /**
   * Créer un compte Stripe Connect Express
   */
  static async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase.functions.invoke('stripe-connect-create-account', {
      body: {
        user_id: user.id,
        email: request.email,
        country: request.country || 'FR',
        return_url: request.return_url,
        refresh_url: request.refresh_url,
      },
    });

    if (error) {
      // Propager l'erreur avec les détails
      const errorDetails = data || {};
      const err = new Error(error.message || data?.error || 'Erreur lors de la création du compte Stripe Connect');
      (err as any).connectNotActivated = errorDetails.connectNotActivated;
      (err as any).helpUrl = errorDetails.helpUrl;
      (err as any).error = data?.error || error.message;
      throw err;
    }

    if (!data || data.error) {
      // Propager l'erreur avec les détails
      const err = new Error(data?.error || 'Erreur lors de la création du compte Stripe Connect');
      (err as any).connectNotActivated = data?.connectNotActivated;
      (err as any).helpUrl = data?.helpUrl;
      (err as any).error = data?.error;
      throw err;
    }

    return data as CreateAccountResponse;
  }

  /**
   * Créer un paiement avec transfert vers le compte connecté
   */
  static async createPayment(request: CreateConnectPaymentRequest): Promise<CreateConnectPaymentResponse> {
    const { data, error } = await supabase.functions.invoke('stripe-connect-create-payment', {
      body: request,
    });

    if (error) {
      if (error.message?.includes('STRIPE_CONNECT_NOT_SETUP')) {
        throw new Error('Le vendeur n\'a pas configuré Stripe Connect. Veuillez contacter le vendeur.');
      }
      throw new Error(error.message || 'Erreur lors de la création du paiement');
    }

    return data as CreateConnectPaymentResponse;
  }

  /**
   * Vérifier si un utilisateur a un compte Stripe Connect actif
   */
  static async isAccountActive(userId?: string): Promise<boolean> {
    const account = await this.getAccount(userId);
    return account?.onboarded === true && account?.charges_enabled === true;
  }

  /**
   * Obtenir l'URL du dashboard Stripe
   */
  static async getDashboardUrl(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.dashboard_url || null;
  }

  /**
   * Obtenir les statistiques de transactions
   */
  static async getStats() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('stripe_connect_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }
}

