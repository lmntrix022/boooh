/**
 * Types pour le système CRM (Customer Relationship Management)
 */

export interface Contact {
  id: string;
  user_id: string;
  card_id?: string;

  // Informations personnelles
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  mobile?: string;

  // Entreprise
  company?: string;
  job_title?: string;
  department?: string;

  // Adresse
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Social
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  website?: string;

  // Segmentation
  tags: string[];
  category?: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source?: string; // Comment le contact a été acquis

  // Scoring
  lead_score?: number;
  rfm_score?: string; // Recency, Frequency, Monetary

  // Dates importantes
  birthday?: string;
  anniversary?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;

  // Notes
  notes?: string;
  custom_fields?: Record<string, any>;

  // Avatar
  avatar_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  user_id: string;

  // Type d'interaction
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'sale' | 'support';
  direction?: 'inbound' | 'outbound';

  // Détails
  subject?: string;
  description: string;
  outcome?: string;

  // Dates
  interaction_date: string;
  duration_minutes?: number;

  // Attachements
  attachments?: string[];

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ContactList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;

  // Filtres
  filter_criteria?: {
    tags?: string[];
    status?: string[];
    category?: string;
    lead_score_min?: number;
    lead_score_max?: number;
  };

  // Stats
  contact_count: number;

  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp';

  // Cibles
  contact_list_ids: string[];
  recipient_count: number;

  // Contenu
  subject?: string; // Pour emails
  message: string;
  template_id?: string;

  // Planning
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;

  // Résultats
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id?: string;
  card_id?: string;

  // Détails
  title: string;
  description?: string;
  value: number;
  currency: string;

  // Pipeline
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number; // 0-100%

  // Dates
  expected_close_date?: string;
  closed_date?: string;

  // Status
  status: 'open' | 'won' | 'lost';
  lost_reason?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  contact_id?: string;
  deal_id?: string;

  // Détails
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'other';

  // Dates
  due_date?: string;
  completed_date?: string;

  // Status
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';

  // Assignation
  assigned_to?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ContactImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: {
    row: number;
    error: string;
  }[];
}

export type ContactFormData = Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'created_by'>;
export type InteractionFormData = Omit<ContactInteraction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'created_by'>;
export type DealFormData = Omit<Deal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type TaskFormData = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
