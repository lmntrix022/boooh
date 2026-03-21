import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

type EBillingStatus = "SUCCESS" | "FAILED" | "PENDING";

interface EBillingCallbackPayload {
  bill_id?: string;
  status?: EBillingStatus | string;
  reference?: string;
  amount?: string | number;
  payer_msisdn?: string;
  payer_name?: string;
  payer_email?: string;
  transaction_id?: string;
  paid_at?: string;
  [key: string]: unknown;
}

function detectPaymentSystem(msisdn?: string): string | null {
  if (!msisdn) return null;
  const clean = msisdn.replace(/\s|\+|-/g, "");
  if (/^(241)?07/.test(clean)) return "airtelmoney";
  if (/^(241)?06/.test(clean)) return "moovmoney4";
  return null;
}

function normalizeStatus(s?: string): EBillingStatus {
  const v = (s || "").toLowerCase();
  if (v.includes("success")) return "SUCCESS";
  if (v.includes("fail")) return "FAILED";
  if (v.includes("pending")) return "PENDING";
  return "PENDING";
}

// eBilling config (staging)
const EBILLING_BASE_URL = "https://stg.billing-easy.com/api/v1/merchant";
const EBILLING_USERNAME = Deno.env.get("EBILLING_USERNAME");
const EBILLING_SHARED_KEY = Deno.env.get("EBILLING_SHARED_KEY");

function getEBillingAuthHeader() {
  if (!EBILLING_USERNAME || !EBILLING_SHARED_KEY) return {} as Record<string, string>;
  const token = btoa(`${EBILLING_USERNAME}:${EBILLING_SHARED_KEY}`);
  return { Authorization: `Basic ${token}` } as Record<string, string>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const provided = url.searchParams.get("token") || req.headers.get("x-webhook-token") || "";
    const expected = Deno.env.get("EBILLING_WEBHOOK_TOKEN") || "";
    if (expected && provided !== expected) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let payload: EBillingCallbackPayload;
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("text/plain")) {
      const raw = await req.text();
      const params = new URLSearchParams(raw);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => (obj[k] = v));
      payload = {
        bill_id: obj.bill_id || obj.billingid || obj.billid || obj.bill || obj.billId,
        status: normalizeStatus(obj.status || obj.state),
        reference: obj.reference || obj.ref || obj.order_reference,
        amount: obj.amount || obj.total,
        payer_msisdn: obj.payer_msisdn || obj.msisdn || obj.phone,
        payer_name: obj.payer_name || obj.payername,
        payer_email: obj.payer_email || obj.payeremail,
        transaction_id: obj.transaction_id || obj.transactionid,
        paid_at: obj.paid_at || obj.createdat,
        raw: obj,
      } as EBillingCallbackPayload;
    } else {
      payload = await req.json();
    }

    // Validation minimale
    if (!payload || !payload.reference || !payload.status) {
      return new Response(JSON.stringify({ success: false, error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Init Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing service credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Log callback
    const paymentSystem = detectPaymentSystem(payload.payer_msisdn);
    await supabase.from("payment_callbacks").insert({
      bill_id: payload.bill_id,
      status: normalizeStatus(payload.status as string),
      reference: payload.reference,
      amount: payload.amount ? Number(payload.amount) : null,
      payer_msisdn: payload.payer_msisdn,
      payer_name: payload.payer_name,
      payer_email: payload.payer_email,
      transaction_id: payload.transaction_id,
      paid_at: payload.paid_at,
      payment_system: paymentSystem,
      raw_payload: payload,
      processed: false,
    });

    // 2) Retrouver l'inquiry (produit ou digital)
    const [{ data: productInquiries }, { data: digitalInquiries }] = await Promise.all([
      supabase.from("product_inquiries").select("*").eq("external_reference", payload.reference).limit(1),
      supabase.from("digital_inquiries").select("*").eq("external_reference", payload.reference).limit(1),
    ]);
    const inquiries = [...(productInquiries || []), ...(digitalInquiries || [])];

    // 3) Mettre à jour en fonction du statut + enregistrer dans payment_history (schéma existant)
    for (const inquiry of inquiries) {
      const table = inquiry.id ? "product_inquiries" : "digital_inquiries";
      const inquiryId = inquiry.id;
      const status = normalizeStatus(payload.status as string);
      const amountNumber = payload.amount ? Number(payload.amount) : null;
      const paymentMethod = "mobile_money"; // conforme à ton enum
      const paymentRef = payload.transaction_id || payload.bill_id || payload.reference || undefined;
      const paymentDate = payload.paid_at || new Date().toISOString();
      const userId = inquiry.user_id || inquiry.owner_id || null;

      if (status === "SUCCESS") {
        await supabase.from(table).update({
          payment_status: "paid",
          payment_method: "mobile_money",
          payment_operator: paymentSystem,
          transaction_id: payload.transaction_id,
          paid_at: payload.paid_at || new Date().toISOString(),
          status: "completed",
        }).eq("id", inquiryId);

        // Insert conforme au schéma fourni
        if (userId && amountNumber !== null) {
          await supabase.from("payment_history").insert({
            user_id: userId,
            subscription_id: null,
            amount: amountNumber,
            currency: "XOF",
            payment_method: paymentMethod,
            payment_status: "paid",
            transaction_reference: paymentRef,
            payment_date: paymentDate,
          });
        }

        // Tenter de marquer la facture "processed" côté eBilling
        try {
          if (payload.bill_id && EBILLING_USERNAME && EBILLING_SHARED_KEY) {
            await fetch(`${EBILLING_BASE_URL}/e_bills/${payload.bill_id}/process`, {
              method: "POST",
              headers: { ...getEBillingAuthHeader(), "Content-Type": "application/json" },
            });
          }
        } catch (_err) {
          // Non bloquant
        }
      }

      if (status === "FAILED") {
        await supabase.from(table).update({
          payment_status: "failed",
          payment_method: "mobile_money",
          payment_operator: paymentSystem,
          status: "cancelled",
        }).eq("id", inquiryId);

        if (userId && amountNumber !== null) {
          await supabase.from("payment_history").insert({
            user_id: userId,
            subscription_id: null,
            amount: amountNumber,
            currency: "XOF",
            payment_method: paymentMethod,
            payment_status: "failed",
            transaction_reference: paymentRef,
            payment_date: new Date().toISOString(),
          });
        }
      }
    }

    // 4) Marquer le callback traité
    await supabase.from("payment_callbacks").update({ processed: true, processed_at: new Date().toISOString() }).eq("reference", payload.reference);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


