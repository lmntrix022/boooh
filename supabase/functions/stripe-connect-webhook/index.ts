import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  try {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Configuration manquante");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer le body et la signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Vérifier la signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Gérer les événements
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account, supabase);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object as Stripe.Transfer, supabase);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data.object as Stripe.Transfer, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Gérer la mise à jour d'un compte
async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: any
) {
  const isOnboarded = account.charges_enabled && account.payouts_enabled && account.details_submitted;
  
  // Si l'onboarding est complété, créer le login link (dashboard_url)
  let dashboardUrl = null;
  if (isOnboarded) {
    try {
      // Récupérer le compte existant pour voir s'il a déjà un dashboard_url
      const { data: existingAccount } = await supabase
        .from("stripe_connect_accounts")
        .select("dashboard_url")
        .eq("account_id", account.id)
        .maybeSingle();
      
      // Si pas de dashboard_url, en créer un nouveau
      if (!existingAccount?.dashboard_url) {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
          apiVersion: "2023-10-16",
          httpClient: Stripe.createFetchHttpClient(),
        });
        
        const loginLink = await stripe.accounts.createLoginLink(account.id);
        dashboardUrl = loginLink.url;
      } else {
        dashboardUrl = existingAccount.dashboard_url;
      }
    } catch (error: any) {
      console.error("Error creating login link:", error.message);
      // Ne pas bloquer la mise à jour si le login link ne peut pas être créé
    }
  }

  await supabase
    .from("stripe_connect_accounts")
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      onboarded: isOnboarded,
      dashboard_url: dashboardUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account.id);
}

// Gérer un paiement réussi
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const metadata = paymentIntent.metadata;
  
  // Mettre à jour la transaction
  await supabase
    .from("stripe_connect_transactions")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_intent_id", paymentIntent.id);

  // Mettre à jour la commande
  if (metadata.order_id && metadata.order_type) {
    const orderTable = metadata.order_type === "physical" ? "product_inquiries" : "digital_inquiries";
    
    await supabase
      .from(orderTable)
      .update({
        status: "confirmed",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", metadata.order_id);
  }
}

// Gérer un paiement échoué
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  await supabase
    .from("stripe_connect_transactions")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_intent_id", paymentIntent.id);
}

// Gérer la création d'un transfert
async function handleTransferCreated(
  transfer: Stripe.Transfer,
  supabase: any
) {
  // Trouver la transaction correspondante
  const { data: transaction } = await supabase
    .from("stripe_connect_transactions")
    .select("*")
    .eq("payment_intent_id", transfer.metadata?.payment_intent_id || "")
    .single();

  if (transaction) {
    await supabase
      .from("stripe_connect_transactions")
      .update({
        transfer_id: transfer.id,
        transfer_status: transfer.reversed ? "reversed" : "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);
  }
}

// Gérer un transfert échoué
async function handleTransferFailed(
  transfer: Stripe.Transfer,
  supabase: any
) {
  const { data: transaction } = await supabase
    .from("stripe_connect_transactions")
    .select("*")
    .eq("transfer_id", transfer.id)
    .single();

  if (transaction) {
    await supabase
      .from("stripe_connect_transactions")
      .update({
        transfer_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);
  }
}

