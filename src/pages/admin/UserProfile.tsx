import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Calendar, Shield, Edit, Trash2, Loader2, Sparkles, Users, ShoppingCart, Crown } from 'lucide-react';
import UserActions from '@/components/admin/UserActions';
import { useLanguage } from '@/hooks/useLanguage';
import { PlanType, UserSubscription } from '@/types/subscription';

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();

  // Récupérer les données de l'utilisateur
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId
  });

  // Récupérer les rôles de l'utilisateur
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async (): Promise<UserRole[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return (data || []) as UserRole[];
    },
    enabled: !!userId
  });

  // Récupérer les cartes de l'utilisateur
  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ['userCards', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  // Récupérer l'abonnement de l'utilisateur
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<UserSubscription | null>({
    queryKey: ['admin-user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!userId,
  });

  // Mutation pour activer un plan manuellement (cash)
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planType: PlanType) => {
      if (!userId) throw new Error('User ID is required');

      // Vérifier si un abonnement existe déjà
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_type: planType,
            status: 'active',
            start_date: existing.start_date || now,
            end_date: null,
            auto_renew: false, // Paiement manuel (cash) → pas de renouvellement auto
            updated_at: now,
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            start_date: now,
            end_date: null,
            auto_renew: false,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscription', userId] });
      toast({
        title: 'Abonnement mis à jour',
        description: 'Le plan a été activé manuellement pour cet utilisateur (paiement cash).',
      });
    },
    onError: () => {
      toast({
        title: t('admin.errors.error'),
        description: 'Impossible de mettre à jour l’abonnement. Réessayez ou vérifiez Supabase.',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour supprimer l'utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      // Supprimer les rôles d'abord
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Supprimer les cartes
      await supabase
        .from('business_cards')
        .delete()
        .eq('user_id', userId);
      
      // Supprimer le profil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('admin.userProfile.userDeleted'),
        description: t('admin.userProfile.userDeletedDescription'),
      });
      navigate('/admin');
    },
    onError: (error) => {
      // Error log removed
      toast({
        title: t('admin.errors.error'),
        description: t('admin.errors.deleteError'),
        variant: "destructive",
      });
    }
  });

  if (isLoadingUser || isLoadingRoles || isLoadingCards || isLoadingSubscription) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="ml-2">{t('admin.loading.loadingProfile')}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.errors.userNotFound')}</h2>
          <p className="text-gray-600 mt-2">{t('admin.errors.userNotFoundDescription')}</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            {t('admin.userProfile.backToAdmin')}
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = roles?.some(role => role.role === 'admin');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.userProfile.title')}</h1>
            <p className="text-gray-600">{t('admin.userProfile.subtitle')}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/users/${userId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('admin.userProfile.edit')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(t('admin.userProfile.deleteConfirmation'))) {
                deleteUserMutation.mutate();
              }
            }}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {t('admin.userProfile.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-gray-100r from-blue-200 via-purple-200 to-emerald-100 flex items-center justify-center text-xl font-bold text-white">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.full_name || t('admin.userProfile.nameNotSet')}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.userProfile.createdOn')}</p>
                    <p className="font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t('admin.userProfile.role')}</p>
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? t('admin.userProfile.administrator') : t('admin.userProfile.user')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartes de visite */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle>{t('admin.userProfile.businessCards')} ({cards?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {cards && cards.length > 0 ? (
                <div className="space-y-3">
                  {cards.map((card: any) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-lg border"
                    >
                      <div>
                        <h4 className="font-medium">{card.title || 'Sans titre'}</h4>
                        <p className="text-sm text-gray-600">
                          {card.is_public ? t('admin.userProfile.public') : t('admin.userProfile.private')} • 
                          {t('admin.userProfile.createdOnDate')} {new Date(card.created_at).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/cards/${card.id}`, '_blank')}
                      >
                        {t('admin.userProfile.view')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('admin.userProfile.noCards')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions utilisateur */}
        <div className="space-y-6">
          <UserActions 
            userId={user.id}
            userEmail={user.email}
            userName={user.full_name}
            isAdmin={isAdmin}
          />

          {/* Gestion de l'abonnement (activation manuelle) */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
              <CardHeader>
                <CardTitle>Abonnement (admin)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Plan actuel</p>
                    <p className="font-semibold">
                      {subscription?.plan_type === PlanType.ESSENTIEL
                        ? t('subscription.plans.essentiel.name')
                        : subscription?.plan_type === PlanType.CONNEXIONS
                        ? t('subscription.plans.connexions.name')
                        : subscription?.plan_type === PlanType.COMMERCE
                        ? t('subscription.plans.commerce.name')
                        : subscription?.plan_type === PlanType.OPERE
                        ? t('subscription.plans.opere.name')
                        : subscription?.plan_type === PlanType.BUSINESS
                        ? 'Business (legacy)'
                        : subscription?.plan_type === PlanType.MAGIC
                        ? 'Magic (legacy)'
                        : 'Free (legacy)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Statut : {subscription?.status || 'active'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Activer manuellement un plan pour un paiement en cash.
                  </p>
                  <div className="flex flex-col gap-2">
                    {/* Nouveaux plans stratégiques */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.ESSENTIEL)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('subscription.plans.essentiel.name')} (gratuit)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.CONNEXIONS)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {t('subscription.plans.connexions.name')} (15K FCFA/mois)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.COMMERCE)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t('subscription.plans.commerce.name')} (5% commission)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.OPERE)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {t('subscription.plans.opere.name')} (10% commission + setup)
                    </Button>

                    <Separator />

                    {/* Anciens plans (legacy) */}
                    <Button
                      variant="outline"
                      className="w-full justify-start opacity-60"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.BUSINESS)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      Business (legacy)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start opacity-60"
                      onClick={() => updateSubscriptionMutation.mutate(PlanType.MAGIC)}
                      disabled={updateSubscriptionMutation.isPending}
                    >
                      Magic (legacy)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Statistiques */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle>{t('admin.userProfile.statistics')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userProfile.cardsCreated')}</span>
                <span className="font-bold">{cards?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userProfile.publicCards')}</span>
                <span className="font-bold">
                  {cards?.filter((card: any) => card.is_public).length || 0}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userProfile.memberSince')}</span>
                <span className="font-bold">
                  {user.created_at ? 
                    Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + ' ' + t('admin.userProfile.days')
                    : 'N/A'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
