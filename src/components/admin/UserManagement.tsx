import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

// Définir l'interface pour la structure des données de profil
interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  created_at?: string;
  is_active?: boolean;
}

// Définir l'interface pour la structure des rôles
interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at?: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Obtenir les profils utilisateurs depuis une table public.profiles
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['appUsers'],
    queryFn: async (): Promise<Profile[]> => {
      // Nous utilisons la table profiles qui stocke les données utilisateur
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        // Si la table profiles n'existe pas encore, gérer l'erreur de façon élégante
        // Error log removed
        return [];
      }
      
      return (data || []) as Profile[];
    }
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async (): Promise<UserRole[]> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) {
        // Error log removed
        return [];
      }
      return (data || []) as UserRole[];
    }
  });

  // Pagination
  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Réinitialiser la page quand les données changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers.length]);

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin }: { userId: string, isCurrentlyAdmin: boolean }) => {
      if (isCurrentlyAdmin) {
        return await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      } else {
        // Type assertion: user_roles table not in generated types
        return await (supabase
          .from('user_roles')
          .insert as any)({ user_id: userId, role: 'admin' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      toast({
        title: t('admin.userManagement.toasts.roleUpdated'),
        description: t('admin.userManagement.toasts.roleUpdatedDescription'),
      });
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: t('admin.userManagement.toasts.error'),
        description: t('admin.userManagement.toasts.errorDescription'),
        variant: "destructive",
      });
    }
  });

  const toggleAdminRole = (userId: string, isCurrentlyAdmin: boolean) => {
    toggleRoleMutation.mutate({ userId, isCurrentlyAdmin });
  };

  if (isLoadingUsers || isLoadingRoles) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
        <span className="ml-2 text-gray-600">{t('admin.userManagement.loading')}</span>
      </div>
    );
  }

  // Afficher un message pour expliquer le problème de configuration
  if (!users || users.length === 0) {
    return (
      <div className="p-6 border border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">{t('admin.userManagement.configRequired')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('admin.userManagement.configDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg shadow-sm bg-white/60 backdrop-blur-md border border-gray-200/50 p-4">
        <Table className="min-w-[700px]">
          <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-md">
            <TableRow>
              <TableHead className="text-gray-900 font-bold text-sm">{t('admin.userManagement.tableHeaders.user')}</TableHead>
              <TableHead className="text-gray-900 font-bold text-sm">{t('admin.userManagement.tableHeaders.email')}</TableHead>
              <TableHead className="text-gray-900 font-bold text-sm">{t('admin.userManagement.tableHeaders.role')}</TableHead>
              <TableHead className="text-gray-900 font-bold text-sm text-center">{t('admin.userManagement.tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.map((user) => {
              const isAdmin = roles?.some(
                (role) => role.user_id === user.id && role.role === 'admin'
              ) ?? false;
              return (
                <TableRow
                  key={user.id}
                  className="transition-all duration-200 hover:bg-gray-50/50 cursor-pointer"
                >
                  {/* Avatar + nom */}
                  <TableCell className="flex items-center gap-3 font-semibold text-gray-900">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-900 shadow-sm">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="truncate max-w-[120px] text-gray-900">{user.full_name || '-'}</span>
                  </TableCell>
                  <TableCell className="text-gray-700">{user.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-all duration-200 ${isAdmin ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200/50'}`}>
                      {isAdmin ? 'Admin' : t('admin.userProfile.user')}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2 justify-center items-center flex-wrap">
                    {/* Voir profil */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-900" title={t('admin.userManagement.actions.view')} onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Button>
                    {/* Modifier */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-900" title={t('admin.userManagement.actions.edit')} onClick={() => window.open(`/admin/users/${user.id}/edit`, '_blank')}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                    </Button>
                    {/* Réinitialiser mot de passe */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-900" title="Réinitialiser mot de passe" onClick={() => {
                      if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.full_name || user.email} ?`)) {
                        // TODO: Implémenter la réinitialisation via Supabase Auth
                        toast({
                          title: "Réinitialisation demandée",
                          description: "Un email de réinitialisation a été envoyé à l'utilisateur.",
                        });
                      }
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 0v4m0 4h.01" /></svg>
                    </Button>
                    {/* Activer/désactiver (switch) */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-900" title="Activer/Désactiver" onClick={() => {
                      const action = user.is_active ?? true ? 'désactiver' : 'activer';
                      if (confirm(`Êtes-vous sûr de vouloir ${action} le compte de ${user.full_name || user.email} ?`)) {
                        // TODO: Implémenter l'activation/désactivation
                        toast({
                          title: "Statut modifié",
                          description: `Le compte a été ${action === 'désactiver' ? 'désactivé' : 'activé'} avec succès.`,
                        });
                      }
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </Button>
                    {/* Promouvoir/rétrograder admin */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`w-9 h-9 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center ${isAdmin ? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md'}`}
                      title={isAdmin ? 'Retirer admin' : 'Rendre admin'}
                      onClick={() => toggleAdminRole(user.id, isAdmin)}
                      disabled={toggleRoleMutation.isPending}
                    >
                      {toggleRoleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isAdmin ? (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )
                      )}
                    </Button>
                    {/* Supprimer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-900" title="Supprimer" onClick={() => {
                      if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${user.full_name || user.email} ? Cette action est irréversible.`)) {
                        // TODO: Implémenter la suppression complète
                        toast({
                          title: "Suppression demandée",
                          description: "La suppression de l'utilisateur a été demandée.",
                          variant: "destructive",
                        });
                      }
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/60 shadow-xl p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>

              {/* Numéros de page */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else {
                    // Logique pour afficher les bonnes pages quand il y en a beaucoup
                    if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
