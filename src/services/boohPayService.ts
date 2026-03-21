import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Service pour communiquer avec l'API BoohPay
 * BoohPay est l'orchestrateur de paiements qui gère Stripe, Moneroo, et eBilling
 */

export interface BoohPayConfig {
  baseUrl: string; // Ex: http://localhost:3000 ou https://api.boohpay.com
  apiKey: string; // API Key du marchand
}

export enum PaymentMethod {
  Card = 'CARD',
  MobileMoney = 'MOBILE_MONEY',
  Momo = 'MOMO',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export interface CustomerInfo {
  email?: string;
  phone?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number; // Montant en unités mineures (centimes pour EUR, FCFA pour XOF)
  currency: string; // ISO 4217 (EUR, XOF, USD)
  countryCode: string; // ISO 3166-1 alpha-2 (FR, SN, GA)
  paymentMethod: PaymentMethod;
  customer?: CustomerInfo;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
}

export interface CheckoutPayload {
  type: 'CLIENT_SECRET' | 'REDIRECT';
  clientSecret?: string;
  url?: string;
  publishableKey?: string;
  stripeAccount?: string;
}

export interface PaymentResponse {
  paymentId: string;
  merchantId: string;
  orderId: string;
  gatewayUsed: 'STRIPE' | 'MONEROO' | 'EBILLING';
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerReference?: string;
  checkout?: CheckoutPayload;
  metadata?: Record<string, unknown>;
  events?: Array<{
    type: string;
    at: string;
    providerEventId?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMerchantRequest {
  name: string;
  apiKeyLabel?: string;
}

export interface MerchantResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyResponse {
  apiKey: string;
  label?: string;
  merchantId: string;
  createdAt: string;
}

export interface SubscriptionRequest {
  merchantId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionResponse {
  id: string;
  merchantId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export class BoohPayService {
  private axiosInstance: AxiosInstance;
  private config: BoohPayConfig | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialiser le service avec la configuration
   */
  initialize(config: BoohPayConfig): void {
    this.config = config;
    this.axiosInstance.defaults.baseURL = config.baseUrl;
    this.axiosInstance.defaults.headers.common['x-api-key'] = config.apiKey;
  }

  /**
   * Vérifier si le service est initialisé
   */
  private ensureInitialized(): void {
    if (!this.config) {
      throw new Error('BoohPayService n\'est pas initialisé. Appelez initialize() d\'abord.');
    }
  }

  /**
   * Générer une clé d'idempotence unique
   */
  private generateIdempotencyKey(orderId: string): string {
    return `${orderId}-${Date.now()}`;
  }

  /**
   * Créer un paiement (Helper pour ticketing)
   */
  async initiatePayment(request: {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    metadata?: Record<string, any>;
  }, apiKey?: string): Promise<{ transactionId: string; paymentUrl: string }> {
    this.ensureInitialized();

    // Générer un ID commande unique si non fourni dans les métadonnées
    const orderId = (request.metadata?.ticket_id as string) || `ORD-${Date.now()}`;

    const paymentResponse = await this.createPayment({
      orderId,
      amount: request.amount,
      currency: request.currency,
      countryCode: 'GA', // Défaut Gabon pour l'instant
      paymentMethod: PaymentMethod.MobileMoney, // Défaut Mobile Money, l'utilisateur choisira sur la page de paiement
      customer: {
        email: request.customerEmail,
        phone: request.customerPhone,
      },
      metadata: {
        ...request.metadata,
        description: request.description,
        customerName: request.customerName,
      },
      returnUrl: window.location.origin + '/payment/callback', // Call back URL
    }, apiKey);

    // Construit l'URL de paiement basée sur la réponse (ou une URL de checkout)
    // Note: Dans une vraie intégration, cela dépendrait de la réponse de la gateway orchestrée
    const checkoutUrl = paymentResponse.checkout?.url ||
      (paymentResponse.paymentId ? `${this.config?.baseUrl}/checkout/${paymentResponse.paymentId}` : '');

    if (!checkoutUrl) {
      throw new Error('Impossible de générer l\'URL de paiement');
    }

    return {
      transactionId: paymentResponse.paymentId,
      paymentUrl: checkoutUrl,
    };
  }

  /**
   * Créer un paiement
   */
  async createPayment(request: CreatePaymentRequest, apiKey?: string): Promise<PaymentResponse> {
    this.ensureInitialized();

    const idempotencyKey = this.generateIdempotencyKey(request.orderId);

    // Utiliser la clé fournie ou celle de la config
    const requestApiKey = apiKey || this.config?.apiKey;

    if (!requestApiKey) {
      throw new Error('API Key manquante pour le paiement');
    }

    try {
      const response = await this.axiosInstance.post<PaymentResponse>(
        '/v1/payments',
        request,
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
            'x-api-key': requestApiKey
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // Améliorer le formatage des erreurs pour afficher les détails
        let errorMessage = `Erreur BoohPay: ${error.message}`;

        if (error.response?.data) {
          const errorData = error.response.data;

          // Si c'est un objet avec des erreurs détaillées
          if (errorData.errors && typeof errorData.errors === 'object') {
            const errorDetails = Object.entries(errorData.errors)
              .map(([key, value]: [string, any]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            errorMessage = errorData.message
              ? `${errorData.message} (${errorDetails})`
              : errorDetails;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }

        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Récupérer le statut d'un paiement
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.get<PaymentResponse>(
        `/v1/payments/${paymentId}`
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error('Paiement non trouvé');
        }
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Créer un remboursement
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refundId: string; status: string; amount: number }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.post(
        `/v1/payments/${paymentId}/refund`,
        {
          amount,
          reason,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Créer un marchand (admin seulement)
   */
  async createMerchant(
    request: CreateMerchantRequest,
    adminToken: string
  ): Promise<{ merchantId: string; apiKey: string }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.post<{ merchantId: string; apiKey: string }>(
        '/v1/internal/merchants',
        request,
        {
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // Log full error details for debugging
        console.error('BoohPay Create Merchant Error Details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });

        throw new Error(
          JSON.stringify(error.response?.data || error.message, null, 2)
        );
      }
      throw error;
    }
  }


  /**
   * Générer un magic link pour l'accès au dashboard marchand
   */
  async generateMerchantMagicLink(
    merchantId: string,
    adminToken: string
  ): Promise<{ magicLink: string; expiresAt: string; token: string }> {
    this.ensureInitialized();

    try {
      console.log('Generating magic link for merchant:', merchantId);

      const response = await this.axiosInstance.post<{
        magic_link: string;
        expires_at: string;
        token: string;
      }>(
        `/v1/internal/merchants/${merchantId}/magic-link`,
        {},
        {
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      console.log('Magic link generated successfully');

      return {
        magicLink: response.data.magic_link,
        expiresAt: response.data.expires_at,
        token: response.data.token,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('BoohPay Generate Magic Link Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(
          `Erreur lors de la génération du magic link: ${JSON.stringify(error.response?.data || error.message, null, 2)}`
        );
      }
      throw error;
    }
  }

  /**
   * Créer une clé API pour un marchand (admin seulement)
   */
  async createApiKey(
    merchantId: string,
    label?: string,
    adminToken?: string
  ): Promise<ApiKeyResponse> {
    this.ensureInitialized();

    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
      }

      const response = await this.axiosInstance.post<ApiKeyResponse>(
        `/v1/internal/merchants/${merchantId}/api-keys`,
        { label },
        { headers }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Créer une subscription
   */
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.post<SubscriptionResponse>(
        '/v1/admin/subscriptions',
        request
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Récupérer une subscription
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.get<SubscriptionResponse>(
        `/v1/admin/subscriptions/${subscriptionId}`
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Mettre à jour une subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<SubscriptionRequest>
  ): Promise<SubscriptionResponse> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.put<SubscriptionResponse>(
        `/v1/admin/subscriptions/${subscriptionId}`,
        updates
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Annuler une subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAt?: Date
  ): Promise<SubscriptionResponse> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.delete<SubscriptionResponse>(
        `/v1/admin/subscriptions/${subscriptionId}`,
        {
          data: cancelAt ? { cancelAt: cancelAt.toISOString() } : undefined,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Configuration des credentials des providers
   * Note: Pour Stripe, utiliser Stripe Connect (createStripeConnectLink)
   */

  /**
   * Créer un lien d'onboarding Stripe Connect
   */
  async createStripeConnectLink(
    refreshUrl: string,
    returnUrl: string
  ): Promise<{ accountId: string; url: string; expiresAt: number }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.post<{ accountId: string; url: string; expiresAt: number }>(
        '/v1/providers/stripe/connect/link',
        {
          refreshUrl,
          returnUrl,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        let errorMessage = `Erreur BoohPay: ${error.message}`;

        if (error.response?.data) {
          const errorData = error.response.data;

          // Si c'est un objet avec des erreurs détaillées
          if (errorData.errors && typeof errorData.errors === 'object') {
            const errorDetails = Object.entries(errorData.errors)
              .map(([key, value]: [string, any]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            errorMessage = errorData.message
              ? `${errorData.message} (${errorDetails})`
              : errorDetails;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }

        console.error('Erreur Stripe Connect:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
        });

        // Si c'est une erreur de validation, extraire les détails
        if (error.response?.status === 400) {
          // Vérifier différentes structures de réponse d'erreur
          const errorData = error.response?.data;
          const validationErrors =
            errorData?.error?.errors ||
            errorData?.errors ||
            errorData?.error?.message === 'Validation failed' && errorData?.error?.errors;

          if (validationErrors && typeof validationErrors === 'object') {
            const errorDetails = Object.entries(validationErrors)
              .map(([key, value]: [string, any]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            errorMessage = `Erreur de validation: ${errorDetails}`;
          } else if (errorData?.error?.message && errorData.error.message !== 'Validation failed') {
            errorMessage = errorData.error.message;
          }
        }

        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Obtenir le statut du compte Stripe Connect
   */
  async getStripeConnectStatus(): Promise<{
    connected: boolean;
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.get<{
        connected: boolean;
        accountId?: string;
        chargesEnabled?: boolean;
        payoutsEnabled?: boolean;
        detailsSubmitted?: boolean;
      }>('/v1/providers/stripe/connect/status');

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async setMonerooCredentials(
    secretKey: string,
    publicKey?: string,
    walletId?: string,
    environment: 'production' | 'sandbox' = 'production'
  ): Promise<{ ok: boolean }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.put<{ ok: boolean }>(
        '/v1/providers/moneroo/credentials',
        {
          secretKey,
          publicKey,
          walletId,
          environment,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async setEbillingCredentials(
    username: string,
    sharedKey: string,
    baseUrl?: string,
    environment: 'production' | 'sandbox' = 'production'
  ): Promise<{ ok: boolean }> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.put<{ ok: boolean }>(
        '/v1/providers/ebilling/credentials',
        {
          username,
          sharedKey,
          baseUrl,
          environment,
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          `Erreur BoohPay: ${error.message}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Récupérer le statut de tous les providers
   * Appelle chaque endpoint de statut individuellement
   */
  async getProvidersStatus(apiKey?: string): Promise<{
    stripe: {
      provider: string;
      configured: boolean;
      environment: string | null;
      connected?: boolean;
      accountId?: string;
      chargesEnabled?: boolean;
      payoutsEnabled?: boolean;
    };
    moneroo: {
      provider: string;
      configured: boolean;
      environment: string | null;
      connected?: boolean;
    };
    ebilling: {
      provider: string;
      configured: boolean;
      environment: string | null;
      connected?: boolean;
    };
    shap: {
      provider: string;
      configured: boolean;
      environment: string | null;
      connected?: boolean;
    };
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Utiliser la clé API passée en paramètre ou celle de la config
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (this.config?.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const baseUrl = this.config?.baseUrl || import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000';

    // Appeler chaque endpoint de statut en parallèle
    const [stripeRes, ebillingRes, monerooRes, shapRes] = await Promise.allSettled([
      axios.get(`${baseUrl}/v1/providers/stripe/connect/status`, { headers }),
      axios.get(`${baseUrl}/v1/providers/ebilling/onboarding/status`, { headers }),
      axios.get(`${baseUrl}/v1/providers/moneroo/onboarding/status`, { headers }),
      axios.get(`${baseUrl}/v1/providers/shap/onboarding/status`, { headers }),
    ]);

    // Extraire les données ou utiliser les valeurs par défaut
    const getStatusData = (result: PromiseSettledResult<any>, provider: string) => {
      if (result.status === 'fulfilled') {
        const data = result.value.data;
        return {
          provider,
          configured: data.connected || data.hasCredentials || false,
          environment: data.environment || null,
          connected: data.connected || false,
          ...(provider === 'STRIPE' && {
            accountId: data.accountId,
            chargesEnabled: data.chargesEnabled,
            payoutsEnabled: data.payoutsEnabled,
          }),
        };
      }
      return {
        provider,
        configured: false,
        environment: null,
        connected: false,
      };
    };

    return {
      stripe: getStatusData(stripeRes, 'STRIPE') as any,
      ebilling: getStatusData(ebillingRes, 'EBILLING') as any,
      moneroo: getStatusData(monerooRes, 'MONEROO') as any,
      shap: getStatusData(shapRes, 'SHAP') as any,
    };
  }

  // ============================================
  // GESTION DES COMMISSIONS
  // ============================================

  /**
   * Mettre à jour la commission de l'app (Bööh) pour ce marchand
   * Cette commission sera prélevée sur chaque vente EN PLUS des frais BoohPay
   * 
   * @param rate - Taux de commission (ex: 0.03 = 3%)
   * @param fixed - Commission fixe en centimes (ex: 75 = 0.75€)
   */
  async updateAppCommission(
    rate: number,
    fixed: number,
    apiKey?: string
  ): Promise<{ success: boolean; merchant?: any }> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (this.config?.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    try {
      const response = await this.axiosInstance.patch(
        '/v1/merchants/me/commission',
        { rate, fixed },
        { headers }
      );

      return {
        success: true,
        merchant: response.data?.merchant,
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commission:', error);
      return { success: false };
    }
  }

  /**
   * Simuler les frais pour un montant donné
   * Retourne le détail: frais BoohPay + commission Bööh
   * 
   * @param amount - Montant en centimes
   */
  async simulateFees(
    amount: number,
    apiKey?: string
  ): Promise<{
    amount: number;
    breakdown: {
      boohpayFee: { amount: number; description: string };
      appCommission: { amount: number; description: string };
      totalFees: number;
      sellerReceives: number;
    };
    formatted: {
      amount: string;
      boohpayFee: string;
      appCommission: string;
      totalFees: string;
      sellerReceives: string;
    };
  } | null> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (this.config?.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    try {
      const response = await this.axiosInstance.get(
        `/v1/merchants/me/fees/simulate/${amount}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la simulation des frais:', error);
      return null;
    }
  }

  /**
   * Récupérer les informations du marchand (y compris sa commission)
   */
  async getMerchantInfo(apiKey?: string): Promise<{
    id: string;
    name: string;
    appCommissionRate: number;
    appCommissionFixed: number;
    boohpayFees: {
      rate: number;
      fixed: number;
      description: string;
    };
  } | null> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (this.config?.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    try {
      const response = await this.axiosInstance.get('/v1/merchants/me', { headers });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos marchand:', error);
      return null;
    }
  }
}

// Instance singleton
export const boohPayService = new BoohPayService();

