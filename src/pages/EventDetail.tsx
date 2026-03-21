import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Heart,
  Edit,
  Trash2,
  Radio,
  Navigation,
  ExternalLink,
  Info,
  Tag,
  DollarSign,
  Send,
  EyeOff,
  BarChart3,
  Check,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { StatCard } from '@/components/ui/StatCard';
import { TicketingWidget } from '@/components/events/TicketingWidget';
import { EventMap } from '@/components/events/EventMap';
import { EventPhotoGallery } from '@/components/events/EventPhotoGallery';
import { EventHero } from '@/components/events/EventHero';
import { EventSpeakers } from '@/components/events/EventSpeakers';
import { EventAgenda } from '@/components/events/EventAgenda';
import { EventFAQ } from '@/components/events/EventFAQ';
import { EventStickyAction } from '@/components/events/EventStickyAction';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { useAuth } from '@/contexts/AuthContext';
import {
  getEventById,
  deleteEvent,
  addEventToFavorites,
  removeEventFromFavorites,
  isEventFavorited,
  toggleEventStatus,
} from '@/services/eventService';
import { trackEventView } from '@/services/eventAnalyticsService';
import type { Event } from '@/types/events';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Determine if we are in "manage" mode (Dashboard view) or "public" mode
  const isManageMode = location.pathname.includes('/manage');

  // Check if event is favorited
  const checkFavoriteStatus = useCallback(async () => {
    if (user && event) {
      const status = await isEventFavorited(event.id, user.id);
      setIsFavorite(status);
    }
  }, [user, event]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) return;
        const data = await getEventById(id);
        setEvent(data);
        trackEventView(id);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event && user) {
      checkFavoriteStatus();
    }
  }, [event?.id, user?.id, checkFavoriteStatus]);

  const handleFavorite = async () => {
    if (!event || !user) return;

    try {
      if (isFavorite) {
        await removeEventFromFavorites(event.id, user.id);
        setIsFavorite(false);
      } else {
        await addEventToFavorites(event.id, user.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!event) return;

    const action = event.status === 'draft' ? 'publish' : 'unpublish';
    const confirmMessage =
      action === 'publish'
        ? 'Are you sure you want to publish this event? It will be visible to everyone.'
        : 'Are you sure you want to unpublish this event? It will become a draft and not be visible publicly.';

    if (!confirm(confirmMessage)) return;

    setIsTogglingStatus(true);
    try {
      const updatedEvent = await toggleEventStatus(event.id, event.status);
      setEvent(updatedEvent);
      alert(
        action === 'publish'
          ? 'Event published successfully!'
          : 'Event unpublished and set to draft.'
      );
    } catch (error) {
      console.error('Error toggling event status:', error);
      alert('Failed to update event status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    const SkeletonContent = (
      <div className="relative min-h-screen bg-[#FAFAFA] animate-pulse">
        {/* Skeleton Hero */}
        <div className="h-[85vh] bg-gray-200 w-full" />
        <div className="container max-w-7xl px-4 -mt-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-12 bg-gray-200 rounded-full w-96 mb-8" />
              <div className="h-96 bg-white rounded-3xl" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 bg-white rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );

    if (isManageMode) {
      return <DashboardLayout>{SkeletonContent}</DashboardLayout>;
    }

    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <PublicNavbar />
        {SkeletonContent}
      </div>
    );
  }

  if (!event) {
    if (isManageMode) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold mb-4">Event not found</h2>
            <Button onClick={() => navigate('/events')}>Back to Events</Button>
          </div>
        </DashboardLayout>
      );
    }
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center">
        <PublicNavbar />
        <div className="flex flex-col items-center justify-center flex-1">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
        <FooterDark />
      </div>
    );
  }

  const isOrganizer = user?.id === event.user_id;
  const hasStarted = new Date(event.start_date) <= new Date();
  const hasEnded = new Date(event.end_date) < new Date();
  const ticketsAvailable = event.max_capacity
    ? event.max_capacity - (event.current_attendees || 0)
    : 999;

  // Extract metadata
  const eventMetadata = {
    ...event.metadata,
    speakers: event.metadata?.speakers || [],
    agenda: event.metadata?.agenda || [],
    faq: event.metadata?.faq || []
  };

  const hasSpeakers = eventMetadata.speakers.length > 0;
  const hasAgenda = eventMetadata.agenda.length > 0;
  const hasFAQ = eventMetadata.faq.length > 0;

  const EventContent = (
    <div className="relative min-h-screen bg-[#FAFAFA]">

      {/* Sticky Action Bar */}
      <EventStickyAction
        event={event}
        onTicketClick={() => document.getElementById('ticketing-widget')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Hero Section */}
      <EventHero event={event} />

      <div className="container max-w-7xl px-4 md:px-6 -mt-10 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 w-full md:w-auto h-auto flex flex-wrap gap-1">
                  <TabsTrigger
                    value="details"
                    className="rounded-xl h-12 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                  >
                    {t('events.detail.eventDetails')}
                  </TabsTrigger>

                  {hasAgenda && (
                    <TabsTrigger
                      value="agenda"
                      className="rounded-xl h-12 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                    >
                      Agenda
                    </TabsTrigger>
                  )}

                  {hasSpeakers && (
                    <TabsTrigger
                      value="speakers"
                      className="rounded-xl h-12 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                    >
                      Speakers
                    </TabsTrigger>
                  )}

                  {hasFAQ && (
                    <TabsTrigger
                      value="faq"
                      className="rounded-xl h-12 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                    >
                      FAQ
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-8 mt-0">
                  {/* Description */}
                  <Card className="border-none shadow-sm bg-white/80 backdrop-blur-md">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold mb-4">{t('events.detail.about')}</h3>
                      <p className="whitespace-pre-wrap text-gray-600 leading-relaxed text-lg font-light">
                        {event.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Gallery */}
                  {event.images_urls && event.images_urls.length > 0 && (
                    <EventPhotoGallery
                      images={event.images_urls}
                    />
                  )}


                  {/* Map */}
                  {event.latitude && event.longitude && (
                    <EventMap
                      events={[event]}
                      center={{ latitude: event.latitude, longitude: event.longitude }}
                      zoom={14}
                      height="400px"
                    />
                  )}
                </TabsContent>

                <TabsContent value="agenda" className="mt-0">
                  <EventAgenda agenda={eventMetadata.agenda} />
                </TabsContent>

                <TabsContent value="speakers" className="mt-0">
                  <EventSpeakers speakers={eventMetadata.speakers} />
                </TabsContent>

                <TabsContent value="faq" className="mt-0">
                  <EventFAQ faq={eventMetadata.faq} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 border-t pt-8 lg:pt-0 lg:border-t-0 relative">
            <div className="lg:sticky top-24 space-y-6">
              {/* Ticketing Widget (ID for scrolling) */}
              <div id="ticketing-widget" className="relative z-20">
                {!hasEnded ? (
                  <TicketingWidget
                    event={event}
                    onPurchase={() => { }}
                  />
                ) : (
                  <Card className="bg-gray-100 border-none shadow-inner p-8 text-center">
                    <p className="text-gray-500 font-medium">{t('events.detail.ended')}</p>
                  </Card>
                )}
              </div>

              {/* Organizer Card */}
              <Card className="border-none shadow-sm bg-white/80 backdrop-blur-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {event.user_id?.charAt(0).toUpperCase() || 'O'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{t('events.detail.organizer')}</p>
                    <p className="font-bold text-gray-900">{t('events.detail.eventHost')}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 rounded-xl border-gray-200">
                  {t('events.detail.contact')}
                </Button>
              </Card>

              {/* Event Stats / Info */}
              <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl">
                <CardHeader>
                  <CardTitle>{t('events.detail.eventDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t('events.detail.date')}</p>
                      <p className="text-sm font-semibold">
                        {format(new Date(event.start_date), 'EEEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t('events.detail.time')}</p>
                      <p className="text-sm font-semibold">
                        {format(new Date(event.start_date), 'h:mm a')} -{' '}
                        {format(new Date(event.end_date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  {event.max_capacity && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">{t('events.detail.capacity')}</p>
                        <p className="text-sm font-semibold">
                          {ticketsAvailable} {t('events.detail.spotsLeft')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Controls */}
              {isOrganizer && isManageMode && (
                <Card className="border-2 border-dashed border-gray-300 bg-transparent p-6">
                  <h4 className="font-bold text-gray-500 mb-4 flex items-center gap-2">
                    <Edit className="w-4 h-4" /> Admin Controls
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/events/${event.id}/edit`)}>Edit</Button>
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/events/${event.id}/analytics`)}>Stats</Button>
                    <Button
                      variant="outline"
                      className="w-full col-span-2 border-gray-900 text-gray-900 hover:bg-gray-50"
                      onClick={() => navigate(`/events/${event.id}/validate`)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {t('events.form.validation.title')}
                    </Button>
                    <Button
                      variant={event.status === 'published' ? "outline" : "default"}
                      className={`w-full col-span-2 ${event.status === 'published' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      onClick={handleToggleStatus}
                      disabled={isTogglingStatus}
                    >
                      {isTogglingStatus ? 'Updating...' : event.status === 'published' ? 'Unpublish Event' : 'Publish Event'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full col-span-2"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Event'}
                    </Button>
                  </div>
                </Card>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (isManageMode) {
    return <DashboardLayout>{EventContent}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicNavbar />
      <div className="pt-20">
        {EventContent}
      </div>
      <FooterDark />
    </div>
  );
}
