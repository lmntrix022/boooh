import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/utils/format';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  Truck,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

const StatsCharts = React.lazy(() => import('@/components/stats/StatsCharts'));

type OrderWithProduct = Tables<'product_inquiries'> & {
  products?: Tables<'products'>;
};

interface OrderStatsViewProps {
  orders: OrderWithProduct[];
  cardName: string;
}

const COLORS = {
  pending: '#111827',
  paid: '#111827',
  cancelled: '#111827',
  refunded: '#6b7280',
  processing: '#111827',
  shipped: '#111827',
  delivered: '#111827'
};

const OrderStatsView: React.FC<OrderStatsViewProps> = ({ orders, cardName }) => {
  const { t, currentLanguage } = useLanguage();
  const stats = useMemo(() => {
    const totalOrders = orders.length;

    // Calcul du chiffre d'affaires - inclure toutes les commandes pour les statistiques
    const totalRevenue = orders.reduce((sum, order) => {
      const price = order.products?.price;
      if (!price) return sum;

      // Convertir le prix en nombre (peut être string ou number)
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      const quantity = order.quantity || 1;

      return sum + (numericPrice * quantity);
    }, 0);

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // payment_status is not on OrderWithProduct type, so use (order as any).payment_status defensively
    const paymentStatusStats = orders.reduce((acc, order) => {
      const status = (order as any).payment_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Order lifecycle is in order.status (pending, processing, shipped, delivered, cancelled)
    const shippingStatusStats = orders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);


    // Statistiques par mois (6 derniers mois)
    const monthlyStats = Array.from({ length: 6 }, (_, i) => {
      const date = subDays(new Date(), i * 30);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at || new Date().toISOString());
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      // Calcul du revenu mensuel - inclure toutes les commandes
      const monthRevenue = monthOrders.reduce((sum, order) => {
        const price = order.products?.price;
        if (!price) return sum;

        // Convertir le prix en nombre (peut être string ou number)
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        const quantity = order.quantity || 1;

        return sum + (numericPrice * quantity);
      }, 0);

      return {
        month: format(monthStart, 'MMM yyyy', { locale: currentLanguage === 'fr' ? fr : enUS }),
        orders: monthOrders.length,
        revenue: monthRevenue
      };
    }).reverse();

    // Top produits
    const productStats = orders.reduce((acc, order) => {
      const productName = order.products?.name || t('orders.stats.unknownProduct');
      if (!acc[productName]) {
        acc[productName] = { orders: 0, revenue: 0 };
      }
      acc[productName].orders += 1;

      // Calculer le revenu pour ce produit
      const price = order.products?.price;
      if (price) {
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        const quantity = order.quantity || 1;
        acc[productName].revenue += numericPrice * quantity;
      }

      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      paymentStatusStats,
      shippingStatusStats,
      monthlyStats,
      topProducts
    };
  }, [orders, t, currentLanguage]);

  const paymentStatusData = Object.entries(stats.paymentStatusStats).map(([status, count]) => ({
    status: status === 'paid' ? t('orders.stats.paymentStatus.paid') :
      status === 'pending' ? t('orders.stats.paymentStatus.pending') :
        status === 'cancelled' ? t('orders.stats.paymentStatus.cancelled') : t('orders.stats.paymentStatus.refunded'),
    count,
    color: COLORS[status as keyof typeof COLORS] || '#6b7280'
  }));

  const shippingStatusData = Object.entries(stats.shippingStatusStats).map(([status, count]) => ({
    status: status === 'delivered' ? t('orders.stats.shippingStatus.delivered') :
      status === 'shipped' ? t('orders.stats.shippingStatus.shipped') :
        status === 'processing' ? t('orders.stats.shippingStatus.processing') : t('orders.stats.shippingStatus.pending'),
    count,
    color: COLORS[status as keyof typeof COLORS] || '#6b7280'
  }));

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('orders.stats.metrics.totalOrders')}</p>
                  <p className="text-2xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >{stats.totalOrders}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('orders.stats.metrics.totalRevenue')}</p>
                  <p className="text-2xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {formatAmount(stats.totalRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('orders.stats.metrics.averageOrderValue')}</p>
                  <p className="text-2xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {formatAmount(stats.avgOrderValue)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('orders.stats.metrics.conversionRate')}</p>
                  <p className="text-2xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {stats.totalOrders > 0 ? Math.round((stats.paymentStatusStats.paid || 0) / stats.totalOrders * 100) : 0}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <TrendingUp className="h-5 w-5 text-gray-600" />
                {t('orders.stats.charts.monthlyEvolution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="line"
                    data={stats.monthlyStats}
                    config={{
                      xAxisKey: 'month',
                      series: [
                        { key: "orders", name: t('orders.stats.charts.orders'), stroke: "#6b7280" }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statut des paiements */}
        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <CreditCard className="h-5 w-5 text-gray-600" />
                {t('orders.stats.charts.paymentStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="pie"
                    data={paymentStatusData.map(d => ({ name: d.status, value: d.count, fill: d.color }))}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top produits et statut d'expédition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits */}
        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Package className="h-5 w-5 text-gray-600" />
                {t('orders.stats.charts.topProducts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((product: any, index: number) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{product.name}</p>
                        <p className="text-sm text-gray-600 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {product.orders} {product.orders === 1 ? t('orders.stats.charts.order') : t('orders.stats.charts.orders')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {formatAmount(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statut d'expédition */}
        <div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Truck className="h-5 w-5 text-gray-600" />
                {t('orders.stats.charts.shippingStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="bar"
                    data={shippingStatusData.map(d => ({ name: d.status, value: d.count, fill: d.color }))}
                    config={{
                      layout: 'vertical',
                      series: [
                        { key: "value", name: t('orders.stats.charts.shippingStatus') }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderStatsView;
