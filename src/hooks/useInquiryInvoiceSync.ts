import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceService } from '@/services/invoiceService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour surveiller et gérer automatiquement les factures des inquiries completed
 */
export const useInquiryInvoiceSync = () => {
  const { user } = useAuth();
  const [unbilledCount, setUnbilledCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Vérifier les inquiries sans facture
  const checkUnbilledInquiries = async () => {
    if (!user?.id) return;

    setIsChecking(true);
    try {
      const inquiries = await InvoiceService.getUnbilledInquiries(user.id);
      setUnbilledCount(inquiries.length);
      return inquiries;
    } catch (error) {
      // Error log removed
      return [];
    } finally {
      setIsChecking(false);
    }
  };

  // Générer automatiquement les factures pour toutes les inquiries completed sans facture
  const autoGenerateInvoices = async () => {
    if (!user?.id) return { success: 0, errors: 0 };

    setAutoGenerating(true);
    const results = { success: 0, errors: 0, details: [] as any[] };

    try {
      const unbilledInquiries = await InvoiceService.getUnbilledInquiries(user.id);

      for (const inquiry of unbilledInquiries) {
        try {
          const invoice = await InvoiceService.createInvoiceFromInquiry(
            user.id,
            inquiry.id,
            inquiry.type as 'product' | 'digital'
          );

          results.success++;
          results.details.push({
            inquiryId: inquiry.id,
            invoiceNumber: invoice.invoice_number,
            status: 'success',
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            inquiryId: inquiry.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Error log removed
        }
      }
    } catch (error) {
      // Error log removed
    } finally {
      setAutoGenerating(false);
    }

    return results;
  };

  // Vérifier périodiquement (toutes les 30 secondes)
  useEffect(() => {
    if (!user?.id) return;

    // Vérification initiale
    checkUnbilledInquiries();

    // Vérification périodique
    const interval = setInterval(() => {
      checkUnbilledInquiries();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user?.id]);

  // Écouter les changements en temps réel avec Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;

    // S'abonner aux changements sur product_inquiries
    const productChannel = supabase
      .channel('product_inquiries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_inquiries',
          filter: `status=eq.completed`,
        },
        (payload) => {
          // Log removed
          checkUnbilledInquiries();
        }
      )
      .subscribe();

    // S'abonner aux changements sur digital_inquiries
    const digitalChannel = supabase
      .channel('digital_inquiries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'digital_inquiries',
          filter: `status=eq.completed`,
        },
        (payload) => {
          // Log removed
          checkUnbilledInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(digitalChannel);
    };
  }, [user?.id]);

  return {
    unbilledCount,
    isChecking,
    autoGenerating,
    checkUnbilledInquiries,
    autoGenerateInvoices,
  };
};
