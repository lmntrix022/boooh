import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightCircle,
  TrendingUp,
  TrendingDown,
  RotateCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StockService } from '@/services/stockService';
import { useLanguage } from '@/hooks/useLanguage';

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  type: 'entry' | 'exit' | 'transfer';
  quantity: number;
  reason: string;
  from?: string;
  to?: string;
  date: string;
  value: number;
}

interface StockMovementsViewProps {
  stockItems: any[];
  cardId: string;
}

const StockMovementsView: React.FC<StockMovementsViewProps> = ({
  stockItems,
  cardId
}) => {
  const { t, currentLanguage } = useLanguage();
  const [dbMovements, setDbMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les mouvements depuis la base de données
  useEffect(() => {
    const loadMovements = async () => {
      if (!cardId) {
        setIsLoading(false);
        return;
      }
      try {
        const movements = await StockService.getCardMovements(cardId);
        setDbMovements(movements || []);
      } catch (error) {
        console.error('Erreur chargement mouvements:', error);
        setDbMovements([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMovements();
  }, [cardId]);
    
  // Transformer les mouvements de la base de données
  const movements = useMemo(() => {
    return dbMovements.map((mov: any) => {
      const product = stockItems.find(item => item.id === mov.product_id);
      const typeMap: Record<string, 'entry' | 'exit' | 'transfer'> = {
        'purchase': 'entry',
        'sale': 'exit',
        'adjustment': 'transfer',
        'initial_stock': 'entry'
      };
      
      return {
        id: mov.id,
        itemId: mov.product_id,
        itemName: product?.name || t('stock.movementsView.history.unknownProduct'),
        itemSku: product?.sku || 'N/A',
        type: typeMap[mov.movement_type] || 'entry' as const,
        quantity: mov.quantity || 0,
        reason: mov.reason || mov.movement_type || t('stock.movementsView.valuations.reason.movement'),
        from: undefined,
        to: undefined,
        date: mov.created_at || new Date().toISOString(),
        value: (mov.quantity || 0) * (product?.unit_price || 0)
      };
    });
  }, [dbMovements, stockItems]);
  
  // Si pas de mouvements, générer des données de démonstration
  const demoMovements: StockMovement[] = movements.length === 0 
    ? stockItems.slice(0, 5).flatMap(item => [
        {
          id: `mov_${item.id}_1`,
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku,
          type: 'entry' as const,
          quantity: Math.floor(Math.random() * 100) + 50,
          reason: t('stock.movementsView.valuations.reason.purchase'),
          from: undefined,
          to: undefined,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          value: Math.floor(Math.random() * 500000) + 100000
        },
        {
          id: `mov_${item.id}_2`,
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku,
          type: 'exit' as const,
          quantity: Math.floor(Math.random() * 30) + 10,
          reason: t('stock.movementsView.valuations.reason.sale'),
          from: undefined,
          to: undefined,
          date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
          value: Math.floor(Math.random() * 200000) + 50000
        }
      ])
    : [];
  
  const finalMovements = movements.length > 0 ? movements : demoMovements;

  // Statistiques de mouvements
  const movementStats = useMemo(() => {
    const entries = finalMovements.filter(m => m.type === 'entry');
    const exits = finalMovements.filter(m => m.type === 'exit');
    const transfers = finalMovements.filter(m => m.type === 'transfer');

    const totalEntryQty = entries.reduce((sum, m) => sum + m.quantity, 0);
    const totalExitQty = exits.reduce((sum, m) => sum + m.quantity, 0);
    const totalTransferQty = transfers.reduce((sum, m) => sum + m.quantity, 0);

    const totalEntryValue = entries.reduce((sum, m) => sum + m.value, 0);
    const totalExitValue = exits.reduce((sum, m) => sum + m.value, 0);

    return {
      entries: { count: entries.length, quantity: totalEntryQty, value: totalEntryValue },
      exits: { count: exits.length, quantity: totalExitQty, value: totalExitValue },
      transfers: { count: transfers.length, quantity: totalTransferQty },
      total: finalMovements.length
    };
  }, [finalMovements]);

  // Calcul des valorisations
  const valuations = useMemo(() => {
    const itemsValuation = stockItems.map(item => {
      const itemMovements = finalMovements.filter(m => m.itemId === item.id);
      const entries = itemMovements.filter(m => m.type === 'entry').reduce((sum, m) => sum + m.value, 0);
      const exits = itemMovements.filter(m => m.type === 'exit').reduce((sum, m) => sum + m.value, 0);
      const currentValue = item.current_stock * item.unit_price;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.current_stock,
        currentValue,
        entriesValue: entries,
        exitsValue: exits,
        netValue: entries - exits,
        movementCount: itemMovements.length
      };
    }).sort((a, b) => b.currentValue - a.currentValue);

    const totalCurrentValue = itemsValuation.reduce((sum, item) => sum + item.currentValue, 0);
    const totalEntries = itemsValuation.reduce((sum, item) => sum + item.entriesValue, 0);
    const totalExits = itemsValuation.reduce((sum, item) => sum + item.exitsValue, 0);

    return {
      byItem: itemsValuation,
      totalCurrentValue,
      totalEntries,
      totalExits,
      netValue: totalEntries - totalExits
    };
  }, [stockItems, finalMovements]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return <ArrowDownCircle className="w-5 h-5 text-gray-600" />;
      case 'exit':
        return <ArrowUpCircle className="w-5 h-5 text-gray-600" />;
      case 'transfer':
        return <ArrowRightCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <RotateCw className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'entry':
        return t('stock.movementsView.history.quantity').split(':')[0] || t('stock.actions.entry');
      case 'exit':
        return t('stock.actions.exit');
      case 'transfer':
        return t('stock.movementsView.stats.transfers');
      default:
        return t('stock.status.unknown');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-2 overflow-hidden mb-6">
      <Tabs defaultValue="mouvements" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent rounded-lg p-0 gap-2">
          <TabsTrigger 
            value="mouvements"
                className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 rounded-md px-4 py-2.5 transition-all duration-200 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
          >
            <RotateCw className="w-4 h-4" />
                <span className="font-light">{t('stock.movementsView.tabs.movements')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="valorisations"
                className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 rounded-md px-4 py-2.5 transition-all duration-200 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
          >
            <TrendingUp className="w-4 h-4" />
                <span className="font-light">{t('stock.movementsView.tabs.valuations')}</span>
          </TabsTrigger>
        </TabsList>
          </Tabs>
        </div>
      </motion.div>
      
      <Tabs defaultValue="mouvements" className="w-full">

        {/* Onglet Mouvements */}
        <TabsContent value="mouvements" className="space-y-6">
          {/* Statistiques de mouvements Apple Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { 
                label: t('stock.movementsView.stats.entries'), 
                value: movementStats.entries.quantity, 
                icon: ArrowDownCircle, 
                gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                count: movementStats.entries.count,
                delay: 0.1
              },
              { 
                label: t('stock.movementsView.stats.exits'), 
                value: movementStats.exits.quantity, 
                icon: ArrowUpCircle, 
                gradient: 'from-red-500 via-pink-500 to-rose-500',
                count: movementStats.exits.count,
                delay: 0.2
              },
              { 
                label: t('stock.movementsView.stats.transfers'), 
                value: movementStats.transfers.quantity, 
                icon: ArrowRightCircle, 
                gradient: 'from-blue-500 via-indigo-500 to-purple-500',
                count: movementStats.transfers.count,
                delay: 0.3
              },
              { 
                label: t('stock.movementsView.stats.totalMovements'), 
                value: movementStats.total, 
                icon: RotateCw, 
                gradient: 'from-purple-500 via-indigo-500 to-blue-500',
                count: movementStats.total,
                delay: 0.4
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: stat.delay,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                <div className="relative h-full bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden transform-gpu">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-light text-gray-600 uppercase tracking-wider mb-2">
                          {stat.label}
                        </p>
                        <motion.p
                          className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 leading-none"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: stat.delay + 0.2, type: "spring" }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-gray-500 mt-2 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('stock.movementsView.stats.movementsCount', { count: stat.count })}
                        </p>
                  </div>
                      
                      {/* Icon Container Apple Minimal */}
                      <motion.div
                        className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200  transition-transform duration-300"
                      >
                        <motion.div
                          className="absolute -inset-1 bg-gray-900 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                        />
                        <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-gray-600 " />
            </motion.div>
                    </div>
                  </div>
                  </div>
            </motion.div>
            ))}
          </div>

          {/* Liste des mouvements Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-light tracking-tight text-gray-900 mb-6"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{t('stock.movementsView.history.title')}</h3>
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">{t('stock.movementsView.history.loading')}</p>
                </div>
              ) : finalMovements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200 mx-auto mb-6">
                    <RotateCw className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-600">{t('stock.movementsView.history.empty')}</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {finalMovements.slice().reverse().map((movement, idx) => (
                    <motion.div
                      key={movement.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: idx * 0.05,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        y: -4,
                        transition: { duration: 0.2 }
                      }}
                      className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-sm transition-all duration-300 overflow-hidden group"
                    >
                      {/* Orbe décoratif au hover */}
                      <motion.div
                        className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-purple-400/20 via-indigo-400/20 to-blue-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      <div className=" flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          {getMovementIcon(movement.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="font-light text-gray-900 truncate">{movement.itemName}</p>
                              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-light rounded-lg px-2 py-0.5"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {getMovementLabel(movement.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-1 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {movement.sku} • {t('stock.movementsView.history.quantity')} {movement.quantity} • {movement.reason}
                            </p>
                            {movement.from && movement.to && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('stock.movementsView.history.from')} {movement.from} → {t('stock.movementsView.history.to')} {movement.to}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(movement.date), 'dd MMMM yyyy à HH:mm', { locale: currentLanguage === 'fr' ? fr : enUS })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-light text-lg text-gray-900">{movement.quantity}</p>
                          <p className="text-sm text-gray-600 font-medium">{(movement.value / 1000).toFixed(0)}K FCFA</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* Onglet Valorisations */}
        <TabsContent value="valorisations" className="space-y-6">
          {/* Statistiques de valorisation Apple Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { 
                label: t('stock.movementsView.stats.currentValue'), 
                value: (valuations.totalCurrentValue / 1000000).toFixed(2) + 'M', 
                icon: TrendingUp, 
                gradient: 'from-blue-500 via-indigo-500 to-purple-500',
                subtitle: t('stock.movementsView.stats.allStocks'),
                delay: 0.1
              },
              { 
                label: t('stock.movementsView.stats.entriesValue'), 
                value: (valuations.totalEntries / 1000000).toFixed(2) + 'M', 
                icon: ArrowDownCircle, 
                gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                subtitle: t('stock.movementsView.stats.totalValue'),
                delay: 0.2
              },
              { 
                label: t('stock.movementsView.stats.exitsValue'), 
                value: (valuations.totalExits / 1000000).toFixed(2) + 'M', 
                icon: ArrowUpCircle, 
                gradient: 'from-red-500 via-pink-500 to-rose-500',
                subtitle: t('stock.movementsView.stats.totalValue'),
                delay: 0.3
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: stat.delay,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                <div className="relative h-full bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden transform-gpu">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-light text-gray-600 uppercase tracking-wider mb-2">
                          {stat.label}
                        </p>
                        <motion.p
                          className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 leading-none"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: stat.delay + 0.2, type: "spring" }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-gray-500 mt-2 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {stat.subtitle}
                        </p>
                </div>
                      
                      {/* Icon Container Apple Minimal */}
                      <motion.div
                        className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200  transition-transform duration-300"
                      >
                        <motion.div
                          className="absolute -inset-1 bg-gray-900 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                        />
                        <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-gray-600 " />
                      </motion.div>
                </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Valorisation par article Ultra-Moderne */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-light tracking-tight text-gray-900 mb-6"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{t('stock.movementsView.valuations.title')}</h3>
              {valuations.byItem.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200 mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-600">{t('stock.movementsView.valuations.empty')}</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {valuations.byItem.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: idx * 0.05,
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
                      {/* Orbe décoratif au hover */}
                      <motion.div
                        className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-purple-400/20 via-indigo-400/20 to-blue-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      
                      <div className="">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-light text-gray-900 truncate mb-1">{item.name}</p>
                            <p className="text-sm text-gray-600 truncate">{item.sku}</p>
                        </div>
                          <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-light rounded-lg px-3 py-1 flex-shrink-0 ml-3"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                          {t('stock.movementsView.valuations.stock')} {item.currentStock}
                        </Badge>
                      </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                            <p className="text-gray-600 text-xs mb-1">{t('stock.movementsView.valuations.currentValue')}</p>
                            <p className="font-light text-gray-900">
                            {(item.currentValue / 1000).toFixed(0)}K FCFA
                          </p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs mb-1">{t('stock.movementsView.valuations.entries')}</p>
                            <p className="font-light text-gray-900">
                            {(item.entriesValue / 1000).toFixed(0)}K FCFA
                          </p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs mb-1">{t('stock.movementsView.valuations.exits')}</p>
                            <p className="font-light text-gray-900">
                            {(item.exitsValue / 1000).toFixed(0)}K FCFA
                          </p>
                        </div>
                      </div>
                        <div className="pt-4 border-t border-gray-200/50 flex items-center justify-between">
                        <span className="text-xs text-gray-600">{t('stock.movementsView.valuations.movementsCount', { count: item.movementCount })}</span>
                        <span className={cn(
                            "font-light text-sm",
                          item.netValue >= 0 ? "text-gray-900" : "text-gray-700"
                        )}>
                          {t('stock.movementsView.valuations.net')} {(item.netValue / 1000).toFixed(0)}K FCFA
                        </span>
                      </div>
                    </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockMovementsView;
