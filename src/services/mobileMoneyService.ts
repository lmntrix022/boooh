import { supabase } from '@/integrations/supabase/client';

/**
 * Configuration eBilling - Utilise les Edge Functions Supabase pour la sécurité
 */
const BILLING_EASY_CONFIG = {
  // Les credentials sont gérés côté serveur via les Edge Functions
  createInvoiceUrl: '/functions/v1/billing-easy-create-invoice',
  checkStatusUrl: '/functions/v1/billing-easy-check-status',
  ussdPushUrl: '/functions/v1/ebilling-ussd-push', // À créer
};

/**
 * Types pour les réponses de l'API eBilling
 */
export interface BillingEasyInvoiceResponse {
  success?: boolean;
  message?: string;
  bill_id?: string;
  reference?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  error?: string;
}

export interface BillingEasyCallbackPayload {
  bill_id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string;
  amount: string;
  payer_msisdn?: string;
  payer_name?: string;
  payer_email?: string;
  transaction_id?: string;
  paid_at?: string;
}

/**
 * Types pour le paiement USSD Push
 */
export interface UssdPushRequest {
  payer_msisdn: string;
  payment_system_name: 'airtelmoney' | 'moovmoney4';
}

export interface UssdPushResponse {
  success?: boolean;
  message?: string;
  status?: string;
  error?: string;
}

/**
 * Données requises pour créer une facture
 */
export interface CreateInvoiceData {
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_msisdn: string; // Numéro de téléphone (Gabon: 06 ou 07)
  short_description: string;
  external_reference?: string; // Référence unique de la commande
  expiry_period?: string; // En minutes (par défaut 60)
}

/**
 * Résultat du statut de paiement
 */
export interface PaymentStatus {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount?: number;
  paid_at?: string;
  reference?: string;
}

/**
 * Service de paiement Mobile Money via eBilling (USSD Push)
 * 
 * ✅ SÉCURISÉ: Utilise les Edge Functions Supabase pour protéger les credentials
 */
