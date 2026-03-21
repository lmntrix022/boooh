/**
 * Hook pour gérer les packages de setup Opéré
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OpereSetupPackage } from '@/types/subscription';
import { recommendOperePackage, calculateOpereROI } from '@/services/opereROICalculator';

export interface OpereSetupPayment {
  id: string;
  user_id: string;
  package_id: string;
  amount_paid_fcfa: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  transaction_id?: string;
  paid_at?: string;
  services_delivered: string[];
  completion_percentage: number;
  admin_notes?: string;
  client_feedback?: string;
  delivery_started_at?: string;
  delivery_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export function useOpereSetup(userId?: string) {
  const [packages, setPackages] = useState<OpereSetupPackage[]>([]);
  const [payments, setPayments] = useState<OpereSetupPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les packages disponibles
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('opere_setup_packages')
          .select('*')
          .order('price_fcfa', { ascending: true });
        
        if (error) throw error;
        
        // Transformer les données
        const transformedPackages: OpereSetupPackage[] = (data || []).map((pkg: any) => ({
          id: pkg.package_id,
          name: pkg.name,
          price: pkg.price_fcfa,
          priceEUR: pkg.price_eur / 100, // Convertir centimes en EUR
          duration: pkg.duration,
          includes: pkg.includes || [],
          excludes: pkg.excludes || [],
          recommended: pkg.recommended,
          popular: pkg.is_popular,
          targetRevenue: {
            min: pkg.target_revenue_min || 0,
            max: pkg.target_revenue_max || Infinity,
          },
        }));
        
        setPackages(transformedPackages);
      } catch (err) {
        console.error('Erreur chargement packages:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, []);
  
  // Charger les paiements de l'utilisateur
  useEffect(() => {
    if (!userId) return;
    
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('opere_setup_payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPayments(data as OpereSetupPayment[] || []);
      } catch (err) {
        console.error('Erreur chargement paiements:', err);
      }
    };
    
    fetchPayments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('opere_payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opere_setup_payments',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // Vérifier si l'utilisateur a payé un setup
  const hasPaidSetup = useMemo(() => {
    return payments.some(p => p.payment_status === 'paid');
  }, [payments]);
  
  // Dernier paiement
  const latestPayment = useMemo(() => {
    return payments.length > 0 ? payments[0] : null;
  }, [payments]);
  
  // Statut de completion
  const completionStatus = useMemo(() => {
    if (!latestPayment || latestPayment.payment_status !== 'paid') {
      return null;
    }
    
    return {
      percentage: latestPayment.completion_percentage,
      isComplete: latestPayment.completion_percentage === 100,
      servicesDelivered: latestPayment.services_delivered || [],
      startedAt: latestPayment.delivery_started_at,
      completedAt: latestPayment.delivery_completed_at,
    };
  }, [latestPayment]);
  
  // Recommander un package
  const getRecommendation = (requirements: {
    expectedMonthlyRevenue: number;
    needsMarketing?: boolean;
    needsContentCreation?: boolean;
    needsCustomIntegration?: boolean;
  }) => {
    return recommendOperePackage(requirements);
  };
  
  // Calculer le ROI pour un package
  const calculateROI = (packageId: string, expectedMonthlyRevenue: number, profitMargin?: number) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return null;
    
    return calculateOpereROI(pkg, expectedMonthlyRevenue, profitMargin);
  };
  
  // Initier un paiement
  const initiatePayment = async (
    packageId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    
    try {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        return { success: false, error: 'Package introuvable' };
      }
      
      const { data, error } = await supabase
        .from('opere_setup_payments')
        .insert({
          user_id: userId,
          package_id: packageId,
          amount_paid_fcfa: pkg.price,
          payment_status: 'pending',
          payment_method: paymentMethod,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, paymentId: data.id };
    } catch (err) {
      console.error('Erreur initiation paiement:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      };
    }
  };
  
  // Mettre à jour le feedback client
  const submitFeedback = async (paymentId: string, feedback: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('opere_setup_payments')
        .update({ client_feedback: feedback })
        .eq('id', paymentId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur soumission feedback:', err);
      return false;
    }
  };
  
  return {
    packages,
    payments,
    loading,
    error,
    hasPaidSetup,
    latestPayment,
    completionStatus,
    getRecommendation,
    calculateROI,
    initiatePayment,
    submitFeedback,
  };
}

/**
 * Hook pour les admins - Gérer les paiements Opéré
 */
export function useOpereSetupAdmin() {
  const [allPayments, setAllPayments] = useState<OpereSetupPayment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAllPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('opere_setup_payments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setAllPayments(data as OpereSetupPayment[] || []);
      } catch (err) {
        console.error('Erreur chargement paiements admin:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllPayments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('all_opere_payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opere_setup_payments',
        },
        () => {
          fetchAllPayments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Confirmer un paiement
  const confirmPayment = async (paymentId: string, transactionId?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('opere_setup_payments')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id: transactionId,
          delivery_started_at: new Date().toISOString(),
        })
        .eq('id', paymentId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur confirmation paiement:', err);
      return false;
    }
  };
  
  // Mettre à jour la progression
  const updateProgress = async (
    paymentId: string,
    completionPercentage: number,
    servicesDelivered: string[],
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = {
        completion_percentage: completionPercentage,
        services_delivered: servicesDelivered,
      };
      
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }
      
      if (completionPercentage === 100) {
        updateData.delivery_completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('opere_setup_payments')
        .update(updateData)
        .eq('id', paymentId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur mise à jour progression:', err);
      return false;
    }
  };
  
  // Rembourser
  const refundPayment = async (paymentId: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('opere_setup_payments')
        .update({
          payment_status: 'refunded',
          admin_notes: reason,
        })
        .eq('id', paymentId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur remboursement:', err);
      return false;
    }
  };
  
  return {
    allPayments,
    loading,
    confirmPayment,
    updateProgress,
    refundPayment,
  };
}
