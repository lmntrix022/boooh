/**
 * BOOH Events - Ticketing Service
 * Handles ticket purchase, QR code generation, validation
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  EventTicket,
  TicketPurchaseData,
  QRCodeData,
  TicketValidationResult,
  EventAttendee,
} from '@/types/events';
import { boohPayService } from './boohPayService';
import QRCode from 'qrcode';

// =====================================================
// TICKET GENERATION
// =====================================================

/**
 * Generate unique ticket number
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BOOH-${timestamp}-${randomStr}`;
}

/**
 * Generate QR code data
 */
function generateQRCodeData(
  ticketId: string,
  eventId: string,
  email: string
): string {
  const qrData: QRCodeData = {
    ticket_id: ticketId,
    event_id: eventId,
    attendee_email: email,
    validation_token: generateValidationToken(ticketId, email),
  };

  return JSON.stringify(qrData);
}

/**
 * Generate validation token
 */
function generateValidationToken(ticketId: string, email: string): string {
  // Simple hash for validation (in production, use crypto)
  // Using import.meta.env for Vite (not process.env)
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const data = `${ticketId}:${email}:${supabaseAnonKey}`;
  return btoa(data);
}

/**
 * Verify validation token
 */
function verifyValidationToken(
  ticketId: string,
  email: string,
  token: string
): boolean {
  const expectedToken = generateValidationToken(ticketId, email);
  return token === expectedToken;
}

// =====================================================
// TICKET PURCHASE
// =====================================================

/**
 * Create free ticket (no payment required)
 */
export async function createFreeTicket(
  purchaseData: TicketPurchaseData,
  userId?: string
): Promise<EventTicket> {
  try {
    // First, verify the event exists and is accessible
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, start_date, end_date, location_name, location_address, is_public, status, is_free, max_capacity, current_attendees, tickets_config')
      .eq('id', purchaseData.event_id)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found or not accessible');
    }

    // Verify event is public and published
    if (!event.is_public || event.status !== 'published') {
      throw new Error('Event is not available for ticket purchase');
    }

    // Verify ticket is free (either event is free or specific tier is free)
    let isTicketFree = event.is_free;

    if (!isTicketFree && event.tickets_config) {
      const tiers = Array.isArray(event.tickets_config) ? event.tickets_config : [];
      const tier = tiers.find((t: any) => t.name === purchaseData.ticket_type);
      if (tier && tier.price === 0) {
        isTicketFree = true;
      }
    }

    if (!isTicketFree) {
      throw new Error('This event requires payment');
    }

    // Check capacity if applicable
    if (event.max_capacity && (event.current_attendees || 0) >= event.max_capacity) {
      throw new Error('Event is at full capacity');
    }

    // Generate ticket number and QR code
    const ticketNumber = generateTicketNumber();
    const tempTicketId = crypto.randomUUID();
    const qrCode = generateQRCodeData(
      tempTicketId,
      purchaseData.event_id,
      purchaseData.attendee_email
    );

    // Create ticket - Explicitly set user_id to null if not provided (for public access)
    // This ensures RLS policies work correctly
    const ticketData: any = {
      event_id: purchaseData.event_id,
      ticket_type: purchaseData.ticket_type,
      ticket_number: ticketNumber,
      qr_code: qrCode,
      attendee_name: purchaseData.attendee_name,
      attendee_email: purchaseData.attendee_email,
      attendee_phone: purchaseData.attendee_phone || null,
      price: 0,
      currency: 'EUR',
      payment_status: 'completed',
      payment_method: 'free',
      status: 'active',
    };

    // Only set user_id if provided (authenticated user)
    if (userId) {
      ticketData.user_id = userId;
    } else {
      // Explicitly set to null for unauthenticated users
      ticketData.user_id = null;
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      // Provide more specific error message
      if (ticketError.code === '42501') {
        throw new Error('Permission denied: Unable to create ticket. Please ensure the event is public and allows free tickets.');
      }
      throw ticketError;
    }

    if (!ticket) {
      throw new Error('Failed to create ticket - no data returned');
    }

    // Create attendee record
    await createAttendeeRecord(ticket);

    // Send ticket email
    await sendTicketEmail(ticket, event);

    return ticket;
  } catch (error: any) {
    console.error('Error creating free ticket:', error);
    // Re-throw with original message if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create free ticket');
  }
}

