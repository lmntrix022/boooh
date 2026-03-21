import React, { useState, useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { Clock, Mail, Phone, Trash2, MoreVertical, Calendar, User, CheckCircle, XCircle, AlertCircle, UserX, CheckCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Appointment = Tables<"appointments">;

interface KanbanViewProps {
  appointments: Appointment[];
  updateStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
}

interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

// Columns will be defined dynamically with translations in the component

// Composant pour un rendez-vous draggable
interface DraggableAppointmentCardProps {
  appointment: Appointment;
  updateStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  index: number;
}

const DraggableAppointmentCard: React.FC<DraggableAppointmentCardProps> = ({
  appointment,
  updateStatus,
  deleteAppointment,
  onEditAppointment,
  index,
}) => {
  const { t, currentLanguage } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: {
      appointment,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "PPP 'à' p", { locale: currentLanguage === 'fr' ? fr : enUS });
    } catch (error) {
      return t('appointments.listView.invalidDate');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm cursor-grab active:cursor-grabbing"
      >
        <div className="p-4 relative z-10">
          {/* Header avec client et menu */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="font-light text-gray-900 text-sm sm:text-base truncate"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {appointment.client_name}
              </p>
              <p className="text-xs text-gray-600 font-light mt-1 truncate"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {appointment.client_email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-gray-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-sm rounded-lg">
                {onEditAppointment && (
                  <DropdownMenuItem 
                    onClick={() => onEditAppointment(appointment)} 
                    className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs font-light"
                  >
                    <Pencil className="w-3 h-3 mr-2 text-gray-600" />
                    {t('appointments.actions.edit') || "Modifier"}
                  </DropdownMenuItem>
                )}
                {appointment.status !== "confirmed" && (
                  <DropdownMenuItem 
                    onClick={() => updateStatus(appointment.id, "confirmed")} 
                    className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                    {t('appointments.actions.confirm')}
                  </DropdownMenuItem>
                )}
                {appointment.status !== "completed" && (
                  <DropdownMenuItem 
                    onClick={() => updateStatus(appointment.id, "completed")} 
                    className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs"
                  >
                    <CheckCheck className="w-3 h-3 mr-2 text-blue-600" />
                    {t('appointments.actions.complete') || "Marquer terminé"}
                  </DropdownMenuItem>
                )}
                {appointment.status !== "no_show" && (
                  <DropdownMenuItem 
                    onClick={() => updateStatus(appointment.id, "no_show")} 
                    className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs"
                  >
                    <UserX className="w-3 h-3 mr-2 text-orange-600" />
                    {t('appointments.actions.noShow') || "Marquer absent"}
                  </DropdownMenuItem>
                )}
                {appointment.status !== "cancelled" && (
                  <DropdownMenuItem 
                    onClick={() => updateStatus(appointment.id, "cancelled")} 
                    className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-2 text-red-600" />
                    {t('appointments.actions.cancel')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => deleteAppointment(appointment.id)}
                  className="text-red-600 hover:bg-red-50 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {t('appointments.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date et heure */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <div className="h-6 w-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                <Calendar className="w-3 h-3 text-gray-600" />
              </div>
              <span className="truncate">{formatDate(appointment.date)}</span>
            </div>
            {appointment.duration && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="h-6 w-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Clock className="w-3 h-3 text-gray-600" />
                </div>
                <span>{t('appointments.kanbanView.duration') || 'Durée'}: {appointment.duration} {t('appointments.kanbanView.min') || 'min'}</span>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <div className="h-6 w-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                <Mail className="w-3 h-3 text-gray-600" />
              </div>
              <span className="truncate">{appointment.client_email}</span>
            </div>
            {appointment.client_phone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="h-6 w-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Phone className="w-3 h-3 text-gray-600" />
                </div>
                <span>{appointment.client_phone}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <p className="text-xs font-light text-gray-700 mb-1"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('appointments.kanbanView.notes') || 'Notes'}
              </p>
              <p className="text-xs text-gray-700 line-clamp-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {appointment.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour une colonne droppable
interface DroppableColumnProps {
  column: KanbanColumn;
  appointments: Appointment[];
  updateStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  columnIndex: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  appointments,
  updateStatus,
  deleteAppointment,
  onEditAppointment,
  columnIndex,
}) => {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      status: column.id,
    },
  });

  const Icon = column.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="relative bg-white p-4 sm:p-6 rounded-t-lg border border-b-0 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <h3 className="font-light text-sm sm:text-base text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {column.label}
            </h3>
          </div>
          <Badge className="text-xs font-light bg-gray-900 text-white border-0 rounded-lg px-3 py-1 shadow-sm">
            {appointments.length}
          </Badge>
        </div>
        {appointments.length > 0 && (
          <p className="text-xs text-gray-600 font-light mt-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {appointments.filter(apt => apt.duration).reduce((sum, apt) => sum + (apt.duration || 0), 0)} {t('appointments.kanbanView.min') || 'min'} {t('appointments.kanbanView.total') || 'total'}
          </p>
        )}
      </div>

      {/* Column Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-white p-3 sm:p-4 rounded-b-lg border border-t-0 border-gray-200 shadow-sm space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto transition-all duration-300 ${
          isOver ? 'bg-gray-50 border-gray-300' : ''
        }`}
      >
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mx-auto mb-3 opacity-30">
              <Icon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-xs font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.kanbanView.noAppointments') || 'Aucun rendez-vous'}
            </p>
          </div>
        ) : (
          appointments.map((appointment, index) => (
            <DraggableAppointmentCard
              key={appointment.id}
              appointment={appointment}
              updateStatus={updateStatus}
              deleteAppointment={deleteAppointment}
              onEditAppointment={onEditAppointment}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ appointments, updateStatus, deleteAppointment, onEditAppointment }) => {
  const { t, currentLanguage } = useLanguage();
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  const columns: KanbanColumn[] = [
    {
      id: "pending",
      label: t('appointments.status.pending'),
      color: "text-gray-900",
      bgColor: "bg-white/60",
      icon: Clock,
    },
    {
      id: "confirmed",
      label: t('appointments.status.confirmed'),
      color: "text-gray-900",
      bgColor: "bg-white/60",
      icon: CheckCircle,
    },
    {
      id: "completed",
      label: t('appointments.status.completed') || "Terminé",
      color: "text-gray-900",
      bgColor: "bg-white/60",
      icon: CheckCheck,
    },
    {
      id: "no_show",
      label: t('appointments.status.no_show') || "Absent",
      color: "text-gray-900",
      bgColor: "bg-white/60",
      icon: UserX,
    },
    {
      id: "cancelled",
      label: t('appointments.status.cancelled'),
      color: "text-gray-900",
      bgColor: "bg-white/60",
      icon: XCircle,
    },
  ];

  // Configuration des sensors pour le drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Nécessite un mouvement de 8px avant de commencer le drag
      },
    })
  );

  // Grouper les rendez-vous par statut
  const appointmentsByStatus = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {
      pending: [],
      confirmed: [],
      completed: [],
      no_show: [],
      cancelled: [],
    };

    appointments.forEach((appointment) => {
      const status = appointment.status || "pending";
      if (grouped[status]) {
        grouped[status].push(appointment);
      } else {
        // Fallback pour les statuts inconnus
        grouped.pending.push(appointment);
      }
    });

    return grouped;
  }, [appointments]);

  // Trouver le rendez-vous en cours de drag
  const activeAppointment = useMemo(() => {
    if (!activeId) return null;
    return appointments.find((apt) => apt.id === activeId);
  }, [activeId, appointments]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const appointmentId = active.id as string;
    const newStatus = over.id as string;

    // Trouver le rendez-vous
    const appointment = appointments.find((apt) => apt.id === appointmentId);

    if (appointment && (appointment.status || "pending") !== newStatus) {
      updateStatus(appointmentId, newStatus);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-4">
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {columns.map((column, columnIndex) => (
              <DroppableColumn
                key={column.id}
                column={column}
                appointments={appointmentsByStatus[column.id]}
                updateStatus={updateStatus}
                deleteAppointment={deleteAppointment}
                onEditAppointment={onEditAppointment}
                columnIndex={columnIndex}
              />
            ))}
          </div>
        </div>

        {/* DragOverlay pour afficher l'élément en cours de drag */}
        <DragOverlay>
          {activeAppointment ? (
            <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm opacity-95">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-light text-gray-900 text-sm truncate"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {activeAppointment.client_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {activeAppointment.client_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <div className="h-5 w-5 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                    <Calendar className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="truncate">
                    {format(parseISO(activeAppointment.date), "PPP 'à' p", { locale: currentLanguage === 'fr' ? fr : enUS })}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
    </>
  );
};

export default KanbanView;
