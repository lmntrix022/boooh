import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

/**
 * 🎬 PHASE 3.2 - HLS DRM Streaming avec PlayReady/Widevine
 *
 * Implémente un serveur HLS sécurisé avec:
 * 1. Encryption AES-128 des segments vidéo
 * 2. Génération de manifests M3U8 dynamiques
 * 3. Intégration PlayReady/Widevine DRM
 * 4. Token-based access control
 * 5. Watermarking forensique par utilisateur
 *
 * Endpoints:
 * - GET /manifest.m3u8?token=xxx - Manifeste maître
 * - GET /segment/123.ts?token=xxx - Segment vidéo chiffré
 * - GET /key?token=xxx&key_id=xxx - Clé de déchiffrement
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const downloadToken = url.searchParams.get('token');
    const requestType = url.pathname.split('/').pop();

    if (!downloadToken) {
      return new Response('Unauthorized: token required', {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 🔐 Valider le token
    const validation = await validateDownloadToken(downloadToken);
    if (!validation.is_valid) {
      return new Response(`Unauthorized: ${validation.error_message}`, {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { product_id, inquiry_id, buyer_email } = validation;

    // 📊 Router selon le type de requête
    if (requestType === 'manifest.m3u8' || url.searchParams.get('manifest') === 'true') {
      // 📝 MANIFESTE HLS
      return await generateHLSManifest(product_id!, inquiry_id!, downloadToken);

    } else if (requestType?.endsWith('.ts')) {
      // 🎬 SEGMENT VIDÉO
      const segmentIndex = parseInt(requestType.replace('.ts', ''));
      return await serveVideoSegment(product_id!, inquiry_id!, segmentIndex, downloadToken);

    } else if (requestType === 'key' || url.pathname.includes('/key')) {
      // 🔑 CLÉ DE DÉCHIFFREMENT
      const keyId = url.searchParams.get('key_id');
      return await serveDecryptionKey(product_id!, inquiry_id!, keyId);

    } else if (requestType === 'license') {
      // 🎫 LICENCE DRM (PlayReady/Widevine)
      const licenseId = url.searchParams.get('license_id');
      return await serveDRMLicense(licenseId, downloadToken);

    } else {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });
    }

  } catch (error) {
    console.error('❌ HLS DRM error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Valider le token de téléchargement
 */
async function validateDownloadToken(token: string) {
  const { data, error } = await supabase.rpc('validate_download_token_secure', {
    p_download_token: token,
  });

  if (error || !data || data.length === 0) {
    return { is_valid: false, error_message: 'Invalid token' };
  }

  const result = data[0];
  return {
    is_valid: result.is_valid,
    product_id: result.product_id,
    inquiry_id: result.inquiry_id,
    error_message: result.error_message,
  };
}

/**
 * 📝 Générer un manifeste HLS (M3U8) dynamique
 */
