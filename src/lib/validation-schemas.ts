/**
 * Schémas de validation Zod centralisés
 *
 * Ce fichier contient tous les schémas de validation pour l'application.
 * Utiliser ces schémas pour valider toutes les entrées utilisateur et données API.
 *
 * @see https://zod.dev
 */

import { z } from 'zod';

// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * UUID v4 valide
 */
export const UuidSchema = z.string().uuid('UUID invalide');

/**
 * Email valide
 */
export const EmailSchema = z.string().email('Email invalide').min(5).max(255);

/**
 * URL valide (HTTP/HTTPS)
 */
export const UrlSchema = z.string().url('URL invalide').max(2048);

/**
 * Numéro de téléphone (format international)
 */
export const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide')
  .optional();

/**
 * Date ISO 8601
 */
export const DateISOSchema = z.string().datetime('Date invalide');

// ============================================================================
// BUSINESS CARDS
// ============================================================================

/**
 * Validation des données de carte de visite
 */
export const BusinessCardSchema = z.object({
  id: UuidSchema.optional(),
  user_id: UuidSchema,

  // Informations de base
  full_name: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  job_title: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),

  // Contact
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  website: UrlSchema.optional(),

  // Adresse
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),

  // Géolocalisation
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // Média
  avatar_url: UrlSchema.optional(),
  cover_image_url: UrlSchema.optional(),

  // Visibilité
  is_public: z.boolean().default(true),
  is_active: z.boolean().default(true),

  // Métadonnées
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type BusinessCardInput = z.infer<typeof BusinessCardSchema>;

/**
 * Validation ID de carte
 */
export const CardIdSchema = UuidSchema;

// ============================================================================
// DIGITAL PRODUCTS
// ============================================================================

/**
 * Types de produits digitaux autorisés
 */
export const DigitalProductTypeSchema = z.enum([
  'ebook',
  'video',
  'audio',
  'software',
  'document',
  'image',
  'other'
]);

/**
 * Validation produit digital
 */
export const DigitalProductSchema = z.object({
  id: UuidSchema.optional(),
  card_id: UuidSchema,
  user_id: UuidSchema,

  // Informations produit
  title: z.string().min(3, 'Titre requis (min 3 caractères)').max(200),
  description: z.string().max(2000).optional(),
  type: DigitalProductTypeSchema,

  // Prix
  price: z.number()
    .min(0, 'Prix doit être positif ou 0 (gratuit)')
    .max(999999, 'Prix maximum: 999 999')
    .multipleOf(0.01, 'Prix doit avoir max 2 décimales'),

  // Fichier
  file_url: z.string().max(1024).optional(),
  file_size: z.number().int().positive().optional(),
  file_type: z.string().max(100).optional(),

  // Metadata
  is_active: z.boolean().default(true),
  download_limit: z.number().int().positive().optional(),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type DigitalProductInput = z.infer<typeof DigitalProductSchema>;

/**
 * Validation ID de produit
 */
export const ProductIdSchema = UuidSchema;

// ============================================================================
// PAIEMENTS
// ============================================================================

/**
 * Méthodes de paiement supportées
 */
export const PaymentMethodSchema = z.enum([
  'stripe',
  'mobile_money',
  'cash',
  'free'
]);

/**
 * Statuts de paiement
 */
export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded'
]);

/**
 * Validation transaction de paiement
 */
export const PaymentTransactionSchema = z.object({
  id: UuidSchema.optional(),
  user_id: UuidSchema,
  product_id: UuidSchema.optional(),

  // Montant
  amount: z.number().positive('Montant doit être positif').multipleOf(0.01),
  currency: z.string().length(3, 'Code devise ISO 4217 (ex: XOF, USD)').default('XOF'),

  // Méthode et statut
  payment_method: PaymentMethodSchema,
  status: PaymentStatusSchema.default('pending'),

  // Références externes
  stripe_payment_intent_id: z.string().optional(),
  ebilling_transaction_id: z.string().optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type PaymentTransactionInput = z.infer<typeof PaymentTransactionSchema>;

// ============================================================================
// UTILISATEURS & AUTHENTIFICATION
// ============================================================================

/**
 * Validation inscription
 */
export const SignUpSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(8, 'Mot de passe doit contenir au moins 8 caractères')
    .max(72, 'Mot de passe trop long (max 72 caractères)')
    .regex(/[A-Z]/, 'Mot de passe doit contenir une majuscule')
    .regex(/[a-z]/, 'Mot de passe doit contenir une minuscule')
    .regex(/[0-9]/, 'Mot de passe doit contenir un chiffre'),
  full_name: z.string().min(2, 'Nom complet requis').max(100),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * Validation connexion
 */
export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export type SignInInput = z.infer<typeof SignInSchema>;

/**
 * Validation profil utilisateur
 */
export const ProfileSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  full_name: z.string().min(2).max(100),
  avatar_url: UrlSchema.optional(),
  phone: PhoneSchema,
  bio: z.string().max(500).optional(),

  // Préférences
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['fr', 'en']).default('fr'),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// ============================================================================
// ABONNEMENTS
// ============================================================================

/**
 * Plans d'abonnement
 */
export const SubscriptionPlanSchema = z.enum([
  'free',
  'basic',
  'pro',
  'enterprise'
]);

/**
 * Statuts d'abonnement
 */
export const SubscriptionStatusSchema = z.enum([
  'active',
  'inactive',
  'cancelled',
  'past_due',
  'trialing'
]);

/**
 * Validation abonnement
 */
export const SubscriptionSchema = z.object({
  id: UuidSchema.optional(),
  user_id: UuidSchema,

  plan: SubscriptionPlanSchema,
  status: SubscriptionStatusSchema,

  // Dates
  start_date: DateISOSchema,
  end_date: DateISOSchema.optional(),
  trial_end_date: DateISOSchema.optional(),

  // Stripe
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),

  // Limites
  cards_limit: z.number().int().positive().optional(),
  products_limit: z.number().int().positive().optional(),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type SubscriptionInput = z.infer<typeof SubscriptionSchema>;

// ============================================================================
// RENDEZ-VOUS (APPOINTMENTS)
// ============================================================================

/**
 * Statuts de rendez-vous
 */
export const AppointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
]);

