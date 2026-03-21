import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import AppointmentToolbar from "./AppointmentToolbar";
import PaginatedListView from "./PaginatedListView";
import KanbanView from "./KanbanView";
import CalendarView from "./CalendarView";
import EditAppointmentModal from "./EditAppointmentModal";
import { notifyClientAppointmentConfirmed, notifyClientAppointmentCancelled } from "@/services/appointmentEmailService";
import { useLanguage } from "@/hooks/useLanguage";
import { notifyOSDrawerRefreshBadges } from "@/utils/osDrawerBadgesSync";

type Appointment = Tables<"appointments">;

export type ViewMode = "list" | "kanban" | "calendar";

export interface AppointmentFilters {
  status: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  duration: {
    min: number | null;
    max: number | null;
  };
}

interface AppointmentDashboardProps {
  cardId: string;
  cardName: string;
}

const AppointmentDashboard: React.FC<AppointmentDashboardProps> = ({ cardId, cardName }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: [],
    dateRange: { start: null, end: null },
    duration: { min: null, max: null },
  });
  
  // Edit modal state
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch appointments function (accessible for refresh)
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("card_id", cardId)
        .order("date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('appointmentManager.errors.error'),
        description: t('appointmentManager.errors.loadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAppointments();
  }, [cardId]);

  // Filter appointments based on search and filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          appointment.client_name?.toLowerCase().includes(searchLower) ||
          appointment.client_email?.toLowerCase().includes(searchLower) ||
          appointment.client_phone?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        if (!filters.status.includes(appointment.status || "pending")) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const appointmentDate = new Date(appointment.date);
        if (filters.dateRange.start && appointmentDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && appointmentDate > filters.dateRange.end) {
          return false;
        }
      }

      // Duration filter
      if (filters.duration.min !== null || filters.duration.max !== null) {
        const duration = appointment.duration || 60;
        if (filters.duration.min !== null && duration < filters.duration.min) {
          return false;
        }
        if (filters.duration.max !== null && duration > filters.duration.max) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, searchTerm, filters]);

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
      );
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: t('appointmentManager.toasts.statusUpdated'),
        description: status === "confirmed" 
          ? t('appointmentManager.toasts.confirmed')
          : status === "cancelled" 
          ? t('appointmentManager.toasts.cancelled')
          : t('appointmentManager.toasts.pending'),
      });

      // Send email notification (non-blocking)
      if (status === "confirmed") {
        notifyClientAppointmentConfirmed(appointmentId).catch((err) => {
          console.error("Failed to send confirmation email:", err);
        });
      } else if (status === "cancelled") {
        notifyClientAppointmentCancelled(appointmentId).catch((err) => {
          console.error("Failed to send cancellation email:", err);
        });
      }
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('appointmentManager.errors.error'),
        description: t('appointmentManager.errors.updateStatusError'),
        variant: "destructive",
      });
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: t('appointmentManager.toasts.deleted'),
        description: t('appointmentManager.toasts.deletedDescription'),
      });
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('appointmentManager.errors.error'),
        description: t('appointmentManager.errors.deleteError'),
        variant: "destructive",
      });
    }
  };

  // Edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditModalOpen(true);
  };

  // Refresh appointments after edit
  const handleEditSuccess = async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("card_id", cardId)
        .order("date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Failed to refresh appointments:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Toolbar */}
      <AppointmentToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        totalAppointments={appointments.length}
        filteredCount={filteredAppointments.length}
        cardName={cardName}
      />

      {/* Views */}
      {viewMode === "list" && (
        <PaginatedListView
          appointments={filteredAppointments}
          onUpdateStatus={updateAppointmentStatus}
          onDelete={deleteAppointment}
          itemsPerPage={12}
        />
      )}

      {viewMode === "kanban" && (
        <KanbanView
          appointments={filteredAppointments}
          updateStatus={updateAppointmentStatus}
          deleteAppointment={deleteAppointment}
          onEditAppointment={handleEditAppointment}
        />
      )}

      {viewMode === "calendar" && (
        <CalendarView
          appointments={filteredAppointments}
          updateStatus={updateAppointmentStatus}
          deleteAppointment={deleteAppointment}
          onEditAppointment={handleEditAppointment}
          onUpdateAppointment={fetchAppointments}
          cardId={cardId}
        />
      )}
      
      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        appointment={editingAppointment}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
        cardId={cardId}
      />
    </div>
  );
};

export default AppointmentDashboard;
