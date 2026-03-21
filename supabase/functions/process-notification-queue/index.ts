// Supabase Edge Function: process-notification-queue
// Purpose: Traite la queue de notifications et envoie les emails
// Peut être appelée manuellement ou via cron job

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Récupérer les notifications en attente (max 10)
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque notification
    for (const notification of notifications) {
      try {
        // Marquer comme en traitement
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'processing',
            attempts: notification.attempts + 1,
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        // Appeler la fonction d'envoi d'email
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          'send-notification-email',
          { body: notification.payload }
        );

        if (emailError || !emailResponse?.success) {
          throw new Error(emailError?.message || 'Failed to send email');
        }

        // Marquer comme envoyé
        await supabase
          .from('notification_queue')
          .update({ status: 'sent' })
          .eq('id', notification.id);

        successCount++;
      } catch (error: any) {
        // Marquer comme échoué
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'failed',
            last_error: error.message
          })
          .eq('id', notification.id);

        errorCount++;
        console.error(`Failed to process notification ${notification.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: notifications.length,
        successful: successCount,
        failed: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing queue:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});




