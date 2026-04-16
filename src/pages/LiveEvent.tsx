/**
 * LiveEvent Page
 * Full live streaming experience with modern design matching /factures and /stock
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { StatCard } from '@/components/ui/StatCard';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ticket,
  Share2,
  ExternalLink,
  Radio,
  Eye,
  Heart,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getEventById } from '@/services/eventService';
import { LivePlayer, LiveBadge } from '@/components/events/LivePlayer';
import { LiveChat } from '@/components/events/LiveChat';
import { TipWidget, TipCounter } from '@/components/events/TipWidget';
import { useLanguage } from '@/hooks/useLanguage';
import {
  joinAsViewer,
  updateViewerHeartbeat,
  leaveStream,
  generateSessionId,
  getLiveStreamStatus,
  startLiveStream,
  endLiveStream,
} from '@/services/liveStreamingService';

export default function LiveEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessionId] = useState(() => generateSessionId());
  const [viewerCount, setViewerCount] = useState(0);

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch event
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  // Fetch live stream status
  const { data: liveStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['liveStatus', id],
    queryFn: () => getLiveStreamStatus(id!),
    enabled: !!id && !!event?.has_live_stream,
    refetchInterval: 10000,
  });

  const isOrganizer = user?.id === event?.user_id;

  const userId = user?.id;
  const userFullName = user?.user_metadata?.full_name;
  const userEmail = user?.email;

  // Join as viewer when page loads
  useEffect(() => {
    if (!event?.id || !event?.has_live_stream) return;

    const viewerName = userFullName || userEmail || 'Anonymous';
    joinAsViewer(event.id, sessionId, viewerName, userId);

    const heartbeatInterval = setInterval(() => {
      updateViewerHeartbeat(event.id, sessionId);
    }, 20000);

    return () => {
      clearInterval(heartbeatInterval);
      leaveStream(event.id, sessionId);
    };
  }, [event?.id, event?.has_live_stream, sessionId, userId, userFullName, userEmail]);

  // Update viewer count
  useEffect(() => {
    if (liveStatus) {
      setViewerCount(liveStatus.current_viewers);
    }
  }, [liveStatus]);

  const handleStartStream = async () => {
    if (!event?.id || !user?.id || !isOrganizer) return;
    await startLiveStream(event.id, user.id);
    refetchStatus();
  };

  const handleEndStream = async () => {
    if (!event?.id || !user?.id || !isOrganizer) return;
    const replayUrl = event.live_stream_url;
    await endLiveStream(event.id, user.id, replayUrl);
    refetchStatus();
  };

  const handleShare = async () => {
    const shareData = {
      title: event?.title || 'Live Event',
      text: `Watch ${event?.title} live now!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('events.liveEvent.linkCopied'));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-900" />
            <p className="text-gray-600">Loading live event...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen">
          <AnimatedOrbs />
          <div className="container max-w-4xl py-20 px-4 relative z-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Card className="p-8 bg-white/70 backdrop-blur-2xl border-2 border-gray-200/60 shadow-2xl">
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription className="font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.liveEvent.notFound')}
                  </AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/events')} className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light" size="lg"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('events.liveEvent.backToEvents')}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event.has_live_stream) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen">
          <AnimatedOrbs />
          <div className="container max-w-4xl py-20 px-4 relative z-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Card className="p-8 bg-white/70 backdrop-blur-2xl border-2 border-gray-200/60 shadow-2xl text-center">
                <Radio className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-light mb-2 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('events.liveEvent.noLiveStream')}
                </h2>
                <p className="text-gray-500 mb-6 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.liveEvent.noLiveStreamDescription')}
                </p>
                <Button onClick={() => navigate(`/events/${id}`)} size="lg" className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.detail.viewDetails')}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatus = liveStatus?.status || event.live_stream_status || 'scheduled';

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <AnimatedOrbs />
        <div className="container max-w-7xl py-6 px-4 md:px-6 relative z-10">
          {/* Header Ultra-Moderne */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-6 md:p-8 overflow-visible">
              {/* Orbe décoratif animé */}
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-red-400/20 via-pink-400/20 to-purple-400/20 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  x: [0, 20, 0],
                  y: [0, 20, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left: Icon + Title */}
                  <div className="flex items-start gap-4 md:gap-6">
                    {/* Icon Container Ultra-Moderne */}
                    <motion.div
                      className="relative group flex-shrink-0"
                      whileHover={{ scale: 1.08, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-400/50 via-pink-400/50 to-purple-400/50 rounded-3xl blur-md opacity-30"></div>

                      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-2 border-gray-800/30">
                        <motion.div
                          className="absolute inset-0 rounded-3xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                            mixBlendMode: 'overlay'
                          }}
                          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <Radio className={`w-7 h-7 md:w-8 md:h-8 text-white relative z-10 drop-shadow-lg ${currentStatus === 'live' ? 'animate-pulse' : ''}`} />
                      </div>
                    </motion.div>

                    {/* Title Section */}
                    <div className="flex-1 pt-1">
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-2 leading-tight">
                          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                            {event.title}
                          </span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <LiveBadge isLive={currentStatus === 'live'} viewerCount={viewerCount} />
                          {liveStatus && liveStatus.total_tips > 0 && (
                            <TipCounter totalAmount={liveStatus.total_tips} />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      className="rounded-lg border border-gray-200 hover:bg-gray-100 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      title={t('events.liveEvent.share')}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/events/${id}`)}
                      className="rounded-lg border border-gray-200 hover:bg-gray-100 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('events.liveEvent.viewDetails')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/events')}
                      className="rounded-lg border border-gray-200 hover:bg-gray-100 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('events.liveEvent.back')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              icon={Eye}
              label={t('events.liveEvent.currentViewers')}
              value={viewerCount.toString()}
              delay={0.1}
            />
            <StatCard
              icon={Users}
              label={t('events.liveEvent.peakViewers')}
              value={(event.peak_viewers || 0).toString()}
              delay={0.2}
            />
            <StatCard
              icon={Heart}
              label={t('events.liveEvent.totalTips')}
              value={`${(liveStatus?.total_tips || 0).toFixed(2)}€`}
              delay={0.3}
            />
            <StatCard
              icon={Ticket}
              label={t('events.stats.totalAttendees')}
              value={`${event.current_attendees}${event.max_capacity ? `/${event.max_capacity}` : ''}`}
              delay={0.4}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left column: Video player + Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="col-span-12 lg:col-span-8 space-y-6"
            >
              {/* Video Player */}
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden">
                <LivePlayer
                  streamUrl={event.live_stream_url || ''}
                  platform={event.live_stream_platform || 'youtube'}
                  status={currentStatus}
                  currentViewers={viewerCount}
                />
              </div>

              {/* Organizer controls */}
              {isOrganizer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {t('events.liveEvent.organizerControls')}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('events.liveEvent.manageStream')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {currentStatus !== 'live' && (
                        <Button
                          onClick={handleStartStream}
                          className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <Radio className="h-4 w-4 mr-2" />
                          {t('events.liveEvent.startStream')}
                        </Button>
                      )}
                      {currentStatus === 'live' && (
                        <Button
                          onClick={handleEndStream}
                          variant="destructive"
                          className="rounded-lg font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('events.liveEvent.endStream')}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Event info card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-6"
              >
                <div className="space-y-4">
                  {/* Organizer */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        O
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">Event Organizer</p>
                      <p className="text-sm text-gray-500">Host</p>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  )}

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{formatDate(event.start_date)}</span>
                    </div>
                    {event.location_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium line-clamp-1">{event.location_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Right column: Chat + Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]"
            >
              {/* Chat */}
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden flex-1 min-h-[400px]">
                <LiveChat
                  eventId={event.id}
                  isOrganizer={isOrganizer}
                  enabled={event.enable_chat !== false}
                  className="h-full"
                />
              </div>

              {/* Tips */}
              <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden h-[400px]">
                <TipWidget
                  eventId={event.id}
                  organizerName="Event Organizer"
                  enabled={event.enable_tips !== false}
                  totalTips={liveStatus?.total_tips || event.total_tips_amount || 0}
                  className="h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
