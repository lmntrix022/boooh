/**
 * EventFormStepper Component - Version Premium
 * Multi-step form with auto-save, validation, and premium UX
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, DollarSign, Image, Tag, Eye,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Save, Loader2, Sparkles, X, List, MessagesSquare, Mic, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { EventFormData, TicketTier, EventType } from '@/types/events';
import { MultiImageUpload } from './MultiImageUpload';
import { EventPreview } from './EventPreview';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createEvent, updateEvent } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { LocationPicker } from '@/components/LocationPicker';
import { useUserCards } from '@/hooks/useUserCards';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SpeakersManager, Speaker } from './SpeakersManager';
import { AgendaManager, AgendaItem } from './AgendaManager';
import { FAQManager, FAQItem } from './FAQManager';
import { useToast } from '@/hooks/use-toast';

const emptyNumberToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isNaN(value)) {
    return undefined;
  }

  return value;
};

// Schema hook
const useEventFormSchema = () => {
  const { t } = useLanguage();

  return useMemo(() => z.object({
    title: z.string()
      .min(3, t('events.validation.titleMin'))
      .max(100, t('events.validation.titleMax')),
    description: z.string()
      .min(10, t('events.validation.descMin'))
      .max(5000, t('events.validation.descMax'))
      .optional()
      .or(z.literal('')),
    event_type: z.enum(['physical', 'online', 'hybrid']),
    category: z.string()
      .min(2, t('events.validation.categoryMin') || 'Category too short')
      .optional()
      .or(z.literal('')),
    start_date: z.union([z.string(), z.date()]).refine(
      (val) => {
        if (val instanceof Date) return true;
        if (typeof val === 'string') return val.length > 0;
        return false;
      },
      { message: t('events.validation.startDateRequired') }
    ).transform((val) => val instanceof Date ? val.toISOString() : val),
    end_date: z.union([z.string(), z.date()]).refine(
      (val) => {
        if (val instanceof Date) return true;
        if (typeof val === 'string') return val.length > 0;
        return false;
      },
      { message: t('events.validation.endDateRequired') }
    ).transform((val) => val instanceof Date ? val.toISOString() : val),
    timezone: z.string().default('UTC'),
    location_name: z.string().optional(),
    location_address: z.string().optional(),
    latitude: z.preprocess(emptyNumberToUndefined, z.number().optional()),
    longitude: z.preprocess(emptyNumberToUndefined, z.number().optional()),
    max_capacity: z.preprocess(
      emptyNumberToUndefined,
      z.number().positive(t('events.validation.capacityPositive')).optional()
    ),
    allow_waitlist: z.boolean().default(false),
    cover_image_url: z.string().url(t('events.validation.urlInvalid')).optional().or(z.literal('')),
    promo_video_url: z.string().url(t('events.validation.urlInvalid')).optional().or(z.literal('')),
    images_urls: z.array(z.string()).default([]),
    is_free: z.boolean().default(true),
    is_public: z.boolean().default(true),
    tags: z.array(z.string()).default([]),
    has_live_stream: z.boolean().default(false),
    live_stream_url: z.string().url(t('events.validation.urlInvalid')).optional().or(z.literal('')),
    live_stream_platform: z.enum(['youtube', 'twitch', 'facebook', 'custom']).optional(),
    enable_chat: z.boolean().default(true),
    enable_tips: z.boolean().default(true),
    metadata: z.any().optional(),
  }).refine((data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  }, {
    message: t('events.validation.endDateAfterStart'),
    path: ['end_date'],
  }).refine((data) => {
    if (data.event_type !== 'physical' && data.event_type !== 'hybrid') {
      return true;
    }

    const hasAddress = Boolean(data.location_address?.trim());
    const hasCoordinates =
      typeof data.latitude === 'number' &&
      !Number.isNaN(data.latitude) &&
      typeof data.longitude === 'number' &&
      !Number.isNaN(data.longitude);

    if (!hasAddress && !hasCoordinates) {
      return false;
    }

    return true;
  }, {
    message: t('events.validation.locationRequired'),
    path: ['location_address'],
  }), [t]);
};

interface EventFormStepperProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  eventId?: string;
}

export const EventFormStepper: React.FC<EventFormStepperProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
  eventId,
}) => {
  const { user } = useAuth();
  const { cards } = useUserCards();
  const { t } = useLanguage();
  const { toast } = useToast();
  const eventFormSchema = useEventFormSchema();

  const [currentStep, setCurrentStep] = useState(0);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(
    initialData?.tickets_config || []
  );

  // Metadata state
  const [speakers, setSpeakers] = useState<Speaker[]>(initialData?.metadata?.speakers || []);
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialData?.metadata?.agenda || []);
  const [faq, setFaq] = useState<FAQItem[]>(initialData?.metadata?.faq || []);

  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const initialCardId = (initialData as any)?.card_id ||
    (initialData?.metadata as any)?.associated_card_ids?.[0];
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(
    initialCardId ? [initialCardId] : []
  );

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
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
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
  const watchCoverImage = form.watch('cover_image_url');
  const formValues = form.watch();

  // Auto-save function
  const autoSaveFunction = async (data: any) => {
    if (!user || !eventId) return; // Only auto-save for existing events

    setIsAutoSaving(true);
    try {
      const formData = {
        ...data,
        tickets_config: ticketTiers,
        metadata: {
          ...data.metadata,
          speakers,
          agenda,
          faq,
          associated_card_ids: selectedCardIds,
        }
      };
      await updateEvent(eventId, formData);
      setLastSaved(new Date());
      return formData;
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save hook
  const { forceSave } = useAutoSave(
    mode === 'edit' && eventId ? {
      ...formValues,
      tickets_config: ticketTiers,
      metadata: { speakers, agenda, faq, associated_card_ids: selectedCardIds }
    } : null,
    autoSaveFunction,
    {
      debounceMs: 2000,
      onSuccess: () => {
        setLastSaved(new Date());
      },
    }
  );

  // Steps configuration
  const STEPS = useMemo(() => [
    {
      id: 'basic',
      title: t('events.formSteps.basicInfo'),
      description: t('events.formSteps.basicInfoDesc'),
      icon: Sparkles,
      fields: ['title', 'description', 'event_type', 'category'],
    },
    {
      id: 'content',
      title: t('events.formSteps.content'),
      description: t('events.formSteps.contentDesc'),
      icon: Mic,
      fields: ['metadata'],
    },
    {
      id: 'datetime',
      title: t('events.formSteps.dateTime'),
      description: t('events.formSteps.dateTimeDesc'),
      icon: Calendar,
      fields: ['start_date', 'end_date', 'timezone'],
    },
    {
      id: 'location',
      title: t('events.formSteps.location'),
      description: t('events.formSteps.locationDesc'),
      icon: MapPin,
      fields: ['location_name', 'location_address', 'latitude', 'longitude'],
      conditional: (data: any) => data.event_type !== 'online',
    },
    {
      id: 'capacity',
      title: t('events.formSteps.capacity'),
      description: t('events.formSteps.capacityDesc'),
      icon: Users,
      fields: ['max_capacity', 'allow_waitlist'],
    },
    {
      id: 'ticketing',
      title: t('events.formSteps.ticketing'),
      description: t('events.formSteps.ticketingDesc'),
      icon: DollarSign,
      fields: ['is_free', 'tickets_config'],
    },
    {
      id: 'media',
      title: t('events.formSteps.media'),
      description: t('events.formSteps.mediaDesc'),
      icon: Image,
      fields: ['cover_image_url', 'images_urls', 'promo_video_url'],
    },
    {
      id: 'tags',
      title: t('events.formSteps.tagsVisibility'),
      description: t('events.formSteps.tagsVisibilityDesc'),
      icon: Tag,
      fields: ['tags', 'is_public'],
    },
  ], [t]);

  // Calculate step completion
  const getStepCompletion = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    if (!step) return 0;

    // Skip conditional steps
    if (step.conditional && !step.conditional(formValues)) {
      return 100; // Mark as complete if not applicable
    }

    const values = form.getValues();
    let completed = 0;
    let total = step.fields.length;

    step.fields.forEach(field => {
      if (field === 'tickets_config') {
        if (watchIsFree || ticketTiers.length > 0) {
          completed++;
        }
      } else if (field === 'metadata') {
        // Check if any metadata added
        if (speakers.length > 0 || agenda.length > 0) completed++;
      } else {
        const value = values[field as keyof EventFormData];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            completed++;
          } else if (!Array.isArray(value)) {
            completed++;
          }
        }
      }
    });

    return Math.round((completed / total) * 100);
  };

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const applicableSteps = STEPS.filter((step, index) => {
      if (step.conditional && !step.conditional(formValues)) {
        return false;
      }
      return true;
    });

    const totalCompletion = applicableSteps.reduce((sum, _, index) => {
      return sum + getStepCompletion(index);
    }, 0);

    return Math.round(totalCompletion / applicableSteps.length);
  }, [formValues, ticketTiers, watchIsFree, speakers, agenda, faq]);

  // Get visible steps
  const visibleSteps = useMemo(() => {
    return STEPS.filter((step, index) => {
      if (step.conditional && !step.conditional(formValues)) {
        return false;
      }
      return true;
    });
  }, [formValues]);

  // Navigate steps
  const nextStep = async () => {
    const step = STEPS[currentStep];
    if (step) {
      // Validate current step fields
      const stepFields = step.fields.filter(f => f !== 'tickets_config' && f !== 'metadata');
      const isValid = await form.trigger(stepFields as any);

      if (isValid && currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  const handleSubmit = async (data: EventFormData) => {
    // Ensure dates are strings for the form submission
    const formData: EventFormData = {
      ...data,
      start_date: typeof data.start_date === 'string'
        ? data.start_date
        : data.start_date instanceof Date
          ? data.start_date.toISOString()
          : new Date().toISOString(),
      end_date: typeof data.end_date === 'string'
        ? data.end_date
        : data.end_date instanceof Date
          ? data.end_date.toISOString()
          : new Date().toISOString(),
      tickets_config: ticketTiers,
      metadata: {
        ...(data.metadata || {}),
        speakers,
        agenda,
        faq,
        associated_card_ids: selectedCardIds,
      },
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
    form.setValue('tags', currentTags.filter((t) => t !== tag));
  };

  const currentStepData = STEPS[currentStep];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="sticky top-20 z-20 bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {/* Overall Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {overallProgress === 100 ? (
                <CheckCircle2 className="h-6 w-6 text-gray-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.form.formCompletion')}: {overallProgress}%
                </p>
                <p className="text-xs text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {overallProgress < 50 && t('events.form.fillMoreDetails')}
                  {overallProgress >= 50 && overallProgress < 80 && t('events.form.almostThere')}
                  {overallProgress >= 80 && overallProgress < 100 && t('events.form.lookingGood')}
                  {overallProgress === 100 && t('events.form.allSet')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {mode === 'edit' && eventId && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isAutoSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                      <span className="font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.form.saving')}</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Save className="h-3 w-3 text-gray-600" />
                      <span className="font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.form.saved')} {lastSaved.toLocaleTimeString()}</span>
                    </>
                  ) : null}
                </div>
              )}

              <Button
                type="button"
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="rounded-lg font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {showPreview ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('events.form.editForm')}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('events.form.preview')}
                  </>
                )}
              </Button>
            </div>
          </div>

          <Progress value={overallProgress} className="h-2 mb-4" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {visibleSteps.map((step, index) => {
              const Icon = step.icon;
              const completion = getStepCompletion(index);
              const isActive = index === currentStep;
              const isCompleted = completion === 100;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-shrink-0 font-light ${isActive
                    ? 'bg-gray-900 text-white'
                    : isCompleted
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className={`relative ${isCompleted ? 'text-gray-600' : isActive ? 'text-white' : 'text-gray-400'}`}>
                    <Icon className="h-4 w-4" />
                    {isCompleted && (
                      <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-gray-600" />
                    )}
                  </div>
                  <span className="text-xs font-light hidden sm:inline"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{step.title}</span>
                  {completion > 0 && completion < 100 && (
                    <Badge variant="outline" className="text-xs font-light border border-gray-200"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {completion}%
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Show Preview or Form */}
      {showPreview ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Alert className="bg-gray-50 border border-gray-200">
            <Eye className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-600 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('events.formFields.previewDescription')}
            </AlertDescription>
          </Alert>
          <EventPreview
            data={{
              ...formValues,
              tickets_config: ticketTiers,
              metadata: { speakers, agenda, faq, associated_card_ids: selectedCardIds },
              id: 'preview',
              user_id: 'preview',
              status: 'draft',
              current_attendees: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }}
          />
        </motion.div>
      ) : (
        <form
          onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            const invalidFields = Object.keys(errors);
            const fieldLabels: Partial<Record<keyof EventFormData, string>> = {
              title: 'titre',
              description: 'description',
              category: 'categorie',
              start_date: 'date de debut',
              end_date: 'date de fin',
              timezone: 'fuseau horaire',
              location_name: 'nom du lieu',
              location_address: 'adresse ou position sur la carte',
              latitude: 'latitude',
              longitude: 'longitude',
              max_capacity: 'capacite maximale',
              cover_image_url: 'image de couverture',
              promo_video_url: 'video promotionnelle',
              is_free: 'type de tarification',
              is_public: 'visibilite',
              tags: 'tags',
              live_stream_url: 'url du live',
              live_stream_platform: 'plateforme du live',
            };

            const details = invalidFields.length > 0
              ? invalidFields
                  .map((field) => fieldLabels[field as keyof EventFormData] || field)
                  .join(', ')
              : 'Verifie les champs requis dans les etapes precedentes.';

            toast({
              title: 'Formulaire incomplet',
              description: `Champs a corriger: ${details}`,
              variant: 'destructive',
            });
          })}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Content */}
              {currentStepData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                        <currentStepData.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{currentStepData.title}</CardTitle>
                        <CardDescription className="font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{currentStepData.description}</CardDescription>
                      </div>
                    </div>
                    <Progress
                      value={getStepCompletion(currentStep)}
                      className="h-1 mt-2"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Render step content based on current step */}
                    {currentStepData.id === 'basic' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="title" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.title')} *</Label>
                          <Input
                            id="title"
                            {...form.register('title')}
                            placeholder={t('events.form.titlePlaceholder')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                          {form.formState.errors.title && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.title.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.description')}</Label>
                          <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder={t('events.formFields.descriptionPlaceholder')}
                            rows={4}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="event_type" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.eventType')} *</Label>
                          <Select
                            value={watchEventType}
                            onValueChange={(value) => form.setValue('event_type', value as EventType)}
                          >
                            <SelectTrigger className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                              <SelectItem value="physical">{t('events.filters.physical')}</SelectItem>
                              <SelectItem value="online">{t('events.filters.online')}</SelectItem>
                              <SelectItem value="hybrid">{t('events.filters.hybrid')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.category')}</Label>
                          <Input
                            id="category"
                            {...form.register('category')}
                            placeholder={t('events.formFields.categoryPlaceholder')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>

                        {/* Sélection des cartes de visite */}
                        {cards && cards.length > 0 && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                              <Label className="text-base font-light text-gray-900 tracking-tight"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                {t('events.form.associateCards')}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('events.form.selectCardsDescription')}
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {cards.map((card) => (
                                <div
                                  key={card.id}
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <Checkbox
                                    id={`card-${card.id}`}
                                    checked={selectedCardIds.includes(card.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCardIds([...selectedCardIds, card.id]);
                                      } else {
                                        setSelectedCardIds(selectedCardIds.filter(id => id !== card.id));
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`card-${card.id}`}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3">
                                      {card.avatar_url && (
                                        <img
                                          src={card.avatar_url}
                                          alt={card.name}
                                          className="w-10 h-10 rounded-lg object-cover"
                                        />
                                      )}
                                      <div>
                                        <p className="font-medium text-gray-900">{card.name}</p>
                                        {card.title && (
                                          <p className="text-xs text-gray-500">{card.title}</p>
                                        )}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {selectedCardIds.length > 0 && (
                              <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  ✓ {selectedCardIds.length} {selectedCardIds.length > 1
                                    ? t('events.form.selectedCardsPlural', { count: selectedCardIds.length })
                                    : t('events.form.selectedCards', { count: selectedCardIds.length })}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {currentStepData.id === 'content' && (
                      <div className="space-y-8">
                        <SpeakersManager speakers={speakers} onChange={setSpeakers} />
                        <div className="border-t border-gray-100 my-6" />
                        <AgendaManager agenda={agenda} onChange={setAgenda} />
                        <div className="border-t border-gray-100 my-6" />
                        <FAQManager faq={faq} onChange={setFaq} />
                      </div>
                    )}

                    {currentStepData.id === 'datetime' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_date" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.startDate')}</Label>
                          <Input
                            id="start_date"
                            type="datetime-local"
                            {...form.register('start_date')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                          {form.formState.errors.start_date && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.start_date.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end_date" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.endDate')}</Label>
                          <Input
                            id="end_date"
                            type="datetime-local"
                            {...form.register('end_date')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                          {form.formState.errors.end_date && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.end_date.message}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="timezone" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.timezone')}</Label>
                          <Select
                            defaultValue={form.getValues('timezone')}
                            onValueChange={(value) => form.setValue('timezone', value)}
                          >
                            <SelectTrigger className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px]">
                              {Intl.supportedValuesOf('timeZone').map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'location' && (
                      <div className="space-y-4">
                        <LocationPicker
                          initialLocation={
                            form.getValues('latitude') != null &&
                            form.getValues('longitude') != null
                              ? {
                                  latitude: form.getValues('latitude')!,
                                  longitude: form.getValues('longitude')!,
                                }
                              : null
                          }
                          onLocationChange={(location) => {
                            if (location) {
                              form.setValue('latitude', location.latitude);
                              form.setValue('longitude', location.longitude);
                            } else {
                              form.setValue('latitude', undefined as unknown as number);
                              form.setValue('longitude', undefined as unknown as number);
                            }
                          }}
                          onAddressChange={(address) => {
                            form.setValue('location_address', address);
                          }}
                        />

                        <div className="space-y-2">
                          <Label htmlFor="location_name" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.locationName')}</Label>
                          <Input
                            id="location_name"
                            {...form.register('location_name')}
                            placeholder={t('events.form.locationNamePlaceholder')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'capacity' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="max_capacity" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.maxCapacity')}</Label>
                          <Input
                            id="max_capacity"
                            type="number"
                            {...form.register('max_capacity', { valueAsNumber: true })}
                            placeholder={t('events.form.maxCapacityPlaceholder')}
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>

                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                          <Switch
                            checked={form.watch('allow_waitlist')}
                            onCheckedChange={(checked) => form.setValue('allow_waitlist', checked)}
                          />
                          <Label className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.allowWaitlist')}</Label>
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'ticketing' && (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                          <Switch
                            checked={watchIsFree}
                            onCheckedChange={(checked) => form.setValue('is_free', checked)}
                          />
                          <Label className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.isFreeEvent')}</Label>
                        </div>

                        {!watchIsFree && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{t('events.form.ticketTiers')}</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTicketTier}
                                className="font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('events.form.addTier')}
                              </Button>
                            </div>

                            {ticketTiers.map((tier) => (
                              <Card key={tier.id}>
                                <CardContent className="p-4 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{t('events.form.ticketTier')}</h4>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTicketTier(tier.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >{t('events.form.tierName')}</Label>
                                      <Input
                                        value={tier.name}
                                        onChange={(e) => updateTicketTier(tier.id, { name: e.target.value })}
                                        placeholder="e.g. VIP"
                                        className="font-light"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >{t('events.form.price')}</Label>
                                      <Input
                                        type="number"
                                        value={tier.price}
                                        onChange={(e) => updateTicketTier(tier.id, { price: parseFloat(e.target.value) })}
                                        className="font-light"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="font-light"
                                        style={{
                                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                          fontWeight: 300,
                                        }}
                                      >{t('events.form.tierQuantity')}</Label>
                                      <Input
                                        type="number"
                                        value={tier.quantity}
                                        onChange={(e) => updateTicketTier(tier.id, { quantity: parseInt(e.target.value) })}
                                        className="font-light"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {currentStepData.id === 'media' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.coverImage')}</Label>
                          <MultiImageUpload
                            images={watchCoverImage ? [watchCoverImage] : []}
                            onChange={(urls) => form.setValue('cover_image_url', urls[0] || '')}
                            maxImages={1}
                            className="mb-6"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.galleryImages')}</Label>
                          <MultiImageUpload
                            images={watchImagesUrls}
                            onChange={(urls) => form.setValue('images_urls', urls)}
                            maxImages={10}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="promo_video" className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.promoVideoUrl')}</Label>
                          <Input
                            id="promo_video"
                            {...form.register('promo_video_url')}
                            placeholder="https://youtube.com/..."
                            className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'tags' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('events.form.tags')}</Label>
                          <div className="flex gap-2">
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag();
                                }
                              }}
                              placeholder={t('events.form.tagsPlaceholder')}
                              className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            />
                            <Button type="button" onClick={addTag} className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('common.add')}</Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="px-3 py-1 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-2 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                          <Switch
                            checked={form.watch('is_public')}
                            onCheckedChange={(checked) => form.setValue('is_public', checked)}
                          />
                          <div>
                            <Label className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('events.form.isPublic')}</Label>
                            <p className="text-xs text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('events.form.isPublicDesc')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? onCancel : prevStep}
              disabled={isSubmitting}
              className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {currentStep === 0 ? t('common.cancel') : t('common.back')}
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button type="submit" disabled={isSubmitting} className="font-light bg-gray-900 text-white hover:bg-gray-800"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'create' ? t('events.createEvent') : t('events.saveChanges')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="font-light bg-gray-900 text-white hover:bg-gray-800"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('common.next')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
