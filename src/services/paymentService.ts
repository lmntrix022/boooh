/**
 * Service de paiement unifié utilisant BoohPay
 * 
 * Ce service remplace stripePaymentService et mobileMoneyService
 * et utilise l'API BoohPay pour tous les paiements
 */

import { boohPayService, PaymentMethod, PaymentStatus, type CreatePaymentRequest, type PaymentResponse } from './boohPayService';
import { BoohPayMerchantService } from './boohPayMerchantService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Convertir EUR en centimes ou XOF en FCFA
 */
function convertToMinorUnits(amount: number, currency: string): number {
  // Les devises XOF sont déjà en unités mineures (FCFA)
  if (currency === 'XOF' || currency === 'FCFA') {
    return Math.round(amount);
  }
  
  // Pour EUR, USD, etc., convertir en centimes
  return Math.round(amount * 100);
}

/**
 * Convertir les unités mineures en unités principales
 */
function convertFromMinorUnits(amount: number, currency: string): number {
  if (currency === 'XOF' || currency === 'FCFA') {
    return amount;
  }
  
  return amount / 100;
}

export interface PaymentRequest {
  orderId: string;
  amount: number; // Montant en unités principales (EUR, XOF)
  currency: string;
  paymentMethod: PaymentMethod;
  customer?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  returnUrl?: string;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  checkout?: {
    type: 'CLIENT_SECRET' | 'REDIRECT';
    clientSecret?: string;
    url?: string;
    publishableKey?: string;
    stripeAccount?: string; // Pour Stripe Connect
  };
  gatewayUsed: 'STRIPE' | 'MONEROO' | 'EBILLING';
}

/**
 * Service de paiement unifié via BoohPay
 */
