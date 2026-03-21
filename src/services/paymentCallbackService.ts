import { supabase } from '@/integrations/supabase/client';

/**
 * Interface pour un callback de paiement
 */
export interface PaymentCallback {
  id: string;
  bill_id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string;
  amount: number;
  payer_msisdn?: string;
  payer_name?: string;
  payer_email?: string;
  transaction_id?: string;
  paid_at?: string;
  payment_system?: string;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service pour interagir avec les callbacks de paiement eBilling
 */
export class PaymentCallbackService {
  /**
   * Récupérer un callback par bill_id
   */
  static async getCallbackByBillId(bill_id: string): Promise<PaymentCallback | null> {
    try {
      const { data, error } = await supabase
        .from('payment_callbacks')
        .select('*')
        .eq('bill_id', bill_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucun résultat trouvé
          return null;
        }
        throw error;
      }

      return data as PaymentCallback;
    } catch (error) {
      // Error log removed
      throw new Error('Impossible de récupérer le statut du paiement');
    }
  }

  /**
   * Récupérer un callback par référence de commande
   */
  static async getCallbackByReference(reference: string): Promise<PaymentCallback | null> {
    try {
      const { data, error } = await supabase
        .from('payment_callbacks')
        .select('*')
        .eq('reference', reference)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as PaymentCallback;
    } catch (error) {
      // Error log removed
      throw new Error('Impossible de récupérer le statut du paiement');
    }
  }

  /**
   * Récupérer tous les callbacks d'un utilisateur
   * (nécessite une jointure avec orders ou une autre table)
   */
  static async getUserCallbacks(userId: string, limit: number = 50): Promise<PaymentCallback[]> {
    try {
      // Cette requête suppose que vous avez une table orders avec card_id
      const { data, error } = await supabase
        .from('payment_callbacks')
        .select(`
          *,
          orders!inner(card_id)
        `)
        .eq('orders.card_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as PaymentCallback[];
    } catch (error) {
      // Error log removed
      return [];
    }
  }

  /**
   * Vérifier le statut d'un paiement en temps réel
   * Retourne le callback s'il existe, sinon interroge l'API eBilling
   */
  static async checkPaymentStatus(bill_id: string): Promise<{
    found: boolean;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING';
    callback?: PaymentCallback;
  }> {
    try {
      const callback = await this.getCallbackByBillId(bill_id);

      if (callback) {
        return {
          found: true,
          status: callback.status,
          callback: callback,
        };
      }

      // Si aucun callback trouvé, on pourrait interroger l'API eBilling
      // (nécessite une Edge Function pour garder les credentials sécurisés)
      return { found: false };
    } catch (error) {
      // Error log removed
      return { found: false };
    }
  }

  /**
   * S'abonner aux changements en temps réel d'un bill_id spécifique
   * Utile pour afficher le statut en direct à l'utilisateur
   */
  static subscribeToPaymentStatus(
    bill_id: string,
    onStatusChange: (callback: PaymentCallback) => void
  ): () => void {
    const channel = supabase
      .channel(`payment_${bill_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_callbacks',
          filter: `bill_id=eq.${bill_id}`,
        },
        (payload) => {
          // Log removed
          if (payload.new) {
            onStatusChange(payload.new as PaymentCallback);
          }
        }
      )
      .subscribe();

    // Retourner une fonction de nettoyage
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Récupérer les statistiques de paiement
   */
  static async getPaymentStats(userId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    total_amount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_callbacks')
        .select(`
          status,
          amount,
          orders!inner(card_id)
        `)
        .eq('orders.card_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        success: data.filter((c: any) => c.status === 'SUCCESS').length,
        failed: data.filter((c: any) => c.status === 'FAILED').length,
        pending: data.filter((c: any) => c.status === 'PENDING').length,
        total_amount: data
          .filter((c: any) => c.status === 'SUCCESS')
          .reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0),
      };

      return stats;
    } catch (error) {
      // Error log removed
      return {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        total_amount: 0,
      };
    }
  }

  /**
   * Marquer manuellement un callback comme traité
   * (utile pour le retry manuel en cas d'erreur)
   */
  static async markAsProcessed(callback_id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_callbacks')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', callback_id);

      if (error) throw error;

      return true;
    } catch (error) {
      // Error log removed
      return false;
    }
  }

  /**
   * Récupérer les callbacks non traités (admin)
   */
  static async getUnprocessedCallbacks(limit: number = 100): Promise<PaymentCallback[]> {
    try {
      const { data, error } = await supabase
        .from('payment_callbacks')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data as PaymentCallback[];
    } catch (error) {
      // Error log removed
      return [];
    }
  }

  /**
   * Retry le traitement d'un callback échoué
   * Nécessite une Edge Function pour re-traiter
   */
  static async retryCallback(callback_id: string): Promise<boolean> {
    try {
      // Appeler l'Edge Function de retry (à créer si nécessaire)
      const { data, error } = await supabase.functions.invoke('retry-callback', {
        body: { callback_id },
      });

      if (error) throw error;

      return data?.success || false;
    } catch (error) {
      // Error log removed
      return false;
    }
  }
}

/**
 * Hook React pour surveiller le statut d'un paiement en temps réel
 * 
 * @example
 * ```typescript
 * const { status, callback, loading } = usePaymentStatus(bill_id);
 * 
 * if (status === 'SUCCESS') {
 *   // Paiement réussi
 * }
 * ```
 */
export function usePaymentStatus(bill_id: string | null) {
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING' | null>(null);
  const [callback, setCallback] = useState<PaymentCallback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bill_id) {
      setLoading(false);
      return;
    }

    // Vérification initiale
    PaymentCallbackService.checkPaymentStatus(bill_id).then((result) => {
      if (result.found && result.callback) {
        setStatus(result.status || null);
        setCallback(result.callback);
      }
      setLoading(false);
    });

    // Abonnement aux changements en temps réel
    const unsubscribe = PaymentCallbackService.subscribeToPaymentStatus(
      bill_id,
      (newCallback) => {
        setStatus(newCallback.status);
        setCallback(newCallback);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [bill_id]);

  return { status, callback, loading };
}

// Imports pour le hook React
import { useEffect, useState } from 'react';






















