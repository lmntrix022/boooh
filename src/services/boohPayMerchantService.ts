import { supabase } from '@/integrations/supabase/client';
import { boohPayService, type ApiKeyResponse } from './boohPayService';

/**
 * Service pour gérer les merchants BoohPay associés aux utilisateurs Bööh
 * 
 * Chaque utilisateur Bööh peut avoir un merchant BoohPay associé
 * qui permet de recevoir des paiements via l'API BoohPay
 */

export interface BoohPayMerchant {
  id: string;
  user_id: string;
  boohpay_merchant_id: string; // ID du merchant dans BoohPay
  api_key: string; // API key BoohPay (chiffrée)
  api_key_label?: string;
  magic_link?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service pour gérer les merchants BoohPay
 */
export class BoohPayMerchantService {
  private static readonly TABLE_NAME = 'boohpay_merchants';
  private static boohPayAdminToken: string | null = null;

  /**
   * Initialiser le token admin BoohPay depuis les variables d'environnement
   */
  static initializeAdminToken(): void {
    this.boohPayAdminToken = import.meta.env.VITE_BOOHPAY_ADMIN_TOKEN || null;

    if (!this.boohPayAdminToken) {
      console.warn('VITE_BOOHPAY_ADMIN_TOKEN n\'est pas configuré. La création de merchants ne fonctionnera pas.');
    }
  }

  /**
   * Récupérer ou créer un merchant BoohPay pour un utilisateur
   */
  static async getOrCreateMerchant(userId: string, userName: string): Promise<BoohPayMerchant> {
    // Vérifier si un merchant existe déjà
    const existing = await this.getMerchantByUserId(userId);
    if (existing) {
      return existing;
    }

    // Créer un nouveau merchant
    return await this.createMerchant(userId, userName);
  }

  /**
   * Récupérer le merchant BoohPay d'un utilisateur
   */
  static async getMerchantByUserId(userId: string): Promise<BoohPayMerchant | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas, c'est normal (migration pas encore appliquée)
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Table boohpay_merchants n\'existe pas encore. Migration SQL non appliquée.');
          return null;
        }
        console.error('Erreur lors de la récupération du merchant:', error);
        // Ne pas throw pour éviter de bloquer, retourner null
        return null;
      }

      return data as BoohPayMerchant | null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du merchant:', error);
      return null;
    }
  }

  /**
   * Créer un nouveau merchant BoohPay pour un utilisateur
   */
  static async createMerchant(userId: string, userName: string): Promise<BoohPayMerchant & { magicLink?: string }> {
    if (!this.boohPayAdminToken) {
      this.initializeAdminToken();

      if (!this.boohPayAdminToken) {
        throw new Error('Token admin BoohPay non configuré. Impossible de créer un merchant.');
      }
    }

    // Initialiser BoohPay avec l'URL de base
    const boohPayBaseUrl = import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000';
    boohPayService.initialize({
      baseUrl: boohPayBaseUrl,
      apiKey: '', // Pas besoin pour la création de merchant
    });

    try {
      // Créer le merchant dans BoohPay
      const merchantData = await boohPayService.createMerchant(
        {
          name: userName || `User ${userId}`,
          apiKeyLabel: `default-${userId}`,
        },
        this.boohPayAdminToken
      );

      const rawData = merchantData as any;
      const merchantId = rawData.merchantId || rawData.merchant_id || rawData.id;
      const apiKey = rawData.apiKey || rawData.api_key;

      // Vérifier que la réponse contient bien les données nécessaires
      if (!merchantId || !apiKey) {
        console.error('Réponse BoohPay incomplète:', merchantData);
        throw new Error(`Réponse BoohPay incomplète: merchantId (${merchantId}) ou apiKey (${apiKey ? '***' : 'missing'}) manquant`);
      }

      // Générer le magic link pour l'accès au dashboard
      let magicLink: string | undefined;
      try {
        const magicLinkData = await boohPayService.generateMerchantMagicLink(
          merchantId,
          this.boohPayAdminToken
        );
        magicLink = magicLinkData.magicLink;
        console.log('Magic link généré avec succès:', magicLink);
      } catch (error) {
        console.error('Échec de la génération du magic link:', error);
        // Ne pas faire échouer la création du merchant si le magic link échoue
      }

      // Stocker le merchant, l'API key et le magic link dans Supabase
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: userId,
          boohpay_merchant_id: merchantId,
          api_key: apiKey, // En production, il faudrait chiffrer cette clé
          api_key_label: `default-${userId}`,
          magic_link: magicLink,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'insertion du merchant:', error);
        throw new Error('Erreur lors de la création du merchant dans la base de données');
      }

      return {
        ...data,
        magicLink,
      } as BoohPayMerchant & { magicLink?: string };
    } catch (error: any) {
      console.error('Erreur lors de la création du merchant BoohPay:', error);
      throw new Error(`Erreur lors de la création du merchant: ${error.message}`);
    }
  }

  /**
   * Récupérer l'API key BoohPay pour un utilisateur
   */
  static async getApiKey(userId: string): Promise<string | null> {
    const merchant = await this.getMerchantByUserId(userId);
    return merchant?.api_key || null;
  }

  /**
   * Initialiser BoohPayService avec l'API key de l'utilisateur
   * Retourne le merchant avec l'apiKey si trouvé
   */
  static async initializeBoohPayForUser(userId: string): Promise<{ apiKey: string; merchantId: string } | null> {
    const merchant = await this.getMerchantByUserId(userId);

    if (!merchant?.api_key) {
      return null;
    }

    const boohPayBaseUrl = import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000';
    boohPayService.initialize({
      baseUrl: boohPayBaseUrl,
      apiKey: merchant.api_key,
    });

    return {
      apiKey: merchant.api_key,
      merchantId: merchant.boohpay_merchant_id,
    };
  }

  /**
   * Créer une nouvelle clé API pour un merchant
   */
  static async createNewApiKey(
    userId: string,
    label?: string
  ): Promise<ApiKeyResponse> {
    const merchant = await this.getMerchantByUserId(userId);

    if (!merchant) {
      throw new Error('Merchant non trouvé pour cet utilisateur');
    }

    if (!this.boohPayAdminToken) {
      this.initializeAdminToken();

      if (!this.boohPayAdminToken) {
        throw new Error('Token admin BoohPay non configuré');
      }
    }

    const boohPayBaseUrl = import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000';
    boohPayService.initialize({
      baseUrl: boohPayBaseUrl,
      apiKey: '', // Pas besoin pour cette opération
    });

    // Créer la nouvelle clé API
    const apiKeyData = await boohPayService.createApiKey(
      merchant.boohpay_merchant_id,
      label,
      this.boohPayAdminToken
    );

    // Mettre à jour dans Supabase
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        api_key: apiKeyData.apiKey,
        api_key_label: label || apiKeyData.label,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'API key:', error);
      throw new Error('Erreur lors de la mise à jour de l\'API key');
    }

    return apiKeyData;
  }

  /**
   * Supprimer un merchant (pour tests/nettoyage)
   */
  static async deleteMerchant(userId: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la suppression du merchant:', error);
      throw new Error('Erreur lors de la suppression du merchant');
    }
  }
}

// Initialiser le token admin au chargement
BoohPayMerchantService.initializeAdminToken();

