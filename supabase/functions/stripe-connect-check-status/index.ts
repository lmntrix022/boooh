import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Configuration manquante",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer l'user_id depuis le header ou le body
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      // Extraire le token et obtenir l'user_id
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le compte depuis la base de données
    const { data: account, error: accountError } = await supabase
      .from("stripe_connect_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Compte Stripe Connect non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les informations à jour depuis Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.account_id);

    // Vérifier si l'onboarding est complété
    const isOnboarded = stripeAccount.details_submitted && 
                       stripeAccount.charges_enabled && 
                       stripeAccount.payouts_enabled;

    // Créer le login link si l'onboarding est complété
    let dashboardUrl = account.dashboard_url;
    if (isOnboarded && !dashboardUrl) {
      try {
        const loginLink = await stripe.accounts.createLoginLink(account.account_id);
        dashboardUrl = loginLink.url;
      } catch (loginError: any) {
        console.log("Cannot create login link:", loginError.message);
      }
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from("stripe_connect_accounts")
      .update({
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        onboarded: isOnboarded,
        dashboard_url: dashboardUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    if (updateError) {
      console.error("Error updating account:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        account_id: account.account_id,
        onboarded: isOnboarded,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        dashboard_url: dashboardUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error checking Stripe Connect status:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de la vérification du statut",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



