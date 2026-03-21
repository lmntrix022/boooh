import React, { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO, isValid, addMinutes, differenceInHours } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { CalendarDays, Clock, CheckCircle, XCircle, Trash2, Sparkles } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import CalendarIntegrationButtons from "@/components/CalendarIntegrationButtons";
import type { CalendarEvent } from "@/utils/calendarUtils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

type Appointment = Tables<"appointments">;

interface ListViewProps {
  appointments: Appointment[];
  updateStatus: (id: string, status: string) => void;
  deleteAppointment: (id: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ appointments, updateStatus, deleteAppointment }) => {
  const { t, currentLanguage } = useLanguage();
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return t('appointments.listView.invalidDate');
      return format(date, "PPP 'à' p", { locale: currentLanguage === 'fr' ? fr : enUS });
    } catch (error) {
      return t('appointments.listView.invalidDate');
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`appointments.status.${status}`);
  };

  const createCalendarEvent = (appointment: Appointment): CalendarEvent => {
    const startTime = new Date(appointment.date);
    const endTime = addMinutes(startTime, appointment.duration || 60);

    return {
      title: `${t('appointments.listView.with')} ${appointment.client_name}`,
      description: appointment.notes || "",
      startTime,
      endTime,
      attendees: [appointment.client_email],
    };
  };

  const isRecent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return differenceInHours(now, date) < 24;
  };

  if (appointments.length === 0) {
    return (
      <div className="relative bg-white border border-gray-200 rounded-lg p-8 sm:p-12 md:p-16 text-center shadow-sm">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mx-auto mb-6">
          <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-3"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontWeight: 300,
          }}
        >
          {t('appointments.listView.noAppointmentsFound') || 'Aucun rendez-vous trouvé'}
        </h3>
        <p className="text-gray-600 font-light max-w-md mx-auto"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          {t('appointments.listView.noAppointmentsDescription') || 'Aucun rendez-vous ne correspond à vos critères de recherche'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appointment, i) => (
          <div
            key={appointment.id}
            className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          >
            {/* Recent Badge */}
            {isRecent(appointment.date) && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-light rounded-lg shadow-sm">
                <Sparkles className="h-3 w-3" />
                {t('appointments.listView.recent') || 'Récent'}
              </div>
            )}

            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-light text-lg sm:text-xl text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {appointment.client_name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-light shadow-sm ${
                        appointment.status === "confirmed"
                          ? "bg-gray-50 text-gray-700 border border-gray-200"
                          : appointment.status === "cancelled"
                          ? "bg-gray-50 text-gray-700 border border-gray-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {appointment.status === "confirmed" && <CheckCircle className="h-3 w-3" />}
                      {appointment.status === "cancelled" && <XCircle className="h-3 w-3" />}
                      {getStatusLabel(appointment.status || "pending")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-gray-600" />
                    </div>
                    <span>{formatDate(appointment.date || "")}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <span>{appointment.duration || 60} {t('appointments.listView.minutes') || 'minutes'}</span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="text-sm text-gray-700 font-light flex items-center gap-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <span>{t('appointments.listView.email') || 'Email'}:</span>
                      <span>{appointment.client_email}</span>
                    </div>
                    {appointment.client_phone && (
                      <div className="text-sm text-gray-700 font-light flex items-center gap-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <span>{t('appointments.listView.phone') || 'Téléphone'}:</span>
                        <span>{appointment.client_phone}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 font-light"
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

                {/* Action Buttons */}
                <div className="flex flex-row sm:flex-col gap-2 justify-end">
                  {appointment.status !== "confirmed" && (
                    <Button
                      size="sm"
                      className="h-10 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                      onClick={() => updateStatus(appointment.id, "confirmed")}
                      aria-label={t('appointments.listView.confirmAria') || 'Confirmer'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('appointments.actions.confirm') || 'Confirmer'}</span>
                    </Button>
                  )}
                  {appointment.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                      onClick={() => updateStatus(appointment.id, "cancelled")}
                      aria-label={t('appointments.listView.cancelAria') || 'Annuler'}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('appointments.actions.cancel') || 'Annuler'}</span>
                    </Button>
                  )}
                  {appointment.status === "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-light"
                      onClick={() => setAppointmentToDelete(appointment.id)}
                      aria-label={t('appointments.listView.deleteAria') || 'Supprimer'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('appointments.actions.delete') || 'Supprimer'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Calendar Integration */}
              {appointment.status === "confirmed" && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-light mb-3 text-gray-700"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('appointments.listView.addToCalendar') || 'Ajouter au calendrier'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <CalendarIntegrationButtons event={createCalendarEvent(appointment)} />
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        ))}
      </div>

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

export default ListView;