export class MobileMoneyService {
  /**
   * Helper pour gérer les erreurs des Edge Functions
   */
  private static async handleEdgeFunctionError(error: any): Promise<never> {
    // Message générique par défaut
    let errorMessage = error?.message || 'Erreur du service de paiement';

    // Supabase FunctionsHttpError expose la réponse HTTP dans error.context (Response)
    try {
      const response = error?.context || error?.context?.response;

      if (response && typeof response.text === 'function') {
        const text = await response.text();

        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.error) {
              errorMessage = parsed.error;
              if (parsed.detail) {
                errorMessage += `: ${typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail)}`;
              }
            } else if (parsed.message) {
              errorMessage = parsed.message;
            }
          } catch {
            // Ce n'est pas du JSON, utiliser le texte brut
            errorMessage = text;
          }
        }
      }
    } catch {
      // On ignore les erreurs de parsing et on garde le message générique
    }

    // Messages d'erreur spécifiques
    if (errorMessage.includes('Configuration BillingEasy manquante')) {
      throw new Error('Service de paiement non configuré. Contactez l\'administrateur.');
    }
    
    if (errorMessage.includes('Champs manquants')) {
      throw new Error('Données de paiement incomplètes. Vérifiez que tous les champs sont remplis.');
    }
    
    if (errorMessage.includes('Opérateur non reconnu')) {
      throw new Error('Numéro de téléphone invalide. Utilisez un numéro Airtel (07) ou Moov (06) du Gabon.');
    }
    
    if (errorMessage.includes('Erreur création facture')) {
      throw new Error('Impossible de créer la facture. Veuillez réessayer ou contacter le support.');
    }
    
    if (errorMessage.includes('Erreur USSD Push')) {
      throw new Error('Impossible d\'envoyer la demande de paiement. Vérifiez votre numéro de téléphone.');
    }
    
    throw new Error(errorMessage);
  }

  /**
   * ÉTAPE 1: Créer une facture (e_bill) sur eBilling via Edge Function
   * Retourne le bill_id nécessaire pour le USSD Push
   */
  static async createInvoice(_data: CreateInvoiceData): Promise<BillingEasyInvoiceResponse> {
    throw new Error('Le paiement est désactivé pour le moment.');
  }

  /**
   * ÉTAPE 2: Détecter automatiquement le système de paiement
   * Gabon: 06 = Moov Money, 07 = Airtel Money
   */
  static detectPaymentSystem(phoneNumber: string): 'airtelmoney' | 'moovmoney4' | null {
    const cleanPhone = phoneNumber.replace(/\s|-|\+/g, '');

    // Numéros commençant par 07 (avec ou sans indicatif pays 241)
    if (/^(241)?07/.test(cleanPhone)) {
      return 'airtelmoney';
    }

    // Numéros commençant par 06 (avec ou sans indicatif pays 241)
    if (/^(241)?06/.test(cleanPhone)) {
      return 'moovmoney4';
    }

    return null;
  }

  /**
   * ÉTAPE 3: Envoyer une requête USSD Push à l'utilisateur
   * L'utilisateur recevra une notification sur son téléphone pour confirmer le paiement
   */
  static async sendUssdPush(_bill_id: string, _payer_msisdn: string): Promise<UssdPushResponse> {
    throw new Error('Le paiement est désactivé pour le moment.');
  }

  /**
   * 🚀 WORKFLOW COMPLET: Créer une facture ET envoyer un USSD Push
   * Utilise la fonction 'pay' qui est testée et fonctionnelle
   * 
   * @returns Informations de la transaction + instructions pour l'utilisateur
   */
  static async initiateUssdPayment(
    invoiceData: CreateInvoiceData
  ): Promise<{
    bill_id: string;
    reference: string;
    payment_system: 'airtelmoney' | 'moovmoney4';
    amount: number;
    instructions: string;
  }> {
    try {
      // Validation des champs requis
      if (!invoiceData.amount || invoiceData.amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }
      
      if (!invoiceData.payer_name || !invoiceData.payer_email || !invoiceData.payer_msisdn) {
        throw new Error('Tous les champs sont requis (nom, email, téléphone)');
      }

      // S'assurer que le montant est un nombre
      const amount = typeof invoiceData.amount === 'string' 
        ? parseFloat(invoiceData.amount) 
        : Number(invoiceData.amount);

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Montant invalide');
      }

      // Appeler la fonction 'pay' qui est testée et fonctionnelle
      const { data, error } = await supabase.functions.invoke('pay', {
        body: {
          amount: amount,
          payer_name: String(invoiceData.payer_name).trim(),
          payer_email: String(invoiceData.payer_email).trim(),
          payer_msisdn: String(invoiceData.payer_msisdn).trim(),
          short_description: invoiceData.short_description || 'Paiement e-commerce',
          external_reference: invoiceData.external_reference || `ECOMMERCE-${Date.now()}`,
          expiry_period: invoiceData.expiry_period || '60',
        },
      });

      if (error) {
        // Log l'erreur complète pour le debug
        console.error('❌ Erreur Edge Function pay:', {
          error,
          errorMessage: error?.message,
          errorContext: error?.context,
          body: error?.context?.body,
        });
        await this.handleEdgeFunctionError(error);
      }

      if (!data || !data.bill_id) {
        console.error('❌ Réponse invalide de l\'Edge Function pay:', data);
        throw new Error('Réponse invalide de l\'Edge Function. Contactez l\'administrateur.');
      }

      // Détecter l'opérateur pour le retour
      const paymentSystem = this.detectPaymentSystem(invoiceData.payer_msisdn) || 
                           (data.payment_system as 'airtelmoney' | 'moovmoney4') || 
                           'airtelmoney';

      return {
        bill_id: data.bill_id,
        reference: data.reference || invoiceData.external_reference || data.bill_id,
        payment_system: paymentSystem,
        amount: invoiceData.amount,
        instructions: data.instructions || `Une demande de paiement a été envoyée sur votre téléphone ${this.formatPhoneNumber(invoiceData.payer_msisdn)}. Veuillez composer le code USSD affiché et confirmer le paiement de ${invoiceData.amount.toLocaleString('fr-FR')} FCFA.`,
      };
    } catch (error: any) {
      await this.handleEdgeFunctionError(error);
    }
  }

  /**
   * Vérifier le statut d'un paiement via bill_id via Edge Function
   * Utilisez cette méthode pour le polling du statut
   */
  static async checkPaymentStatus(bill_id: string): Promise<PaymentStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('billing-easy-check-status', {
        body: { bill_id },
      });

      if (error) {
        // Log l'erreur complète pour le debug
        console.error('❌ Erreur Edge Function pay:', {
          error,
          errorMessage: error?.message,
          errorContext: error?.context,
          body: error?.context?.body,
        });
        await this.handleEdgeFunctionError(error);
      }

      if (!data) {
        throw new Error('Réponse invalide de l\'Edge Function.');
      }

      return {
        status: data.status || 'PENDING',
        amount: data.amount,
        paid_at: data.paid_at,
        reference: data.reference || bill_id,
      };
    } catch (error: any) {
      await this.handleEdgeFunctionError(error);
    }
  }

  /**
   * Valider le callback reçu de eBilling
   * À utiliser dans votre endpoint backend /api/ebilling/callback
   */
  static validateCallback(payload: BillingEasyCallbackPayload): boolean {
    // Vérifier que les champs essentiels sont présents
    if (!payload.bill_id || !payload.status || !payload.reference) {
      // Error log removed
      return false;
    }

    return true;
  }

  /**
   * Formater un numéro de téléphone pour l'affichage
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\s|-|\+/g, '');

    // Format: +241 XX XX XX XX (Gabon)
    if (cleanPhone.startsWith('241') && cleanPhone.length >= 11) {
      return `+241 ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 7)} ${cleanPhone.slice(7, 9)} ${cleanPhone.slice(9, 11)}`;
    }

    // Sans indicatif pays
    if (cleanPhone.length >= 8 && !cleanPhone.startsWith('241')) {
      return `+241 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 6)} ${cleanPhone.slice(6, 8)}`;
    }

    // Format par défaut
    return phoneNumber;
  }

  /**
   * Valider un numéro de téléphone Mobile Money (Gabon)
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\s|-|\+/g, '');

    // Doit avoir au moins 8 chiffres
    if (cleanPhone.length < 8) {
      return false;
    }

    // Doit être un opérateur reconnu (Airtel ou Moov)
    return this.detectPaymentSystem(cleanPhone) !== null;
  }

  /**
   * Obtenir le nom lisible d'un système de paiement
   */
  static getOperatorName(operator: string): string {
    const operatorNames: Record<string, string> = {
      airtelmoney: 'Airtel Money',
      moovmoney4: 'Moov Money',
    };

    return operatorNames[operator] || operator;
  }

  /**
   * Obtenir des informations sur un numéro de téléphone
   */
  static getPhoneInfo(phoneNumber: string): {
    isValid: boolean;
    operator: 'airtelmoney' | 'moovmoney4' | null;
    operatorName: string;
    formatted: string;
  } {
    const operator = this.detectPaymentSystem(phoneNumber);
    const isValid = this.validatePhoneNumber(phoneNumber);
    const operatorName = operator ? this.getOperatorName(operator) : 'Inconnu';
    const formatted = this.formatPhoneNumber(phoneNumber);

    return {
      isValid,
      operator,
      operatorName,
      formatted,
    };
  }
}

/**
 * Helper pour créer une référence unique de commande
 */
export function generateOrderReference(orderId: string, type: 'physical' | 'digital' = 'digital'): string {
  const prefix = type === 'physical' ? 'PHY' : 'DIG';
  const timestamp = Date.now().toString(36).toUpperCase();
  const shortId = orderId.split('-')[0].toUpperCase();
  return `${prefix}-${shortId}-${timestamp}`;
}

/**
 * Helper pour formater un montant en FCFA
 */
export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Helper pour valider un montant
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Le montant doit être supérieur à 0 FCFA' };
  }
  if (amount > 5000000) {
    return { valid: false, error: 'Le montant dépasse la limite autorisée (5,000,000 FCFA)' };
  }
  return { valid: true };
}
