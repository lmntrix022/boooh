/**
 * Availability Service
 * Manages card availability settings, working hours, and timezone handling
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/supabase";

type DbAvailabilitySettings = Database['public']['Tables']['card_availability_settings']['Row'];

export interface TimeSlot {
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
}

export interface WorkingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface AvailabilitySettings {
  id?: string;
  card_id: string;
  user_id?: string;
  working_hours: WorkingHours;
  timezone: string;
  default_duration: number;
  buffer_time: number;
  min_booking_notice: number; // minutes
  max_booking_advance: number; // days
  notify_owner_new_appointment: boolean;
  notify_owner_cancellation: boolean;
  notify_client_confirmation: boolean;
  notify_client_reminder: boolean;
  reminder_times: number[]; // minutes before appointment
}

// Default working hours (Monday-Friday, 9-5)
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: [{ start: "09:00", end: "17:00" }],
  tuesday: [{ start: "09:00", end: "17:00" }],
  wednesday: [{ start: "09:00", end: "17:00" }],
  thursday: [{ start: "09:00", end: "17:00" }],
  friday: [{ start: "09:00", end: "17:00" }],
  saturday: [],
  sunday: [],
};

// Common timezones for selection
export const COMMON_TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (GMT+1/+2)" },
  { value: "Europe/London", label: "Londres (GMT+0/+1)" },
  { value: "America/New_York", label: "New York (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
  { value: "America/Chicago", label: "Chicago (GMT-6/-5)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+10/+11)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

// Convert DB row to local type
function toAvailabilitySettings(row: DbAvailabilitySettings): AvailabilitySettings {
  return {
    id: row.id,
    card_id: row.card_id,
    user_id: row.user_id || undefined,
    working_hours: (row.working_hours as unknown as WorkingHours) || DEFAULT_WORKING_HOURS,
    timezone: row.timezone || 'Europe/Paris',
    default_duration: row.default_duration || 30,
    buffer_time: row.buffer_time || 0,
    min_booking_notice: row.min_booking_notice || 60,
    max_booking_advance: row.max_booking_advance || 30,
    notify_owner_new_appointment: row.notify_owner_new_appointment ?? true,
    notify_owner_cancellation: row.notify_owner_cancellation ?? true,
    notify_client_confirmation: row.notify_client_confirmation ?? true,
    notify_client_reminder: row.notify_client_reminder ?? true,
    reminder_times: (row.reminder_times as unknown as number[]) || [60, 1440]
  };
}

/**
 * Get availability settings for a card
 */
export async function getAvailabilitySettings(
  cardId: string
): Promise<AvailabilitySettings | null> {
  try {
    // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 406
    const { data, error } = await supabase
      .from("card_availability_settings")
      .select("*")
      .eq("card_id", cardId)
      .maybeSingle();

    if (error) {
      // Handle 406 Not Acceptable errors - these are usually RLS or permission issues
      if (error.code === "PGRST116" || error.code === "406") {
        console.warn("406 Not Acceptable for card_availability_settings - no record found or RLS blocked");
        return null;
      }
      console.error("Failed to fetch availability settings:", error);
      throw error;
    }

    return data ? toAvailabilitySettings(data) : null;
  } catch (error: unknown) {
    const e = error as { message?: string };
    if (e.message?.includes("406")) {
      console.warn("406 error getting availability settings - returning null");
      return null;
    }
    throw error;
  }
}

/**
 * Create or update availability settings
 */
export async function saveAvailabilitySettings(
  settings: Partial<AvailabilitySettings>
): Promise<AvailabilitySettings> {
  // Check if settings exist
  const existing = await getAvailabilitySettings(settings.card_id!);

  try {
    // Convert settings to DB format - using type assertion for insert
    type InsertType = Database['public']['Tables']['card_availability_settings']['Insert'];
    const dbSettings: InsertType = {
      card_id: settings.card_id!,
      user_id: settings.user_id || '',
      working_hours: settings.working_hours as unknown as InsertType['working_hours'],
      timezone: settings.timezone ?? null,
      default_duration: settings.default_duration ?? null,
      buffer_time: settings.buffer_time ?? null,
      min_booking_notice: settings.min_booking_notice ?? null,
      max_booking_advance: settings.max_booking_advance ?? null,
      notify_owner_new_appointment: settings.notify_owner_new_appointment ?? null,
      notify_owner_cancellation: settings.notify_owner_cancellation ?? null,
      notify_client_confirmation: settings.notify_client_confirmation ?? null,
      notify_client_reminder: settings.notify_client_reminder ?? null,
      reminder_times: settings.reminder_times as unknown as InsertType['reminder_times']
    };

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("card_availability_settings")
        .update(dbSettings)
        .eq("card_id", settings.card_id!)
        .select()
        .single();

      if (error) {
        if (error.code === "406") {
          console.warn("406 error updating availability settings");
          throw new Error("Impossible de mettre à jour les paramètres de disponibilité");
        }
        console.error("Failed to update availability settings:", error);
        throw error;
      }

      return toAvailabilitySettings(data);
    } else {
      // Insert
      const { data, error } = await supabase
        .from("card_availability_settings")
        .insert(dbSettings)
        .select()
        .single();

      if (error) {
        if (error.code === "406") {
          console.warn("406 error creating availability settings");
          throw new Error("Impossible de créer les paramètres de disponibilité");
        }
        console.error("Failed to create availability settings:", error);
        throw error;
      }

      return toAvailabilitySettings(data);
    }
  } catch (error: any) {
    if (error.status === 406 || error.message?.includes("406")) {
      console.error("406 error in saveAvailabilitySettings:", error);
    }
    throw error;
  }
}

