/**
 * Type Utilities for Supabase Integration
 * 
 * These helpers solve common type mismatches between:
 * - Supabase Row types (with | null)
 * - Local interface types (with optional ?)
 * - Form types (with undefined)
 */

import { Database } from './supabase';

// =============================================================================
// BASIC TYPE TRANSFORMERS
// =============================================================================

/**
 * Makes all properties nullable (T | null)
 * Useful for Supabase insert/update operations
 */
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Makes all properties required and non-null
 * Useful for transforming Supabase Row to clean UI types
 */
export type NonNullableProps<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

/**
 * Converts null to undefined for all properties
 * Useful for React component props that expect undefined
 */
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : 
                  T[K] extends infer U | null ? U | undefined : T[K];
};

/**
 * Converts undefined to null for all properties
 * Useful for Supabase operations that expect null
 */
export type UndefinedToNull<T> = {
  [K in keyof T]: T[K] extends undefined ? null :
                  T[K] extends infer U | undefined ? U | null : T[K];
};

/**
 * Makes specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Picks only the keys that are of a specific type
 */
export type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// =============================================================================
// SUPABASE TABLE HELPERS
// =============================================================================

/** Shortcut for table Row type */
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/** Shortcut for table Insert type */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/** Shortcut for table Update type */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// =============================================================================
// COMMON ENTITY TYPES (Pre-cleaned from Supabase nulls)
// =============================================================================

/** Clean business card type for UI */
export interface CleanBusinessCard {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  cover_image?: string;
  theme?: string;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

/** Clean product type for UI */
export interface CleanProduct {
  id: string;
  card_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_available: boolean;
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
}

/** Clean contact type for UI */
export interface CleanContact {
  id: string;
  user_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Converts null values to undefined in an object
 * @example nullToUndefined({ name: "John", age: null }) => { name: "John", age: undefined }
 */
export function nullToUndefined<T extends Record<string, unknown>>(
  obj: T
): NullToUndefined<T> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[key] = obj[key] === null ? undefined : obj[key];
  }
  return result as NullToUndefined<T>;
}

/**
 * Converts undefined values to null in an object
 * @example undefinedToNull({ name: "John", age: undefined }) => { name: "John", age: null }
 */
export function undefinedToNull<T extends Record<string, unknown>>(
  obj: T
): UndefinedToNull<T> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[key] = obj[key] === undefined ? null : obj[key];
  }
  return result as UndefinedToNull<T>;
}

/**
 * Removes null/undefined values from an object
 * @example compact({ a: 1, b: null, c: undefined }) => { a: 1 }
 */
export function compact<T extends Record<string, unknown>>(
  obj: T
): Partial<NonNullableProps<T>> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
  }
  return result as Partial<NonNullableProps<T>>;
}

/**
 * Provides default values for null/undefined properties
 */
export function withDefaults<T extends Record<string, unknown>>(
  obj: Partial<T>,
  defaults: T
): T {
  return { ...defaults, ...compact(obj) } as T;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Type guard for non-null values */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/** Type guard for non-undefined values */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/** Type guard for non-null and non-undefined values */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

/** Filter array to remove nulls */
export function filterNulls<T>(arr: (T | null)[]): T[] {
  return arr.filter(isNotNull);
}

/** Filter array to remove undefined */
export function filterUndefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(isDefined);
}

/** Filter array to remove null and undefined */
export function filterEmpty<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isPresent);
}

// =============================================================================
// ASYNC HELPERS
// =============================================================================

/** Result type for async operations */
export type AsyncResult<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Wraps an async function to return AsyncResult */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}


