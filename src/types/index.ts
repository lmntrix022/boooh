/**
 * Point d'entrée centralisé pour tous les types TypeScript
 *
 * Usage: import { Invoice, Contact, StockItem } from '@/types';
 */

// Subscription system (existant - excellent)
export * from './subscription';

// Media handling (existant)
export * from './media';

// Reviews (existant)
export * from './reviews';

// Supabase database types (existant)
export * from './supabase';

// Database auto-generated types (existant - partiel)
export * from './database.types';

// Nouveaux types ajoutés
export * from './invoice';
export * from './appointment';
export * from './stock';
export * from './crm';
export * from './portfolio';

/**
 * Types communs utilisés à travers l'application
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOptions {
  search?: string;
  status?: string | string[];
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export type UUID = string;
export type ISODate = string; // Format ISO 8601
export type Currency = 'FCFA' | 'EUR' | 'USD' | 'GBP';
