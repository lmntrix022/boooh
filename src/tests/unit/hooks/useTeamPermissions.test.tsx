import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamPermissions, useHasPermission } from '@/hooks/useTeamPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTeamPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner toutes les permissions pour le propriétaire', async () => {
    const userId = 'owner-123';
    const ownerId = 'owner-123';
    const resourceType = 'card';
    const resourceId = 'card-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions(resourceType, resourceId, ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.role).toBe('owner');
    expect(result.current.permissions.canView).toBe(true);
    expect(result.current.permissions.canCreate).toBe(true);
    expect(result.current.permissions.canEdit).toBe(true);
    expect(result.current.permissions.canDelete).toBe(true);
    expect(result.current.permissions.canManageStock).toBe(true);
    expect(result.current.permissions.canProcessPayments).toBe(true);
  });

  it('devrait retourner aucune permission si l\'utilisateur n\'est pas membre', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';
    const resourceType = 'card';
    const resourceId = 'card-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions(resourceType, resourceId, ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.permissions.canView).toBe(false);
    expect(result.current.permissions.canCreate).toBe(false);
    expect(result.current.permissions.canEdit).toBe(false);
  });

  it('devrait retourner les permissions pour un membre MANAGER', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';
    const resourceType = 'card';
    const resourceId = 'card-123';
    const membershipId = 'membership-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: membershipId,
          role: 'manager',
          status: 'accepted',
        },
        error: null,
      }),
    } as any);

    const mockPermissions = {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canSend: true,
      canPublish: true,
      canManageStock: true,
      canProcessPayments: false,
      canCancel: false,
      canRefund: false,
      canAccessSettings: false,
      canManageTeam: false,
      canManagePlan: false,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockPermissions],
      error: null,
    });

    const { result } = renderHook(
      () => useTeamPermissions(resourceType, resourceId, ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(true);
    expect(result.current.role).toBe('manager');
    expect(result.current.permissions.canView).toBe(true);
    expect(result.current.permissions.canEdit).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('get_member_permissions', {
      p_member_id: membershipId,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
    });
  });

  it('devrait retourner les permissions pour un membre COLLABORATOR', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';
    const resourceType = 'card';
    const resourceId = 'card-123';
    const membershipId = 'membership-456';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: membershipId,
          role: 'collaborator',
          status: 'accepted',
        },
        error: null,
      }),
    } as any);

    const mockPermissions = {
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canSend: false,
      canPublish: false,
      canManageStock: false,
      canProcessPayments: false,
      canCancel: false,
      canRefund: false,
      canAccessSettings: false,
      canManageTeam: false,
      canManagePlan: false,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockPermissions],
      error: null,
    });

    const { result } = renderHook(
      () => useTeamPermissions(resourceType, resourceId, ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(true);
    expect(result.current.role).toBe('collaborator');
    expect(result.current.permissions.canView).toBe(true);
    expect(result.current.permissions.canCreate).toBe(false);
  });

  it('devrait retourner aucune permission si le membre n\'est pas accepté', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null, // Pas de membre avec status 'accepted'
        error: null,
      }),
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions('card', 'card-123', ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.permissions.canView).toBe(false);
  });

  it('devrait retourner aucune permission si l\'utilisateur n\'est pas connecté', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions('card', 'card-123', 'owner-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.permissions.canView).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de la récupération du membership', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions('card', 'card-123', ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('devrait fonctionner sans resourceId', async () => {
    const userId = 'owner-123';
    const ownerId = 'owner-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    const { result } = renderHook(
      () => useTeamPermissions('card', undefined, ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.role).toBe('owner');
  });
});

describe('useHasPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner true si la permission view est accordée', async () => {
    const userId = 'owner-123';
    const ownerId = 'owner-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    const { result } = renderHook(
      () => useHasPermission('card', 'view', 'card-123', ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('devrait retourner false si la permission create n\'est pas accordée', async () => {
    const userId = 'user-123';
    const ownerId = 'owner-456';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    const { result } = renderHook(
      () => useHasPermission('card', 'create', 'card-123', ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('devrait vérifier les différentes permissions', async () => {
    const userId = 'owner-123';
    const ownerId = 'owner-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    const permissions = ['view', 'create', 'edit', 'delete', 'send', 'publish'] as const;

    for (const permission of permissions) {
      const { result } = renderHook(
        () => useHasPermission('card', permission, 'card-123', ownerId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    }
  });

  it('devrait retourner false pour une permission inconnue', async () => {
    const userId = 'owner-123';
    const ownerId = 'owner-123';

    vi.mocked(useAuth).mockReturnValue({
      user: { id: userId },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    } as any);

    // @ts-expect-error - Testing unknown permission
    const { result } = renderHook(
      () => useHasPermission('card', 'unknown' as any, 'card-123', ownerId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});


