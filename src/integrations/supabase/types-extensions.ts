import { Database } from './types';

export interface ExtendedTables {
  business_cards: Database['public']['Tables']['business_cards'] & {
    Row: Database['public']['Tables']['business_cards']['Row'] & {
      address?: string | null;
      description?: string | null;
    };
    Insert: Database['public']['Tables']['business_cards']['Insert'] & {
      address?: string | null;
      description?: string | null;
    };
    Update: Database['public']['Tables']['business_cards']['Update'] & {
      address?: string | null;
      description?: string | null;
      cover_image_url?: string | null;
    };
  }
} 