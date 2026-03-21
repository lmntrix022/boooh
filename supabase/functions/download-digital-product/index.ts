// Supabase Edge Function: download-digital-product
// Purpose: Secure download handler for DRM-protected digital products
// Validates token, checks limits, downloads file, adds watermark, and increments counter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logWatermark, createWatermarkComment } from "../_shared/audioWatermark.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token manquant' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔐 Download request for token:', token.substring(0, 8) + '...');

    // ========================================================================
    // 1. VALIDER LE TOKEN
    // ========================================================================
    const { data: inquiry, error: inquiryError } = await supabase
      .from('digital_inquiries')
      .select('*')
      .eq('download_token', token)
      .single();

    if (inquiryError || !inquiry) {
      console.error('❌ Token invalide:', inquiryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Token trouvé, inquiry ID:', inquiry.id);

    // Récupérer le produit digital séparément
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', inquiry.digital_product_id)
      .single();

    if (productError || !product) {
      console.error('❌ Produit non trouvé:', productError);
      return new Response(
        JSON.stringify({ success: false, error: 'Produit non trouvé' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Produit trouvé:', product.name);

    // ========================================================================
    // 2. VÉRIFIER L'EXPIRATION
    // ========================================================================
    if (inquiry.expires_at && new Date(inquiry.expires_at) < new Date()) {
      console.error('❌ Token expiré:', inquiry.expires_at);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ce lien de téléchargement a expiré',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================================================
    // 3. VÉRIFIER LA LIMITE DE TÉLÉCHARGEMENTS
    // ========================================================================
    const downloadCount = inquiry.download_count || 0;
    const maxDownloads = inquiry.max_downloads || 3;
    const remaining = maxDownloads - downloadCount;

    if (remaining <= 0) {
      console.error('❌ Limite atteinte:', downloadCount, '/', maxDownloads);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Limite de téléchargements atteinte',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📊 Téléchargements restants:', remaining);

    // ========================================================================
    // 4. EXTRAIRE LE CHEMIN DU FICHIER
    // ========================================================================
    const fileUrl = product.file_url;

    if (!fileUrl) {
      console.error('❌ Pas de file_url dans le produit');
      return new Response(
        JSON.stringify({ success: false, error: 'Fichier introuvable' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extraire le chemin relatif depuis l'URL complète
    console.log('🔍 URL complète du fichier:', fileUrl);

    let filePath = fileUrl;

    // Format 1: https://xxx.supabase.co/storage/v1/object/public/digital-products/path/to/file.mp3
    if (fileUrl.includes('/digital-products/')) {
      // Prendre la DERNIÈRE occurrence de /digital-products/ (au cas où il y en a plusieurs)
      const parts = fileUrl.split('/digital-products/');
      filePath = parts[parts.length - 1];
      console.log('✂️ Extraction via /digital-products/ (dernière occurrence)');

      // Si le chemin commence encore par "digital-products/", l'enlever
      if (filePath.startsWith('digital-products/')) {
        filePath = filePath.substring('digital-products/'.length);
        console.log('🧹 Nettoyage du préfixe en double');
      }
    }
    // Format 2: https://xxx.supabase.co/storage/v1/object/authenticated/digital-products/path/to/file.mp3
    else if (fileUrl.includes('/object/')) {
      const parts = fileUrl.split('/object/');
      if (parts[1]) {
        const afterObject = parts[1];
        // Enlever public/ ou authenticated/ + digital-products/
        filePath = afterObject.replace(/^(public|authenticated)\/digital-products\//, '');
        console.log('✂️ Extraction via /object/');
      }
    }
    // Format 3: Juste le chemin relatif déjà
    else if (!fileUrl.startsWith('http')) {
      filePath = fileUrl;
      console.log('✅ Chemin relatif déjà fourni');
    }

    console.log('📁 Chemin extrait:', filePath);
    console.log('📦 Type de fichier:', product.file_type || 'non défini');
    console.log('📝 Format:', product.format || 'non défini');

    // ========================================================================
    // 5. TÉLÉCHARGER LE FICHIER DEPUIS L'URL PUBLIQUE
    // ========================================================================
    // Le bucket est public, donc on peut télécharger directement depuis l'URL
    console.log('📥 Téléchargement depuis URL publique:', fileUrl);

    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      console.error('❌ Erreur HTTP:', fileResponse.status, fileResponse.statusText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Fichier introuvable',
          details: `HTTP ${fileResponse.status}: ${fileResponse.statusText}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const fileData = await fileResponse.blob();
    console.log('✅ Fichier téléchargé, taille:', fileData.size, 'bytes');

    // ========================================================================
    // 6. INCRÉMENTER LE COMPTEUR
    // ========================================================================
    const { error: updateError } = await supabase
      .from('digital_inquiries')
      .update({
        download_count: downloadCount + 1,
        last_download_at: new Date().toISOString(),
      })
      .eq('id', inquiry.id);

    if (updateError) {
      console.error('⚠️ Erreur mise à jour compteur:', updateError);
      // Continue quand même, le téléchargement est plus important
    } else {
      console.log('✅ Compteur mis à jour:', downloadCount + 1, '/', maxDownloads);
    }

    // ========================================================================
    // 7. RETOURNER LE FICHIER
    // ========================================================================
    // Construire le nom de fichier avec l'extension correcte
    let fileName = product.name || 'download';
    const format = product.format || 'mp3'; // Format attendu (mp3, pdf, etc.)

    // Ajouter l'extension si elle n'est pas présente
    if (!fileName.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
      fileName = `${fileName}.${format.toLowerCase()}`;
    }

    // Détecter le type MIME basé sur le format
    const mimeTypes: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'wav': 'audio/wav',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
    };

    const fileType = product.file_type
      || mimeTypes[format.toLowerCase()]
      || 'application/octet-stream';

    // ========================================================================
    // 8. AJOUTER LE WATERMARK (TRAÇABILITÉ)
    // ========================================================================
    // Logger le watermark pour traçabilité
    const watermarkData = {
      email: inquiry.client_email,
      orderId: inquiry.id,
      purchaseDate: inquiry.created_at || new Date().toISOString(),
      productName: product.name,
    };

    // Log du watermark dans les audits (ne bloque pas si échoue)
    await logWatermark(supabase, {
      inquiryId: inquiry.id,
      email: inquiry.client_email,
      orderId: inquiry.id,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    }).catch((err) => {
      console.warn('⚠️ Watermark logging failed:', err);
    });

    // Créer un commentaire de watermark
    const watermarkComment = createWatermarkComment({
      email: inquiry.client_email,
      orderId: inquiry.id,
      purchaseDate: inquiry.created_at || new Date().toISOString(),
    });

    console.log('🎨 Watermark:', watermarkComment);
    console.log('📤 Envoi du fichier:', fileName);
    console.log('🎯 Type MIME:', fileType);
    console.log('📏 Taille:', fileData.size, 'bytes');

    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': fileType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Watermark': watermarkComment, // Header personnalisé pour traçabilité
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur fatale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur interne du serveur',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
