import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EncryptFileRequest {
  fileUrl: string;
  buyerId: string;
  productId: string;
}

/**
 * Edge Function pour chiffrer un fichier avec AES-256
 * Génère une clé unique par acheteur pour déchiffrement
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Encryption request received');

    const requestData: EncryptFileRequest = await req.json();
    const { fileUrl, buyerId, productId } = requestData;

    // Validation
    if (!fileUrl || !buyerId || !productId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Données manquantes (fileUrl, buyerId, productId requis)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📥 Téléchargement du fichier:', fileUrl);

    // Télécharger le fichier original
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Impossible de télécharger le fichier: ${fileResponse.status}`);
    }

    const fileBytes = await fileResponse.arrayBuffer();
    console.log('✅ Fichier téléchargé:', fileBytes.byteLength, 'bytes');

    // Générer une clé de chiffrement unique pour cet achat
    // Basée sur le buyerId + productId + salt
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(`${buyerId}-${productId}-${Deno.env.get('ENCRYPTION_SALT') || 'default-salt'}`);
    
    // Créer une clé de chiffrement
    const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
    const key = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Générer un IV (Initialization Vector) aléatoire
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Chiffrer le fichier
    console.log('🔐 Chiffrement en cours...');
    const encryptedBytes = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      fileBytes
    );

    console.log('✅ Fichier chiffré:', encryptedBytes.byteLength, 'bytes');

    // Préparer les métadonnées de déchiffrement
    const metadata = {
      iv: Array.from(iv),
      buyerId: buyerId,
      productId: productId,
      encryptedAt: new Date().toISOString(),
      algorithm: 'AES-GCM',
    };

    // Combiner IV + données chiffrées
    const result = new Uint8Array(iv.length + encryptedBytes.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBytes), iv.length);

    // Retourner le fichier chiffré avec métadonnées
    return new Response(
      JSON.stringify({
        success: true,
        encryptedFile: Array.from(result), // Converti en array pour JSON
        metadata: metadata,
        message: 'Fichier chiffré avec succès',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erreur encryption:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur lors du chiffrement',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





















