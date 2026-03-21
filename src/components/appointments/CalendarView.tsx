import React, { useState, useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO, addMinutes, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, setHours, setMinutes } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronLeft, ChevronRight, Clock, Mail, Phone, CheckCircle, XCircle, Trash2, X, Pencil, GripVertical, Loader2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CalendarIntegrationButtons from "@/components/CalendarIntegrationButtons";
import EditAppointmentModal from "./EditAppointmentModal";
import type { CalendarEvent } from "@/utils/calendarUtils";
import { updateAppointmentWithNotification } from "@/services/availabilityService";
import { notifyClientAppointmentModified } from "@/services/appointmentEmailService";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

type Appointment = Tables<"appointments">;

interface CalendarViewProps {
  appointments: Appointment[];
  updateStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onUpdateAppointment?: () => void;
  cardId?: string;
}

// Draggable appointment component
const DraggableAppointment: React.FC<{
  appointment: Appointment;
  onClick: () => void;
  statusColor: string;
}> = ({ appointment, onClick, statusColor }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${statusColor} text-xs px-2 py-1.5 rounded-lg truncate cursor-pointer hover:opacity-90 flex items-center gap-1 group shadow-sm ${
        isDragging ? 'opacity-30' : ''
      }`}
      style={{ color: 'white' }}
      onClick={onClick}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        style={{ color: 'white' }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </span>
      <span className="truncate flex-1">
        {format(parseISO(appointment.date), "HH:mm")} {appointment.client_name}
      </span>
    </div>
  );
};

// Droppable day component
const DroppableDay: React.FC<{
  day: Date;
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isToday: boolean;
}> = ({ day, children, isCurrentMonth, isToday }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-2 rounded-lg border transition-all ${
        isCurrentMonth ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
      } ${isToday ? "ring-1 ring-gray-900" : ""} ${
        isOver ? "ring-1 ring-gray-400 bg-gray-50" : ""
      }`}
    >
      {children}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ 
  appointments, 
  updateStatus, 
  deleteAppointment,
  onEditAppointment,
  onUpdateAppointment,
  cardId 
}) => {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  
  // Drag and drop confirmation state
  const [dragDropConfirm, setDragDropConfirm] = useState<{
    appointment: Appointment;
    newDate: Date;
  } | null>(null);
  const [sendNotificationOnDrop, setSendNotificationOnDrop] = useState(true);
  const [isUpdatingDrop, setIsUpdatingDrop] = useState(false);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.date);
      return isSameDay(aptDate, day);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-600";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-600";
      case "no_show":
        return "bg-orange-500";
      default:
        return "bg-cyan-600"; // pending
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`appointments.status.${status}`);
  };

  const createCalendarEvent = (appointment: Appointment): CalendarEvent => {
    const startTime = new Date(appointment.date);
    const endTime = addMinutes(startTime, appointment.duration || 60);

    return {
      title: `${t('appointments.calendarView.with')} ${appointment.client_name}`,
      description: appointment.notes || "",
      startTime,
      endTime,
      attendees: [appointment.client_email],
    };
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const apt = event.active.data.current?.appointment as Appointment;
    setDraggedAppointment(apt);
  };

  // Handle drag end - show confirmation dialog for quick reschedule
  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedAppointment(null);
    
    const { active, over } = event;
    if (!over) return;

    const appointment = active.data.current?.appointment as Appointment;
    const targetDay = over.data.current?.day as Date;

    if (!appointment || !targetDay) return;

    // Get original time
    const originalDate = parseISO(appointment.date);
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();

    // Create new date with same time
    let newDate = new Date(targetDay);
    newDate = setHours(newDate, hours);
    newDate = setMinutes(newDate, minutes);

    // Check if date actually changed
    if (isSameDay(originalDate, newDate)) return;

    // Show confirmation dialog for quick reschedule
    setDragDropConfirm({ appointment, newDate });
  };

  // Handle drag drop confirmation
  const handleDragDropConfirm = async () => {
    if (!dragDropConfirm) return;
    
    setIsUpdatingDrop(true);
    
    try {
      const { appointment, newDate } = dragDropConfirm;
      
      // Update the appointment date
      const result = await updateAppointmentWithNotification(appointment.id, {
        newDate,
        modificationReason: "Déplacement via calendrier",
      });
      
      if (!result.success) {
        throw new Error(result.message || "Erreur de mise à jour");
      }
      
      // Send notification email if requested
      let emailSent = false;
      if (sendNotificationOnDrop) {
        try {
          console.log("Sending notification email for appointment:", appointment.id);
          const emailResult = await notifyClientAppointmentModified(appointment.id);
          console.log("Email result:", emailResult);
          emailSent = emailResult.success;
        } catch (emailError) {
          console.error("Failed to send modification email:", emailError);
        }
      }
      
      toast({
        title: "Rendez-vous déplacé",
        description: sendNotificationOnDrop 
          ? (emailSent ? "Le client a été notifié du changement." : "Rendez-vous déplacé (email non envoyé)")
          : "Le rendez-vous a été déplacé.",
      });
      
      // Refresh appointments
      if (onUpdateAppointment) {
        onUpdateAppointment();
      }
    } catch (error: any) {
      console.error("Drag drop update error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de déplacer le rendez-vous.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDrop(false);
      setDragDropConfirm(null);
    }
  };

  // Open edit modal
  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(null);
    setAppointmentToEdit(appointment);
    setEditModalOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setAppointmentToEdit(null);
    onUpdateAppointment?.();
  };

  return (
    <>
      {/* DndContext wraps everything to avoid backdrop-blur positioning issues */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="relative bg-white border border-gray-200 shadow-sm rounded-lg p-4 sm:p-6 md:p-8"
        >
          <div className="relative z-10">
          {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
              {format(currentDate, "MMMM yyyy", { locale: currentLanguage === 'fr' ? fr : enUS })}
            </h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm">
                    {t('appointments.calendarView.today') || 'Aujourd\'hui'}
              </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4">
            {/* Day headers */}
            {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-light text-sm sm:text-base text-gray-700 pb-2 sm:pb-3"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()}>
                  <DroppableDay
                    day={day}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                  >
                    <div className={`text-base sm:text-lg font-light mb-2 ${isToday ? "text-gray-900" : "text-gray-700"}`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-1.5">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <DraggableAppointment
                          key={apt.id}
                          appointment={apt}
                          statusColor={getStatusColor(apt.status || "pending")}
                          onClick={() => setSelectedAppointment(apt)}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs font-light text-gray-600 text-center bg-gray-100 rounded-lg py-1"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          +{dayAppointments.length - 3} {t('appointments.calendarView.others') || 'autres'}
                        </div>
                      )}
                    </div>
                  </DroppableDay>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Drag overlay - rendered outside the card to avoid CSS issues */}
        <DragOverlay dropAnimation={null}>
          {draggedAppointment && (
            <div 
              className={`${getStatusColor(draggedAppointment.status || "pending")} text-white text-xs px-3 py-2 rounded-lg shadow-sm border border-white/30 cursor-grabbing`}
            >
              {format(parseISO(draggedAppointment.date), "HH:mm")} {draggedAppointment.client_name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl border border-gray-200 bg-white rounded-lg shadow-sm">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl sm:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('appointments.calendarView.appointmentDetails') || 'Détails du rendez-vous'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Détails du rendez-vous avec {selectedAppointment.client_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {selectedAppointment.client_name}
                  </h3>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-sm font-light shadow-sm bg-gray-50 text-gray-700 border border-gray-200`}
                  >
                    {getStatusLabel(selectedAppointment.status || "pending")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {format(parseISO(selectedAppointment.date), "PPP", { locale: currentLanguage === 'fr' ? fr : enUS })}
                      </p>
                      <p className="text-sm text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {format(parseISO(selectedAppointment.date), "p", { locale: currentLanguage === 'fr' ? fr : enUS })} • {selectedAppointment.duration || 60} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointments.calendarView.email') || 'Email'}
                      </p>
                      <p className="text-sm text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {selectedAppointment.client_email}
                      </p>
                    </div>
                  </div>

                  {selectedAppointment.client_phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Phone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('appointments.calendarView.phone') || 'Téléphone'}
                        </p>
                        <p className="text-sm text-gray-600 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {selectedAppointment.client_phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedAppointment.notes && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="font-light mb-2 text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('appointments.calendarView.notes') || 'Notes'}
                    </p>
                    <p className="text-gray-700 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    className="h-10 rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                    onClick={() => handleEditClick(selectedAppointment)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('appointments.actions.edit') || 'Modifier'}
                  </Button>
                  
                  {selectedAppointment.status !== "confirmed" && (
                    <Button
                      className="h-10 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                      onClick={() => {
                        updateStatus(selectedAppointment.id, "confirmed");
                        setSelectedAppointment(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('appointments.actions.confirm') || 'Confirmer'}
                    </Button>
                  )}
                  {selectedAppointment.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      className="h-10 rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                      onClick={() => {
                        updateStatus(selectedAppointment.id, "cancelled");
                        setSelectedAppointment(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('appointments.actions.cancel') || 'Annuler'}
                    </Button>
                  )}
                  {selectedAppointment.status === "cancelled" && (
                    <Button
                      variant="ghost"
                      className="h-10 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-light"
                      onClick={() => {
                        setAppointmentToDelete(selectedAppointment.id);
                        setSelectedAppointment(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('appointments.actions.delete') || 'Supprimer'}
                    </Button>
                  )}
                </div>

                {/* Calendar Integration */}
                {selectedAppointment.status === "confirmed" && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-light text-gray-900 mb-3"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('appointments.calendarView.addToCalendar') || 'Ajouter au calendrier'}
                    </h4>
                    <CalendarIntegrationButtons event={createCalendarEvent(selectedAppointment)} />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Drag and Drop Confirmation Dialog */}
      <Dialog open={!!dragDropConfirm} onOpenChange={(open) => !open && setDragDropConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Confirmer le déplacement
            </DialogTitle>
            <DialogDescription>
              Voulez-vous déplacer ce rendez-vous ?
            </DialogDescription>
          </DialogHeader>
          
          {dragDropConfirm && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium text-gray-900">{dragDropConfirm.appointment.client_name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="line-through">
                    {format(parseISO(dragDropConfirm.appointment.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: currentLanguage === 'fr' ? fr : enUS })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <span>→</span>
                  <span>
                    {format(dragDropConfirm.newDate, "EEEE d MMMM yyyy 'à' HH:mm", { locale: currentLanguage === 'fr' ? fr : enUS })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  {sendNotificationOnDrop ? (
                    <Bell className="h-4 w-4 text-blue-600" />
                  ) : (
                    <BellOff className="h-4 w-4 text-gray-400" />
                  )}
                  <Label htmlFor="notify-client" className="text-sm font-medium text-gray-700">
                    Notifier le client par email
                  </Label>
                </div>
                <Switch
                  id="notify-client"
                  checked={sendNotificationOnDrop}
                  onCheckedChange={setSendNotificationOnDrop}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDragDropConfirm(null)}
              disabled={isUpdatingDrop}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDragDropConfirm}
              disabled={isUpdatingDrop}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdatingDrop ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Déplacement...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => !open && setAppointmentToDelete(null)}
        title={t('appointments.deleteDialog.title')}
        description={t('appointments.deleteDialog.description')}
        confirmText={t('appointments.deleteDialog.confirm')}
        cancelText={t('appointments.deleteDialog.cancel')}
        onConfirm={() => appointmentToDelete && deleteAppointment(appointmentToDelete)}
        variant="danger"
      />

      {/* Edit Appointment Modal */}
      {cardId && (
        <EditAppointmentModal
          appointment={appointmentToEdit}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleEditSuccess}
          cardId={cardId}
        />
      )}
    </>
  );
};

export default CalendarView;
