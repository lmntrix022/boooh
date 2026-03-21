import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface CreatePaymentRequest {
  amount: number; // Montant total en EUR (ex: 25.50)
  currency?: string; // 'EUR' par défaut
  card_id: string;
  product_id?: string;
  digital_product_id?: string;
  order_id: string;
  order_type: 'physical' | 'digital';
  customer_email: string;
  customer_name: string;
  commission_rate?: number; // Pourcentage de commission (ex: 5.0 = 5%)
  commission_fixed?: number; // Commission fixe en EUR (optionnel)
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Récupérer les variables d'environnement
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Configuration manquante.",
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

    // Initialiser Supabase avec service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parser le body
    const body: CreatePaymentRequest = await req.json();
    const {
      amount,
      currency = "EUR",
      card_id,
      product_id,
      digital_product_id,
      order_id,
      order_type,
      customer_email,
      customer_name,
      commission_rate = 5.0,
      commission_fixed = 0,
    } = body;

    // Validation
    if (!card_id || !order_id || !order_type || !customer_email) {
      return new Response(
        JSON.stringify({ error: "Données manquantes" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le propriétaire de la carte
    const { data: card, error: cardError } = await supabase
      .from("business_cards")
      .select("user_id")
      .eq("id", card_id)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: "Carte introuvable" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le compte Stripe Connect du vendeur
    const { data: sellerAccount, error: accountError } = await supabase
      .from("stripe_connect_accounts")
      .select("*")
      .eq("user_id", card.user_id)
      .eq("onboarded", true)
      .eq("charges_enabled", true)
      .single();

    if (accountError || !sellerAccount) {
      return new Response(
        JSON.stringify({
          error: "Le vendeur n'a pas configuré Stripe Connect ou n'a pas complété l'onboarding",
          code: "STRIPE_CONNECT_NOT_SETUP",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convertir le montant en centimes
    const amountInCents = Math.round(amount * 100);
    
    // Calculer les montants (commission et montant pour le vendeur)
    const commissionRateAmount = Math.round(amountInCents * (commission_rate / 100));
    const commissionFixedAmount = Math.round(commission_fixed * 100);
    const platformFee = commissionRateAmount + commissionFixedAmount;
    const sellerAmount = amountInCents - platformFee;

    // Créer le PaymentIntent avec application_fee_amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerAccount.account_id,
      },
      metadata: {
        card_id: card_id,
        product_id: product_id || "",
        digital_product_id: digital_product_id || "",
        order_id: order_id,
        order_type: order_type,
        seller_account_id: sellerAccount.account_id,
        commission_rate: commission_rate.toString(),
        platform_fee: platformFee.toString(),
        seller_amount: sellerAmount.toString(),
      },
      receipt_email: customer_email,
      description: `Paiement pour ${order_type === 'physical' ? 'produit physique' : 'produit numérique'}`,
    });

    // Enregistrer la transaction dans la base de données
    const { error: transactionError } = await supabase
      .from("stripe_connect_transactions")
      .insert({
        payment_intent_id: paymentIntent.id,
        card_id: card_id,
        product_id: product_id || null,
        digital_product_id: digital_product_id || null,
        order_id: order_id,
        order_type: order_type,
        amount_total: amountInCents,
        amount_platform: platformFee,
        amount_seller: sellerAmount,
        currency: currency.toUpperCase(),
        commission_rate: commission_rate,
        commission_fixed: commissionFixedAmount,
        status: "pending",
        customer_email: customer_email,
        seller_account_id: sellerAccount.account_id,
      });

    if (transactionError) {
      console.error("Error saving transaction:", transactionError);
      // Ne pas échouer si la sauvegarde échoue, le webhook la créera
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: amountInCents,
        currency: currency.toUpperCase(),
        platform_fee: platformFee,
        seller_amount: sellerAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de la création du paiement",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

