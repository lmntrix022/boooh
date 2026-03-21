
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardId, url } = await req.json();
    
    if (!cardId || !url) {
      return new Response(
        JSON.stringify({ error: "Card ID and URL are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Generate QR code using a public API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    
    // Fetch the QR code as an image
    const qrResponse = await fetch(qrApiUrl);
    
    if (!qrResponse.ok) {
      throw new Error(`Error generating QR code: ${qrResponse.statusText}`);
    }
    
    // Get image blob
    const qrImageBlob = await qrResponse.blob();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://rntrorfvqbajmejwmifw.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Convert blob to base64 for storing in database
    const qrDataBuffer = await qrImageBlob.arrayBuffer();
    const qrDataBase64 = btoa(String.fromCharCode(...new Uint8Array(qrDataBuffer)));
    const qrDataUrl = `data:image/png;base64,${qrDataBase64}`;
    
    // Update the business card with the QR code URL
    const { error } = await supabase
      .from('business_cards')
      .update({ qr_code_url: qrDataUrl })
      .eq('id', cardId);
      
    if (error) {
      throw new Error(`Error updating card: ${error.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, qrUrl: qrDataUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
