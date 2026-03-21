import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/services/invoiceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { Loader2 } from 'lucide-react';

const StatsCharts = React.lazy(() => import('@/components/stats/StatsCharts'));

interface InvoiceChartViewProps {
  invoices: Invoice[];
  stats: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#9ca3af',
  sent: '#6b7280',
  paid: '#6b7280',
  overdue: '#ef4444',
  cancelled: '#ef4444',
};

export const InvoiceChartView: React.FC<InvoiceChartViewProps> = ({ invoices, stats }) => {
  const { t, currentLanguage } = useLanguage();

  // Statistiques par statut
  const statusData = useMemo(() => {
    const data: Record<InvoiceStatus, { count: number; amount: number }> = {
      draft: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };

    invoices.forEach((invoice) => {
      data[invoice.status].count++;
      data[invoice.status].amount += invoice.total_ttc;
    });

    return [
      { name: t('invoice.status.draft'), value: data.draft.count, amount: data.draft.amount, color: STATUS_COLORS.draft },
      { name: t('invoice.status.sent'), value: data.sent.count, amount: data.sent.amount, color: STATUS_COLORS.sent },
      { name: t('invoice.status.paid'), value: data.paid.count, amount: data.paid.amount, color: STATUS_COLORS.paid },
      { name: t('invoice.status.overdue'), value: data.overdue.count, amount: data.overdue.amount, color: STATUS_COLORS.overdue },
      { name: t('invoice.status.cancelled'), value: data.cancelled.count, amount: data.cancelled.amount, color: STATUS_COLORS.cancelled },
    ].filter((item) => item.value > 0);
  }, [invoices, t]);

  // Évolution sur les 6 derniers mois
  const monthlyData = useMemo(() => {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthInvoices = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return isWithinInterval(invoiceDate, { start: monthStart, end: monthEnd });
      });

      months.push({
        month: format(monthDate, 'MMM yyyy', { locale: currentLanguage === 'fr' ? fr : enUS }),
        factures: monthInvoices.length,
        montant: monthInvoices.reduce((sum, inv) => sum + inv.total_ttc, 0),
        payees: monthInvoices.filter((inv) => inv.status === 'paid').length,
      });
    }

    return months;
  }, [invoices, currentLanguage]);

  // Top 5 clients
  const topClients = useMemo(() => {
    const clientTotals: Record<string, { name: string; amount: number; count: number }> = {};

    invoices.forEach((invoice) => {
      if (!clientTotals[invoice.client_name]) {
        clientTotals[invoice.client_name] = {
          name: invoice.client_name,
          amount: 0,
          count: 0,
        };
      }
      clientTotals[invoice.client_name].amount += invoice.total_ttc;
      clientTotals[invoice.client_name].count++;
    });

    return Object.values(clientTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

  // Taux de conversion (payé / envoyé)
  const conversionRate = useMemo(() => {
    const paidAndSent = invoices.filter((inv) => inv.status === 'paid' || inv.status === 'sent').length;
    if (paidAndSent === 0) return 0;
    return Math.round((stats.paid / paidAndSent) * 100);
  }, [invoices, stats.paid]);

  // Délai moyen de paiement
  const averagePaymentDelay = useMemo(() => {
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.payment_date);
    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((sum, inv) => {
      const issueDate = new Date(inv.issue_date);
      const paymentDate = new Date(inv.payment_date!);
      const diffDays = Math.floor((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / paidInvoices.length);
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{t('invoice.chart.turnover')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(stats.totalAmount / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-700 mt-1">{t('invoice.chart.totalFCFA')}</p>
                </div>
                <div className="bg-gray-100 gray-600 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{t('invoice.chart.conversionRate')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
                  <p className="text-xs text-gray-700 mt-1">{t('invoice.chart.paidInvoices')}</p>
                </div>
                <div className="bg-gray-100 gray-600 p-3 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{t('invoice.chart.averageDelay')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{averagePaymentDelay}j</p>
                  <p className="text-xs text-gray-700 mt-1">{t('invoice.chart.ofPayment')}</p>
                </div>
                <div className="bg-gray-100 gray-600 p-3 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{t('invoice.chart.pending')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(stats.pendingAmount / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-700 mt-1">{t('invoice.chart.toCollect')}</p>
                </div>
                <div className="bg-gray-100 gray-600 p-3 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par statut */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white border border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-gray-900" />
                {t('invoice.chart.statusDistribution')}
              </CardTitle>
              <CardDescription>{t('invoice.chart.invoicesByStatus')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="pie"
                    data={statusData}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Évolution mensuelle */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white border border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-gray-900" />
                {t('invoice.chart.evolution6Months')}
              </CardTitle>
              <CardDescription>{t('invoice.chart.amountAndInvoices')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="line"
                    data={monthlyData}
                    config={{
                      xAxisKey: "month",
                      yAxes: [
                        { id: "left", orientation: "left" },
                        { id: "right", orientation: "right" }
                      ],
                      series: [
                        { key: "montant", name: t('invoice.chart.amountFCFA'), stroke: "#6b7280", yAxisId: "left" },
                        { key: "factures", name: t('invoice.chart.nbInvoices'), stroke: "#9ca3af", yAxisId: "right" }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top clients */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-white border border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-gray-900" />
                {t('invoice.chart.top5Clients')}
              </CardTitle>
              <CardDescription>{t('invoice.chart.byTurnover')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="bar"
                    data={topClients}
                    config={{
                      layout: 'vertical',
                      xAxisKey: 'name',
                      series: [
                        { key: "amount", name: t('invoice.chart.turnoverFCFA'), fill: "#6b7280" }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparaison des montants */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-white border border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-gray-900" />
                {t('invoice.chart.financialAnalysis')}
              </CardTitle>
              <CardDescription>{t('invoice.chart.amountDistribution')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="bar"
                    data={[
                      { name: t('invoice.chart.totalInvoiced'), montant: stats.totalAmount, fill: '#6b7280' },
                      { name: t('invoice.chart.paid'), montant: stats.paidAmount, fill: '#9ca3af' },
                      { name: t('invoice.chart.pending'), montant: stats.pendingAmount, fill: '#d1d5db' },
                    ]}
                    config={{
                      series: [
                        { key: "montant", name: t('invoice.chart.amountFCFA') }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
