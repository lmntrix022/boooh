import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Loader2, Check } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CustomCalendar } from "./ui/CustomCalendar";
import { motion } from "framer-motion";
import { ContactAutoCreation } from '@/services/contactAutoCreation';
import { sendNewAppointmentEmails } from '@/services/appointmentEmailService';
import {
  getAvailabilitySettings,
  getAvailableSlots,
  getUserTimezone,
  bookAppointmentAtomic,
  getNextAvailableSlots,
  checkSlotAvailability,
  type BookingResult
} from '@/services/availabilityService';

interface AppointmentFormProps {
  cardId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  cardId,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [slotConflict, setSlotConflict] = useState<{
    message: string;
    nextAvailable?: Array<{ slotTime: Date; slotFormatted: string }>;
  } | null>(null);
  const [checkingSlot, setCheckingSlot] = useState(false);

  // Load availability settings and timezone
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAvailabilitySettings(cardId);
        if (settings) {
          setTimezone(settings.timezone);
        } else {
          setTimezone(getUserTimezone());
        }
      } catch (error) {
        console.error("Failed to load availability settings:", error);
        setTimezone(getUserTimezone());
      }
    };
    loadSettings();
  }, [cardId]);

  // Load available slots when date changes
  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await getAvailableSlots(cardId, date);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to load available slots:", error);
        // Fallback to default slots
        setAvailableSlots([
          "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
          "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
        ]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [date, cardId]);

  // Real-time slot availability check when user selects a time
  const handleTimeSlotSelect = async (time: string) => {
    if (!date) return;

    setTimeSlot(time);
    setSlotConflict(null);
    setCheckingSlot(true);

    try {
      const [hours, minutes] = time.split(":").map(Number);
      const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      slotDate.setHours(hours, minutes, 0, 0);

      const availability = await checkSlotAvailability(cardId, slotDate, 60);

      if (!availability.available && availability.conflict) {
        // Slot is taken, get alternatives
        const alternatives = await getNextAvailableSlots(cardId, slotDate, 60, 3);
        setSlotConflict({
          message: `Ce créneau est réservé par ${availability.conflict.clientName}`,
          nextAvailable: alternatives
        });
      }
    } catch (error) {
      console.error("Error checking slot:", error);
    } finally {
      setCheckingSlot(false);
    }
  };

  // Select an alternative slot
  const selectAlternativeSlot = (slot: { slotTime: Date; slotFormatted: string }) => {
    setDate(slot.slotTime);
    setTimeSlot(format(slot.slotTime, "HH:mm"));
    setSlotConflict(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !timeSlot || !name || !email) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSlotConflict(null);

    try {
      // Parse le créneau horaire et configure la date complète
      const timeFormat = 'HH:mm';
      const timeParts = parse(timeSlot, timeFormat, new Date());

      if (!isValid(timeParts)) {
        throw new Error("Format d'heure invalide");
      }

      // Fix: Utiliser la date locale sans conversion timezone
      const appointmentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      appointmentDate.setHours(timeParts.getHours(), timeParts.getMinutes(), 0, 0);

      // Use atomic booking with conflict prevention
      const bookingResult = await bookAppointmentAtomic(
        cardId,
        name,
        email,
        appointmentDate,
        phone || null,
        notes || null,
        60,
        timezone
      );

      if (!bookingResult.success) {
        if (bookingResult.error === 'SLOT_CONFLICT') {
          // Slot was taken between selection and submission
          const alternatives = await getNextAvailableSlots(cardId, appointmentDate, 60, 3);
          setSlotConflict({
            message: bookingResult.message || "Ce créneau vient d'être réservé",
            nextAvailable: alternatives
          });
          toast({
            title: "Créneau indisponible",
            description: "Ce créneau vient d'être réservé. Choisissez un autre horaire.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(bookingResult.message || "Erreur de réservation");
      }

      const newAppointmentId = bookingResult.appointmentId;

      // Créer automatiquement le contact
      try {
        await ContactAutoCreation.createContactFromAppointment(cardId, {
          client_name: name,
          client_email: email,
          client_phone: phone,
          notes: notes,
          date: appointmentDate.toISOString(),
          card_id: cardId
        });
      } catch (contactError) {
        // Warning log removed
        // Ne pas faire échouer le RDV si la création du contact échoue
      }

      // Send email notifications (non-blocking)
      if (newAppointmentId) {
        sendNewAppointmentEmails(newAppointmentId).catch((emailError) => {
          console.error("Email notification failed:", emailError);
          // Don't fail the appointment if email fails
        });
      }

      setSuccess(true);
      toast({
        title: "Rendez-vous demandé",
        description: "Votre demande de rendez-vous a été envoyée avec succès. Vous recevrez un email de confirmation.",
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error: any) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible de planifier votre rendez-vous. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {success ? (
        <motion.div
          className="flex flex-col items-center justify-center py-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2 tracking-tight">
            Rendez-vous demandé avec succès
          </h3>
          <p className="text-gray-600 leading-relaxed font-light text-sm">
            Votre demande a été envoyée et vous recevrez une confirmation par email dans les prochaines minutes.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 p-4 sm:p-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
              Date <span className="text-red-400">*</span>
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-light h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <CalendarIcon className="mr-4 h-5 w-5 text-gray-400" />
                  {date ? (
                    <span className="text-gray-900 font-light">{format(date, "EEEE d MMMM yyyy", { locale: fr })}</span>
                  ) : (
                    <span className="text-gray-500 font-light">Sélectionnez une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-gray-200 shadow-lg bg-white">
                <CustomCalendar
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {date && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
                Heure <span className="text-red-400">*</span>
              </Label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-600 mt-2 font-light">Chargement des créneaux...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 font-light">Aucun créneau disponible pour cette date</p>
                  <p className="text-xs text-gray-500 mt-1 font-light">Veuillez sélectionner une autre date</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((time: string) => {
                      // Désactiver le créneau si c'est aujourd'hui et l'heure est passée
                      let isDisabled = false;
                      if (date) {
                        const now = new Date();
                        const selectedDay = date;
                        const [hour, minute] = time.split(":").map(Number);
                        const slotDate = new Date(selectedDay);
                        slotDate.setHours(hour, minute, 0, 0);

                        // Si c'est aujourd'hui et l'heure du créneau est passée
                        if (
                          selectedDay.toDateString() === now.toDateString() &&
                          slotDate <= now
                        ) {
                          isDisabled = true;
                        }
                      }

                      return (
                        <motion.button
                          key={time}
                          type="button"
                          className={`p-2 sm:p-4 rounded-xl text-xs sm:text-sm font-light transition-all duration-300 ${timeSlot === time
                            ? "bg-gray-900 text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                            } ${isDisabled ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}
                          onClick={() => !isDisabled && handleTimeSlotSelect(time)}
                          disabled={isDisabled}
                          whileHover={!isDisabled ? { scale: 1.01 } : {}}
                          whileTap={!isDisabled ? { scale: 0.99 } : {}}
                        >
                          {checkingSlot && timeSlot === time ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            time
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Slot conflict warning with alternatives */}
                  {slotConflict && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-light">!</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm font-light mb-3">
                            {slotConflict.message}
                          </p>

                          {slotConflict.nextAvailable && slotConflict.nextAvailable.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-gray-700 text-xs font-medium uppercase tracking-wider">
                                Créneaux alternatifs disponibles
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {slotConflict.nextAvailable.map((slot, index) => (
                                  <motion.button
                                    key={index}
                                    type="button"
                                    onClick={() => selectAlternativeSlot(slot)}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-light"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                  >
                                    {slot.slotFormatted}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
              Nom <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet"
              required
              className="h-12 border-gray-200 focus:border-gray-300 focus:ring-0 transition-all duration-200 font-light bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="h-12 border-gray-200 focus:border-gray-300 focus:ring-0 transition-all duration-200 font-light bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
              Téléphone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+241 06 24 34 57 8"
              className="h-12 border-gray-200 focus:border-gray-300 focus:ring-0 transition-all duration-200 font-light bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires, objet du rendez-vous..."
              rows={3}
              className="border-gray-200 focus:border-gray-300 focus:ring-0 transition-all duration-200 font-light bg-white resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 pt-4 sm:pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-11 sm:h-12 px-4 sm:px-6 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 font-light w-full sm:w-auto"
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              className="h-11 sm:h-12 px-6 sm:px-8 bg-gray-900 hover:bg-gray-800 text-white font-light transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
              disabled={!date || !timeSlot || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Demander un rendez-vous"
              )}
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default AppointmentForm;
