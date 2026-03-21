import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentIntentRequest {
  amount: number; // Montant en EUR (ou autre devise)
  currency: string; // 'eur' en minuscules (ou autre)
  order_id: string;
  order_type: 'physical' | 'digital';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
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
    const body: PaymentIntentRequest = await req.json();
    const {
      amount,
      currency = 'xof',
      order_id,
      order_type,
      customer_name,
      customer_email,
      customer_phone,
    } = body;

    // Validation des champs requis
    if (!amount || !customer_email) {
      return new Response(
        JSON.stringify({
          error: "Champs manquants",
          details: {
            amount: !!amount,
            customer_email: !!customer_email,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convertir le montant en centimes pour Stripe
    // Pour EUR (et la plupart des devises), 1 unité = 100 centimes
    // Ex: 20 EUR = 2000 centimes
    // Si le montant est déjà très grand (>= 10000), c'est probablement déjà en centimes
    // Sinon, on multiplie par 100 pour convertir -> centimes
    const amountInSmallestUnit = amount >= 10000
      ? Math.round(amount) // Déjà en centimes (ne devrait pas arriver normalement)
      : Math.round(amount * 100); // Convertir en centimes (EUR, USD, etc.)

    // Créer un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: {
        order_id: order_id,
        order_type: order_type,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone || '',
      },
      receipt_email: customer_email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ PaymentIntent créé: ${paymentIntent.id} pour la commande ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erreur dans stripe-create-payment-intent:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de la création du PaymentIntent",
        details: error.type || error.code || null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

