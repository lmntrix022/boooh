/**
 * EventEdit Page
 * Edit an existing event with ultra-modern design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { EventFormStepper } from '@/components/events/EventFormStepper';
import { getEventById, updateEvent } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import type { Event, EventFormData } from '@/types/events';
import { SuccessModal } from '@/components/events/SuccessModal';
import { useLanguage } from '@/hooks/useLanguage';

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const loadEvent = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const data = await getEventById(eventId);

      // Check if user is the owner
      if (data.user_id !== user?.id) {
        alert('You do not have permission to edit this event');
        navigate(`/events/${eventId}`);
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id, loadEvent]);

  const handleSubmit = async (data: EventFormData) => {
    if (!id) return;

    setIsUpdating(true);
    try {
      await updateEvent(id, data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
      setIsUpdating(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate(`/events/${id}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen flex items-center justify-center">
          <AnimatedOrbs />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <Loader2 className="h-12 w-12 text-purple-500" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen">
          <AnimatedOrbs />
          <div className="container max-w-4xl py-12 px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-12"
            >
              <Edit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-light mb-4 tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{t('events.form.eventNotFound')}</h2>
              <p className="text-gray-500 mb-6 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('events.form.eventNotFoundDescription')}
              </p>
              <Button asChild size="lg" className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <a href="/events">{t('events.form.browseEvents')}</a>
              </Button>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                  <Edit className="w-6 h-6 text-gray-700" />
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
                    {t('events.editEvent')}
                  </h1>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('events.form.updateEventDescription')}
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
            <EventFormStepper
              initialData={event}
              onSubmit={handleSubmit}
              onCancel={() => navigate(`/events/${id}`)}
              isSubmitting={isUpdating}
              mode="edit"
              eventId={id}
            />
          </motion.div>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setIsUpdating(false);
          }}
          title="Événement mis à jour !"
          description="Votre événement a été mis à jour avec succès."
          onConfirm={handleSuccessConfirm}
          confirmLabel="Voir l'événement"
        />
      </div>
    </DashboardLayout>
  );
}
