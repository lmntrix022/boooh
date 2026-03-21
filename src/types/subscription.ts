/**
 * Types et constantes pour le système d'abonnement Bööh Card Magic
 * Plans: FREE, BUSINESS, MAGIC (Legacy)
 * Nouveaux plans: ESSENTIEL, CONNEXIONS, COMMERCE, OPERE
 */

export enum PlanType {
  // ===== LEGACY PLANS (Anciens plans, maintenus pour compatibilité) =====
  FREE = 'free',
  BUSINESS = 'business',
  MAGIC = 'magic',
  
  // ===== NEW PLANS (Nouveaux plans stratégiques) =====
  ESSENTIEL = 'essentiel',     // Gratuit - Viralité
  CONNEXIONS = 'connexions',   // 15K FCFA - Capital relationnel
  COMMERCE = 'commerce',        // 5% commission - E-commerce
  OPERE = 'opere',              // 10% commission + setup - Premium
}

export enum AddonType {
  PACK_CREATEUR = 'pack_createur',      // +7,500 FCFA - DRM + watermarking
  PACK_VOLUME = 'pack_volume',          // +8 EUR - Ajouter +15 produits
  PACK_EQUIPE = 'pack_equipe',          // +5,000 FCFA/carte - Cartes supplémentaires
  PACK_BRAND = 'pack_brand',            // +8,000 FCFA - Domaine personnalisé
  PACK_ANALYTICS_PRO = 'pack_analytics_pro' // +6,000 FCFA - Analytics avancés
}

export interface PlanFeatures {
  // Cartes de visite
  maxCards: number;
  customThemes: boolean;
  removeBranding: boolean;
  advancedAnalytics: boolean;

  // E-commerce
  hasEcommerce: boolean;
  maxProducts: number; // -1 = illimité
  digitalProducts: boolean;
  drmProtection: boolean;
  watermarking: boolean;

  // Portfolio
  hasPortfolio: boolean;
  maxProjects: number; // -1 = illimité
  quoteRequests: boolean;

  // Facturation
  hasInvoicing: boolean;
  advancedInvoicing: boolean;
  autoInvoicing: boolean;

  // Stock
  hasStockManagement: boolean;
  advancedStock: boolean;

  // Rendez-vous
  hasAppointments: boolean;
  advancedAppointments: boolean;
  googleCalendarSync: boolean;

  // CRM
  hasCRM: boolean;
  aiParsing: boolean;
  ocrScanning: boolean;

  // Carte interactive
  hasMap: boolean;
  mapClustering: boolean;

  // Équipe
  multiUser: boolean;
  maxTeamMembers: number;
  rolePermissions: boolean;

  // Commissions
  marketplaceCommission: number; // en pourcentage

  // Support
  supportLevel: 'community' | 'email' | 'priority';
}

// Prix en EUR (1 EUR = 100 centimes pour Stripe)
export const PLAN_PRICES = {
  [PlanType.FREE]: 0,
  [PlanType.BUSINESS]: 20,  // 20 EUR
  [PlanType.MAGIC]: 40,      // 40 EUR
} as const;

