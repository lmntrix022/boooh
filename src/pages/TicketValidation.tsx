/**
 * TicketValidation Page
 * Scan and validate event tickets using QR codes with ultra-modern design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Camera,
  AlertCircle,
  QrCode,
  Ticket,
  Download,
  Filter,
  Loader2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { StatCard } from '@/components/ui/StatCard';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useTicketing } from '@/hooks/useTicketing';
import {
  getEventById,
  getTicketValidationStats,
  exportValidationLog,
} from '@/services/eventService';
import { QRScanner } from '@/components/events/QRScanner';
import type { Event, TicketValidationResult, TicketValidationStats, RecentValidation } from '@/types/events';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

import { useLanguage } from '@/hooks/useLanguage';

export default function TicketValidation() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<TicketValidationStats | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [validationHistory, setValidationHistory] = useState<TicketValidationResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadEvent = useCallback(async (eventId: string) => {
    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }, []);

  const loadStats = useCallback(async (eventId: string, filter: 'today' | 'week' | 'all') => {
    setIsLoading(true);
    try {
      const data = await getTicketValidationStats(eventId, filter);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatsRef = useRef(loadStats);
  React.useEffect(() => {
    loadStatsRef.current = loadStats;
  }, [loadStats]);

  const { validateQR, checkIn, isValidating } = useTicketing({
    eventId: id,
    onValidationSuccess: (ticket) => {
      // Auto check-in on successful validation
      checkIn(ticket.id);
      // Reload stats after validation to show updated stats
      if (id) {
        loadStatsRef.current(id, timeFilter);
      }
    },
  });

  // Load event only once when id changes
  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load stats when id or timeFilter changes
  useEffect(() => {
    if (id) {
      loadStats(id, timeFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, timeFilter]);

  // Auto-refresh stats every 10 seconds (only reload stats, not event)
  useEffect(() => {
    if (!autoRefresh || !id) return;

    const interval = setInterval(() => {
      loadStatsRef.current(id, timeFilter);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, id, timeFilter]);

  const handleValidate = async (qrCode: string) => {
    if (!qrCode.trim()) return;

    const result = await validateQR(qrCode);

    if (result) {
      setValidationHistory([result, ...validationHistory]);
    }

    setQrInput('');
  };

  const handleScan = () => {
    setIsScanning(true);
  };

  const handleScanSuccess = async (qrCode: string) => {
    await handleValidate(qrCode);
    setIsScanning(false);
  };

  const handleScanError = (error: string) => {
    console.error('QR scan error:', error);
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
  };

  const handleExport = () => {
    if (stats && event) {
      exportValidationLog(stats, event.title);
    }
  };

  if (!event) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen flex items-center justify-center">
          <AnimatedOrbs />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="relative z-10"
          >
            <QrCode className="h-12 w-12 text-gray-900" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <AnimatedOrbs />

        <div className="container max-w-7xl py-12 px-4 md:px-8 relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-lg p-8 md:p-12 mb-10 overflow-hidden">
              {/* Subtle decorative element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-50/50 to-transparent rounded-bl-full pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="flex flex-col gap-6">
                  <motion.div whileHover={{ x: -4 }}>
                    <Button
                      variant="ghost"
                      onClick={() => navigate(-1)}
                      className="rounded-xl hover:bg-slate-50 -ml-2 text-slate-500 font-light"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('events.form.validation.back')}
                    </Button>
                  </motion.div>

                  <div className="flex items-center gap-8">
                    <div className="relative w-24 h-24 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg transform -rotate-1 group overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <QrCode className="w-10 h-10 text-white" />
                    </div>

                    <div>
                      <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-slate-900 mb-2"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.04em' }}
                      >
                        {t('events.form.validation.title')}
                      </h1>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-lg bg-slate-50 border-slate-200 font-light text-slate-600">
                          {event.event_type}
                        </Badge>
                        <p className="text-lg font-light text-slate-600"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                        >
                          {event.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleExport}
                    disabled={!stats || isLoading}
                    className="rounded-2xl bg-slate-900 text-white hover:bg-[#8B5CF6] transition-all shadow-lg h-14 px-8 font-light"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('events.form.validation.exportLog')}
                  </Button>

                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant="outline"
                    className={`rounded-2xl border-slate-200 h-14 px-8 font-light transition-all ${autoRefresh ? 'bg-white shadow-lg ring-1 ring-slate-200 text-slate-900' : 'bg-transparent text-slate-400'
                      }`}
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                  >
                    <Clock className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse text-slate-900' : ''}`} />
                    {autoRefresh ? t('events.form.validation.autoRefreshOn') : t('events.form.validation.autoRefreshOff')}
                  </Button>
                </div>
              </div>

              {/* Advanced Filter Tabs */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex items-center gap-6">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-light"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 400 }}>
                  {t('events.form.validation.timeFilter')}
                </span>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  {(['today', 'week', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-6 py-2 rounded-lg text-sm font-light transition-all ${timeFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                    >
                      {t(`events.form.validation.${filter}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
            </div>
          ) : stats ? (
            <>
              {/* Ultra-Modern Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 transition-colors rounded-bl-3xl" />
                  <Ticket className="h-6 w-6 text-slate-600 mb-6 relative z-10" />
                  <p className="text-sm font-light text-slate-500 mb-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.totalTickets')}
                  </p>
                  <h4 className="text-4xl font-light text-slate-900 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                    {stats.totalTickets}
                  </h4>
                </div>

                <div className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-3xl" />
                  <Check className="h-6 w-6 text-[#8B5CF6] mb-6 relative z-10" />
                  <p className="text-sm font-light text-slate-500 mb-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.validated')}
                  </p>
                  <h4 className="text-4xl font-light text-slate-900 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                    {stats.validatedTickets}
                  </h4>
                </div>

                <div className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-3xl" />
                  <Clock className="h-6 w-6 text-slate-600 mb-6 relative z-10" />
                  <p className="text-sm font-light text-slate-500 mb-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.pending')}
                  </p>
                  <h4 className="text-4xl font-light text-slate-900 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                    {stats.pendingValidation}
                  </h4>
                </div>

                <div className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-3xl" />
                  <TrendingUp className="h-6 w-6 text-[#8B5CF6] mb-6 relative z-10" />
                  <p className="text-sm font-light text-slate-500 mb-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.rate')}
                  </p>
                  <h4 className="text-4xl font-light text-slate-900 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                    {stats.validationRate.toFixed(1)}%
                  </h4>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white p-8 overflow-hidden relative">
                  <CardHeader className="px-0 pt-0 mb-8">
                    <CardTitle className="text-xl font-light text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                      {t('events.form.validation.byHour')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.validationsByHour}>
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 300 }} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: 'white' }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#8B5CF6"
                          radius={[6, 6, 6, 6]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white p-8 overflow-hidden">
                  <CardHeader className="px-0 pt-0 mb-8">
                    <CardTitle className="text-xl font-light text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                      {t('events.form.validation.byType')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={stats.validationsByType}
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="count"
                          >
                            {stats.validationsByType.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full md:w-48 space-y-4">
                        {stats.validationsByType.map((type: { type: string; count: number }, index: number) => (
                          <div key={type.type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-xs font-light text-slate-600 whitespace-nowrap">{type.type}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-900">{type.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          {/* Core Scanner Action Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="lg:col-span-2 rounded-3xl border border-slate-200 shadow-lg bg-white p-10 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300" onClick={handleScan}>
              {/* Subtle Background Gradient */}
              <motion.div
                className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#8B5CF6]/5 via-[#8B5CF6]/3 to-transparent rounded-full blur-3xl -mr-32 -mt-32"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.4, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex flex-col items-center justify-center text-center h-full min-h-[300px] gap-8 z-10">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:bg-[#8B5CF6] transition-all duration-300">
                  <Camera className="w-9 h-9 text-white" />
                </div>

                <div>
                  <h3 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 mb-4"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.scanTicket')}
                  </h3>
                  <p className="text-slate-600 text-lg font-light max-w-md mx-auto"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    {t('events.form.validation.scanInstruction')}
                  </p>
                </div>

                <Button
                  className="rounded-2xl bg-slate-900 text-white hover:bg-[#8B5CF6] h-14 px-10 text-base font-light transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                  <Camera className="h-5 w-5 mr-3" />
                  Ouvrir le scanner
                </Button>
              </div>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-lg bg-white p-8 flex flex-col">
              <h3 className="text-xl font-light text-slate-900 mb-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
                Saisie manuelle
              </h3>

              <div className="flex-1 flex flex-col justify-center gap-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-4 font-light text-center"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    Tapez le code du billet
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="BOOH-..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 focus:outline-none text-slate-900 text-sm font-medium transition-all text-center uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidate(qrInput)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleValidate(qrInput)}
                  disabled={isValidating || !qrInput.trim()}
                  className="w-full rounded-xl bg-slate-900 text-white hover:bg-[#8B5CF6] h-14 font-light text-base shadow-lg transition-all disabled:opacity-50"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                  {isValidating ? <Loader2 className="h-5 w-5 animate-spin" /> : t('events.form.scanner.validate')}
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 text-slate-500">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs font-light"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                    Vous pouvez également saisir le code manuellement si le scanner ne fonctionne pas
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Validation History Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-light text-slate-900 mb-8 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 }}>
              {t('events.form.validation.recent')}
            </h3>

            {!stats || stats.recentValidations.length === 0 ? (
              <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
                <Ticket className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                <p className="text-slate-500 font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                  {t('events.form.validation.noValidations')}
                </p>
                <p className="text-sm text-slate-400 font-light mt-1">{t('events.form.validation.startScanning')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentValidations.map((val: RecentValidation, idx: number) => (
                  <motion.div
                    key={val.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center border border-[#8B5CF6]/20">
                      <Check className="h-5 w-5 text-[#8B5CF6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-slate-900 truncate" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                          {val.attendee_name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md tracking-wider border-slate-200">
                          {val.ticket_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-normal truncate mono tracking-wide">{val.ticket_number}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-medium text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                        {format(new Date(val.validated_at), 'HH:mm')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-light uppercase tracking-tighter">
                        Validé
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <QRScanner
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onClose={handleCloseScanner}
        isScanning={isScanning}
        setIsScanning={setIsScanning}
      />
    </DashboardLayout>
  );
}
