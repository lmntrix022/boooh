/**
 * EventForm Component
 * Comprehensive form for creating and editing events
 */

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Users, DollarSign, Plus, X, Eye, Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import type { EventFormData, TicketTier, EventType } from '@/types/events';
import { MultiImageUpload } from './MultiImageUpload';
import { EventPreview } from './EventPreview';

// Form validation schema with advanced validation
const eventFormSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long')
    .optional()
    .or(z.literal('')),
  event_type: z.enum(['physical', 'online', 'hybrid']),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .optional()
    .or(z.literal('')),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  timezone: z.string().default('UTC'),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  max_capacity: z.number()
    .positive('Capacity must be a positive number')
    .optional(),
  allow_waitlist: z.boolean().default(false),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  promo_video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  images_urls: z.array(z.string()).default([]),
  is_free: z.boolean().default(true),
  is_public: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  // Live streaming
  has_live_stream: z.boolean().default(false),
  live_stream_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  live_stream_platform: z.enum(['youtube', 'twitch', 'facebook', 'custom']).optional(),
  enable_chat: z.boolean().default(true),
  enable_tips: z.boolean().default(true),
}).refine((data) => {
  // Validate that end_date is after start_date
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  // Validate that physical/hybrid events have location
  if ((data.event_type === 'physical' || data.event_type === 'hybrid') && !data.location_address) {
    return false;
  }
  return true;
}, {
  message: 'Location is required for physical and hybrid events',
  path: ['location_address'],
});

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}) => {
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(
    initialData?.tickets_config || []
  );
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      event_type: initialData?.event_type || 'physical',
      category: initialData?.category || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
      end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '',
      timezone: initialData?.timezone || 'UTC',
      location_name: initialData?.location_name || '',
      location_address: initialData?.location_address || '',
      max_capacity: initialData?.max_capacity,
      allow_waitlist: initialData?.allow_waitlist || false,
      cover_image_url: initialData?.cover_image_url || '',
      promo_video_url: initialData?.promo_video_url || '',
      images_urls: initialData?.images_urls || [],
      is_free: initialData?.is_free !== false,
      is_public: initialData?.is_public !== false,
      tags: initialData?.tags || [],
      has_live_stream: initialData?.has_live_stream || false,
      live_stream_url: initialData?.live_stream_url || '',
      live_stream_platform: initialData?.live_stream_platform || 'youtube',
      enable_chat: initialData?.enable_chat !== false,
      enable_tips: initialData?.enable_tips !== false,
    },
  });

  const watchEventType = form.watch('event_type');
  const watchIsFree = form.watch('is_free');
  const watchTags = form.watch('tags');
  const watchImagesUrls = form.watch('images_urls');
  const watchHasLiveStream = form.watch('has_live_stream');
  const watchLiveStreamPlatform = form.watch('live_stream_platform');

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const values = form.getValues();
    const fields = [
      { key: 'title', weight: 15 },
      { key: 'description', weight: 10 },
      { key: 'start_date', weight: 10 },
      { key: 'end_date', weight: 10 },
      { key: 'event_type', weight: 5 },
      { key: 'category', weight: 5 },
      { key: 'location_address', weight: 10, conditional: watchEventType !== 'online' },
      { key: 'images_urls', weight: 15, isArray: true },
      { key: 'cover_image_url', weight: 10 },
      { key: 'tags', weight: 5, isArray: true },
      { key: 'max_capacity', weight: 5 },
    ];

    let totalWeight = 0;
    let completedWeight = 0;

    fields.forEach(field => {
      // Skip conditional fields that don't apply
      if (field.conditional === false) return;

      totalWeight += field.weight;
      const value = values[field.key as keyof EventFormData];

      if (field.isArray) {
        if (Array.isArray(value) && value.length > 0) {
          completedWeight += field.weight;
        }
      } else {
        if (value !== undefined && value !== null && value !== '') {
          completedWeight += field.weight;
        }
      }
    });

    // Add ticket tiers completion
    if (!watchIsFree && ticketTiers.length > 0) {
      completedWeight += 10;
    }
    totalWeight += 10;

    return Math.round((completedWeight / totalWeight) * 100);
  }, [form.watch(), ticketTiers, watchEventType, watchIsFree]);

  const handleSubmit = async (data: EventFormData) => {
    const formData = {
      ...data,
      tickets_config: ticketTiers,
    };
    await onSubmit(formData);
  };

  // Ticket tier management
  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        price: 0,
        currency: 'EUR',
        quantity: 0,
        soldCount: 0,
      },
    ]);
  };

  const removeTicketTier = (id: string) => {
    setTicketTiers(ticketTiers.filter((tier) => tier.id !== id));
  };

  const updateTicketTier = (id: string, updates: Partial<TicketTier>) => {
    setTicketTiers(
      ticketTiers.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier))
    );
  };

  // Tag management
  const addTag = () => {
    const currentTags = watchTags || [];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      form.setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = watchTags || [];
    form.setValue(
      'tags',
      currentTags.filter((t) => t !== tag)
    );
  };

  // Get current form values for preview
  const currentFormValues = form.watch();

  return (
    <div className="space-y-6">
      {/* Progress Bar & Preview Toggle */}
      <Card className="sticky top-20 z-20 bg-white/95 backdrop-blur-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {formProgress === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Form Completion: {formProgress}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {formProgress < 50 && 'Fill in more details to create your event'}
                    {formProgress >= 50 && formProgress < 80 && 'Almost there! Add more information'}
                    {formProgress >= 80 && formProgress < 100 && 'Looking good! Just a bit more'}
                    {formProgress === 100 && 'All set! Ready to create your event'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="rounded-xl"
            >
              {showPreview ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Form
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Event
                </>
              )}
            </Button>
          </div>
          <Progress value={formProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Show Preview or Form */}
      {showPreview ? (
        <div className="space-y-4">
          <Alert className="bg-blue-50/50 border-blue-200">
            <Eye className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-gray-700">
              This is how your event will appear to attendees. Click "Edit Form" to make changes.
            </AlertDescription>
          </Alert>
          <EventPreview
            data={{
              ...currentFormValues,
              tickets_config: ticketTiers,
              id: 'preview',
              user_id: 'preview',
              status: 'draft',
              current_attendees: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }}
          />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Essential details about your event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter event title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe your event"
              rows={4}
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type *</Label>
            <Select
              value={watchEventType}
              onValueChange={(value) => form.setValue('event_type', value as EventType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...form.register('category')}
              placeholder="e.g., Conference, Workshop, Concert"
            />
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date & Time *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                {...form.register('start_date')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date & Time *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                {...form.register('end_date')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location (for physical/hybrid events) */}
      {(watchEventType === 'physical' || watchEventType === 'hybrid') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location_name">Venue Name</Label>
              <Input
                id="location_name"
                {...form.register('location_name')}
                placeholder="e.g., Conference Center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_address">Address *</Label>
              <Textarea
                id="location_address"
                {...form.register('location_address')}
                placeholder="Full address"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_capacity">Maximum Capacity</Label>
            <Input
              id="max_capacity"
              type="number"
              {...form.register('max_capacity', { valueAsNumber: true })}
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="allow_waitlist"
              checked={form.watch('allow_waitlist')}
              onCheckedChange={(checked) => form.setValue('allow_waitlist', checked)}
            />
            <Label htmlFor="allow_waitlist">Allow Waitlist</Label>
          </div>
        </CardContent>
      </Card>

      {/* Ticketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ticketing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_free"
              checked={watchIsFree}
              onCheckedChange={(checked) => {
                form.setValue('is_free', checked);
                if (checked) {
                  setTicketTiers([]);
                }
              }}
            />
            <Label htmlFor="is_free">Free Event</Label>
          </div>

          {!watchIsFree && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ticket Tiers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTicketTier}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tier
                </Button>
              </div>

              {ticketTiers.map((tier, index) => (
                <Card key={tier.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Tier name (e.g., VIP)"
                        value={tier.name}
                        onChange={(e) =>
                          updateTicketTier(tier.id, { name: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) =>
                          updateTicketTier(tier.id, {
                            price: parseFloat(e.target.value),
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={tier.quantity}
                        onChange={(e) =>
                          updateTicketTier(tier.id, {
                            quantity: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTicketTier(tier.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>
            Add images and video to make your event more attractive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="cover_image_url">Cover Image URL (Optional)</Label>
            <Input
              id="cover_image_url"
              {...form.register('cover_image_url')}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500">
              Main image displayed on event cards. If not provided, the first gallery image will be used.
            </p>
          </div>

          {/* Image Gallery */}
          <div className="space-y-2">
            <Label>Event Gallery</Label>
            <MultiImageUpload
              images={watchImagesUrls || []}
              onChange={(urls) => form.setValue('images_urls', urls)}
              maxImages={10}
              maxSizeMB={5}
            />
          </div>

          {/* Promo Video */}
          <div className="space-y-2">
            <Label htmlFor="promo_video_url">Promo Video URL (Optional)</Label>
            <Input
              id="promo_video_url"
              {...form.register('promo_video_url')}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500">
              YouTube, Vimeo, or direct video URL
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Streaming */}
      <Card>
        <CardHeader>
          <CardTitle>Live Streaming (Optional)</CardTitle>
          <CardDescription>
            Add a live stream to your event (YouTube, Twitch, Facebook, or custom)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable live stream */}
          <div className="flex items-center space-x-2">
            <Switch
              id="has_live_stream"
              checked={watchHasLiveStream}
              onCheckedChange={(checked) => form.setValue('has_live_stream', checked)}
            />
            <Label htmlFor="has_live_stream">Enable Live Streaming</Label>
          </div>

          {watchHasLiveStream && (
            <>
              {/* Platform selection */}
              <div className="space-y-2">
                <Label htmlFor="live_stream_platform">Platform</Label>
                <Select
                  value={watchLiveStreamPlatform}
                  onValueChange={(value) => form.setValue('live_stream_platform', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="twitch">Twitch</SelectItem>
                    <SelectItem value="facebook">Facebook Live</SelectItem>
                    <SelectItem value="custom">Custom/Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stream URL */}
              <div className="space-y-2">
                <Label htmlFor="live_stream_url">Stream URL</Label>
                <Input
                  id="live_stream_url"
                  {...form.register('live_stream_url')}
                  placeholder="https://youtube.com/watch?v=... or https://twitch.tv/channel"
                />
                <p className="text-xs text-gray-500">
                  {watchLiveStreamPlatform === 'youtube' && 'YouTube video ID or full URL'}
                  {watchLiveStreamPlatform === 'twitch' && 'Twitch channel name or URL'}
                  {watchLiveStreamPlatform === 'facebook' && 'Facebook Live video URL'}
                  {watchLiveStreamPlatform === 'custom' && 'Direct stream URL or embed code'}
                </p>
              </div>

              {/* Chat and tips options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_chat"
                    checked={form.watch('enable_chat')}
                    onCheckedChange={(checked) => form.setValue('enable_chat', checked)}
                  />
                  <Label htmlFor="enable_chat">Enable Live Chat</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_tips"
                    checked={form.watch('enable_tips')}
                    onCheckedChange={(checked) => form.setValue('enable_tips', checked)}
                  />
                  <Label htmlFor="enable_tips">Enable Tips/Donations</Label>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(watchTags || []).map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
              >
                <span className="text-sm">{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={form.watch('is_public')}
              onCheckedChange={(checked) => form.setValue('is_public', checked)}
            />
            <Label htmlFor="is_public">Public Event (visible to everyone)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
            ? 'Create Event'
            : 'Update Event'}
        </Button>
      </div>
    </form>
      )}
    </div>
  );
};