/**
 * Validation rendez-vous
 */
export const AppointmentSchema = z.object({
  id: UuidSchema.optional(),
  card_id: UuidSchema,
  user_id: UuidSchema,

  // Informations client
  client_name: z.string().min(2).max(100),
  client_email: EmailSchema,
  client_phone: PhoneSchema,

  // Rendez-vous
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  appointment_date: DateISOSchema,
  duration_minutes: z.number().int().positive().max(480), // Max 8h

  // Statut
  status: AppointmentStatusSchema.default('pending'),

  // Notifications
  reminder_sent: z.boolean().default(false),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type AppointmentInput = z.infer<typeof AppointmentSchema>;

// ============================================================================
// AVIS & NOTES (REVIEWS)
// ============================================================================

/**
 * Validation note (1-5)
 */
export const RatingSchema = z.number()
  .int('La note doit être un entier')
  .min(1, 'Note minimale: 1')
  .max(5, 'Note maximale: 5');

/**
 * Validation avis
 */
export const ReviewSchema = z.object({
  id: UuidSchema.optional(),
  card_id: UuidSchema,
  reviewer_id: UuidSchema,

  // Note et commentaire
  rating: RatingSchema,
  comment: z.string()
    .min(10, 'Commentaire doit contenir au moins 10 caractères')
    .max(1000, 'Commentaire trop long (max 1000 caractères)')
    .optional(),

  // Modération
  is_approved: z.boolean().default(false),
  is_featured: z.boolean().default(false),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type ReviewInput = z.infer<typeof ReviewSchema>;

// ============================================================================
// STOCK & INVENTAIRE
// ============================================================================

/**
 * Validation article en stock
 */
export const StockItemSchema = z.object({
  id: UuidSchema.optional(),
  card_id: UuidSchema,
  user_id: UuidSchema,

  // Informations produit
  name: z.string().min(2).max(200),
  sku: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),

  // Stock
  quantity: z.number().int().min(0, 'Quantité ne peut être négative'),
  min_quantity: z.number().int().min(0).optional(),
  max_quantity: z.number().int().positive().optional(),

  // Prix
  cost_price: z.number().min(0).multipleOf(0.01).optional(),
  selling_price: z.number().min(0).multipleOf(0.01).optional(),

  // Catégorie
  category: z.string().max(100).optional(),

  // Timestamps
  created_at: DateISOSchema.optional(),
  updated_at: DateISOSchema.optional(),
});

export type StockItemInput = z.infer<typeof StockItemSchema>;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Types de notifications
 */
export const NotificationTypeSchema = z.enum([
  'email',
  'sms',
  'push',
  'in_app'
]);

/**
 * Priorités de notification
 */
export const NotificationPrioritySchema = z.enum([
  'low',
  'normal',
  'high',
  'urgent'
]);

/**
 * Validation notification
 */
export const NotificationSchema = z.object({
  id: UuidSchema.optional(),
  user_id: UuidSchema,

  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema.default('normal'),

  // Contenu
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),

  // Metadata
  data: z.record(z.unknown()).optional(),

  // Statut
  read: z.boolean().default(false),
  sent: z.boolean().default(false),

  // Timestamps
  created_at: DateISOSchema.optional(),
  sent_at: DateISOSchema.optional(),
  read_at: DateISOSchema.optional(),
});

export type NotificationInput = z.infer<typeof NotificationSchema>;

// ============================================================================
// HELPERS & UTILITIES
// ============================================================================

/**
 * Valide et parse les données avec gestion d'erreur
 *
 * @param schema - Schéma Zod à utiliser
 * @param data - Données à valider
 * @returns Données validées
 * @throws {Error} Si validation échoue
 */
export function validateAndParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }
    throw error;
  }
}

/**
 * Valide sans throw (safe parse)
 *
 * @param schema - Schéma Zod
 * @param data - Données à valider
 * @returns Objet avec success et data ou error
 */
export function safeValidate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`
    )
  };
}
