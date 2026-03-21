export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string;
          avatar_url: string;
          website: string;
          company: string;
          title: string;
          bio: string;
          theme: string;
          phone: string;
          location: string;
          social_links: {
            facebook?: string;
            twitter?: string;
            linkedin?: string;
            instagram?: string;
            github?: string;
          };
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          company?: string;
          title?: string;
          bio?: string;
          theme?: string;
          phone?: string;
          location?: string;
          social_links?: {
            facebook?: string;
            twitter?: string;
            linkedin?: string;
            instagram?: string;
            github?: string;
          };
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          company?: string;
          title?: string;
          bio?: string;
          theme?: string;
          phone?: string;
          location?: string;
          social_links?: {
            facebook?: string;
            twitter?: string;
            linkedin?: string;
            instagram?: string;
            github?: string;
          };
        };
      };
      // ... autres tables
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
