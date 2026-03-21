/**
 * BOOH Events - Type Definitions
 * Phase 1: Core event management types
 */

// =====================================================
// ENUMS
// =====================================================

export type EventType = 'physical' | 'online' | 'hybrid';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'archived';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type TicketStatus = 'active' | 'cancelled' | 'transferred' | 'expired';

export type AttendanceStatus = 'registered' | 'attended' | 'no_show' | 'cancelled';

export type PaymentMethod = 'mobile_money' | 'card' | 'free';

// Phase 2: Live Streaming
export type LiveStreamPlatform = 'youtube' | 'twitch' | 'facebook' | 'custom';

export type LiveStreamStatus = 'scheduled' | 'live' | 'ended' | 'replay';

export type ChatMessageType = 'text' | 'system' | 'tip' | 'emoji';

// =====================================================
// TICKET CONFIGURATION
// =====================================================

export interface TicketTier {
  id: string;
  name: string; // 'VIP', 'Early Bird', 'Standard'
  description?: string;
  price: number;
  currency: string;
  quantity: number; // Nombre de places disponibles
  soldCount: number; // Nombre vendus
  color?: string; // Couleur pour l'affichage
  features?: string[]; // Avantages inclus
  salesStartDate?: string;
  salesEndDate?: string;
}

// =====================================================
// MAIN INTERFACES
// =====================================================

export interface Event {
  id: string;
  user_id: string;
  card_id?: string;

  // Basic info
  title: string;
  description?: string;
  slug?: string;

  // Type & status
  event_type: EventType;
  status: EventStatus;
  category?: string;

  // Dates
  start_date: string;
  end_date: string;
  timezone: string;

  // Location (for physical events)
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;

  // Capacity
  max_capacity?: number;
  current_attendees: number;
  allow_waitlist: boolean;

  // Media
  cover_image_url?: string;
  promo_video_url?: string;
  images_urls: string[];

  // Ticketing
  is_free: boolean;
  tickets_config: TicketTier[];

  // Visibility
  is_public: boolean;
  is_featured: boolean;
  tags: string[];

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;

  // Phase 2: Live Streaming
  has_live_stream?: boolean;
  live_stream_url?: string;
  live_stream_platform?: LiveStreamPlatform;
  live_stream_status?: LiveStreamStatus;
  live_started_at?: string;
  live_ended_at?: string;
  replay_url?: string;
  current_viewers?: number;
  peak_viewers?: number;
  total_tips_amount?: number;
  enable_chat?: boolean;
  enable_tips?: boolean;
}

export interface EventTicket {
  id: string;
  event_id: string;
  user_id?: string;

  // Ticket info
  ticket_type: string;
  ticket_number: string;
  qr_code: string;

  // Attendee info
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;

  // Payment
  price: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_id?: string;
  payment_method?: PaymentMethod;

  // Validation
  is_validated: boolean;
  validated_at?: string;
  validated_by?: string;

