import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamPermissions {
  // Permissions de base
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  
  // Permissions spéciales
  canSend: boolean;
  canPublish: boolean;
  canManageStock: boolean;
  canProcessPayments: boolean;
  canCancel: boolean;
  canRefund: boolean;
  
  // Accès globaux
  canAccessSettings: boolean;
  canManageTeam: boolean;
  canManagePlan: boolean;
}

/**
 * Hook pour récupérer les permissions d'un utilisateur membre d'équipe
 * Retourne les permissions pour une ressource spécifique
 */
export const useTeamPermissions = (
  resourceType: string,
  resourceId?: string,
  ownerId?: string
): {
  permissions: TeamPermissions;
  isMember: boolean;
  role: 'owner' | 'manager' | 'collaborator' | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const { user } = useAuth();
  
  // Vérifier si l'utilisateur actuel est membre d'équipe
  const { data: memberShip, isLoading: memberShipLoading } = useQuery({
    queryKey: ['team-membership', user?.id, ownerId],
    queryFn: async () => {
      if (!user?.id || !ownerId) return null;
      
      // Si c'est le propriétaire, pas besoin de vérifier
      if (user.id === ownerId) {
        return { isOwner: true, role: 'owner' };
      }
      
      // Vérifier si c'est un membre
      const { data, error } = await supabase
        .from('team_members')
        .select('id, role, status')
        .eq('owner_id', ownerId)
        .eq('member_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) return { isOwner: false, isMember: false, role: null };
      
      return { 
        isOwner: false, 
        isMember: true, 
        role: data.role as 'manager' | 'collaborator',
        membershipId: data.id 
      };
    },
    enabled: !!user?.id && !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupérer les permissions de ce membre pour cette ressource
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['team-permissions', memberShip?.membershipId, resourceType, resourceId],
    queryFn: async () => {
      if (!memberShip?.isMember || !memberShip?.membershipId) {
        return null;
      }

      // Appeler la fonction SQL pour obtenir les permissions
      const { data, error } = await supabase.rpc('get_member_permissions', {
        p_member_id: memberShip.membershipId,
        p_resource_type: resourceType,
        p_resource_id: resourceId || null
      });

      if (error) throw error;
      
      return data ? (data[0] || null) : null;
    },
    enabled: !!memberShip?.isMember,
    staleTime: 5 * 60 * 1000,
  });

  // Si c'est le propriétaire, permissions complètes
  if (memberShip?.isOwner) {
    return {
      permissions: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canSend: true,
        canPublish: true,
        canManageStock: true,
        canProcessPayments: true,
        canCancel: true,
        canRefund: true,
        canAccessSettings: true,
        canManageTeam: true,
        canManagePlan: true,
      },
      isMember: false,
      role: 'owner',
      isLoading: memberShipLoading,
      error: null,
    };
  }

  // Si pas membre, pas de permissions
  if (!memberShip?.isMember) {
    return {
      permissions: {
        canView: false,
        canCreate: false,
        canEdit: false,
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
      },
      isMember: false,
      role: null,
      isLoading: memberShipLoading || permissionsLoading,
      error: null,
    };
  }

  // Retourner les permissions récupérées
  return {
    permissions: permissions || {
      canView: false,
      canCreate: false,
      canEdit: false,
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
    },
    isMember: true,
    role: memberShip?.role || null,
    isLoading: memberShipLoading || permissionsLoading,
    error: null,
  };
};

/**
 * Hook pour vérifier rapidement si l'utilisateur a une permission spécifique
 */
export const useHasPermission = (
  resourceType: string,
  permission: 'view' | 'create' | 'edit' | 'delete' | 'send' | 'publish',
  resourceId?: string,
  ownerId?: string
): boolean => {
  const { permissions } = useTeamPermissions(resourceType, resourceId, ownerId);
  
  switch (permission) {
    case 'view':
      return permissions.canView;
    case 'create':
      return permissions.canCreate;
    case 'edit':
      return permissions.canEdit;
    case 'delete':
      return permissions.canDelete;
    case 'send':
      return permissions.canSend;
    case 'publish':
      return permissions.canPublish;
    default:
      return false;
  }
};







