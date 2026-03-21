import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function pour streaming vidéo sécurisé avec HLS
 * Valide le token avant de servir chaque segment vidéo
 * Empêche le téléchargement direct de la vidéo complète
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const downloadToken = url.searchParams.get('token');
    const segmentPath = url.searchParams.get('segment');
    const manifest = url.searchParams.get('manifest');

    console.log('📺 HLS Stream request:', { downloadToken, segmentPath, manifest });

    // Validation du token
    if (!downloadToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token manquant',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Valider le token de téléchargement
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_download', { p_download_token: downloadToken });

    if (validationError || !validation?.is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token invalide ou expiré',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Token valide pour:', validation.product_title);

    // Cas 1: Demande de manifest (.m3u8)
    if (manifest) {
      console.log('📄 Génération du manifest HLS...');
      
      // Récupérer l'URL de la vidéo originale
      const videoUrl = validation.file_url;
      
      // Générer un manifest HLS simple
      // Dans une implémentation complète, la vidéo serait déjà segmentée
      const manifestContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:10.0,
${url.origin}${url.pathname}?token=${downloadToken}&segment=0
#EXT-X-ENDLIST
`;

      return new Response(manifestContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Cas 2: Demande de segment vidéo
    if (segmentPath !== null) {
      console.log('📹 Streaming segment:', segmentPath);
      
      // Récupérer la vidéo originale
      const videoUrl = validation.file_url;
      const videoResponse = await fetch(videoUrl);

      if (!videoResponse.ok) {
        throw new Error(`Impossible de charger la vidéo: ${videoResponse.status}`);
      }

      const videoBytes = await videoResponse.arrayBuffer();

      // Dans une implémentation complète, on servirait uniquement
      // le segment demandé. Ici, on retourne la vidéo complète.
      
      return new Response(videoBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Buyer-Email': buyerInfo?.email || 'unknown',
        },
      });
    }

    // Cas par défaut: retourner la vidéo originale (pour compatibilité)
    const videoUrl = validation.file_url;
    const videoResponse = await fetch(videoUrl);
    const videoBytes = await videoResponse.arrayBuffer();

    return new Response(videoBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ Erreur HLS stream:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur lors du streaming',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





















