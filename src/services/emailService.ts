import { supabase } from '@/integrations/supabase/client';

export interface SendInvoiceEmailParams {
  invoice_number: string;
  client_name: string;
  client_email: string;
  total_ttc: number;
  issue_date: string;
  due_date: string;
  pdf_url?: string;
  pdf_base64?: string;
  user_email?: string;
  user_name?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  email_id?: string;
}

/**
 * Service pour l'envoi d'emails via Supabase Edge Functions
 */
export class EmailService {
  /**
   * Envoie une facture par email au client
   * Utilise la Supabase Edge Function 'send-invoice-email'
   *
   * @param params - Paramètres de la facture à envoyer
   * @returns Promise<EmailResponse>
   * @throws Error si l'envoi échoue
   */
  static async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<EmailResponse> {
    try {
      // Vérifier la session avant d'envoyer
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        // Error log removed
        throw new Error('You must be logged in to send emails');
      }

      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: params,
      });

      if (error) {
        // Error log removed
        throw new Error(`Failed to send email: ${error.message}`);
      }

      if (!data?.success) {
        // Error log removed
        throw new Error(data?.error || 'Failed to send email');
      }

      // Log removed
      return data as EmailResponse;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Teste si le service d'email est configuré et fonctionnel
   *
   * @returns Promise<boolean> - true si le service est disponible
   */
  static async isEmailServiceAvailable(): Promise<boolean> {
    try {
      // Essayer d'invoquer la fonction avec des données de test
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          test: true,
        },
      });

      // Si pas d'erreur fatale, le service est disponible
      return !error || error.message.includes('Missing required fields');
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Envoie un email de test pour vérifier la configuration
   *
   * @param testEmail - Email de destination pour le test
   * @returns Promise<boolean> - true si le test réussit
   */
  static async sendTestEmail(testEmail: string): Promise<boolean> {
    try {
      const testParams: SendInvoiceEmailParams = {
        invoice_number: 'TEST-001',
        client_name: 'Test Client',
        client_email: testEmail,
        total_ttc: 10000,
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_name: 'Test User',
      };

      const result = await this.sendInvoiceEmail(testParams);
      return result.success;
    } catch (error) {
      // Error log removed
      return false;
    }
  }
}
