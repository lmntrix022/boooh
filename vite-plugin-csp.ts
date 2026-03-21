/**
 * Plugin Vite pour injecter Content Security Policy (CSP) headers
 *
 * Ce plugin ajoute des meta tags CSP dans index.html pour protéger contre:
 * - XSS (Cross-Site Scripting)
 * - Injection de scripts malveillants
 * - Chargement de ressources non autorisées
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

import type { Plugin } from 'vite';

interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
}

interface CSPPluginOptions {
  /**
   * Directives CSP
   */
  policy: CSPDirectives;

  /**
   * Mode dev: ajouter 'unsafe-inline' et 'unsafe-eval' pour HMR
   * @default true
   */
  devRelaxed?: boolean;

  /**
   * Utiliser meta tag au lieu de header HTTP
   * @default true (car Vercel gère les headers via vercel.json)
   */
  useMetaTag?: boolean;
}

/**
 * Convertit les directives CSP en string
 * Exclut frame-ancestors pour les meta tags (doit être uniquement dans HTTP headers)
 */
function directivesToString(directives: CSPDirectives, excludeFrameAncestors = false): string {
  const filtered = { ...directives };
  if (excludeFrameAncestors) {
    delete filtered['frame-ancestors'];
  }
  return Object.entries(filtered)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Plugin CSP pour Vite
 */
export function vitePluginCSP(options: CSPPluginOptions): Plugin {
  const { policy, devRelaxed = true, useMetaTag = true } = options;

  return {
    name: 'vite-plugin-csp',

    transformIndexHtml(html, ctx) {
      // En mode dev, relaxer les règles pour HMR
      let finalPolicy = { ...policy };

      if (ctx.server && devRelaxed) {
        // Permettre HMR et eval en dev
        finalPolicy = {
          ...finalPolicy,
          'script-src': [
            ...(finalPolicy['script-src'] || []),
            "'unsafe-inline'",
            "'unsafe-eval'"
          ],
          'connect-src': [
            ...(finalPolicy['connect-src'] || []),
            'ws:', // WebSocket pour HMR
            'wss:'
          ]
        };
      }

      // Exclure frame-ancestors du meta tag (doit être uniquement dans HTTP headers)
      const cspString = directivesToString(finalPolicy, useMetaTag);

      if (useMetaTag) {
        // Injecter via meta tag (sans frame-ancestors)
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${cspString}">`
        );
      }

      // Sinon, retourner pour injection via header (géré par Vercel)
      return html;
    },

    configureServer(server) {
      // En dev, ajouter le header CSP
      server.middlewares.use((req, res, next) => {
        let finalPolicy = { ...policy };

        if (devRelaxed) {
          finalPolicy = {
            ...finalPolicy,
            'script-src': [
              ...(finalPolicy['script-src'] || []),
              "'unsafe-inline'",
              "'unsafe-eval'"
            ],
            'connect-src': [
              ...(finalPolicy['connect-src'] || []),
              'ws:',
              'wss:'
            ]
          };
        }

        // Inclure frame-ancestors dans les HTTP headers
        const cspString = directivesToString(finalPolicy, false);
        res.setHeader('Content-Security-Policy', cspString);
        next();
      });
    }
  };
}

/**
 * Configuration CSP recommandée pour Booh
 */
