import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Search,
  Filter,
  Loader2,
  Settings,
  FolderKanban,
  Download,
  Send,
  LayoutList,
  LayoutGrid,
  BarChart3,
  Link2,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PortfolioService, ServiceQuote, QuoteStatus } from '@/services/portfolioService';
import { PortfolioQuoteService } from '@/services/portfolio/portfolioQuoteService';
import { QuoteTemplateService, QuoteTemplateWithItems } from '@/services/portfolio/quoteTemplateService';
import { QuotePdfService } from '@/services/quotePdfService';
import { InvoiceService } from '@/services/invoiceService';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { QuotesKanbanView } from '@/components/quotes/QuotesKanbanView';
import { QuotesChartView } from '@/components/quotes/QuotesChartView';
import { ViewToggle, ViewToggleOption } from '@/components/ui/ViewToggle';
import { ActionButtons, ActionButton } from '@/components/ui/ActionButtons';
import { ExportQuotesDialog } from '@/components/quotes/ExportQuotesDialog';
import { notifyOSDrawerRefreshBadges } from '@/utils/osDrawerBadgesSync';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { notifyClientQuoteResponse } from '@/services/quoteEmailService';
import { formatAmount } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

export const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();

  const statusConfig = {
    new: {
      label: t('portfolio.quotesList.status.new'),
      color: 'bg-gray-700',
      icon: AlertCircle,
    },
    in_progress: {
      label: t('portfolio.quotesList.status.inProgress'),
      color: 'bg-gray-700',
      icon: Clock,
    },
    quoted: {
      label: t('portfolio.quotesList.status.quoted'),
      color: 'bg-gray-700',
      icon: FileText,
    },
    accepted: {
      label: t('portfolio.quotesList.status.accepted'),
      color: 'bg-gray-700',
      icon: CheckCircle2,
    },
    refused: {
      label: t('portfolio.quotesList.status.refused'),
      color: 'bg-red-600',
      icon: XCircle,
    },
    closed: {
      label: t('portfolio.quotesList.status.closed'),
      color: 'bg-gray-700',
      icon: CheckCircle2,
    },
  };

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<ServiceQuote | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [displayMode, setDisplayMode] = useState<'list' | 'kanban' | 'chart'>('list');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [responseData, setResponseData] = useState({
    status: '' as ServiceQuote['status'],
    quote_amount: '',
    internal_notes: '',
    payment_terms: '',
    proposal_notes: '',
    execution_delay: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [responseItems, setResponseItems] = useState<Array<{ title: string; quantity: number; unit_price: number }>>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    project_description: '',
  });
  const [createItems, setCreateItems] = useState<Array<{ title: string; quantity: number; unit_price: number; product_id?: string; card_id?: string }>>([{ title: '', quantity: 1, unit_price: 0 }]);

  // Lignes du devis (édition directe)
  const { data: quoteItems = [] } = useQuery({
    queryKey: ['quote-items', selectedQuote?.id],
    queryFn: () => (selectedQuote?.id ? PortfolioQuoteService.getQuoteItems(selectedQuote.id) : []),
    enabled: !!selectedQuote?.id && isResponseDialogOpen,
  });

  // Infos entreprise + catalogue (création + réponse devis pour default_payment_terms)
  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoice-settings', user?.id],
    queryFn: () => InvoiceService.getSettings(user!.id),
    enabled: !!user?.id && (isCreateDialogOpen || isResponseDialogOpen),
  });
  const { data: portfolioServices = [] } = useQuery({
    queryKey: ['portfolio-services', user?.id],
    queryFn: () => PortfolioService.getUserServices(user!.id, { limit: 100 }).then((r) => r.services),
    enabled: !!user?.id && isCreateDialogOpen,
  });
  const { data: physicalProducts = [] } = useQuery({
    queryKey: ['physical-products-create', user?.id],
    queryFn: async () => {
      const { data: cards } = await supabase.from('business_cards').select('id').eq('user_id', user!.id);
      if (!cards?.length) return [];
      const cardIds = cards.map((c) => c.id);
      const { data } = await supabase.from('products').select('id, name, price, card_id').in('card_id', cardIds).eq('is_available', true);
      return (data || []).map((p: { id: string; name: string; price: number; card_id: string }) => ({ id: p.id, title: p.name, price: p.price || 0, card_id: p.card_id }));
    },
    enabled: !!user?.id && isCreateDialogOpen,
  });

  // Templates de devis (Phase 2)
  const { data: templates = [] } = useQuery({
    queryKey: ['quote-templates', user?.id],
    queryFn: () => (user?.id ? QuoteTemplateService.getTemplates(user.id) : []),
    enabled: !!user?.id && isResponseDialogOpen,
  });

  const handleApplyTemplate = async (template: QuoteTemplateWithItems) => {
    if (!selectedQuote || template.items.length === 0) return;
    setIsApplyingTemplate(true);
    try {
      await PortfolioQuoteService.applyTemplateToQuote(selectedQuote.id, template.items);
      const total = QuoteTemplateService.getTemplateTotal(template.items);
      setResponseData(prev => ({ ...prev, quote_amount: total.toString() }));
      setResponseData(prev => ({ ...prev, status: 'quoted' }));
      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();
      toast({ title: t('portfolio.quotesList.toasts.templateApplied.title'), description: t('portfolio.quotesList.toasts.templateApplied.description') });
    } catch {
      toast({ title: t('portfolio.quotesList.toasts.templateError.title'), variant: 'destructive' });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Récupération des devis avec pagination
  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['user-service-quotes', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return await PortfolioService.getUserQuotes(user.id, {
        limit: 1000, // Charger tous les devis pour l'instant (peut être paginé plus tard)
      });
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30s pour voir les acceptations côté client
  });

  // Extraire le tableau quotes de l'objet retourné
  const quotes = quotesData?.quotes || [];

  // Génération automatique des factures pour les devis acceptés (comme pour les commandes)
  const processedQuoteIdsRef = useRef<Set<string>>(new Set());
  const isAutoGeneratingRef = useRef(false);

  useEffect(() => {
    const list = quotesData?.quotes || [];
    if (!user?.id || !list.length || isAutoGeneratingRef.current) return;

    const toProcess = list.filter(
      (q) =>
        q.status === 'accepted' &&
        !q.converted_to_invoice_id &&
        (Number(q.quote_amount) || 0) > 0 &&
        !processedQuoteIdsRef.current.has(q.id)
    );

    if (toProcess.length === 0) return;

    let cancelled = false;
    isAutoGeneratingRef.current = true;

    (async () => {
      for (const quote of toProcess) {
        if (cancelled) break;
        try {
          const invoice = await InvoiceService.createInvoiceFromQuote(user.id, quote.id);
          if (cancelled) return;
          processedQuoteIdsRef.current.add(quote.id);
          queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
          queryClient.invalidateQueries({ queryKey: ['user-invoices'] });
          queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
          notifyOSDrawerRefreshBadges();
          toast({
            title: t('portfolio.quotesList.toasts.invoiceCreated.title'),
            description: t('portfolio.quotesList.toasts.invoiceCreated.description', {
              invoiceNumber: invoice.invoice_number,
            }),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          toast({
            title: t('portfolio.quotesList.toasts.invoiceError.title'),
            description: msg,
            variant: 'destructive',
          });
        }
      }
    })().finally(() => {
      isAutoGeneratingRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, quotesData, queryClient, toast, t]);

  // Récupération des stats
  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return await PortfolioService.getStats(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Métriques devis (temps de réponse, délai décision) - migration 20260203_quote_improvements
  const { data: quoteConversionStats } = useQuery({
    queryKey: ['quote-conversion-stats', user?.id],
    queryFn: () => PortfolioQuoteService.getQuoteConversionStats(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Mutation pour créer un devis manuellement
  const createQuoteMutation = useMutation({
    mutationFn: async (data: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      client_company?: string;
      service_requested: string;
      project_description?: string;
      items?: Array<{ title: string; quantity: number; unit_price: number; product_id?: string; card_id?: string }>;
    }) => {
      const quote = await PortfolioQuoteService.createQuote(user!.id, {
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_company: data.client_company,
        service_requested: data.service_requested,
        project_description: data.project_description,
      });
      const validItems = (data.items || []).filter((i) => i.title.trim() && i.unit_price >= 0).map((i) => ({
        title: i.title,
        quantity: i.quantity ?? 1,
        unit_price: i.unit_price,
        ...(i.product_id && { product_id: i.product_id }),
        ...(i.card_id && { card_id: i.card_id }),
      }));
      if (validItems.length > 0) {
        await PortfolioQuoteService.applyTemplateToQuote(quote.id, validItems);
      }
      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      queryClient.invalidateQueries({ queryKey: ['quote-conversion-stats'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();
      toast({
        title: t('portfolio.quotesList.toasts.created.title'),
        description: t('portfolio.quotesList.toasts.created.description'),
      });
      setIsCreateDialogOpen(false);
      setCreateForm({ client_name: '', client_email: '', client_phone: '', client_company: '', project_description: '' });
      setCreateItems([{ title: '', quantity: 1, unit_price: 0 }]);
    },
    onError: () => {
      toast({
        title: t('portfolio.quotesList.toasts.createError.title'),
        description: t('portfolio.quotesList.toasts.createError.description'),
        variant: 'destructive',
      });
    },
  });

  const createTotalFromItems = createItems.reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0);
  const createValidItems = createItems.filter((i) => i.title.trim() && i.unit_price >= 0);
  const addCreateItem = () => setCreateItems((p) => [...p, { title: '', quantity: 1, unit_price: 0 }]);
  const removeCreateItem = (i: number) => setCreateItems((p) => p.filter((_, idx) => idx !== i));
  const updateCreateItem = (i: number, field: 'title' | 'quantity' | 'unit_price', value: string | number) => {
    setCreateItems((p) => p.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  };
  const addCreateItemFromService = (s: { title: string; price?: number }) => {
    setCreateItems((p) => [...p, { title: s.title, quantity: 1, unit_price: Number(s.price) || 0 }]);
  };
  const addCreateItemFromProduct = (p: { id: string; title: string; price: number; card_id: string }) => {
    setCreateItems((prev) => [...prev, { title: p.title, quantity: 1, unit_price: p.price, product_id: p.id, card_id: p.card_id }]);
  };

  const handleCreateQuote = () => {
    if (!createForm.client_name.trim() || !createForm.client_email.trim()) {
      toast({
        title: t('portfolio.quotesList.toasts.createError.title'),
        description: t('portfolio.quotesList.toasts.createValidation.description'),
        variant: 'destructive',
      });
      return;
    }
    const hasValidContent = createValidItems.length > 0 || (createForm.project_description?.trim()?.length ?? 0) > 0;
    if (!hasValidContent) {
      toast({
        title: t('portfolio.quotesList.toasts.createError.title'),
        description: t('portfolio.quotesList.toasts.createValidation.description'),
        variant: 'destructive',
      });
      return;
    }
    const serviceRequested = createValidItems.length > 0
      ? createValidItems.map((i) => i.title).join(' ; ')
      : createForm.project_description?.trim()?.slice(0, 200) || 'Devis';
    createQuoteMutation.mutate({
      client_name: createForm.client_name.trim(),
      client_email: createForm.client_email.trim(),
      client_phone: createForm.client_phone.trim() || undefined,
      client_company: createForm.client_company.trim() || undefined,
      service_requested: serviceRequested,
      project_description: createForm.project_description.trim() || undefined,
      items: createValidItems.length > 0 ? createValidItems : undefined,
    });
  };

  // Mutation pour mettre à jour un devis
  const updateQuoteMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<ServiceQuote> }) =>
      PortfolioService.updateQuote(data.id, data.updates),
    onSuccess: (updatedQuote) => {
      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      queryClient.invalidateQueries({ queryKey: ['quote-conversion-stats'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();
      if (updatedQuote?.id) {
        queryClient.invalidateQueries({ queryKey: ['quote-items', updatedQuote.id] });
      }
      
      // ✅ NOUVEAU: Envoyer notification au client si le devis inclut un montant
      if (updatedQuote.quote_amount && updatedQuote.id) {
        notifyClientQuoteResponse(updatedQuote.id).catch((emailError) => {
          console.error("Quote response email failed:", emailError);
        });
      }
      
      toast({
        title: t('portfolio.quotesList.toasts.updated.title'),
        description: t('portfolio.quotesList.toasts.updated.description'),
      });
      setIsResponseDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: (error) => {
      toast({
        title: t('portfolio.quotesList.toasts.updateError.title'),
        description: t('portfolio.quotesList.toasts.updateError.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Filtrage des devis
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.service_requested.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Ouvrir le dialog de réponse
  const handleRespond = (quote: ServiceQuote) => {
    setSelectedQuote(quote);
    const q = quote as ServiceQuote & { payment_terms?: string; proposal_notes?: string; execution_delay?: string };
    setResponseData({
      status: quote.status || 'new',
      quote_amount: quote.quote_amount?.toString() || '',
      internal_notes: quote.internal_notes || '',
      payment_terms: q.payment_terms || '',
      proposal_notes: q.proposal_notes || '',
      execution_delay: q.execution_delay || '',
    });
    setResponseItems([]); // Sera rempli par le useEffect après fetch des items
    setSelectedTemplateId('');
    setIsResponseDialogOpen(true);
  };

  // Pré-remplir conditions de règlement depuis paramètres facture (si vide)
  React.useEffect(() => {
    if (!isResponseDialogOpen || !selectedQuote || !invoiceSettings) return;
    const q = selectedQuote as ServiceQuote & { payment_terms?: string };
    const defaultPaymentTerms = (invoiceSettings as { default_payment_terms?: string })?.default_payment_terms;
    if (!q.payment_terms && defaultPaymentTerms) {
      setResponseData((prev) => (prev.payment_terms ? prev : { ...prev, payment_terms: defaultPaymentTerms }));
    }
  }, [isResponseDialogOpen, selectedQuote?.id, invoiceSettings]);

  // Initialiser les lignes quand les items sont chargés
  React.useEffect(() => {
    if (!isResponseDialogOpen || !selectedQuote) return;
    if (quoteItems.length > 0) {
      setResponseItems(quoteItems.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: i.unit_price })));
    } else if (selectedQuote.quote_amount && selectedQuote.service_requested) {
      setResponseItems([{ title: selectedQuote.service_requested, quantity: 1, unit_price: Number(selectedQuote.quote_amount) || 0 }]);
    } else {
      setResponseItems([{ title: '', quantity: 1, unit_price: 0 }]);
    }
  }, [isResponseDialogOpen, selectedQuote?.id, quoteItems.length, selectedQuote?.quote_amount, selectedQuote?.service_requested]);

  const addResponseItem = () => setResponseItems((prev) => [...prev, { title: '', quantity: 1, unit_price: 0 }]);
  const removeResponseItem = (i: number) => setResponseItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateResponseItem = (i: number, field: 'title' | 'quantity' | 'unit_price', value: string | number) => {
    setResponseItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  };
  const totalFromItems = responseItems.reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0);
  React.useEffect(() => {
    const hasValidItem = responseItems.some((i) => i.title.trim() && i.unit_price >= 0);
    if (responseItems.length > 0 && hasValidItem) {
      const total = responseItems.reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0);
      setResponseData((prev) => ({ ...prev, quote_amount: total.toFixed(0) }));
    }
  }, [responseItems]);

  // Soumettre la réponse
  const handleSubmitResponse = async () => {
    if (!selectedQuote) return;

    const validItems = responseItems
      .filter((i) => i.title.trim())
      .map((i) => ({
        title: i.title.trim(),
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
      }))
      .filter((i) => i.unit_price >= 0);
    const useItems = validItems.length > 0;
    const amount = useItems
      ? validItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      : parseFloat(responseData.quote_amount || '0') || 0;

    if (responseData.status === 'quoted' && amount <= 0) {
      toast({
        title: t('portfolio.quotesList.toasts.amountRequired.title'),
        description: t('portfolio.quotesList.toasts.amountRequired.description'),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (useItems) {
        await PortfolioQuoteService.applyTemplateToQuote(selectedQuote.id, validItems);
      }
      const updates: Partial<ServiceQuote> = {
        status: responseData.status,
        internal_notes: responseData.internal_notes || undefined,
        quote_amount: amount,
        payment_terms: responseData.payment_terms || undefined,
        proposal_notes: responseData.proposal_notes || undefined,
        execution_delay: responseData.execution_delay || undefined,
      };
      await updateQuoteMutation.mutateAsync({ id: selectedQuote.id, updates });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      toast({
        title: t('portfolio.quotesList.toasts.updateError.title'),
        description: msg || t('portfolio.quotesList.toasts.updateError.description'),
        variant: 'destructive',
      });
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Créer une facture à partir d'un devis accepté (utilise createInvoiceFromQuote)
  const handleCreateInvoice = async (quote: ServiceQuote) => {
    const amount = Number(quote.quote_amount) || 0;
    if (!user?.id || amount <= 0) {
      toast({
        title: t('portfolio.quotesList.toasts.invoiceMissingData.title'),
        description: t('portfolio.quotesList.toasts.invoiceMissingAmount.description'),
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingInvoice(true);

    try {
      const invoice = await InvoiceService.createInvoiceFromQuote(user.id, quote.id);

      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['user-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: t('portfolio.quotesList.toasts.invoiceCreated.title'),
        description: t('portfolio.quotesList.toasts.invoiceCreated.description', {
          invoiceNumber: invoice.invoice_number,
        }),
      });

      navigate('/facture');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Paramètres')) {
        toast({
          title: t('portfolio.quotesList.toasts.invoiceConfigRequired.title'),
          description: t('portfolio.quotesList.toasts.invoiceConfigRequired.description'),
          variant: 'destructive',
        });
        navigate('/facture');
      } else {
        toast({
          title: t('portfolio.quotesList.toasts.invoiceError.title'),
          description: t('portfolio.quotesList.toasts.invoiceError.description'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Gérer le changement de statut (pour le Kanban)
  const handleQuoteStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      await PortfolioService.updateQuote(quoteId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: t('portfolio.quotesList.toasts.statusUpdated.title'),
        description: t('portfolio.quotesList.toasts.statusUpdated.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('portfolio.quotesList.toasts.statusError.title'),
        description: t('portfolio.quotesList.toasts.statusError.description'),
        variant: 'destructive',
      });
    }
  };

  // Générer et télécharger le PDF du devis
  const handleGeneratePDF = async (
    quote: ServiceQuote,
    itemsFromModal?: Array<{ title: string; quantity: number; unit_price: number }>,
    overrides?: { payment_terms?: string; proposal_notes?: string; execution_delay?: string }
  ) => {
    setIsGeneratingPdf(true);

    try {
      let items = itemsFromModal?.filter((i) => i.title.trim() && i.unit_price >= 0) ?? [];
      if (items.length === 0) {
        const fetched = await PortfolioQuoteService.getQuoteItems(quote.id);
        items = fetched.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: i.unit_price }));
      }

      // Récupérer les informations de l'utilisateur/carte
      const { data: cards, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user?.id)
        .limit(1);

      if (cardError) {
        // Error log removed
        throw new Error(t('portfolio.quotesList.toasts.cardError.description'));
      }

      if (!cards || cards.length === 0) {
        throw new Error(t('portfolio.quotesList.toasts.cardNotFound.description'));
      }

      const card = cards[0];

      // Récupérer les paramètres du portfolio et facturation (infos entreprise complètes)
      const [portfolioSettings, invoiceSettings] = await Promise.all([
        PortfolioService.getCardSettings(card.id),
        InvoiceService.getSettings(user.id)
      ]);

      await QuotePdfService.downloadQuotePDF({
        quote,
        items: items.length > 0 ? items : undefined,
        payment_terms: overrides?.payment_terms,
        proposal_notes: overrides?.proposal_notes,
        execution_delay: overrides?.execution_delay,
        cardOwnerName: card.name || invoiceSettings?.company_name || 'Non spécifié',
        cardOwnerEmail: invoiceSettings?.company_email || card.email || undefined,
        cardOwnerPhone: invoiceSettings?.company_phone || card.phone || undefined,
        cardOwnerAddress: invoiceSettings?.company_address || card.address || undefined,
        companyName: invoiceSettings?.company_name || card.company || undefined,
        companyLogo: invoiceSettings?.logo_url || (card as any).company_logo_url || undefined,
        companySiret: invoiceSettings?.company_siret || undefined,
        companyNif: invoiceSettings?.company_nif || undefined,
        companyVatNumber: invoiceSettings?.company_vat_number || undefined,
        companyAddress: invoiceSettings?.company_address || undefined,
        companyPhone: invoiceSettings?.company_phone || undefined,
        companyEmail: invoiceSettings?.company_email || undefined,
        companyWebsite: invoiceSettings?.company_website || undefined,
        brandColor: portfolioSettings?.brand_color || '#8B5CF6'
      });

      toast({
        title: t('portfolio.quotesList.toasts.pdfGenerated.title'),
        description: t('portfolio.quotesList.toasts.pdfGenerated.description'),
      });

    } catch (error) {
      // Error log removed
      toast({
        title: t('portfolio.quotesList.toasts.pdfError.title'),
        description: t('portfolio.quotesList.toasts.pdfError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyQuoteLink = (quote: ServiceQuote) => {
    const q = quote as ServiceQuote & { public_token?: string };
    const token = q.public_token;
    if (!token) {
      toast({ title: t('portfolio.quotesList.toasts.noLink.title'), description: t('portfolio.quotesList.toasts.noLink.description'), variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/quote/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: t('portfolio.quotesList.toasts.linkCopied.title'), description: t('portfolio.quotesList.toasts.linkCopied.description') });
    }).catch(() => {
      toast({ title: t('portfolio.quotesList.toasts.linkError.title'), variant: 'destructive' });
    });
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await PortfolioService.deleteQuote(quoteId);
      
      // Recharger les données
      queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: t('portfolio.quotesList.toasts.deleted.title'),
        description: t('portfolio.quotesList.toasts.deleted.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('portfolio.quotesList.toasts.deleteError.title'),
        description: t('portfolio.quotesList.toasts.deleteError.description'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8 flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden">
        {/* Header */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                {/* Icon Container */}
                <motion.div
                  className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <FileText className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600 relative z-10" />
                </motion.div>
                
                <div className="min-w-0 flex-1">
                  <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
          >
                    {t('portfolio.quotesList.title')}
                  </motion.h1>
                  <motion.p
                    className="text-sm md:text-base text-gray-500 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
              {t('portfolio.quotesList.subtitle')}
                  </motion.p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="rounded-lg px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('portfolio.quotesList.createQuote')}
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => navigate('/portfolio/projects')}
              >
                    <FolderKanban className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('portfolio.quotesList.projects')}</span>
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => navigate('/portfolio/quotes/templates')}
              >
                    <FileText className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('portfolio.quotesList.templates')}</span>
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => navigate('/portfolio/settings')}
              >
                    <Settings className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('portfolio.quotesList.settings')}</span>
                <span className="sm:hidden">{t('portfolio.quotesList.settingsShort')}</span>
              </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
            {/* Total Quotes */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <FileText className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.quotesList.stats.totalQuotes')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.total_quotes}
                  </motion.p>
                  </div>
                </div>
            </motion.div>

            {/* Pending Quotes */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Clock className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.quotesList.stats.pending')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.pending_quotes}
                  </motion.p>
                  </div>
                </div>
            </motion.div>

            {/* Converted Quotes */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.quotesList.stats.converted')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.converted_quotes}
                  </motion.p>
                  </div>
                </div>
            </motion.div>

            {/* Conversion Rate */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.quotesList.stats.conversionRate')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                      {stats.quote_conversion_rate?.toFixed(1)}%
                  </motion.p>
                  </div>
                  </div>
            </motion.div>
          </div>
        )}

        {/* View Selector */}
        <motion.div
          className="mb-4 sm:mb-6 flex justify-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <ViewToggle
            options={[
              { id: 'list', icon: LayoutList },
              { id: 'kanban', icon: LayoutGrid },
              { id: 'chart', icon: BarChart3 }
            ]}
            activeView={displayMode}
            onViewChange={(view) => setDisplayMode(view as 'list' | 'kanban' | 'chart')}
          />
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('portfolio.quotesList.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-300 rounded-lg text-sm sm:text-base font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                </div>
              </div>

              <ActionButtons
                buttons={[
                  {
                    id: 'filter',
                    label: t('portfolio.quotesList.filterStatus'),
                    icon: Filter,
                    variant: 'outline',
                    color: 'gray',
                    onClick: () => setExportDialogOpen(true)
                  },
                  {
                    id: 'export',
                    label: t('portfolio.quotesList.export'),
                    icon: Download,
                    variant: 'outline',
                    color: 'gray',
                    onClick: () => setExportDialogOpen(true)
                  }
                ]}
              />
            </div>
          </CardContent>
        </motion.div>

        {/* Content - Display based on mode */}
        <AnimatePresence mode="wait">
          {filteredQuotes.length === 0 ? (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-light text-gray-900 mb-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {quotes.length === 0 ? t('portfolio.quotesList.emptyState.noQuotes') : t('portfolio.quotesList.emptyState.noResults')}
                  </h3>
                  <p className="text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {quotes.length === 0
                      ? t('portfolio.quotesList.emptyState.willAppear')
                      : t('portfolio.quotesList.emptyState.modifyFilters')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : displayMode === 'list' ? (
            /* List View */
            <motion.div
              key="list"
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredQuotes.map((quote) => {
                const StatusIcon = statusConfig[quote.status as keyof typeof statusConfig]?.icon || AlertCircle;
                const statusColor = statusConfig[quote.status as keyof typeof statusConfig]?.color || 'bg-gray-500';

                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${statusColor}  flex-shrink-0`}>
                                <StatusIcon className={`h-5 w-5 sm:h-6 sm:w-6 text-white`} style={{ filter: 'brightness(0.8)' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h3 className="text-base sm:text-lg font-light text-gray-900 truncate tracking-tight"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                      letterSpacing: '-0.01em',
                                    }}
                                  >
                                    {quote.client_name}
                                  </h3>
                                  <Badge className='bg-gray-100 text-gray-700 text-xs font-light border border-gray-200'
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {statusConfig[quote.status as keyof typeof statusConfig]?.label || quote.status}
                                  </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="truncate">{quote.client_email}</span>
                                  </div>
                                  {quote.client_phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                      {quote.client_phone}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="whitespace-nowrap">{formatDate(quote.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-3 ml-11 sm:ml-14">
                              {quote.client_company && (
                                <div>
                                  <span className="text-xs sm:text-sm font-light text-gray-700"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{t('portfolio.quotesList.fields.company')} </span>
                                  <span className="text-xs sm:text-sm text-gray-600 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{quote.client_company}</span>
                                </div>
                              )}

                              <div>
                                <span className="text-xs sm:text-sm font-light text-gray-700"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{t('portfolio.quotesList.fields.serviceRequested')} </span>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{quote.service_requested}</p>
                              </div>

                              {quote.project_description && (
                                <div>
                                  <span className="text-xs sm:text-sm font-light text-gray-700"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{t('portfolio.quotesList.fields.description')} </span>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{quote.project_description}</p>
                                </div>
                              )}

                              {quote.budget_range && (
                                <div>
                                  <span className="text-xs sm:text-sm font-light text-gray-700"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{t('portfolio.quotesList.fields.budgetRange')} </span>
                                  <span className="text-xs sm:text-sm text-gray-600 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{quote.budget_range}</span>
                                </div>
                              )}

                              {quote.quote_amount && (
                                <div className="flex items-center gap-2 bg-gray-100 p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs sm:text-sm font-light text-gray-700"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >{t('portfolio.quotesList.fields.quoteAmount')} </span>
                                    <span className="text-sm sm:text-lg font-light text-gray-600"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        fontWeight: 300,
                                        letterSpacing: '-0.01em',
                                      }}
                                    >
                                      {formatAmount(quote.quote_amount)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {quote.internal_notes && (
                                <div className="bg-gray-100 p-2 sm:p-3 rounded-lg border border-gray-200">
                                  <span className="text-xs sm:text-sm font-light text-gray-700"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{t('portfolio.quotesList.fields.notes')} </span>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{quote.internal_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 mt-4 sm:mt-0">
                            <Button
                              onClick={() => handleRespond(quote)}
                              size="sm"
                              className="bg-gray-900 hover:bg-gray-800 text-white border-0 flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('portfolio.quotesList.actions.respond')}
                            </Button>
                            {(quote as ServiceQuote & { public_token?: string }).public_token && quote.status === 'quoted' && (
                              <Button
                                onClick={() => handleCopyQuoteLink(quote)}
                                size="sm"
                                variant="outline"
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                              >
                                <Link2 className="mr-1 h-3 w-3" />
                                {t('portfolio.quotesList.actions.copyLink')}
                              </Button>
                            )}
                            {quote.quote_amount && quote.quote_amount > 0 && (
                              <Button
                                onClick={() => handleGeneratePDF(quote)}
                                size="sm"
                                variant="outline"
                                disabled={isGeneratingPdf}
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {isGeneratingPdf ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    <span className="hidden sm:inline">{t('portfolio.quotesList.actions.generatingPdf')}</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-1 h-3 w-3" />
                                    {t('portfolio.quotesList.actions.downloadPdf')}
                                  </>
                                )}
                              </Button>
                            )}
                            {quote.status === 'accepted' && !quote.converted_to_invoice_id && (Number(quote.quote_amount) || 0) > 0 && (
                              <Button
                                onClick={() => handleCreateInvoice(quote)}
                                disabled={isCreatingInvoice}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {isCreatingInvoice ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    <span className="hidden sm:inline">{t('portfolio.quotesList.actions.creatingInvoice')}</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">{t('portfolio.quotesList.actions.createInvoice')}</span>
                                    <span className="sm:hidden">{t('portfolio.quotesList.actions.invoice')}</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : displayMode === 'kanban' ? (
            /* Kanban View */
            <motion.div
              key="kanban"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <QuotesKanbanView
                quotes={filteredQuotes}
                onStatusChange={handleQuoteStatusChange}
                onQuoteClick={handleRespond}
                onRespond={handleRespond}
                onGeneratePDF={handleGeneratePDF}
                onDelete={handleDeleteQuote}
              />
            </motion.div>
          ) : displayMode === 'chart' && stats ? (
            /* Chart View */
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuotesChartView
                quotes={filteredQuotes}
                stats={{
                  ...stats,
                  avg_response_hours: quoteConversionStats?.avg_response_hours,
                  avg_decision_hours: quoteConversionStats?.avg_decision_hours,
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="portfolio-modal-fix flex flex-col max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl">
          <DialogHeader className="portfolio-modal-content">
            <DialogTitle className="text-lg sm:text-xl font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >{t('portfolio.quotesList.dialog.title')}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {selectedQuote && `${selectedQuote.client_name} - ${selectedQuote.service_requested}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 portfolio-modal-content">
            <div>
              <Label htmlFor="status"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('portfolio.quotesList.dialog.statusLabel')}</Label>
              <Select
                value={responseData.status}
                onValueChange={(value: any) => setResponseData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="portfolio-select-fix font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="portfolio-select-options font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templates.length > 0 && (
              <div>
                <Label
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('portfolio.quotesList.dialog.useTemplate')}</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(id) => {
                    setSelectedTemplateId(id);
                    const t = templates.find(x => x.id === id);
                    if (t) handleApplyTemplate(t);
                  }}
                  disabled={isApplyingTemplate}
                >
                  <SelectTrigger className="portfolio-select-fix font-light">
                    <SelectValue placeholder={t('portfolio.quotesList.dialog.selectTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({QuoteTemplateService.getTemplateTotal(t.items).toLocaleString()} FCFA)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('portfolio.quotesList.dialog.itemsLabel')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addResponseItem}
                  className="h-8 text-sm font-light rounded-md"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('portfolio.quotesList.dialog.addLine')}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-3 bg-gray-50/50">
                {responseItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      placeholder={t('portfolio.quotesList.dialog.lineDescription')}
                      value={item.title}
                      onChange={(e) => updateResponseItem(idx, 'title', e.target.value)}
                      className="flex-1 portfolio-input-fix font-light text-sm"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateResponseItem(idx, 'quantity', Number(e.target.value) || 1)}
                      className="w-16 portfolio-input-fix font-light text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateResponseItem(idx, 'unit_price', Number(e.target.value) || 0)}
                      placeholder="PU"
                      className="w-24 portfolio-input-fix font-light text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-600 shrink-0 rounded-md"
                      onClick={() => removeResponseItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="quote_amount"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('portfolio.quotesList.dialog.amountLabel')}</Label>
              <Input
                id="quote_amount"
                type="number"
                step="0.01"
                value={responseData.quote_amount}
                onChange={(e) => setResponseData(prev => ({ ...prev, quote_amount: e.target.value }))}
                placeholder={t('portfolio.quotesList.dialog.amountPlaceholder')}
                className="portfolio-input-fix font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>

            <div>
              <Label htmlFor="payment_terms"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Conditions de règlement</Label>
              <Input
                id="payment_terms"
                value={responseData.payment_terms}
                onChange={(e) => setResponseData(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="Ex: Paiement à 30 jours, Acompte 30% à la commande, Virement, chèque, CB"
                className="portfolio-input-fix font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>

            <div>
              <Label htmlFor="execution_delay"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Délai d'exécution</Label>
              <Input
                id="execution_delay"
                value={responseData.execution_delay}
                onChange={(e) => setResponseData(prev => ({ ...prev, execution_delay: e.target.value }))}
                placeholder="Ex: 2 semaines, Sous 10 jours ouvrés"
                className="portfolio-input-fix font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>

            <div>
              <Label htmlFor="proposal_notes"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Notes de proposition (visibles client)</Label>
              <Textarea
                id="proposal_notes"
                value={responseData.proposal_notes}
                onChange={(e) => setResponseData(prev => ({ ...prev, proposal_notes: e.target.value }))}
                placeholder="Détails additionnels, précisions sur la prestation..."
                rows={2}
                className="portfolio-input-fix font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>

            <div>
              <Label htmlFor="notes"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('portfolio.quotesList.dialog.notesLabel')}</Label>
              <Textarea
                id="internal_notes"
                value={responseData.internal_notes}
                onChange={(e) => setResponseData(prev => ({ ...prev, internal_notes: e.target.value }))}
                placeholder={t('portfolio.quotesList.dialog.notesPlaceholder')}
                rows={4}
                className="portfolio-input-fix font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsResponseDialogOpen(false)} 
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 w-full sm:w-auto font-light rounded-xl"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('portfolio.quotesList.dialog.cancel')}
            </Button>
            {selectedQuote && (parseFloat(responseData.quote_amount || '0') > 0 || totalFromItems > 0) && (
              <Button
                onClick={() => selectedQuote && handleGeneratePDF(selectedQuote, responseItems, {
                  payment_terms: responseData.payment_terms || undefined,
                  proposal_notes: responseData.proposal_notes || undefined,
                  execution_delay: responseData.execution_delay || undefined,
                })}
                disabled={isGeneratingPdf}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 w-full sm:w-auto font-light rounded-xl"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('portfolio.quotesList.actions.generatingPdf')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('portfolio.quotesList.actions.downloadPdf')}
                  </>
                )}
              </Button>
            )}
            <Button 
              onClick={handleSubmitResponse} 
              disabled={updateQuoteMutation.isPending} 
              className="bg-gray-900 hover:bg-gray-800 text-white border-0 w-full sm:w-auto font-light rounded-xl"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {updateQuoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('portfolio.quotesList.dialog.saving')}
                </>
              ) : (
                t('portfolio.quotesList.dialog.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden -translate-x-1/2 -translate-y-1/2 portfolio-modal-fix rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              {t('portfolio.quotesList.dialog.createTitle')}
            </DialogTitle>
            <DialogDescription className="font-light"
              style={{ fontWeight: 300 }}
            >
              {t('portfolio.quotesList.dialog.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 min-w-0">
            {/* Section Entreprise (pré-remplie) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <Label className="font-medium text-gray-700">
                {t('portfolio.quotesList.dialog.createCompanySection')}
              </Label>
              <p className="text-xs text-gray-500 mt-1">{t('portfolio.quotesList.dialog.createCompanyHint')}</p>
              {invoiceSettings ? (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <p className="font-medium">{invoiceSettings.company_name || '-'}</p>
                  {invoiceSettings.company_address && <p>{invoiceSettings.company_address}</p>}
                  {invoiceSettings.company_phone && <p>Tél: {invoiceSettings.company_phone}</p>}
                  {invoiceSettings.company_email && <p>Email: {invoiceSettings.company_email}</p>}
                </div>
              ) : (
                <p className="text-sm text-amber-600 mt-2">Configurez vos paramètres dans Facture → Paramètres</p>
              )}
            </div>

            {/* Section Client */}
            <div>
              <Label className="font-medium text-gray-700 mb-2 block">{t('portfolio.quotesList.dialog.createClientSection')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-light text-sm">{t('portfolio.quotesList.dialog.createClientName')} <span className="text-red-500">*</span></Label>
                  <Input
                    value={createForm.client_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_name: e.target.value }))}
                    placeholder="Jean Dupont"
                    className="portfolio-input-fix font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="font-light text-sm">{t('portfolio.quotesList.dialog.createClientEmail')} <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={createForm.client_email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_email: e.target.value }))}
                    placeholder="jean@example.com"
                    className="portfolio-input-fix font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="font-light text-sm">{t('portfolio.quotesList.dialog.createClientPhone')}</Label>
                  <Input
                    type="tel"
                    value={createForm.client_phone}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_phone: e.target.value }))}
                    placeholder="+241 06 12 34 56 78"
                    className="portfolio-input-fix font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="font-light text-sm">{t('portfolio.quotesList.dialog.createClientCompany')}</Label>
                  <Input
                    value={createForm.client_company}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_company: e.target.value }))}
                    placeholder="Mon Entreprise SARL"
                    className="portfolio-input-fix font-light mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Section Lignes */}
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <Label className="font-medium text-gray-700 shrink-0">{t('portfolio.quotesList.dialog.createLinesSection')}</Label>
                <div className="flex flex-wrap gap-2 min-w-0">
                  {portfolioServices.length > 0 && (
                    <Select onValueChange={(id) => {
                      const s = portfolioServices.find((x) => x.id === id);
                      if (s) addCreateItemFromService(s);
                    }}>
                      <SelectTrigger className="min-w-0 w-full sm:w-[180px] h-8 text-sm">
                        <SelectValue placeholder={t('portfolio.quotesList.dialog.addFromService')} />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolioServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title} ({(s.price || 0).toLocaleString()} FCFA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {physicalProducts.length > 0 && (
                    <Select onValueChange={(id) => {
                      const p = physicalProducts.find((x: { id: string }) => x.id === id);
                      if (p) addCreateItemFromProduct(p);
                    }}>
                      <SelectTrigger className="min-w-0 w-full sm:w-[180px] h-8 text-sm">
                        <SelectValue placeholder={t('portfolio.quotesList.dialog.addFromProduct')} />
                      </SelectTrigger>
                      <SelectContent>
                        {physicalProducts.map((p: { id: string; title: string; price: number }) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title} ({p.price.toLocaleString()} FCFA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addCreateItem} className="shrink-0 w-full sm:w-auto rounded-lg">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('portfolio.quotesList.dialog.addLine')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden rounded-md border p-3 bg-gray-50/50 min-w-0">
                {createItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:items-start min-w-0">
                    <Input
                      placeholder={t('portfolio.quotesList.dialog.lineDescription')}
                      value={item.title}
                      onChange={(e) => updateCreateItem(idx, 'title', e.target.value)}
                      className="flex-1 min-w-0 portfolio-input-fix font-light text-sm"
                    />
                    <div className="flex gap-2 items-center shrink-0">
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateCreateItem(idx, 'quantity', Number(e.target.value) || 1)} className="w-14 sm:w-16 portfolio-input-fix font-light text-sm" />
                      <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(e) => updateCreateItem(idx, 'unit_price', Number(e.target.value) || 0)} placeholder="PU" className="w-20 sm:w-24 portfolio-input-fix font-light text-sm" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 shrink-0 rounded-md" onClick={() => removeCreateItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {createValidItems.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">Total: {createTotalFromItems.toLocaleString()} FCFA</p>
              )}
            </div>

            <div>
              <Label className="font-light text-sm">{t('portfolio.quotesList.dialog.createProjectDescription')}</Label>
              <Textarea
                value={createForm.project_description}
                onChange={(e) => setCreateForm((p) => ({ ...p, project_description: e.target.value }))}
                placeholder="Détails additionnels du projet..."
                rows={3}
                className="portfolio-input-fix font-light mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-light rounded-xl"
              style={{ fontWeight: 300 }}
            >
              {t('portfolio.quotesList.dialog.cancel')}
            </Button>
            <Button
              onClick={handleCreateQuote}
              disabled={createQuoteMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-white font-light rounded-xl"
              style={{ fontWeight: 300 }}
            >
              {createQuoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('portfolio.quotesList.dialog.createSubmitting')}
                </>
              ) : (
                t('portfolio.quotesList.dialog.createSubmit')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportQuotesDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        quotes={filteredQuotes}
      />
    </DashboardLayout>
  );
};

export default QuotesList;