export const ADDON_PRICES = {
  [AddonType.PACK_CREATEUR]: 12,      // 12 EUR
  [AddonType.PACK_VOLUME]: 8,         // 8 EUR
  [AddonType.PACK_EQUIPE]: 8,         // 8 EUR
  [AddonType.PACK_BRAND]: 12,         // 12 EUR
  [AddonType.PACK_ANALYTICS_PRO]: 10, // 10 EUR
} as const;

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  [PlanType.FREE]: {
    // Cartes de visite
    maxCards: 1,
    customThemes: false,
    removeBranding: false,
    advancedAnalytics: false,

    // E-commerce
    hasEcommerce: true,
    maxProducts: 5,
    digitalProducts: false,
    drmProtection: false,
    watermarking: false,

    // Portfolio
    hasPortfolio: false,
    maxProjects: 0,
    quoteRequests: false,

    // Facturation
    hasInvoicing: false,
    advancedInvoicing: false,
    autoInvoicing: false,

    // Stock
    hasStockManagement: false,
    advancedStock: false,

    // Rendez-vous
    hasAppointments: false,
    advancedAppointments: false,
    googleCalendarSync: false,
    

    // CRM
    hasCRM: false,
    aiParsing: false,
    ocrScanning: false,

    // Carte interactive
    hasMap: false,
    mapClustering: true,

    // Équipe
    multiUser: false,
    maxTeamMembers: 1,
    rolePermissions: false,

    // Commissions
    marketplaceCommission: 3,

    // Support
    supportLevel: 'community',
  },

  [PlanType.BUSINESS]: {
    // Cartes de visite
    maxCards: 1,
    customThemes: true,
    removeBranding: true,
    advancedAnalytics: true,

    // E-commerce
    hasEcommerce: true,
    maxProducts: 15,
    digitalProducts: true,
    drmProtection: false, // Nécessite PACK_CREATEUR
    watermarking: false,  // Nécessite PACK_CREATEUR

    // Portfolio
    hasPortfolio: true,
    maxProjects: 10,
    quoteRequests: true,

    // Facturation
    hasInvoicing: true,
    advancedInvoicing: true,
    autoInvoicing: true,

    // Stock
    hasStockManagement: true,
    advancedStock: true,

    // Rendez-vous
    hasAppointments: true,
    advancedAppointments: true,
    googleCalendarSync: true,

    // CRM
    hasCRM: true,
    aiParsing: true,
    ocrScanning: true,

    // Carte interactive
    hasMap: true,
    mapClustering: false,

    // Équipe
    multiUser: false,
    maxTeamMembers: 1,
    rolePermissions: false,

    // Commissions
    marketplaceCommission: 1,

    // Support
    supportLevel: 'email',
  },

  [PlanType.MAGIC]: {
    // Cartes de visite
    maxCards: 3,
    customThemes: true,
    removeBranding: true,
    advancedAnalytics: true,

    // E-commerce
    hasEcommerce: true,
    maxProducts: 20, // 20 produits
    digitalProducts: true,
    drmProtection: false,
    watermarking: false,

    // Portfolio
    hasPortfolio: true,
    maxProjects: 30, // Illimité
    quoteRequests: true,

    // Facturation
    hasInvoicing: true,
    advancedInvoicing: true,
    autoInvoicing: true,

    // Stock
    hasStockManagement: true,
    advancedStock: true,

    // Rendez-vous
    hasAppointments: true,
    advancedAppointments: true,
    googleCalendarSync: true,

    // CRM
    hasCRM: true,
    aiParsing: true,
    ocrScanning: true,

    // Carte interactive
    hasMap: true,
    mapClustering: true,

    // Équipe
    multiUser: true,
    maxTeamMembers: 2,
    rolePermissions: true,

    // Commissions
    marketplaceCommission: 1,

    // Support
    supportLevel: 'priority',
  },
};

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  start_date: string;
  end_date?: string | null;
  auto_renew: boolean;
  addons: AddonType[];
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  type: PlanType;
  name: string;
  price: number;
  features: PlanFeatures;
  popular?: boolean;
  description: string;
}

export const PLANS_INFO: PlanInfo[] = [
  // ===== NOUVEAUX PLANS STRATÉGIQUES =====
  {
    type: PlanType.ESSENTIEL,
    name: 'BÖÖH Essentiel',
    price: 0, // Gratuit - viralité
    features: PLAN_FEATURES[PlanType.ESSENTIEL],
    description: 'Votre départ gratuit - Identité économique minimale',
  },
  {
    type: PlanType.CONNEXIONS,
    name: 'BÖÖH Connexions',
    price: 15, // 15,000 FCFA - MRR stable
    features: PLAN_FEATURES[PlanType.CONNEXIONS],
    popular: true,
    description: 'Capital relationnel structuré - RDV + contacts organisés',
  },
  {
    type: PlanType.COMMERCE,
    name: 'BÖÖH Commerce',
    price: 0, // Commission 5% - revenue scaling
    features: PLAN_FEATURES[PlanType.COMMERCE],
    description: 'Croissance scalable - 5% commission sur vos transactions',
  },
  {
    type: PlanType.OPERE,
    name: 'BÖÖH Opéré',
    price: 0, // Commission 10% + setup séparé
    features: PLAN_FEATURES[PlanType.OPERE],
    description: 'Partenariat premium - 10% commission + accompagnement dédié',
  },

  // ===== ANCIENS PLANS (maintenus pour compatibilité) =====
  {
    type: PlanType.FREE,
    name: 'Découverte & Viralité',
    price: PLAN_PRICES[PlanType.FREE],
    features: PLAN_FEATURES[PlanType.FREE],
    description: 'Pour étudiants, jeunes créateurs et indépendants débutants',
  },
  {
    type: PlanType.BUSINESS,
    name: 'Vendre & Gérer',
    price: PLAN_PRICES[PlanType.BUSINESS],
    features: PLAN_FEATURES[PlanType.BUSINESS],
    description: 'Pour freelances, artisans, commerçants et prestataires',
  },
  {
    type: PlanType.MAGIC,
    name: 'Automatiser & Équiper',
    price: PLAN_PRICES[PlanType.MAGIC],
    features: PLAN_FEATURES[PlanType.MAGIC],
    description: 'Pour PME, agences et équipes commerciales',
  },
];

