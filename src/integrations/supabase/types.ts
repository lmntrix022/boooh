import { Database } from '@/types/supabase';

// Re-export Database type
export type { Database };

// Helper type to extract table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