/**
 * Purchase paid ticket (with BoohPay integration)
 */
export async function purchaseTicket(
  purchaseData: TicketPurchaseData,
  price: number,
  currency: string = 'EUR',
  userId?: string
): Promise<{ ticket: EventTicket; paymentUrl?: string }> {
  try {
    // Generate ticket number and QR code
    const ticketNumber = generateTicketNumber();
    const tempTicketId = crypto.randomUUID();
    const qrCode = generateQRCodeData(
      tempTicketId,
      purchaseData.event_id,
      purchaseData.attendee_email
    );

    // Create ticket with pending payment
    const { data: ticket, error: ticketError } = await supabase
      .from('event_tickets')
      .insert({
        event_id: purchaseData.event_id,
        user_id: userId,
        ticket_type: purchaseData.ticket_type,
        ticket_number: ticketNumber,
        qr_code: qrCode,
        attendee_name: purchaseData.attendee_name,
        attendee_email: purchaseData.attendee_email,
        attendee_phone: purchaseData.attendee_phone,
        price: price,
        currency: currency,
        payment_status: 'pending',
        status: 'active',
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Fetch Event Owner to get their Merchant API Key
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', purchaseData.event_id)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Get Organizer's API Key using secure RPC function (bypasses RLS)
    const { data: organizerApiKey, error: apiKeyError } = await supabase
      .rpc('get_payment_api_key', {
        organizer_user_id: event.user_id
      });

    if (apiKeyError) {
      console.error('Error fetching payment key:', apiKeyError);
      // Fallback or error handling
    }

    // Initiate payment with BoohPay
    try {
      const paymentResult = await boohPayService.initiatePayment({
        amount: price,
        currency: currency,
        description: `Ticket ${purchaseData.ticket_type} - Event`,
        customerEmail: purchaseData.attendee_email,
        customerName: purchaseData.attendee_name,
        customerPhone: purchaseData.attendee_phone,
        metadata: {
          ticket_id: ticket.id,
          event_id: purchaseData.event_id,
          type: 'event_ticket',
        },
      }, organizerApiKey || undefined); // Pass organizer's key override

      // Update ticket with payment ID
      await supabase
        .from('event_tickets')
        .update({ payment_id: paymentResult.transactionId })
        .eq('id', ticket.id);

      return {
        ticket,
        paymentUrl: paymentResult.paymentUrl,
      };
    } catch (paymentError) {
      // If payment initiation fails, mark ticket as failed
      await supabase
        .from('event_tickets')
        .update({ payment_status: 'failed' })
        .eq('id', ticket.id);

      throw paymentError;
    }
  } catch (error) {
    console.error('Error purchasing ticket:', error);
    throw new Error('Failed to purchase ticket');
  }
}

/**
 * Confirm ticket payment (webhook callback)
 */
export async function confirmTicketPayment(
  ticketId: string,
  paymentId: string,
  paymentMethod: string
): Promise<EventTicket> {
  try {
    const { data: ticket, error } = await supabase
      .from('event_tickets')
      .update({
        payment_status: 'completed',
        payment_id: paymentId,
        payment_method: paymentMethod,
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    // Create attendee record after successful payment
    await createAttendeeRecord(ticket);

    // Fetch event details for email
    const { data: event } = await supabase
      .from('events')
      .select('title, start_date, end_date, location_name, location_address')
      .eq('id', ticket.event_id)
      .single();

    if (event) {
      // Send ticket email
      await sendTicketEmail(ticket, event);
    }

    return ticket;
  } catch (error) {
    console.error('Error confirming ticket payment:', error);
    throw new Error('Failed to confirm ticket payment');
  }
}

/**
 * Create attendee record
 */
async function createAttendeeRecord(ticket: EventTicket): Promise<void> {
  try {
    await supabase.from('event_attendees').insert({
      event_id: ticket.event_id,
      user_id: ticket.user_id || null, // Allow null for public free tickets
      ticket_id: ticket.id,
      name: ticket.attendee_name,
      email: ticket.attendee_email,
      phone: ticket.attendee_phone,
      attendance_status: 'registered',
    });
  } catch (error) {
    console.error('Error creating attendee record:', error);
    // Don't throw - attendee creation failure shouldn't block ticket purchase
  }
}

// =====================================================
// TICKET MANAGEMENT
// =====================================================

/**
 * Get ticket by ID
 */
export async function getTicketById(
  ticketId: string
): Promise<EventTicket | null> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
}

/**
 * Get ticket by QR code
 */
export async function getTicketByQRCode(
  qrCode: string
): Promise<EventTicket | null> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching ticket by QR code:', error);
    return null;
  }
}

/**
 * Get user's tickets
 */
export async function getUserTickets(userId: string): Promise<EventTicket[]> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
}

