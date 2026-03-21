/**
 * EventPreview Component
 * Shows a preview of how the event will appear to attendees
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Globe,
  Video,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '@/types/events';

interface EventPreviewProps {
  data: Partial<Event>;
}

export const EventPreview: React.FC<EventPreviewProps> = ({ data }) => {
  const coverImage = data.cover_image_url || (data.images_urls && data.images_urls[0]);
  const hasTickets = data.tickets_config && data.tickets_config.length > 0;
  const cheapestTicket = hasTickets
    ? data.tickets_config!.reduce((min, tier) => (tier.price < min ? tier.price : min), Infinity)
    : 0;

  return (
    <Card className="overflow-hidden border-2 shadow-xl">
      {/* Cover Image */}
      {coverImage ? (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={coverImage}
            alt={data.title || 'Event preview'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {data.event_type && (
              <Badge className="bg-white/90 text-gray-900">
                {data.event_type === 'physical' ? 'In-Person' : data.event_type === 'online' ? 'Online' : 'Hybrid'}
              </Badge>
            )}
            {data.is_free ? (
              <Badge className="bg-green-500/90 text-white">Free</Badge>
            ) : (
              <Badge className="bg-purple-500/90 text-white">
                From €{cheapestTicket}
              </Badge>
            )}
            {data.has_live_stream && (
              <Badge className="bg-red-500/90 text-white">
                <Video className="h-3 w-3 mr-1" />
                Live Stream
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="h-64 md:h-80 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
          <div className="text-center text-white">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <p className="text-lg font-semibold">No cover image</p>
            <p className="text-sm opacity-80">Add an image to make your event stand out</p>
          </div>
        </div>
      )}

      <CardHeader className="space-y-4">
        {/* Category & Tags */}
        {(data.category || (data.tags && data.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {data.category && (
              <Badge variant="outline" className="rounded-xl">
                {data.category}
              </Badge>
            )}
            {data.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-xl">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <div>
          <CardTitle className="text-3xl md:text-4xl font-bold">
            {data.title || 'Untitled Event'}
          </CardTitle>
          {data.description && (
            <CardDescription className="mt-3 text-base">
              {data.description.length > 200
                ? `${data.description.substring(0, 200)}...`
                : data.description}
            </CardDescription>
          )}
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Date & Time */}
          {data.start_date && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-semibold">
                  {typeof data.start_date === 'string'
                    ? format(new Date(data.start_date), 'PPP')
                    : format(data.start_date, 'PPP')}
                </p>
                <p className="text-sm text-gray-600">
                  {typeof data.start_date === 'string'
                    ? format(new Date(data.start_date), 'p')
                    : format(data.start_date, 'p')}
                  {data.end_date && (
                    <>
                      {' - '}
                      {typeof data.end_date === 'string'
                        ? format(new Date(data.end_date), 'p')
                        : format(data.end_date, 'p')}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {(data.event_type === 'physical' || data.event_type === 'hybrid') && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                {data.location_name && (
                  <p className="font-semibold">{data.location_name}</p>
                )}
                {data.location_address ? (
                  <p className="text-sm text-gray-600">{data.location_address}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No address provided</p>
                )}
              </div>
            </div>
          )}

          {/* Online Event */}
          {data.event_type === 'online' && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Event Type</p>
                <p className="font-semibold">Online Event</p>
                <p className="text-sm text-gray-600">Join from anywhere</p>
              </div>
            </div>
          )}

          {/* Capacity */}
          {data.max_capacity && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-semibold">{data.max_capacity} attendees</p>
                {data.allow_waitlist && (
                  <p className="text-sm text-gray-600">Waitlist available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Tickets */}
      {hasTickets && (
        <CardContent className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Available Tickets</h3>
          <div className="space-y-3">
            {data.tickets_config!.map((tier, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold">{tier.name || 'Unnamed Tier'}</p>
                  {tier.description && (
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  )}
                  {tier.quantity > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {tier.quantity - (tier.soldCount || 0)} / {tier.quantity} available
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-600">
                    €{tier.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Image Gallery Preview */}
      {data.images_urls && data.images_urls.length > 1 && (
        <CardContent className="border-t">
          <h3 className="font-semibold text-lg mb-4">Event Gallery</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {data.images_urls.slice(0, 8).map((url, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Action Button */}
      <CardContent className="border-t">
        <Button className="w-full rounded-2xl" size="lg" disabled>
          {data.is_free ? 'Register for Free' : 'Get Tickets'}
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">
          This is a preview - the button will work once the event is published
        </p>
      </CardContent>
    </Card>
  );
};