export const boohCSPConfig: CSPDirectives = {
  'default-src': ["'self'"],

  // Scripts: React, analytics, Stripe, TikTok embed, Tesseract.js OCR, Vercel Speed Insights
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Requis pour React inline event handlers
    "'wasm-unsafe-eval'", // Requis pour WebAssembly (Tesseract.js)
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
    'https://maps.googleapis.com',
    'https://www.tiktok.com', // Pour le script TikTok embed
    'https://*.ttwstatic.com', // Domaines TikTok pour les scripts embed
    'https://*.tiktokcdn.com', // CDN TikTok pour les ressources
    'https://cdn.jsdelivr.net', // Tesseract.js OCR worker
    'https://va.vercel-scripts.com' // Vercel Speed Insights
  ],

  // Styles: Tailwind, Google Fonts, Google Maps, TikTok
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Requis pour Tailwind et styles React
    'https://fonts.googleapis.com',
    'https://maps.googleapis.com', // Google Maps styles
    'https://*.tiktokcdn.com', // Styles TikTok
    'https://*.ttwstatic.com' // Styles TikTok static
  ],

  // Images: Supabase Storage, avatars, Google Maps tiles, TikTok
  'img-src': [
    "'self'",
    'data:', // Data URLs pour images inline
    'blob:', // Blob URLs pour previews
    'https://*.supabase.co',
    'https://*.googleapis.com', // Google APIs images
    'https://*.gstatic.com', // Google static resources (inclut maps.gstatic.com)
    'https://*.google.com', // Google domains
    'https://*.googleusercontent.com', // Google user content
    'https://*.ggpht.com', // Google hosted images
    'https://www.google-analytics.com',
    'https://*.stripe.com',
    'https://api.qrserver.com',
    'https://*.tiktokcdn.com', // Images TikTok
    'https://*.ttwstatic.com', // Images TikTok static
    'https://*.pravatar.cc' // Avatar placeholder service
  ],

  // Fonts
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com'
  ],

  // API calls: Supabase, Stripe, BillingEasy, Google Maps, Google Fonts, TikTok, BoohPay, Tesseract.js, OpenAI, Vercel Speed Insights, QR Server
  'connect-src': [
    "'self'",
    'data:', // Data URLs pour Tesseract.js WASM
    'blob:', // Blob URLs pour workers
    'https://*.supabase.co',
    'wss://*.supabase.co', // Realtime subscriptions
    'http://localhost:3000', // BoohPay API (développement)
    'https://api.boohpay.com', // BoohPay API (production)
    'https://api.ipify.org', // Lookup d'adresse IP publique
    'https://api.stripe.com',
    'https://maps.googleapis.com', // Google Maps API
    'https://*.googleapis.com', // Google APIs (Maps, Vision, etc.)
    'https://*.google.com', // Google domains
    'https://*.gstatic.com', // Google static resources
    'https://stg.billing-easy.net',
    'https://api.billing-easy.net',
    'https://www.google-analytics.com',
    'https://vision.googleapis.com',
    'https://fonts.googleapis.com', // Google Fonts CSS
    'https://fonts.gstatic.com', // Google Fonts fonts
    'https://www.tiktok.com', // TikTok API
    'https://*.ttwstatic.com', // TikTok static resources
    'https://*.tiktokcdn.com', // TikTok CDN
    'https://api.openai.com', // OpenAI API pour GPT-4o-mini (OCR parsing)
    'https://cdn.jsdelivr.net', // Tesseract.js OCR (worker + language files)
    'https://tessdata.projectnaptha.com', // Tesseract.js language data
    'https://va.vercel-scripts.com', // Vercel Speed Insights
    'https://api.qrserver.com' // QR Code generation API
  ],

  // Media: videos, audio depuis Supabase
  'media-src': [
    "'self'",
    'blob:',
    'https://*.supabase.co'
  ],

  // Pas d'objets Flash/Java
  'object-src': ["'none'"],

  // iframes: Stripe checkout, vidéos YouTube, Spotify, TikTok, Vimeo, etc.
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://open.spotify.com',
    'https://w.soundcloud.com',
    'https://www.tiktok.com',
    'https://www.tiktok.com/embed',
    'https://embed.tiktok.com',
    'https://player.vimeo.com',
    'https://vimeo.com'
  ],

  // Workers: Service Worker PWA, Tesseract.js OCR
  'worker-src': [
    "'self'",
    'blob:',
    'https://cdn.jsdelivr.net' // Tesseract.js OCR worker
  ],

  // Seul notre origine peut nous mettre en iframe (Flyover drawer) ; pas d’embed par des sites tiers (clickjacking)
  'frame-ancestors': ["'self'"],

  // Forms: seulement vers notre domaine
  'form-action': ["'self'"],

  // Base URI
  'base-uri': ["'self'"],

  // Manifest PWA
  'manifest-src': ["'self'"]
};
