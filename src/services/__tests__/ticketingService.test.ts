/**
 * Unit tests for ticketingService.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createFreeTicket,
  purchaseTicket,
  validateTicketQR,
  checkInTicket,
} from '../ticketingService';
import { mockSupabaseClient } from '../../tests/mocks/supabase';
import { mockBoohPayService } from '../../tests/mocks/boohPayService';
import { mockTicket, mockTicketPurchaseData } from '../../tests/mocks/eventData';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/services/boohPayService', () => ({
  boohPayService: mockBoohPayService,
}));

describe('ticketingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFreeTicket', () => {
    it('should create free ticket successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedTicket = { ...mockTicket, price: 0, payment_status: 'completed' };

      // Mock event check
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'event-123',
                  is_public: true,
                  status: 'published',
                  is_free: true,
                  max_capacity: 100,
                  current_attendees: 25,
                },
                error: null,
              }),
            }),
          }),
        })
        // Mock ticket creation
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedTicket,
                error: null,
              }),
            }),
          }),
        });

      // Act
      const result = await createFreeTicket(mockTicketPurchaseData, userId);

      // Assert
      expect(result).toEqual(expectedTicket);
      expect(result.price).toBe(0);
      expect(result.payment_status).toBe('completed');
      expect(result.payment_method).toBe('free');
    });

    it('should throw error for paid event', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'event-123',
                is_public: true,
                status: 'published',
                is_free: false, // Not free
                max_capacity: 100,
                current_attendees: 25,
              },
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createFreeTicket(mockTicketPurchaseData)).rejects.toThrow('This event requires payment');
    });

    it('should throw error when event is at capacity', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'event-123',
                is_public: true,
                status: 'published',
                is_free: true,
                max_capacity: 50,
                current_attendees: 50, // At capacity
              },
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createFreeTicket(mockTicketPurchaseData)).rejects.toThrow('Event is at full capacity');
    });
  });

  describe('purchaseTicket', () => {
    it('should initiate paid ticket purchase', async () => {
      // Arrange
      const userId = 'user-123';
      const price = 50;
      const currency = 'EUR';
      const expectedPaymentUrl = 'https://boohpay.com/payment/123';

      const expectedResult = {
        ticket: { ...mockTicket },
        paymentUrl: expectedPaymentUrl,
      };

      // Mock event check
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'event-123',
                  is_public: true,
                  status: 'published',
                  is_free: false,
                  max_capacity: 100,
                  current_attendees: 25,
                },
                error: null,
              }),
            }),
          }),
        })
        // Mock BoohPay
        .mockReturnValueOnce({
          createPayment: vi.fn().mockResolvedValue({
            success: true,
            paymentUrl: expectedPaymentUrl,
            paymentId: 'payment-123',
          }),
        })
        // Mock ticket creation
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTicket,
                error: null,
              }),
            }),
          }),
        });

      mockBoohPayService.createPayment.mockResolvedValue({
        success: true,
        paymentUrl: expectedPaymentUrl,
        paymentId: 'payment-123',
      });

      // Act
      const result = await purchaseTicket(mockTicketPurchaseData, price, currency, userId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockBoohPayService.createPayment).toHaveBeenCalledWith({
        amount: price,
        currency,
        description: `Ticket for ${mockTicketPurchaseData.ticket_type}`,
        metadata: expect.objectContaining({
          ticket_id: expect.any(String),
          event_id: mockTicketPurchaseData.event_id,
        }),
      });
    });
  });

  describe('validateTicketQR', () => {
    it('should validate QR code successfully', async () => {
      // Arrange
      const qrCode = 'mock-qr-code-data';
      const expectedResult = {
        valid: true,
        ticket: mockTicket,
        event: null,
        message: 'Ticket validé avec succès',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTicket,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await validateTicketQR(qrCode);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.valid).toBe(true);
    });

    it('should return invalid for non-existent ticket', async () => {
      // Arrange
      const qrCode = 'invalid-qr-code';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Act
      const result = await validateTicketQR(qrCode);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Ticket introuvable');
    });

    it('should return invalid for already validated ticket', async () => {
      // Arrange
      const qrCode = 'already-validated-qr';
      const validatedTicket = { ...mockTicket, is_validated: true };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: validatedTicket,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await validateTicketQR(qrCode);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toContain('déjà validé');
    });
  });

  describe('checkInTicket', () => {
    it('should check in ticket successfully', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const validatedBy = 'organizer-123';
      const expectedTicket = { ...mockTicket, is_validated: true, validated_at: expect.any(String), validated_by: validatedBy };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedTicket,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await checkInTicket(ticketId, validatedBy);

      // Assert
      expect(result).toEqual(expectedTicket);
      expect(result.is_validated).toBe(true);
      expect(result.validated_by).toBe(validatedBy);
    });
  });
});