export class PaymentService {
  /**
   * Créer un paiement via BoohPay
   */
  static async createPayment(
    userId: string,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // Initialiser BoohPay pour l'utilisateur
    const initialized = await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    if (!initialized) {
      // Créer automatiquement un merchant si nécessaire
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      const merchant = await BoohPayMerchantService.getOrCreateMerchant(
        userId,
        user.user_metadata?.full_name || user.email || 'User'
      );
      
      await BoohPayMerchantService.initializeBoohPayForUser(userId);
    }

    // Convertir le montant en unités mineures
    const amountMinor = convertToMinorUnits(request.amount, request.currency);

    // Détecter le code pays depuis le numéro de téléphone
    // Pour Mobile Money, on doit utiliser un pays supporté par Moneroo ou EBILLING
    let countryCode: string | null = null;
    
    if (request.customer?.phone) {
      const phone = request.customer.phone.replace(/\s/g, '');
      
      // Mapping des indicatifs téléphoniques vers les codes pays
      // Basé sur la logique de BoohPay : GA → EBILLING, autres pays africains → MONEROO
      if (phone.startsWith('+241') || phone.startsWith('241')) {
        countryCode = 'GA'; // Gabon → EBILLING
      } else if (phone.startsWith('+221') || phone.startsWith('221')) {
        countryCode = 'SN'; // Sénégal → MONEROO
      } else if (phone.startsWith('+225') || phone.startsWith('225')) {
        countryCode = 'CI'; // Côte d'Ivoire → MONEROO
      } else if (phone.startsWith('+237') || phone.startsWith('237')) {
        countryCode = 'CM'; // Cameroun → MONEROO
      } else if (phone.startsWith('+254') || phone.startsWith('254')) {
        countryCode = 'KE'; // Kenya → MONEROO
      } else if (phone.startsWith('+234') || phone.startsWith('234')) {
        countryCode = 'NG'; // Nigeria → MONEROO
      } else if (phone.startsWith('+233') || phone.startsWith('233')) {
        countryCode = 'GH'; // Ghana → MONEROO
      } else if (phone.startsWith('+256') || phone.startsWith('256')) {
        countryCode = 'UG'; // Ouganda → MONEROO
      } else if (phone.startsWith('+255') || phone.startsWith('255')) {
        countryCode = 'TZ'; // Tanzanie → MONEROO
      } else if (phone.startsWith('+250') || phone.startsWith('250')) {
        countryCode = 'RW'; // Rwanda → MONEROO
      } else if (phone.startsWith('+27') || phone.startsWith('27')) {
        countryCode = 'ZA'; // Afrique du Sud → MONEROO
      } else if (phone.startsWith('+33') || phone.startsWith('33')) {
        // France : pour Mobile Money, on ne peut pas utiliser FR avec XOF
        // Si la devise est XOF, on ne peut pas utiliser Mobile Money pour FR
        if (request.currency === 'XOF' && request.paymentMethod === PaymentMethod.MobileMoney) {
          // Pour XOF avec Mobile Money, utiliser un pays par défaut supporté
          countryCode = 'SN'; // Sénégal par défaut pour XOF
        } else {
          countryCode = 'FR';
        }
      }
    }
    
    // Si on n'a pas détecté de pays et que c'est Mobile Money
    if (!countryCode) {
      if (request.paymentMethod === PaymentMethod.MobileMoney || request.paymentMethod === PaymentMethod.Momo) {
        // Pour Mobile Money, utiliser un pays par défaut selon la devise
        if (request.currency === 'XOF') {
          countryCode = 'SN'; // Sénégal par défaut pour XOF (supporté par MONEROO)
        } else if (request.currency === 'EUR') {
          // Pour EUR, on ne peut pas vraiment utiliser Mobile Money
          // Utiliser FR mais cela pourrait échouer selon le provider
          countryCode = 'FR';
        } else {
          // Autres devises : utiliser un pays africain par défaut
          countryCode = 'SN';
        }
      } else {
        // Pour les autres méthodes de paiement, utiliser FR par défaut
        countryCode = 'FR';
      }
    }

    // Créer la requête BoohPay
    const boohPayRequest: CreatePaymentRequest = {
      orderId: request.orderId,
      amount: amountMinor,
      currency: request.currency,
      countryCode,
      paymentMethod: request.paymentMethod,
      customer: {
        email: request.customer?.email,
        phone: request.customer?.phone,
      },
      metadata: request.metadata,
      returnUrl: request.returnUrl,
    };

    try {
      const response = await boohPayService.createPayment(boohPayRequest);

      return {
        paymentId: response.paymentId,
        status: response.status as PaymentStatus,
        checkout: response.checkout,
        gatewayUsed: response.gatewayUsed,
      };
    } catch (error: any) {
      console.error('Erreur lors de la création du paiement BoohPay:', error);
      throw new Error(`Erreur de paiement: ${error.message}`);
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  static async checkPaymentStatus(
    userId: string,
    paymentId: string
  ): Promise<PaymentResponse> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    return await boohPayService.getPayment(paymentId);
  }

  /**
   * Créer un remboursement
   */
  static async createRefund(
    userId: string,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refundId: string; status: string; amount: number }> {
    await BoohPayMerchantService.initializeBoohPayForUser(userId);
    
    return await boohPayService.createRefund(paymentId, amount, reason);
  }

  /**
   * Créer un paiement Stripe (cartes bancaires)
   * 
   * @param userId - ID de l'utilisateur/vendeur
   * @param orderId - ID de la commande
   * @param amount - Montant en EUR
   * @param currency - Devise (EUR)
   * @param customerInfo - Informations du client
   * @param returnUrl - URL de retour après paiement
   * @param connectMetadata - Métadonnées pour Stripe Connect (cardId, productId, etc.)
   */
  static async createStripePayment(
    userId: string,
    orderId: string,
    amount: number,
    currency: string,
    customerInfo: {
      email: string;
      name?: string;
      phone?: string;
    },
    returnUrl?: string,
    connectMetadata?: {
      cardId?: string;
      productId?: string;
      digitalProductId?: string;
      orderType?: 'physical' | 'digital';
      commissionRate?: number;
    }
  ): Promise<PaymentResult> {
    return await this.createPayment(userId, {
      orderId,
      amount,
      currency,
      paymentMethod: PaymentMethod.Card,
      customer: {
        email: customerInfo.email,
        phone: customerInfo.phone,
      },
      metadata: {
        customer_name: customerInfo.name,
        // Métadonnées pour Stripe Connect via BoohPay
        card_id: connectMetadata?.cardId,
        product_id: connectMetadata?.productId,
        digital_product_id: connectMetadata?.digitalProductId,
        order_type: connectMetadata?.orderType,
        commission_rate: connectMetadata?.commissionRate || 5.0, // 5% par défaut
      },
      returnUrl,
    });
  }

  /**
   * Créer un paiement Mobile Money
   */
  static async createMobileMoneyPayment(
    userId: string,
    orderId: string,
    amount: number,
    currency: string,
    customerInfo: {
      email: string;
      phone: string;
      name?: string;
    },
    returnUrl?: string
  ): Promise<PaymentResult> {
    // Pour le Gabon avec EBILLING, le numéro doit être au format local (074398524)
    // BoohPay convertira automatiquement en format normalisé pour EBILLING
    // Pour les autres pays avec Moneroo, le format international est accepté
    
    let phoneNumber = customerInfo.phone;
    
    // Si le numéro commence par +241 (format international pour Gabon)
    // et qu'on détecte que c'est pour le Gabon, on peut le garder tel quel
    // BoohPay/EBILLING gérera la normalisation
    // Sinon, on laisse tel quel car BoohPay gère le formatage
    
    return await this.createPayment(userId, {
      orderId,
      amount,
      currency,
      paymentMethod: PaymentMethod.MobileMoney,
      customer: {
        email: customerInfo.email,
        phone: phoneNumber, // BoohPay formatera le numéro selon le provider
      },
      metadata: {
        customer_name: customerInfo.name,
      },
      returnUrl, // BoohPay nettoiera les placeholders dans l'URL
    });
  }
}

