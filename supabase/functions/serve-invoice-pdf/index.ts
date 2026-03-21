// Supabase Edge Function pour servir les PDF de factures
// Génère un lien de téléchargement temporaire pour les factures

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ServeInvoiceRequest {
  invoice_number: string;
  pdf_base64: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data: ServeInvoiceRequest = await req.json();

    if (!data.pdf_base64 || !data.invoice_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: pdf_base64, invoice_number'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Convertir base64 en bytes
    const pdfBytes = Uint8Array.from(atob(data.pdf_base64), c => c.charCodeAt(0));

    // Retourner le PDF avec les headers appropriés pour forcer le téléchargement
    const filename = `facture-${data.invoice_number}.pdf`;
    
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving PDF:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

