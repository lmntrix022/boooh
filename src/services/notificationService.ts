/**
 * Service de gestion des notifications
 * Traite automatiquement la queue de notifications après chaque action
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Traite la queue de notifications
 * Appelle automatiquement l'Edge Function qui envoie les emails
 */
export async function processNotificationQueue(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('process-notification-queue');

    if (error) {
      console.error('Error processing notification queue:', error);
      // Ne pas bloquer l'application si la notification échoue
      return;
    }

    if (data?.processed > 0) {
      console.log(`✅ ${data.processed} notification(s) processed`);
    }
  } catch (error) {
    console.error('Failed to process notification queue:', error);
    // Échec silencieux - les notifications seront traitées plus tard
  }
}

/**
 * Envoie une notification immédiatement (sans passer par la queue)
 * Utile pour les actions critiques
 */
export async function sendNotificationImmediate(notification: {
  type: 'appointment' | 'order_physical' | 'order_digital' | 'quote';
  cardId: string;
  ownerId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  details: any;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: notification
    });

    if (error) {
      console.error('Error sending immediate notification:', error);
    }
  } catch (error) {
    console.error('Failed to send immediate notification:', error);
  }
}




