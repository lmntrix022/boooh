/**
 * PublicEventDetail Page - AWWWARDS APPLE MINIMAL
 * Ultra-minimalist design with owner management controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Navigation,
  ExternalLink,
  Tag,
  Share2,
  Edit,
  BarChart3,
  UserCheck,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketingWidget } from '@/components/events/TicketingWidget';
import { EventMap } from '@/components/events/EventMap';
import { SocialShareButtons } from '@/components/events/SocialShareButtons';
import { EventPhotoGallery } from '@/components/events/EventPhotoGallery';
import { OptimizedEventImage } from '@/components/events/OptimizedEventImage';
import { getEventById } from '@/services/eventService';
import { trackEventView } from '@/services/eventAnalyticsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Event } from '@/types/events';
import { format } from 'date-fns';
import { useLanguage } from '@/hooks/useLanguage';

export default function PublicEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<{ name?: string; avatar?: string } | null>(null);

  const loadEvent = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const data = await getEventById(eventId);
      setEvent(data);
      trackEventView(eventId).catch(() => {});
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id, loadEvent]);

  // Load business info if card_id exists
  const { data: cardData } = useQuery({
    queryKey: ['event-card', event?.card_id],
    queryFn: async () => {
      if (!event?.card_id) return null;
      const { data, error } = await supabase
        .from('business_cards')
        .select('name, avatar_url')
        .eq('id', event.card_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!event?.card_id,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (cardData) {
      setBusinessInfo({
        name: cardData.name,
        avatar: cardData.avatar_url || undefined
      });
    }
  }, [cardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-medium mb-4 text-gray-900">Event Not Found</h2>
          <p className="text-gray-500 mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === event.user_id;
  const isLive = event.live_stream_status === 'live';

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>

            {/* Owner Controls - Minimal */}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${event.id}/manage`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${event.id}/analytics`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Analytics
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${event.id}/attendees`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Attendees
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Cover Image - Minimal */}
            {event.cover_image_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100"
              >
                <OptimizedEventImage
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {isLive && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}
              </motion.div>
            )}

            {/* Title & Meta - Ultra Minimal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-3xl font-light text-gray-900 mb-6 leading-tight tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {event.title}
                </h1>
                
                {/* Minimal Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.start_date), 'MMM d, yyyy')}</span>
                  </div>
                  {event.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description - Clean Typography */}
              {event.description && (
                <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-3xl font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {event.description}
                </p>
              )}

              {/* Minimal Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('events.detail.attendees')}</p>
                  <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {event.current_attendees || 0}
                    {event.max_capacity && <span className="text-gray-400">/{event.max_capacity}</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('events.detail.format')}</p>
                  <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {event.event_type === 'physical' ? t('events.detail.inPerson') : event.event_type === 'online' ? t('events.detail.online') : t('events.detail.hybrid')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('events.detail.price')}</p>
                  <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{event.is_free ? t('events.detail.free') : t('events.detail.paid')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('events.detail.category')}</p>
                  <p className="text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{event.category || '—'}</p>
                </div>
              </div>
            </motion.div>

            {/* Tabs - Minimal Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto mb-8">
                  <TabsTrigger 
                    value="about" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-gray-900 font-normal"
                  >
                    {t('events.detail.about')}
                  </TabsTrigger>
                  {event.event_type !== 'online' && (
                    <TabsTrigger 
                      value="location" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-gray-900 font-normal"
                    >
                      {t('events.detail.location')}
                    </TabsTrigger>
                  )}
                  {businessInfo?.name && (
                    <TabsTrigger 
                      value="organizer" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-gray-900 font-normal"
                    >
                      {t('events.detail.organizer')}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="about" className="space-y-8 mt-0">
                  {event.description && (
                    <div>
                      <h3 className="text-xs font-light text-gray-500 uppercase tracking-wide mb-4"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.detail.description')}</h3>
                      <p className="text-gray-500 leading-relaxed whitespace-pre-line font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {event.description}
                      </p>
                    </div>
                  )}

                  {event.images_urls && event.images_urls.length > 0 && (
                    <div>
                      <h3 className="text-xs font-light text-gray-500 uppercase tracking-wide mb-4"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.detail.gallery')}</h3>
                      <EventPhotoGallery images={event.images_urls} />
                    </div>
                  )}

                  {event.tags && event.tags.length > 0 && (
                    <div>
                      <h3 className="text-xs font-light text-gray-500 uppercase tracking-wide mb-4"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.detail.tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <Badge 
                            key={tag}
                            variant="outline" 
                            className="rounded-full px-3 py-1 text-xs font-light border border-gray-200 text-gray-600 bg-transparent"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {event.event_type !== 'online' && (
                  <TabsContent value="location" className="mt-0">
                    {event.location_name && (
                      <div className="space-y-6 mb-8">
                        <div>
                          <h3 className="text-xs font-light text-gray-500 uppercase tracking-wide mb-2"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.detail.venue')}</h3>
                          <p className="text-base md:text-lg font-light text-gray-900 tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >{event.location_name}</p>
                          {event.location_address && (
                            <p className="text-gray-500 mt-1 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{event.location_address}</p>
                          )}
                        </div>
                        
                        {event.latitude && event.longitude && (
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
                                window.open(url, '_blank');
                              }}
                              className="rounded-lg font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              {t('events.detail.directions')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
                                window.open(url, '_blank');
                              }}
                              className="rounded-lg font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t('events.detail.viewMap')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {event.latitude && event.longitude && (
                      <div className="rounded-xl overflow-hidden border border-gray-200">
                        <EventMap
                          center={{
                            latitude: event.latitude!,
                            longitude: event.longitude!
                          }}
                          zoom={14}
                        />
                      </div>
                    )}
                  </TabsContent>
                )}

                {businessInfo?.name && (
                  <TabsContent value="organizer" className="mt-0">
                    <div className="flex items-center gap-4">
                      {businessInfo.avatar ? (
                        <img
                          src={businessInfo.avatar}
                          alt={businessInfo.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{businessInfo.name}</h3>
                        <p className="text-sm text-gray-500 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.detail.eventOrganizer')}</p>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar - Minimal */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            {/* Reserve Card - Clean */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border border-gray-200 rounded-2xl p-6 bg-white"
            >
              <h2 className="text-xl font-light text-gray-900 mb-2">Reserve Your Spot</h2>
              <p className="text-sm text-gray-500 mb-6">
                {event.is_free ? 'Free event - No payment required' : 'Secure your ticket now'}
              </p>
              
              <TicketingWidget
                event={event}
                onPurchaseComplete={() => {
                  // Success handled internally
                }}
              />
            </motion.div>

            {/* Stats Card - Minimal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border border-gray-200 rounded-2xl p-6 bg-white"
            >
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Event Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendees</span>
                  <span className="text-lg font-light text-gray-900">
                    {event.current_attendees || 0}
                    {event.max_capacity && <span className="text-gray-400">/{event.max_capacity}</span>}
                  </span>
                </div>
                
                {event.max_capacity && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Capacity</span>
                      <span>{Math.round(((event.current_attendees || 0) / event.max_capacity) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gray-900 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((event.current_attendees || 0) / event.max_capacity) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Share - Minimal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <SocialShareButtons event={event} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
