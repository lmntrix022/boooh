import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { ImageUploader } from '@/components/common/ImageUploader';
import { FileUploader } from '@/components/common/FileUploader';
import { MultiImageUploader } from '@/components/common/MultiImageUploader';
import {
  Plus,
  Loader2,
  Package,
  Music,
  Edit,
  Trash2,
  FileText,
  Headphones,
  Download,
  Video,
  BookOpen,
  History,
  RefreshCw,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StockMovementHistory from '@/components/stock/StockMovementHistory';
import StockAdjustmentDialog from '@/components/stock/StockAdjustmentDialog';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionMessagesService from '@/services/subscriptionMessages';
import { UpgradeButton } from '@/components/ui/UpgradeButton';
import { formatAmount } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

// Types
type PhysicalProduct = Tables<'products'>;
type DigitalProduct = any;

// PRODUCT_TYPES will be defined dynamically using translations

const UnifiedProductManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Subscription hook
  const { hasFeature, planType, isLoading: subscriptionLoading, features } = useSubscription();

  // Define PRODUCT_TYPES dynamically with translations
  const PRODUCT_TYPES = [
    { value: 'music_album', label: t('productManager.types.musicAlbum'), icon: Music },
    { value: 'music_track', label: t('productManager.types.musicTrack'), icon: Music },
    { value: 'ebook_pdf', label: t('productManager.types.ebookPdf'), icon: FileText },
    { value: 'ebook_epub', label: t('productManager.types.ebookEpub'), icon: BookOpen },
    { value: 'course_video', label: t('productManager.types.courseVideo'), icon: Video },
    { value: 'course_audio', label: t('productManager.types.courseAudio'), icon: Headphones },
    { value: 'course_pdf', label: t('productManager.types.coursePdf'), icon: FileText },
    { value: 'formation_pack', label: t('productManager.types.formationPack'), icon: Download }
  ];

  // États pour les produits physiques
  const [physicalProducts, setPhysicalProducts] = useState<PhysicalProduct[]>([]);
  const [physicalLoading, setPhysicalLoading] = useState(true);
  const [physicalName, setPhysicalName] = useState('');
  const [physicalPrice, setPhysicalPrice] = useState('');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [physicalImages, setPhysicalImages] = useState<File[]>([]);
  const [physicalImagePreviews, setPhysicalImagePreviews] = useState<string[]>([]);
  const [physicalIsAvailable, setPhysicalIsAvailable] = useState(true);
  const [isCreatingPhysical, setIsCreatingPhysical] = useState(false);

  // États pour les produits numériques
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [digitalLoading, setDigitalLoading] = useState(true);
  const [digitalTitle, setDigitalTitle] = useState('');
  const [digitalDescription, setDigitalDescription] = useState('');
  const [digitalPrice, setDigitalPrice] = useState('');
  const [digitalType, setDigitalType] = useState('');
  const [digitalPreviewDuration, setDigitalPreviewDuration] = useState('30');
  const [digitalMainFile, setDigitalMainFile] = useState<File | null>(null);
  const [digitalPreviewFile, setDigitalPreviewFile] = useState<File | null>(null);
  const [digitalThumbnail, setDigitalThumbnail] = useState<File | null>(null);
  const [digitalIsFree, setDigitalIsFree] = useState(false);
  const [digitalIsPremium, setDigitalIsPremium] = useState(false);
  const [isCreatingDigital, setIsCreatingDigital] = useState(false);

  // États pour les modales
  const [activeTab, setActiveTab] = useState<'physical' | 'digital'>('physical');
  const [physicalProductToDelete, setPhysicalProductToDelete] = useState<string | null>(null);
  const [digitalProductToDelete, setDigitalProductToDelete] = useState<string | null>(null);
  const [showFormPhysical, setShowFormPhysical] = useState(false);
  const [showFormDigital, setShowFormDigital] = useState(false);

  // États pour la modification
  const [editingPhysicalProduct, setEditingPhysicalProduct] = useState<PhysicalProduct | null>(null);
  const [editingDigitalProduct, setEditingDigitalProduct] = useState<DigitalProduct | null>(null);
  const [isUpdatingPhysical, setIsUpdatingPhysical] = useState(false);
  const [isUpdatingDigital, setIsUpdatingDigital] = useState(false);

  // États pour la traçabilité du stock
  const [stockHistoryDialogOpen, setStockHistoryDialogOpen] = useState(false);
  const [stockAdjustmentDialogOpen, setStockAdjustmentDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<PhysicalProduct | null>(null);
  const [productStockData, setProductStockData] = useState<{ [key: string]: number }>({});

  // Upgrade suggestion message
  const maxProducts = features.maxProducts === -1 ? -1 : features.maxProducts; // -1 = illimité
  const upgradeSuggestion = physicalProducts.length > 0 && maxProducts !== -1 && physicalProducts.length >= maxProducts
    ? SubscriptionMessagesService.getQuotaExceededMessage(
        'product',
        physicalProducts.length,
        maxProducts,
        planType
      )
    : null;

  // Charger le stock des produits
  const loadProductStock = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('product_stock')
        .select('product_id, current_stock')
        .eq('card_id', id);

      if (error) throw error;

      const stockMap: { [key: string]: number } = {};
      (data || []).forEach(item => {
        stockMap[item.product_id] = item.current_stock || 0;
      });

      setProductStockData(stockMap);
    } catch (error) {
      // Error log removed
    }
  };

  // Charger les produits physiques
  const loadPhysicalProducts = async () => {
    if (!id) return;

    try {
      setPhysicalLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('card_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhysicalProducts(data || []);

      // Charger aussi les stocks
      await loadProductStock();
    } catch (error) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.loadPhysicalError'),
        variant: "destructive",
      });
    } finally {
      setPhysicalLoading(false);
    }
  };

  // Charger les produits numériques
  const loadDigitalProducts = async () => {
    if (!id) return;

    try {
      setDigitalLoading(true);
      const { data, error } = await supabase
        .from('digital_products' as any)
        .select('*')
        .eq('card_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDigitalProducts(data || []);
    } catch (error) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.loadDigitalError'),
        variant: "destructive",
      });
    } finally {
      setDigitalLoading(false);
    }
  };

  useEffect(() => {
    loadPhysicalProducts();
    loadDigitalProducts();
  }, [id]);

  // Gestion des images pour produits physiques
  const handlePhysicalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhysicalImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhysicalImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Créer un produit physique
  const handleCreatePhysicalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    try {
      setIsCreatingPhysical(true);

      let imageUrls: string[] = [];
      if (physicalImages.length > 0) {
        for (const image of physicalImages) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          imageUrls.push(data.publicUrl);
        }
      }

      const { error } = await supabase
        .from('products')
        .insert({
          card_id: id,
          name: physicalName,
          description: physicalDescription,
          price: parseFloat(physicalPrice),
          currency: 'FCFA',
          is_available: physicalIsAvailable,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null // Assuming one image for now
        });

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.physicalCreated'),
      });

      // Reset form
      setPhysicalName('');
      setPhysicalPrice('');
      setPhysicalDescription('');
      setPhysicalImages([]);
      setPhysicalImagePreviews([]);
      setPhysicalIsAvailable(true);
      setShowFormPhysical(false);

      loadPhysicalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.createPhysicalError'),
        variant: "destructive",
      });
    } finally {
      setIsCreatingPhysical(false);
    }
  };

  // Créer un produit numérique
  const handleCreateDigitalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    try {
      setIsCreatingDigital(true);

      // Upload des fichiers
      let mainFileUrl = null;
      let thumbnailUrl = null;

      if (digitalMainFile) {
        const fileExt = digitalMainFile.name.split('.').pop();
        const fileName = `file-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('digital-products')
          .upload(fileName, digitalMainFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('digital-products')
          .getPublicUrl(fileName);
        mainFileUrl = data.publicUrl;
      }

      if (digitalThumbnail) {
        const fileExt = digitalThumbnail.name.split('.').pop();
        const fileName = `thumbnail-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('digital-products')
          .upload(fileName, digitalThumbnail);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('digital-products')
          .getPublicUrl(fileName);
        thumbnailUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('digital_products' as any)
        .insert({
          card_id: id,
          title: digitalTitle,
          description: digitalDescription,
          price: parseFloat(digitalPrice),
          currency: 'FCFA',
          type: digitalType,
          preview_duration: parseInt(digitalPreviewDuration),
          file_url: mainFileUrl,
          thumbnail_url: thumbnailUrl,
          is_free: digitalIsFree,
          is_premium: digitalIsPremium,
          status: 'published'
        });

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.digitalCreated'),
      });

      // Reset form
      setDigitalTitle('');
      setDigitalDescription('');
      setDigitalPrice('');
      setDigitalType('');
      setDigitalPreviewDuration('30');
      setDigitalMainFile(null);
      setDigitalThumbnail(null);
      setDigitalIsFree(false);
      setDigitalIsPremium(false);
      setShowFormDigital(false);

      loadDigitalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.createDigitalError'),
        variant: "destructive",
      });
    } finally {
      setIsCreatingDigital(false);
    }
  };

  // Supprimer un produit physique
  const handleDeletePhysicalProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.physicalDeleted'),
      });

      loadPhysicalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.deletePhysicalError'),
        variant: "destructive",
      });
    }
  };

  // Supprimer un produit numérique
  const handleDeleteDigitalProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('digital_products' as any)
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.digitalDeleted'),
      });

      loadDigitalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.deleteDigitalError'),
        variant: "destructive",
      });
    }
  };

  // Modifier un produit physique
  const handleEditPhysicalProduct = (product: PhysicalProduct) => {
    setEditingPhysicalProduct(product);
    setPhysicalName(product.name);
    setPhysicalPrice(product.price.toString());
    setPhysicalDescription(product.description || '');
    setPhysicalIsAvailable(product.is_available);
    
    // Load all images from the images array if available, otherwise use image_url
    const images = (product as any).images?.map((img: any) => img.url) || [];
    setPhysicalImagePreviews(images.length > 0 ? images : (product.image_url ? [product.image_url] : []));
    
    setShowFormPhysical(true);
  };

  // Modifier un produit numérique
  const handleEditDigitalProduct = (product: any) => {
    setEditingDigitalProduct(product);
    setDigitalTitle(product.title);
    setDigitalPrice(product.price.toString());
    setDigitalDescription(product.description || '');
    setDigitalType(product.type);
    setDigitalPreviewDuration(product.preview_duration?.toString() || '30');
    setDigitalIsFree(product.is_free);
    setDigitalIsPremium(product.is_premium);
    setShowFormDigital(true);
  };

  // Mettre à jour un produit physique
  const handleUpdatePhysicalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhysicalProduct) return;

    try {
      setIsUpdatingPhysical(true);

      let imageUrls: string[] = [];
      if (physicalImages.length > 0) {
        for (const image of physicalImages) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          imageUrls.push(data.publicUrl);
        }
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: physicalName,
          description: physicalDescription,
          price: parseFloat(physicalPrice),
          is_available: physicalIsAvailable,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null // Assuming one image for now
        })
        .eq('id', editingPhysicalProduct.id);

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.physicalUpdated'),
      });

      // Reset form
      setEditingPhysicalProduct(null);
      setPhysicalName('');
      setPhysicalPrice('');
      setPhysicalDescription('');
      setPhysicalImages([]);
      setPhysicalImagePreviews([]);
      setPhysicalIsAvailable(true);

      loadPhysicalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.updatePhysicalError'),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPhysical(false);
    }
  };

  // Mettre à jour un produit numérique
  const handleUpdateDigitalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDigitalProduct) return;

    try {
      setIsUpdatingDigital(true);

      let mainFileUrl = (editingDigitalProduct as any).file_url;
      let thumbnailUrl = (editingDigitalProduct as any).thumbnail_url;

      if (digitalMainFile) {
        const fileExt = digitalMainFile.name.split('.').pop();
        const fileName = `file-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('digital-products')
          .upload(fileName, digitalMainFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('digital-products')
          .getPublicUrl(fileName);
        mainFileUrl = data.publicUrl;
      }

      if (digitalThumbnail) {
        const fileExt = digitalThumbnail.name.split('.').pop();
        const fileName = `thumbnail-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('digital-products')
          .upload(fileName, digitalThumbnail);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('digital-products')
          .getPublicUrl(fileName);
        thumbnailUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('digital_products' as any)
        .update({
          title: digitalTitle,
          description: digitalDescription,
          price: parseFloat(digitalPrice),
          type: digitalType,
          preview_duration: parseInt(digitalPreviewDuration),
          file_url: mainFileUrl,
          thumbnail_url: thumbnailUrl,
          is_free: digitalIsFree,
          is_premium: digitalIsPremium
        })
        .eq('id', (editingDigitalProduct as any).id);

      if (error) throw error;

      toast({
        title: t('productManager.toasts.success'),
        description: t('productManager.toasts.digitalUpdated'),
      });

      // Reset form
      setEditingDigitalProduct(null);
      setDigitalTitle('');
      setDigitalPrice('');
      setDigitalDescription('');
      setDigitalType('');
      setDigitalPreviewDuration('30');
      setDigitalMainFile(null);
      setDigitalThumbnail(null);
      setDigitalIsFree(false);
      setDigitalIsPremium(false);

      loadDigitalProducts();
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productManager.errors.error'),
        description: t('productManager.errors.updateDigitalError'),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDigital(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Header Apple Minimal */}
        <motion.div
            className="mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                  {/* Icon Container Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
            {t('productManager.title')}
                    </h1>
          <p
                      className="text-sm md:text-base text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
          >
            {t('productManager.description')}
          </p>
                  </div>
                </div>
            </div>
        </motion.div>

          {/* Tabs Apple Minimal */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'physical' | 'digital')} className="w-full">
            <div className="mb-6 md:mb-8">
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-2">
                <TabsList className="bg-transparent border-0 p-0 gap-2 flex justify-center items-center w-full">
              <TabsTrigger
                value="physical"
                    className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                <Package className="h-5 w-5" />
                {t('productManager.tabs.physical')}
                    <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 border border-gray-200 font-light">
                  {physicalProducts.length}
                </Badge>
              </TabsTrigger>
              {hasFeature('digitalProducts') && (
                <TabsTrigger
                  value="digital"
                      className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                >
                  <Music className="h-5 w-5" />
                  {t('productManager.tabs.digital')}
                      <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 border border-gray-200 font-light">
                    {digitalProducts.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
            </div>

          {/* Statistiques et Actions Apple Minimal */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Statistiques */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-2">
                <div className="text-xs font-light text-gray-500 mb-1"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {activeTab === 'physical' ? t('productManager.tabs.physical') : t('productManager.tabs.digital')}
                </div>
                <div className="text-lg font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {activeTab === 'physical' ? physicalProducts.length : digitalProducts.length}
                </div>
              </div>
              {activeTab === 'physical' && maxProducts !== -1 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-2">
                  <div className="text-xs font-light text-gray-500 mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    Limite
                  </div>
                  <div className="text-lg font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {physicalProducts.length} / {maxProducts}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Nouveau Produit */}
            <div className="flex justify-end">
              {hasFeature('hasEcommerce') && (maxProducts === -1 || physicalProducts.length < maxProducts) ? (
                <Button
                  onClick={() => {
                    if (activeTab === 'physical') {
                      setShowFormPhysical(!showFormPhysical);
                    } else {
                      setShowFormDigital(!showFormDigital);
                    }
                  }}
                    className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                >
                  <Plus className="w-5 h-5" />
                  {activeTab === 'physical' ? (showFormPhysical ? t('productManager.hide') : t('productManager.newProduct')) : (showFormDigital ? t('productManager.hide') : t('productManager.newProduct'))}
                </Button>
              ) : physicalProducts.length > 0 ? (
                <UpgradeButton
                  tooltip={{
                    title: upgradeSuggestion?.title || t('productManager.upgrade.title'),
                    description: upgradeSuggestion?.description || t('productManager.upgrade.description'),
                    helpText: upgradeSuggestion?.helpText || t('productManager.upgrade.helpText'),
                  }}
                  side="bottom"
                />
              ) : (
                <UpgradeButton
                  tooltip={{
                    title: t('productManager.upgrade.title'),
                    description: t('productManager.upgrade.description'),
                    helpText: t('productManager.upgrade.helpText'),
                  }}
                  side="bottom"
                />
              )}
            </div>
          </div>

          {/* Onglet Produits Physiques */}
          <TabsContent value="physical" className="space-y-6">
            {/* Formulaire pour produits physiques Apple Minimal */}
            {showFormPhysical && (
            <div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm"
                  >
                    {editingPhysicalProduct ? <Edit className="h-6 w-6 text-gray-600" /> : <Plus className="h-6 w-6 text-gray-600" />}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                    {editingPhysicalProduct ? t('productManager.physical.editTitle') : t('productManager.physical.newTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                  {editingPhysicalProduct ? t('productManager.physical.editDescription') : t('productManager.physical.newDescription')}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <div>
                <form onSubmit={editingPhysicalProduct ? handleUpdatePhysicalProduct : handleCreatePhysicalProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="physical-name" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.physical.name.label')}</Label>
                      <Input
                        id="physical-name"
                        value={physicalName}
                        onChange={(e) => setPhysicalName(e.target.value)}
                        placeholder={t('productManager.physical.name.placeholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="physical-price" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.physical.price.label')}</Label>
                      <Input
                        id="physical-price"
                        type="number"
                        value={physicalPrice}
                        onChange={(e) => setPhysicalPrice(e.target.value)}
                        placeholder={t('productManager.physical.price.placeholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical-description" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('productManager.physical.description.label')}</Label>
                    <Textarea
                      id="physical-description"
                      value={physicalDescription}
                      onChange={(e) => setPhysicalDescription(e.target.value)}
                      placeholder={t('productManager.physical.description.placeholder')}
                      rows={3}
                      className="bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm resize-none"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical-image" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('productManager.physical.images.label')}</Label>
                    <MultiImageUploader
                      label=""
                      value={physicalImagePreviews}
                      onChange={setPhysicalImagePreviews}
                      maxImages={10}
                      maxSizeMB={5}
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Switch
                      id="physical-available"
                      checked={physicalIsAvailable}
                      onCheckedChange={setPhysicalIsAvailable}
                      className="data-[state=checked]:bg-gray-900"
                    />
                    <Label htmlFor="physical-available" className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('productManager.physical.available')}</Label>
                  </div>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                    <Button
                      type="submit"
                      disabled={isCreatingPhysical || isUpdatingPhysical}
                        className="w-full rounded-lg px-6 py-3 font-light bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    >
                      {isCreatingPhysical || isUpdatingPhysical ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingPhysicalProduct ? t('productManager.physical.updating') : t('productManager.physical.creating')}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {editingPhysicalProduct ? t('productManager.physical.edit') : t('productManager.physical.create')}
                        </>
                      )}
                    </Button>
                    </div>
                    {editingPhysicalProduct && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingPhysicalProduct(null);
                          setPhysicalName('');
                          setPhysicalPrice('');
                          setPhysicalDescription('');
                          setPhysicalImages([]);
                          setPhysicalImagePreviews([]);
                          setPhysicalIsAvailable(true);
                          setShowFormPhysical(false);
                        }}
                          className="rounded-lg px-6 py-3 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-light shadow-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                      >
                        {t('productManager.cancel')}
                      </Button>
                    )}
                  </div>
                </form>
                </div>
              </div>
            </div>
            )}

            {/* Liste des produits physiques Apple Minimal */}
            <div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm"
                  >
                    <Package className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                  {t('productManager.physical.listTitle')} ({physicalProducts.length})
                    </h3>
                  </div>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <div>
                {physicalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
                  </div>
                ) : physicalProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-4"
                    >
                      <Package className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-xl font-light text-gray-900 mb-2 text-center"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('productManager.physical.noProducts')}
                    </p>
                    <p className="text-gray-600 text-center max-w-xs font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('productManager.physical.startAdding')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {physicalProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-sm transition-all duration-200 overflow-hidden"
                      >
                        <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-light text-gray-900 truncate text-lg"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                            }}
                          >{product.name}</h3>
                          <Badge variant={product.is_available ? "default" : "secondary"} className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                            {product.is_available ? t('productManager.physical.available') : t('productManager.physical.unavailable')}
                          </Badge>
                        </div>

                        <p className="text-2xl font-light text-gray-900 mb-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >{formatAmount(product.price)}</p>

                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{product.description}</p>
                        )}

                        {product.image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}

                        {productStockData[product.id] !== undefined && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-700 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{t('productManager.physical.stock')}:</span>
                              <Badge variant="secondary" className="bg-gray-900 text-white border-0 rounded-lg font-light">
                                {productStockData[product.id]} {t('productManager.physical.units')}
                              </Badge>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPhysicalProduct(product)}
                              className="rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-light shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {t('productManager.physical.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProductForStock(product);
                              setStockHistoryDialogOpen(true);
                            }}
                              className="rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-light shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                          >
                            <History className="w-4 h-4 mr-1" />
                            {t('productManager.physical.history')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProductForStock(product);
                              setStockAdjustmentDialogOpen(true);
                            }}
                              className="rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-light shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {t('productManager.physical.adjust')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPhysicalProductToDelete(product.id)}
                              className="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 font-light shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {t('productManager.physical.delete')}
                          </Button>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Produits Numériques */}
          <TabsContent value="digital" className="space-y-6">
            {/* Formulaire pour produits numériques Apple Minimal */}
            {showFormDigital && (
            <div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm"
                  >
                    {editingDigitalProduct ? <Edit className="h-6 w-6 text-gray-600" /> : <Plus className="h-6 w-6 text-gray-600" />}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                    {editingDigitalProduct ? t('productManager.digital.editTitle') : t('productManager.digital.newTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                  {editingDigitalProduct ? t('productManager.digital.editDescription') : t('productManager.digital.newDescription')}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <div>
                <form onSubmit={editingDigitalProduct ? handleUpdateDigitalProduct : handleCreateDigitalProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="digital-title" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.title.label')}</Label>
                      <Input
                        id="digital-title"
                        value={digitalTitle}
                        onChange={(e) => setDigitalTitle(e.target.value)}
                        placeholder={t('productManager.digital.title.placeholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digital-price" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.price.label')}</Label>
                      <Input
                        id="digital-price"
                        type="number"
                        value={digitalPrice}
                        onChange={(e) => setDigitalPrice(e.target.value)}
                        placeholder={t('productManager.digital.price.placeholder')}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        required
                        disabled={digitalIsFree}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="digital-description" className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('productManager.digital.description.label')}</Label>
                    <Textarea
                      id="digital-description"
                      value={digitalDescription}
                      onChange={(e) => setDigitalDescription(e.target.value)}
                      placeholder={t('productManager.digital.description.placeholder')}
                      rows={3}
                      className="bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm resize-none"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="digital-type" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.type.label')}</Label>
                      <Select value={digitalType} onValueChange={setDigitalType} required>
                        <SelectTrigger className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm">
                          <SelectValue placeholder={t('productManager.digital.type.placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          {PRODUCT_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value} className="rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-gray-900" />
                                  <span className="text-gray-900">{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digital-preview-duration" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.previewDuration.label')}</Label>
                      <Input
                        id="digital-preview-duration"
                        type="number"
                        value={digitalPreviewDuration}
                        onChange={(e) => setDigitalPreviewDuration(e.target.value)}
                        placeholder="30"
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      />
                    </div>
                  </div>

                  {/* Upload de fichiers */}
                  <div className="space-y-4">
                    <Label className="font-light text-gray-900 text-lg"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('productManager.digital.files.label')}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="digital-main-file" className="text-sm font-medium text-gray-700">{t('productManager.digital.files.mainFile')}</Label>
                        <FileUploader
                          label=""
                          value={digitalMainFile}
                          onChange={setDigitalMainFile}
                          maxSizeMB={50}
                          accept="*/*"
                          existingFileUrl={editingDigitalProduct?.file_url}
                          existingFileName={editingDigitalProduct?.file_url ? t('productManager.digital.files.mainFileUploaded') : undefined}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="digital-thumbnail" className="text-sm font-medium text-gray-700">{t('productManager.digital.files.thumbnail')}</Label>
                        <FileUploader
                          label=""
                          value={digitalThumbnail}
                          onChange={setDigitalThumbnail}
                          maxSizeMB={5}
                          accept="image/*"
                          existingFileUrl={editingDigitalProduct?.thumbnail_url}
                          existingFileName={editingDigitalProduct?.thumbnail_url ? t('productManager.digital.files.thumbnailUploaded') : undefined}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="digital-free"
                        checked={digitalIsFree}
                        onCheckedChange={(checked) => {
                          setDigitalIsFree(checked);
                          if (checked) setDigitalPrice('0');
                        }}
                        className="data-[state=checked]:bg-gray-900"
                      />
                      <Label htmlFor="digital-free" className="font-light text-gray-900 cursor-pointer"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.free')}</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="digital-premium"
                        checked={digitalIsPremium}
                        onCheckedChange={setDigitalIsPremium}
                        className="data-[state=checked]:bg-gray-900"
                      />
                      <Label htmlFor="digital-premium" className="font-light text-gray-900 cursor-pointer"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('productManager.digital.premium')}</Label>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={isCreatingDigital || isUpdatingDigital}
                      className="flex-1 rounded-lg px-6 py-3 font-light bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {isCreatingDigital || isUpdatingDigital ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingDigitalProduct ? t('productManager.digital.updating') : t('productManager.digital.creating')}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {editingDigitalProduct ? t('productManager.digital.edit') : t('productManager.digital.create')}
                        </>
                      )}
                    </Button>
                    {editingDigitalProduct && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingDigitalProduct(null);
                          setDigitalTitle('');
                          setDigitalPrice('');
                          setDigitalDescription('');
                          setDigitalType('');
                          setDigitalPreviewDuration('30');
                          setDigitalMainFile(null);
                          setDigitalThumbnail(null);
                          setDigitalIsFree(false);
                          setDigitalIsPremium(false);
                          setShowFormDigital(false);
                        }}
                        className="rounded-lg px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-light shadow-sm transition-all duration-200"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('productManager.cancel')}
                      </Button>
                    )}
                  </div>
                </form>
                </div>
              </div>
            </div>
            )}

            {/* Liste des produits numériques Apple Minimal */}
            <div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm"
                  >
                    <Music className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                  {t('productManager.digital.listTitle')} ({digitalProducts.length})
                    </h3>
                  </div>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <div>
                {digitalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
                  </div>
                ) : digitalProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-4"
                    >
                      <Music className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-xl font-light text-gray-900 mb-2 text-center"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('productManager.digital.noProducts')}
                    </p>
                    <p className="text-gray-600 text-center max-w-xs font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('productManager.digital.startAdding')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {digitalProducts.map((product: any, index: number) => {
                      const productType = PRODUCT_TYPES.find(t => t.value === product.type);
                      const TypeIcon = productType?.icon || Music;

                      return (
                        <div
                          key={product.id}
                          className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-sm transition-all duration-200 overflow-hidden"
                        >
                          <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                  className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm"
                                >
                                  <TypeIcon className="h-5 w-5 text-gray-600" />
                                </div>
                                <h3 className="font-light text-gray-900 truncate text-lg"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{product.title}</h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {product.is_free ? (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">{t('productManager.digital.free')}</Badge>
                            ) : (
                                <p className="text-xl font-light text-gray-900"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{formatAmount(product.price)}</p>
                            )}
                            {product.is_premium && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">{t('productManager.digital.premium')}</Badge>
                            )}
                              <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                              {product.status === 'published' ? t('productManager.digital.published') : t('productManager.digital.draft')}
                            </Badge>
                          </div>

                          {product.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{product.description}</p>
                          )}

                          {product.thumbnail_url && (
                              <div className="mb-3 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <img
                                  src={product.thumbnail_url}
                                  alt={product.title}
                                  className="w-full h-32 object-cover"
                                />
                            </div>
                          )}

                            <div className="text-xs text-gray-600 mb-3 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                            <p className="flex items-center gap-1">
                              <TypeIcon className="w-3 h-3" />
                              {productType?.label || t('productManager.digital.productType')}
                            </p>
                            {product.preview_duration && (
                              <p className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {t('productManager.digital.preview')}: {product.preview_duration}s
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDigitalProduct(product)}
                                  className="w-full rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-light shadow-sm"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              {t('productManager.digital.edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDigitalProduct(product.id)}
                                  className="w-full rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 font-light shadow-sm"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {t('productManager.digital.delete')}
                            </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>

          {/* Dialogues pour la traçabilité du stock Apple Minimal */}
      {selectedProductForStock && (
        <>
          <Dialog open={stockHistoryDialogOpen} onOpenChange={setStockHistoryDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto border border-gray-200 bg-white rounded-lg shadow-sm">
              <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl md:text-3xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <History className="h-5 w-5 text-gray-600" />
                      </div>
                  {t('productManager.stock.historyTitle')} - {selectedProductForStock.name}
                </DialogTitle>
                    <DialogDescription className="text-gray-600 text-base font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                  {t('productManager.stock.historyDescription')}
                </DialogDescription>
              </DialogHeader>
              <StockMovementHistory
                productId={selectedProductForStock.id}
                cardId={id!}
                productName={selectedProductForStock.name}
              />
            </DialogContent>
          </Dialog>

          <StockAdjustmentDialog
            open={stockAdjustmentDialogOpen}
            onOpenChange={setStockAdjustmentDialogOpen}
            productId={selectedProductForStock.id}
            cardId={id!}
            productName={selectedProductForStock.name}
            currentStock={productStockData[selectedProductForStock.id] || 0}
            onSuccess={() => {
              loadProductStock();
              toast({
                title: t('productManager.stock.adjustedTitle'),
                description: t('productManager.stock.adjustedDescription')
              });
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default UnifiedProductManager;
