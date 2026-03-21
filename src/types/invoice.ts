/**
 * Types pour le système de facturation
 */

export interface Invoice {
  id: string;
  user_id: string;
  card_id?: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;

  // Dates
  issue_date: string;
  due_date?: string;
  paid_date?: string;

  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  // Montants
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;

  // Currency
  currency: string; // FCFA, EUR, USD, etc.

  // Notes
  notes?: string;
  terms?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total: number;
  order?: number; // Pour le tri
  created_at: string;
}

export interface InvoiceSettings {
  user_id: string;
  company_name?: string;
  company_logo?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  tax_id?: string;

  // Numérotation
  invoice_prefix: string;
  next_invoice_number: number;

  // Conditions par défaut
  default_tax_rate: number;
  default_payment_terms: string;
  default_notes?: string;

  // Préférences
  currency: string;
  date_format: string;

  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'other';
  reference?: string;
  notes?: string;
  created_at: string;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceItemFormData = Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>;
