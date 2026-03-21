import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Settings,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileDown,
  LayoutList,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { InvoiceList } from '@/components/invoice/InvoiceList';
import { InvoiceKanbanView } from '@/components/invoice/InvoiceKanbanView';
import { InvoiceChartView } from '@/components/invoice/InvoiceChartView';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { InvoiceSettings } from '@/components/invoice/InvoiceSettings';
import { UnbilledInquiriesAlert } from '@/components/invoice/UnbilledInquiriesAlert';
import { MarkAsPaidDialog } from '@/components/invoice/MarkAsPaidDialog';
import { ExportDialog } from '@/components/invoice/ExportDialog';
import { InvoicePreviewDialog } from '@/components/invoice/InvoicePreviewDialog';
import {
  InvoiceService,
  Invoice,
  InvoiceStatus,
  InvoiceSettings as ISettings,
  CreateInvoiceData,
  UpdateInvoiceData,
} from '@/services/invoiceService';
import { formatNumber, formatAmount } from '@/utils/format';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pagination } from '@/components/ui/pagination';
import { useLanguage } from '@/hooks/useLanguage';

type View = 'list' | 'form' | 'settings';
type DisplayMode = 'list' | 'kanban' | 'chart';

const Facture: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [view, setView] = useState<View>('list');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [markAsPaidDialogOpen, setMarkAsPaidDialogOpen] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [invoiceToPreview, setInvoiceToPreview] = useState<Invoice | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Charger les données
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // Génération auto des factures pour devis acceptés (comme pour les commandes)
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const unbilled = await InvoiceService.getUnbilledAcceptedQuotes(user.id);
        for (const q of unbilled) {
          if (cancelled) return;
          try {
            await InvoiceService.createInvoiceFromQuote(user.id, q.id);
            loadData();
            toast({
              title: t('invoice.toasts.created') || 'Facture créée',
              description: (t('invoice.toasts.createdFromQuote') || 'Facture générée pour le devis {{quote}}').replace('{{quote}}', q.quote_number || q.id),
            });
          } catch {
            // Ignorer (paramètres manquants, etc.)
          }
        }
      } catch {
        // Ignorer
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Calculer les factures paginées
  const paginatedInvoices = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return invoices.slice(start, start + pageSize);
  }, [invoices, currentPage, pageSize]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Log removed

      const [invoicesData, settingsData, statsData] = await Promise.all([
        InvoiceService.getUserInvoices(user.id),
        InvoiceService.getSettings(user.id),
        InvoiceService.getInvoiceStats(user.id),
      ]);

      setInvoices(invoicesData);
      setSettings(settingsData);
      setStats(statsData);
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorLoading.title'),
        description: t('invoice.toasts.errorLoading.description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Créer une nouvelle facture
  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setView('form');
  };

  // Sélectionner une facture pour édition
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('form');
  };

  // Sauvegarder une facture
  const handleSaveInvoice = async (data: any) => {
    if (!user?.id) return;

    try {
      if (selectedInvoice) {
        // Mise à jour
        const updated = await InvoiceService.updateInvoice(selectedInvoice.id, data as UpdateInvoiceData);
        setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));
        toast({
          title: t('invoice.toasts.updated.title'),
          description: t('invoice.toasts.updated.description', { number: updated.invoice_number }),
        });
      } else {
        // Création
        const created = await InvoiceService.createInvoice(user.id, data as CreateInvoiceData);
        setInvoices([created, ...invoices]);
        toast({
          title: t('invoice.toasts.created.title'),
          description: t('invoice.toasts.created.description', { number: created.invoice_number }),
        });
      }

      // Recharger les stats
      const statsData = await InvoiceService.getInvoiceStats(user.id);
      setStats(statsData);

      setView('list');
      setSelectedInvoice(null);
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorSave.title'),
        description: t('invoice.toasts.errorSave.description'),
        variant: 'destructive',
      });
    }
  };

  // Supprimer une facture
  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete || !user?.id) return;

    try {
      await InvoiceService.deleteInvoice(invoiceToDelete);
      setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete));

      // Recharger les stats
      const statsData = await InvoiceService.getInvoiceStats(user.id);
      setStats(statsData);

      toast({
        title: t('invoice.toasts.deleted.title'),
        description: t('invoice.toasts.deleted.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorDelete.title'),
        description: t('invoice.toasts.errorDelete.description'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  // Générer PDF
  const handleGeneratePdf = async (invoice: Invoice) => {
    try {
      toast({
        title: t('invoice.toasts.generatingPDF.title'),
        description: t('invoice.toasts.generatingPDF.description'),
      });

      // Import dynamique pour éviter d'alourdir le bundle
      const { PDFGenerationService } = await import('@/services/pdfGenerationService');

      const invoiceSettings = await InvoiceService.getSettings(user!.id);
      const { blobUrl } = await PDFGenerationService.generateInvoicePDF(invoice, invoiceSettings);

      // Télécharger automatiquement
      const filename = `${invoice.invoice_number}.pdf`;
      PDFGenerationService.downloadPDF(blobUrl, filename);

      // Nettoyer après 1 seconde
      setTimeout(() => {
        PDFGenerationService.revokeBlobUrl(blobUrl);
      }, 1000);

      toast({
        title: t('invoice.toasts.pdfGenerated.title'),
        description: t('invoice.toasts.pdfGenerated.description', { filename }),
      });
      return blobUrl; // Retourne le blobUrl pour l'utiliser dans sendInvoice
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorPDF.title'),
        description: t('invoice.toasts.errorPDF.description'),
        variant: 'destructive',
      });
      return null; // Retourne null en cas d'erreur
    }
  };

  // Envoyer la facture par email
  const handleSendInvoice = async (invoice: Invoice) => {
    if (!invoice.client_email) {
      toast({
        title: t('invoice.toasts.missingEmail.title'),
        description: t('invoice.toasts.missingEmail.description'),
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: t('invoice.toasts.preparing.title'),
        description: t('invoice.toasts.preparing.description'),
      });

      // Générer le PDF en Base64
      let pdfBase64 = undefined;
      try {
        const { PDFGenerationService } = await import('@/services/pdfGenerationService');
        const invoiceSettings = await InvoiceService.getSettings(user!.id);
        const { blobUrl } = await PDFGenerationService.generateInvoicePDF(invoice, invoiceSettings);
        
        
        // Convertir blob en Base64 de manière fiable
        const pdfBlob = await fetch(blobUrl).then(r => r.blob());
        
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        pdfBase64 = btoa(binary);
        
      } catch (pdfError) {
        console.error('❌ Erreur génération PDF:', pdfError);
        // Continuer sans PDF
      }

      // Envoyer l'email via le service AVEC le PDF en Base64
      try {
        const { EmailService } = await import('@/services/emailService');

        const emailParams = {
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name,
          client_email: invoice.client_email,
          total_ttc: invoice.total_ttc,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          pdf_base64: pdfBase64, // Passer le PDF en Base64
          user_email: user?.email,
          user_name: user?.user_metadata?.full_name || 'Booh',
        };

        console.log('📧 Email parameters:', {
          invoice_number: emailParams.invoice_number,
          client_name: emailParams.client_name,
          client_email: emailParams.client_email,
          total_ttc: emailParams.total_ttc,
          pdf_base64_length: emailParams.pdf_base64?.length || 0,
          pdf_base64_exists: !!emailParams.pdf_base64,
          pdf_base64_preview: emailParams.pdf_base64?.substring(0, 50) || 'MISSING',
        });

        const response = await EmailService.sendInvoiceEmail(emailParams);
        

        // Mettre à jour le statut de la facture à "sent"
        if (invoice.status === 'draft') {
          const updated = await InvoiceService.updateInvoiceStatus(invoice.id, 'sent');
          setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));

          // Recharger les stats
          const statsData = await InvoiceService.getInvoiceStats(user!.id);
          setStats(statsData);
        }

        toast({
          title: t('invoice.toasts.sent.title'),
          description: t('invoice.toasts.sent.description', { email: invoice.client_email }),
        });
      } catch (emailError) {
        // Error log removed

        // Si le service d'email n'est pas configuré, simuler l'envoi
        toast({
          title: t('invoice.toasts.emailNotConfigured.title'),
          description: t('invoice.toasts.emailNotConfigured.description'),
        });

        // Attendre un peu pour simuler
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mettre à jour le statut quand même
        if (invoice.status === 'draft') {
          const updated = await InvoiceService.updateInvoiceStatus(invoice.id, 'sent');
          setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));

          // Recharger les stats
          const statsData = await InvoiceService.getInvoiceStats(user!.id);
          setStats(statsData);
        }

        toast({
          title: t('invoice.toasts.markedAsSent.title'),
          description: t('invoice.toasts.markedAsSent.description'),
        });
      }
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorSending.title'),
        description: t('invoice.toasts.errorSending.description'),
        variant: 'destructive',
      });
    }
  };

  // Sauvegarder les paramètres
  const handleSaveSettings = async (data: Partial<ISettings>) => {
    if (!user?.id) return;

    try {
      const updated = await InvoiceService.updateSettings(user.id, data);
      setSettings(updated);
      toast({
        title: t('invoice.toasts.settingsSaved.title'),
        description: t('invoice.toasts.settingsSaved.description'),
      });
      setView('list');
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorSettings.title'),
        description: t('invoice.toasts.errorSettings.description'),
        variant: 'destructive',
      });
    }
  };

  // Marquer une facture comme payée
  const handleMarkAsPaid = (invoice: Invoice) => {
    setInvoiceToMarkAsPaid(invoice);
    setMarkAsPaidDialogOpen(true);
  };

  const confirmMarkAsPaid = async (paymentDate: string) => {
    if (!invoiceToMarkAsPaid || !user?.id) return;

    try {
      const updated = await InvoiceService.updateInvoiceStatus(
        invoiceToMarkAsPaid.id,
        'paid',
        paymentDate
      );
      setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));

      // Recharger les stats
      const statsData = await InvoiceService.getInvoiceStats(user.id);
      setStats(statsData);

      toast({
        title: t('invoice.toasts.markedAsPaid.title'),
        description: t('invoice.toasts.markedAsPaid.description', { number: updated.invoice_number }),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorMarkAsPaid.title'),
        description: t('invoice.toasts.errorMarkAsPaid.description'),
        variant: 'destructive',
      });
    } finally {
      setMarkAsPaidDialogOpen(false);
      setInvoiceToMarkAsPaid(null);
    }
  };

  // Changer le statut d'une facture (utilisé par le drag and drop du Kanban)
  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (!user?.id) return;

    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    try {
      // Si on déplace vers "paid", demander la date de paiement
      if (newStatus === 'paid') {
        handleMarkAsPaid(invoice);
        return;
      }

      // Pour les autres statuts, mettre à jour directement
      const updated = await InvoiceService.updateInvoiceStatus(invoiceId, newStatus);
      setInvoices(invoices.map((inv) => (inv.id === updated.id ? updated : inv)));

      // Recharger les stats
      const statsData = await InvoiceService.getInvoiceStats(user.id);
      setStats(statsData);

      toast({
        title: t('invoice.toasts.statusUpdated.title'),
        description: t('invoice.toasts.statusUpdated.description', { number: updated.invoice_number, status: getStatusLabel(newStatus) }),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.toasts.errorStatusUpdate.title'),
        description: t('invoice.toasts.errorStatusUpdate.description'),
        variant: 'destructive',
      });
    }
  };

  // Helper pour obtenir le label du statut
  const getStatusLabel = (status: InvoiceStatus): string => {
    return t(`invoice.status.${status}`) || status;
  };

  // Ouvrir la prévisualisation d'une facture
  const handlePreviewInvoice = (invoice: Invoice) => {
    setInvoiceToPreview(invoice);
    setPreviewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
            <p className="text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('invoice.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <div className="container max-w-7xl py-6 px-4 md:px-6 relative z-10">
          {/* Header Apple Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left: Icon + Title */}
                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  {/* Title Section */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('invoice.title')}
                    </h1>
                    <p className="text-gray-500 text-base font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('invoice.description')}
                    </p>
                  </div>
                </div>
                
                {/* Right: Stats Badge */}
                {invoices.length > 0 && (
                  <div className="hidden lg:flex items-center">
                    <div className="px-5 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-light tracking-tight text-gray-900 leading-none"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {invoices.length}
                          </span>
                          <span className="text-xs font-light text-gray-500 uppercase tracking-wide"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('invoice.stats.total')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Alerte demandes non facturées (visible seulement en mode liste) */}
          <AnimatePresence>
            {view === 'list' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UnbilledInquiriesAlert onInvoicesGenerated={loadData} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions Bar Apple Minimal */}
          <AnimatePresence>
            {view === 'list' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                  <div className="flex flex-row items-center justify-center xl:justify-between gap-3 xl:gap-6">
                    {/* Center: Primary Actions Group */}
                    <div className="flex items-center justify-center gap-3 w-full xl:w-auto">
                      {/* Add Button */}
                      <Button
                        onClick={handleCreateInvoice}
                        size="icon"
                        className="w-10 h-10 md:w-12 md:h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm transition-all duration-200 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <Plus className="w-5 h-5 md:w-6 md:h-6" />
                      </Button>
                      
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg border border-gray-200 p-1">
                        <Button
                          onClick={() => setDisplayMode('list')}
                          variant="ghost"
                          size="sm"
                          className={`relative rounded-md transition-all duration-200 px-3 md:px-4 py-2 font-light ${
                            displayMode === 'list'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <LayoutList className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        <Button
                          onClick={() => setDisplayMode('kanban')}
                          variant="ghost"
                          size="sm"
                          className={`relative rounded-md transition-all duration-200 px-3 md:px-4 py-2 font-light ${
                            displayMode === 'kanban'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        <Button
                          onClick={() => setDisplayMode('chart')}
                          variant="ghost"
                          size="sm"
                          className={`relative rounded-md transition-all duration-200 px-3 md:px-4 py-2 font-light ${
                            displayMode === 'chart'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </div>
                      
                      {/* Actions supplémentaires */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setExportDialogOpen(true)}
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg"
                        >
                          <FileDown className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        <Button
                          onClick={() => setView('settings')}
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg"
                        >
                          <Settings className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Statistiques Apple Minimal */}
          <AnimatePresence>
            {view === 'list' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                  {[
                    { 
                      label: t('invoice.stats.total'), 
                      value: stats.total, 
                      icon: FileText
                    },
                    { 
                      label: t('invoice.stats.paid'), 
                      value: stats.paid, 
                      icon: CheckCircle
                    },
                    { 
                      label: t('invoice.stats.pending'), 
                      value: stats.pending, 
                      icon: Clock
                    },
                    { 
                      label: t('invoice.stats.overdue'), 
                      value: stats.overdue, 
                      icon: AlertCircle
                    }
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-xs md:text-sm font-light text-gray-500 uppercase tracking-wide mb-2"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {stat.label}
                          </p>
                          <p className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 leading-none"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {stat.value}
                          </p>
                        </div>
                        
                        {/* Icon Container */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini stats montants Apple Minimal */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {[
                      { 
                        label: t('invoice.stats.totalInvoiced'), 
                        value: formatAmount(stats.totalAmount), 
                        icon: TrendingUp
                      },
                      { 
                        label: t('invoice.stats.amountPaid'), 
                        value: formatAmount(stats.paidAmount), 
                        icon: CheckCircle
                      },
                      { 
                        label: t('invoice.stats.amountPending'), 
                        value: formatAmount(stats.pendingAmount), 
                        icon: Clock
                      }
                    ].map((stat, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-xs md:text-sm font-light text-gray-500 uppercase tracking-wide mb-2"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {stat.label}
                            </p>
                            <p className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 leading-none"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {stat.value}
                            </p>
                          </div>
                          
                          {/* Icon Container */}
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contenu dynamique selon la vue */}
          <AnimatePresence>
            {view === 'list' && (
              <motion.div
                key={`list-${displayMode}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {displayMode === 'list' && (
                  <InvoiceList
                    invoices={paginatedInvoices}
                    onSelect={handleSelectInvoice}
                    onDelete={handleDeleteInvoice}
                    onGeneratePdf={handleGeneratePdf}
                    onSend={handleSendInvoice}
                    onMarkAsPaid={handleMarkAsPaid}
                    onPreview={handlePreviewInvoice}
                  />
                )}
                {displayMode === 'kanban' && (
                  <InvoiceKanbanView
                    invoices={invoices}
                    onSelect={handleSelectInvoice}
                    onDelete={handleDeleteInvoice}
                    onGeneratePdf={handleGeneratePdf}
                    onSend={handleSendInvoice}
                    onMarkAsPaid={handleMarkAsPaid}
                    onStatusChange={handleStatusChange}
                    onPreview={handlePreviewInvoice}
                  />
                )}
                {displayMode === 'chart' && (
                  <InvoiceChartView
                    invoices={invoices}
                    stats={stats}
                  />
                )}
              </motion.div>
            )}

            {view === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InvoiceForm
                  invoice={selectedInvoice}
                  defaultVatRate={settings?.default_vat_rate || 18}
                  taxRegime={(settings?.tax_regime as 'tva_css' | 'css_only' | 'precompte') ?? 'tva_css'}
                  applyCss={settings?.apply_css ?? true}
                  onBack={() => {
                    setView('list');
                    setSelectedInvoice(null);
                  }}
                  onSave={handleSaveInvoice}
                  onGeneratePdf={handleGeneratePdf}
                  onSend={handleSendInvoice}
                />
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InvoiceSettings
                  settings={settings}
                  onBack={() => setView('list')}
                  onSave={handleSaveSettings}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination pour la vue liste */}
          {view === 'list' && displayMode === 'list' && invoices.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil((invoices.length || 0) / pageSize)}
              pageSize={pageSize}
              totalItems={invoices.length || 0}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}

          {/* Dialog de confirmation de suppression */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-white border border-gray-200 shadow-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-light tracking-tight text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('invoice.delete.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('invoice.delete.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200 rounded-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('invoice.delete.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 rounded-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('invoice.delete.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog marquer comme payée */}
          <MarkAsPaidDialog
            invoice={invoiceToMarkAsPaid}
            open={markAsPaidDialogOpen}
            onOpenChange={setMarkAsPaidDialogOpen}
            onConfirm={confirmMarkAsPaid}
          />

          {/* Dialog export */}
          <ExportDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
          />

          {/* Dialog prévisualisation */}
          <InvoicePreviewDialog
            invoice={invoiceToPreview}
            settings={settings}
            open={previewDialogOpen}
            onOpenChange={setPreviewDialogOpen}
            onGeneratePdf={handleGeneratePdf}
            onSend={handleSendInvoice}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Facture;
