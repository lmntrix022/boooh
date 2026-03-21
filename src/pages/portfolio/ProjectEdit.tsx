import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Upload, X, Plus, Loader2, FileEdit, Info, FileText, Image, MessageSquare, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PortfolioService, CreateProjectData } from '@/services/portfolioService';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadService } from '@/services/imageUploadService';
import { supabase } from '@/integrations/supabase/client';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useLanguage } from '@/hooks/useLanguage';

export const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const isEditMode = id !== 'new';

  // Schema will use translated messages dynamically
  const projectSchema = z.object({
    card_id: z.string().min(1, t('portfolio.projectEdit.validation.cardRequired')),
    title: z.string().min(3, t('portfolio.projectEdit.validation.titleMin')),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    short_description: z.string().max(200, t('portfolio.projectEdit.validation.shortDescriptionMax')).optional(),
    challenge: z.string().optional(),
    solution: z.string().optional(),
    result: z.string().optional(),
    video_url: z.string().url(t('portfolio.projectEdit.validation.invalidUrl')).optional().or(z.literal('')),
    pdf_url: z.string().url(t('portfolio.projectEdit.validation.invalidUrl')).optional().or(z.literal('')),
    cta_type: z.enum(['quote', 'booking', 'contact', 'custom']).optional(),
    cta_label: z.string().optional(),
    cta_url: z.string().url(t('portfolio.projectEdit.validation.invalidUrl')).optional().or(z.literal('')),
    testimonial_author: z.string().optional(),
    testimonial_content: z.string().optional(),
    testimonial_rating: z.number().min(1).max(5).optional(),
    is_published: z.boolean(),
  });

  type ProjectFormData = z.infer<typeof projectSchema>;

  // États locaux
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  // Récupération du projet existant
  const { data: project, isLoading } = useQuery({
    queryKey: ['portfolio-project', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      return await PortfolioService.getProject(id);
    },
    enabled: isEditMode
  });

  // Formulaire
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      is_published: false,
      cta_type: 'quote',
    }
  });

  // Charger les données du projet dans le formulaire
  useEffect(() => {
    if (project) {
      setValue('card_id', project.card_id || '');
      setValue('title', project.title);
      setValue('category', project.category || '');
      setValue('tags', project.tags || []);
      setValue('short_description', project.short_description || '');
      setValue('challenge', project.challenge || '');
      setValue('solution', project.solution || '');
      setValue('result', project.result || '');
      setValue('video_url', project.video_url || '');
      setValue('pdf_url', project.pdf_url || '');
      setValue('cta_type', project.cta_type as any || 'quote');
      setValue('cta_label', project.cta_label || '');
      setValue('cta_url', project.cta_url || '');
      setValue('testimonial_author', project.testimonial_author || '');
      setValue('testimonial_content', project.testimonial_content || '');
      setValue('testimonial_rating', project.testimonial_rating || undefined);
      setValue('is_published', project.is_published);

      setFeaturedImage(project.featured_image || '');
      setGalleryImages(project.gallery_images || []);
    } else if (userCards.length > 0 && !isEditMode) {
      // Pour les nouveaux projets, pré-sélectionner la première carte
      setValue('card_id', userCards[0].id);
    }
  }, [project, setValue, userCards, isEditMode]);

  // Mutation pour créer/mettre à jour
  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const projectData: CreateProjectData = {
        title: data.title, // Explicitly include required field
        ...data,
        featured_image: featuredImage || undefined,
        gallery_images: galleryImages.length > 0 ? galleryImages : undefined,
      };

      if (isEditMode && id) {
        return await PortfolioService.updateProject(id, projectData);
      } else {
        return await PortfolioService.createProject(user.id, projectData);
      }
    },
    onSuccess: (savedProject) => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });

      toast({
        title: isEditMode ? t('portfolio.projectEdit.toasts.saved.title') : t('portfolio.projectEdit.toasts.created.title'),
        description: isEditMode
          ? t('portfolio.projectEdit.toasts.saved.description')
          : t('portfolio.projectEdit.toasts.created.description'),
      });

      navigate('/portfolio/projects');
    },
    onError: (error) => {
      toast({
        title: t('portfolio.projectEdit.toasts.error.title'),
        description: t('portfolio.projectEdit.toasts.error.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Upload d'image
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'featured' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const result = await ImageUploadService.uploadImage(file, 'media', user.id);

      if (type === 'featured') {
        setFeaturedImage(result.url);
      } else {
        setGalleryImages(prev => [...prev, result.url]);
      }

      toast({
        title: t('portfolio.projectEdit.toasts.imageUploaded.title'),
        description: t('portfolio.projectEdit.toasts.imageUploaded.description'),
      });
    } catch (error) {
      toast({
        title: t('portfolio.projectEdit.toasts.imageError.title'),
        description: t('portfolio.projectEdit.toasts.imageError.description'),
        variant: 'destructive',
      });
      // Error log removed
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer une image de la galerie
  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Ajouter un tag
  const addTag = () => {
    if (!tagInput.trim()) return;

    const currentTags = watch('tags') || [];
    if (!currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()]);
    }
    setTagInput('');
  };

  // Supprimer un tag
  const removeTag = (tag: string) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter(t => t !== tag));
  };

  const onSubmit = (data: ProjectFormData) => {
    // Inclure les URLs des images dans les données à sauvegarder
    const dataWithImages = {
      ...data,
      featured_image: featuredImage,
      gallery_images: galleryImages
    };
    saveMutation.mutate(dataWithImages);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8 flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden bg-white">
        {/* Header */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6 mb-4">
                <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                  {/* Bouton Retour */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/portfolio/projects')}
                      className="rounded-lg p-3 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
            >
                      <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
                  </motion.div>
                  
                  {/* Icon Container */}
          <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <FileEdit className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600 relative z-10" />
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
                      {isEditMode ? t('portfolio.projectEdit.editProject') : t('portfolio.projectEdit.newProject')}
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
              {isEditMode ? t('portfolio.projectEdit.editSubtitle') : t('portfolio.projectEdit.newSubtitle')}
                    </motion.p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                      className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                onClick={() => navigate('/portfolio/projects')}
              >
                {t('portfolio.projectEdit.cancel')}
              </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={saveMutation.isPending}
                      className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('portfolio.projectEdit.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('portfolio.projectEdit.save')}
                  </>
                )}
              </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Ultra-Moderne */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="info" className="w-full">
            {/* Tabs */}
            <motion.div
              className="mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-2 overflow-hidden">
                <TabsList className="relative z-10 bg-transparent border-0 p-0 gap-2 flex justify-center items-center w-full">
              <TabsTrigger
                value="info"
                    className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 flex-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                {t('portfolio.projectEdit.tabs.info')}
              </TabsTrigger>
              <TabsTrigger
                value="content"
                    className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 flex-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                {t('portfolio.projectEdit.tabs.content')}
              </TabsTrigger>
              <TabsTrigger
                value="media"
                    className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 flex-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                {t('portfolio.projectEdit.tabs.media')}
              </TabsTrigger>
              <TabsTrigger
                value="cta"
                    className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300 flex-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                {t('portfolio.projectEdit.tabs.cta')}
              </TabsTrigger>
            </TabsList>
              </div>
            </motion.div>

            {/* Tab: Informations Ultra-Moderne */}
            <TabsContent value="info">
              <motion.div
                className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="relative z-10 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.25, type: "tween" }}
                    >
                      <Info className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                    {t('portfolio.projectEdit.info.title')}
                      </h3>
                      <p className="text-sm text-gray-600">{t('portfolio.projectEdit.info.description')}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                  {/* Sélection de la carte */}
                  <div>
                    <Label htmlFor="card_id" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.projectEdit.info.cardLabel')}</Label>
                    <Select
                      value={watch('card_id')}
                      onValueChange={(value) => setValue('card_id', value)}
                    >
                      <SelectTrigger className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 rounded-lg shadow-sm">
                        <SelectValue placeholder={t('portfolio.projectEdit.info.cardPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        {userCards.map((card) => (
                          <SelectItem key={card.id} value={card.id} className="rounded-lg">
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.card_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.card_id.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {t('portfolio.projectEdit.info.cardHelp')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.projectEdit.info.titleLabel')}</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder={t('portfolio.projectEdit.info.titlePlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.projectEdit.info.categoryLabel')}</Label>
                    <Input
                      id="category"
                      {...register('category')}
                      placeholder={t('portfolio.projectEdit.info.categoryPlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="short_description" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.projectEdit.info.shortDescriptionLabel')}</Label>
                    <Textarea
                      id="short_description"
                      {...register('short_description')}
                      placeholder={t('portfolio.projectEdit.info.shortDescriptionPlaceholder')}
                      rows={2}
                      className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                    {errors.short_description && (
                      <p className="text-sm text-red-600 mt-1">{errors.short_description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('portfolio.projectEdit.info.tagsLabel')}</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder={t('portfolio.projectEdit.info.tagsPlaceholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      />
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button type="button" onClick={addTag} variant="outline" className="h-12 rounded-lg border border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                      </motion.div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(watch('tags') || []).map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 bg-gray-900 text-white border-0 rounded-lg px-3 py-1 font-semibold">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-300"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="space-y-0.5">
                      <Label htmlFor="is_published" className="text-sm font-light text-gray-700">{t('portfolio.projectEdit.info.publishLabel')}</Label>
                      <p className="text-sm text-gray-500">
                        {t('portfolio.projectEdit.info.publishHelp')}
                      </p>
                    </div>
                    <Switch
                      id="is_published"
                      checked={watch('is_published')}
                      onCheckedChange={(checked) => setValue('is_published', checked)}
                      className="data-[state=checked]:bg-gray-900"
                    />
                  </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Contenu Ultra-Moderne */}
            <TabsContent value="content">
              <motion.div
                className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Orbe décoratif */}
                <motion.div
                  className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 blur-3xl opacity-10"
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
                      <FileText className="h-6 w-6 text-gray-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                    {t('portfolio.projectEdit.content.title')}
                      </h3>
                      <p className="text-sm text-gray-600">{t('portfolio.projectEdit.content.description')}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                  <div>
                    <Label htmlFor="challenge" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.content.challengeLabel')}</Label>
                    <RichTextEditor
                      id="challenge"
                      value={watch('challenge') || ''}
                      onChange={(value) => setValue('challenge', value)}
                      placeholder={t('portfolio.projectEdit.content.challengePlaceholder')}
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('portfolio.projectEdit.content.challengeHelp')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="solution" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.content.solutionLabel')}</Label>
                    <RichTextEditor
                      id="solution"
                      value={watch('solution') || ''}
                      onChange={(value) => setValue('solution', value)}
                      placeholder={t('portfolio.projectEdit.content.solutionPlaceholder')}
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('portfolio.projectEdit.content.solutionHelp')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="result" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.content.resultLabel')}</Label>
                    <RichTextEditor
                      id="result"
                      value={watch('result') || ''}
                      onChange={(value) => setValue('result', value)}
                      placeholder={t('portfolio.projectEdit.content.resultPlaceholder')}
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('portfolio.projectEdit.content.resultHelp')}
                    </p>
                  </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: Médias Ultra-Moderne */}
            <TabsContent value="media">
              <motion.div
                className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ scale: 1.01 }}
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
                      <Image className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                    {t('portfolio.projectEdit.media.title')}
                      </h3>
                      <p className="text-sm text-gray-600">{t('portfolio.projectEdit.media.description')}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                  {/* Featured Image */}
                  <div>
                    <Label className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.media.featuredImage')}</Label>
                    <div className="mt-2">
                      {featuredImage ? (
                        <motion.div 
                          className="relative inline-block rounded-lg overflow-hidden shadow-sm"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={featuredImage}
                            alt={t('portfolio.projectEdit.media.featuredImage')}
                            className="w-full max-w-md h-48 object-cover"
                          />
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                              className="absolute top-2 right-2 rounded-lg shadow-sm"
                            onClick={() => setFeaturedImage('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 hover:border-gray-400 transition-colors duration-300"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          </motion.div>
                          <div className="mt-4">
                            <Label htmlFor="featured-upload" className="cursor-pointer">
                              <span className="text-gray-900 hover:text-gray-700 font-semibold">
                                {t('portfolio.projectEdit.media.uploadImage')}
                              </span>
                              <Input
                                id="featured-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'featured')}
                                disabled={isUploading}
                              />
                            </Label>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <Label className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.media.galleryLabel')}</Label>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      {galleryImages.map((url, index) => (
                        <motion.div 
                          key={index} 
                          className="relative rounded-lg overflow-hidden shadow-sm group"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={url}
                            alt={`${t('portfolio.projectEdit.media.galleryLabel')} ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <motion.div 
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }}
                          >
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                              className="rounded-lg shadow-sm"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          </motion.div>
                        </motion.div>
                      ))}
                      <motion.div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors duration-300 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Label htmlFor="gallery-upload" className="cursor-pointer">
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: [0, 90, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                            <Plus className="mx-auto h-8 w-8 text-gray-400" />
                            </motion.div>
                            <Input
                              id="gallery-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'gallery')}
                              disabled={isUploading}
                            />
                          </div>
                        </Label>
                      </motion.div>
                    </div>
                  </div>

                  {/* Video URL */}
                  <div>
                    <Label htmlFor="video_url" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.media.videoLabel')}</Label>
                    <Input
                      id="video_url"
                      {...register('video_url')}
                      placeholder={t('portfolio.projectEdit.media.videoPlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                    {errors.video_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.video_url.message}</p>
                    )}
                  </div>

                  {/* PDF URL */}
                  <div>
                    <Label htmlFor="pdf_url" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.media.pdfLabel')}</Label>
                    <Input
                      id="pdf_url"
                      {...register('pdf_url')}
                      placeholder={t('portfolio.projectEdit.media.pdfPlaceholder')}
                      className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                    {errors.pdf_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.pdf_url.message}</p>
                    )}
                  </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab: CTA & Témoignage Ultra-Moderne */}
            <TabsContent value="cta">
              <div className="space-y-6">
                {/* CTA Section */}
                <motion.div
                  className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <motion.div
                        className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
                        whileHover={{ rotate: -8, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Zap className="h-6 w-6 text-gray-600" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                      {t('portfolio.projectEdit.cta.title')}
                        </h3>
                        <p className="text-sm text-gray-600">{t('portfolio.projectEdit.cta.description')}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                    <div>
                      <Label htmlFor="cta_type" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.typeLabel')}</Label>
                      <Select
                        value={watch('cta_type')}
                        onValueChange={(value: any) => setValue('cta_type', value)}
                      >
                        <SelectTrigger className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 rounded-lg shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          <SelectItem value="quote" className="rounded-lg">{t('portfolio.projectEdit.cta.types.quote')}</SelectItem>
                          <SelectItem value="booking" className="rounded-lg">{t('portfolio.projectEdit.cta.types.booking')}</SelectItem>
                          <SelectItem value="contact" className="rounded-lg">{t('portfolio.projectEdit.cta.types.contact')}</SelectItem>
                          <SelectItem value="custom" className="rounded-lg">{t('portfolio.projectEdit.cta.types.custom')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cta_label" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.labelLabel')}</Label>
                      <Input
                        id="cta_label"
                        {...register('cta_label')}
                        placeholder={t('portfolio.projectEdit.cta.labelPlaceholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      />
                    </div>

                    {watch('cta_type') === 'custom' && (
                      <div>
                        <Label htmlFor="cta_url" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.urlLabel')}</Label>
                        <Input
                          id="cta_url"
                          {...register('cta_url')}
                          placeholder={t('portfolio.projectEdit.cta.urlPlaceholder')}
                          className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                        />
                        {errors.cta_url && (
                          <p className="text-sm text-red-600 mt-1">{errors.cta_url.message}</p>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </motion.div>

                {/* Testimonial Section Ultra-Moderne */}
                <motion.div
                  className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Orbe décoratif */}
                  <motion.div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 blur-3xl opacity-10"
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
                        whileHover={{ rotate: -8, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MessageSquare className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                      {t('portfolio.projectEdit.cta.testimonialLabel')}
                        </h3>
                        <p className="text-sm text-gray-600">{t('portfolio.projectEdit.cta.testimonialDescription')}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                    <div>
                        <Label htmlFor="testimonial_author" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.authorPlaceholder')}</Label>
                      <Input
                        id="testimonial_author"
                        {...register('testimonial_author')}
                        placeholder={t('portfolio.projectEdit.cta.authorPlaceholder')}
                          className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      />
                    </div>

                    <div>
                        <Label htmlFor="testimonial_content" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.testimonialLabel')}</Label>
                      <Textarea
                        id="testimonial_content"
                        {...register('testimonial_content')}
                        placeholder={t('portfolio.projectEdit.cta.contentPlaceholder')}
                        rows={4}
                          className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      />
                    </div>

                    <div>
                        <Label htmlFor="testimonial_rating" className="text-sm font-light text-gray-700 mb-2 block">{t('portfolio.projectEdit.cta.ratingLabel')}</Label>
                      <Select
                        value={watch('testimonial_rating')?.toString() || ''}
                        onValueChange={(value) => setValue('testimonial_rating', parseInt(value))}
                      >
                          <SelectTrigger className="h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 rounded-lg shadow-sm">
                          <SelectValue placeholder={t('portfolio.projectEdit.cta.ratingPlaceholder')} />
                        </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                            <SelectItem value="5" className="rounded-lg">⭐⭐⭐⭐⭐ (5/5)</SelectItem>
                            <SelectItem value="4" className="rounded-lg">⭐⭐⭐⭐ (4/5)</SelectItem>
                            <SelectItem value="3" className="rounded-lg">⭐⭐⭐ (3/5)</SelectItem>
                            <SelectItem value="2" className="rounded-lg">⭐⭐ (2/5)</SelectItem>
                            <SelectItem value="1" className="rounded-lg">⭐ (1/5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProjectEdit;
