/**
 * Health Check API Endpoint
 *
 * Vérifie l'état de santé de l'application et de ses dépendances.
 * Utilisé pour monitoring, alertes, et load balancer health checks.
 *
 * Endpoints:
 * - GET /api/health - Health check simple (200 OK si vivant)
 * - GET /api/health?detailed=true - Health check détaillé avec statut des dépendances
 *
 * @see https://vercel.com/docs/functions/serverless-functions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks?: {
    supabase?: HealthCheckResult;
    database?: HealthCheckResult;
    storage?: HealthCheckResult;
    stripe?: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

/**
 * Vérifie la connexion à Supabase
 */
async function checkSupabase(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        status: 'down',
        error: 'VITE_SUPABASE_URL not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    // Ping l'API Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
      },
      signal: AbortSignal.timeout(5000), // Timeout 5s
    });

    const responseTime = Date.now() - start;

    return {
      status: response.ok ? 'up' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Vérifie la connexion à Stripe
 */
async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    // Vérifier que la clé Stripe est configurée
    const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      return {
        status: 'down',
        error: 'VITE_STRIPE_PUBLISHABLE_KEY not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    // Ping Stripe API (simple check)
    const response = await fetch('https://api.stripe.com/v1/charges', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - start;

    // 401 est OK (pas d'auth mais API répond)
    const isHealthy = response.ok || response.status === 401;

    return {
      status: isHealthy ? 'up' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: isHealthy ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Détermine le statut global basé sur les checks individuels
 */
function calculateOverallStatus(
  checks: HealthStatus['checks']
): 'healthy' | 'degraded' | 'unhealthy' {
  if (!checks) return 'healthy';

  const statuses = Object.values(checks).map((check) => check.status);

  // Si un service critique est down, tout est unhealthy
  if (statuses.includes('down')) {
    return 'unhealthy';
  }

  // Si un service est degraded, overall est degraded
  if (statuses.includes('degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Handler principal du health check
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Autoriser seulement GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const startTime = Date.now();
  const detailed = req.query.detailed === 'true';

  try {
    let checks: HealthStatus['checks'] | undefined;

    // Si detailed, exécuter tous les checks
    if (detailed) {
      const [supabaseCheck, stripeCheck] = await Promise.allSettled([
        checkSupabase(),
        checkStripe(),
      ]);

      checks = {
        supabase:
          supabaseCheck.status === 'fulfilled'
            ? supabaseCheck.value
            : {
                status: 'down',
                error: 'Check failed',
                lastChecked: new Date().toISOString(),
              },
        stripe:
          stripeCheck.status === 'fulfilled'
            ? stripeCheck.value
            : {
                status: 'down',
                error: 'Check failed',
                lastChecked: new Date().toISOString(),
              },
      };
    }

    const healthStatus: HealthStatus = {
      status: checks ? calculateOverallStatus(checks) : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.VITE_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      ...(detailed && { checks }),
    };

    // Status HTTP basé sur le health status
    const statusCode = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

    // Headers pour caching (pas de cache sur health checks)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    // En cas d'erreur dans le health check lui-même
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      uptime: process.uptime(),
      version: process.env.VITE_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
    });
  }
}
