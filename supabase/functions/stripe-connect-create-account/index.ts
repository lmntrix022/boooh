import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface CreateAccountRequest {
  user_id: string;
  email: string;
  country?: string;
  return_url?: string;
  refresh_url?: string;
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
          error: "Configuration manquante. Veuillez configurer STRIPE_SECRET_KEY, SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
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
    const body: CreateAccountRequest = await req.json();
    const { user_id, email, country = "FR", return_url, refresh_url } = body;

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "user_id et email sont requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier si l'utilisateur a déjà un compte
    const { data: existingAccount, error: accountError } = await supabase
      .from("stripe_connect_accounts")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();
    
    if (accountError && accountError.code !== 'PGRST116') {
      console.error("Error checking existing account:", accountError);
      throw accountError;
    }

    if (existingAccount) {
      // Si le compte existe mais n'est pas onboarded, créer un nouveau lien
      if (!existingAccount.onboarded) {
        const accountLink = await stripe.accountLinks.create({
          account: existingAccount.account_id,
          refresh_url: refresh_url || `${Deno.env.get("PUBLIC_URL") || "https://booh.ga"}/dashboard/settings/stripe`,
          return_url: return_url || `${Deno.env.get("PUBLIC_URL") || "https://booh.ga"}/dashboard/settings/stripe?success=true`,
          type: "account_onboarding",
        });

        // Mettre à jour l'URL d'onboarding
        const { error: updateError } = await supabase
          .from("stripe_connect_accounts")
          .update({ onboarding_url: accountLink.url })
          .eq("id", existingAccount.id);
        
        if (updateError) {
          console.error("Error updating onboarding URL:", updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            account_id: existingAccount.account_id,
            onboarding_url: accountLink.url,
            existing: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Si déjà onboarded, retourner l'URL du dashboard
      return new Response(
        JSON.stringify({
          account_id: existingAccount.account_id,
          dashboard_url: existingAccount.dashboard_url,
          onboarded: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Créer un nouveau compte Express
    const account = await stripe.accounts.create({
      type: "express",
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily", // Paiements quotidiens aux vendeurs
          },
        },
      },
    });

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url || `${Deno.env.get("PUBLIC_URL") || "https://booh.ga"}/dashboard/settings/stripe`,
      return_url: return_url || `${Deno.env.get("PUBLIC_URL") || "https://booh.ga"}/dashboard/settings/stripe?success=true`,
      type: "account_onboarding",
    });

    // Ne pas créer le login link maintenant car le compte n'a pas encore complété l'onboarding
    // Le login link sera créé plus tard via le webhook ou lors de la vérification du statut
    let dashboardUrl: string | null = null;
    
    // Seulement créer le login link si le compte a déjà complété l'onboarding
    if (account.details_submitted && account.charges_enabled) {
      try {
        const loginLink = await stripe.accounts.createLoginLink(account.id);
        dashboardUrl = loginLink.url;
      } catch (loginError: any) {
        // Ignorer l'erreur si on ne peut pas créer le login link (normal pour un nouveau compte)
        console.log("Cannot create login link yet (onboarding not complete):", loginError.message);
      }
    }

    // Sauvegarder dans la base de données
    const { error: dbError } = await supabase
      .from("stripe_connect_accounts")
      .insert({
        user_id: user_id,
        account_id: account.id,
        account_type: "express",
        email: email,
        country: country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        onboarded: account.details_submitted && account.charges_enabled && account.payouts_enabled,
        onboarding_url: accountLink.url,
        dashboard_url: dashboardUrl,
      });

    if (dbError) {
      console.error("Error saving account to database:", dbError);
      console.error("DB Error details:", JSON.stringify(dbError, null, 2));
      throw new Error(`Database error: ${dbError.message} (code: ${dbError.code})`);
    }

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboarding_url: accountLink.url,
        dashboard_url: dashboardUrl,
        onboarded: account.details_submitted && account.charges_enabled && account.payouts_enabled,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Détecter l'erreur spécifique de Stripe Connect non activé
    const isConnectNotActivated = error.message?.includes("signed up for Connect") || 
                                   error.message?.includes("Connect") ||
                                   error.raw?.message?.includes("signed up for Connect");
    
    // Message d'erreur personnalisé et plus clair
    let errorMessage = error.message || "Erreur lors de la création du compte Stripe Connect";
    let userFriendlyMessage = errorMessage;
    let statusCode = 500;
    
    if (isConnectNotActivated) {
      userFriendlyMessage = "Stripe Connect n'est pas activé sur votre compte Stripe. Veuillez activer Stripe Connect dans votre Dashboard Stripe avant de continuer.";
      statusCode = 400; // Bad Request car c'est un problème de configuration
      errorMessage = "Stripe Connect not activated. Please enable Stripe Connect in your Stripe Dashboard: https://dashboard.stripe.com/settings/connect";
    }
    
    return new Response(
      JSON.stringify({
        error: userFriendlyMessage,
        technicalError: errorMessage,
        type: error.type || error.name || 'UnknownError',
        connectNotActivated: isConnectNotActivated,
        helpUrl: isConnectNotActivated ? "https://stripe.com/docs/connect" : undefined
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

