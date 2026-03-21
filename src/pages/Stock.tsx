import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Filter, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Loader2,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Calendar,
  Tag,
  Building,
  AlertCircle,
  RefreshCw,
  Square,
  CheckSquare,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Clipboard,
  RotateCw,
  Grid3X3,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StockService, StockItem, StockMovement, CreateStockItemData } from '@/services/stockService';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { formatAmount } from '@/utils/format';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventorySection from '@/components/stock/InventorySection';
import StockMovementsView from '@/components/stock/StockMovementsView';


// Fonction utilitaire pour formater les grands nombres
const formatLargeNumber = (value: number): string => {
  if (value < 100000) {
    // Moins de 6 chiffres : affichage normal
    return value.toLocaleString('fr-FR');
  } else if (value < 1000000) {
    // De 100K à 999K
    return `${(value / 1000).toFixed(0)}K`;
  } else if (value < 1000000000) {
    // De 1M à 999M
    return `${(value / 1000000).toFixed(2)}M`;
  } else {
    // 1B et plus
    return `${(value / 1000000000).toFixed(2)}B`;
  }
};

const Stock: React.FC = () => {
  const { user } = useAuth();
  const { id: cardId } = useParams();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  
  // États
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [movementsByProduct, setMovementsByProduct] = useState<Record<string, StockMovement[]>>({});
  const [openHistoryFor, setOpenHistoryFor] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<{ id: string; name: string }[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in'|'out'|'adjustment'>('in');
  const [movementQty, setMovementQty] = useState<number>(0);
  const [movementReason, setMovementReason] = useState<string>('');
  const [movementProductId, setMovementProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'inventaire' | 'mouvements'>('articles');
  
  // États pour les modales
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [viewItemOpen, setViewItemOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [itemToView, setItemToView] = useState<StockItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit_price: 0,
    supplier: '',
    location: '',
    tags: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Charger la liste des cartes si route globale
  useEffect(() => {
    const loadCards = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select('id, title, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const cards = (data || []).map((c: any) => ({ id: c.id, name: c.title || c.name || c.id }));
        setAvailableCards(cards);
        if (!cardId && cards.length > 0 && !selectedCardId) {
          setSelectedCardId(cards[0].id);
        }
      } catch (e) {
        // Error log removed
      }
    };
    loadCards();
  }, [user?.id, cardId, selectedCardId]);

  // Use ref for toast to prevent infinite re-renders
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Charger les données de stock (products + product_stock via card_id ou user)
  useEffect(() => {
    const loadStockData = async () => {
      if (!cardId && !user?.id) return;
      
      setIsLoading(true);
      try {
        const effectiveCardId = cardId || selectedCardId || undefined;
        const items = effectiveCardId
          ? await StockService.getCardStock(effectiveCardId)
          : await StockService.getUserStock(user!.id);
        setStockItems(items);
        // Pré-charger les derniers mouvements pour la carte si présente
        if (effectiveCardId) {
          const recent: Record<string, StockMovement[]> = {};
          for (const it of items) {
            const mvts = await StockService.getCardMovements(effectiveCardId, it.id);
            recent[it.id] = (mvts || []).slice(0, 10);
          }
          setMovementsByProduct(recent);
        } else {
          setMovementsByProduct({});
        }
      } catch (error) {
        // Error log removed
        toastRef.current({
          title: t('stock.toasts.errorLoading.title'),
          description: t('stock.toasts.errorLoading.description'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStockData();
  }, [cardId, selectedCardId, user?.id, t]);

  // Filtrer les articles
  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stockItems, searchQuery, filterCategory, filterStatus]);

  // Statistiques
  const stats = useMemo(() => {
    const total = stockItems.length;
    const inStock = stockItems.filter(item => item.status === 'in_stock').length;
    const lowStock = stockItems.filter(item => item.status === 'low_stock').length;
    const outOfStock = stockItems.filter(item => item.status === 'out_of_stock').length;
    const totalValue = stockItems.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0);
    
    return { total, inStock, lowStock, outOfStock, totalValue };
  }, [stockItems]);

  // Gestion des sélections
  const handleSelectItem = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  // Gestion des formulaires
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async () => {
    if (!cardId) {
      toast({ title: t('stock.toasts.cardRequired.title'), description: t('stock.toasts.cardRequired.description'), variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const newProductId = await StockService.createProductWithStock(cardId, formData.name, formData.description, formData.current_stock);
      const items = await StockService.getCardStock(cardId);
      setStockItems(items);
      setAddItemOpen(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        sku: '',
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        unit_price: 0,
        supplier: '',
        location: '',
        tags: [],
      });
      
      toast({
        title: t('stock.toasts.itemAdded.title'),
        description: t('stock.toasts.itemAdded.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('stock.toasts.errorAdding.title'),
        description: t('stock.toasts.errorAdding.description'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = (item: StockItem) => {
    setItemToEdit(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      sku: item.sku,
      current_stock: item.current_stock,
      min_stock: item.min_stock,
      max_stock: item.max_stock,
      unit_price: item.unit_price,
      supplier: item.supplier || '',
      location: item.location || '',
      tags: item.tags || [],
    });
    setEditItemOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!itemToEdit || !cardId) return;
    
    setIsSaving(true);
    try {
      await StockService.updateProductAndStock(cardId, itemToEdit.id, formData.name, formData.description, formData.current_stock);
      const items = await StockService.getCardStock(cardId);
      setStockItems(items);
      
      setEditItemOpen(false);
      setItemToEdit(null);
      
      toast({
        title: t('stock.toasts.itemModified.title'),
        description: t('stock.toasts.itemModified.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('stock.toasts.errorEditing.title'),
        description: t('stock.toasts.errorEditing.description'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: StockItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !cardId) return;
    
    try {
      await StockService.deleteProductAndStock(cardId, itemToDelete.id);
      const items = await StockService.getCardStock(cardId);
      setStockItems(items);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      
      toast({
        title: t('stock.toasts.itemDeleted.title'),
        description: t('stock.toasts.itemDeleted.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('stock.toasts.errorDeleting.title'),
        description: t('stock.toasts.errorDeleting.description'),
        variant: "destructive",
      });
    }
  };

  // Mouvement rapide
  const handleMovement = async (productId: string, type: 'in'|'out'|'adjustment') => {
    setMovementProductId(productId);
    setMovementType(type);
    setMovementQty(0);
    setMovementReason('');
    setMovementOpen(true);
  };

  const submitMovement = async () => {
    if (!movementProductId) return;
    const qty = movementQty;
    if (isNaN(qty) || qty < 0) return;
    const reason = movementReason || undefined;
    try {
      const newStock = await StockService.recordProductMovement(cardId, movementProductId, movementType, qty, reason);
      setStockItems(prev => prev.map(i => i.id === movementProductId ? { ...i, current_stock: newStock, status: newStock === 0 ? 'out_of_stock' : 'in_stock' } : i));
      // Rafraîchir l'historique de ce produit
      if (cardId) {
        const mvts = await StockService.getCardMovements(cardId, movementProductId);
        setMovementsByProduct(prev => ({ ...prev, [movementProductId]: (mvts || []).slice(0, 20) }));
      }
      toast({ 
        title: t('stock.toasts.movementRecorded.title'), 
        description: t(`stock.toasts.movementRecorded.description.${movementType}`)
      });
      setMovementOpen(false);
    } catch (e) {
      // Error log removed
      toast({ title: t('stock.toasts.errorMovement.title'), description: t('stock.toasts.errorMovement.description'), variant: 'destructive' });
    }
  };

  const toggleHistory = async (productId: string) => {
    const effectiveCardId = cardId || selectedCardId || undefined;
    if (!effectiveCardId) return;
    const isOpen = openHistoryFor === productId;
    if (isOpen) {
      setOpenHistoryFor(null);
      return;
    }
    setOpenHistoryFor(productId);
    if (!movementsByProduct[productId]) {
      const mvts = await StockService.getCardMovements(effectiveCardId, productId);
      setMovementsByProduct(prev => ({ ...prev, [productId]: (mvts || []).slice(0, 20) }));
    }
  };

  const handleViewItem = (item: StockItem) => {
    setItemToView(item);
    setViewItemOpen(true);
  };

  // Obtenir le statut avec badge grayscale
  const getStatusBadge = (status: string) => {
    const statusKey = status === 'in_stock' ? 'inStock' : 
                     status === 'low_stock' ? 'lowStock' : 
                     status === 'out_of_stock' ? 'outOfStock' : 
                     status === 'discontinued' ? 'discontinued' : 'unknown';
    return (
      <Badge className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        {t(`stock.status.${statusKey}`)}
      </Badge>
    );
  };

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(stockItems.map(item => item.category))];
    return cats.sort();
  }, [stockItems]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500 font-light" />
            <p className="text-gray-900">{t('stock.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <div className="container max-w-7xl py-6 px-4 md:px-6 relative z-10">
          {/* Header Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left: Icon + Title */}
                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-600" />
                      </div>
                    
                    {/* Title Section */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                              {t('stock.title')}
                        </h1>
                    <p className="text-gray-500 text-base font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                        >
                          {t('stock.description')}
                    </p>
                    </div>
                  </div>
                  
                  {/* Right: Stats Badge */}
                  {stockItems.length > 0 && (
                  <div className="hidden lg:flex items-center">
                    <div className="px-5 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <div className="flex flex-col">
                          <span className="text-2xl font-light tracking-tight text-gray-900 leading-none"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                              {stockItems.length}
                            </span>
                          <span className="text-xs font-light text-gray-500 uppercase tracking-wide"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                              {t('stock.stats.totalArticles')}
                            </span>
                          </div>
                        </div>
                      </div>
                  </div>
                  )}
              </div>
            </div>
          </motion.div>

          {/* Actions Bar Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex flex-row items-center justify-center xl:justify-between gap-3 xl:gap-6">
                {/* Center: Primary Actions Group */}
                  <div className="flex items-center justify-center gap-3 w-full xl:w-auto">
                  {/* Add Button */}
            <Button
              onClick={() => setAddItemOpen(true)}
                        size="icon"
                    className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm transition-all duration-200 font-light"
                          style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </Button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg border border-gray-200 p-1">
                      <Button
                        onClick={() => setViewMode('grid')}
                        variant="ghost"
                        size="sm"
                      className={`relative rounded-md transition-all duration-200 px-3 md:px-4 py-2 font-light ${
                          viewMode === 'grid'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                      <Button
                        onClick={() => setViewMode('list')}
                        variant="ghost"
                        size="sm"
                      className={`relative rounded-md transition-all duration-200 px-3 md:px-4 py-2 font-light ${
                          viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <List className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                  </div>
                  </div>
                  
                  {/* Right: Selection Actions Group */}
                  {selectedItems.size > 0 && (
                  <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                        <span className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                            {selectedItems.size} {selectedItems.size === 1 ? t('stock.selection.selected') : t('stock.selection.selectedPlural')}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleClearSelection}
                        variant="outline"
                        size="sm"
                      className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg px-4 py-2 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        {t('stock.selection.clear')}
                      </Button>
                  </div>
                  )}
              </div>
            </div>
          </motion.div>

          {/* Statistiques Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {[
                { 
                  label: t('stock.stats.totalArticles'), 
                  value: stats.total, 
                  icon: Package
                },
                { 
                  label: t('stock.stats.inStock'), 
                  value: stats.inStock, 
                  icon: CheckCircle
                },
                { 
                  label: t('stock.stats.lowStock'), 
                  value: stats.lowStock, 
                  icon: AlertTriangle
                },
                { 
                  label: t('stock.stats.outOfStock'), 
                  value: stats.outOfStock, 
                  icon: AlertCircle
                },
                { 
                  label: t('stock.stats.totalValue'), 
                  value: formatAmount(stats.totalValue), 
                  icon: DollarSign
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-light text-gray-500 uppercase tracking-wide mb-2"
                      style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                            {stat.label}
                          </p>
                      <p className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 leading-none"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                          >
                            {stat.value}
                      </p>
                        </div>
                        
                    {/* Icon Container */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      </div>
                      </div>
          </div>
              ))}
            </div>
          </motion.div>

          {/* Filtres et recherche Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <div className="flex flex-row items-center gap-2 flex-wrap">
                {/* Bouton sélectionner tout */}
                  {filteredItems.length > 0 && (
                      <Button
                        onClick={handleSelectAll}
                        variant="outline"
                        size="icon"
                    className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg"
                  >
                        {selectedItems.size === filteredItems.length ? (
                      <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                      <Square className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </Button>
                  )}
                  
                {/* Barre de recherche */}
                  <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={t('stock.search.placeholder') || 'Rechercher...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2 md:py-2.5 rounded-lg bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-gray-900 text-sm font-light transition-all duration-200"
                          style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                          }}
                    />
                  </div>
                </div>

                {/* Filtre Carte (si pas de cardId) */}
                {!cardId && (
                  <Select value={selectedCardId || ''} onValueChange={setSelectedCardId}>
                    <SelectTrigger className="w-10 h-10 md:w-auto md:min-w-[120px] rounded-lg bg-white border border-gray-200 text-gray-900 font-light py-2 md:py-2.5 px-2 md:px-3 hover:border-gray-900 transition-all duration-200 shadow-sm"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                          <Building className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">
                            <SelectValue />
                          </span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-sm rounded-lg">
                      {availableCards.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-md font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {/* Filtre Catégorie */}
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-10 h-10 md:w-auto md:min-w-[120px] rounded-lg bg-white border border-gray-200 text-gray-900 font-light py-2 md:py-2.5 px-2 md:px-3 hover:border-gray-900 transition-all duration-200 shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                        <Tag className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">
                          <SelectValue />
                        </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-sm rounded-lg">
                    <SelectItem value="all" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.search.allCategories')}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="rounded-md font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Filtre Statut */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-10 h-10 md:w-auto md:min-w-[120px] rounded-lg bg-white border border-gray-200 text-gray-900 font-light py-2 md:py-2.5 px-2 md:px-3 hover:border-gray-900 transition-all duration-200 shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Filter className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">
                          <SelectValue />
                        </span>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-sm rounded-lg">
                    <SelectItem value="all" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.search.allStatuses')}</SelectItem>
                    <SelectItem value="in_stock" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.status.inStock')}</SelectItem>
                    <SelectItem value="low_stock" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.status.lowStock')}</SelectItem>
                    <SelectItem value="out_of_stock" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.status.outOfStock')}</SelectItem>
                    <SelectItem value="discontinued" className="rounded-md font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.status.discontinued')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Système d'onglets Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-lg p-0 gap-1">
              <TabsTrigger 
                value="articles"
                    className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 rounded-md px-4 py-2.5 transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                <Package className="w-4 h-4" />
                    <span>{t('stock.tabs.articles')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mouvements"
                    className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 rounded-md px-4 py-2.5 transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                <RotateCw className="w-4 h-4" />
                    <span>{t('stock.tabs.movements')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inventaire"
                    className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 rounded-md px-4 py-2.5 transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
              >
                <Clipboard className="w-4 h-4" />
                    <span>{t('stock.tabs.inventory')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Articles */}
            <TabsContent value="articles" className="space-y-4 mt-4">
              {/* Liste des articles Apple Minimal */}
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-6">
                    <Package className="w-8 h-8 text-gray-600" />
                    </div>
                  <h3 className="text-xl font-light tracking-tight text-gray-900 mb-3"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                      {t('stock.empty.title')}
                    </h3>
                  <p className="text-gray-500 mb-6 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                      {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                        ? t('stock.empty.noResults')
                        : t('stock.empty.noItems')}
                    </p>
                    <Button
                      onClick={() => setAddItemOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-sm transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                      {t('stock.addItem')}
                    </Button>
                  </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" : "space-y-4"}>
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        whileHover={{ 
                          scale: 1.03, 
                          y: -8,
                          transition: { duration: 0.3 }
                        }}
                        className="group"
                      >
                        <div
                          className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
                            selectedItems.has(item.id) 
                              ? 'ring-2 ring-gray-400 bg-gray-50 border-gray-300' 
                              : ''
                          }`}
                        >
                          <div className="p-5">
                            {viewMode === 'list' ? (
                              // Vue liste
                              <div className="flex items-center gap-4">
                                <motion.button 
                                  onClick={() => handleSelectItem(item.id)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="flex-shrink-0 w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 hover:border-gray-900 transition-all duration-200 bg-white shadow-sm"
                                >
                                  {selectedItems.has(item.id) && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                    <CheckSquare className="w-4 h-4 text-gray-900" />
                                    </motion.div>
                                  )}
                                </motion.button>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-light text-gray-900 truncate"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        fontWeight: 300,
                                        letterSpacing: '-0.01em',
                                      }}
                                    >{item.name}</h3>
                                    {getStatusBadge(item.status)}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    <span className="flex items-center gap-1">
                                      <Package className="w-4 h-4" />
                                      {item.current_stock} {t('stock.item.inStock')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Tag className="w-4 h-4" />
                                      {item.sku}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      {formatAmount(item.unit_price)}
                                    </span>
                                  </div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-sm rounded-lg">
                                    <DropdownMenuItem onClick={() => handleViewItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <Eye className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.view')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <Edit className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMovement(item.id, 'in')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <ArrowDownCircle className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.entry')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMovement(item.id, 'out')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <ArrowUpCircle className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.exit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMovement(item.id, 'adjustment')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <RefreshCw className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.adjust')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <div className="p-1.5 bg-gray-100 rounded-md">
                                        <Trash2 className="w-4 h-4 text-gray-600" />
                                      </div>
                                      {t('stock.actions.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ) : (
                              // Vue grille
                              <div className="space-y-4">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <motion.button 
                                      onClick={() => handleSelectItem(item.id)}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="flex-shrink-0 w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 hover:border-gray-900 transition-all duration-200 bg-white shadow-sm"
                                    >
                                      {selectedItems.has(item.id) && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                        >
                                        <CheckSquare className="w-4 h-4 text-gray-900" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-light text-gray-900 mb-1 truncate"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                          fontWeight: 300,
                                          letterSpacing: '-0.01em',
                                        }}
                                      >{item.name}</h3>
                                      <p className="text-sm text-gray-500 truncate font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >{item.sku}</p>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md hover:bg-gray-100">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-sm rounded-lg">
                                      <DropdownMenuItem onClick={() => handleViewItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <Eye className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.view')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <Edit className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.edit')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMovement(item.id, 'in')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <ArrowDownCircle className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.entry')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMovement(item.id, 'out')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <ArrowUpCircle className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.exit')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMovement(item.id, 'adjustment')} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <RefreshCw className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.adjust')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteItem(item)} className="flex items-center gap-3 px-3 py-2 text-gray-500 font-light hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                          <Trash2 className="w-4 h-4 text-gray-600" />
                                        </div>
                                        {t('stock.actions.delete')}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                <div className="space-y-2 pt-4 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{t('stock.item.currentStock')}</span>
                                    <span className="font-light text-gray-900"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{item.current_stock}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{t('stock.item.unitPrice')}</span>
                                    <span className="font-light text-gray-900"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{formatAmount(item.unit_price)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{t('stock.item.value')}</span>
                                    <span className="font-light text-gray-900"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {formatAmount(item.current_stock * item.unit_price)}
                                    </span>
                                  </div>
                                </div>
                                
                                {cardId && (
                                  <div className="mt-2 pt-4 border-t border-gray-200/50">
                                    <button
                                      onClick={() => toggleHistory(item.id)}
                                      className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <History className="w-3.5 h-3.5" />
                                      {openHistoryFor === item.id ? t('stock.actions.hideHistory') : t('stock.actions.viewHistory')}
                                    </button>
                                    {openHistoryFor === item.id && (
                                      <div className="mt-2 pt-2 max-h-48 overflow-auto text-xs text-gray-500 space-y-1 font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >
                                        {(movementsByProduct[item.id] || []).length === 0 ? (
                                          <div className="text-gray-400">{t('stock.item.noMovements')}</div>
                                        ) : (
                                          <ul className="space-y-1">
                                            {(movementsByProduct[item.id] || []).map((m, idx) => (
                                              <li key={idx} className="flex items-center justify-between py-1">
                                                <span className="capitalize">{m.movement_type}</span>
                                                <span className="tabular-nums">{m.quantity}</span>
                                                <span>{format(new Date(m.created_at), 'dd/MM HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS })}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                  {getStatusBadge(item.status)}
                                  <span className="text-xs text-gray-500 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {format(new Date(item.last_updated), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* Onglet Mouvements */}
            <TabsContent value="mouvements" className="space-y-4">
              <StockMovementsView
                cardId={cardId || selectedCardId || ''}
                stockItems={filteredItems}
              />
            </TabsContent>

            {/* Onglet Inventaire */}
            <TabsContent value="inventaire" className="space-y-4">
              <InventorySection
                cardId={cardId || selectedCardId || ''}
                stockItems={filteredItems}
              />
            </TabsContent>
          </Tabs>
            </div>
          </motion.div>

          {/* Modal Mouvement */}
          <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-sm rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{t('stock.movement.title')}</DialogTitle>
                <DialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.movement.description')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('stock.movement.type')}</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Button 
                      variant={movementType==='in'?'default':'outline'} 
                      onClick={() => setMovementType('in')}
                      className={movementType==='in' ? 'bg-gray-900 hover:bg-gray-800 text-white font-light' : 'font-light'}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.movement.entry')}</Button>
                    <Button 
                      variant={movementType==='out'?'default':'outline'} 
                      onClick={() => setMovementType('out')}
                      className={movementType==='out' ? 'bg-gray-900 hover:bg-gray-800 text-white font-light' : 'font-light'}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.movement.exit')}</Button>
                    <Button 
                      variant={movementType==='adjustment'?'default':'outline'} 
                      onClick={() => setMovementType('adjustment')}
                      className={movementType==='adjustment' ? 'bg-gray-900 hover:bg-gray-800 text-white font-light' : 'font-light'}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('stock.movement.adjustment')}</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{movementType==='adjustment' ? t('stock.movement.newStock') : t('stock.movement.quantity')}</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={movementQty} 
                    onChange={e=>setMovementQty(parseInt(e.target.value||'0',10))} 
                    className="mt-1 bg-white text-gray-900 border border-gray-200 rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('stock.movement.reason')}</Label>
                  <Input 
                    value={movementReason} 
                    onChange={e=>setMovementReason(e.target.value)} 
                    className="mt-1 bg-white text-gray-900 border border-gray-200 rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('stock.movement.cancel')}</Button>
                </DialogClose>
                <Button onClick={submitMovement} className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('stock.movement.validate')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modales */}
          {/* Modale d'ajout d'article */}
          <AlertDialog open={addItemOpen} onOpenChange={setAddItemOpen}>
            <AlertDialogContent className="max-w-2xl bg-white border border-gray-200 shadow-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('stock.dialogs.addItem.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.dialogs.addItem.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.name')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder={t('stock.dialogs.addItem.namePlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sku" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.sku')}
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleFormChange('sku', e.target.value)}
                      placeholder={t('stock.dialogs.addItem.skuPlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                    <Label htmlFor="description" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                    {t('stock.dialogs.addItem.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder={t('stock.dialogs.addItem.descriptionPlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.category')}
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      placeholder={t('stock.dialogs.addItem.categoryPlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="current_stock" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.currentStock')}
                    </Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => handleFormChange('current_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit_price" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.unitPrice')}
                    </Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => handleFormChange('unit_price', parseFloat(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_stock" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.minStock')}
                    </Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => handleFormChange('min_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max_stock" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.maxStock')}
                    </Label>
                    <Input
                      id="max_stock"
                      type="number"
                      value={formData.max_stock}
                      onChange={(e) => handleFormChange('max_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.supplier')}
                    </Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => handleFormChange('supplier', e.target.value)}
                      placeholder={t('stock.dialogs.addItem.supplierPlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-sm font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.dialogs.addItem.location')}
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      placeholder={t('stock.dialogs.addItem.locationPlaceholder')}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.dialogs.addItem.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAddItem}
                  disabled={isSaving || !formData.name || !formData.sku || !formData.category}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('stock.dialogs.addItem.adding')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('stock.dialogs.addItem.add')}
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modale de modification d'article */}
          <AlertDialog open={editItemOpen} onOpenChange={setEditItemOpen}>
            <AlertDialogContent className="max-w-2xl bg-white border border-gray-200 shadow-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('stock.dialogs.editItem.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.dialogs.editItem.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name" className="text-sm font-light text-gray-900">
                      {t('stock.dialogs.addItem.name')}
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-sku" className="text-sm font-light text-gray-900">
                      {t('stock.dialogs.addItem.sku')}
                    </Label>
                    <Input
                      id="edit-sku"
                      value={formData.sku}
                      onChange={(e) => handleFormChange('sku', e.target.value)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-light text-gray-900">
                    {t('stock.dialogs.addItem.description')}
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="mt-1 bg-white border border-gray-200 shadow focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 font-light text-gray-900 px-4 py-3 rounded-lg"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-category" className="text-sm font-light text-gray-900">
                      {t('stock.dialogs.addItem.category')}
                    </Label>
                    <Input
                      id="edit-category"
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-current_stock" className="text-sm font-light text-gray-900">
                      Stock actuel *
                    </Label>
                    <Input
                      id="edit-current_stock"
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => handleFormChange('current_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-unit_price" className="text-sm font-light text-gray-900">
                      Prix unitaire *
                    </Label>
                    <Input
                      id="edit-unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => handleFormChange('unit_price', parseFloat(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-min_stock" className="text-sm font-light text-gray-900">
                      Stock minimum
                    </Label>
                    <Input
                      id="edit-min_stock"
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => handleFormChange('min_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-max_stock" className="text-sm font-light text-gray-900">
                      Stock maximum
                    </Label>
                    <Input
                      id="edit-max_stock"
                      type="number"
                      value={formData.max_stock}
                      onChange={(e) => handleFormChange('max_stock', parseInt(e.target.value) || 0)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-supplier" className="text-sm font-light text-gray-900">
                      Fournisseur
                    </Label>
                    <Input
                      id="edit-supplier"
                      value={formData.supplier}
                      onChange={(e) => handleFormChange('supplier', e.target.value)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-location" className="text-sm font-light text-gray-900">
                      Emplacement
                    </Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      className="mt-1 bg-white border border-gray-200 shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 text-gray-900 px-4 py-3 rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg font-light">
                  {t('stock.dialogs.addItem.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSaveEdit}
                  disabled={isSaving || !formData.name || !formData.sku || !formData.category}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('stock.dialogs.editItem.saving')}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      {t('stock.dialogs.editItem.save')}
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modale de visualisation d'article */}
          <AlertDialog open={viewItemOpen} onOpenChange={setViewItemOpen}>
            <AlertDialogContent className="max-w-2xl bg-white border border-gray-200 shadow-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('stock.dialogs.viewItem.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.dialogs.viewItem.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {itemToView && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stock.dialogs.viewItem.generalInfo')}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.name')}</span>
                            <span className="font-light">{itemToView.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.sku')}</span>
                            <span className="font-light">{itemToView.sku}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.category')}</span>
                            <span className="font-light">{itemToView.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.status')}</span>
                            {getStatusBadge(itemToView.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stock.dialogs.viewItem.stock')}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.currentStock')}</span>
                            <span className="font-light">{itemToView.current_stock}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.minStock')}</span>
                            <span className="font-light">{itemToView.min_stock}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.maxStock')}</span>
                            <span className="font-light">{itemToView.max_stock}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stock.dialogs.viewItem.price')}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.unitPrice')}</span>
                            <span className="font-light">{formatAmount(itemToView.unit_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.totalValue')}</span>
                            <span className="font-light text-lg">
                              {formatAmount(itemToView.current_stock * itemToView.unit_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stock.dialogs.viewItem.supplier')}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.supplierLabel')}</span>
                            <span className="font-light">{itemToView.supplier || t('stock.dialogs.viewItem.notSpecified')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">{t('stock.dialogs.viewItem.locationLabel')}</span>
                            <span className="font-light">{itemToView.location || t('stock.dialogs.viewItem.notSpecified')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {itemToView.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stock.dialogs.viewItem.description')}</h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {itemToView.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 font-light">
                      {t('stock.dialogs.viewItem.lastUpdate', { date: format(new Date(itemToView.last_updated), 'dd/MM/yyyy à HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS }) })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setViewItemOpen(false);
                          handleEditItem(itemToView);
                        }}
                        variant="outline"
                        size="sm"
                        className="border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {t('stock.actions.edit')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => setViewItemOpen(false)}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                >
                  {t('stock.dialogs.viewItem.close')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modale de confirmation de suppression */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-white border border-gray-200 shadow-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('stock.dialogs.deleteItem.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('stock.dialogs.deleteItem.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {itemToDelete && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{itemToDelete.name}</p>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('stock.dialogs.deleteItem.sku')} {itemToDelete.sku}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg font-light">
                  {t('stock.dialogs.deleteItem.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteItem}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('stock.dialogs.deleteItem.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Stock;
