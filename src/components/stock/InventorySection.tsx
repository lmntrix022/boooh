import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clipboard,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Play,
  Download,
  Loader2,
  FileText,
  MoreVertical,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

interface InventoryItem {
  id: string;
  product_id: string;
  system_stock: number;
  physical_stock: number;
  variance: number;
  variance_percent: number;
  unit_value: number;
  total_value: number;
}

interface Product {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}

interface Inventory {
  id: string;
  card_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  item_count: number;
  discrepancy_count: number;
  inventory_items: InventoryItem[];
}

interface InventorySectionProps {
  stockItems: any[];
  cardId: string;
}

export const InventorySection: React.FC<InventorySectionProps> = ({ stockItems, cardId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Charger les infos produit
  const { data: productsMap = {} } = useQuery({
    queryKey: ['products-info', stockItems.map(i => i.id).join(',')],
    queryFn: async () => {
      if (!stockItems.length) return {};
      
      const productIds = stockItems.map(item => item.id);
      const { data: products } = await supabase
        .from('products')
        .select('id, name, images')
        .in('id', productIds);

      const map: Record<string, Product> = {};
      products?.forEach(p => {
        map[p.id] = {
          id: p.id,
          name: p.name || t('stock.inventory.active.product'),
          images: Array.isArray(p.images) ? p.images : []
        };
      });
      return map;
    },
    enabled: !!stockItems.length,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Charger les inventaires depuis la DB
  const { data: inventories = [], isLoading: inventoriesLoading } = useQuery({
    queryKey: ['card-inventories', cardId],
    queryFn: () => StockService.getCardInventories(cardId),
    enabled: !!cardId,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });

  // Créer un nouvel inventaire
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const inventory = await StockService.createInventory(
        cardId,
        user.id,
        stockItems.length
      );

      // Ajouter les articles
      const items = stockItems.map(item => ({
        product_id: item.id,
        system_stock: item.stock || 0,
        unit_value: item.price || 0
      }));

      await StockService.addInventoryItems(inventory.id, items);
      
      return inventory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-inventories'] });
      toast({
        title: 'Succès',
        description: 'Inventaire créé avec succès'
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      // Ignore cancelled errors
      if (error?.name === 'CancelledError') return;
      
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de l\'inventaire',
        variant: 'destructive'
      });
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Finaliser un inventaire
  const finalizeMutation = useMutation({
    mutationFn: async (inventoryId: string) => {
      return await StockService.finalizeInventory(inventoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-inventories'] });
      toast({
        title: 'Succès',
        description: 'Inventaire finalisé avec succès'
      });
      setIsFinalizing(false);
    },
    onError: (error: any) => {
      // Ignore cancelled errors
      if (error?.name === 'CancelledError') return;
      
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la finalisation',
        variant: 'destructive'
      });
      setIsFinalizing(false);
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Mettre à jour le stock physique d'un article
  const updateStockMutation = useMutation({
    mutationFn: async (data: { itemId: string; physicalStock: number }) => {
      return await StockService.updateInventoryItemStock(data.itemId, data.physicalStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-inventories'] });
    },
    onError: (error: any) => {
      // Ignore cancelled errors
      if (error?.name === 'CancelledError') return;
      
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        variant: 'destructive'
      });
    },
    retry: 1,
    retryDelay: 500,
  });

  // Récupérer l'inventaire actif (en cours)
  const currentInventory = useMemo(() => {
    return inventories.find((inv: Inventory) => inv.status === 'in_progress');
  }, [inventories]);

  // Générer un rapport d'inventaire
  const generateInventoryReport = (inventory: Inventory) => {
    if (!inventory) return;

    const rows: string[] = [];
    
    // En-tête du rapport
    rows.push('RAPPORT D\'INVENTAIRE');
    rows.push(`Date: ${format(new Date(inventory.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}`);
    if (inventory.completed_at) {
      rows.push(`${t('stock.inventory.history.finalized')}: ${format(new Date(inventory.completed_at), 'dd MMMM yyyy HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS })}`);
    }
    rows.push(`Statut: ${inventory.status}`);
    rows.push('');
    rows.push('RÉSUMÉ');
    rows.push(`${t('stock.inventory.history.items', { count: inventory.item_count })}`);
    rows.push(`${t('stock.inventory.history.variances', { count: inventory.discrepancy_count })}`);
    rows.push('');
    
    // Détail des articles
    rows.push('DÉTAIL DES ARTICLES');
    rows.push('Produit,Stock Système,Stock Physique,Écart,Écart %,Valeur Unitaire,Valeur Totale');
    
    inventory.inventory_items?.forEach(item => {
      const productName = productsMap[item.product_id]?.name || item.product_id;
      const row = [
        `"${productName}"`,
        item.system_stock,
        item.physical_stock,
        item.variance,
        item.variance_percent.toFixed(2),
        item.unit_value.toFixed(2),
        item.total_value.toFixed(2)
      ].join(',');
      rows.push(row);
    });

    // Articles avec écarts
    const itemsWithVariance = inventory.inventory_items?.filter(i => i.variance !== 0) || [];
    if (itemsWithVariance.length > 0) {
      rows.push('');
      rows.push('ARTICLES AVEC ÉCARTS');
      rows.push('Produit,Écart,Action Requise');
      itemsWithVariance.forEach(item => {
        const productName = productsMap[item.product_id]?.name || item.product_id;
        const action = item.variance > 0 ? 'Stock excédentaire' : 'Stock insuffisant';
        rows.push(`"${productName}",${item.variance},"${action}"`);
      });
    }

    // Générer le fichier CSV
    const csvContent = rows.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `inventaire_${format(new Date(inventory.created_at), 'dd-MM-yyyy-HHmm')}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: t('stock.inventory.toasts.reportGenerated.title'),
      description: t('stock.inventory.toasts.reportGenerated.description')
    });
  };

  if (inventoriesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section inventaire actif Apple Minimal */}
      {currentInventory ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm border border-gray-200">
                  <Clipboard className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-light text-gray-900">{t('stock.inventory.active.title')}</h3>
              </div>
              <Badge className="bg-gray-900 text-gray-600 font-light px-4 py-2 rounded-lg border border-gray-200">{t('stock.inventory.active.status')}</Badge>
            </div>
            
            {/* Stats Ultra-Modernes */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { 
                  label: t('stock.inventory.active.items'), 
                  value: currentInventory.inventory_items?.length || 0, 
                  icon: Clipboard, 
                  gradient: 'from-blue-500 via-indigo-500 to-purple-500',
                  delay: 0.1
                },
                { 
                  label: t('stock.inventory.active.variances'), 
                  value: currentInventory.inventory_items?.filter(i => i.variance !== 0).length || 0, 
                  icon: AlertCircle, 
                  gradient: 'from-amber-500 via-orange-500 to-red-500',
                  delay: 0.2
                },
                { 
                  label: t('stock.inventory.active.variance'), 
                  value: (currentInventory.inventory_items?.reduce((sum, i) => sum + Math.abs(i.variance), 0) || 0).toFixed(0), 
                  icon: TrendingUp, 
                  gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                  delay: 0.3
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: stat.delay,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-hidden group"
                >
                  <div className="relative z-10 text-center">
                    <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{stat.label}</p>
                    <p className="text-3xl font-light tracking-tight text-gray-900 leading-none"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >{stat.value}</p>
                    <div className="mt-3 flex justify-center">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm border border-gray-200">
                        <stat.icon className="w-5 h-5 text-gray-600" />
                </div>
              </div>
                </div>
                </motion.div>
              ))}
            </div>

            {/* Saisie manuelle du stock Apple Minimal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm border border-gray-200">
                  <Clipboard className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="font-light text-gray-900">{t('stock.inventory.active.physicalStock')}</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {currentInventory.inventory_items?.map((item, idx) => {
                  const hasVariance = item.variance !== 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        'bg-white rounded-lg border shadow-sm p-4 transition-all duration-200',
                        hasVariance
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                        {/* Nom du produit */}
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs font-light text-gray-600 uppercase tracking-wider mb-1">{t('stock.inventory.active.product')}</p>
                          <p className="text-sm font-light text-gray-900 truncate">
                            {productsMap[item.product_id]?.name || item.product_id}
                          </p>
                        </div>

                        {/* Image du produit */}
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          {productsMap[item.product_id]?.images?.[0]?.url ? (
                            <img
                              src={productsMap[item.product_id]?.images?.[0]?.url}
                              alt={productsMap[item.product_id]?.name || t('stock.inventory.active.product')}
                              className="w-12 h-12 object-contain rounded-lg bg-gray-100 border border-gray-200/50 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200/50">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Stock système */}
                        <div>
                          <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-1"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('stock.inventory.active.system')}</p>
                          <p className="text-base font-light tracking-tight text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {item.system_stock}
                          </p>
                        </div>

                        {/* Input stock physique */}
                        <div>
                          <Label htmlFor={`stock-${item.id}`} className="text-xs font-light text-gray-500 uppercase tracking-wide mb-1"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('stock.inventory.active.physical')}
                          </Label>
                          <Input
                            id={`stock-${item.id}`}
                            type="number"
                            min="0"
                            value={item.physical_stock || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateStockMutation.mutate({
                                itemId: item.id,
                                physicalStock: value
                              });
                            }}
                            placeholder="0"
                            className="bg-white text-gray-900 border border-gray-200 rounded-lg text-sm font-light shadow-sm focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>

                        {/* Écart */}
                        <div className="col-span-2 sm:col-span-1 sm:col-start-4">
                          <p className="text-xs font-light text-gray-600 uppercase tracking-wider mb-1">{t('stock.inventory.active.varianceLabel')}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                'font-light text-xs px-3 py-1 rounded-lg border',
                                item.variance === 0
                                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                                  : item.variance > 0
                                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              )}
                            >
                              {item.variance >= 0 ? '+' : ''}{item.variance}
                            </Badge>
                            {item.variance !== 0 && (
                              <span className="text-xs font-light text-gray-500"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                ({item.variance_percent.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Articles avec écarts */}
            {currentInventory.inventory_items?.filter(i => i.variance !== 0).length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gray-50 rounded-lg border border-amber-200/50 shadow-sm p-4 overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-sm font-light text-gray-600"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stock.inventory.active.itemsWithVariance', { count: currentInventory.inventory_items?.filter(i => i.variance !== 0).length || 0 })}
                    </div>
                </div>
                  <div className="space-y-2 text-sm">
                  {currentInventory.inventory_items?.filter(i => i.variance !== 0).map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white rounded-lg p-2 border border-amber-200/50">
                        <span className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{productsMap[item.product_id]?.name || item.product_id}</span>
                        <span className="font-light text-sm px-2 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                        {item.variance > 0 ? '+' : ''}{item.variance} ({item.variance_percent.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              </motion.div>
            )}

            {/* Bouton Finaliser Ultra-Moderne */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white w-full font-light py-3 rounded-lg shadow-sm transition-all duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              onClick={() => finalizeMutation.mutate(currentInventory.id)}
              disabled={finalizeMutation.isPending}
            >
              {finalizeMutation.isPending ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>{t('stock.inventory.active.finalizing')}</span>
                </>
              ) : (
                <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>{t('stock.inventory.active.finalize')}</span>
                </>
              )}
            </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm border border-gray-200 mx-auto mb-6">
              <Clipboard className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-light text-gray-900 mb-3">
              {t('stock.inventory.empty.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('stock.inventory.empty.description')}
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={createMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-white font-light px-6 py-3 rounded-lg shadow-sm transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('stock.inventory.empty.start')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Historique des inventaires Apple Minimal */}
      {inventories.filter((inv: Inventory) => inv.status === 'completed').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl font-light tracking-tight text-gray-900 mb-6"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >{t('stock.inventory.history.title')}</h3>
          <div className="grid gap-4">
            {inventories
              .filter((inv: Inventory) => inv.status === 'completed')
              .map((inventory, idx) => (
                <motion.div
                  key={inventory.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: idx * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-sm transition-all duration-200"
                >
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Badge className="bg-gray-900 text-gray-600 font-light px-3 py-1.5 rounded-lg border border-gray-200 flex-shrink-0">
                        {t('stock.inventory.history.finalized')}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-light text-gray-900 mb-1">
                            {format(new Date(inventory.created_at), 'dd MMMM yyyy HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS })}
                          </p>
                        <p className="text-sm text-gray-600">
                            {t('stock.inventory.history.items', { count: inventory.item_count })} • {t('stock.inventory.history.variances', { count: inventory.discrepancy_count })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateInventoryReport(inventory)}
                      className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg px-4 py-2 font-light flex-shrink-0"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('stock.inventory.history.report')}</span>
                      </Button>
                    </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Dialog de démarrage */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>{t('stock.inventory.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('stock.inventory.dialog.description', { count: stockItems.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200/50">
              <p className="text-sm text-gray-600">
                <span className="font-light text-gray-900">{stockItems.length}</span> {t('stock.inventory.dialog.itemsIncluded', { count: stockItems.length })}
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('stock.inventory.dialog.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-gray-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('stock.inventory.dialog.creating')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('stock.inventory.dialog.start')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySection;
