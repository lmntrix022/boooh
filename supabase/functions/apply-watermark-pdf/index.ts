import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb } from "https://cdn.skypack.dev/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WatermarkRequest {
  fileUrl: string;
  download_token: string; // 🔐 PHASE 1.2 - Token requis pour authentification
  buyerInfo: {
    email: string;
    name: string;
    purchaseDate?: string;
    productId?: string;
  };
  watermarkOptions?: {
    opacity?: number;
    fontSize?: number;
    position?: 'footer' | 'header' | 'diagonal';
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📄 Watermarking PDF request received');

    // 🔐 PHASE 1.2 - Vérification de l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestData: WatermarkRequest = await req.json();
    const { download_token } = requestData;

    if (!download_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'download_token is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 🔐 Valider le token et vérifier ownership
    const { data: inquiry, error: inquiryError } = await supabase
      .from('digital_inquiries')
      .select('id, payment_status, status, expires_at')
      .eq('download_token', download_token)
      .single();

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired download token',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier expiration
    if (new Date(inquiry.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Download token has expired',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier statut de paiement
    if (inquiry.payment_status !== 'paid' || inquiry.status !== 'completed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment not completed',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    const { fileUrl, buyerInfo, watermarkOptions } = requestData;

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

    console.log('📥 Téléchargement du PDF original:', fileUrl);

    // Télécharger le PDF original
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Impossible de télécharger le PDF: ${pdfResponse.status}`);
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    console.log('📝 Application du watermark...');

    // Options de watermark
    const opacity = watermarkOptions?.opacity || 0.3;
    const fontSize = watermarkOptions?.fontSize || 8;
    const position = watermarkOptions?.position || 'footer';

    // Créer le texte du watermark
    const purchaseDate = buyerInfo.purchaseDate 
      ? new Date(buyerInfo.purchaseDate).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR');

    const watermarkLines = [
      `© ${buyerInfo.name}`,
      `${buyerInfo.email}`,
      `Achat le ${purchaseDate}`,
      buyerInfo.productId ? `Produit: ${buyerInfo.productId}` : '',
    ].filter(line => line); // Enlever les lignes vides

    // Appliquer le watermark sur chaque page
    const pages = pdfDoc.getPages();
    let pageCount = 0;

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      let yPosition: number;
      let xPosition: number;

      if (position === 'footer') {
        // En bas de page
        yPosition = 30;
        xPosition = 50;
      } else if (position === 'header') {
        // En haut de page
        yPosition = height - 60;
        xPosition = 50;
      } else {
        // Diagonale (centre)
        yPosition = height / 2;
        xPosition = width / 2 - 100;
      }

      // Ajouter chaque ligne du watermark
      let currentY = yPosition;
      for (const line of watermarkLines) {
        page.drawText(line, {
          x: xPosition,
          y: currentY,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity,
        });
        currentY -= fontSize + 2; // Espacement entre les lignes
      }

      pageCount++;
    }

    console.log(`✅ Watermark appliqué sur ${pageCount} pages`);

    // Ajouter des métadonnées au PDF
    pdfDoc.setTitle(`${pdfDoc.getTitle() || 'Document'} - ${buyerInfo.name}`);
    pdfDoc.setAuthor(buyerInfo.name);
    pdfDoc.setSubject(`Achat le ${purchaseDate}`);
    pdfDoc.setCreator('Booh - Digital Products Platform');
    pdfDoc.setProducer('Booh DRM System');
    pdfDoc.setKeywords([
      buyerInfo.email,
      buyerInfo.name,
      purchaseDate,
      buyerInfo.productId || '',
    ]);

    // Sauvegarder le PDF watermarké
    const watermarkedBytes = await pdfDoc.save();

    console.log('✅ PDF watermarké généré:', watermarkedBytes.byteLength, 'bytes');

    // Retourner le PDF watermarké
    return new Response(watermarkedBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="watermarked_${Date.now()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('❌ Erreur watermarking:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur lors du watermarking',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





















