/**
 * Tests unitaires pour useSubscription hook
 *
 * Teste la gestion des abonnements utilisateur:
 * - Récupération abonnement actif
 * - Vérification des features par plan
 * - Gestion des addons
 * - Validation des limites
 * - Plan FREE par défaut
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlanType } from '@/types/subscription';
import { PlansService } from '@/services/plansService';
import { AddonsService } from '@/services/addonsService';
import type { ReactNode } from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Services
vi.mock('@/services/plansService', () => ({
  PlansService: {
    getPlans: vi.fn().mockResolvedValue([]), // Retourne un tableau vide par défaut (utilise hardcoded)
  },
}));

vi.mock('@/services/addonsService', () => ({
  AddonsService: {
    getUserActiveAddons: vi.fn().mockResolvedValue([]), // Retourne un tableau vide par défaut
    applyAddonsToFeatures: vi.fn((features) => features), // Mock simple qui retourne les features telles quelles
  },
}));

describe('useSubscription', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  // Wrapper pour React Query
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0, // Pas de cache
          refetchOnMount: true,
          refetchOnWindowFocus: false,
        },
      },
    });
    vi.clearAllMocks();
    queryClient.clear(); // Nettoyer le cache entre les tests
    
    // S'assurer que les mocks retournent toujours des valeurs valides
    vi.mocked(PlansService.getPlans).mockResolvedValue([]);
    vi.mocked(AddonsService.getUserActiveAddons).mockResolvedValue([]);
    vi.mocked(AddonsService.applyAddonsToFeatures).mockImplementation((features) => features);
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe('Plan FREE par défaut', () => {
    it('devrait retourner plan FREE si aucun abonnement', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.planType).toBe(PlanType.FREE);
      expect(result.current.subscription).toBeDefined();
      expect(result.current.subscription?.plan_type).toBe(PlanType.FREE);
    });

    it('devrait avoir les features FREE correctes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.features).toBeDefined();
      expect(result.current.features.maxCards).toBeGreaterThan(0);
    });
  });

  describe('Abonnement actif', () => {
    it('devrait récupérer un abonnement BASIC actif', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUser.id,
        plan_type: PlanType.BASIC,
        status: 'active',
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-02-01T00:00:00Z',
        auto_renew: true,
        addons: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      } as any);

      // Créer un mock stable qui sera réutilisé pour tous les appels
      const createSubscriptionChain = () => {
        const maybeSingle = vi.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        });
        
        const eq2 = vi.fn().mockReturnValue({
          maybeSingle,
        });
        
        const eq1 = vi.fn().mockReturnValue({
          eq: eq2,
        });
        
        const select = vi.fn().mockReturnValue({
          eq: eq1,
        });
        
        return { select, eq1, eq2, maybeSingle };
      };

      const subscriptionChain = createSubscriptionChain();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_subscriptions') {
          return {
            select: subscriptionChain.select,
          } as any;
        }
        // Pour les autres tables
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Attendre que le hook charge les données
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Vérifier que la subscription est bien chargée avec les bonnes données
      await waitFor(() => {
        expect(result.current.subscription).toBeDefined();
        expect(result.current.subscription?.plan_type).toBe(PlanType.BASIC);
        expect(result.current.planType).toBe(PlanType.BASIC);
      }, { timeout: 10000 });
    }, { timeout: 15000 });

    it('devrait récupérer un abonnement PRO actif', async () => {
      const mockSubscription = {
        id: 'sub-456',
        user_id: mockUser.id,
        plan_type: PlanType.PRO,
        status: 'active',
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-02-01T00:00:00Z',
        auto_renew: true,
        addons: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      } as any);

      // Créer un mock stable qui sera réutilisé pour tous les appels
      const createSubscriptionChain = () => {
        const maybeSingle = vi.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        });
        
        const eq2 = vi.fn().mockReturnValue({
          maybeSingle,
        });
        
        const eq1 = vi.fn().mockReturnValue({
          eq: eq2,
        });
        
        const select = vi.fn().mockReturnValue({
          eq: eq1,
        });
        
        return { select, eq1, eq2, maybeSingle };
      };

      const subscriptionChain = createSubscriptionChain();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_subscriptions') {
          return {
            select: subscriptionChain.select,
          } as any;
        }
        // Pour les autres tables
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Attendre que le planType soit mis à jour avec les données de l'abonnement
      await waitFor(() => {
        expect(result.current.subscription).toBeDefined();
        expect(result.current.subscription?.plan_type).toBe(PlanType.PRO);
        expect(result.current.planType).toBe(PlanType.PRO);
      }, { timeout: 10000 });
    }, { timeout: 15000 });
  });

  describe('Gestion utilisateur non connecté', () => {
    it('devrait retourner null si pas d\'utilisateur', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as any);

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      // Si pas d'utilisateur, la query est désactivée (enabled: !!user?.id)
      // Donc subscription peut être undefined ou null selon React Query
      expect(result.current.subscription).toBeFalsy(); // null ou undefined
      expect(result.current.planType).toBe(PlanType.FREE);
    });

    it('ne devrait pas faire de requête si pas d\'utilisateur', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as any);

      const selectMock = vi.fn();
      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        // Les requêtes sont désactivées si pas d'utilisateur (enabled: !!user?.id)
      }, { timeout: 1000 });

      // Le hook ne devrait pas appeler supabase.from car user est null (query disabled)
      expect(selectMock).not.toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de base de données', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
      } as any);

      const dbError = new Error('Database connection failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: dbError,
              }),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.subscription).toBeUndefined();
    });
  });

  describe('Refetch', () => {
    it('devrait pouvoir recharger l\'abonnement', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUser.id,
        plan_type: PlanType.BASIC,
        status: 'active',
        start_date: '2025-01-01T00:00:00Z',
        end_date: null,
        auto_renew: true,
        addons: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
      } as any);

      // Premier appel retourne null, le refetch retourne l'abonnement
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockSubscription,
          error: null,
        });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: maybeSingleMock,
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      // Attendre le chargement initial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Vérifier que c'est FREE initialement
      await waitFor(() => {
        expect(result.current.planType).toBe(PlanType.FREE);
      }, { timeout: 3000 });

      // Refetch - result.current.refetch est une fonction directement
      if (typeof result.current.refetch === 'function') {
        await result.current.refetch();
      }

      // Attendre que le refetch mette à jour les données avec le nouvel abonnement BASIC
      await waitFor(() => {
        expect(result.current.subscription).toBeDefined();
        expect(result.current.subscription?.plan_type).toBe(PlanType.BASIC);
        expect(result.current.planType).toBe(PlanType.BASIC);
      }, { timeout: 8000 });
    }, { timeout: 20000 });
  });

  describe('Cache & Performance', () => {
    it('devrait utiliser staleTime de 5 minutes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const subscriptionQuery = queries.find((q) =>
          (q.queryKey as string[]).includes('subscription')
        );

        expect(subscriptionQuery?.options.staleTime).toBe(1000 * 60 * 5);
      });
    });
  });
});
