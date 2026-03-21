import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecryptFileRequest {
  encryptedFile: number[]; // Array of bytes
  metadata: {
    iv: number[];
    buyerId: string;
    productId: string;
    algorithm: string;
  };
  downloadToken: string; // Pour validation
}

/**
 * Edge Function pour déchiffrer un fichier
 * Valide le token de téléchargement avant de déchiffrer
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔓 Decryption request received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: DecryptFileRequest = await req.json();
    const { encryptedFile, metadata, downloadToken } = requestData;

    // Validation
    if (!encryptedFile || !metadata || !downloadToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Données manquantes',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔍 Validation du token de téléchargement...');

    // Valider le token de téléchargement
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_download', { p_download_token: downloadToken });

    if (validationError || !validation?.is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token de téléchargement invalide ou expiré',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Token valide, déchiffrement autorisé');

    // Régénérer la clé de déchiffrement
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(
      `${metadata.buyerId}-${metadata.productId}-${Deno.env.get('ENCRYPTION_SALT') || 'default-salt'}`
    );
    
    const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
    const key = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Extraire IV et données chiffrées
    const encryptedBytes = new Uint8Array(encryptedFile);
    const iv = new Uint8Array(metadata.iv);
    const data = encryptedBytes.slice(iv.length);

    console.log('🔓 Déchiffrement en cours...');

    // Déchiffrer le fichier
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    console.log('✅ Fichier déchiffré:', decryptedBytes.byteLength, 'bytes');

    // Retourner le fichier déchiffré
    return new Response(decryptedBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="download_${Date.now()}.bin"`,
      },
    });

  } catch (error) {
    console.error('❌ Erreur decryption:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur lors du déchiffrement',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





















