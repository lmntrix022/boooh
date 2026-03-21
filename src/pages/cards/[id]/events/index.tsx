/**
 * EventsListByCard Page
 * Display all events for a specific card with filters and ticket purchase
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Radio,
  Clock,
  MapPin,
  Users,
  Ticket,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { EventCard } from '@/components/events/EventCard';
import { TicketingWidget } from '@/components/events/TicketingWidget';
import { getCardEvents, getEventById } from '@/services/eventService';
import { optimizedQueries } from '@/lib/optimizedQueries';
import { format } from 'date-fns';
import type { Event } from '@/types/events';

function EventsListByCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'live'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Load card data
  const { data: card, isLoading: loadingCard } = useQuery({
    queryKey: ['card-events-page', id],
    queryFn: async () => {
      if (!id) throw new Error('Card ID is required');
      return await optimizedQueries.getCardWithRelations(id, true);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Load events for this card
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['card-events-list', id],
    queryFn: async () => {
      if (!id) return [];
      return await getCardEvents(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Filter events based on active filter
  const filteredEvents = useMemo(() => {
    const now = new Date();
    
    switch (activeFilter) {
      case 'upcoming':
        return events.filter(e => new Date(e.start_date) > now);
      case 'past':
        return events.filter(e => new Date(e.end_date) < now);
      case 'live':
        return events.filter(e => e.live_stream_status === 'live');
      default:
        return events;
    }
  }, [events, activeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter(e => new Date(e.start_date) > now).length,
      past: events.filter(e => new Date(e.end_date) < now).length,
      live: events.filter(e => e.live_stream_status === 'live').length,
    };
  }, [events]);

  const handleEventClick = async (eventId: string) => {
    try {
      const event = await getEventById(eventId);
      if (event) {
        setSelectedEvent(event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  if (loadingCard || loadingEvents) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-10">
          <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-8 text-center">
            <p className="text-gray-600">Card not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background orbs */}
      <AnimatedOrbs />

      <div className="container mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Back button */}
          <Link
            to={`/card/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to card</span>
          </Link>

          {/* Card info */}
          <div className="flex items-center gap-4 mb-6">
            {card.avatar_url && (
              <img
                src={card.avatar_url}
                alt={card.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200 shadow-lg"
              />
            )}
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                {card.name}'s Events
              </h1>
              <p className="text-gray-600">{stats.total} {stats.total > 1 ? 'events' : 'event'} total</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Past</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.past}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Live</p>
                  <p className="text-2xl font-bold text-red-600">{stats.live}</p>
                </div>
                <Radio className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
            <TabsList className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
              <TabsTrigger value="all" className="rounded-xl">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-xl">
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-xl">
                Past ({stats.past})
              </TabsTrigger>
              <TabsTrigger value="live" className="rounded-xl">
                Live ({stats.live})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'upcoming' && 'No upcoming events'}
              {activeFilter === 'past' && 'No past events'}
              {activeFilter === 'live' && 'No live events'}
              {activeFilter === 'all' && 'No events available'}
            </p>
            <Link to={`/card/${id}`}>
              <Button variant="outline" className="rounded-xl">
                Back to card
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard
                  event={event}
                  showActions={false}
                  onFavorite={() => {}}
                  onShare={() => {}}
                  index={index}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for ticket purchase */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl"
              >
                ×
              </Button>
            </div>
            <div className="p-6">
              <TicketingWidget
                event={selectedEvent}
                onPurchaseComplete={() => {
                  setSelectedEvent(null);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default EventsListByCard;
