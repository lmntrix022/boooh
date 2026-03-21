import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StripePaymentService, StripeCheckoutRequest } from '@/services/stripePaymentService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('StripePaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    const mockRequest: StripeCheckoutRequest = {
      amount: 1000,
      currency: 'EUR',
      order_id: 'order-123',
      order_type: 'digital',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+24106123456',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    };

    it('devrait créer une session Stripe Checkout avec succès', async () => {
      const mockResponse = {
        checkout_url: 'https://checkout.stripe.com/session-123',
        session_id: 'cs_test_123',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await StripePaymentService.createCheckoutSession(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('stripe-create-checkout', {
        body: mockRequest,
      });
    });

    it('devrait gérer les erreurs de création de session', async () => {
      const errorMessage = 'Erreur lors de la création de la session';

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      await expect(
        StripePaymentService.createCheckoutSession(mockRequest)
      ).rejects.toThrow(errorMessage);
    });

    it('devrait rejeter si la réponse est invalide (pas de checkout_url)', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { session_id: 'cs_test_123' }, // checkout_url manquant
        error: null,
      });

      await expect(
        StripePaymentService.createCheckoutSession(mockRequest)
      ).rejects.toThrow('Réponse invalide de la session Stripe');
    });

    it('devrait rejeter si la réponse est invalide (pas de session_id)', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { checkout_url: 'https://checkout.stripe.com/session-123' }, // session_id manquant
        error: null,
      });

      await expect(
        StripePaymentService.createCheckoutSession(mockRequest)
      ).rejects.toThrow('Réponse invalide de la session Stripe');
    });

    it('devrait créer une session pour un produit physique', async () => {
      const physicalRequest: StripeCheckoutRequest = {
        ...mockRequest,
        order_type: 'physical',
      };

      const mockResponse = {
        checkout_url: 'https://checkout.stripe.com/session-456',
        session_id: 'cs_test_456',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await StripePaymentService.createCheckoutSession(physicalRequest);

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('stripe-create-checkout', {
        body: physicalRequest,
      });
    });

    it('devrait créer une session sans téléphone client', async () => {
      const requestWithoutPhone: StripeCheckoutRequest = {
        ...mockRequest,
        customer_phone: undefined,
      };

      const mockResponse = {
        checkout_url: 'https://checkout.stripe.com/session-789',
        session_id: 'cs_test_789',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await StripePaymentService.createCheckoutSession(requestWithoutPhone);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkPaymentStatus', () => {
    it('devrait vérifier le statut d\'un paiement avec succès (paid)', async () => {
      const sessionId = 'cs_test_123';
      const mockStatus = {
        status: 'paid' as const,
        payment_intent_id: 'pi_123',
        customer_email: 'john@example.com',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await StripePaymentService.checkPaymentStatus(sessionId);

      expect(result).toEqual(mockStatus);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('stripe-check-status', {
        body: { session_id: sessionId },
      });
    });

    it('devrait vérifier le statut d\'un paiement en attente', async () => {
      const sessionId = 'cs_test_pending';
      const mockStatus = {
        status: 'pending' as const,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await StripePaymentService.checkPaymentStatus(sessionId);

      expect(result.status).toBe('pending');
      expect(result.payment_intent_id).toBeUndefined();
    });

    it('devrait vérifier le statut d\'un paiement non payé', async () => {
      const sessionId = 'cs_test_unpaid';
      const mockStatus = {
        status: 'unpaid' as const,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await StripePaymentService.checkPaymentStatus(sessionId);

      expect(result.status).toBe('unpaid');
    });

    it('devrait gérer les erreurs lors de la vérification du statut', async () => {
      const sessionId = 'cs_test_error';
      const errorMessage = 'Session introuvable';

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      await expect(
        StripePaymentService.checkPaymentStatus(sessionId)
      ).rejects.toThrow(errorMessage);
    });

    it('devrait gérer les erreurs sans message explicite', async () => {
      const sessionId = 'cs_test_no_message';

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(
        StripePaymentService.checkPaymentStatus(sessionId)
      ).rejects.toThrow('Erreur lors de la vérification du statut');
    });

    it('devrait vérifier le statut complet (complete)', async () => {
      const sessionId = 'cs_test_complete';
      const mockStatus = {
        status: 'complete' as const,
        payment_intent_id: 'pi_complete_123',
        customer_email: 'customer@example.com',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await StripePaymentService.checkPaymentStatus(sessionId);

      expect(result).toEqual(mockStatus);
      expect(result.status).toBe('complete');
    });
  });
});


