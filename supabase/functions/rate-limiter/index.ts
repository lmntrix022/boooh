import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const UPSTASH_REDIS_REST_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RateLimitRequest {
  identifier: string; // IP address ou user_id
  action: string; // Type d'action (download, token_generation, etc.)
  max_requests?: number; // Default: 10
  window_seconds?: number; // Default: 60
}

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  reset_at: number;
  error_message?: string;
}

/**
 * 🔐 PHASE 2.1 - Rate Limiting avec Redis/Upstash
 *
 * Implémente un rate limiter distribué pour:
 * - Token generation (5 req/hour per IP)
 * - Download attempts (10 req/minute per IP)
 * - API calls (100 req/minute per user)
 * - Brute force protection
 *
 * Utilise l'algorithme Sliding Window avec Redis
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      identifier,
      action,
      max_requests = 10,
      window_seconds = 60
    }: RateLimitRequest = await req.json();

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          reset_at: 0,
          error_message: 'identifier and action are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 🔑 Générer la clé Redis unique
    const redisKey = `ratelimit:${action}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window_seconds;

    let allowed = false;
    let remaining = 0;
    let resetAt = now + window_seconds;

    // 🚀 Utiliser Upstash Redis si configuré, sinon fallback sur Supabase
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      // ✨ UPSTASH REDIS IMPLEMENTATION
      try {
        // Utiliser l'API REST d'Upstash (pas besoin de client Redis)
        const redisApiUrl = `${UPSTASH_REDIS_REST_URL}/pipeline`;

        // Pipeline Redis pour opération atomique
        const commands = [
          // 1. Supprimer les entrées expirées
          ['ZREMRANGEBYSCORE', redisKey, '-inf', windowStart],
          // 2. Compter les requêtes dans la fenêtre
          ['ZCARD', redisKey],
          // 3. Ajouter la requête actuelle si sous la limite
          ['ZADD', redisKey, now, `${now}-${crypto.randomUUID()}`],
          // 4. Définir l'expiration de la clé
          ['EXPIRE', redisKey, window_seconds * 2],
        ];

        const response = await fetch(redisApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commands),
        });

        if (!response.ok) {
          throw new Error(`Upstash API error: ${response.status}`);
        }

        const results = await response.json();

        // results[1] contient le count AVANT l'ajout
        const currentCount = results[1].result || 0;

        if (currentCount < max_requests) {
          allowed = true;
          remaining = max_requests - currentCount - 1;
        } else {
          // Supprimer la requête qu'on vient d'ajouter
          await fetch(`${UPSTASH_REDIS_REST_URL}/ZPOPMAX/${redisKey}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
            },
          });
          allowed = false;
          remaining = 0;
        }

        console.log(`✅ Upstash rate limit check: ${action} for ${identifier} - Allowed: ${allowed}, Count: ${currentCount}/${max_requests}`);

      } catch (redisError) {
        console.error('❌ Upstash Redis error, falling back to Supabase:', redisError);
        // Fallback sur Supabase
        const result = await checkRateLimitSupabase(
          identifier,
          action,
          max_requests,
          window_seconds
        );
        allowed = result.allowed;
        remaining = result.remaining;
        resetAt = result.reset_at;
      }

    } else {
      // 📊 SUPABASE FALLBACK IMPLEMENTATION
      console.log('⚠️ Upstash Redis not configured, using Supabase fallback');
      const result = await checkRateLimitSupabase(
        identifier,
        action,
        max_requests,
        window_seconds
      );
      allowed = result.allowed;
      remaining = result.remaining;
      resetAt = result.reset_at;
    }

    // 📝 Logger si rate limit dépassé
    if (!allowed) {
      await supabase
        .from('security_audit_logs')
        .insert({
          event_type: 'rate_limit_exceeded',
          metadata: {
            identifier,
            action,
            max_requests,
            window_seconds,
          },
          severity: 'warning',
          created_at: new Date().toISOString(),
        });
    }

    const response: RateLimitResponse = {
      allowed,
      remaining,
      reset_at: resetAt,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: allowed ? 200 : 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': max_requests.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetAt.toString(),
        },
      }
    );

  } catch (error) {
    console.error('❌ Rate limiter error:', error);
    return new Response(
      JSON.stringify({
        allowed: true, // Fail open en cas d'erreur système
        remaining: 0,
        reset_at: 0,
        error_message: 'Rate limiter error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Fallback rate limiting utilisant Supabase
 */
async function checkRateLimitSupabase(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResponse> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Chercher ou créer l'entrée de tracking
  const { data: existing } = await supabase
    .from('rate_limit_tracking')
    .select('*')
    .eq('ip_address', identifier)
    .eq('endpoint', action)
    .gte('window_end', now.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Fenêtre existante
    if (existing.is_blocked && existing.blocked_until && new Date(existing.blocked_until) > now) {
      return {
        allowed: false,
        remaining: 0,
        reset_at: Math.floor(new Date(existing.blocked_until).getTime() / 1000),
      };
    }

    if (existing.request_count >= maxRequests) {
      // Bloquer temporairement
      await supabase
        .from('rate_limit_tracking')
        .update({
          is_blocked: true,
          blocked_until: new Date(now.getTime() + windowSeconds * 1000).toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);

      return {
        allowed: false,
        remaining: 0,
        reset_at: Math.floor(new Date(existing.window_end).getTime() / 1000),
      };
    }

    // Incrémenter le compteur
    await supabase
      .from('rate_limit_tracking')
      .update({
        request_count: existing.request_count + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id);

    return {
      allowed: true,
      remaining: maxRequests - existing.request_count - 1,
      reset_at: Math.floor(new Date(existing.window_end).getTime() / 1000),
    };

  } else {
    // Nouvelle fenêtre
    const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

    await supabase
      .from('rate_limit_tracking')
      .insert({
        ip_address: identifier,
        endpoint: action,
        request_count: 1,
        window_start: now.toISOString(),
        window_end: windowEnd.toISOString(),
      });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset_at: Math.floor(windowEnd.getTime() / 1000),
    };
  }
}
