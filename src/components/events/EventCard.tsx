/**
 * EventCard Component
 * Displays event information in a card format with ultra-modern design
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedEventImage } from './OptimizedEventImage';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  Globe,
  Share,
  Heart,
  Radio,
  Ticket,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types/events';
import { format } from 'date-fns';
import { isEventFull, hasEventStarted, hasEventEnded, getAvailableSeats } from '@/services/eventService';
import { useLanguage } from '@/hooks/useLanguage';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured' | 'list';
  showActions?: boolean;
  onFavorite?: (eventId: string) => void;
  onShare?: (event: Event) => void;
  index?: number;
}

export const EventCard: React.FC<EventCardProps> = memo(({
  event,
  variant = 'default',
  showActions = true,
  onFavorite,
  onShare,
  index = 0,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isOrganizer = user?.id === event.user_id;
  const eventLink = isOrganizer ? `/events/${event.id}/manage` : `/events/${event.id}`;
  const isFull = isEventFull(event);
  const started = hasEventStarted(event);
  const ended = hasEventEnded(event);
  const availableSeats = getAvailableSeats(event);

  const getStatusBadge = () => {
    if (ended) {
      return <Badge variant="secondary" className="rounded-lg border border-gray-200 font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >{t('events.detail.ended')}</Badge>;
    }
    if (started) {
      return (
        <Badge className="bg-gray-900 text-white border-0 rounded-lg font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <Radio className="h-3 w-3 mr-1 animate-pulse" />
          {t('events.stats.liveNow')}
        </Badge>
      );
    }
    if (isFull) {
      return <Badge variant="destructive" className="rounded-lg font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >{t('events.ticketing.soldOut')}</Badge>;
    }
    if (event.status === 'cancelled') {
      return <Badge variant="destructive" className="rounded-lg font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >{t('events.filters.cancelled')}</Badge>;
    }
    if (event.status === 'draft') {
      return <Badge variant="outline" className="rounded-lg border border-gray-200 font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >{t('events.filters.draft')}</Badge>;
    }
    return <Badge variant="outline" className="rounded-lg border border-gray-200 font-light"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        fontWeight: 300,
      }}
    >{t('events.detail.upcoming')}</Badge>;
  };

  const getEventTypeIcon = () => {
    switch (event.event_type) {
      case 'physical':
        return <MapPin className="h-4 w-4 text-gray-600" />;
      case 'online':
        return <Globe className="h-4 w-4 text-gray-600" />;
      case 'hybrid':
        return <MapPin className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Link to={eventLink}>
          <Card className="bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all rounded-2xl group">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {event.cover_image_url && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <OptimizedEventImage
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full group-hover:scale-110 transition-transform"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge()}
                    {event.is_free && (
                      <Badge className="bg-gray-900 text-white border-0 rounded-lg font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.filters.free')}</Badge>
                    )}
                  </div>
                  <h3 className="font-light truncate group-hover:text-gray-900 transition-colors tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group ${variant === 'featured' ? 'ring-1 ring-gray-300' : ''
        }`}>
        <Link to={eventLink}>
          {event.cover_image_url ? (
            <div className="relative h-52 overflow-hidden">
              <OptimizedEventImage
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Status Badge Overlay */}
              <div className="absolute top-3 right-3">
                {getStatusBadge()}
              </div>

              {/* Live Stream Badge */}
              {event.has_live_stream && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gray-900 text-white border-0 rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Radio className="h-3 w-3 mr-1" />
                    {t('events.detail.liveStream')}
                  </Badge>
                </div>
              )}

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 text-white text-sm">
                  <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(event.start_date), 'MMM d')}</span>
                  </div>
                  {event.max_capacity && (
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl backdrop-blur-sm">
                      <Users className="h-3 w-3" />
                      <span>{event.current_attendees || 0}/{event.max_capacity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-52 bg-gray-100 flex items-center justify-center">
              <Calendar className="h-20 w-20 text-gray-300" />
              <div className="absolute top-3 right-3">
                {getStatusBadge()}
              </div>
            </div>
          )}
        </Link>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link to={eventLink}>
                <h3 className="text-lg md:text-xl font-light hover:text-gray-900 transition-colors mb-2 line-clamp-2 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {event.title}
                </h3>
              </Link>
              {event.category && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Tag className="h-3 w-3" />
                  <span className="capitalize">{event.category}</span>
                </div>
              )}
            </div>
            {event.is_free ? (
              <Badge className="bg-gray-900 text-white border-0 rounded-lg shrink-0 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                Free
              </Badge>
            ) : (
              event.tickets_config && event.tickets_config.length > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-sm font-light text-gray-600"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.formFields.from')} {Math.min(...event.tickets_config.map((t) => t.price)).toFixed(0)} FCFA
                  </div>
                </div>
              )
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {event.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {event.description}
            </p>
          )}

          <div className="space-y-2">
            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                <Calendar className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <span>
                {format(new Date(event.start_date), 'EEEE, MMM d, yyyy')}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                <Clock className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <span>
                {format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}
              </span>
            </div>

            {/* Location */}
            {event.location_name && (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                  {getEventTypeIcon()}
                </div>
                <span className="truncate">{event.location_name}</span>
              </div>
            )}

            {/* Capacity */}
            {event.max_capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                  <Users className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <span>
                  {event.current_attendees || 0} / {event.max_capacity} {t('events.formFields.attendees')}
                  {availableSeats !== null && availableSeats > 0 && (
                    <span className="text-gray-600 ml-1">
                      ({availableSeats} {t('events.formFields.left')})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {event.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs rounded-lg border border-gray-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs rounded-lg border border-gray-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  +{event.tags.length - 3} {t('events.formFields.more')}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="flex gap-2 pt-4">
            <Button
              asChild
              className="flex-1 rounded-lg font-light"
              disabled={isFull || ended}
              variant={started && !ended ? "default" : "outline"}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Link to={eventLink}>
                {isFull ? (
                  <>
                    <Ticket className="h-4 w-4 mr-2" />
                    {t('events.ticketing.soldOut')}
                  </>
                ) : ended ? (
                  t('events.detail.ended')
                ) : started ? (
                  <>
                    <Radio className="h-4 w-4 mr-2 animate-pulse" />
                    {t('events.formFields.joinNow')}
                  </>
                ) : (
                  t('events.formFields.viewDetails')
                )}
              </Link>
            </Button>
            {onShare && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onShare(event)}
                className="rounded-lg"
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
            {onFavorite && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onFavorite(event.id)}
                className="rounded-lg"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.current_attendees === nextProps.event.current_attendees &&
    prevProps.event.status === nextProps.event.status &&
    prevProps.variant === nextProps.variant &&
    prevProps.index === nextProps.index
  );
});

EventCard.displayName = 'EventCard';
