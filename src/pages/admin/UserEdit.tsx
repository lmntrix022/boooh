import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Mail, Shield, User, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

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

const UserEdit = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();

  // État local pour le formulaire
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    is_admin: false
  });

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

  // Mettre à jour le formulaire quand les données sont chargées
  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        is_admin: false // Sera mis à jour après le chargement des rôles
      });
    }
  }, [user]);

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

  // Mettre à jour le rôle admin quand les rôles sont chargés
  React.useEffect(() => {
    if (roles) {
      const isAdmin = roles.some(role => role.role === 'admin');
      setFormData(prev => ({ ...prev, is_admin: isAdmin }));
    }
  }, [roles]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; email: string }) => {
      if (!userId) throw new Error('User ID is required');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast({
        title: t('admin.userEdit.profileUpdated'),
        description: t('admin.userEdit.profileUpdatedDescription'),
      });
    },
    onError: (error) => {
      // Error log removed
      toast({
        title: t('admin.errors.error'),
        description: t('admin.errors.updateError'),
        variant: "destructive",
      });
    }
  });

  // Mutation pour mettre à jour le rôle admin
  const updateRoleMutation = useMutation({
    mutationFn: async (isAdmin: boolean) => {
      if (!userId) throw new Error('User ID is required');
      if (isAdmin) {
        // Ajouter le rôle admin
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
      } else {
        // Supprimer le rôle admin
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      toast({
        title: t('admin.userEdit.roleUpdated'),
        description: t('admin.userEdit.roleUpdatedDescription'),
      });
    },
    onError: (error) => {
      // Error log removed
      toast({
        title: t('admin.errors.error'),
        description: t('admin.errors.roleUpdateError'),
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      full_name: formData.full_name,
      email: formData.email
    });
  };

  const handleRoleToggle = (isAdmin: boolean) => {
    setFormData(prev => ({ ...prev, is_admin: isAdmin }));
    updateRoleMutation.mutate(isAdmin);
  };

  if (isLoadingUser || isLoadingRoles) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="ml-2">{t('admin.loading.loadingData')}</span>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/users/${userId}`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.userEdit.title')}</h1>
            <p className="text-gray-600">{t('admin.userEdit.subtitle', { name: user?.full_name || user?.email || '' })}</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
          className="bg-gray-900 from-gray-900 to-gray-800 hover:bg-gray-800"
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('admin.userEdit.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{t('admin.userEdit.personalInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('admin.userEdit.fullName')}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder={t('admin.userEdit.fullNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('admin.userEdit.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('admin.userEdit.emailPlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions et rôles */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>{t('admin.userEdit.permissions')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t('admin.userEdit.adminRole')}</Label>
                  <p className="text-sm text-gray-600">
                    {t('admin.userEdit.adminRoleDescription')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_admin}
                  onCheckedChange={handleRoleToggle}
                  disabled={updateRoleMutation.isPending}
                />
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <Badge variant={formData.is_admin ? "default" : "secondary"}>
                  {formData.is_admin ? t('admin.userProfile.administrator') : t('admin.userProfile.user')}
                </Badge>
                {updateRoleMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions avancées */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle>{t('admin.userEdit.advancedActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert('Fonction à implémenter')}
              >
                <Mail className="h-4 w-4 mr-2" />
                {t('admin.userEdit.resetPassword')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert('Fonction à implémenter')}
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('admin.userEdit.suspendAccount')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert('Fonction à implémenter')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('admin.userEdit.viewLoginHistory')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informations et statistiques */}
        <div className="space-y-6">
          {/* Informations actuelles */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle>{t('admin.userEdit.currentInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userEdit.userId')}</span>
                <span className="font-mono text-sm">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userEdit.createdOn')}</span>
                                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'}
                  </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.userEdit.lastUpdate')}</span>
                                  <span className="font-medium">
                    {user?.updated_at ? new Date(user.updated_at).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'}
                  </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
            <CardHeader>
              <CardTitle>{t('admin.userEdit.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/admin/users/${userId}`)}
              >
                <User className="h-4 w-4 mr-2" />
                {t('admin.userEdit.viewProfile')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('admin.userProfile.backToAdmin')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserEdit;
