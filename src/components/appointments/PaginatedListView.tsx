/**
 * Paginated List View for Appointments
 * Wraps ListView with pagination controls
 */

import React, { useState, useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import ListView from "./ListView";
import { Pagination } from "@/components/ui/pagination";

type Appointment = Tables<"appointments">;

interface PaginatedListViewProps {
  appointments: Appointment[];
  onUpdateStatus: (appointmentId: string, status: string) => Promise<void>;
  onDelete: (appointmentId: string) => Promise<void>;
  itemsPerPage?: number;
}

const PaginatedListView: React.FC<PaginatedListViewProps> = ({
  appointments,
  onUpdateStatus,
  onDelete,
  itemsPerPage = 12,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const totalPages = Math.ceil(appointments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, appointments.length);

  const paginatedAppointments = useMemo(() => {
    return appointments.slice(startIndex, endIndex);
  }, [appointments, startIndex, endIndex]);

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* List View */}
      <ListView
        appointments={paginatedAppointments}
        updateStatus={onUpdateStatus}
        deleteAppointment={onDelete}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={appointments.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};

export default PaginatedListView;
