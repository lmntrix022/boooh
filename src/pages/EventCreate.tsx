/**
 * EventCreate Page
 * Create a new event with ultra-modern design
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { EventFormStepper } from '@/components/events/EventFormStepper';
import { useEventCreation } from '@/hooks/useEventCreation';
import { useAuth } from '@/contexts/AuthContext';
import { useCardStore } from '@/stores/cardStore';
import { useUserCards } from '@/hooks/useUserCards';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import type { EventFormData } from '@/types/events';
import { useLanguage } from '@/hooks/useLanguage';

export default function EventCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { selectedCardId, setSelectedCardId } = useCardStore();
  const { cards } = useUserCards();
  const [eventCardId, setEventCardId] = React.useState<string>(selectedCardId || '');

  // Si selectedCardId change, mettre à jour eventCardId
  React.useEffect(() => {
    if (selectedCardId && !eventCardId) {
      setEventCardId(selectedCardId);
    }
  }, [selectedCardId, eventCardId]);

  // Note: Le cardId sera géré dans EventFormStepper via selectedCardIds
  const { createDraft, isCreating } = useEventCreation({
    userId: user?.id || '',
    cardId: eventCardId || undefined, // Utilisé comme fallback, mais EventFormStepper gère selectedCardIds
    onSuccess: (event) => {
      navigate(`/events/${event.id}`);
    },
  });

  const handleSubmit = async (data: EventFormData) => {
    await createDraft(data);
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white apple-minimal-font">
        <div className="container max-w-5xl py-6 px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
              {/* Back button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('events.form.back')}
                </Button>
              </motion.div>

              <div className="relative flex items-center gap-6">
                {/* Icon container - Apple Minimal */}
                <motion.div
                  className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <Plus className="w-6 h-6 text-gray-700" />
                </motion.div>

                <div>
                  <h1
                    className="text-2xl md:text-3xl lg:text-3xl font-light text-gray-900 mb-1 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {t('events.createNewEvent')}
                  </h1>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {selectedCardId 
                      ? t('events.form.eventWillBeLinked')
                      : t('events.form.fillDetailsBelow')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8"
          >
            {/* Sélection de carte */}
            {cards && cards.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Label
                  htmlFor="event-card"
                  className="text-xs md:text-sm font-light text-gray-700 mb-2 block"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Lier cet événement à une carte
                </Label>
                <Select
                  value={eventCardId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setEventCardId('');
                      setSelectedCardId(''); // Aucune carte liée
                    } else {
                      setEventCardId(value);
                      setSelectedCardId(value); // Mettre à jour aussi le store global
                    }
                  }}
                >
                  <SelectTrigger
                    id="event-card"
                    className="h-10 md:h-11 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-300 rounded-lg shadow-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <SelectValue placeholder="Sélectionner une carte (optionnel)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="none" className="rounded-lg">Aucune carte (événement personnel)</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id} className="rounded-lg">
                        {card.name} {card.title ? `- ${card.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {eventCardId 
                    ? 'L\'événement apparaîtra dans la section événements de cette carte'
                    : 'L\'événement ne sera pas lié à une carte spécifique'}
                </p>
              </div>
            )}

            <EventFormStepper
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              isSubmitting={isCreating}
              mode="create"
            />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
