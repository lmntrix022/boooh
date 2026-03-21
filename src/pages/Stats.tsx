import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { StatsService, type StatsData } from "@/services/statsService";
import {
  BarChart,
  Loader2,
  Eye,
  Calendar,
  Share2,
  Smartphone,
  TrendingUp,
  Users,
  MousePointer,
  Target,
  Award,
  Phone,
  Mail,
  ExternalLink,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from "@/hooks/useLanguage";

const StatsCharts = React.lazy(() => import('@/components/stats/StatsCharts'));

const COLORS = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

const Stats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const [dateRange, setDateRange] = useState<number>(30); // Days

  // Use React Query for optimized data fetching
  const { data: statsData, isLoading, error } = useQuery<StatsData, Error>({
    queryKey: ["stats-data", id, dateRange],
    queryFn: async () => {
      if (!id || !user) throw new Error("Missing card ID or user");

      return await StatsService.getStatsData({
        cardId: id,
        userId: user.id,
        dateRange
      });
    },
    enabled: !!id && !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Show toast on error
  React.useEffect(() => {
    if (error) {
      toast({
        title: t('stats.errors.error'),
        description: error.message || t('stats.errors.loadError'),
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Extract data from query result
  const card = statsData?.card || null;
  const views = statsData?.views || [];
  const analytics = statsData?.analytics || null;
  const clickStats = statsData?.clickStats || null;

  const updateDateRange = (days: number) => {
    setDateRange(days);
  };

  // Helper function to format link labels and types
  const formatLinkLabel = (label: string): string => {
    // If label starts with "stats.linkLabels.", it's a translation key that wasn't found
    if (label.startsWith('stats.linkLabels.')) {
      const key = label.replace('stats.linkLabels.', '');
      // Format the key directly
      return formatLabelFromKey(key);
    }

    // Try to get translation first
    const translation = t(`stats.linkLabels.${label}`);
    if (translation && translation !== `stats.linkLabels.${label}` && !translation.startsWith('stats.')) {
      return translation;
    }

    // Format the label directly
    return formatLabelFromKey(label);
  };

  const formatLabelFromKey = (key: string): string => {
    // Map common label keys to readable text
    const labelMap: Record<string, string> = {
      'openAppointment': 'Ouvrir rendez-vous',
      'open_appointment': 'Ouvrir rendez-vous',
      'qrOpen': 'Ouvrir QR',
      'qr_open': 'Ouvrir QR',
      'downloadVcard': 'Télécharger vCard',
      'download_vcard': 'Télécharger vCard',
    };

    if (labelMap[key]) {
      return labelMap[key];
    }

    // Format the key: replace underscores with spaces and capitalize
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/Open Appointment/gi, 'Ouvrir rendez-vous')
      .replace(/Qr Open/gi, 'Ouvrir QR')
      .replace(/Download Vcard/gi, 'Télécharger vCard');
  };

  const formatLinkType = (type: string): string => {
    // If type starts with "stats.linkTypes.", it's a translation key that wasn't found
    if (type.startsWith('stats.linkTypes.')) {
      const key = type.replace('stats.linkTypes.', '');
      return formatTypeFromKey(key);
    }

    // Try to get translation first
    const translation = t(`stats.linkTypes.${type}`);
    if (translation && translation !== `stats.linkTypes.${type}` && !translation.startsWith('stats.')) {
      return translation;
    }

    // Format the type directly
    return formatTypeFromKey(type);
  };

  const formatTypeFromKey = (type: string): string => {
    // Map common type keys to readable text
    const typeMap: Record<string, string> = {
      'phone': 'Téléphone',
      'email': 'Email',
      'social': 'Réseau social',
      'website': 'Site web',
      'vcard': 'vCard',
      'appointment': 'Rendez-vous',
      'marketplace': 'Marketplace',
      'other': 'Autre',
    };

    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Prepare data for charts
  const prepareViewsByDateData = () => {
    if (!views.length) return [];

    const viewsByDate = views.reduce((acc: Record<string, number>, view) => {
      const date = format(parseISO(view.created_at as string), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Fill in missing dates with zero views
    const result = [];
    const today = new Date();

    for (let i = 0; i <= dateRange; i++) {
      const currentDate = subDays(today, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const count = viewsByDate[dateStr] || 0;

      result.unshift({
        date: format(currentDate, 'dd/MM', { locale: currentLanguage === 'fr' ? fr : enUS }),
        views: count
      });
    }

    return result;
  };

  const prepareDeviceData = () => {
    if (!analytics) return [];

    const { mobile, tablet, desktop, unknown } = analytics.deviceBreakdown;
    const data = [];

    if (mobile > 0) data.push({ name: t('stats.devices.mobile'), value: mobile });
    if (tablet > 0) data.push({ name: t('stats.devices.tablet'), value: tablet });
    if (desktop > 0) data.push({ name: t('stats.devices.desktop'), value: desktop });
    if (unknown > 0) data.push({ name: t('stats.devices.unknown'), value: unknown });

    return data;
  };

  const prepareReferrerData = () => {
    if (!analytics) return [];

    const data = [];
    const { direct, social, email, search, referral } = analytics.trafficSources;

    if (direct > 0) data.push({ name: t('stats.sources.direct'), value: direct });
    if (social > 0) data.push({ name: t('stats.sources.social'), value: social });
    if (email > 0) data.push({ name: t('stats.sources.email'), value: email });
    if (search > 0) data.push({ name: t('stats.sources.search'), value: search });
    if (referral > 0) data.push({ name: t('stats.sources.referral'), value: referral });

    return data.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  // If user is not logged in, redirect to login page
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">

          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <BarChart className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('stats.title') || 'Statistiques'}
                  </h1>
                  <p
                    className="text-sm md:text-base text-gray-600 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('stats.description', { cardName: card?.name ? `"${card.name}"` : '' }) || 'Analysez les performances de votre carte'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
            </div>
          ) : (
            <>
              {/* Date Range Selector */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    { days: 7, label: t('stats.dateRange.days7') || '7 jours' },
                    { days: 30, label: t('stats.dateRange.days30') || '30 jours' },
                    { days: 90, label: t('stats.dateRange.months3') || '3 mois' },
                    { days: 365, label: t('stats.dateRange.year1') || '1 an' },
                  ].map(({ days, label }) => (
                    <Button
                      key={days}
                      variant={dateRange === days ? "default" : "outline"}
                      className={`h-10 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-light transition-all duration-200 ${dateRange === days
                          ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm'
                          : 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm'
                        }`}
                      onClick={() => updateDateRange(days)}
                      aria-label={label}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.totalViews') || 'Vues totales'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {views.length}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.viewsPerDay') || 'Vues/jour'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {views.length > 0 ? (views.length / (dateRange || 1)).toFixed(1) : 0}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.trend') || 'Tendance'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 flex items-center"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {views.length > 0 ? (
                          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-600 mr-2" />
                        ) : (
                          "--"
                        )}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <BarChart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.uniqueVisitors') || 'Visiteurs uniques'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {analytics?.uniqueViews || 0}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.totalClicks') || 'Clics total'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {clickStats?.totalClicks || 0}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <MousePointer className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-light text-gray-600 mb-1 sm:mb-2 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.cards.ctr') || 'CTR'}
                      </p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {clickStats?.ctr ? `${clickStats.ctr.toFixed(1)}%` : '0%'}
                      </h3>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                      <BarChart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stats.detailedStats') || 'Statistiques détaillées'}
                    </h2>
                  </div>
                  {views.length > 0 ? (
                    <div className="w-full h-72 sm:h-80 md:h-96">
                      <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                        <StatsCharts type="line" data={prepareViewsByDateData()} />
                      </React.Suspense>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-72 sm:h-80 md:h-96">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-6">
                        <BarChart className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
                      </div>
                      <p className="text-lg sm:text-xl font-light text-gray-900 mb-2 text-center"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.empty.title') || 'Aucune donnée'}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600 font-light mb-6 text-center max-w-xs"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.empty.description') || 'Partagez votre carte pour commencer à collecter des statistiques'}
                      </p>
                      <Button
                        className="h-12 px-6 md:px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                        onClick={() => id && window.open(`/cards/${id}/view`, '_blank')}
                        aria-label={t('stats.empty.shareLabel') || 'Partager la carte'}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.empty.shareButton') || 'Partager la carte'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Devices Chart Section */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                      <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stats.deviceBreakdown') || 'Répartition par appareil'}
                    </h2>
                  </div>
                  {prepareDeviceData().length > 0 ? (
                    <div className="w-full h-64 sm:h-72 md:h-80 flex items-center justify-center">
                      <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                        <StatsCharts type="pie" data={prepareDeviceData()} config={{ unit: t('stats.views'), label: t('stats.views'), categoryLabel: t('stats.device') }} />
                      </React.Suspense>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-64">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-4">
                        <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600" />
                      </div>
                      <p className="text-base sm:text-lg font-light text-gray-900 text-center"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.noDeviceData') || 'Aucune donnée d\'appareil'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Referrers Chart Section */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                      <Share2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('stats.trafficSources') || 'Sources de trafic'}
                    </h2>
                  </div>
                  {prepareReferrerData().length > 0 ? (
                    <div className="w-full h-64 sm:h-72 md:h-80 flex items-center justify-center">
                      <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                        <StatsCharts type="bar" data={prepareReferrerData()} />
                      </React.Suspense>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-64">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-4">
                        <Share2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600" />
                      </div>
                      <p className="text-base sm:text-lg font-light text-gray-900 text-center"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.noSourceData') || 'Aucune donnée de source'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Clicked Links Section */}
              {clickStats && clickStats.topLinks.length > 0 && (
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <Award className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:h-8 text-gray-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.topClickedLinks') || 'Liens les plus cliqués'}
                      </h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {clickStats.topLinks.map((link, index) => (
                        <div
                          key={`${link.type}-${link.label}-${index}`}
                          className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                              {link.type === 'phone' && <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                              {link.type === 'email' && <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                              {link.type === 'social' && <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                              {link.type === 'website' && <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                              {link.type === 'vcard' && <Download className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                              {!['phone', 'email', 'social', 'website', 'vcard'].includes(link.type) && <MousePointer className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-light text-gray-900 text-sm sm:text-base truncate"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {formatLinkLabel(link.label)}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {formatLinkType(link.type)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {link.count}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('stats.clicks') || 'clics'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Clicks by Type Chart */}
              {clickStats && clickStats.totalClicks > 0 && (
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <MousePointer className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:h-8 text-gray-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('stats.clicksByType') || 'Clics par type'}
                      </h2>
                    </div>
                    <div className="w-full h-64 sm:h-72 md:h-80 flex items-center justify-center">
                      <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
                        <StatsCharts
                          type="pie"
                          data={Object.entries(clickStats.clicksByType)
                            .filter(([_, count]) => count > 0)
                            .map(([type, count]) => ({
                              name: formatLinkType(type),
                              value: count
                            }))}
                          config={{ unit: t('stats.clicks'), label: t('stats.clicks'), categoryLabel: 'Type' }}
                        />
                      </React.Suspense>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Stats;