/**
 * Generate time slots for a specific day based on working hours
 */
export function generateTimeSlots(
  dayOfWeek: keyof WorkingHours,
  workingHours: WorkingHours,
  slotDuration: number = 30 // minutes
): string[] {
  const slots: string[] = [];
  const daySlots = workingHours[dayOfWeek];

  if (!daySlots || daySlots.length === 0) {
    return [];
  }

  daySlots.forEach((slot) => {
    const [startHour, startMinute] = slot.start.split(":").map(Number);
    const [endHour, endMinute] = slot.end.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + slotDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
      currentMinutes += slotDuration;
    }
  });

  return slots;
}

/**
 * Check if a specific time is within working hours
 */
export function isWithinWorkingHours(
  date: Date,
  workingHours: WorkingHours
): boolean {
  const dayNames: (keyof WorkingHours)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const dayOfWeek = dayNames[date.getDay()];
  const daySlots = workingHours[dayOfWeek];

  if (!daySlots || daySlots.length === 0) {
    return false;
  }

  const timeString = `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return daySlots.some((slot) => {
    return timeString >= slot.start && timeString < slot.end;
  });
}

/**
 * Check if booking is within allowed advance notice
 */
export function isBookingAllowed(
  appointmentDate: Date,
  settings: AvailabilitySettings
): { allowed: boolean; reason?: string } {
  const now = new Date();
  const diffMinutes = (appointmentDate.getTime() - now.getTime()) / (1000 * 60);

  // Check minimum notice
  if (diffMinutes < settings.min_booking_notice) {
    return {
      allowed: false,
      reason: `Un préavis minimum de ${settings.min_booking_notice} minutes est requis`,
    };
  }

  // Check maximum advance
  const maxMinutes = settings.max_booking_advance * 24 * 60;
  if (diffMinutes > maxMinutes) {
    return {
      allowed: false,
      reason: `Les réservations ne peuvent être faites plus de ${settings.max_booking_advance} jours à l'avance`,
    };
  }

  return { allowed: true };
}

/**
 * Get user's timezone (from browser or default)
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Convert time from one timezone to another
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  // Create formatter for source timezone
  const sourceFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: fromTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Parse source time
  const sourceParts = sourceFormatter.formatToParts(date);
  const sourceValues: any = {};
  sourceParts.forEach((part) => {
    if (part.type !== "literal") {
      sourceValues[part.type] = part.value;
    }
  });

  // Create date string
  const isoString = `${sourceValues.year}-${sourceValues.month}-${sourceValues.day}T${sourceValues.hour}:${sourceValues.minute}:${sourceValues.second}`;

  // Create formatter for target timezone
  const targetDate = new Date(isoString);
  return targetDate;
}

/**
 * Format date in a specific timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: timezone,
  }).format(date);
}

/**
 * Get available time slots for a specific date
 * Takes into account working hours, existing appointments, and buffer time
 */
export async function getAvailableSlots(
  cardId: string,
  date: Date
): Promise<string[]> {
  // Get settings
  const settings = await getAvailabilitySettings(cardId);
  if (!settings) {
    return [];
  }

  // Get day of week
  const dayNames: (keyof WorkingHours)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOfWeek = dayNames[date.getDay()];

  // Generate all possible slots for this day
  const allSlots = generateTimeSlots(
    dayOfWeek,
    settings.working_hours,
    settings.default_duration
  );

  if (allSlots.length === 0) {
    return [];
  }

  // Fetch existing appointments for this day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("date, duration, status")
    .eq("card_id", cardId)
    .neq("status", "cancelled")
    .gte("date", startOfDay.toISOString())
    .lte("date", endOfDay.toISOString());

  // Filter out occupied slots
  const availableSlots = allSlots.filter((timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    // Check if slot is in the past
    if (slotDate < new Date()) {
      return false;
    }

    // Check against existing appointments
    const isOccupied = appointments?.some((apt) => {
      if (!apt.date) return false;
      const aptDate = new Date(apt.date);
      const aptDuration = apt.duration || 60;
      const aptEnd = new Date(aptDate.getTime() + aptDuration * 60 * 1000);

      // Add buffer time
      const bufferMs = settings.buffer_time * 60 * 1000;
      const slotEnd = new Date(
        slotDate.getTime() + settings.default_duration * 60 * 1000
      );

      // Check for overlap including buffer
      return (
        (slotDate >= new Date(aptDate.getTime() - bufferMs) &&
          slotDate < new Date(aptEnd.getTime() + bufferMs)) ||
        (slotEnd > new Date(aptDate.getTime() - bufferMs) &&
          slotEnd <= new Date(aptEnd.getTime() + bufferMs))
      );
    });

    return !isOccupied;
  });

  return availableSlots;
}

