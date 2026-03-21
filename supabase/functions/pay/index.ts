import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

// Configuration via secrets Supabase
const EBILLING_BASE_URL = "https://stg.billing-easy.com/api/v1/merchant";
const EBILLING_USERNAME = Deno.env.get("EBILLING_USERNAME");
const EBILLING_SHARED_KEY = Deno.env.get("EBILLING_SHARED_KEY");

if (!EBILLING_USERNAME || !EBILLING_SHARED_KEY) {
  throw new Error("EBILLING_USERNAME or EBILLING_SHARED_KEY not set!");
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAuthHeader() {
  const creds = btoa(`${EBILLING_USERNAME}:${EBILLING_SHARED_KEY}`);
  return { Authorization: `Basic ${creds}` } as Record<string, string>;
}

function detectPaymentSystem(msisdn: string): "airtelmoney" | "moovmoney4" | undefined {
  const phone = (msisdn || "").replace(/\s|\+|-/g, "");
  if (/^(241)?07/.test(phone)) return "airtelmoney";
  if (/^(241)?06/.test(phone)) return "moovmoney4";
  return undefined;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const {
      payer_email,
      payer_msisdn,
      amount,
      short_description,
      external_reference,
      payer_name,
      expiry_period = "60",
    } = await req.json();

    // Validation minimale
    if (!payer_email || !payer_msisdn || !amount || !payer_name) {
      return new Response(
        JSON.stringify({ error: "Champs manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payment_system_name = detectPaymentSystem(payer_msisdn);
    if (!payment_system_name) {
      return new Response(
        JSON.stringify({ error: "Opérateur non reconnu (06 Moov / 07 Airtel - Gabon)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Créer la facture (e_bills)
    const createBillRes = await fetch(`${EBILLING_BASE_URL}/e_bills`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        payer_email,
        payer_msisdn,
        amount,
        short_description,
        external_reference,
        payer_name,
        expiry_period,
      }),
    });

    // Certaines implémentations eBilling renvoient des statuts non-200 mais un body valide
    const createBillText = await createBillRes.text();
    let createBillJson: any = {};
    try { createBillJson = JSON.parse(createBillText); } catch { createBillJson = { raw: createBillText }; }

    const billId: string | undefined = createBillJson?.bill_id
      || createBillJson?.e_bill?.bill_id
      || createBillJson?.data?.e_bill?.bill_id;

    if (!billId) {
      return new Response(
        JSON.stringify({ error: "Erreur création facture", detail: createBillJson }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Envoyer USSD push
    const ussdRes = await fetch(`${EBILLING_BASE_URL}/e_bills/${billId}/ussd_push`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        payer_msisdn,
        payment_system_name,
      }),
    });

    const ussdText = await ussdRes.text();
    let ussdJson: any = {};
    try { ussdJson = JSON.parse(ussdText); } catch { ussdJson = { raw: ussdText }; }
    if (!ussdRes.ok) {
      return new Response(
        JSON.stringify({ error: "Erreur USSD Push", detail: ussdJson }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        bill_id: billId,
        payment_system: payment_system_name,
        ussd_result: ussdJson,
        instructions: `USSD envoyé via ${payment_system_name}. Validez le paiement sur votre téléphone.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});