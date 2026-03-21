/**
 * Quote Email Service
 * Handles all email notifications for service quotes/devis
 */

import { supabase } from "@/integrations/supabase/client";

export type QuoteEmailType =
  | "owner_new_quote"
  | "client_quote_request"
  | "client_quote_response";

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send quote email via Edge Function
 */
export async function sendQuoteEmail(
  quoteId: string,
  type: QuoteEmailType
): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-quote-email", {
      body: {
        type,
        quoteId,
      },
    });

    if (error) {
      console.error("Quote email service error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: data?.success || false,
    };
  } catch (error) {
    console.error("Failed to send quote email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send new quote request notification to owner
 */
export async function notifyOwnerNewQuote(quoteId: string): Promise<EmailResult> {
  return sendQuoteEmail(quoteId, "owner_new_quote");
}

/**
 * Send quote request confirmation to client
 */
export async function notifyClientQuoteRequest(quoteId: string): Promise<EmailResult> {
  return sendQuoteEmail(quoteId, "client_quote_request");
}

/**
 * Send quote response to client
 */
export async function notifyClientQuoteResponse(quoteId: string): Promise<EmailResult> {
  return sendQuoteEmail(quoteId, "client_quote_response");
}

/**
 * Bulk send emails for new quote request
 * Sends both owner notification and client confirmation
 */
export async function sendNewQuoteEmails(
  quoteId: string
): Promise<{ owner: EmailResult; client: EmailResult }> {
  const [ownerResult, clientResult] = await Promise.allSettled([
    notifyOwnerNewQuote(quoteId),
    notifyClientQuoteRequest(quoteId),
  ]);

  return {
    owner: ownerResult.status === 'fulfilled' ? ownerResult.value : { success: false, error: 'Failed' },
    client: clientResult.status === 'fulfilled' ? clientResult.value : { success: false, error: 'Failed' },
  };
}

