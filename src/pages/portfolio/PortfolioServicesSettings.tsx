import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Code,
  Palette,
  Rocket,
  Zap,
  Cpu,
  Lightbulb,
  Briefcase,
  Target,
  TrendingUp,
  Award,
  Star,
  Heart,
  Smile,
  Package,
  Save,
  CreditCard,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PortfolioService as PortfolioServiceClass, PriceType, PortfolioServiceWithCards, CreateServiceData, UpdateServiceData } from '@/services/portfolioService';
import { useAuth } from '@/contexts/AuthContext';

// Form data interface for local state
interface ServiceFormData {
  title: string;
  description: string;
  icon: string;
  price_type: PriceType;
  price?: number;
  price_label: string;
  cta_label: string;
  cta_url: string;
  is_published: boolean;
  image_urls: string[];  // URLs des images uploadées
}
import { usePremiumToast } from '@/hooks/usePremiumToast';
import { CardSelector } from '@/components/portfolio/CardSelector';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { ImageUploadService } from '@/services/imageUploadService';

// Mapping des icônes
const ICONS = [
  { value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'code', label: 'Code', Icon: Code },
  { value: 'palette', label: 'Palette', Icon: Palette },
  { value: 'rocket', label: 'Rocket', Icon: Rocket },
  { value: 'zap', label: 'Zap', Icon: Zap },
  { value: 'cpu', label: 'Cpu', Icon: Cpu },
  { value: 'lightbulb', label: 'Lightbulb', Icon: Lightbulb },
  { value: 'briefcase', label: 'Briefcase', Icon: Briefcase },
  { value: 'target', label: 'Target', Icon: Target },
  { value: 'trending', label: 'Trending', Icon: TrendingUp },
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'heart', label: 'Heart', Icon: Heart },
  { value: 'smile', label: 'Smile', Icon: Smile },
  { value: 'package', label: 'Package', Icon: Package },
];

// Templates de services par défaut - will be loaded dynamically based on language

const PortfolioServicesSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = usePremiumToast();
  const { t } = useLanguage();

  // Templates de services par défaut
  const SERVICE_TEMPLATES = [
    {
      title: t('portfolio.servicesSettings.templates.webDev.title'),
      description: t('portfolio.servicesSettings.templates.webDev.description'),
      icon: "code",
      price_type: "from" as PriceType,
      price: 500,
      cta_label: t('portfolio.servicesSettings.dialog.ctaPlaceholder')
    },
    {
      title: t('portfolio.servicesSettings.templates.uiUx.title'),
      description: t('portfolio.servicesSettings.templates.uiUx.description'),
      icon: "palette",
      price_type: "from" as PriceType,
      price: 800,
      cta_label: t('portfolio.servicesSettings.dialog.ctaPlaceholder')
    },
    {
      title: t('portfolio.servicesSettings.templates.digitalStrategy.title'),
      description: t('portfolio.servicesSettings.templates.digitalStrategy.description'),
      icon: "rocket",
      price_type: "custom" as PriceType,
      cta_label: t('portfolio.servicesSettings.dialog.ctaPlaceholder')
    },
  ];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PortfolioServiceWithCards | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    icon: 'sparkles',
    price_type: 'custom' as PriceType,
    price: undefined,
    price_label: '',
    cta_label: t('portfolio.servicesSettings.dialog.ctaPlaceholder'),
    cta_url: '',
    is_published: true,
    image_urls: [],
  });
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Charger les cartes de l'utilisateur
  const { data: userCards = [] } = useQuery({
    queryKey: ['user-cards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('business_cards')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Error log removed
        throw error;
      }

      // Mapper name vers title pour compatibilité avec CardSelector
      return (data as { id: string; name: string }[] || []).map(card => ({
        id: card.id,
        title: card.name,
        slug: undefined
      }));
    },
    enabled: !!user?.id,
  });

  // Charger les services avec leurs cartes liées
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['user-services-with-cards', user?.id],
    queryFn: async () => {
      if (!user?.id) return { services: [], total: 0, hasMore: false };
      return await PortfolioServiceClass.getUserServicesWithCards(user.id, {
        limit: 1000, // Charger tous les services pour l'instant (peut être paginé plus tard)
      });
    },
    enabled: !!user?.id,
  });

  // Extraire le tableau services de l'objet retourné
  const services = servicesData?.services || [];

  // Mutation pour créer
  const createMutation = useMutation({
    mutationFn: async (data: { service: CreateServiceData; cardIds: string[] }) => {
      const service = await PortfolioServiceClass.createService(data.service);
      if (data.cardIds.length > 0) {
        await PortfolioServiceClass.updateServiceCards(service.id, data.cardIds);
      }
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services-with-cards'] });
      showSuccess(t('portfolio.servicesSettings.toasts.created.description'));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => showError(t('portfolio.servicesSettings.toasts.createError.description')),
  });

  // Mutation pour mettre à jour
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: UpdateServiceData; cardIds: string[] }) => {
      const service = await PortfolioServiceClass.updateService(data.id, data.updates);
      await PortfolioServiceClass.updateServiceCards(data.id, data.cardIds);
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services-with-cards'] });
      showSuccess(t('portfolio.servicesSettings.toasts.updated.description'));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => showError(t('portfolio.servicesSettings.toasts.updateError.description')),
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => PortfolioServiceClass.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services-with-cards'] });
      showSuccess(t('portfolio.servicesSettings.toasts.deleted.description'));
    },
    onError: () => showError(t('portfolio.servicesSettings.toasts.deleteError.description')),
  });

  // Toggle publish
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      PortfolioServiceClass.updateService(id, { is_published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services-with-cards'] });
    },
  });

  const showSuccess = (message: string) => {
    toast.success(t('portfolio.servicesSettings.toasts.created.title'), message);
  };

  const showError = (message: string) => {
    toast.error(t('portfolio.servicesSettings.toasts.createError.title'), message);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'sparkles',
      price_type: 'custom',
      price: undefined,
      price_label: '',
      cta_label: t('portfolio.servicesSettings.dialog.ctaPlaceholder'),
      cta_url: '',
      is_published: true,
      image_urls: [],
    });
    setSelectedCardIds([]);
    setEditingService(null);
  };

  const handleOpenDialog = async (service?: PortfolioServiceWithCards) => {
    if (service) {
      setEditingService(service);
      // Convert service to form data format
      setFormData({
        title: service.title || '',
        description: service.description || '',
        icon: service.icon || 'sparkles',
        price_type: (service.price_type as PriceType) || 'custom',
        price: service.price ?? undefined,
        price_label: service.price_label || '',
        cta_label: service.cta_label || '',
        cta_url: service.cta_url || '',
        is_published: service.is_published ?? true,
        image_urls: (service as any).image_urls || [],  // Charger images existantes
      });
      // Charger les cartes liées
      const linkedCardIds = service.linked_cards?.map(card => card.id) || [];
      setSelectedCardIds(linkedCardIds);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !user?.id) return;

    // Nettoyer les données pour la création/mise à jour
    const cleanFormData: UpdateServiceData = {
      title: formData.title,
      description: formData.description || null,
      icon: formData.icon || null,
      price_type: formData.price_type || null,
      price: formData.price ?? null,
      price_label: formData.price_label || null,
      cta_label: formData.cta_label || null,
      cta_url: formData.cta_url || null,
      is_published: formData.is_published ?? true,
      // TEMPORAIRE : Désactiver image_urls si migration pas appliquée
      // Décommenter la ligne ci-dessous après avoir appliqué la migration :
      // image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
    };

    if (editingService) {
      updateMutation.mutate({
        id: editingService.id,
        updates: cleanFormData,
        cardIds: selectedCardIds
      });
    } else {
      const serviceData: CreateServiceData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        icon: formData.icon || null,
        price_type: formData.price_type || null,
        price: formData.price ?? null,
        price_label: formData.price_label || null,
        cta_label: formData.cta_label || null,
        cta_url: formData.cta_url || null,
        is_published: formData.is_published ?? true,
        order_index: services.length,
        // TEMPORAIRE : Désactiver image_urls si migration pas appliquée
        // Décommenter la ligne ci-dessous après avoir appliqué la migration :
        // image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
      };

      createMutation.mutate({
        service: serviceData,
        cardIds: selectedCardIds
      });
    }
  };

  const handleUseTemplate = (template: typeof SERVICE_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      ...template,
    });
  };

  // Gérer l'upload d'images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Vérifier la limite d'images (max 5)
    if (formData.image_urls.length >= 5) {
      toast.error('Limite atteinte', 'Vous ne pouvez ajouter que 5 images maximum par service');
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, WebP)');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop lourd', 'Taille maximum : 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Upload vers Supabase Storage
      const imageUrl = await ImageUploadService.uploadServiceImage(user.id, file);
      
      // Ajouter l'URL à la liste
      setFormData({
        ...formData,
        image_urls: [...formData.image_urls, imageUrl]
      });
      
      toast.success('Image ajoutée', 'L\'image a été uploadée avec succès');
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Supprimer une image
  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Supprimer de Supabase Storage
      await ImageUploadService.deleteImageByUrl(imageUrl);
      
      // Retirer de la liste
      const newImages = formData.image_urls.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        image_urls: newImages
      });
      
      toast.success('Image supprimée', 'L\'image a été supprimée');
    } catch (error) {
      console.error('Erreur suppression image:', error);
      toast.error('Erreur', 'Impossible de supprimer l\'image');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-6 px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/portfolio/settings')}
            variant="ghost"
            className="mb-4 -ml-2 sm:-ml-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('portfolio.servicesSettings.backToSettings')}</span>
            <span className="sm:hidden">{t('portfolio.servicesSettings.back')}</span>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-600 mb-2">{t('portfolio.servicesSettings.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {t('portfolio.servicesSettings.subtitle')}
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gray-100 hover:bg-gray-100 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2 text-black" />
              <span className="hidden sm:inline text-black hover:scale-105">{t('portfolio.servicesSettings.addService')}</span>
              <span className="sm:hidden">{t('portfolio.servicesSettings.add')}</span>
            </Button>
          </div>
        </div>

        {/* Liste des services */}
        {services.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {t('portfolio.servicesSettings.emptyState.title')}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {t('portfolio.servicesSettings.emptyState.description')}
              </p>
              <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {t('portfolio.servicesSettings.emptyState.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {services.map((service) => {
              const IconComponent = ICONS.find(i => i.value === service.icon)?.Icon || Sparkles;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={!service.is_published ? 'opacity-60' : ''}>
                    <CardContent className="p-4 sm:p-6">
                      {/* Version mobile */}
                      <div className="block sm:hidden">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="cursor-move text-gray-600">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-600 mb-1">
                              {service.title}
                            </h3>
                            <Badge variant={service.is_published ? 'default' : 'secondary'} className="text-xs">
                              {service.is_published ? t('portfolio.servicesSettings.badges.published') : t('portfolio.servicesSettings.badges.draft')}
                            </Badge>
                          </div>
                        </div>
                        
                        {service.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 ml-13">
                            {service.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 mb-4 ml-13">
                          <div className="text-sm">
                            <span className="font-semibold text-gray-600">
                              {service.price_label ||
                                (service.price_type === 'free' ? t('portfolio.servicesSettings.price.free') :
                                 service.price_type === 'fixed' ? t('portfolio.servicesSettings.price.fixed', { price: service.price }) :
                                 service.price_type === 'from' ? t('portfolio.servicesSettings.price.from', { price: service.price }) :
                                 t('portfolio.servicesSettings.price.custom'))}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {t('portfolio.servicesSettings.cta')} {service.cta_label}
                          </div>
                          {service.linked_cards && service.linked_cards.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.linked_cards.map(card => (
                                <Badge key={card.id} variant="outline" className="text-xs">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  {card.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 ml-13">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublishMutation.mutate({
                              id: service.id,
                              is_published: !service.is_published
                            })}
                            className="h-8 w-8 p-0"
                          >
                            {service.is_published ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-600 hover:bg-gray-100 h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm(t('portfolio.servicesSettings.actions.deleteConfirm'))) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Version desktop */}
                      <div className="hidden sm:flex items-start gap-4">
                        {/* Drag handle */}
                        <div className="cursor-move text-gray-600">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-gray-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-600 mb-1">
                                {service.title}
                              </h3>
                              {service.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <Badge variant={service.is_published ? 'default' : 'secondary'}>
                              {service.is_published ? t('portfolio.servicesSettings.badges.published') : t('portfolio.servicesSettings.badges.draft')}
                            </Badge>
                          </div>

                          <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-semibold text-gray-600">
                                  {service.price_label ||
                                    (service.price_type === 'free' ? t('portfolio.servicesSettings.price.free') :
                                     service.price_type === 'fixed' ? t('portfolio.servicesSettings.price.fixed', { price: service.price }) :
                                     service.price_type === 'from' ? t('portfolio.servicesSettings.price.from', { price: service.price }) :
                                     t('portfolio.servicesSettings.price.custom'))}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {t('portfolio.servicesSettings.cta')} {service.cta_label}
                              </div>
                            </div>
                            {service.linked_cards && service.linked_cards.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {service.linked_cards.map(card => (
                                  <Badge key={card.id} variant="outline" className="text-xs">
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    {card.title}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublishMutation.mutate({
                              id: service.id,
                              is_published: !service.is_published
                            })}
                          >
                            {service.is_published ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => {
                              if (confirm(t('portfolio.servicesSettings.actions.deleteConfirm'))) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Dialog de création/édition */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingService ? t('portfolio.servicesSettings.dialog.edit') : t('portfolio.servicesSettings.dialog.new')}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t('portfolio.servicesSettings.dialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Templates */}
              {!editingService && (
                <div>
                  <Label className="mb-2 block text-sm">{t('portfolio.servicesSettings.dialog.templates')}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SERVICE_TEMPLATES.map((template, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="text-xs sm:text-sm"
                      >
                        {template.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Titre */}
              <div>
                <Label htmlFor="title" className="text-sm">{t('portfolio.servicesSettings.dialog.titleLabel')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('portfolio.servicesSettings.dialog.titlePlaceholder')}
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm">{t('portfolio.servicesSettings.dialog.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('portfolio.servicesSettings.dialog.descriptionPlaceholder')}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Images du service */}
              <div>
                <Label className="text-sm mb-2 block">
                  Images du service <span className="text-gray-500">(max 5)</span>
                </Label>
                
                {/* Grille d'images */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {formData.image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                      <img
                        src={imageUrl}
                        alt={`Service image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imageUrl, index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Bouton ajouter image */}
                  {formData.image_urls.length < 5 && (
                    <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-600 mb-1" />
                          <span className="text-xs text-gray-600 text-center px-2">
                            Ajouter image
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">
                  Formats acceptés : JPG, PNG, WebP • Taille max : 5MB • {formData.image_urls.length}/5 images
                </p>
              </div>

              {/* Icône */}
              <div>
                <Label className="text-sm">{t('portfolio.servicesSettings.dialog.iconLabel')}</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type de prix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">{t('portfolio.servicesSettings.dialog.priceTypeLabel')}</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value: PriceType) => setFormData({ ...formData, price_type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{t('portfolio.servicesSettings.dialog.priceTypeOptions.custom')}</SelectItem>
                      <SelectItem value="fixed">{t('portfolio.servicesSettings.dialog.priceTypeOptions.fixed')}</SelectItem>
                      <SelectItem value="from">{t('portfolio.servicesSettings.dialog.priceTypeOptions.from')}</SelectItem>
                      <SelectItem value="free">{t('portfolio.servicesSettings.dialog.priceTypeOptions.free')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.price_type === 'fixed' || formData.price_type === 'from') && (
                  <div>
                    <Label htmlFor="price" className="text-sm">{t('portfolio.servicesSettings.dialog.priceLabel')}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      placeholder={t('portfolio.servicesSettings.dialog.pricePlaceholder')}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Label de prix personnalisé */}
              <div>
                <Label htmlFor="price_label" className="text-sm">{t('portfolio.servicesSettings.dialog.priceCustomLabel')}</Label>
                <Input
                  id="price_label"
                  value={formData.price_label}
                  onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                  placeholder={t('portfolio.servicesSettings.dialog.priceCustomPlaceholder')}
                  className="mt-1"
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cta_label" className="text-sm">{t('portfolio.servicesSettings.dialog.ctaLabel')}</Label>
                  <Input
                    id="cta_label"
                    value={formData.cta_label}
                    onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                    placeholder={t('portfolio.servicesSettings.dialog.ctaPlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cta_url" className="text-sm">{t('portfolio.servicesSettings.dialog.ctaUrlLabel')}</Label>
                  <Input
                    id="cta_url"
                    value={formData.cta_url}
                    onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                    placeholder={t('portfolio.servicesSettings.dialog.ctaUrlPlaceholder')}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Card Selector */}
              <div className="border-t pt-4">
                <CardSelector
                  cards={userCards}
                  selectedCardIds={selectedCardIds}
                  onChange={setSelectedCardIds}
                  label={t('portfolio.servicesSettings.dialog.cardSelectorLabel')}
                  placeholder={t('portfolio.servicesSettings.dialog.cardSelectorPlaceholder')}
                  helpText={t('portfolio.servicesSettings.dialog.cardSelectorHelp')}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t('portfolio.servicesSettings.dialog.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title || createMutation.isPending || updateMutation.isPending}
                className="bg-gray-900 text-white"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingService ? t('portfolio.servicesSettings.dialog.update') : t('portfolio.servicesSettings.dialog.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PortfolioServicesSettings;

