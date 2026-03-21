import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ServiceQuote } from '@/services/portfolioService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, TrendingUp, Loader2, Zap, MessageSquare } from 'lucide-react';

const StatsCharts = React.lazy(() => import('@/components/stats/StatsCharts'));

interface QuotesChartViewProps {
  quotes: ServiceQuote[];
  stats: {
    total_quotes: number;
    pending_quotes: number;
    converted_quotes: number;
    quote_conversion_rate: number;
    avg_response_hours?: number;
    avg_decision_hours?: number;
  };
}

const COLORS = {
  new: '#6b7280',
  in_progress: '#6b7280',
  quoted: '#6b7280',
  accepted: '#6b7280',
  refused: '#ef4444',
  closed: '#6b7280',
};

export const QuotesChartView: React.FC<QuotesChartViewProps> = ({ quotes, stats }) => {
  // Données pour le graphique par statut
  const statusData = useMemo(() => {
    const statusCount = quotes.reduce((acc, quote) => {
      const status = quote.status as keyof typeof COLORS;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Nouveaux', value: statusCount.new || 0, color: COLORS.new },
      { name: 'En cours', value: statusCount.in_progress || 0, color: COLORS.in_progress },
      { name: 'Devis Envoyés', value: statusCount.quoted || 0, color: COLORS.quoted },
      { name: 'Acceptés', value: statusCount.accepted || 0, color: COLORS.accepted },
      { name: 'Refusés', value: statusCount.refused || 0, color: COLORS.refused },
    ].filter(item => item.value > 0);
  }, [quotes]);

  // Données mensuelles
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, { month: string; count: number; amount: number }>();

    quotes.forEach(quote => {
      const dateStr = quote.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthLabel, count: 0, amount: 0 });
      }

      const data = monthlyMap.get(monthKey)!;
      data.count++;
      data.amount += (quote.quote_amount || 0) / 1000; // En milliers
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // 6 derniers mois
  }, [quotes]);

  // Motifs de refus (Phase 2)
  const refusalReasons = useMemo(() => {
    const reasons = new Map<string, number>();
    quotes
      .filter((q: ServiceQuote & { rejection_reason?: string }) => q.status === 'refused' && q.rejection_reason?.trim())
      .forEach((q: ServiceQuote & { rejection_reason?: string }) => {
        const r = (q.rejection_reason || '').trim();
        reasons.set(r, (reasons.get(r) || 0) + 1);
      });
    return Array.from(reasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [quotes]);

  // Données d'évolution du taux de conversion
  const conversionData = useMemo(() => {
    const monthlyConversion = new Map<string, { month: string; total: number; converted: number }>();

    quotes.forEach(quote => {
      const dateStr = quote.created_at || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });

      if (!monthlyConversion.has(monthKey)) {
        monthlyConversion.set(monthKey, { month: monthLabel, total: 0, converted: 0 });
      }

      const data = monthlyConversion.get(monthKey)!;
      data.total++;
      if (quote.status === 'accepted') {
        data.converted++;
      }
    });

    return Array.from(monthlyConversion.values())
      .map(data => ({
        month: data.month,
        rate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0
      }))
      .slice(-6);
  }, [quotes]);

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Total Devis</p>
                <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.total_quotes}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >En Attente</p>
                <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.pending_quotes}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Convertis</p>
                <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.converted_quotes}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Taux Conversion</p>
                <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stats.quote_conversion_rate?.toFixed(1)}%
                </h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.avg_response_hours != null && stats.avg_response_hours >= 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >Temps de réponse moyen</p>
                  <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.avg_response_hours < 1
                      ? `${Math.round(stats.avg_response_hours * 60)} min`
                      : stats.avg_response_hours < 24
                        ? `${stats.avg_response_hours.toFixed(1)} h`
                        : `${(stats.avg_response_hours / 24).toFixed(1)} j`}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.avg_decision_hours != null && stats.avg_decision_hours >= 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >Délai moyen décision client</p>
                  <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.avg_decision_hours < 1
                      ? `${Math.round(stats.avg_decision_hours * 60)} min`
                      : stats.avg_decision_hours < 24
                        ? `${stats.avg_decision_hours.toFixed(1)} h`
                        : `${(stats.avg_decision_hours / 24).toFixed(1)} j`}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique par Statut */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/60 backdrop-blur-md border border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Répartition par Statut</CardTitle>
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

        {/* Graphique Évolution Mensuelle */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-900 tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >Évolution Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                  <StatsCharts
                    type="bar"
                    data={monthlyData}
                    config={{
                      xAxisKey: 'month',
                      series: [
                        { key: "count", name: "Nombre de devis", fill: "#6b7280" },
                        { key: "amount", name: "Montant (K FCFA)", fill: "#9ca3af" }
                      ]
                    }}
                  />
                </React.Suspense>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Motifs de refus (Phase 2) */}
      {refusalReasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-light text-gray-900 tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >Motifs de refus</CardTitle>
              <p className="text-sm text-gray-500 font-light">
                Principales raisons indiquées par les clients ayant refusé un devis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {refusalReasons.map(({ reason, count }) => (
                  <div key={reason} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-light">{reason}</span>
                    <span className="text-sm text-gray-500 font-medium">{count} {count > 1 ? 'fois' : 'fois'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Taux de Conversion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >Taux de Conversion Mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                <StatsCharts
                  type="line"
                  data={conversionData}
                  config={{
                    xAxisKey: 'month',
                    series: [
                      { key: "rate", name: "Taux de conversion (%)", stroke: "#6b7280" }
                    ]
                  }}
                />
              </React.Suspense>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
