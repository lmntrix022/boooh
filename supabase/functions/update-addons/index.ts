import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the token to get user_id
    const tokenParts = authHeader.replace('Bearer ', '').split('.');
    if (tokenParts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode the payload (base64)
    let payload;
    try {
      const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(atob(base64Payload));
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = payload.sub;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { addons } = await req.json();

    if (!Array.isArray(addons)) {
      return new Response(
        JSON.stringify({ error: 'addons must be an array' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's active subscription to check if they can have addons
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription || subscription.plan_type === 'free') {
      return new Response(
        JSON.stringify({ 
          error: 'Vous devez avoir un plan BUSINESS ou MAGIC pour ajouter des addons' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate total cost
    const addonPrices: Record<string, number> = {
      'pack_createur': 7500,
      'pack_volume': 5000,
      'pack_equipe': 5000,
      'pack_brand': 8000,
      'pack_analytics_pro': 6000,
    };

    const totalCost = addons.reduce((total, addon) => {
      return total + (addonPrices[addon] || 0);
    }, 0);

    // Delete existing active addons for this user
    await supabaseClient
      .from('user_addons')
      .delete()
      .eq('user_id', userId);

    // Insert new addons
    if (addons.length > 0) {
      const addonData = addons.map((addonType: string) => ({
        user_id: userId,
        addon_type: addonType,
        quantity: 1,
        purchased_at: new Date().toISOString(),
        expires_at: null,
        auto_renew: true,
        payment_id: null,
        notes: `Addon ajouté manuellement - Total: ${totalCost} FCFA`,
      }));

      const { data, error } = await supabaseClient
        .from('user_addons')
        .insert(addonData)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          addons: data,
          total_cost: totalCost,
          message: `${addons.length} addon(s) ajouté(s) avec succès`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // User removed all addons
      return new Response(
        JSON.stringify({
          success: true,
          addons: [],
          message: 'Tous les addons ont été supprimés',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in update-addons:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
