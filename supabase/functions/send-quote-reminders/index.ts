// Supabase Edge Function: send-quote-reminders
// Purpose: Cron job to send reminder emails for quotes not yet responded by client
// Schedule: Run daily (e.g. via Supabase cron or external scheduler)
// Rules: Devis with status 'quoted', sent 3+ days ago, not yet viewed or last_reminder_sent_at is null or 7+ days ago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results = { sent: 0, errors: [] as string[] };

    // Quotes: status = quoted, quote_sent_at or updated_at >= 3 days ago,
    // (viewed_at is null OR last_reminder_sent_at is null OR last_reminder_sent_at >= 7 days ago)
    const { data: quotes, error: fetchError } = await supabase
      .from("service_quotes")
      .select("id, client_email, client_name, service_requested, quote_amount, quote_sent_at, updated_at, viewed_at, last_reminder_sent_at, public_token")
      .eq("status", "quoted")
      .not("public_token", "is", null);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    for (const q of quotes || []) {
      const sentAt = q.quote_sent_at ? new Date(q.quote_sent_at) : new Date(q.updated_at);
      if (sentAt > threeDaysAgo) continue; // Trop récent

      const lastReminder = q.last_reminder_sent_at ? new Date(q.last_reminder_sent_at) : null;
      if (lastReminder && lastReminder > sevenDaysAgo) continue; // Relance envoyée récemment

      if (q.viewed_at) continue; // Client a déjà consulté

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-quote-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ type: "client_quote_reminder", quoteId: q.id }),
        });

        if (res.ok) {
          await supabase
            .from("service_quotes")
            .update({ last_reminder_sent_at: now.toISOString() })
            .eq("id", q.id);
          results.sent++;
        } else {
          const errText = await res.text();
          results.errors.push(`Quote ${q.id}: ${errText}`);
        }
      } catch (err) {
        results.errors.push(`Quote ${q.id}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: now.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("send-quote-reminders error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
