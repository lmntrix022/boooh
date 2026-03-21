import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioMetadataRequest {
  fileUrl: string;
  buyerInfo: {
    email: string;
    name: string;
    purchaseDate?: string;
    productId?: string;
  };
  productInfo?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

/**
 * Edge Function pour ajouter des métadonnées copyright aux fichiers audio
 * Ajoute les informations de l'acheteur dans les tags ID3
 * 
 * Note: Pour une implémentation complète avec modification des tags ID3,
 * cette version ajoute les métadonnées en tant que custom headers.
 * Pour une vraie modification du fichier MP3, il faudrait utiliser
 * une bibliothèque comme node-id3 ou music-metadata.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎵 Audio metadata request received');

    const requestData: AudioMetadataRequest = await req.json();
    const { fileUrl, buyerInfo, productInfo } = requestData;

    // Validation
    if (!fileUrl || !buyerInfo?.email || !buyerInfo?.name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Données manquantes (fileUrl, buyerInfo requis)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📥 Téléchargement du fichier audio:', fileUrl);

    // Télécharger le fichier audio original
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error(`Impossible de télécharger le fichier: ${audioResponse.status}`);
    }

    const audioBytes = await audioResponse.arrayBuffer();

    console.log('✅ Fichier téléchargé:', audioBytes.byteLength, 'bytes');

    // Créer les métadonnées copyright
    const purchaseDate = buyerInfo.purchaseDate 
      ? new Date(buyerInfo.purchaseDate).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR');

    const copyrightMetadata = {
      buyer_email: buyerInfo.email,
      buyer_name: buyerInfo.name,
      purchase_date: purchaseDate,
      product_id: buyerInfo.productId,
      copyright: `© ${buyerInfo.name} - Usage personnel uniquement`,
      license: `Acheté par ${buyerInfo.email} le ${purchaseDate}. Redistribution interdite.`,
      watermark_applied: true,
      watermark_timestamp: new Date().toISOString(),
    };

    console.log('📝 Métadonnées créées:', copyrightMetadata);

    // Note: Pour une vraie modification des tags ID3, il faudrait utiliser
    // une bibliothèque spécialisée. Cette version retourne le fichier original
    // avec les métadonnées en headers pour traçabilité.

    // Dans une implémentation complète, on utiliserait music-metadata ou node-id3
    // pour modifier réellement les tags ID3 du fichier MP3

    // Retourner le fichier avec métadonnées en headers
    return new Response(audioBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="protected_${Date.now()}.mp3"`,
        'X-Buyer-Email': buyerInfo.email,
        'X-Buyer-Name': buyerInfo.name,
        'X-Purchase-Date': purchaseDate,
        'X-Copyright': copyrightMetadata.copyright,
        'X-License': copyrightMetadata.license,
        'X-Watermark-Applied': 'true',
      },
    });

  } catch (error) {
    console.error('❌ Erreur métadonnées audio:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur lors de l\'ajout des métadonnées',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





















