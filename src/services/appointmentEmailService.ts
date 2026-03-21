/**
 * Appointment Email Service
 * Handles all email notifications for appointments
 */

import { supabase } from "@/integrations/supabase/client";

export type EmailType =
  | "owner_new_booking"
  | "client_booking_confirmation"
  | "client_appointment_confirmed"
  | "client_appointment_cancelled"
  | "client_appointment_modified"
  | "client_reminder_24h"
  | "client_reminder_1h";

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send appointment email via Edge Function
 */
export async function sendAppointmentEmail(
  appointmentId: string,
  type: EmailType
): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-appointment-email", {
      body: {
        type,
        appointmentId,
      },
    });

    if (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: data?.success || false,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send new booking notification to card owner
 */
export async function notifyOwnerNewBooking(appointmentId: string): Promise<EmailResult> {
  return sendAppointmentEmail(appointmentId, "owner_new_booking");
}

/**
 * Send booking confirmation to client
 */
export async function notifyClientBookingConfirmation(
  appointmentId: string
): Promise<EmailResult> {
  return sendAppointmentEmail(appointmentId, "client_booking_confirmation");
}

/**
 * Send confirmation email when owner confirms appointment
 */
export async function notifyClientAppointmentConfirmed(
  appointmentId: string
): Promise<EmailResult> {
  return sendAppointmentEmail(appointmentId, "client_appointment_confirmed");
}

/**
 * Send cancellation email to client
 */
export async function notifyClientAppointmentCancelled(
  appointmentId: string
): Promise<EmailResult> {
  return sendAppointmentEmail(appointmentId, "client_appointment_cancelled");
}

/**
 * Send modification email to client
 */
export async function notifyClientAppointmentModified(
  appointmentId: string
): Promise<EmailResult> {
  return sendAppointmentEmail(appointmentId, "client_appointment_modified");
}

/**
 * Get email logs for an appointment
 */
export async function getAppointmentEmailLogs(appointmentId: string) {
  const { data, error } = await supabase
    .from("appointment_email_logs")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch email logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Bulk send emails for appointment creation
 * Sends both owner notification and client confirmation
 */
export async function sendNewAppointmentEmails(
  appointmentId: string
): Promise<{ owner: EmailResult; client: EmailResult }> {
  const [ownerResult, clientResult] = await Promise.all([
    notifyOwnerNewBooking(appointmentId),
    notifyClientBookingConfirmation(appointmentId),
  ]);

  return {
    owner: ownerResult,
    client: clientResult,
  };
}