export interface AddonInfo {
  type: AddonType;
  name: string;
  price: number;
  description: string;
  targetPlans: PlanType[];
}

export const ADDONS_INFO: AddonInfo[] = [
  {
    type: AddonType.PACK_CREATEUR,
    name: 'Pack Créateur',
    price: ADDON_PRICES[AddonType.PACK_CREATEUR],
    description: 'DRM + watermarking + monétisation numérique',
    targetPlans: [PlanType.BUSINESS, PlanType.MAGIC],
  },
  {
    type: AddonType.PACK_VOLUME,
    name: 'Pack Volume',
    price: ADDON_PRICES[AddonType.PACK_VOLUME],
    description: 'Ajouter +15 produits à votre boutique',
    targetPlans: [PlanType.BUSINESS, PlanType.MAGIC],
  },
  {
    type: AddonType.PACK_EQUIPE,
    name: 'Pack Équipe',
    price: ADDON_PRICES[AddonType.PACK_EQUIPE],
    description: 'Ajout de cartes supplémentaires (prix par carte)',
    targetPlans: [PlanType.BUSINESS, PlanType.MAGIC],
  },
  {
    type: AddonType.PACK_BRAND,
    name: 'Pack Brand',
    price: ADDON_PRICES[AddonType.PACK_BRAND],
    description: 'Domaine personnalisé + logo sur lien Bööh',
    targetPlans: [PlanType.BUSINESS, PlanType.MAGIC],
  },
  {
    type: AddonType.PACK_ANALYTICS_PRO,
    name: 'Pack Analytics Pro',
    price: ADDON_PRICES[AddonType.PACK_ANALYTICS_PRO],
    description: 'Dashboard comparatif + Heatmap',
    targetPlans: [PlanType.BUSINESS, PlanType.MAGIC],
  },
];

export const CURRENCY = 'FCFA';

// ================================================================
// NOUVEAU MODÈLE DE SOUSCRIPTION (4 PLANS STRATÉGIQUES)
// ================================================================

/**
 * Configuration des commissions par plan
 */
export interface CommissionConfig {
  monthlyFee: number;        // Frais mensuels en FCFA
  commission: number;         // % de commission sur les transactions
  setupFee: number | 'custom'; // Frais de setup (0 ou custom pour OPERE)
  minCommission?: number;     // Commission minimum garantie
}

export const PLAN_COMMISSIONS: Record<PlanType, CommissionConfig> = {
  // Legacy plans (maintenus pour compatibilité)
  [PlanType.FREE]: {
    monthlyFee: 0,
    commission: 3, // 3% commission
    setupFee: 0,
  },
  [PlanType.BUSINESS]: {
    monthlyFee: 13000, // ~20 EUR
    commission: 1,
    setupFee: 0,
  },
  [PlanType.MAGIC]: {
    monthlyFee: 26000, // ~40 EUR
    commission: 1,
    setupFee: 0,
  },
  
  // Nouveaux plans
  [PlanType.ESSENTIEL]: {
    monthlyFee: 0,
    commission: 0, // Pas de vente possible
    setupFee: 0,
  },
  [PlanType.CONNEXIONS]: {
    monthlyFee: 15000, // 15K FCFA
    commission: 0, // Pas de e-commerce
    setupFee: 0,
  },
  [PlanType.COMMERCE]: {
    monthlyFee: 0,
    commission: 5, // 5% sur les transactions
    setupFee: 0,
  },
  [PlanType.OPERE]: {
    monthlyFee: 0,
    commission: 10, // 10% sur les transactions
    setupFee: 'custom', // 50K-500K selon package
    minCommission: 100000, // 100K FCFA/mois minimum
  },
};

