/**
 * Types pour le système de portfolio et devis
 */

export interface Project {
  id: string;
  user_id: string;
  card_id?: string;

  // Détails du projet
  title: string;
  description: string;
  category: string;
  tags: string[];

  // Médias
  thumbnail_url?: string;
  images: string[];
  videos?: string[];

  // Client
  client_name?: string;
  client_company?: string;

  // Dates
  start_date?: string;
  end_date?: string;
  completion_date?: string;

  // Détails techniques
  technologies?: string[];
  role?: string;
  team_size?: number;

  // URLs
  demo_url?: string;
  github_url?: string;
  website_url?: string;

  // Résultats
  achievements?: string[];
  metrics?: Record<string, string | number>;

  // Visibilité
  is_featured: boolean;
  is_public: boolean;
  display_order: number;

  // Status
  status: 'draft' | 'published' | 'archived';

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  card_id?: string;

  // Client
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;

  // Numérotation
  quote_number: string;
  version: number; // Pour les révisions

  // Détails
  title: string;
  description?: string;
  project_type?: string;

  // Dates
  issue_date: string;
  valid_until: string;
  estimated_start_date?: string;
  estimated_duration?: string; // "2 weeks", "3 months", etc.

  // Montants
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  accepted_date?: string;
  rejection_reason?: string;

  // Notes
  notes?: string;
  terms_and_conditions?: string;
  payment_terms?: string;

  // Fichiers
  attachments?: string[];

  // Metadata
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;

  // Détails
  title: string;
  description?: string;
  category?: string;

  // Quantité/Prix
  quantity: number;
  unit: string;
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
  total: number;

  // Ordre
  order: number;

  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;

  // Détails
  name: string;
  description: string;
  category: string;

  // Pricing
  price_type: 'fixed' | 'hourly' | 'daily' | 'custom';
  base_price: number;
  currency: string;

  // Durée estimée
  estimated_duration?: string;
  estimated_hours?: number;

  // Visibilité
  is_active: boolean;
  display_order: number;

  // Icon/Image
  icon?: string;
  image_url?: string;

  created_at: string;
  updated_at: string;
}

export interface QuoteTemplate {
  id: string;
  user_id: string;

  // Détails
  name: string;
  description?: string;

  // Contenu du template
  items: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>[];

  // Textes prédéfinis
  default_notes?: string;
  default_terms?: string;
  default_payment_terms?: string;

  // Metadata
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSettings {
  user_id: string;
  card_id: string;

  // Affichage
  layout: 'grid' | 'masonry' | 'carousel';
  projects_per_page: number;
  show_categories: boolean;
  show_tags: boolean;

  // SEO
  meta_title?: string;
  meta_description?: string;

  // Devis
  quote_prefix: string;
  next_quote_number: number;
  default_valid_days: number;
  default_tax_rate: number;
  default_currency: string;

  // Personnalisation
  primary_color?: string;
  secondary_color?: string;
  header_image?: string;

  created_at: string;
  updated_at: string;
}

export interface QuoteInquiry {
  id: string;
  card_id: string;
  user_id: string; // Propriétaire de la carte

  // Client
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;

  // Demande
  project_title: string;
  project_description: string;
  budget_range?: string;
  timeline?: string;
  preferred_contact_method?: 'email' | 'phone' | 'whatsapp';

  // Status
  status: 'new' | 'reviewed' | 'quote_sent' | 'accepted' | 'rejected' | 'closed';
  quote_id?: string; // Lien vers le devis créé

  // Metadata
  created_at: string;
  updated_at: string;
  responded_at?: string;
}

export type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type QuoteFormData = Omit<Quote, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sent_at'>;
export type QuoteItemFormData = Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>;
export type ServiceFormData = Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type QuoteInquiryFormData = Omit<QuoteInquiry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'responded_at'>;
