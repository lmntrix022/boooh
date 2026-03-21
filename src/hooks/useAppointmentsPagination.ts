/**
 * Custom hook for paginated appointments with server-side pagination
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type AppointmentType = Tables<"appointments">;

export interface UseAppointmentsPaginationOptions {
  cardId: string;
  itemsPerPage?: number;
  status?: string | null;
  searchQuery?: string;
}

export interface UseAppointmentsPaginationResult {
  appointments: AppointmentType[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useAppointmentsPagination({
  cardId,
  itemsPerPage = 10,
  status = null,
  searchQuery = "",
}: UseAppointmentsPaginationOptions): UseAppointmentsPaginationResult {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAppointments = useCallback(async () => {
    if (!cardId) return;

    setLoading(true);
    setError(null);

    try {
      // Build the query
      let query = supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("card_id", cardId);

      // Apply status filter
      if (status) {
        query = query.eq("status", status);
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `client_name.ilike.%${searchQuery}%,client_email.ilike.%${searchQuery}%,client_phone.ilike.%${searchQuery}%`
        );
      }

      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Execute query with pagination
      const { data, error: fetchError, count } = await query
        .order("date", { ascending: true })
        .range(from, to);

      if (fetchError) throw fetchError;

      setAppointments(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch appointments"));
      setAppointments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [cardId, currentPage, itemsPerPage, status, searchQuery]);

  // Fetch appointments when dependencies change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, searchQuery]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    appointments,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setCurrentPage,
    refetch: fetchAppointments,
  };
}
