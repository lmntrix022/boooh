import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscriptionFeatures, useHasFeature, useHasWatermarking, useHasDRM } from '@/hooks/useSubscriptionFeatures';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useSubscriptionFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner null si cardId n\'est pas fourni', async () => {
    const { result } = renderHook(() => useSubscriptionFeatures());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features).toBeNull();
    expect(result.current.error).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('devrait retourner les fonctionnalités pour un plan FREE', async () => {
    const cardId = 'card-free';
    const mockCard = {
      subscription_plan: 'free',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features).toBeDefined();
    expect(result.current.features?.planType).toBe('free');
    expect(result.current.features?.hasEcommerce).toBe(false);
    expect(result.current.features?.digitalProducts).toBe(false);
    expect(result.current.features?.drmProtection).toBe(false);
    expect(result.current.features?.watermarking).toBe(false);
    expect(result.current.features?.maxCards).toBe(1);
  });

  it('devrait retourner les fonctionnalités pour un plan BUSINESS', async () => {
    const cardId = 'card-business';
    const mockCard = {
      subscription_plan: 'business',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features).toBeDefined();
    expect(result.current.features?.planType).toBe('business');
    expect(result.current.features?.hasEcommerce).toBe(true);
    expect(result.current.features?.digitalProducts).toBe(true);
    expect(result.current.features?.drmProtection).toBe(false);
    expect(result.current.features?.watermarking).toBe(false);
    expect(result.current.features?.hasPortfolio).toBe(true);
    expect(result.current.features?.hasStockManagement).toBe(true);
    expect(result.current.features?.maxProducts).toBe(20);
  });

  it('devrait retourner les fonctionnalités pour un plan MAGIC', async () => {
    const cardId = 'card-magic';
    const mockCard = {
      subscription_plan: 'magic',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features).toBeDefined();
    expect(result.current.features?.planType).toBe('magic');
    expect(result.current.features?.hasEcommerce).toBe(true);
    expect(result.current.features?.digitalProducts).toBe(true);
    expect(result.current.features?.drmProtection).toBe(true);
    expect(result.current.features?.watermarking).toBe(true);
    expect(result.current.features?.hasCRM).toBe(true);
    expect(result.current.features?.maxProducts).toBe(-1); // Illimité
    expect(result.current.features?.maxCards).toBe(5);
  });

  it('devrait retourner les fonctionnalités pour un plan PACK_CREATEUR', async () => {
    const cardId = 'card-pack';
    const mockCard = {
      subscription_plan: 'pack_createur',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features).toBeDefined();
    expect(result.current.features?.planType).toBe('pack_createur');
    expect(result.current.features?.drmProtection).toBe(true);
    expect(result.current.features?.watermarking).toBe(true);
  });

  it('devrait utiliser le plan FREE par défaut si subscription_plan est null', async () => {
    const cardId = 'card-null-plan';
    const mockCard = {
      subscription_plan: null,
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features?.planType).toBe('free');
  });

  it('devrait utiliser le plan FREE par défaut si le plan est inconnu', async () => {
    const cardId = 'card-unknown';
    const mockCard = {
      subscription_plan: 'unknown_plan',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.features?.planType).toBe('free');
  });

  it('devrait gérer les erreurs de récupération de la carte', async () => {
    const cardId = 'card-error';
    const errorMessage = 'Erreur base de données';

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      }),
    } as any);

    const { result } = renderHook(() => useSubscriptionFeatures(cardId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.features).toBeNull();
  });

  it('devrait recharger les fonctionnalités quand cardId change', async () => {
    const mockCard1 = { subscription_plan: 'free', user_id: 'user-123' };
    const mockCard2 = { subscription_plan: 'magic', user_id: 'user-123' };

    // Setup mock for first render
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call for card-1
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockCard1,
            error: null,
          }),
        } as any;
      } else {
        // Second call for card-2
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockCard2,
            error: null,
          }),
        } as any;
      }
    });

    const { result, rerender } = renderHook(
      ({ cardId }) => useSubscriptionFeatures(cardId),
      { initialProps: { cardId: 'card-1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.features?.planType).toBe('free');

    // Changer cardId
    rerender({ cardId: 'card-2' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features?.planType).toBe('magic');
    }, { timeout: 3000 });
  });
});

describe('useHasFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner true si la fonctionnalité est disponible', async () => {
    const cardId = 'card-business';
    const mockCard = {
      subscription_plan: 'business',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasFeature(cardId, 'hasEcommerce'));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('devrait retourner false si la fonctionnalité n\'est pas disponible', async () => {
    const cardId = 'card-free';
    const mockCard = {
      subscription_plan: 'free',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasFeature(cardId, 'hasEcommerce'));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('devrait retourner false si cardId n\'est pas fourni', () => {
    const { result } = renderHook(() => useHasFeature(undefined, 'hasEcommerce'));

    expect(result.current).toBe(false);
  });
});

describe('useHasWatermarking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner true pour un plan MAGIC', async () => {
    const cardId = 'card-magic';
    const mockCard = {
      subscription_plan: 'magic',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasWatermarking(cardId));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('devrait retourner false pour un plan BUSINESS', async () => {
    const cardId = 'card-business';
    const mockCard = {
      subscription_plan: 'business',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasWatermarking(cardId));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});

describe('useHasDRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner true pour un plan MAGIC', async () => {
    const cardId = 'card-magic';
    const mockCard = {
      subscription_plan: 'magic',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasDRM(cardId));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('devrait retourner false pour un plan BUSINESS', async () => {
    const cardId = 'card-business';
    const mockCard = {
      subscription_plan: 'business',
      user_id: 'user-123',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCard,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useHasDRM(cardId));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});


