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
    
    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🔐 All headers:', Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the token to get user_id
    // Extract JWT payload
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
      console.log('✅ Parsed token payload:', payload);
    } catch (e) {
      console.error('Error parsing token:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = payload.sub; // Extract user_id from token
    console.log('👤 User ID from token:', userId);

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
    const { plan_type } = await req.json();

    if (!plan_type) {
      return new Response(
        JSON.stringify({ error: 'plan_type is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map plan_type to database plan name
    const planNameMap: Record<string, string> = {
      'free': 'decouverte',
      'business': 'essentiel',
      'magic': 'pro',
    };

    const dbPlanName = planNameMap[plan_type] || plan_type;

    // Check if user already has a subscription (any status)
    const { data: existingSubscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mois

    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabaseClient
        .from('user_subscriptions')
        .update({
          plan_type: plan_type,
          status: 'active',
          updated_at: now,
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          subscription: data,
          message: `Mise à jour vers ${plan_type} réussie`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Create new subscription
      const { data, error } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_type: plan_type,
          status: 'active',
          start_date: now,
          end_date: endDate.toISOString(),
          auto_renew: true,
          addons: [],
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          subscription: data,
          message: `Abonnement ${plan_type} créé avec succès`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in upgrade-plan:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.details || null,
        hint: error.hint || null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
