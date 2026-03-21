/**
 * Order Email Service
 * Handles all email notifications for orders (physical & digital products)
 */

import { supabase } from "@/integrations/supabase/client";

export type OrderEmailType =
  | "owner_new_order"
  | "client_order_confirmation"
  | "client_digital_download";

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send order email via Edge Function
 */
export async function sendOrderEmail(
  inquiryId: string,
  inquiryType: 'physical' | 'digital',
  type: OrderEmailType
): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: {
        type,
        inquiryId,
        inquiryType,
      },
    });

    if (error) {
      console.error("Order email service error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: data?.success || false,
    };
  } catch (error) {
    console.error("Failed to send order email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send new order notification to card owner
 */
export async function notifyOwnerNewOrder(
  inquiryId: string,
  inquiryType: 'physical' | 'digital'
): Promise<EmailResult> {
  return sendOrderEmail(inquiryId, inquiryType, "owner_new_order");
}

/**
 * Send order confirmation to client
 */
export async function notifyClientOrderConfirmation(
  inquiryId: string,
  inquiryType: 'physical' | 'digital'
): Promise<EmailResult> {
  return sendOrderEmail(inquiryId, inquiryType, "client_order_confirmation");
}

/**
 * Send download link to client (digital products only)
 */
export async function notifyClientDigitalDownload(
  inquiryId: string
): Promise<EmailResult> {
  return sendOrderEmail(inquiryId, 'digital', "client_digital_download");
}

/**
 * Bulk send all order emails
 * Sends owner notification, client confirmation, and download link (if digital)
 */
export async function sendNewOrderEmails(
  inquiryId: string,
  inquiryType: 'physical' | 'digital'
): Promise<{ owner: EmailResult; client: EmailResult; download?: EmailResult }> {
  const [ownerResult, clientResult, downloadResult] = await Promise.allSettled([
    notifyOwnerNewOrder(inquiryId, inquiryType),
    notifyClientOrderConfirmation(inquiryId, inquiryType),
    inquiryType === 'digital' ? notifyClientDigitalDownload(inquiryId) : Promise.resolve({ success: true }),
  ]);

  return {
    owner: ownerResult.status === 'fulfilled' ? ownerResult.value : { success: false, error: 'Failed' },
    client: clientResult.status === 'fulfilled' ? clientResult.value : { success: false, error: 'Failed' },
    download: inquiryType === 'digital' && downloadResult.status === 'fulfilled' 
      ? downloadResult.value 
      : undefined,
  };
}

