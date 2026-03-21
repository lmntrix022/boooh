export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      appointment_email_logs: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_type: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_type: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_email_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          minutes_before: number
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          minutes_before: number
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          minutes_before?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          date: string | null
          duration: number | null
          id: string
          message: string | null
          notes: string | null
          reminder_1h_sent: boolean | null
          reminder_24h_sent: boolean | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          message?: string | null
          notes?: string | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          card_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          message?: string | null
          notes?: string | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      authorized_devices: {
        Row: {
          access_count: number | null
          device_fingerprint: string
          device_info: Json | null
          first_access_at: string | null
          id: string
          inquiry_id: string | null
          is_revoked: boolean | null
          last_access_at: string | null
          revoked_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          device_fingerprint: string
          device_info?: Json | null
          first_access_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_revoked?: boolean | null
          last_access_at?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          device_fingerprint?: string
          device_info?: Json | null
          first_access_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_revoked?: boolean | null
          last_access_at?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorized_devices_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "digital_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_analytics: {
        Row: {
          click_rate: number | null
          clicked_count: number | null
          conversion_rate: number | null
          converted_count: number | null
          created_at: string | null
          delivered_count: number | null
          id: string
          open_rate: number | null
          opened_count: number | null
          period_end: string
          period_start: string
          rule_id: string
          sent_count: number | null
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          click_rate?: number | null
          clicked_count?: number | null
          conversion_rate?: number | null
          converted_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          open_rate?: number | null
          opened_count?: number | null
          period_end: string
          period_start: string
          rule_id: string
          sent_count?: number | null
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          click_rate?: number | null
          clicked_count?: number | null
          conversion_rate?: number | null
          converted_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          open_rate?: number | null
          opened_count?: number | null
          period_end?: string
          period_start?: string
          rule_id?: string
          sent_count?: number | null
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          actions: Json
          clicked_count: number | null
          completed_at: string | null
          contact_id: string
          converted: boolean | null
          created_at: string | null
          error: string | null
          id: string
          opened_count: number | null
          revenue: number | null
          rule_id: string
          sent_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          actions?: Json
          clicked_count?: number | null
          completed_at?: string | null
          contact_id: string
          converted?: boolean | null
          created_at?: string | null
          error?: string | null
          id?: string
          opened_count?: number | null
          revenue?: number | null
          rule_id: string
          sent_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          actions?: Json
          clicked_count?: number | null
          completed_at?: string | null
          contact_id?: string
          converted?: boolean | null
          created_at?: string | null
          error?: string | null
          id?: string
          opened_count?: number | null
          revenue?: number | null
          rule_id?: string
          sent_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "scanned_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_queue: {
        Row: {
          action_data: Json
          action_type: string
          contact_id: string
          created_at: string | null
          error: string | null
          execute_at: string
          executed_at: string | null
          id: string
          rule_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          contact_id: string
          created_at?: string | null
          error?: string | null
          execute_at: string
          executed_at?: string | null
          id?: string
          rule_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          contact_id?: string
          created_at?: string | null
          error?: string | null
          execute_at?: string
          executed_at?: string | null
          id?: string
          rule_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "scanned_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      boohpay_merchants: {
        Row: {
          api_key: string
          api_key_label: string | null
          boohpay_merchant_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_key_label?: string | null
          boohpay_merchant_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_key_label?: string | null
          boohpay_merchant_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_cards: {
        Row: {
          address: string | null
          analytics: Json | null
          avatar_url: string | null
          average_rating: number | null
          background_image_url: string | null
          business_info: Json | null
          business_sector: string | null
          city: string | null
          company: string | null
          company_logo_url: string | null
          contact_info: Json | null
          country: string | null
          cover_image_url: string | null
          cover_url: string | null
          created_at: string | null
          custom_domain: string | null
          custom_fields: Json | null
          description: string | null
          design_config: Json | null
          district: string | null
          email: string | null
          font_family: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          last_review_at: string | null
          latitude: number | null
          layout_config: Json | null
          logo_image_url: string | null
          logo_url: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          party_theme_id: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          preview_url: string | null
          profile_image_url: string | null
          qr_code: string | null
          qr_code_image_url: string | null
          qr_code_url: string | null
          settings: Json | null
          slug: string | null
          social_links: Json | null
          social_media_image_url: string | null
          subtitle: string | null
          theme: Json | null
          thumbnail_url: string | null
          title: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          view_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          analytics?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          background_image_url?: string | null
          business_info?: Json | null
          business_sector?: string | null
          city?: string | null
          company?: string | null
          company_logo_url?: string | null
          contact_info?: Json | null
          country?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_fields?: Json | null
          description?: string | null
          design_config?: Json | null
          district?: string | null
          email?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_review_at?: string | null
          latitude?: number | null
          layout_config?: Json | null
          logo_image_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          party_theme_id?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          preview_url?: string | null
          profile_image_url?: string | null
          qr_code?: string | null
          qr_code_image_url?: string | null
          qr_code_url?: string | null
          settings?: Json | null
          slug?: string | null
          social_links?: Json | null
          social_media_image_url?: string | null
          subtitle?: string | null
          theme?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          analytics?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          background_image_url?: string | null
          business_info?: Json | null
          business_sector?: string | null
          city?: string | null
          company?: string | null
          company_logo_url?: string | null
          contact_info?: Json | null
          country?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_fields?: Json | null
          description?: string | null
          design_config?: Json | null
          district?: string | null
          email?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_review_at?: string | null
          latitude?: number | null
          layout_config?: Json | null
          logo_image_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          party_theme_id?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          preview_url?: string | null
          profile_image_url?: string | null
          qr_code?: string | null
          qr_code_image_url?: string | null
          qr_code_url?: string | null
          settings?: Json | null
          slug?: string | null
          social_links?: Json | null
          social_media_image_url?: string | null
          subtitle?: string | null
          theme?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_cards_party_theme_id_fkey"
            columns: ["party_theme_id"]
            isOneToOne: false
            referencedRelation: "themes_party"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sectors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_sectors_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      card_availability_settings: {
        Row: {
          buffer_time: number | null
          card_id: string
          created_at: string | null
          default_duration: number | null
          id: string
          max_booking_advance: number | null
          min_booking_notice: number | null
          notify_client_confirmation: boolean | null
          notify_client_reminder: boolean | null
          notify_owner_cancellation: boolean | null
          notify_owner_new_appointment: boolean | null
          reminder_times: number[] | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          buffer_time?: number | null
          card_id: string
          created_at?: string | null
          default_duration?: number | null
          id?: string
          max_booking_advance?: number | null
          min_booking_notice?: number | null
          notify_client_confirmation?: boolean | null
          notify_client_reminder?: boolean | null
          notify_owner_cancellation?: boolean | null
          notify_owner_new_appointment?: boolean | null
          reminder_times?: number[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          buffer_time?: number | null
          card_id?: string
          created_at?: string | null
          default_duration?: number | null
          id?: string
          max_booking_advance?: number | null
          min_booking_notice?: number | null
          notify_client_confirmation?: boolean | null
          notify_client_reminder?: boolean | null
          notify_owner_cancellation?: boolean | null
          notify_owner_new_appointment?: boolean | null
          reminder_times?: number[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "card_availability_settings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_availability_settings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      card_clicks: {
        Row: {
          card_id: string
          clicked_at: string
          created_at: string
          id: string
          link_label: string
          link_type: string
          link_url: string | null
          referrer: string | null
          user_agent: string | null
          viewer_ip: string | null
          visitor_id: string | null
        }
        Insert: {
          card_id: string
          clicked_at?: string
          created_at?: string
          id?: string
          link_label: string
          link_type: string
          link_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
          visitor_id?: string | null
        }
        Update: {
          card_id?: string
          clicked_at?: string
          created_at?: string
          id?: string
          link_label?: string
          link_type?: string
          link_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      card_views: {
        Row: {
          card_id: string
          count: number | null
          created_at: string | null
          id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
          viewer_ip: unknown
          visitor_id: string | null
        }
        Insert: {
          card_id: string
          count?: number | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_ip?: unknown
          visitor_id?: string | null
        }
        Update: {
          card_id?: string
          count?: number | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_ip?: unknown
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_card_views_card_id"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_card_views_card_id"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          subject: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          subject?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "scanned_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          slug: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          slug?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          slug?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          task_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "scanned_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      device_revocations: {
        Row: {
          device_fingerprint: string
          expires_at: string | null
          id: string
          inquiry_id: string | null
          is_active: boolean | null
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string | null
        }
        Insert: {
          device_fingerprint: string
          expires_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_active?: boolean | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string | null
        }
        Update: {
          device_fingerprint?: string
          expires_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_active?: boolean | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_revocations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "digital_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          ip_address: unknown
          purchase_id: string
          user_agent: string | null
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown
          purchase_id: string
          user_agent?: string | null
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown
          purchase_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_downloads_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "digital_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_inquiries: {
        Row: {
          billing_easy_bill_id: string | null
          billing_easy_transaction_id: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          device_limit: number | null
          digital_product_id: string
          download_count: number | null
          download_expires_at: string | null
          download_token: string | null
          download_url: string | null
          encryption_key_id: string | null
          expires_at: string | null
          id: string
          invoice_id: string | null
          is_encrypted: boolean | null
          last_download_at: string | null
          max_downloads: number | null
          message: string | null
          notes: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_operator: string | null
          payment_phone_number: string | null
          payment_reference: string | null
          payment_status: string | null
          quantity: number | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_easy_bill_id?: string | null
          billing_easy_transaction_id?: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_limit?: number | null
          digital_product_id: string
          download_count?: number | null
          download_expires_at?: string | null
          download_token?: string | null
          download_url?: string | null
          encryption_key_id?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          is_encrypted?: boolean | null
          last_download_at?: string | null
          max_downloads?: number | null
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_operator?: string | null
          payment_phone_number?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quantity?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_easy_bill_id?: string | null
          billing_easy_transaction_id?: string | null
          card_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_limit?: number | null
          digital_product_id?: string
          download_count?: number | null
          download_expires_at?: string | null
          download_token?: string | null
          download_url?: string | null
          encryption_key_id?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          is_encrypted?: boolean | null
          last_download_at?: string | null
          max_downloads?: number | null
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_operator?: string | null
          payment_phone_number?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quantity?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_inquiries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_inquiries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "digital_inquiries_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_inquiries_encryption_key_id_fkey"
            columns: ["encryption_key_id"]
            isOneToOne: false
            referencedRelation: "encryption_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_inquiries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_products: {
        Row: {
          card_id: string
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          download_count: number | null
          duration: number | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          format: string | null
          id: string
          is_available: boolean | null
          is_free: boolean | null
          is_premium: boolean | null
          mime_type: string | null
          name: string | null
          preview_duration: number | null
          preview_url: string | null
          price: number | null
          status: string | null
          thumbnail_url: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_id: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          duration?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_available?: boolean | null
          is_free?: boolean | null
          is_premium?: boolean | null
          mime_type?: string | null
          name?: string | null
          preview_duration?: number | null
          preview_url?: string | null
          price?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_id?: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          duration?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_available?: boolean | null
          is_free?: boolean | null
          is_premium?: boolean | null
          mime_type?: string | null
          name?: string | null
          preview_duration?: number | null
          preview_url?: string | null
          price?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      digital_product_analytics: {
        Row: {
          id: string
          card_id: string
          title: string | null
          type: string | null
          price: number | null
          view_count: number | null
          download_count: number | null
          purchase_count: number | null
          total_revenue: number | null
          avg_sale_price: number | null
          created_at: string | null
          published_at: string | null
        }
        Insert: {
          id: string
          card_id: string
          title?: string | null
          type?: string | null
          price?: number | null
          view_count?: number | null
          download_count?: number | null
          purchase_count?: number | null
          total_revenue?: number | null
          avg_sale_price?: number | null
          created_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          card_id?: string
          title?: string | null
          type?: string | null
          price?: number | null
          view_count?: number | null
          download_count?: number | null
          purchase_count?: number | null
          total_revenue?: number | null
          avg_sale_price?: number | null
          created_at?: string | null
          published_at?: string | null
        }
        Relationships: []
      }
      digital_purchases: {
        Row: {
          amount: number
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string | null
          currency: string | null
          download_count: number | null
          download_token: string
          expires_at: string
          id: string
          last_download_at: string | null
          max_downloads: number | null
          payment_method: string | null
          payment_reference: string | null
          product_id: string
          status: string | null
        }
        Insert: {
          amount: number
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          currency?: string | null
          download_count?: number | null
          download_token: string
          expires_at: string
          id?: string
          last_download_at?: string | null
          max_downloads?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          product_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          currency?: string | null
          download_count?: number | null
          download_token?: string
          expires_at?: string
          id?: string
          last_download_at?: string | null
          max_downloads?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          product_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_version: number | null
          product_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          algorithm?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_version?: number | null
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          algorithm?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_version?: number | null
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encryption_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventories: {
        Row: {
          card_id: string
          completed_at: string | null
          created_at: string | null
          discrepancy_count: number
          id: string
          item_count: number
          notes: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          completed_at?: string | null
          created_at?: string | null
          discrepancy_count?: number
          id?: string
          item_count?: number
          notes?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          completed_at?: string | null
          created_at?: string | null
          discrepancy_count?: number
          id?: string
          item_count?: number
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventories_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventories_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          physical_stock: number
          product_id: string
          system_stock: number
          total_value: number
          unit_value: number
          variance: number
          variance_percent: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          physical_stock?: number
          product_id: string
          system_stock?: number
          total_value?: number
          unit_value?: number
          variance?: number
          variance_percent?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          physical_stock?: number
          product_id?: string
          system_stock?: number
          total_value?: number
          unit_value?: number
          variance?: number
          variance_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          is_service: boolean | null
          quantity: number | null
          total_ht: number | null
          total_ttc: number | null
          total_vat: number | null
          unit_price_ht: number | null
          vat_rate: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          is_service?: boolean | null
          quantity?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit_price_ht?: number | null
          vat_rate?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          is_service?: boolean | null
          quantity?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit_price_ht?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          apply_css: boolean | null
          bank_details: string | null
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_siret: string | null
          company_website: string | null
          created_at: string | null
          default_vat_rate: number | null
          id: string
          legal_mentions: string | null
          logo_url: string | null
          next_number: number | null
          pdf_template: string | null
          prefix: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apply_css?: boolean | null
          bank_details?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_siret?: string | null
          company_website?: string | null
          created_at?: string | null
          default_vat_rate?: number | null
          id?: string
          legal_mentions?: string | null
          logo_url?: string | null
          next_number?: number | null
          pdf_template?: string | null
          prefix?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apply_css?: boolean | null
          bank_details?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_siret?: string | null
          company_website?: string | null
          created_at?: string | null
          default_vat_rate?: number | null
          id?: string
          legal_mentions?: string | null
          logo_url?: string | null
          next_number?: number | null
          pdf_template?: string | null
          prefix?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          pdf_url: string | null
          status: string | null
          total_css: number | null
          total_ht: number | null
          total_tps: number | null
          total_ttc: number | null
          total_vat: number | null
          updated_at: string | null
          user_id: string
          vat_rate: number | null
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          status?: string | null
          total_css?: number | null
          total_ht?: number | null
          total_tps?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          updated_at?: string | null
          user_id: string
          vat_rate?: number | null
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          status?: string | null
          total_css?: number | null
          total_ht?: number | null
          total_tps?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          updated_at?: string | null
          user_id?: string
          vat_rate?: number | null
        }
        Relationships: []
      }
      media_content: {
        Row: {
          card_id: string
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_content_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_content_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          status: string | null
          type: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          payload: Json
          processed_at?: string | null
          status?: string | null
          type: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      party: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_callbacks: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          error_message: string | null
          id: string
          paid_at: string | null
          payer_email: string | null
          payer_msisdn: string | null
          payer_name: string | null
          payment_system: string | null
          processed: boolean
          processed_at: string | null
          raw_payload: Json
          reference: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          paid_at?: string | null
          payer_email?: string | null
          payer_msisdn?: string | null
          payer_name?: string | null
          payment_system?: string | null
          processed?: boolean
          processed_at?: string | null
          raw_payload: Json
          reference: string
          status: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          paid_at?: string | null
          payer_email?: string | null
          payer_msisdn?: string | null
          payer_name?: string | null
          payment_system?: string | null
          processed?: boolean
          processed_at?: string | null
          raw_payload?: Json
          reference?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analytics: {
        Row: {
          card_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string | null
          referrer_url: string | null
          user_agent: string | null
          user_id: string
          visitor_city: string | null
          visitor_country: string | null
          visitor_ip: string | null
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id: string
          visitor_city?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string
          visitor_city?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_analytics_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "portfolio_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "portfolio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          card_id: string | null
          category: string | null
          challenge: string | null
          created_at: string | null
          cta_label: string | null
          cta_type: string | null
          cta_url: string | null
          featured_image: string | null
          gallery_images: string[] | null
          id: string
          is_published: boolean | null
          order_index: number | null
          pdf_url: string | null
          result: string | null
          short_description: string | null
          slug: string
          solution: string | null
          tags: string[] | null
          testimonial_author: string | null
          testimonial_content: string | null
          testimonial_date: string | null
          testimonial_rating: number | null
          testimonial_role: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          card_id?: string | null
          category?: string | null
          challenge?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_type?: string | null
          cta_url?: string | null
          featured_image?: string | null
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          pdf_url?: string | null
          result?: string | null
          short_description?: string | null
          slug: string
          solution?: string | null
          tags?: string[] | null
          testimonial_author?: string | null
          testimonial_content?: string | null
          testimonial_date?: string | null
          testimonial_rating?: number | null
          testimonial_role?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          card_id?: string | null
          category?: string | null
          challenge?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_type?: string | null
          cta_url?: string | null
          featured_image?: string | null
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          pdf_url?: string | null
          result?: string | null
          short_description?: string | null
          slug?: string
          solution?: string | null
          tags?: string[] | null
          testimonial_author?: string | null
          testimonial_content?: string | null
          testimonial_date?: string | null
          testimonial_rating?: number | null
          testimonial_role?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      portfolio_services: {
        Row: {
          card_id: string | null
          created_at: string | null
          cta_label: string | null
          cta_url: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          price: number | null
          price_label: string | null
          price_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          price?: number | null
          price_label?: string | null
          price_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          price?: number | null
          price_label?: string | null
          price_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_services_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_services_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      portfolio_settings: {
        Row: {
          booking_system: string | null
          booking_url: string | null
          brand_color: string | null
          card_id: string
          cover_image: string | null
          created_at: string | null
          default_view: string | null
          id: string
          is_enabled: boolean | null
          projects_per_page: number | null
          show_categories: boolean | null
          show_testimonials: boolean | null
          subtitle: string | null
          title: string | null
          track_project_views: boolean | null
          track_quote_requests: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_system?: string | null
          booking_url?: string | null
          brand_color?: string | null
          card_id: string
          cover_image?: string | null
          created_at?: string | null
          default_view?: string | null
          id?: string
          is_enabled?: boolean | null
          projects_per_page?: number | null
          show_categories?: boolean | null
          show_testimonials?: boolean | null
          subtitle?: string | null
          title?: string | null
          track_project_views?: boolean | null
          track_quote_requests?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_system?: string | null
          booking_url?: string | null
          brand_color?: string | null
          card_id?: string
          cover_image?: string | null
          created_at?: string | null
          default_view?: string | null
          id?: string
          is_enabled?: boolean | null
          projects_per_page?: number | null
          show_categories?: boolean | null
          show_testimonials?: boolean | null
          subtitle?: string | null
          title?: string | null
          track_project_views?: boolean | null
          track_quote_requests?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_settings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_settings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      product_inquiries: {
        Row: {
          billing_easy_bill_id: string | null
          billing_easy_transaction_id: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_country: string | null
          delivery_postal_code: string | null
          external_reference: string | null
          id: string
          invoice_id: string | null
          message: string | null
          notes: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_operator: string | null
          payment_phone_number: string | null
          payment_reference: string | null
          payment_status: string | null
          product_id: string | null
          quantity: number | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_easy_bill_id?: string | null
          billing_easy_transaction_id?: string | null
          card_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_postal_code?: string | null
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_operator?: string | null
          payment_phone_number?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_easy_bill_id?: string | null
          billing_easy_transaction_id?: string | null
          card_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_postal_code?: string | null
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_operator?: string | null
          payment_phone_number?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inquiries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inquiries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "product_inquiries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock: {
        Row: {
          available_stock: number | null
          card_id: string
          created_at: string | null
          critical_stock_threshold: number | null
          current_stock: number
          id: string
          last_updated: string | null
          location: string | null
          low_stock_threshold: number | null
          product_id: string
          reserved_stock: number
          status: Database["public"]["Enums"]["stock_status"] | null
          updated_at: string | null
          warehouse: string | null
        }
        Insert: {
          available_stock?: number | null
          card_id: string
          created_at?: string | null
          critical_stock_threshold?: number | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          product_id: string
          reserved_stock?: number
          status?: Database["public"]["Enums"]["stock_status"] | null
          updated_at?: string | null
          warehouse?: string | null
        }
        Update: {
          available_stock?: number | null
          card_id?: string
          created_at?: string | null
          critical_stock_threshold?: number | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          product_id?: string
          reserved_stock?: number
          status?: Database["public"]["Enums"]["stock_status"] | null
          updated_at?: string | null
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          card_id: string
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_available: boolean | null
          name: string
          price: number | null
          status: string | null
          stock_quantity: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_id: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_available?: boolean | null
          name: string
          price?: number | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_id?: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_available?: boolean | null
          name?: string
          price?: number | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      professional_review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          voter_id: string
          voter_ip: unknown
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          voter_id: string
          voter_ip?: unknown
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          voter_id?: string
          voter_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "professional_review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "professional_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          helpful_votes: number | null
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_flagged: boolean | null
          is_verified_contact: boolean | null
          professional_id: string
          rating: number
          review_type: string | null
          reviewer_email: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          service_category: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_votes?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_verified_contact?: boolean | null
          professional_id: string
          rating: number
          review_type?: string | null
          reviewer_email?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          service_category?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_votes?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_verified_contact?: boolean | null
          professional_id?: string
          rating?: number
          review_type?: string | null
          reviewer_email?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          service_category?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          metadata: Json | null
          phone: string | null
          position: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          metadata?: Json | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          is_blocked: boolean | null
          request_count: number | null
          updated_at: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string | null
          voter_ip: unknown
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id?: string | null
          voter_ip?: unknown
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string | null
          voter_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          digital_product_id: string | null
          flag_reason: string | null
          helpful_votes: number | null
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_flagged: boolean | null
          is_verified_purchase: boolean | null
          product_id: string | null
          rating: number
          reviewer_email: string | null
          reviewer_name: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          digital_product_id?: string | null
          flag_reason?: string | null
          helpful_votes?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating: number
          reviewer_email?: string | null
          reviewer_name: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          digital_product_id?: string | null
          flag_reason?: string | null
          helpful_votes?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number
          reviewer_email?: string | null
          reviewer_name?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      rfm_segment_history: {
        Row: {
          contact_id: string
          created_at: string | null
          days_since_last_order: number | null
          f_score: number
          id: string
          m_score: number
          r_score: number
          segment: string
          total_orders: number | null
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          days_since_last_order?: number | null
          f_score: number
          id?: string
          m_score: number
          r_score: number
          segment: string
          total_orders?: number | null
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          days_since_last_order?: number | null
          f_score?: number
          id?: string
          m_score?: number
          r_score?: number
          segment?: string
          total_orders?: number | null
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfm_segment_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "scanned_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_contacts: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          raw_ocr_text: string | null
          scan_confidence: number | null
          scan_source_image_url: string | null
          social_media: Json | null
          source_id: string | null
          source_type: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          raw_ocr_text?: string | null
          scan_confidence?: number | null
          scan_source_image_url?: string | null
          social_media?: Json | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          raw_ocr_text?: string | null
          scan_confidence?: number | null
          scan_source_image_url?: string | null
          social_media?: Json | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          inquiry_id: string | null
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          inquiry_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          inquiry_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "digital_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      service_cards: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "service_cards_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "portfolio_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_quotes: {
        Row: {
          budget_range: string | null
          card_id: string | null
          client_company: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          conversion_date: string | null
          converted_to_invoice_id: string | null
          created_at: string | null
          id: string
          internal_notes: string | null
          last_contact_at: string | null
          preferred_start_date: string | null
          priority: string | null
          project_description: string | null
          project_id: string | null
          quote_amount: number | null
          quote_currency: string | null
          quote_expires_at: string | null
          quote_pdf_url: string | null
          quote_sent_at: string | null
          service_requested: string
          status: string | null
          updated_at: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          card_id?: string | null
          client_company?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          conversion_date?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          last_contact_at?: string | null
          preferred_start_date?: string | null
          priority?: string | null
          project_description?: string | null
          project_id?: string | null
          quote_amount?: number | null
          quote_currency?: string | null
          quote_expires_at?: string | null
          quote_pdf_url?: string | null
          quote_sent_at?: string | null
          service_requested: string
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          budget_range?: string | null
          card_id?: string | null
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          conversion_date?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          last_contact_at?: string | null
          preferred_start_date?: string | null
          priority?: string | null
          project_description?: string | null
          project_id?: string | null
          quote_amount?: number | null
          quote_currency?: string | null
          quote_expires_at?: string | null
          quote_pdf_url?: string | null
          quote_sent_at?: string | null
          service_requested?: string
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_quotes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_quotes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "service_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "portfolio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          image: string | null
          label: string | null
          platform: string
          url: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          image?: string | null
          label?: string | null
          platform: string
          url: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          image?: string | null
          label?: string | null
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_links_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          sku: string | null
          current_stock: number | null
          min_stock: number | null
          max_stock: number | null
          unit_price: number | null
          supplier: string | null
          location: string | null
          tags: string[] | null
          status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | null
          last_updated: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          sku?: string | null
          current_stock?: number | null
          min_stock?: number | null
          max_stock?: number | null
          unit_price?: number | null
          supplier?: string | null
          location?: string | null
          tags?: string[] | null
          status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | null
          last_updated?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          sku?: string | null
          current_stock?: number | null
          min_stock?: number | null
          max_stock?: number | null
          unit_price?: number | null
          supplier?: string | null
          location?: string | null
          tags?: string[] | null
          status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | null
          last_updated?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          card_id: string
          created_at: string | null
          current_stock: number
          id: string
          product_id: string
          resolved_at: string | null
          status: string | null
          threshold: number
          triggered_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          card_id: string
          created_at?: string | null
          current_stock: number
          id?: string
          product_id: string
          resolved_at?: string | null
          status?: string | null
          threshold: number
          triggered_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          card_id?: string
          created_at?: string | null
          current_stock?: number
          id?: string
          product_id?: string
          resolved_at?: string | null
          status?: string | null
          threshold?: number
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          operator_id: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          reference_id: string | null
          reference_type: string | null
          stock_after: number
          stock_before: number
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          operator_id?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          stock_after: number
          stock_before: number
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          operator_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          stock_after?: number
          stock_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          card_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          product_id: string
          quantity: number
          reserved_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          quantity: number
          reserved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          reserved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_accounts: {
        Row: {
          account_id: string
          account_type: string | null
          charges_enabled: boolean | null
          country: string | null
          created_at: string | null
          dashboard_url: string | null
          details_submitted: boolean | null
          email: string | null
          id: string
          metadata: Json | null
          onboarded: boolean | null
          onboarding_url: string | null
          payouts_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_type?: string | null
          charges_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          dashboard_url?: string | null
          details_submitted?: boolean | null
          email?: string | null
          id?: string
          metadata?: Json | null
          onboarded?: boolean | null
          onboarding_url?: string | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_type?: string | null
          charges_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          dashboard_url?: string | null
          details_submitted?: boolean | null
          email?: string | null
          id?: string
          metadata?: Json | null
          onboarded?: boolean | null
          onboarding_url?: string | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_connect_transactions: {
        Row: {
          amount_platform: number
          amount_seller: number
          amount_total: number
          card_id: string
          commission_fixed: number | null
          commission_rate: number | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          digital_product_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          order_type: string | null
          payment_intent_id: string | null
          product_id: string | null
          seller_account_id: string | null
          status: string | null
          transfer_id: string | null
          transfer_status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_platform: number
          amount_seller: number
          amount_total: number
          card_id: string
          commission_fixed?: number | null
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          digital_product_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          order_type?: string | null
          payment_intent_id?: string | null
          product_id?: string | null
          seller_account_id?: string | null
          status?: string | null
          transfer_id?: string | null
          transfer_status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_platform?: number
          amount_seller?: number
          amount_total?: number
          card_id?: string
          commission_fixed?: number | null
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          digital_product_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          order_type?: string | null
          payment_intent_id?: string | null
          product_id?: string | null
          seller_account_id?: string | null
          status?: string | null
          transfer_id?: string | null
          transfer_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: false
            referencedRelation: "stripe_connect_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "stripe_connect_transactions_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: false
            referencedRelation: "stripe_connect_stats"
            referencedColumns: ["account_id"]
          },
        ]
      }
      subscription_audit_log: {
        Row: {
          created_at: string | null
          current_value: number | null
          error_message: string | null
          event_type: string
          id: string
          limit_name: string
          limit_value: number | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          limit_name: string
          limit_value?: number | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          limit_name?: string
          limit_value?: number | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_items: {
        Row: {
          created_at: string | null
          id: string
          plan_feature_id: string
          subscription_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_feature_id: string
          subscription_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_feature_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json
          id: string
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_yearly: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features: Json
          id?: string
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_yearly: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          name?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          price_yearly?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: Json
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: Json
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: Json
          recorded_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          content: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      themes_party: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          party_id: string | null
          preview_image_url: string | null
          sort_order: number | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          party_id?: string | null
          preview_image_url?: string | null
          sort_order?: number | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          party_id?: string | null
          preview_image_url?: string | null
          sort_order?: number | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "themes_party_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addons: {
        Row: {
          addon_type: string
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_id: string | null
          purchased_at: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addon_type: string
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          purchased_at?: string
          quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addon_type?: string
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          purchased_at?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addons_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          addons: Json | null
          auto_renew: boolean
          boohpay_subscription_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          plan_type: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addons?: Json | null
          auto_renew?: boolean
          boohpay_subscription_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_type: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addons?: Json | null
          auto_renew?: boolean
          boohpay_subscription_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan_type?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      card_analytics_dashboard: {
        Row: {
          appointment_clicks: number | null
          card_id: string | null
          card_name: string | null
          clicks_last_30_days: number | null
          clicks_last_7_days: number | null
          clicks_today: number | null
          ctr_percentage: number | null
          email_clicks: number | null
          last_clicked_at: string | null
          last_viewed_at: string | null
          marketplace_clicks: number | null
          phone_clicks: number | null
          social_clicks: number | null
          total_clicks: number | null
          total_views: number | null
          unique_clickers: number | null
          unique_ctr_percentage: number | null
          unique_views: number | null
          user_id: string | null
          vcard_clicks: number | null
          views_last_30_days: number | null
          views_last_7_days: number | null
          views_today: number | null
          website_clicks: number | null
        }
        Relationships: []
      }
      card_click_stats: {
        Row: {
          appointment_clicks: number | null
          card_id: string | null
          clicks_last_30_days: number | null
          clicks_last_7_days: number | null
          clicks_today: number | null
          email_clicks: number | null
          last_clicked_at: string | null
          marketplace_clicks: number | null
          phone_clicks: number | null
          social_clicks: number | null
          total_clicks: number | null
          unique_clickers: number | null
          vcard_clicks: number | null
          website_clicks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_clicks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      card_view_stats: {
        Row: {
          card_id: string | null
          last_viewed_at: string | null
          total_views: number | null
          unique_views: number | null
          views_last_30_days: number | null
          views_last_7_days: number | null
          views_today: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_card_views_card_id"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_card_views_card_id"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      order_analytics: {
        Row: {
          average_order_value: number | null
          max_order_value: number | null
          min_order_value: number | null
          order_count: number | null
          order_type: string | null
          status: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      order_status_statistics: {
        Row: {
          count: number | null
          percentage: number | null
          status: string | null
          table_name: string | null
        }
        Relationships: []
      }
      payment_statistics: {
        Row: {
          avg_amount: number | null
          count: number | null
          payment_method: string | null
          payment_operator: string | null
          payment_status: string | null
          source_table: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      products_with_images: {
        Row: {
          card_id: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_available: boolean | null
          name: string | null
          price: number | null
          primary_image_url: string | null
          sorted_images: Json | null
          status: string | null
          stock_quantity: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_available?: boolean | null
          name?: string | null
          price?: number | null
          primary_image_url?: never
          sorted_images?: never
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_available?: boolean | null
          name?: string | null
          price?: number | null
          primary_image_url?: never
          sorted_images?: never
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics_dashboard"
            referencedColumns: ["card_id"]
          },
        ]
      }
      recent_orders: {
        Row: {
          card_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          digital_product_id: string | null
          download_count: number | null
          download_token: string | null
          expires_at: string | null
          id: string | null
          invoice_id: string | null
          order_description: string | null
          order_type: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      stripe_connect_stats: {
        Row: {
          account_id: string | null
          last_transaction_at: string | null
          successful_transactions: number | null
          total_commission_cents: number | null
          total_payout_cents: number | null
          total_revenue_cents: number | null
          total_transactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
      unified_orders: {
        Row: {
          card_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          digital_product_id: string | null
          download_count: number | null
          download_token: string | null
          expires_at: string | null
          id: string | null
          invoice_id: string | null
          order_description: string | null
          order_type: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      user_active_addons: {
        Row: {
          addon_type: string | null
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          notes: string | null
          payment_id: string | null
          purchased_at: string | null
          quantity: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          addon_type?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          notes?: string | null
          payment_id?: string | null
          purchased_at?: string | null
          quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          addon_type?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          notes?: string | null
          payment_id?: string | null
          purchased_at?: string | null
          quantity?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_addons_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      add_first_admin: { Args: { admin_user_id: string }; Returns: boolean }
      add_product_image: {
        Args: { p_alt?: string; p_image_url: string; p_product_id: string }
        Returns: Json
      }
      add_user_addon: {
        Args: {
          p_addon_type: string
          p_expires_at?: string
          p_payment_id?: string
          p_quantity?: number
          p_user_id: string
        }
        Returns: {
          addon_type: string
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_id: string | null
          purchased_at: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_addons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_campaign_roi: {
        Args: { p_period_days?: number; p_rule_id: string; p_user_id: string }
        Returns: {
          click_rate: number
          clicked_count: number
          conversion_rate: number
          converted_count: number
          estimated_cost: number
          open_rate: number
          opened_count: number
          roi_percent: number
          sent_count: number
          total_revenue: number
        }[]
      }
      calculate_commission: {
        Args: {
          amount_total_cents: number
          commission_fixed_cents?: number
          commission_rate_pct?: number
        }
        Returns: {
          platform_amount: number
          seller_amount: number
        }[]
      }
      calculate_inventory_stats: {
        Args: { p_inventory_id: string }
        Returns: {
          items_with_variance: number
          total_items: number
          total_physical_value: number
          total_system_value: number
          total_variance: number
        }[]
      }
      cancel_order_with_stock_refund: {
        Args: { p_order_id: string; p_order_type?: string }
        Returns: boolean
      }
      check_and_create_stock_alerts: {
        Args: { p_current_stock: number; p_product_id: string }
        Returns: undefined
      }
      check_stock_availability: {
        Args: { p_card_id: string; p_product_id: string; p_quantity: number }
        Returns: {
          available_stock: number
          is_available: boolean
          message: string
          required_quantity: number
        }[]
      }
      cleanup_expired_data: { Args: never; Returns: undefined }
      cleanup_old_rate_limit_entries: { Args: never; Returns: undefined }
      confirm_order_with_stock: {
        Args: { p_order_id: string; p_order_type?: string }
        Returns: boolean
      }
      demote_from_admin: { Args: { target_user_id: string }; Returns: boolean }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expire_user_addon: { Args: { p_addon_id: string }; Returns: boolean }
      finalize_inventory: {
        Args: { p_inventory_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      find_order_by_bill_id: {
        Args: { bill_id_param: string }
        Returns: {
          amount: number
          client_email: string
          id: string
          payment_status: string
          type: string
        }[]
      }
      generate_content_slug: { Args: { title: string }; Returns: string }
      generate_slug_from_name: { Args: { name_text: string }; Returns: string }
      generate_unique_slug: {
        Args: { title_text: string; user_uuid: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_admin_metrics: { Args: never; Returns: Json }
      get_card_by_identifier: {
        Args: { identifier: string }
        Returns: {
          id: string
          is_public: boolean
          name: string
          slug: string
          user_id: string
        }[]
      }
      get_card_dashboard_stats: {
        Args: { card_id_param: string }
        Returns: {
          total_appointments: number
          total_digital_products: number
          total_inquiries: number
          total_products: number
          total_reviews: number
          total_views: number
        }[]
      }
      get_card_orders: {
        Args: { p_card_id: string }
        Returns: {
          card_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          digital_product_id: string | null
          download_count: number | null
          download_token: string | null
          expires_at: string | null
          id: string | null
          invoice_id: string | null
          order_description: string | null
          order_type: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "unified_orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_card_stats: {
        Args: { card_id_param: string }
        Returns: {
          total_appointments: number
          total_digital_products: number
          total_inquiries: number
          total_products: number
          total_views: number
        }[]
      }
      get_card_views_stats: {
        Args: { card_ids: string[] }
        Returns: {
          total_shares: number
          total_views: number
        }[]
      }
      get_order_by_id: {
        Args: { p_order_id: string; p_order_type: string }
        Returns: {
          card_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          digital_product_id: string | null
          download_count: number | null
          download_token: string | null
          expires_at: string | null
          id: string | null
          invoice_id: string | null
          order_description: string | null
          order_type: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "unified_orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_order_statistics: {
        Args: { p_card_id: string }
        Returns: {
          cancelled_orders: number
          completed_orders: number
          digital_orders: number
          pending_orders: number
          physical_orders: number
          processing_orders: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_per_card_view_counts: {
        Args: { card_ids: string[] }
        Returns: {
          card_id: string
          view_count: number
        }[]
      }
      get_performance_stats: {
        Args: never
        Returns: {
          active_users: number
          avg_response_time: number
          error_rate: number
          system_uptime: number
          total_requests: number
        }[]
      }
      get_portfolio_stats: { Args: { user_uuid: string }; Returns: Json }
      get_portfolio_stats_by_card: {
        Args: { card_uuid: string }
        Returns: Json
      }
      get_product_primary_image: {
        Args: { product_id: string }
        Returns: string
      }
      get_professional_average_rating: {
        Args: { professional_uuid: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      get_real_analytics: { Args: never; Returns: Json }
      get_usage_metrics: {
        Args: { user_id_param: string }
        Returns: {
          appointments_received: number
          cards_created: number
          contacts_scanned: number
          digital_products_created: number
          inquiries_received: number
          products_created: number
          views_received: number
        }[]
      }
      get_user_active_addons: {
        Args: { p_user_id: string }
        Returns: {
          addon_type: string
          id: string
          quantity: number
        }[]
      }
      get_user_dashboard_stats: {
        Args: { user_id_param: string }
        Returns: {
          total_appointments: number
          total_cards: number
          total_contacts: number
          total_digital_products: number
          total_inquiries: number
          total_products: number
          total_views: number
        }[]
      }
      get_user_stats: {
        Args: { user_id_param: string }
        Returns: {
          total_cards: number
          total_contacts: number
          total_digital_products: number
          total_products: number
          total_views: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_feature_access: {
        Args: { feature_name: string; p_user_id?: string }
        Returns: boolean
      }
      has_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      increment:
        | { Args: { project_id: string }; Returns: undefined }
        | {
            Args: { column_name: string; row_id: string; table_name: string }
            Returns: undefined
          }
      is_admin: { Args: { uid: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_automation_queue: {
        Args: never
        Returns: {
          processed_count: number
        }[]
      }
      process_notification_queue: { Args: never; Returns: undefined }
      process_order_with_stock_decrement: {
        Args: {
          p_order_id: string
          p_order_type?: string
          p_product_id: string
          p_quantity: number
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { target_user_id: string }; Returns: boolean }
      record_card_view: {
        Args: {
          card_uuid: string
          referrer_param?: string
          user_agent_param?: string
          viewer_ip_param?: string
        }
        Returns: undefined
      }
      refresh_card_analytics_stats: { Args: never; Returns: undefined }
      register_download_event: {
        Args: {
          p_device_fingerprint: string
          p_inquiry_id: string
          p_ip_address: string
          p_user_agent: string
        }
        Returns: boolean
      }
      release_stock_reservation: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      remove_product_image: {
        Args: { p_image_order: number; p_product_id: string }
        Returns: Json
      }
      reorder_product_images: {
        Args: { p_new_order: number[]; p_product_id: string }
        Returns: Json
      }
      reserve_stock: {
        Args: {
          p_expires_at?: string
          p_order_id?: string
          p_product_id: string
          p_quantity: number
        }
        Returns: string
      }
      search_orders: {
        Args: {
          p_card_id: string
          p_limit?: number
          p_offset?: number
          p_search_term: string
        }
        Returns: {
          card_id: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          digital_product_id: string | null
          download_count: number | null
          download_token: string | null
          expires_at: string | null
          id: string | null
          invoice_id: string | null
          order_description: string | null
          order_type: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "unified_orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      setup_member_default_permissions: {
        Args: { p_member_id: string; p_member_role: string }
        Returns: undefined
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      test_google_oauth: {
        Args: never
        Returns: {
          policies_count: number
          profiles_columns: string[]
          trigger_exists: boolean
        }[]
      }
      track_card_visit: {
        Args: {
          card_id_param: string
          viewer_ip_param?: string
          viewer_referrer_param?: string
          viewer_user_agent_param?: string
        }
        Returns: string
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_digital_inquiry_payment_status: {
        Args: { inquiry_id: string; new_payment_status: string }
        Returns: boolean
      }
      update_digital_inquiry_status: {
        Args: { inquiry_id: string; new_status: string }
        Returns: boolean
      }
      update_order_status: {
        Args: { new_status: string; order_id: string; order_type: string }
        Returns: boolean
      }
      update_overdue_invoices: { Args: never; Returns: undefined }
      update_payment_status: {
        Args: {
          new_payment_status: string
          order_id: string
          order_type: string
        }
        Returns: boolean
      }
      update_product_stock: {
        Args: {
          p_movement_type: Database["public"]["Enums"]["stock_movement_type"]
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_has_addon: {
        Args: { p_addon_type: string; p_user_id: string }
        Returns: boolean
      }
      validate_currency_final: {
        Args: { currency_code: string }
        Returns: boolean
      }
      validate_currency_simple: {
        Args: { currency_code: string }
        Returns: boolean
      }
      validate_download: {
        Args: { p_download_token: string }
        Returns: {
          buyer_email: string
          buyer_name: string
          error_message: string
          file_url: string
          is_valid: boolean
          product_title: string
        }[]
      }
      validate_download_token_secure: {
        Args: { p_device_fingerprint?: string; p_download_token: string }
        Returns: {
          error_message: string
          file_url: string
          inquiry_id: string
          is_valid: boolean
          product_id: string
        }[]
      }
      validate_status_transition: {
        Args: { new_status: string; old_status: string }
        Returns: boolean
      }
      verify_rls_status: {
        Args: never
        Returns: {
          issues: string[]
          policies: string[]
          policy_count: number
          rls_enabled: boolean
          schema_name: string
          table_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      payment_method: "mobile_money" | "bank_transfer" | "cash"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      stock_movement_type:
        | "initial_stock"
        | "purchase"
        | "sale"
        | "reservation"
        | "unreservation"
        | "adjustment"
        | "return"
        | "damage"
        | "expired"
        | "transfer"
      stock_status:
        | "in_stock"
        | "low_stock"
        | "out_of_stock"
        | "reserved"
        | "discontinued"
      subscription_plan:
        | "decouverte"
        | "essentiel"
        | "essentiel_plus"
        | "pro"
        | "business"
      subscription_status: "active" | "canceled" | "pending" | "expired"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      payment_method: ["mobile_money", "bank_transfer", "cash"],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      stock_movement_type: [
        "initial_stock",
        "purchase",
        "sale",
        "reservation",
        "unreservation",
        "adjustment",
        "return",
        "damage",
        "expired",
        "transfer",
      ],
      stock_status: [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "reserved",
        "discontinued",
      ],
      subscription_plan: [
        "decouverte",
        "essentiel",
        "essentiel_plus",
        "pro",
        "business",
      ],
      subscription_status: ["active", "canceled", "pending", "expired"],
    },
  },
} as const
