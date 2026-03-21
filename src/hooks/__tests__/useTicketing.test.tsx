/**
 * Unit tests for useTicketing hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTicketing } from '../useTicketing';
import {
  createFreeTicket,
  purchaseTicket,
  validateTicketQR,
  checkInTicket,
  cancelTicket,
} from '../../services/ticketingService';
import { mockTicket } from '../../tests/mocks/eventData';

// Mock dependencies
vi.mock('../../services/ticketingService');
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockCreateFreeTicket = vi.mocked(createFreeTicket);
const mockPurchaseTicket = vi.mocked(purchaseTicket);
const mockValidateTicketQR = vi.mocked(validateTicketQR);
const mockCheckInTicket = vi.mocked(checkInTicket);
const mockCancelTicket = vi.mocked(cancelTicket);

describe('useTicketing', () => {
  const defaultOptions = {
    eventId: 'event-123',
    userId: 'user-456',
    onPurchaseSuccess: vi.fn(),
    onValidationSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      // Act
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Assert
      expect(result.current.isPurchasing).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.isCancelling).toBe(false);
      expect(result.current.purchasedTicket).toBe(null);
      expect(result.current.validationResult).toBe(null);
    });

    it('should return all required functions', () => {
      // Act
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Assert
      expect(typeof result.current.purchaseFree).toBe('function');
      expect(typeof result.current.purchasePaid).toBe('function');
      expect(typeof result.current.purchaseMultiple).toBe('function');
      expect(typeof result.current.validateQR).toBe('function');
      expect(typeof result.current.checkIn).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('purchaseFree', () => {
    it('should purchase free ticket successfully', async () => {
      // Arrange
      mockCreateFreeTicket.mockResolvedValue(mockTicket);
      const purchaseData = {
        event_id: 'event-123',
        ticket_type: 'Free',
        attendee_name: 'John Doe',
        attendee_email: 'john@example.com',
      };
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseFree(purchaseData);
      });

      // Assert
      expect(mockCreateFreeTicket).toHaveBeenCalledWith(purchaseData, 'user-456');
      expect(purchaseResult).toEqual(mockTicket);
      expect(result.current.purchasedTicket).toEqual(mockTicket);
      expect(result.current.isPurchasing).toBe(false);
      expect(defaultOptions.onPurchaseSuccess).toHaveBeenCalledWith(mockTicket);
    });

    it('should handle purchase error', async () => {
      // Arrange
      const error = new Error('Purchase failed');
      mockCreateFreeTicket.mockRejectedValue(error);
      const purchaseData = {
        event_id: 'event-123',
        ticket_type: 'Free',
        attendee_name: 'John Doe',
        attendee_email: 'john@example.com',
      };
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act & Assert
      await expect(result.current.purchaseFree(purchaseData)).rejects.toThrow('Purchase failed');
      expect(result.current.isPurchasing).toBe(false);
    });
  });

  describe('purchasePaid', () => {
    it('should initiate paid ticket purchase', async () => {
      // Arrange
      const purchaseData = {
        event_id: 'event-123',
        ticket_type: 'VIP',
        attendee_name: 'Jane Doe',
        attendee_email: 'jane@example.com',
      };
      const price = 50;
      const currency = 'EUR';
      const expectedResult = {
        ticket: mockTicket,
        paymentUrl: 'https://boohpay.com/payment/123',
      };

      mockPurchaseTicket.mockResolvedValue(expectedResult);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchasePaid(purchaseData, price, currency);
      });

      // Assert
      expect(mockPurchaseTicket).toHaveBeenCalledWith(purchaseData, price, currency, 'user-456');
      expect(purchaseResult).toEqual(expectedResult);
      expect(result.current.isPurchasing).toBe(false);
    });
  });

  describe('validateQR', () => {
    it('should validate QR code successfully', async () => {
      // Arrange
      const qrCode = 'valid-qr-code';
      const validationResult = {
        valid: true,
        ticket: mockTicket,
        event: null,
        message: 'Ticket validé avec succès',
      };

      mockValidateTicketQR.mockResolvedValue(validationResult);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let validateResult;
      await act(async () => {
        validateResult = await result.current.validateQR(qrCode);
      });

      // Assert
      expect(mockValidateTicketQR).toHaveBeenCalledWith(qrCode);
      expect(validateResult).toEqual(validationResult);
      expect(result.current.validationResult).toEqual(validationResult);
      expect(result.current.isValidating).toBe(false);
      expect(defaultOptions.onValidationSuccess).toHaveBeenCalledWith(mockTicket);
    });

    it('should handle invalid QR code', async () => {
      // Arrange
      const qrCode = 'invalid-qr-code';
      const validationResult = {
        valid: false,
        ticket: null,
        event: null,
        message: 'Ticket introuvable',
      };

      mockValidateTicketQR.mockResolvedValue(validationResult);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let validateResult;
      await act(async () => {
        validateResult = await result.current.validateQR(qrCode);
      });

      // Assert
      expect(validateResult).toEqual(validationResult);
      expect(validateResult?.valid).toBe(false);
      expect(defaultOptions.onValidationSuccess).not.toHaveBeenCalled();
    });
  });

  describe('checkIn', () => {
    it('should check in ticket successfully', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const checkedInTicket = { ...mockTicket, is_validated: true };

      mockCheckInTicket.mockResolvedValue(checkedInTicket);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let checkInResult;
      await act(async () => {
        checkInResult = await result.current.checkIn(ticketId);
      });

      // Assert
      expect(mockCheckInTicket).toHaveBeenCalledWith(ticketId, undefined);
      expect(checkInResult).toEqual(checkedInTicket);
    });

    it('should check in ticket with validator', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const validatedBy = 'organizer-456';
      const checkedInTicket = { ...mockTicket, is_validated: true, validated_by: validatedBy };

      mockCheckInTicket.mockResolvedValue(checkedInTicket);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let checkInResult;
      await act(async () => {
        checkInResult = await result.current.checkIn(ticketId, validatedBy);
      });

      // Assert
      expect(mockCheckInTicket).toHaveBeenCalledWith(ticketId, validatedBy);
      expect(checkInResult?.validated_by).toBe(validatedBy);
    });
  });

  describe('cancel', () => {
    it('should cancel ticket successfully', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const cancelledTicket = { ...mockTicket, status: 'cancelled' };

      mockCancelTicket.mockResolvedValue(cancelledTicket);
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancel(ticketId);
      });

      // Assert
      expect(mockCancelTicket).toHaveBeenCalledWith(ticketId);
      expect(cancelResult?.status).toBe('cancelled');
      expect(result.current.isCancelling).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      // Arrange
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.purchasedTicket).toBe(null);
      expect(result.current.validationResult).toBe(null);
      expect(result.current.isPurchasing).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.isCancelling).toBe(false);
    });
  });

  describe('loading states', () => {
    it('should set loading states correctly', async () => {
      // Arrange
      mockCreateFreeTicket.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockTicket), 100)));
      const purchaseData = {
        event_id: 'event-123',
        ticket_type: 'Free',
        attendee_name: 'John Doe',
        attendee_email: 'john@example.com',
      };
      const { result } = renderHook(() => useTicketing(defaultOptions));

      // Act
      const purchasePromise = result.current.purchaseFree(purchaseData);

      // Assert loading state
      expect(result.current.isPurchasing).toBe(true);

      // Wait for completion
      await act(async () => {
        await purchasePromise;
      });

      expect(result.current.isPurchasing).toBe(false);
    });
  });
});