/**
 * Get tickets by email (for non-registered users)
 */
export async function getTicketsByEmail(
  email: string
): Promise<EventTicket[]> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*, events(*)')
      .eq('attendee_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tickets by email:', error);
    return [];
  }
}

/**
 * Get event tickets
 */
export async function getEventTickets(
  eventId: string
): Promise<EventTicket[]> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    return [];
  }
}

/**
 * Cancel ticket
 */
export async function cancelTicket(ticketId: string): Promise<EventTicket> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .update({ status: 'cancelled' })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    // Update attendee status
    await supabase
      .from('event_attendees')
      .update({ attendance_status: 'cancelled' })
      .eq('ticket_id', ticketId);

    return data;
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw new Error('Failed to cancel ticket');
  }
}

// =====================================================
// TICKET VALIDATION
// =====================================================

/**
 * Validate ticket QR code
 */
export async function validateTicketQR(
  qrCodeString: string
): Promise<TicketValidationResult> {
  try {
    // Parse QR code data
    let qrData: QRCodeData;
    try {
      qrData = JSON.parse(qrCodeString);
    } catch {
      return {
        valid: false,
        message: 'Invalid QR code format',
      };
    }

    // Verify validation token
    if (
      !verifyValidationToken(
        qrData.ticket_id,
        qrData.attendee_email,
        qrData.validation_token
      )
    ) {
      return {
        valid: false,
        message: 'Invalid validation token',
      };
    }

    // Get ticket
    const ticket = await getTicketById(qrData.ticket_id);
    if (!ticket) {
      return {
        valid: false,
        message: 'Ticket not found',
      };
    }

    // Check ticket status
    if (ticket.status !== 'active') {
      return {
        valid: false,
        ticket,
        message: `Ticket is ${ticket.status}`,
      };
    }

    // Check payment status
    if (ticket.payment_status !== 'completed') {
      return {
        valid: false,
        ticket,
        message: 'Ticket payment not completed',
      };
    }

    // Check if already validated
    if (ticket.is_validated) {
      return {
        valid: false,
        ticket,
        message: `Ticket already validated on ${new Date(
          ticket.validated_at!
        ).toLocaleString()}`,
      };
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', ticket.event_id)
      .single();

    if (eventError || !event) {
      return {
        valid: false,
        ticket,
        message: 'Event not found',
      };
    }

    return {
      valid: true,
      ticket,
      event,
      message: 'Ticket is valid',
    };
  } catch (error) {
    console.error('Error validating ticket:', error);
    return {
      valid: false,
      message: 'Error validating ticket',
    };
  }
}

/**
 * Mark ticket as validated (check-in)
 */
export async function checkInTicket(
  ticketId: string,
  validatedBy?: string
): Promise<EventTicket> {
  try {
    const { data: ticket, error } = await supabase
      .from('event_tickets')
      .update({
        is_validated: true,
        validated_at: new Date().toISOString(),
        validated_by: validatedBy,
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    // Update attendee check-in status
    await supabase
      .from('event_attendees')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        attendance_status: 'attended',
      })
      .eq('ticket_id', ticketId);

    return ticket;
  } catch (error) {
    console.error('Error checking in ticket:', error);
    throw new Error('Failed to check in ticket');
  }
}

// =====================================================
// REFUNDS
// =====================================================

/**
 * Request ticket refund
 */
export async function refundTicket(ticketId: string): Promise<EventTicket> {
  try {
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check if ticket is refundable
    if (ticket.payment_status !== 'completed') {
      throw new Error('Only paid tickets can be refunded');
    }

    if (ticket.is_validated) {
      throw new Error('Cannot refund validated ticket');
    }

    // Process refund via BoohPay if payment was made
    if (ticket.payment_id && ticket.price > 0) {
      try {
        await boohPayService.refundPayment(ticket.payment_id);
      } catch (error) {
        console.error('BoohPay refund failed:', error);
        // Continue with ticket cancellation even if refund fails
      }
    }

    // Update ticket status
    const { data, error } = await supabase
      .from('event_tickets')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    // Update attendee status
    await supabase
      .from('event_attendees')
      .update({ attendance_status: 'cancelled' })
      .eq('ticket_id', ticketId);

    return data;
  } catch (error) {
    console.error('Error refunding ticket:', error);
    throw new Error('Failed to refund ticket');
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * Purchase multiple tickets at once
 */
export async function purchaseMultipleTickets(
  purchaseData: TicketPurchaseData,
  quantity: number,
  price: number,
  currency: string = 'EUR',
  userId?: string
): Promise<{ tickets: EventTicket[]; paymentUrl?: string }> {
  try {
    const tickets: EventTicket[] = [];
    const totalAmount = price * quantity;

    // Create all tickets first
    for (let i = 0; i < quantity; i++) {
      const ticketNumber = generateTicketNumber();
      const tempTicketId = crypto.randomUUID();
      const qrCode = generateQRCodeData(
        tempTicketId,
        purchaseData.event_id,
        purchaseData.attendee_email
      );

      const { data: ticket, error } = await supabase
        .from('event_tickets')
        .insert({
          event_id: purchaseData.event_id,
          user_id: userId,
          ticket_type: purchaseData.ticket_type,
          ticket_number: ticketNumber,
          qr_code: qrCode,
          attendee_name: `${purchaseData.attendee_name} (${i + 1}/${quantity})`,
          attendee_email: purchaseData.attendee_email,
          attendee_phone: purchaseData.attendee_phone,
          price: price,
          currency: currency,
          payment_status: 'pending',
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      tickets.push(ticket);
    }

    // Initiate single payment for all tickets
    const paymentResult = await boohPayService.initiatePayment({
      amount: totalAmount,
      currency: currency,
      description: `${quantity} Tickets ${purchaseData.ticket_type}`,
      customerEmail: purchaseData.attendee_email,
      customerName: purchaseData.attendee_name,
      customerPhone: purchaseData.attendee_phone,
      metadata: {
        ticket_ids: tickets.map((t) => t.id),
        event_id: purchaseData.event_id,
        quantity: quantity,
        type: 'event_tickets_bulk',
      },
    });

    // Update all tickets with payment ID
    await supabase
      .from('event_tickets')
      .update({ payment_id: paymentResult.transactionId })
      .in(
        'id',
        tickets.map((t) => t.id)
      );

    return {
      tickets,
      paymentUrl: paymentResult.paymentUrl,
    };
  } catch (error) {
    console.error('Error purchasing multiple tickets:', error);
    throw new Error('Failed to purchase multiple tickets');
  }
}

// =====================================================
// ANALYTICS & REPORTING
// =====================================================

/**
 * Get ticket sales summary for event
 */
export async function getTicketSalesSummary(eventId: string) {
  try {
    const { data: tickets, error } = await supabase
      .from('event_tickets')
      .select('ticket_type, price, payment_status, status')
      .eq('event_id', eventId);

    if (error) throw error;

    const summary = {
      total_tickets: tickets.length,
      sold_tickets: tickets.filter((t) => t.payment_status === 'completed')
        .length,
      pending_tickets: tickets.filter((t) => t.payment_status === 'pending')
        .length,
      refunded_tickets: tickets.filter((t) => t.payment_status === 'refunded')
        .length,
      total_revenue: tickets
        .filter((t) => t.payment_status === 'completed')
        .reduce((sum, t) => sum + (t.price || 0), 0),
      by_type: {} as Record<string, any>,
    };

    // Group by ticket type
    tickets.forEach((ticket) => {
      if (!summary.by_type[ticket.ticket_type]) {
        summary.by_type[ticket.ticket_type] = {
          count: 0,
          sold: 0,
          revenue: 0,
        };
      }
      summary.by_type[ticket.ticket_type].count++;
      if (ticket.payment_status === 'completed') {
        summary.by_type[ticket.ticket_type].sold++;
        summary.by_type[ticket.ticket_type].revenue += ticket.price || 0;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting ticket sales summary:', error);
    throw new Error('Failed to get ticket sales summary');
  }
}

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

/**
 * Send ticket email
 */
async function sendTicketEmail(ticket: EventTicket, event: any): Promise<void> {
  try {
    // Generate QR code URL using QuickChart API (reliable for emails)
    // ticket.qr_code is already a JSON string, so we just encode it
    const qrDataEncoded = encodeURIComponent(ticket.qr_code);
    const qrImageUrl = `https://quickchart.io/qr?text=${qrDataEncoded}&size=400&ecLevel=H&margin=1&dark=111827&light=ffffff`;

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: ticket.attendee_email,
        subject: `🎟️ Votre billet pour ${event.title}`,
        message: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header Event -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${event.title}</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
                ${new Date(event.start_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style="padding: 30px;">
              <!-- Ticket Info Grid -->
              <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
                
                <!-- Location -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Lieu</p>
                  <p style="margin: 5px 0 0 0; font-size: 16px; color: #111827; font-weight: 500;">
                    ${event.location_name || 'En ligne'}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 14px; color: #6b7280;">
                    ${event.location_address || ''}
                  </p>
                </div>

                <!-- Time -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Heure</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; color: #4f46e5; font-weight: 700;">
                    ${new Date(event.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <!-- Ticket Details Box -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border: 1px dashed #d1d5db; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type de billet</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${ticket.ticket_type}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Numéro</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-family: monospace;">${ticket.ticket_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Prix</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">
                      ${ticket.price > 0 ? `${ticket.price} ${ticket.currency}` : 'Gratuit'}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- QR Code Section -->
              <div style="text-align: center;">
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">Présentez ce QR Code à l'entrée</p>
                <div style="display: inline-block; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6;">
                  <img src="${qrImageUrl}" alt="QR Code" width="200" height="200" style="display: block; width: 200px; height: 200px;" />
                </div>
                <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">ID: ${ticket.id.substring(0, 8)}...</p>
              </div>
            </div>

            <!-- Footer Action -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #4b5563;">
                Vous pouvez aussi retrouver ce billet sur <a href="https://booh.ga" style="color: #4f46e5; text-decoration: none; font-weight: 600;">l'application Bööh</a>
              </p>
            </div>
          </div>
        `,
        type: 'crm',
        contact_name: ticket.attendee_name,
      },
    });

    if (error) {
      console.error('Error sending ticket email:', error);
    } else {
      console.log('Ticket email sent successfully');
    }
  } catch (error) {
    console.error('Failed to invoke send-email:', error);
  }
}
