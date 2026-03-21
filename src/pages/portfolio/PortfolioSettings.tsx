import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Save, Upload, X, Loader2, Eye, Settings, Palette, Layout, Zap, FolderKanban, FileText, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PortfolioService, PortfolioSettings as PortfolioSettingsType } from '@/services/portfolioService';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadService } from '@/services/imageUploadService';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

// Schema will use translated messages dynamically

export const PortfolioSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const settingsSchema = z.object({
    is_enabled: z.boolean(),
    title: z.string().min(1, t('portfolio.settings.validation.titleRequired')).max(100),
    subtitle: z.string().max(200).optional(),
    show_categories: z.boolean().optional(),
    show_testimonials: z.boolean().optional(),
    track_project_views: z.boolean().optional(),
    track_quote_requests: z.boolean().optional(),
    projects_per_page: z.number().min(6).max(50).optional(),
    default_view: z.enum(['grid', 'list', 'masonry']).optional(),
    brand_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, t('portfolio.settings.validation.invalidColor')),
    booking_system: z.string().optional(),
    booking_url: z.string().url(t('portfolio.settings.validation.invalidUrl')).optional().or(z.literal('')),
  });

  type SettingsFormData = z.infer<typeof settingsSchema>;

  // États locaux
  const [coverImage, setCoverImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Récupérer les cartes de l'utilisateur
  const { data: userCards = [] } = useQuery({
    queryKey: ['user-cards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('business_cards')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Récupération des paramètres existants
  const { data: settings, isLoading } = useQuery({
    queryKey: ['portfolio-settings', user?.id, selectedCardId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!selectedCardId) return null;
      return await PortfolioService.getCardSettings(selectedCardId);
    },
    enabled: !!user?.id && !!selectedCardId
  });

  // Formulaire
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      is_enabled: false,
      title: t('portfolio.settings.defaultTitle'),
      show_categories: true,
      show_testimonials: true,
      track_project_views: true,
      track_quote_requests: true,
      default_view: 'grid',
      projects_per_page: 12,
      brand_color: '#8B5CF6',
      booking_system: 'none',
    }
  });

  // Sélectionner automatiquement la première carte
  useEffect(() => {
    if (
      Array.isArray(userCards) &&
      userCards.length > 0 &&
      !selectedCardId &&
      userCards[0] &&
      typeof userCards[0] === 'object' &&
      'id' in userCards[0]
    ) {
      setSelectedCardId((userCards[0] as { id: string }).id);
    }
  }, [userCards, selectedCardId]);
  useEffect(() => {
    if (settings) {
      setValue('is_enabled', settings.is_enabled);
      setValue('title', settings.title || t('portfolio.settings.defaultTitle'));
      setValue('subtitle', settings.subtitle || '');
      setValue('show_categories', settings.show_categories ?? true);
      setValue('show_testimonials', settings.show_testimonials ?? true);
      setValue('track_project_views', settings.track_project_views ?? true);
      setValue('track_quote_requests', settings.track_quote_requests ?? true);
      setValue('default_view', settings.default_view || 'grid');
      setValue('projects_per_page', settings.projects_per_page || 12);
      setValue('brand_color', settings.brand_color || '#8B5CF6');
      setValue('booking_system', settings.booking_system || 'none');
      setValue('booking_url', settings.booking_url || '');

      setCoverImage(settings.cover_image || '');
    }
  }, [settings, setValue, t]);

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (!user?.id || !selectedCardId) throw new Error('Missing data');

      const settingsData: Partial<PortfolioSettingsType> = {
        ...data,
        card_id: selectedCardId,
        cover_image: coverImage || undefined,
      };

      if (settings?.id) {
        return await PortfolioService.updateSettings(settings.id, settingsData);
      } else {
        // Utiliser upsert pour éviter les conflits de clés uniques
        return await PortfolioService.upsertSettings(user.id, settingsData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-settings'] });
      toast({
        title: t('portfolio.settings.toasts.saved.title'),
        description: t('portfolio.settings.toasts.saved.description'),
      });
    },
    onError: (error) => {
      toast({
        title: t('portfolio.settings.toasts.error.title'),
        description: t('portfolio.settings.toasts.error.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Upload de l'image de couverture
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const result = await ImageUploadService.uploadImage(file, 'cover', user.id);
      setCoverImage(result.url);
      toast({
        title: t('portfolio.settings.toasts.imageUploaded.title'),
        description: t('portfolio.settings.toasts.imageUploaded.description'),
      });
    } catch (error) {
      toast({
        title: t('portfolio.settings.toasts.imageError.title'),
        description: t('portfolio.settings.toasts.imageError.description'),
        variant: 'destructive',
      });
      // Error log removed
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: SettingsFormData) => {
    saveMutation.mutate(data);
  };

  const getPortfolioUrl = () => {
    if (!selectedCardId) return '';
    return `${window.location.origin}/card/${selectedCardId}/portfolio`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8 flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden">
        {/* Header Ultra-Moderne avec Glassmorphism */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                {/* Icon Container */}
          <motion.div
                  className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <Settings className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600 relative z-10" />
                </motion.div>
                
                <div className="min-w-0 flex-1">
                  <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {t('portfolio.settings.title')}
                  </motion.h1>
                  <motion.p
                    className="text-sm md:text-base text-gray-500 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.settings.subtitle')}
                  </motion.p>
                </div>
        </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => navigate('/portfolio/projects')}
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('portfolio.settings.projects')}</span>
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => navigate('/portfolio/services')}
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                    <Briefcase className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('portfolio.settings.services')}</span>
                <span className="sm:hidden">{t('portfolio.settings.servicesShort')}</span>
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => navigate('/portfolio/quotes')}
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('portfolio.settings.quotes')}</span>
              </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card Selector */}
          <motion.div
          className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 md:mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <Briefcase className="h-6 w-6 text-gray-600" />
                </motion.div>
                <div>
                  <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                  {t('portfolio.settings.cardTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                  {t('portfolio.settings.cardDescription')}
                  </p>
                </div>
              </div>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded-lg shadow-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                    <SelectValue placeholder={t('portfolio.settings.cardPlaceholder')} />
                  </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                    {(userCards as Array<{ id: string; name: string }>).map(card => (
                    <SelectItem key={card.id} value={card.id} className="rounded-lg">
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </motion.div>

          {selectedCardId && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Activation Ultra-Moderne */}
            <motion.div
              className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Orbe décoratif */}
              <motion.div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 blur-3xl opacity-10"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Zap className="h-6 w-6 text-gray-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900">
                    {t('portfolio.settings.activation.title')}
                    </h3>
                    <p className="text-sm text-gray-600">
                    {t('portfolio.settings.activation.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-xl rounded-lg border-2 border-gray-200/60">
                  <label className="text-sm font-bold text-gray-700">{t('portfolio.settings.activation.label')}</label>
                    <Switch
                      checked={watch('is_enabled')}
                      onCheckedChange={(checked) => setValue('is_enabled', checked)}
                    className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
              </div>
            </motion.div>

            {/* Branding Ultra-Moderne */}
            <motion.div
              className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Orbe décoratif */}
              <motion.div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 blur-3xl opacity-10"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Palette className="h-6 w-6 text-gray-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900">
                    {t('portfolio.settings.branding.title')}
                    </h3>
                    <p className="text-sm text-gray-600">
                    {t('portfolio.settings.branding.description')}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-bold text-gray-700 mb-2 block">{t('portfolio.settings.branding.titleLabel')}</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder={t('portfolio.settings.branding.titlePlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-lg"
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div>
                    <Label htmlFor="subtitle" className="text-sm font-bold text-gray-700 mb-2 block">{t('portfolio.settings.branding.subtitleLabel')}</Label>
                    <Input
                      id="subtitle"
                      {...register('subtitle')}
                      placeholder={t('portfolio.settings.branding.subtitlePlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-lg"
                    />
                    {errors.subtitle && (
                      <p className="text-xs text-red-600 mt-1">{errors.subtitle.message}</p>
                    )}
                  </div>

                  {/* Cover Image Upload */}
                  <div>
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <p className="text-sm sm:text-lg font-light text-gray-700 mb-2">
                        {t('portfolio.settings.branding.coverImage')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {t('portfolio.settings.branding.coverImageHelp')}
                      </p>
                      <Input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={isUploading}
                      />
                    </Label>
                    {isUploading && (
                      <div className="mt-4">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-gray-600 mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Brand Color */}
                  <div>
                    <Label htmlFor="brand_color" className="text-sm font-bold text-gray-700 mb-2 block">{t('portfolio.settings.branding.brandColor')}</Label>
                    <div className="flex gap-3">
                      <Input
                        id="brand_color"
                        {...register('brand_color')}
                        placeholder="#8B5CF6"
                        className="flex-1 h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-lg font-mono text-sm"
                      />
                      <Input
                        type="color"
                        value={watch('brand_color')}
                        onChange={(e) => setValue('brand_color', e.target.value)}
                        className="w-20 h-12 cursor-pointer rounded-lg border-2 border-gray-200/60 shadow-lg"
                      />
                    </div>
                    {errors.brand_color && (
                      <p className="text-xs text-red-600 mt-1">{errors.brand_color.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Display Options */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Layout className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    {t('portfolio.settings.displayOptions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <Label htmlFor="default_view">{t('portfolio.settings.displayOptions.defaultView')}</Label>
                    <Select value={watch('default_view')} onValueChange={(value) => setValue('default_view', value as any)}>
                      <SelectTrigger id="default_view" className="h-10 sm:h-12 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <SelectItem value="grid">{t('portfolio.settings.displayOptions.grid')}</SelectItem>
                        <SelectItem value="list">{t('portfolio.settings.displayOptions.list')}</SelectItem>
                        <SelectItem value="masonry">{t('portfolio.settings.displayOptions.masonry')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projects_per_page"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.settings.displayOptions.projectsPerPage')}</Label>
                    <Input
                      id="projects_per_page"
                      type="number"
                      min="6"
                      max="50"
                      {...register('projects_per_page', { valueAsNumber: true })}
                      className="h-10 sm:h-12 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </CardContent>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    {t('portfolio.settings.features.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-light text-gray-700"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.settings.features.showCategories')}</label>
                    <Switch
                      checked={watch('show_categories')}
                      onCheckedChange={(checked) => setValue('show_categories', checked)}
                      className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-light text-gray-700"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.settings.features.showTestimonials')}</label>
                    <Switch
                      checked={watch('show_testimonials')}
                      onCheckedChange={(checked) => setValue('show_testimonials', checked)}
                      className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-light text-gray-700"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.settings.features.trackViews')}</label>
                    <Switch
                      checked={watch('track_project_views')}
                      onCheckedChange={(checked) => setValue('track_project_views', checked)}
                      className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-light text-gray-700"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.settings.features.trackRequests')}</label>
                    <Switch
                      checked={watch('track_quote_requests')}
                      onCheckedChange={(checked) => setValue('track_quote_requests', checked)}
                      className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
                </CardContent>
              </div>
            </motion.div>

            {/* Booking Integration */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    {t('portfolio.settings.booking.title')}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.settings.booking.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <Label htmlFor="booking_system">{t('portfolio.settings.booking.systemLabel')}</Label>
                    <Select value={watch('booking_system')} onValueChange={(value) => setValue('booking_system', value)}>
                      <SelectTrigger id="booking_system" className="h-10 sm:h-12 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 mt-2 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <SelectItem value="none">{t('portfolio.settings.booking.systemNone')}</SelectItem>
                        <SelectItem value="calendly">{t('portfolio.settings.booking.systemCalendly')}</SelectItem>
                        <SelectItem value="other">{t('portfolio.settings.booking.systemOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {watch('booking_system') && watch('booking_system') !== 'none' && (
                    <div>
                      <Label htmlFor="booking_url"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.settings.booking.urlLabel')}</Label>
                      <Input
                        id="booking_url"
                        {...register('booking_url')}
                        placeholder={t('portfolio.settings.booking.urlPlaceholder')}
                        className="h-10 sm:h-12 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 mt-2 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      />
                      {errors.booking_url && (
                        <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.booking_url.message}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div
              className="flex justify-center sm:justify-end gap-3 sticky bottom-4 sm:bottom-6 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                  className="rounded-lg px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-light shadow-sm bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto transition-all duration-300"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">{t('portfolio.settings.saveSaving')}</span>
                    <span className="sm:hidden">{t('portfolio.settings.saveSavingShort')}</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{t('portfolio.settings.saveLabel')}</span>
                    <span className="sm:hidden">{t('portfolio.settings.saveLabelShort')}</span>
                  </>
                )}
              </Button>
              </motion.div>
            </motion.div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PortfolioSettings;
