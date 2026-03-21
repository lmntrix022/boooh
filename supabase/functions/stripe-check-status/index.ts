import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusRequest {
  session_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Récupérer la clé secrète Stripe
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Stripe non configuré. Veuillez configurer STRIPE_SECRET_KEY dans les secrets Supabase.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialiser Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parser le body
    const body: StatusRequest = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return new Response(
        JSON.stringify({
          error: "session_id manquant",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'],
    });

    // Déterminer le statut
    let status: 'paid' | 'unpaid' | 'complete' | 'pending' = 'unpaid';
    
    if (session.payment_status === 'paid' && session.status === 'complete') {
      status = 'complete';
    } else if (session.payment_status === 'paid') {
      status = 'paid';
    } else if (session.payment_status === 'unpaid') {
      status = 'unpaid';
    } else {
      status = 'pending';
    }

    // Récupérer le payment_intent_id si disponible
    const paymentIntentId = session.payment_intent
      ? typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as any).id
      : null;

    console.log(`📊 Statut Stripe pour ${session_id}: ${status}`);

    return new Response(
      JSON.stringify({
        status,
        session_id: session.id,
        payment_intent_id: paymentIntentId,
        customer_email: session.customer_email || session.customer_details?.email || null,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erreur dans stripe-check-status:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de la vérification du statut Stripe",
        details: error.type || error.code || null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



