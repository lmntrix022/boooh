import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface ValidateDownloadRequest {
  download_token: string;
}

interface ValidateDownloadResponse {
  is_valid: boolean;
  file_url?: string;
  product_title?: string;
  buyer_email?: string;
  buyer_name?: string;
  error_message?: string;
}

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
    const { download_token }: ValidateDownloadRequest = await req.json();

    if (!download_token) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error_message: 'Token de téléchargement requis'
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

    // 🔧 CORRECTION : Chercher dans digital_inquiries au lieu de digital_purchases
    const { data: inquiry, error: inquiryError } = await supabase
      .from('digital_inquiries')
      .select(`
        id,
        client_name,
        client_email,
        download_token,
        expires_at,
        status,
        payment_status,
        digital_products (
          id,
          title,
          file_url,
          status
        )
      `)
      .eq('download_token', download_token)
      .single();

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error_message: 'Token invalide ou expiré'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(inquiry.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error_message: 'Token expiré'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Vérifier le statut
    if (inquiry.status !== 'completed' || inquiry.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error_message: 'Commande non finalisée'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Vérifier que le produit existe et est publié
    if (!inquiry.digital_products || inquiry.digital_products.status !== 'published') {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error_message: 'Produit introuvable ou non publié'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ✅ Token valide - retourner les informations
    const response: ValidateDownloadResponse = {
      is_valid: true,
      file_url: inquiry.digital_products.file_url,
      product_title: inquiry.digital_products.title,
      buyer_email: inquiry.client_email,
      buyer_name: inquiry.client_name,
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
    console.error('Error in validate-download-fixed:', error);
    
    return new Response(
      JSON.stringify({
        is_valid: false,
        error_message: 'Erreur système'
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

