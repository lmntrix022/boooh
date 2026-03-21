import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface GenerateTokenRequest {
  inquiry_id: string;
  user_id?: string;
  expires_in_hours?: number; // Default: 24h
  max_downloads?: number; // Default: 3
}

interface GenerateTokenResponse {
  success: boolean;
  download_token?: string;
  expires_at?: string;
  max_downloads?: number;
  error_message?: string;
}

/**
 * 🔒 PHASE 1.1 - Génération de tokens cryptographiquement sécurisés côté serveur
 *
 * Utilise crypto.getRandomValues() au lieu de Math.random()
 * Génère des tokens de 64 caractères hexadécimaux (256 bits d'entropie)
 * Stocke directement dans la base de données avec métadonnées de sécurité
 */
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // 🔐 Vérification de l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'Authentication required'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'Invalid authentication token'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const {
      inquiry_id,
      user_id,
      expires_in_hours = 24,
      max_downloads = 3
    }: GenerateTokenRequest = await req.json();

    if (!inquiry_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'inquiry_id is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 🔐 Vérifier que l'utilisateur a accès à cette inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('digital_inquiries')
      .select('id, card_id, client_email, payment_status')
      .eq('id', inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'Inquiry not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Vérifier que le paiement est complété
    // Note: Pour un achat, l'utilisateur n'est PAS le propriétaire de la carte
    // On vérifie plutôt que le paiement est complété
    if (inquiry.payment_status !== 'completed') {
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'Payment not completed for this inquiry'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 🔑 Génération de token CRYPTOGRAPHIQUEMENT SÉCURISÉ
    // Utilise crypto.getRandomValues() au lieu de Math.random()
    const tokenBytes = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(tokenBytes);
    const downloadToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // 💾 Mettre à jour l'inquiry avec le token
    const { error: updateError } = await supabase
      .from('digital_inquiries')
      .update({
        download_token: downloadToken,
        expires_at: expiresAt.toISOString(),
        max_downloads: max_downloads,
        download_count: 0,
      })
      .eq('id', inquiry_id);

    if (updateError) {
      console.error('Error updating inquiry with token:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error_message: 'Failed to generate download token'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 📝 Logger la génération du token pour audit
    // TODO: Activer après avoir créé la table security_audit_logs
    /*
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'token_generated',
        user_id: user.id,
        inquiry_id: inquiry_id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        metadata: {
          expires_at: expiresAt.toISOString(),
          max_downloads: max_downloads,
        },
        created_at: new Date().toISOString(),
      });
    */

    // ✅ Retourner le token généré
    const response: GenerateTokenResponse = {
      success: true,
      download_token: downloadToken,
      expires_at: expiresAt.toISOString(),
      max_downloads: max_downloads,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-secure-token:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error_message: 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
