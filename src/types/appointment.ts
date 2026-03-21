/**
 * Types pour le système de rendez-vous
 */

export interface Appointment {
  id: string;
  card_id: string;
  user_id: string;

  // Client info
  client_name: string;
  client_email?: string;
  client_phone?: string;

  // Détails du rendez-vous
  title: string;
  description?: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  duration_minutes: number;

  // Location
  location?: string;
  location_type: 'physical' | 'video' | 'phone';
  meeting_url?: string; // Pour les visio

  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

  // Notifications
  reminder_sent: boolean;
  reminder_sent_at?: string;
  confirmation_sent: boolean;

  // Notes
  notes?: string;
  cancellation_reason?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AppointmentSettings {
  user_id: string;
  card_id: string;

  // Disponibilités
  working_hours: WorkingHours;
  time_zone: string;

  // Durée par défaut
  default_duration: number; // en minutes
  buffer_time: number; // Temps entre rendez-vous

  // Limites
  max_advance_booking_days: number;
  min_notice_hours: number;

  // Intégrations
  google_calendar_enabled: boolean;
  google_calendar_id?: string;

  // Notifications
  email_notifications: boolean;
  sms_notifications: boolean;
  reminder_hours_before: number;

  // Messages personnalisés
  confirmation_message?: string;
  reminder_message?: string;

  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface AppointmentType {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  color?: string;
  price?: number;
  currency?: string;
  active: boolean;
  created_at: string;
}

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  available: boolean;
}

export type AppointmentFormData = Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type AppointmentTypeFormData = Omit<AppointmentType, 'id' | 'user_id' | 'created_at'>;
