// Supabase Edge Function: send-appointment-reminders
// Purpose: Cron job to send appointment reminders (24h and 1h before)
// Schedule: Run every 15 minutes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const now = new Date();
    const results = {
      reminders_24h: 0,
      reminders_1h: 0,
      errors: [] as string[],
    };

    // Find appointments needing 24h reminder
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: appointments24h } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "confirmed")
      .eq("reminder_24h_sent", false)
      .gte("date", now.toISOString())
      .lte("date", in24Hours.toISOString());

    if (appointments24h && appointments24h.length > 0) {
      console.log(`Found ${appointments24h.length} appointments needing 24h reminder`);

      for (const appointment of appointments24h) {
        try {
          // Call email function
          const emailResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-appointment-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                type: "client_reminder_24h",
                appointmentId: appointment.id,
              }),
            }
          );

          if (emailResponse.ok) {
            results.reminders_24h++;
          } else {
            const error = await emailResponse.text();
            results.errors.push(`24h reminder failed for ${appointment.id}: ${error}`);
          }
        } catch (error) {
          results.errors.push(`24h reminder error for ${appointment.id}: ${error.message}`);
        }
      }
    }

    // Find appointments needing 1h reminder
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const { data: appointments1h } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "confirmed")
      .eq("reminder_1h_sent", false)
      .gte("date", now.toISOString())
      .lte("date", in1Hour.toISOString());

    if (appointments1h && appointments1h.length > 0) {
      console.log(`Found ${appointments1h.length} appointments needing 1h reminder`);

      for (const appointment of appointments1h) {
        try {
          // Call email function
          const emailResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-appointment-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                type: "client_reminder_1h",
                appointmentId: appointment.id,
              }),
            }
          );

          if (emailResponse.ok) {
            results.reminders_1h++;
          } else {
            const error = await emailResponse.text();
            results.errors.push(`1h reminder failed for ${appointment.id}: ${error}`);
          }
        } catch (error) {
          results.errors.push(`1h reminder error for ${appointment.id}: ${error.message}`);
        }
      }
    }

    console.log("Reminder job complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: now.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Fatal error in reminder job:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
