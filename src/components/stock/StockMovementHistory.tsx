import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  History,
  Package,
  ShoppingCart,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StockMovement, StockMovementType } from '@/services/stockService';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockMovementHistoryProps {
  productId: string;
  cardId: string;
  productName?: string;
  className?: string;
}

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({
  productId,
  cardId,
  productName,
  className
}) => {
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<StockMovementType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    totalAdjustments: 0,
    currentStock: 0
  });

  // Charger les mouvements
  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMovements(data || []);
      calculateStats(data || []);
    } catch (error) {
      // Error log removed
      toast({
        title: t('stock.movementHistory.export.error.title'),
        description: t('stock.movementHistory.export.error.description'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [productId, cardId]);

  // Calculer les statistiques
  const calculateStats = (data: StockMovement[]) => {
    const stats = data.reduce((acc, movement) => {
      if (movement.movement_type === 'purchase' || movement.movement_type === 'initial_stock') {
        acc.totalIn += Math.abs(movement.quantity);
      } else if (movement.movement_type === 'sale') {
        acc.totalOut += Math.abs(movement.quantity);
      } else if (movement.movement_type === 'adjustment') {
        acc.totalAdjustments += 1;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0, totalAdjustments: 0, currentStock: 0 });

    // Le stock actuel est le stock_after du dernier mouvement
    if (data.length > 0) {
      stats.currentStock = data[0].stock_after;
    }

    setStats(stats);
  };

  // Filtrer les mouvements
  useEffect(() => {
    let filtered = movements;

    // Filtrer par type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.movement_type === filterType);
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reference_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMovements(filtered);
  }, [movements, filterType, searchQuery]);

  // Obtenir l'icône et la couleur selon le type de mouvement
  const getMovementStyle = (type: StockMovementType) => {
    switch (type) {
      case 'purchase':
      case 'initial_stock':
        return {
          icon: <ArrowUpCircle className="h-5 w-5" />,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800',
          label: type === 'initial_stock' ? t('stock.movementHistory.labels.initialStock') : t('stock.movementHistory.labels.entry')
        };
      case 'sale':
        return {
          icon: <ArrowDownCircle className="h-5 w-5" />,
          bgColor: 'bg-gray-200',
          textColor: 'text-gray-900',
          badgeColor: 'bg-gray-300 text-gray-900',
          label: t('stock.movementHistory.labels.exit')
        };
      case 'adjustment':
        return {
          icon: <RefreshCw className="h-5 w-5" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-200 text-gray-900',
          label: t('stock.movementHistory.labels.adjustment')
        };
      default:
        return {
          icon: <Package className="h-5 w-5" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-900',
          badgeColor: 'bg-gray-200 text-gray-900',
          label: t('stock.movementHistory.labels.other')
        };
    }
  };

  // Exporter l'historique en CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Quantité',
      'Stock Avant',
      'Stock Après',
      'Raison',
      'Référence',
      'Notes'
    ];

    const csvData = filteredMovements.map(m => [
      format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      getMovementStyle(m.movement_type).label,
      m.quantity,
      m.stock_before,
      m.stock_after,
      m.reason || '',
      m.reference_id || '',
      m.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_stock_${productName || productId}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();

    toast({
      title: t('stock.movementHistory.export.success.title'),
      description: t('stock.movementHistory.export.success.description')
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('stock.movementHistory.stats.entries')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIn}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('stock.movementHistory.stats.exits')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOut}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('stock.movementHistory.stats.adjustments')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdjustments}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('stock.movementHistory.stats.currentStock')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStock}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-gray-900">{t('stock.movementHistory.title')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMovements}
                className="gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                {t('stock.movementHistory.refresh')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                disabled={filteredMovements.length === 0}
              >
                <Download className="h-4 w-4" />
                {t('stock.movementHistory.exportCSV')}
              </Button>
            </div>
          </div>
          <CardDescription className="text-gray-600">
            {t('stock.movementHistory.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de filtres */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t('stock.movementHistory.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 border-gray-300"
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-300">
                <SelectValue placeholder={t('stock.movementHistory.filterType')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="text-gray-900">{t('stock.movementHistory.allTypes')}</SelectItem>
                <SelectItem value="purchase" className="text-gray-900">{t('stock.movementHistory.purchase')}</SelectItem>
                <SelectItem value="sale" className="text-gray-900">{t('stock.movementHistory.sale')}</SelectItem>
                <SelectItem value="adjustment" className="text-gray-900">{t('stock.movementHistory.adjustment')}</SelectItem>
                <SelectItem value="initial_stock" className="text-gray-900">{t('stock.movementHistory.initialStock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des mouvements */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('stock.movementHistory.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {filteredMovements.map((movement, index) => {
                  const style = getMovementStyle(movement.movement_type);
                  return (
                    <motion.div
                      key={movement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
                        style.bgColor
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Icône et type */}
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', style.textColor)}>
                            {style.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={style.badgeColor}>
                                {style.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(new Date(movement.created_at), 'dd MMM yyyy à HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={cn('font-bold', style.textColor)}>
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </span>
                              <span className="text-gray-600">
                                {t('stock.movementHistory.stock')} {movement.stock_before} → {movement.stock_after}
                              </span>
                            </div>
                            {movement.reason && (
                              <p className="text-sm text-gray-700 mt-1">
                                <strong>{t('stock.movementHistory.reason')}</strong> {movement.reason}
                              </p>
                            )}
                            {movement.reference_id && (
                              <p className="text-xs text-gray-500 mt-1">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {t('stock.movementHistory.ref')} {movement.reference_id}
                                {movement.reference_type && ` (${movement.reference_type})`}
                              </p>
                            )}
                            {movement.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {movement.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementHistory;
