/**
 * Configuration Sentry pour monitoring et error tracking
 *
 * Sentry capture automatiquement:
 * - Erreurs JavaScript non gérées
 * - Erreurs React (via ErrorBoundary)
 * - Promesses rejetées
 * - Performance (Web Vitals)
 * - Transactions utilisateur
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */

import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Initialise Sentry
 * À appeler au démarrage de l'application (main.tsx)
 */
export function initSentry() {
  // Ne pas initialiser Sentry en développement local
  if (import.meta.env.DEV) {
    console.log('🔍 Sentry disabled in development mode');
    return;
  }

  // Vérifier que le DSN est configuré
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured. Sentry monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,

    // Environnement
    environment: import.meta.env.MODE,

    // Release tracking (pour identifier les versions dans Sentry)
    release: `booh@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,

    // Intégrations
    integrations: [
      // React Router integration
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),

      // Replay sessions pour debug (Sentry v10 API)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),

      // Browser Tracing pour performance
      Sentry.browserTracingIntegration(),

      // HTTP Client errors
      Sentry.httpClientIntegration(),
    ],

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% en prod, 100% en staging

    // Session Replay - désactivé en dev
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtrage des erreurs
    beforeSend(event, hint) {
      // Filtrer les erreurs de développement
      if (import.meta.env.DEV) {
        return null;
      }

      // Filtrer les erreurs réseau temporaires
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();

        // Ignorer les erreurs réseau courantes
        if (
          message.includes('network error') ||
          message.includes('failed to fetch') ||
          message.includes('networkerror') ||
          message.includes('load failed')
        ) {
          // Log mais ne pas envoyer à Sentry (trop de bruit)
          console.warn('Network error ignored:', error);
          return null;
        }

        // Ignorer les annulations de requêtes
        if (message.includes('abort') || message.includes('cancel')) {
          return null;
        }
      }

      // Enrichir l'événement avec contexte
      if (event.user) {
        // Ne pas envoyer d'informations sensibles
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },

    // Breadcrumbs (traces d'événements avant erreur)
    beforeBreadcrumb(breadcrumb) {
      // Filtrer les breadcrumbs sensibles
      if (breadcrumb.category === 'console') {
        return null; // Ignorer les console.log
      }

      // Ne pas capturer les données de formulaires
      if (breadcrumb.category === 'ui.input') {
        delete breadcrumb.message;
        delete breadcrumb.data;
      }

      return breadcrumb;
    },

    // Ignorer certaines erreurs connues
    ignoreErrors: [
      // Erreurs de navigateur
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',

      // Erreurs d'extensions navigateur
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Erreurs React courantes (non critiques)
      'Hydration failed',
      'Minified React error',

      // Erreurs Supabase temporaires
      'JWT expired',
      'refresh_token_not_found',

      // Erreurs CoreLocation (Google Maps - non critiques)
      'CoreLocationProvider',
      'kCLErrorLocationUnknown',
      'CoreLocation framework reported',
    ],

    // URLs à ignorer
    denyUrls: [
      // Extensions navigateur
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,

      // Scripts tiers problématiques
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],

    // Transport options
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),

    // Limiter la taille des événements
    maxBreadcrumbs: 50,
    maxValueLength: 1000,
  });

  // Log initialisation
  console.log('✅ Sentry initialized:', {
    environment: import.meta.env.MODE,
    release: `booh@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,
  });
}

/**
 * Capture une erreur manuellement
 *
 * @param error - L'erreur à capturer
 * @param context - Contexte additionnel
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.error('Error captured (dev mode):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture un message (non-erreur)
 *
 * @param message - Message à capturer
 * @param level - Niveau de sévérité
 * @param context - Contexte additionnel
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.log(`Message captured (${level}):`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Définir l'utilisateur courant pour le contexte Sentry
 *
 * @param user - Informations utilisateur (sans données sensibles)
 */
export function setSentryUser(user: {
  id: string;
  username?: string;
  role?: string;
} | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Ajouter du contexte à tous les événements Sentry suivants
 *
 * @param key - Clé du contexte
 * @param value - Valeur du contexte
 */
export function setSentryContext(
  key: string,
  value: Record<string, unknown>
): void {
  Sentry.setContext(key, value);
}

/**
 * Ajouter un tag à tous les événements Sentry suivants
 *
 * @param key - Clé du tag
 * @param value - Valeur du tag
 */
export function setSentryTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Créer un breadcrumb manuel
 *
 * @param message - Message du breadcrumb
 * @param category - Catégorie
 * @param level - Niveau
 * @param data - Données additionnelles
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'manual',
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Wrapper pour mesurer performance d'une opération
 *
 * @param name - Nom de l'opération
 * @param operation - Fonction à mesurer
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  // Utiliser startSpan au lieu de startTransaction (deprecated dans Sentry v8)
  return await Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    async () => {
      try {
        return await operation();
      } catch (error) {
        captureError(error as Error, { operation: name });
        throw error;
      }
    }
  );
}

/**
 * ErrorBoundary Sentry pour React
 * À utiliser comme wrapper de l'application
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * withProfiler HOC pour mesurer performance des composants
 */
export const withSentryProfiler = Sentry.withProfiler;

// Export tout Sentry pour usage avancé
export { Sentry };