  // Status
  status: TicketStatus;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventAnalytics {
  id: string;
  event_id: string;
  date: string;

  // Views & engagement
  page_views: number;
  unique_visitors: number;
  shares: number;
  favorites: number;

  // Tickets
  tickets_sold: number;
  tickets_validated: number;
  revenue: number;
  currency: string;

  // Traffic sources
  traffic_sources: Record<string, number>;

  // Conversion
  conversion_rate?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id?: string;
  ticket_id?: string;

  // Info
  name: string;
  email: string;
  phone?: string;

  // Status
  attendance_status: AttendanceStatus;

  // Check-in
  checked_in: boolean;
  checked_in_at?: string;

  // Communication
  notifications_enabled: boolean;
  reminder_sent: boolean;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventFavorite {
  id: string;
  event_id: string;
  user_id: string;
  notify_on_update: boolean;
  created_at: string;
}

// =====================================================
// PHASE 2: LIVE STREAMING INTERFACES
// =====================================================

export interface EventChatMessage {
  id: string;
  event_id: string;
  user_id?: string;

  // User info (denormalized)
  user_name: string;
  user_avatar_url?: string;

  // Message
  message: string;
  message_type: ChatMessageType;

  // Moderation
  is_pinned: boolean;
  is_deleted: boolean;

  // Metadata
  metadata: Record<string, any>;

  // Timestamp
  created_at: string;
}

export interface EventTip {
  id: string;
  event_id: string;
  user_id?: string;

  // Tipper info
  tipper_name: string;
  tipper_email?: string;

  // Amount
  amount: number;
  currency: string;

  // Message
  message?: string;
  is_anonymous: boolean;

  // Payment
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  created_at: string;
  completed_at?: string;
}

export interface EventViewer {
  id: string;
  event_id: string;
  user_id?: string;

  // Session
  session_id: string;
  user_agent?: string;
  ip_address?: string;

  // Viewer info
  viewer_name?: string;
  is_anonymous: boolean;

  // Timestamps
  joined_at: string;
  last_seen_at: string;
  left_at?: string;

  // Stats
  watch_duration_seconds: number;
}

export interface LiveStreamConfig {
  has_live_stream: boolean;
  live_stream_url?: string;
  live_stream_platform?: LiveStreamPlatform;
  enable_chat?: boolean;
  enable_tips?: boolean;
  replay_url?: string;
}

// =====================================================
// FORM DATA TYPES
// =====================================================

export interface EventFormData {
  title: string;
  description?: string;
  event_type: EventType;
  category?: string;

  start_date: Date | string;
  end_date: Date | string;
  timezone?: string;

  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;

  max_capacity?: number;
  allow_waitlist?: boolean;

  cover_image_url?: string;
  promo_video_url?: string;
  images_urls?: string[];

  is_free: boolean;
  tickets_config?: TicketTier[];

  is_public?: boolean;
  tags?: string[];

  // Phase 2: Live Streaming
  has_live_stream?: boolean;
  live_stream_url?: string;
  live_stream_platform?: LiveStreamPlatform;
  enable_chat?: boolean;
  enable_tips?: boolean;

  // Metadata for additional data (e.g., multiple card_ids)
  metadata?: Record<string, any>;
}

export interface TicketPurchaseData {
  event_id: string;
  ticket_type: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  quantity?: number;
}

// =====================================================
// STATISTICS & AGGREGATES
// =====================================================

export interface EventStats {
  total_tickets: number;
  tickets_sold: number;
  tickets_validated: number;
  total_revenue: number;
  current_attendees: number;
  max_capacity?: number;
  availability_rate: number; // Pourcentage de remplissage
}

export interface EventWithStats extends Event {
  stats: EventStats;
}

export interface EventDashboardMetrics {
  total_events: number;
  upcoming_events: number;
  active_events: number;
  total_attendees: number;
  total_revenue: number;
  average_ticket_price: number;
  conversion_rate: number;
}

// =====================================================
// FILTERS & SEARCH
// =====================================================

export interface EventFilters {
  status?: EventStatus[];
  event_type?: EventType[];
  category?: string[];
  start_date_from?: string;
  start_date_to?: string;
  is_free?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
  search?: string;
  tags?: string[];
}

export interface EventSortOptions {
  field: 'start_date' | 'created_at' | 'current_attendees' | 'title';
  direction: 'asc' | 'desc';
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface EventsListResponse {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TicketValidationResult {
  valid: boolean;
  ticket?: EventTicket;
  event?: Event;
  message: string;
}

// =====================================================
// QR CODE
// =====================================================

export interface QRCodeData {
  ticket_id: string;
  event_id: string;
  attendee_email: string;
  validation_token: string;
}

// =====================================================
// EXPORT TYPES
// =====================================================

export interface EventExportData {
  event: Event;
  tickets: EventTicket[];
  attendees: EventAttendee[];
  analytics: EventAnalytics[];
}

// =====================================================
// TICKET VALIDATION
// =====================================================

export interface RecentValidation {
  id: string;
  attendee_name: string;
  attendee_email: string;
  ticket_number: string;
  ticket_type: string;
  validated_at: string;
}

export interface TicketValidationStats {
  totalTickets: number;
  validatedTickets: number;
  pendingValidation: number;
  validationRate: number;
  validationsByHour: Array<{ hour: string; count: number }>;
  validationsByType: Array<{ type: string; count: number }>;
  recentValidations: RecentValidation[];
}

