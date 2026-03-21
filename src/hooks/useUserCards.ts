import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type BusinessCard = Tables<"business_cards">;

/**
 * Hook réutilisable pour récupérer les cartes de l'utilisateur
 * 
 * Remplace les queries dupliquées dans:
 * - Sidebar.tsx (lignes 40-63)
 * - DashboardLayout.tsx (lignes 102-118)
 * 
 * Optimisations:
 * - Cache de 15 minutes (cartes changent rarement)
 * - Garbage collection après 1 heure
 * - Auto-select de la première carte si aucune sélectionnée
 * - Stabilisation du tableau retourné pour éviter les re-renders
 * 
 * @returns { data: BusinessCard[], isLoading: boolean, error: Error | null }
 */
export const useUserCards = () => {
  const { user } = useAuth();

  const query = useQuery<BusinessCard[]>({
    queryKey: ["user-cards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("business_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 heure
    retry: 2,
    refetchOnWindowFocus: false, // Prevent auto-refresh on window focus
    refetchOnMount: false, // Prevent auto-refresh on mount if data exists
  });

  // Stabilize the cards array to prevent infinite re-renders
  const stableCards = useMemo(() => query.data || [], [
    query.data?.length,
    query.data?.map(c => c.id).join(',')
  ]);

  return {
    cards: stableCards,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

