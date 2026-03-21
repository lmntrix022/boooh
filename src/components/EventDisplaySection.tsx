import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Radio, ArrowRight, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'physical' | 'online' | 'hybrid';
  start_date: string;
  end_date: string;
  location_name?: string;
  cover_image_url?: string;
  is_free: boolean;
  tickets_config?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    soldCount: number;
  }>;
  current_attendees: number;
  max_capacity?: number;
  has_live_stream?: boolean;
  live_stream_status?: 'scheduled' | 'live' | 'ended';
}

interface EventDisplaySectionProps {
  events: Event[];
  cardId?: string;
  onEventClick?: (eventId: string) => void;
}

const EventDisplaySection: React.FC<EventDisplaySectionProps> = memo(({
  events,
  cardId,
  onEventClick,
}) => {
  const navigate = useNavigate();

  // Filtrer seulement les événements à venir (max 4)
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start_date) > now)
      .slice(0, 4);
  }, [events]);

  if (upcomingEvents.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return dateString;
    }
  };

  const handleNavigateToEvents = () => {
    if (cardId) {
      navigate(`/card/${cardId}/events`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Version Premium - Épurée et Luxueuse */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-white/75 via-white/70 to-gray-50/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
        {/* Effet de brillance subtil au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-blue-50/0 to-indigo-50/0 group-hover:from-purple-50/30 group-hover:via-blue-50/20 group-hover:to-indigo-50/30 transition-all duration-700" />

        {/* Ligne de lumière en haut */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />

        <div className="relative p-6">
          {/* En-tête Premium */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Icône avec effet glassmorphism */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 text-base tracking-tight">
                  Événements à venir
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {upcomingEvents.length} {upcomingEvents.length > 1 ? 'événements' : 'événement'}
                </p>
              </div>
            </div>

            {/* Badge premium discret */}
            <div className="px-2.5 py-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full">
              <span className="text-[10px] font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
                PREMIUM
              </span>
            </div>
          </div>

          {/* Liste des événements */}
          <div className="space-y-3 mb-5">
            {upcomingEvents.map((event, index) => {
              const isLive = event.live_stream_status === 'live';

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (onEventClick) {
                      onEventClick(event.id);
                    } else {
                      // Open in same window for public view
                      window.location.href = `/events/${event.id}`;
                    }
                  }}
                  className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-3 hover:shadow-lg cursor-pointer transition-all duration-300 group/item"
                >
                  {/* Image ou placeholder */}
                  <div className="relative h-20 rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-purple-500 to-blue-500">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📅
                      </div>
                    )}
                    
                    {/* Badge LIVE */}
                    {isLive && (
                      <div className="absolute top-1 left-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    )}

                    {/* Badge type */}
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                      {event.event_type === 'physical' ? '📍' : event.event_type === 'online' ? '💻' : '🔀'}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover/item:text-purple-600 transition-colors">
                      {event.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{formatDate(event.start_date)}</span>
                    </div>

                    {event.location_name && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location_name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>
                          {event.current_attendees}
                          {event.max_capacity ? ` / ${event.max_capacity}` : ''}
                        </span>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${event.is_free ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>
                        {event.is_free ? 'Gratuit' : 'Payant'}
                      </Badge>
                    </div>
                  </div>

                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover/item:from-purple-500/5 group-hover/item:to-blue-500/5 transition-all duration-300 rounded-xl" />
                </motion.div>
              );
            })}
          </div>

          {/* Bouton CTA */}
          {events.length > 4 && (
            <motion.button
              onClick={handleNavigateToEvents}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-300"
            >
              {/* Effet de brillance subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />

              <div className="relative flex items-center justify-center gap-2.5">
                <Calendar className="w-4 h-4 text-white/90" />
                <span className="text-sm font-semibold text-white tracking-tight">
                  Voir tous les événements ({events.length})
                </span>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover/btn:translate-x-0.5 group-hover/btn:text-white transition-all" />
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

EventDisplaySection.displayName = 'EventDisplaySection';

export default EventDisplaySection;
