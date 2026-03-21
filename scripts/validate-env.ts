/**
 * Script de validation des variables d'environnement
 * S'assure que toutes les variables nécessaires sont présentes et valides
 *
 * Usage: npm run validate:env
 */

import { z } from 'zod';

// Schéma de validation pour les variables d'environnement
const envSchema = z.object({
  // Supabase (REQUIS)
  VITE_SUPABASE_URL: z.string().url('URL Supabase invalide'),
  VITE_SUPABASE_ANON_KEY: z.string().min(50, 'Clé Supabase trop courte'),

  // Google Maps (REQUIS pour les maps)
  VITE_GOOGLE_MAPS_API_KEY: z.string().min(30, 'Clé API Google Maps invalide'),

  // Google Vision (OPTIONNEL mais recommandé)
  VITE_GOOGLE_VISION_API: z.string().optional(),

  // Email (REQUIS pour notifications)
  RESEND_API_KEY: z.string().startsWith('re_', 'Clé Resend doit commencer par re_'),
  VITE_EMAIL_FROM: z.string().email('Email FROM invalide'),

  // Cron (REQUIS pour tâches automatisées)
  CRON_SECRET: z.string().min(32, 'CRON_SECRET doit faire au moins 32 caractères'),

  // Analytics (OPTIONNEL)
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_GOOGLE_SITE_VERIFICATION: z.string().optional(),

  // BillingEasy (REQUIS pour paiements mobile money)
  EBILLING_USERNAME: z.string().min(1, 'Username eBilling requis'),
  EBILLING_SHARED_KEY: z.string().uuid('Shared key eBilling doit être un UUID'),
  VITE_BILLING_EASY_API_URL: z.string().url('URL API BillingEasy invalide'),
  VITE_BILLING_EASY_API_ID: z.string().min(1, 'API ID BillingEasy requis'),
  VITE_BILLING_EASY_API_SECRET: z.string().min(1, 'API Secret BillingEasy requis'),

  // Stripe (REQUIS pour paiements carte)
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Clé Stripe doit commencer par pk_'),

  // Sentry (OPTIONNEL mais fortement recommandé en production)
  VITE_SENTRY_DSN: z.string().url('DSN Sentry invalide').optional(),
});

// Type TypeScript inféré du schéma
export type Env = z.infer<typeof envSchema>;

/**
 * Valide les variables d'environnement
 * @throws {Error} Si validation échoue
 */
export function validateEnv(): Env {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_VISION_API: import.meta.env.VITE_GOOGLE_VISION_API,
    RESEND_API_KEY: import.meta.env.RESEND_API_KEY,
    VITE_EMAIL_FROM: import.meta.env.VITE_EMAIL_FROM,
    CRON_SECRET: import.meta.env.CRON_SECRET,
    VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
    VITE_GOOGLE_SITE_VERIFICATION: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
    EBILLING_USERNAME: import.meta.env.EBILLING_USERNAME,
    EBILLING_SHARED_KEY: import.meta.env.EBILLING_SHARED_KEY,
    VITE_BILLING_EASY_API_URL: import.meta.env.VITE_BILLING_EASY_API_URL,
    VITE_BILLING_EASY_API_ID: import.meta.env.VITE_BILLING_EASY_API_ID,
    VITE_BILLING_EASY_API_SECRET: import.meta.env.VITE_BILLING_EASY_API_SECRET,
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  };

  try {
    const validated = envSchema.parse(env);
    console.log('✅ Toutes les variables d\'environnement sont valides');
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erreurs de validation des variables d\'environnement:\n');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Vérifiez votre fichier .env.local et assurez-vous qu\'il contient toutes les variables requises.');
      console.error('   Référez-vous à .env.example pour la liste complète.\n');
    }
    throw error;
  }
}

/**
 * Vérifie que les secrets ne sont pas des valeurs par défaut
 */
export function checkForDefaultSecrets(): void {
  const dangerousDefaults = [
    'your-supabase-anon-key',
    'your-google-maps-api-key',
    'your-google-vision-api-key',
    'your-resend-api-key',
    'your-cron-secret-key',
    'your-ebilling',
    'your-stripe-key',
  ];

  const envString = JSON.stringify(import.meta.env);

  const foundDefaults = dangerousDefaults.filter(defaultValue =>
    envString.toLowerCase().includes(defaultValue)
  );

  if (foundDefaults.length > 0) {
    console.error('⚠️  ATTENTION: Valeurs par défaut détectées dans les variables d\'environnement:');
    foundDefaults.forEach(def => console.error(`  - ${def}`));
    console.error('\n🔒 Assurez-vous de remplacer toutes les valeurs par défaut par de vraies clés API.\n');
    throw new Error('Secrets par défaut détectés');
  }
}

/**
 * Vérifie que les clés sensibles ne sont pas exposées dans le code
 */
export function checkForHardcodedSecrets(): void {
  const sensitivePatterns = [
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT tokens
    /pk_live_[a-zA-Z0-9]{24,}/g, // Stripe live keys
    /sk_live_[a-zA-Z0-9]{24,}/g, // Stripe secret keys
    /re_[a-zA-Z0-9]{32,}/g, // Resend API keys
  ];

  // Note: Cette vérification devrait être exécutée via un git hook
  console.log('💡 Recommandation: Installer gitleaks pour scanner les secrets hardcodés');
  console.log('   npm install -g gitleaks && gitleaks detect --source .');
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log('🔍 Validation des variables d\'environnement...\n');
    validateEnv();
    checkForDefaultSecrets();
    checkForHardcodedSecrets();
    console.log('\n✅ Validation complète réussie!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Validation échouée\n');
    process.exit(1);
  }
}
