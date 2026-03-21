/**
 * EventAnalytics Page
 * View event analytics and insights with ultra-modern design
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Ticket,
  DollarSign,
  Download,
  Filter,
  Loader2,
  Calendar as CalendarIcon,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  X,
  Monitor,
  Smartphone,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/StatCard';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getEventById, getEventAnalytics, exportAnalyticsToCSV } from '@/services/eventService';
import type { Event } from '@/types/events';
import type { AnalyticsSummary } from '@/services/eventService';
import { useLanguage } from '@/hooks/useLanguage';
import { format, subDays } from 'date-fns';

const StatsCharts = React.lazy(() => import('@/components/stats/StatsCharts'));

const COLORS = ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#9ca3af'];

export default function EventAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'visitors' | 'sales' | 'revenue'>('views');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'mobile' | 'tablet'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'social' | 'search' | 'referral'>('all');

  // Stabilize dateRange to prevent infinite re-renders
  const stableDateRange = useMemo(() => dateRange, [dateRange.start, dateRange.end]);

  const loadEvent = useCallback(async (eventId: string) => {
    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }, []);

  const loadAnalytics = useCallback(async (eventId: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      const data = await getEventAnalytics(eventId, start, end);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load event only once when id changes
  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id, loadEvent]);

  // Load analytics when id or dateRange changes
  useEffect(() => {
    if (id && stableDateRange.start && stableDateRange.end) {
      loadAnalytics(id, stableDateRange.start, stableDateRange.end);
    }
  }, [id, stableDateRange.start, stableDateRange.end, loadAnalytics]);

  const handleExport = () => {
    if (analytics && event) {
      exportAnalyticsToCSV(analytics, event.title);
    }
  };

  const handleDateRangeChange = (preset: '7d' | '30d' | '90d' | 'all') => {
    const end = format(new Date(), 'yyyy-MM-dd');
    let start = '';

    switch (preset) {
      case '7d':
        start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        break;
      case '30d':
        start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        break;
      case '90d':
        start = format(subDays(new Date(), 90), 'yyyy-MM-dd');
        break;
      case 'all':
        start = '';
        break;
    }

    setDateRange({ start, end });
  };

  if (!event) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen flex items-center justify-center bg-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="relative z-10"
          >
            <BarChart3 className="h-12 w-12 text-gray-600" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white apple-minimal-font">
        <div className="container max-w-7xl py-6 px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">

              {/* Back button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="rounded-lg hover:bg-gray-100 text-gray-600 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('events.form.back')}
                </Button>
              </motion.div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Icon container - Apple Minimal */}
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <BarChart3 className="w-6 h-6 text-gray-600" />
                  </motion.div>

                  <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 mb-1 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {t('events.analytics.title')}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{event.title}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Button
                      onClick={handleExport}
                      disabled={!analytics || isLoading}
                      className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('events.analytics.export')}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                    {/* Export dropdown menu could be added here */}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 space-y-4"
              >
                {/* Date Range Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 mr-2 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('events.analytics.dateRange')}:</span>
                  <Button
                    variant={dateRange.start === format(subDays(new Date(), 7), 'yyyy-MM-dd') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange('7d')}
                    className="rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.filters.last7Days')}
                  </Button>
                  <Button
                    variant={dateRange.start === format(subDays(new Date(), 30), 'yyyy-MM-dd') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange('30d')}
                    className="rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.filters.last30Days')}
                  </Button>
                  <Button
                    variant={dateRange.start === format(subDays(new Date(), 90), 'yyyy-MM-dd') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange('90d')}
                    className="rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.filters.last90Days')}
                  </Button>
                  <Button
                    variant={!dateRange.start ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange('all')}
                    className="rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.filters.allTime')}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="rounded-lg ml-auto font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {t('events.filters.advancedFilters')}
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.analytics.metric')}</Label>
                          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                            <SelectTrigger className="rounded-lg bg-white border border-gray-200 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                              <SelectItem value="views">{t('events.analytics.pageViews')}</SelectItem>
                              <SelectItem value="visitors">{t('events.analytics.uniqueVisitors')}</SelectItem>
                              <SelectItem value="sales">{t('events.analytics.ticketsSold')}</SelectItem>
                              <SelectItem value="revenue">{t('events.analytics.revenue')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.analytics.deviceType')}</Label>
                          <Select value={deviceFilter} onValueChange={(value: any) => setDeviceFilter(value)}>
                            <SelectTrigger className="rounded-lg bg-white border border-gray-200 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                              <SelectItem value="all">{t('events.analytics.allDevices')}</SelectItem>
                              <SelectItem value="desktop">
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" />
                                  {t('events.analytics.desktop')}
                                </div>
                              </SelectItem>
                              <SelectItem value="mobile">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" />
                                  {t('events.analytics.mobile')}
                                </div>
                              </SelectItem>
                              <SelectItem value="tablet">{t('events.analytics.tablet')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.analytics.trafficSource')}</Label>
                          <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
                            <SelectTrigger className="rounded-lg bg-white border border-gray-200 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                              <SelectItem value="all">{t('events.analytics.allSources')}</SelectItem>
                              <SelectItem value="direct">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  {t('events.analytics.direct')}
                                </div>
                              </SelectItem>
                              <SelectItem value="social">{t('events.analytics.social')}</SelectItem>
                              <SelectItem value="search">{t('events.analytics.search')}</SelectItem>
                              <SelectItem value="referral">{t('events.analytics.referral')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(deviceFilter !== 'all' || sourceFilter !== 'all') && (
                        <div className="mt-4 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeviceFilter('all');
                              setSourceFilter('all');
                            }}
                            className="text-gray-600 hover:text-gray-900 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t('events.analytics.clearFilters')}
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
            </div>
          ) : analytics ? (
            <>
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
              >
                <StatCard
                  icon={Eye}
                  label={t('events.stats.totalViews')}
                  value={analytics.totalViews.toLocaleString()}
                  delay={0.1}
                />
                <StatCard
                  icon={Users}
                  label={t('events.stats.uniqueVisitors')}
                  value={analytics.totalUniqueVisitors.toLocaleString()}
                  delay={0.2}
                />
                <StatCard
                  icon={Ticket}
                  label={t('events.stats.ticketsSold')}
                  value={analytics.totalTicketsSold.toLocaleString()}
                  delay={0.3}
                />
                <StatCard
                  icon={DollarSign}
                  label={t('events.stats.revenue')}
                  value={`€${analytics.totalRevenue.toLocaleString()}`}
                  delay={0.4}
                />
              </motion.div>

              {/* Additional Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
              >
                <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 font-light uppercase tracking-wider mb-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.stats.avgConversionRate')}</p>
                        <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {analytics.avgConversionRate.toFixed(2)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 font-light uppercase tracking-wider mb-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.stats.currentAttendees')}</p>
                        <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {event.current_attendees}
                          {event.max_capacity && (
                            <span className="text-base text-gray-500">/{event.max_capacity}</span>
                          )}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Charts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="bg-white rounded-lg border border-gray-200">
                    <TabsTrigger value="overview" className="font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.analytics.overview')}</TabsTrigger>
                    <TabsTrigger value="traffic" className="font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.analytics.trafficSources')}</TabsTrigger>
                    <TabsTrigger value="sales" className="font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.analytics.salesRevenue')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{t('events.analytics.dailyViewsVisitors')}</CardTitle>
                        <CardDescription className="font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.analytics.trackPageViews')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.dailyData.length > 0 ? (
                          <div className="h-[400px]">
                            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                              <StatsCharts
                                type="line"
                                data={analytics.dailyData}
                                config={{
                                  xAxisKey: "date",
                                  xAxisTickFormatter: (value) => format(new Date(value), 'MMM d'),
                                  tooltipLabelFormatter: (value) => format(new Date(value as string), 'MMM d, yyyy'),
                                  series: [
                                    { key: "page_views", name: t('events.analytics.pageViews'), stroke: "#6b7280" },
                                    { key: "unique_visitors", name: t('events.analytics.uniqueVisitors'), stroke: "#9ca3af" }
                                  ]
                                }}
                              />
                            </React.Suspense>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('events.analytics.noAnalyticsData')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="traffic">
                    <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{t('events.analytics.trafficSources')}</CardTitle>
                        <CardDescription className="font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.analytics.whereVisitorsComingFrom')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.topTrafficSources.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-[300px]">
                              <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                                <StatsCharts
                                  type="pie"
                                  data={analytics.topTrafficSources.map(s => ({ name: s.source, value: s.visits }))}
                                />
                              </React.Suspense>
                            </div>

                            <div className="space-y-4">
                              {analytics.topTrafficSources.map((source, index) => (
                                <motion.div
                                  key={source.source}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: index * 0.1 }}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                      />
                                      <span className="font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >{source.source}</span>
                                    </div>
                                    <span className="text-gray-500 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {source.visits.toLocaleString()} {t('events.analytics.visits')} ({source.percentage}%)
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${source.percentage}%` }}
                                      transition={{ duration: 1, delay: index * 0.1 }}
                                      className="h-full bg-gray-600"
                                    />
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No traffic data available for this date range</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sales">
                    <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{t('events.analytics.salesRevenueOverTime')}</CardTitle>
                        <CardDescription className="font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.analytics.trackTicketSales')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.dailyData.length > 0 ? (
                          <div className="h-[400px]">
                            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                              <StatsCharts
                                type="bar"
                                data={analytics.dailyData}
                                config={{
                                  xAxisKey: "date",
                                  xAxisTickFormatter: (value) => format(new Date(value), 'MMM d'),
                                  tooltipLabelFormatter: (value) => format(new Date(value as string), 'MMM d, yyyy'),
                                  yAxes: [
                                    { id: "left", orientation: "left" },
                                    { id: "right", orientation: "right" }
                                  ],
                                  series: [
                                    { key: "tickets_sold", name: t('events.analytics.ticketsSold'), fill: "#6b7280", yAxisId: "left" },
                                    { key: "revenue", name: t('events.analytics.revenue'), fill: "#9ca3af", yAxisId: "right" }
                                  ]
                                }}
                              />
                            </React.Suspense>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No sales data available for this date range</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('events.analytics.noDataAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