/**
 * Package Setup pour BÖÖH Opéré
 */
export interface OpereSetupPackage {
  id: string;
  name: string;
  price: number; // en FCFA
  priceEUR: number; // en EUR
  duration: string;
  includes: string[];
  excludes?: string[];
  recommended?: string;
  popular?: boolean;
  targetRevenue?: {
    min: number;
    max: number;
  };
}

export const OPERE_SETUP_PACKAGES: OpereSetupPackage[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 50000,
    priceEUR: 76,
    duration: '2-3 jours',
    includes: [
      'Configuration compte Bööh complet',
      'Import produits/services (jusqu\'à 50)',
      'Configuration méthodes de paiement',
      'Formation utilisateur (2 heures)',
      'Documentation complète',
      'Support email 7 jours',
    ],
    excludes: [
      'Marketing digital',
      'Création de contenu',
      'Stratégie commerciale',
    ],
    recommended: 'Pour démarrage rapide',
    targetRevenue: {
      min: 0,
      max: 1000000, // < 1M FCFA/mois
    },
  },
  {
    id: 'business',
    name: 'Business',
    price: 150000,
    priceEUR: 229,
    duration: '1 semaine',
    includes: [
      '✅ Tout Standard',
      'Stratégie digitale personnalisée',
      'Setup Google Analytics + Meta Pixel',
      'Configuration campagnes ads (Facebook/Instagram)',
      'Design carte visite personnalisé premium',
      'Formation équipe complète (5 heures)',
      'Support prioritaire 30 jours',
      'Audit initial de votre présence digitale',
    ],
    popular: true,
    recommended: 'Recommandé pour PME et boutiques',
    targetRevenue: {
      min: 1000000,
      max: 5000000, // 1M-5M FCFA/mois
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 300000,
    priceEUR: 458,
    duration: '2-3 semaines',
    includes: [
      '✅ Tout Business',
      'Campagne marketing de lancement complète',
      'Création de contenu professionnel (10 posts)',
      'Setup email marketing + automation',
      'Intégrations custom (ERP, CRM externe)',
      'Audit SEO complet + optimisation',
      'Formation avancée équipe (10 heures)',
      'Account manager dédié 90 jours',
      'Reporting mensuel personnalisé',
    ],
    recommended: 'Pour grandes entreprises établies',
    targetRevenue: {
      min: 5000000,
      max: 10000000, // 5M-10M FCFA/mois
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 500000,
    priceEUR: 763,
    duration: '1 mois',
    includes: [
      '✅ Tout Premium',
      'Stratégie growth marketing sur 3 mois',
      'Campagne multi-canaux (Social, Email, SEO)',
      'Création contenu avancé (vidéos, photos pro)',
      'Marketing automation complet',
      'Intégrations complexes et API custom',
      'White label complet (votre marque)',
      'Consulting stratégique trimestriel',
      'Account manager dédié 12 mois',
      'Support 24/7 prioritaire',
      'SLA 99.9% garanti',
    ],
    recommended: 'Pour corporations et franchises',
    targetRevenue: {
      min: 10000000,
      max: Infinity, // > 10M FCFA/mois
    },
  },
];

/**
 * Features étendues pour les nouveaux plans
 */
export interface ExtendedPlanFeatures extends PlanFeatures {
  // Limites spécifiques
  monthlyViews?: number | 'unlimited';
  maxContacts?: number | 'unlimited';
  storageGB?: number;
  maxInvoicesPerMonth?: number | 'unlimited';
  
  // Services Opéré
  dedicatedAccountManager?: boolean;
  onboardingType?: 'self' | 'basic' | 'full' | 'enterprise';
  training?: boolean;
  strategicConsulting?: boolean;
  monthlyReview?: boolean;
  sla?: string;
  
  // Intégrations
  customIntegrations?: boolean;
  apiAccess?: boolean;
  webhooks?: boolean;
  whiteLabel?: boolean;
  customDomain?: boolean;
  ssoIntegration?: boolean;
}

/**
 * Features des nouveaux plans
 */
export const NEW_PLAN_FEATURES: Record<PlanType, ExtendedPlanFeatures> = {
  // ===== LEGACY PLANS (inchangés) =====
  [PlanType.FREE]: {
    ...PLAN_FEATURES[PlanType.FREE],
    monthlyViews: 'unlimited',
    maxContacts: 0,
    storageGB: 0.1,
  },
  [PlanType.BUSINESS]: {
    ...PLAN_FEATURES[PlanType.BUSINESS],
    monthlyViews: 'unlimited',
    maxContacts: 500,
    storageGB: 2,
  },
  [PlanType.MAGIC]: {
    ...PLAN_FEATURES[PlanType.MAGIC],
    monthlyViews: 'unlimited',
    maxContacts: 1000,
    storageGB: 5,
  },
  
  // ===== NOUVEAUX PLANS =====
  
  // 🟢 ESSENTIEL (FREE)
  [PlanType.ESSENTIEL]: {
    // Identité basique
    maxCards: 1,
    customThemes: false,
    removeBranding: false,
    advancedAnalytics: false,
    
    // E-commerce DÉSACTIVÉ
    hasEcommerce: false,
    maxProducts: 3, // Juste vitrine
    digitalProducts: false,
    drmProtection: false,
    watermarking: false,
    
    // Pas de fonctionnalités avancées
    hasPortfolio: false,
    maxProjects: 0,
    quoteRequests: false,
    
    hasInvoicing: false,
    advancedInvoicing: false,
    autoInvoicing: false,
    
    hasStockManagement: false,
    advancedStock: false,
    
    hasAppointments: false,
    advancedAppointments: false,
    googleCalendarSync: false,
    
    hasCRM: false,
    aiParsing: false,
    ocrScanning: false,
    
    hasMap: false,
    mapClustering: false,
    
    multiUser: false,
    maxTeamMembers: 1,
    rolePermissions: false,
    
    marketplaceCommission: 0,
    supportLevel: 'community',
    
    // Limites strictes
    monthlyViews: 100,
    maxContacts: 0,
    storageGB: 0.1,
    
    // Services
    onboardingType: 'self',
  },
  
  // 🔵 CONNEXIONS (15K FCFA)
  [PlanType.CONNEXIONS]: {
    // Identité complète
    maxCards: 1,
    customThemes: true,
    removeBranding: true,
    advancedAnalytics: true,
    
    // E-commerce DÉSACTIVÉ
    hasEcommerce: false,
    maxProducts: 0,
    digitalProducts: false,
    drmProtection: false,
    watermarking: false,
    
    // Portfolio limité
    hasPortfolio: true,
    maxProjects: 5,
    quoteRequests: true,
    
    // Facturation limitée
    hasInvoicing: true,
    advancedInvoicing: false,
    autoInvoicing: false,
    maxInvoicesPerMonth: 20,
    
    hasStockManagement: false,
    advancedStock: false,
    
    // ⭐ FOCUS: RDV + CRM
    hasAppointments: true,
    advancedAppointments: true,
    googleCalendarSync: true,
    
    hasCRM: true,
    aiParsing: true,
    ocrScanning: true,
    maxContacts: 1000,
    
    hasMap: true,
    mapClustering: false,
    
    multiUser: false,
    maxTeamMembers: 1,
    rolePermissions: false,
    
    marketplaceCommission: 0,
    supportLevel: 'email',
    
    monthlyViews: 'unlimited',
    storageGB: 2,
    
    onboardingType: 'basic',
  },
  
  // 🟣 COMMERCE (5% commission)
  [PlanType.COMMERCE]: {
    // Identité complète
    maxCards: 1,
    customThemes: true,
    removeBranding: true,
    advancedAnalytics: true,
    
    // ⭐ FOCUS: E-COMMERCE COMPLET
    hasEcommerce: true,
    maxProducts: -1, // illimité
    digitalProducts: true,
    drmProtection: false, // Addon
    watermarking: false, // Addon
    
    // Portfolio complet
    hasPortfolio: true,
    maxProjects: -1, // illimité
    quoteRequests: true,
    
    // Facturation automatique
    hasInvoicing: true,
    advancedInvoicing: true,
    autoInvoicing: true,
    maxInvoicesPerMonth: 'unlimited',
    
    // Stock avancé
    hasStockManagement: true,
    advancedStock: true,
    
    // RDV basique (addon pour avancé)
    hasAppointments: false,
    advancedAppointments: false,
    googleCalendarSync: false,
    
    // CRM basique
    hasCRM: true,
    aiParsing: false,
    ocrScanning: false,
    maxContacts: 500,
    
    hasMap: true,
    mapClustering: false,
    
    multiUser: false,
    maxTeamMembers: 1,
    rolePermissions: false,
    
    marketplaceCommission: 5,
    supportLevel: 'email',
    
    monthlyViews: 'unlimited',
    storageGB: 5,
    
    onboardingType: 'basic',
  },
  
  // 🔴 OPÉRÉ (10% commission + setup)
  [PlanType.OPERE]: {
    // TOUT ILLIMITÉ
    maxCards: -1,
    customThemes: true,
    removeBranding: true,
    advancedAnalytics: true,
    
    // E-commerce complet
    hasEcommerce: true,
    maxProducts: -1,
    digitalProducts: true,
    drmProtection: true,
    watermarking: true,
    
    // Portfolio illimité
    hasPortfolio: true,
    maxProjects: -1,
    quoteRequests: true,
    
    // Facturation complète
    hasInvoicing: true,
    advancedInvoicing: true,
    autoInvoicing: true,
    maxInvoicesPerMonth: 'unlimited',
    
    // Stock avancé
    hasStockManagement: true,
    advancedStock: true,
    
    // RDV complet
    hasAppointments: true,
    advancedAppointments: true,
    googleCalendarSync: true,
    
    // CRM illimité
    hasCRM: true,
    aiParsing: true,
    ocrScanning: true,
    maxContacts: 'unlimited',
    
    hasMap: true,
    mapClustering: true,
    
    // Multi-équipe
    multiUser: true,
    maxTeamMembers: -1,
    rolePermissions: true,
    
    marketplaceCommission: 10,
    supportLevel: 'priority',
    
    monthlyViews: 'unlimited',
    storageGB: -1, // illimité
    
    // ⭐ Services premium
    dedicatedAccountManager: true,
    onboardingType: 'enterprise',
    training: true,
    strategicConsulting: true,
    monthlyReview: true,
    sla: '99.9%',
    
    // Intégrations
    customIntegrations: true,
    apiAccess: true,
    webhooks: true,
    whiteLabel: true,
    customDomain: true,
    ssoIntegration: true,
  },
};

/**
 * Helper pour déterminer si un plan est legacy ou nouveau
 */
export function isLegacyPlan(plan: PlanType): boolean {
  return [PlanType.FREE, PlanType.BUSINESS, PlanType.MAGIC].includes(plan);
}

export function isNewPlan(plan: PlanType): boolean {
  return [PlanType.ESSENTIEL, PlanType.CONNEXIONS, PlanType.COMMERCE, PlanType.OPERE].includes(plan);
}

/**
 * Mapping de migration des anciens vers nouveaux plans
 */
export interface MigrationOption {
  targetPlan: PlanType;
  reason: string;
  condition?: string;
  savings?: string;
  incentive?: string;
}

export const MIGRATION_MAPPING: Record<string, MigrationOption[]> = {
  [PlanType.FREE]: [
    {
      targetPlan: PlanType.ESSENTIEL,
      reason: 'Migration automatique - Aucun changement',
      savings: 'Toujours gratuit',
    },
  ],
  [PlanType.BUSINESS]: [
    {
      targetPlan: PlanType.CONNEXIONS,
      reason: 'Vous utilisez principalement RDV/CRM',
      condition: 'hasAppointments || hasCRM',
      savings: '≈2€/mois d\'économie',
      incentive: '2 mois offerts',
    },
    {
      targetPlan: PlanType.COMMERCE,
      reason: 'Vous vendez des produits en ligne',
      condition: 'hasEcommerce && monthlyRevenue > 0',
      savings: 'Payez uniquement 5% de vos ventes',
      incentive: '1ère année à 3%',
    },
  ],
  [PlanType.MAGIC]: [
    {
      targetPlan: PlanType.COMMERCE,
      reason: 'Économisez avec le modèle à la commission',
      condition: 'monthlyRevenue >= 1000000',
      savings: 'Pas de plafond sur votre croissance',
      incentive: '1ère année à 3%',
    },
    {
      targetPlan: PlanType.OPERE,
      reason: 'Votre CA justifie un accompagnement dédié',
      condition: 'monthlyRevenue >= 5000000',
      savings: 'Account manager + consulting inclus',
      incentive: 'Setup fee offert',
    },
  ],
};
