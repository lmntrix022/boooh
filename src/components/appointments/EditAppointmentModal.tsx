/**
 * Edit Appointment Modal
 * Allows card owners to modify appointment details with notification to client
 */

import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { format, parse, isValid, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  Clock, 
  Loader2, 
  Save, 
  Mail, 
  AlertTriangle,
  Check 
} from "lucide-react";
import { 
  updateAppointmentWithNotification, 
  checkSlotAvailability,
  getAvailableSlots 
} from "@/services/availabilityService";
import { notifyClientAppointmentModified } from "@/services/appointmentEmailService";

type Appointment = Tables<"appointments">;

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cardId: string;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  open,
  onOpenChange,
  onSuccess,
  cardId
}) => {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  
  // Form states
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>("");
  const [modificationReason, setModificationReason] = useState<string>("");
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      const aptDate = parseISO(appointment.date);
      setDate(aptDate);
      setTimeSlot(format(aptDate, "HH:mm"));
      setDuration(appointment.duration || 60);
      setNotes(appointment.notes || "");
      setModificationReason("");
      setSlotConflict(null);
    }
  }, [appointment]);

  // Load available slots when date changes
  useEffect(() => {
    if (!date || !cardId) return;
    
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await getAvailableSlots(cardId, date);
        // Always include current slot
        const currentSlot = appointment ? format(parseISO(appointment.date), "HH:mm") : "";
        const allSlots = [...new Set([...slots, currentSlot])].sort();
        setAvailableSlots(allSlots);
      } catch (error) {
        console.error("Failed to load slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    loadSlots();
  }, [date, cardId, appointment]);

  // Check for conflicts when slot changes
  useEffect(() => {
    if (!date || !timeSlot || !appointment) return;
    
    const checkConflict = async () => {
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(hours, minutes, 0, 0);
      
      // Skip check if date hasn't changed
      const originalDate = parseISO(appointment.date);
      if (slotDate.getTime() === originalDate.getTime()) {
        setSlotConflict(null);
        return;
      }
      
      const result = await checkSlotAvailability(cardId, slotDate, duration, appointment.id);
      
      if (!result.available && result.conflict) {
        setSlotConflict(`Conflit avec ${result.conflict.clientName} à ${result.conflict.time}`);
      } else {
        setSlotConflict(null);
      }
    };
    
    checkConflict();
  }, [date, timeSlot, duration, cardId, appointment]);

  const handleSave = async () => {
    if (!appointment || !date || !timeSlot) return;
    
    if (slotConflict) {
      toast({
        title: "Conflit de créneau",
        description: "Veuillez choisir un autre horaire.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Build new date
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      
      // Check if anything changed
      const originalDate = parseISO(appointment.date);
      const dateChanged = newDate.getTime() !== originalDate.getTime();
      const durationChanged = duration !== (appointment.duration || 60);
      const notesChanged = notes !== (appointment.notes || "");
      
      if (!dateChanged && !durationChanged && !notesChanged) {
        toast({
          title: "Aucune modification",
          description: "Les informations sont identiques.",
        });
        onOpenChange(false);
        return;
      }
      
      // Update the appointment
      const result = await updateAppointmentWithNotification(appointment.id, {
        newDate: dateChanged ? newDate : undefined,
        newDuration: durationChanged ? duration : undefined,
        notes: notesChanged ? notes : undefined,
        modificationReason: modificationReason || undefined,
      });
      
      if (!result.success) {
        throw new Error(result.message || "Erreur de mise à jour");
      }
      
      // Send notification email if requested
      if (sendNotification && result.needsNotification) {
        try {
          await notifyClientAppointmentModified(appointment.id);
        } catch (emailError) {
          console.error("Failed to send modification email:", emailError);
          // Don't fail the update if email fails
        }
      }
      
      toast({
        title: "Rendez-vous modifié",
        description: sendNotification 
          ? "Le client sera notifié des changements." 
          : "Modifications enregistrées.",
      });
      
      onSuccess();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le rendez-vous.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-gray-200 bg-white rounded-lg shadow-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            <Clock className="h-5 w-5 text-gray-600" />
            Modifier le rendez-vous
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Client info (read-only) */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Client
            </p>
            <p className="font-light text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {appointment.client_name}
            </p>
            <p className="text-sm text-gray-600 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {appointment.client_email}
            </p>
          </div>
          
          {/* Date selection */}
          <div className="space-y-2">
            <Label className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: currentLanguage === 'fr' ? fr : enUS }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CustomCalendar
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time selection */}
          <div className="space-y-2">
            <Label className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Heure
            </Label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Chargement des créneaux...</span>
              </div>
            ) : (
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'heure" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {slotConflict && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {slotConflict}
                </span>
              </div>
            )}
          </div>
          
          {/* Duration */}
          <div className="space-y-2">
            <Label className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Durée (minutes)
            </Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="90">1h30</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes..."
              rows={3}
              className="resize-none"
            />
          </div>
          
          {/* Modification reason */}
          <div className="space-y-2">
            <Label className="font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Raison de la modification (optionnel)
            </Label>
            <Input
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              placeholder="Ex: Demande du client, indisponibilité..."
            />
          </div>
          
          {/* Send notification toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Notifier le client
                </p>
                <p className="text-sm text-gray-600 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Envoyer un email avec les modifications
                </p>
              </div>
            </div>
            <Switch
              checked={sendNotification}
              onCheckedChange={setSendNotification}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !!slotConflict}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentModal;

