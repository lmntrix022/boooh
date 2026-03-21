/**
 * useTicketing Hook
 * Manages ticket purchase and validation workflow
 */

import { useState, useCallback } from 'react';
import {
  createFreeTicket,
  purchaseTicket,
  purchaseMultipleTickets,
  validateTicketQR,
  checkInTicket,
  cancelTicket,
  refundTicket,
  getTicketById,
} from '@/services/ticketingService';
import { trackTicketSale, trackTicketValidation } from '@/services/eventAnalyticsService';
import { useToast } from '@/hooks/use-toast';
import type {
  EventTicket,
  TicketPurchaseData,
  TicketValidationResult,
} from '@/types/events';

interface UseTicketingOptions {
  eventId?: string;
  userId?: string;
  onPurchaseSuccess?: (ticket: EventTicket) => void;
  onPurchaseError?: (error: Error) => void;
  onValidationSuccess?: (ticket: EventTicket) => void;
  onValidationError?: (error: Error) => void;
}

export function useTicketing(options: UseTicketingOptions = {}) {
  const {
    eventId,
    userId,
    onPurchaseSuccess,
    onPurchaseError,
    onValidationSuccess,
    onValidationError,
  } = options;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<EventTicket | null>(null);
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
  const { toast } = useToast();

  /**
   * Purchase free ticket
   */
  const purchaseFree = useCallback(
    async (purchaseData: TicketPurchaseData): Promise<EventTicket | null> => {
      setIsPurchasing(true);

      try {
        const ticket = await createFreeTicket(purchaseData, userId);

        setPurchasedTicket(ticket);

        // Track analytics
        await trackTicketSale(purchaseData.event_id, 0);

        onPurchaseSuccess?.(ticket);

        toast({
          title: 'Ticket Reserved',
          description: 'Your free ticket has been reserved successfully.',
        });

        return ticket;
      } catch (error) {
        console.error('Error purchasing free ticket:', error);
        const errorObj = error as Error;

        onPurchaseError?.(errorObj);

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to reserve ticket',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsPurchasing(false);
      }
    },
    [userId, onPurchaseSuccess, onPurchaseError, toast]
  );

  /**
   * Purchase paid ticket
   */
  const purchasePaid = useCallback(
    async (
      purchaseData: TicketPurchaseData,
      price: number,
      currency: string = 'EUR'
    ): Promise<{ ticket: EventTicket; paymentUrl?: string } | null> => {
      setIsPurchasing(true);

      try {
        const result = await purchaseTicket(purchaseData, price, currency, userId);

        setPurchasedTicket(result.ticket);

        // Don't track sale yet - will be tracked on payment confirmation
        onPurchaseSuccess?.(result.ticket);

        toast({
          title: 'Payment Initiated',
          description: 'Please complete the payment to confirm your ticket.',
        });

        return result;
      } catch (error) {
        console.error('Error purchasing paid ticket:', error);
        const errorObj = error as Error;

        onPurchaseError?.(errorObj);

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to purchase ticket',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsPurchasing(false);
      }
    },
    [userId, onPurchaseSuccess, onPurchaseError, toast]
  );

  /**
   * Purchase multiple tickets
   */
  const purchaseMultiple = useCallback(
    async (
      purchaseData: TicketPurchaseData,
      quantity: number,
      price: number,
      currency: string = 'EUR'
    ): Promise<{ tickets: EventTicket[]; paymentUrl?: string } | null> => {
      setIsPurchasing(true);

      try {
        const result = await purchaseMultipleTickets(
          purchaseData,
          quantity,
          price,
          currency,
          userId
        );

        if (result.tickets.length > 0) {
          setPurchasedTicket(result.tickets[0]);
        }

        toast({
          title: 'Payment Initiated',
          description: `Please complete the payment for ${quantity} tickets.`,
        });

        return result;
      } catch (error) {
        console.error('Error purchasing multiple tickets:', error);
        const errorObj = error as Error;

        onPurchaseError?.(errorObj);

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to purchase tickets',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsPurchasing(false);
      }
    },
    [userId, onPurchaseError, toast]
  );

  /**
   * Validate ticket QR code
   */
  const validateQR = useCallback(
    async (qrCodeString: string): Promise<TicketValidationResult | null> => {
      setIsValidating(true);

      try {
        const result = await validateTicketQR(qrCodeString);

        setValidationResult(result);

        if (result.valid) {
          onValidationSuccess?.(result.ticket!);

          toast({
            title: 'Valid Ticket',
            description: result.message,
          });
        } else {
          onValidationError?.(new Error(result.message));

          toast({
            title: 'Invalid Ticket',
            description: result.message,
            variant: 'destructive',
          });
        }

        return result;
      } catch (error) {
        console.error('Error validating ticket:', error);
        const errorObj = error as Error;

        const result: TicketValidationResult = {
          valid: false,
          message: errorObj.message || 'Error validating ticket',
        };

        setValidationResult(result);

        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });

        return result;
      } finally {
        setIsValidating(false);
      }
    },
    [onValidationSuccess, onValidationError, toast]
  );

  /**
   * Check-in ticket (mark as validated)
   */
  const checkIn = useCallback(
    async (ticketId: string): Promise<EventTicket | null> => {
      setIsValidating(true);

      try {
        const ticket = await checkInTicket(ticketId, userId);

        // Track analytics
        await trackTicketValidation(ticket.event_id);

        toast({
          title: 'Check-In Successful',
          description: 'Ticket has been validated.',
        });

        return ticket;
      } catch (error) {
        console.error('Error checking in ticket:', error);
        const errorObj = error as Error;

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to check-in ticket',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [userId, toast]
  );

  /**
   * Cancel ticket
   */
  const cancel = useCallback(
    async (ticketId: string): Promise<EventTicket | null> => {
      setIsCancelling(true);

      try {
        const ticket = await cancelTicket(ticketId);

        toast({
          title: 'Ticket Cancelled',
          description: 'Your ticket has been cancelled.',
        });

        return ticket;
      } catch (error) {
        console.error('Error cancelling ticket:', error);
        const errorObj = error as Error;

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to cancel ticket',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsCancelling(false);
      }
    },
    [toast]
  );

  /**
   * Refund ticket
   */
  const refund = useCallback(
    async (ticketId: string): Promise<EventTicket | null> => {
      setIsRefunding(true);

      try {
        const ticket = await refundTicket(ticketId);

        toast({
          title: 'Refund Processed',
          description: 'Your ticket has been refunded.',
        });

        return ticket;
      } catch (error) {
        console.error('Error refunding ticket:', error);
        const errorObj = error as Error;

        toast({
          title: 'Error',
          description: errorObj.message || 'Failed to refund ticket',
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsRefunding(false);
      }
    },
    [toast]
  );

  /**
   * Get ticket details
   */
  const getTicket = useCallback(
    async (ticketId: string): Promise<EventTicket | null> => {
      try {
        const ticket = await getTicketById(ticketId);
        return ticket;
      } catch (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setPurchasedTicket(null);
    setValidationResult(null);
    setIsPurchasing(false);
    setIsValidating(false);
    setIsCancelling(false);
    setIsRefunding(false);
  }, []);

  return {
    // State
    isPurchasing,
    isValidating,
    isCancelling,
    isRefunding,
    purchasedTicket,
    validationResult,

    // Actions
    purchaseFree,
    purchasePaid,
    purchaseMultiple,
    validateQR,
    checkIn,
    cancel,
    refund,
    getTicket,
    reset,
  };
}