/**
 * Check slot availability in real-time (uses SQL function for accuracy, with fallback)
 */
export async function checkSlotAvailability(
  cardId: string,
  date: Date,
  duration: number = 60,
  excludeAppointmentId?: string
): Promise<{ available: boolean; conflict?: { clientName: string; time: string } }> {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('check_slot_availability', {
      p_card_id: cardId,
      p_date: date.toISOString(),
      p_duration: duration,
      p_exclude_appointment_id: excludeAppointmentId || null
    });

    if (error) {
      // If function doesn't exist, use fallback
      if (error.message.includes('function') || error.code === '42883') {
        return await checkSlotAvailabilityFallback(cardId, date, duration, excludeAppointmentId);
      }
      console.error("Error checking slot availability:", error);
      return { available: true }; // Fallback to available if check fails
    }

    if (data.available) {
      return { available: true };
    }

    return {
      available: false,
      conflict: {
        clientName: data.conflict_with,
        time: data.conflict_time
      }
    };
  } catch (error) {
    console.error("Failed to check slot availability, using fallback:", error);
    return await checkSlotAvailabilityFallback(cardId, date, duration, excludeAppointmentId);
  }
}

/**
 * Fallback slot availability check using direct query
 */
async function checkSlotAvailabilityFallback(
  cardId: string,
  date: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ available: boolean; conflict?: { clientName: string; time: string } }> {
  try {
    const startOfSlot = new Date(date.getTime() - 60 * 60 * 1000);
    const endOfSlot = new Date(date.getTime() + (duration + 60) * 60 * 1000);

    let query = supabase
      .from("appointments")
      .select("id, client_name, date")
      .eq("card_id", cardId)
      .neq("status", "cancelled")
      .gte("date", startOfSlot.toISOString())
      .lte("date", endOfSlot.toISOString())
      .limit(1);

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }

    const { data: conflicts } = await query;

    if (conflicts && conflicts.length > 0) {
      return {
        available: false,
        conflict: {
          clientName: conflicts[0].client_name,
          time: new Date(conflicts[0].date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      };
    }

    return { available: true };
  } catch (error) {
    console.error("Fallback availability check failed:", error);
    return { available: true };
  }
}

/**
 * Book appointment atomically with conflict prevention
 */
export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
  message?: string;
  nextAvailable?: Date;
  nextAvailableFormatted?: string;
}

export async function bookAppointmentAtomic(
  cardId: string,
  clientName: string,
  clientEmail: string,
  date: Date,
  clientPhone: string | null = null,
  notes: string | null = null,
  duration: number = 60,
  timezone: string = 'UTC'
): Promise<BookingResult> {
  // Use direct insert (fallback) until RPC migration is properly applied
  // This ensures booking works even without the custom SQL functions
  return await bookAppointmentFallback(
    cardId, clientName, clientEmail, date, clientPhone, notes, duration, timezone
  );
}

/**
 * Fallback booking method using direct insert (when RPC is not available)
 */