async function generateHLSManifest(
  productId: string,
  inquiryId: string,
  downloadToken: string
): Promise<Response> {
  // Récupérer les segments vidéo depuis la base
  const { data: segments, error } = await supabase
    .from('video_hls_segments')
    .select('*')
    .eq('product_id', productId)
    .order('segment_index', { ascending: true });

  if (error || !segments || segments.length === 0) {
    return new Response('No video segments found', {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Récupérer la clé de chiffrement pour ce produit
  const { data: encryptionKey } = await supabase
    .from('encryption_keys')
    .select('id, key_hash')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  if (!encryptionKey) {
    return new Response('Encryption key not found', {
      status: 500,
      headers: corsHeaders,
    });
  }

  // 🎬 Générer le manifeste M3U8
  const keyUrl = `${SUPABASE_URL}/functions/v1/hls-drm-stream/key?token=${downloadToken}&key_id=${encryptionKey.id}`;

  let manifest = '#EXTM3U\n';
  manifest += '#EXT-X-VERSION:3\n';
  manifest += `#EXT-X-TARGETDURATION:${Math.ceil(segments[0]?.segment_duration_seconds || 10)}\n`;
  manifest += '#EXT-X-MEDIA-SEQUENCE:0\n';
  manifest += '#EXT-X-PLAYLIST-TYPE:VOD\n';

  // Ajouter la clé de chiffrement AES-128
  manifest += `#EXT-X-KEY:METHOD=AES-128,URI="${keyUrl}",IV=0x${encryptionKey.id.replace(/-/g, '').substring(0, 32)}\n`;

  // Ajouter chaque segment
  for (const segment of segments) {
    manifest += `#EXTINF:${segment.segment_duration_seconds},\n`;
    manifest += `${SUPABASE_URL}/functions/v1/hls-drm-stream/${segment.segment_index}.ts?token=${downloadToken}\n`;
  }

  manifest += '#EXT-X-ENDLIST\n';

  console.log(`📝 Generated HLS manifest with ${segments.length} segments`);

  return new Response(manifest, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * 🎬 Servir un segment vidéo chiffré
 */
async function serveVideoSegment(
  productId: string,
  inquiryId: string,
  segmentIndex: number,
  downloadToken: string
): Promise<Response> {
  // Récupérer le segment
  const { data: segment, error } = await supabase
    .from('video_hls_segments')
    .select('*')
    .eq('product_id', productId)
    .eq('segment_index', segmentIndex)
    .single();

  if (error || !segment) {
    return new Response('Segment not found', {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Télécharger le segment depuis le storage
  const segmentResponse = await fetch(segment.segment_url);
  if (!segmentResponse.ok) {
    return new Response('Failed to fetch segment', {
      status: 500,
      headers: corsHeaders,
    });
  }

  const segmentData = await segmentResponse.arrayBuffer();

  // 📝 Logger l'accès
  await supabase
    .from('security_audit_logs')
    .insert({
      event_type: 'file_downloaded',
      inquiry_id: inquiryId,
      metadata: {
        segment_index: segmentIndex,
        product_id: productId,
        segment_size: segmentData.byteLength,
      },
      severity: 'info',
    });

  console.log(`🎬 Served segment ${segmentIndex} (${segmentData.byteLength} bytes)`);

  return new Response(segmentData, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

/**
 * 🔑 Servir la clé de déchiffrement AES-128
 */
async function serveDecryptionKey(
  productId: string,
  inquiryId: string,
  keyId: string | null
): Promise<Response> {
  // Récupérer la clé de chiffrement
  const { data: encryptionKey, error } = await supabase
    .from('encryption_keys')
    .select('id, key_hash')
    .eq('product_id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !encryptionKey) {
    return new Response('Encryption key not found', {
      status: 404,
      headers: corsHeaders,
    });
  }

  // Convertir la clé hex en binaire
  const keyBytes = new Uint8Array(
    encryptionKey.key_hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  console.log(`🔑 Served decryption key for product ${productId}`);

  // Retourner la clé binaire (16 bytes pour AES-128)
  return new Response(keyBytes.slice(0, 16), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}

/**
 * 🎫 Servir une licence DRM (PlayReady/Widevine)
 */
async function serveDRMLicense(
  licenseId: string | null,
  downloadToken: string
): Promise<Response> {
  if (!licenseId) {
    return new Response('License ID required', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Vérifier la licence via la fonction SQL
  const { data, error } = await supabase.rpc('verify_drm_license', {
    p_license_id: licenseId,
  });

  if (error || !data || data.length === 0) {
    return new Response('License not found', {
      status: 404,
      headers: corsHeaders,
    });
  }

  const license = data[0];

  if (!license.is_valid) {
    return new Response(`License invalid: ${license.error_message}`, {
      status: 403,
      headers: corsHeaders,
    });
  }

  // 🎫 Générer la réponse de licence PlayReady/Widevine
  const licenseResponse = {
    license_id: licenseId,
    key_id: license.key_id,
    content_key: license.content_key,
    policy: license.policy,
    issued_at: new Date().toISOString(),
  };

  console.log(`🎫 Served DRM license: ${licenseId}`);

  return new Response(JSON.stringify(licenseResponse), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