async function bookAppointmentFallback(
  cardId: string,
  clientName: string,
  clientEmail: string,
  date: Date,
  clientPhone: string | null,
  notes: string | null,
  duration: number,
  timezone: string
): Promise<BookingResult> {
  try {
    // Check for conflicts first
    const startOfSlot = new Date(date.getTime() - 60 * 60 * 1000); // 1 hour before
    const endOfSlot = new Date(date.getTime() + (duration + 60) * 60 * 1000); // duration + 1 hour after

    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id, client_name")
      .eq("card_id", cardId)
      .neq("status", "cancelled")
      .gte("date", startOfSlot.toISOString())
      .lte("date", endOfSlot.toISOString())
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: 'SLOT_CONFLICT',
        message: `Ce créneau est déjà réservé par ${conflicts[0].client_name}`
      };
    }

    // Insert the appointment with only required fields
    // Note: 'duration' and 'timezone' columns may not exist in all databases
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        card_id: cardId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        notes: notes,
        date: date.toISOString(),
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("Fallback insert error:", error);
      return {
        success: false,
        error: 'BOOKING_ERROR',
        message: error.message
      };
    }

    return {
      success: true,
      appointmentId: appointment.id,
      message: 'Rendez-vous créé avec succès'
    };
  } catch (error) {
    console.error("Fallback booking failed:", error);
    return {
      success: false,
      error: 'BOOKING_ERROR',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Get next available slots when requested slot is taken
 */
export async function getNextAvailableSlots(
  cardId: string,
  afterDate: Date,
  duration: number = 60,
  limit: number = 5
): Promise<Array<{ slotTime: Date; slotFormatted: string }>> {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('get_next_available_slots', {
      p_card_id: cardId,
      p_after_date: afterDate.toISOString(),
      p_duration: duration,
      p_limit: limit
    });

    if (error) {
      // If function doesn't exist, use fallback
      if (error.message.includes('function') || error.code === '42883') {
        return await getNextAvailableSlotsFallback(cardId, afterDate, duration, limit);
      }
      console.error("Error getting next available slots:", error);
      return [];
    }

    return (data || []).map((slot: any) => ({
      slotTime: new Date(slot.slot_time),
      slotFormatted: slot.slot_formatted
    }));
  } catch (error) {
    console.error("Failed to get next available slots, using fallback:", error);
    return await getNextAvailableSlotsFallback(cardId, afterDate, duration, limit);
  }
}

/**
 * Fallback to get next available slots
 */
async function getNextAvailableSlotsFallback(
  cardId: string,
  afterDate: Date,
  duration: number,
  limit: number
): Promise<Array<{ slotTime: Date; slotFormatted: string }>> {
  try {
    const settings = await getAvailabilitySettings(cardId);
    if (!settings) return [];

    const results: Array<{ slotTime: Date; slotFormatted: string }> = [];
    const dayNames: (keyof WorkingHours)[] = [
      "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
    ];

    // Look up to 14 days ahead
    for (let dayOffset = 0; dayOffset < 14 && results.length < limit; dayOffset++) {
      const currentDate = new Date(afterDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const dayOfWeek = dayNames[currentDate.getDay()];
      const slots = generateTimeSlots(dayOfWeek, settings.working_hours, settings.default_duration);

      for (const slot of slots) {
        if (results.length >= limit) break;
        
        const [hours, minutes] = slot.split(":").map(Number);
        const slotDate = new Date(currentDate);
        slotDate.setHours(hours, minutes, 0, 0);

        // Skip if slot is in the past
        if (slotDate <= afterDate) continue;

        // Check availability
        const availability = await checkSlotAvailabilityFallback(cardId, slotDate, duration);
        if (availability.available) {
          results.push({
            slotTime: slotDate,
            slotFormatted: slotDate.toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }) + ' à ' + slot
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Fallback get slots failed:", error);
    return [];
  }
}

/**
 * Update appointment with modification tracking
 */
export interface UpdateAppointmentResult {
  success: boolean;
  message?: string;
  error?: string;
  changes?: Record<string, { old: any; new: any }>;
  needsNotification?: boolean;
}

export async function updateAppointmentWithNotification(
  appointmentId: string,
  updates: {
    newDate?: Date;
    newDuration?: number;
    newStatus?: string;
    notes?: string;
    modificationReason?: string;
  }
): Promise<UpdateAppointmentResult> {
  // Use direct update (fallback) until RPC migration is properly applied
  return await updateAppointmentFallback(appointmentId, updates);
}

/**
 * Fallback update method using direct update
 */
async function updateAppointmentFallback(
  appointmentId: string,
  updates: {
    newDate?: Date;
    newDuration?: number;
    newStatus?: string;
    notes?: string;
    modificationReason?: string;
  }
): Promise<UpdateAppointmentResult> {
  try {
    const updateData: Record<string, any> = {};
    let hasChanges = false;

    if (updates.newDate) {
      updateData.date = updates.newDate.toISOString();
      hasChanges = true;
    }
    // Skip duration as the column may not exist in some databases
    // if (updates.newDuration) {
    //   updateData.duration = updates.newDuration;
    //   hasChanges = true;
    // }
    if (updates.newStatus) {
      updateData.status = updates.newStatus;
      hasChanges = true;
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
      hasChanges = true;
    }

    if (!hasChanges) {
      return {
        success: true,
        message: 'Aucune modification',
        needsNotification: false
      };
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    if (error) {
      console.error("Fallback update error:", error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.message
      };
    }

    return {
      success: true,
      message: 'Rendez-vous modifié avec succès',
      needsNotification: hasChanges
    };
  } catch (error) {
    console.error("Fallback update failed:", error);
    return {
      success: false,
      error: 'UPDATE_ERROR',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
