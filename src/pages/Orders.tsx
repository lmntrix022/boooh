import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  ShoppingCart,
  Search,
  Filter,
  SortAsc,
  Download,
  Mail,
  Phone,
  Trash2,
  MoreHorizontal,
  FileText,
  Eye,
  Settings,
  CreditCard,
  BarChart3,
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import OrderToolbar from "@/components/orders/OrderToolbar";
import OrderKanbanView from "@/components/orders/OrderKanbanView";
import OrderStatsView from "@/components/orders/OrderStatsView";
import { OrdersService, OrderWithProduct } from "@/services/ordersService";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseOrderService } from "@/services/purchaseOrderService";
import { DeliveryNoteService } from "@/services/deliveryNoteService";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceService } from "@/services/invoiceService";
import { notifyOSDrawerRefreshBadges } from "@/utils/osDrawerBadgesSync";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definition for the joined query result
type ProductInquiryWithProducts = Tables<"product_inquiries"> & {
  products: {
    name: string;
  } | null;
};

// Helper pour convertir OrderWithProduct en ProductInquiryWithProducts
const toProductInquiry = (order: OrderWithProduct): ProductInquiryWithProducts => ({
  ...order,
  product_id: order.product_id || '',
  products: order.products
} as unknown as ProductInquiryWithProducts);

// Types pour les vues et filtres
export type ViewMode = "list" | "kanban" | "stats";
export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";
export type ShippingStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderTypeFilter = 'physical' | 'digital';

export interface OrderFilters {
  paymentStatus: PaymentStatus[];
  shippingStatus: ShippingStatus[];
  orderType: OrderTypeFilter[];
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  amountRange: { min: number | null; max: number | null };
}

// statuses will be defined dynamically with translations in the component

// Ajoute des données fictives pour les mini-graphs
const generateMockData = (baseValue: number, variance: number = 0.3) => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    value: Math.max(0, baseValue + (Math.random() - 0.5) * variance * baseValue)
  }));
};

const mockData = {
  total: generateMockData(150, 0.4),
  pending: generateMockData(45, 0.5),
  processing: generateMockData(30, 0.6),
  completed: generateMockData(75, 0.3)
};

// Ajoute le composant OrderTimeline
const OrderTimeline = ({ order, t }: { order: ProductInquiryWithProducts; t: any }) => {
  const timelineSteps = [
    {
      status: "pending",
      label: t('orders.timeline.orderReceived'),
      description: t('orders.timeline.orderRegistered'),
      icon: ShoppingCart,
      color: "gray"
    },
    {
      status: "processing",
      label: t('orders.timeline.inProcessing'),
      description: t('orders.timeline.orderPreparing'),
      icon: Package,
      color: "gray"
    },
    {
      status: "completed",
      label: t('orders.timeline.completed'),
      description: t('orders.timeline.orderDelivered'),
      icon: CheckCircle,
      color: "gray"
    }
  ];

  const currentStepIndex = timelineSteps.findIndex(step => step.status === order.status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-light text-gray-900 mb-4"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          fontWeight: 300,
        }}
      >{t('orders.timeline.orderProgress')}</h3>
      <div className="relative">
        {timelineSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.status}
              className="flex items-start gap-4 mb-6"
            >
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isCompleted
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-px h-8 ${isCompleted ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <h4
                  className={`font-light ${isCompleted ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {step.label}
                </h4>
                <p
                  className={`text-sm font-light ${isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {step.description}
                </p>
                {isCurrent && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                    {t('orders.timeline.inProgress')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Orders = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();

  // Helper function to get translation with fallback - handles case where translation returns the key
  const getTranslation = (key: string, fallback: string): string => {
    try {
      const translation = t(key);
      // If i18next returns the key itself, it means the translation is missing
      // Check if the result is different from the key and doesn't start with the key pattern
      if (translation && translation !== key && !translation.startsWith('orders.')) {
        return translation;
      }
      return fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Direct translations for stats to ensure they work
  const statsLabels = {
    total: getTranslation('orders.stats.total', 'Total'),
    pending: getTranslation('orders.stats.pending', 'En attente'),
    processing: getTranslation('orders.stats.processing', 'En traitement'),
    completed: getTranslation('orders.stats.completed', 'Terminées'),
  };

  // Define statuses dynamically with translations
  const statuses = [
    { value: "pending", label: getTranslation('orders.statuses.pending', 'En attente') },
    { value: "processing", label: getTranslation('orders.statuses.processing', 'En traitement') },
    { value: "shipped", label: getTranslation('orders.statuses.shipped', "En cours d'expédition") },
    { value: "completed", label: getTranslation('orders.statuses.completed', 'Terminée') },
    { value: "cancelled", label: getTranslation('orders.statuses.cancelled', 'Annulée') }
  ];

  // États pour le filtrage et la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<OrderFilters>({
    paymentStatus: [],
    shippingStatus: [],
    orderType: [],
    dateRange: { start: null, end: null },
    products: [],
    amountRange: { min: null, max: null }
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState<{ id: string; type: 'physical' | 'digital' }[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductInquiryWithProducts | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // États pour les téléchargements de documents
  const [downloadingPO, setDownloadingPO] = useState<string | null>(null);
  const [downloadingDN, setDownloadingDN] = useState<string | null>(null);

  // Réinitialiser la pagination quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortConfig, filters]);

  const hasActiveFilters = searchTerm || filters.paymentStatus.length > 0 || filters.shippingStatus.length > 0 || filters.orderType.length > 0 || filters.dateRange.start || filters.dateRange.end || filters.products.length > 0;
  const resetFilters = () => {
    setFilters({
      paymentStatus: [],
      shippingStatus: [],
      orderType: [],
      dateRange: { start: null, end: null },
      products: [],
      amountRange: { min: null, max: null },
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // États pour le modal de confirmation de changement de statut
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{
    orderId: string;
    currentStatus: string;
    newStatus: string;
    orderType: 'physical' | 'digital';
    clientName: string;
  } | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      type,
    }: {
      id: string;
      status: string;
      type: 'physical' | 'digital';
    }) => {
      const tableName = type === 'physical' ? 'product_inquiries' : 'digital_inquiries';
      const updateData: any = { status };

      // Ajouter updated_at seulement pour product_inquiries (digital_inquiries n'a pas cette colonne)
      if (tableName === 'product_inquiries') {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();
      toast({
        title: t('orders.toasts.statusUpdated'),
        description: t('orders.toasts.statusUpdatedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('orders.errors.error'),
        description: error.message || t('orders.errors.updateStatusError'),
        variant: "destructive",
      });
    },
  });

  // Requête optimisée avec le nouveau service
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["orders", id, statusFilter, searchTerm],
    queryFn: async () => {
      if (!id || !user?.id) {
        throw new Error(t('orders.errors.missingCardOrUser'));
      }
      return await OrdersService.getOrders({
        cardId: id,
        userId: user.id,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
        searchTerm: searchTerm || undefined
      });
    },
    enabled: !!id && !!user,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Statuts des factures liées (pour afficher "Payé" quand la facture est payée)
  const invoiceIds = useMemo(
    () => [...new Set((orders || []).map(o => o.invoice_id).filter(Boolean) as string[])],
    [orders]
  );
  const { data: invoiceStatuses } = useQuery({
    queryKey: ["invoice-statuses", [...invoiceIds].sort().join(",")],
    queryFn: () => InvoiceService.getInvoiceStatusesByIds(invoiceIds),
    enabled: invoiceIds.length > 0,
    staleTime: 60000,
  });

  // Query pour récupérer les informations de la carte
  const { data: cardInfo } = useQuery({
    queryKey: ["card-info", id],
    queryFn: async () => {
      if (!id || !user?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from("business_cards")
        .select("id, name, user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        return null;
      }
      return data;
    },
    enabled: !!id && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Query pour récupérer les paramètres de facturation
  const { data: invoiceSettings } = useQuery({
    queryKey: ["invoice-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!orders) return null;
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      processing: orders.filter(o => o.status === "processing").length,
      completed: orders.filter(o => o.status === "completed").length,
    };
  }, [orders]);

  // Mutation pour la suppression
  const deleteOrdersMutation = useMutation({
    mutationFn: async (ordersToDelete: { id: string; type: 'physical' | 'digital' }[]) => {
      const physicalOrderIds = ordersToDelete.filter(order => order.type === 'physical').map(order => order.id);
      const digitalOrderIds = ordersToDelete.filter(order => order.type === 'digital').map(order => order.id);

      if (physicalOrderIds.length > 0) {
        const { error: physicalError } = await supabase
          .from("product_inquiries")
          .delete()
          .in("id", physicalOrderIds);
        if (physicalError) throw physicalError;
      }

      if (digitalOrderIds.length > 0) {
        const { error: digitalError } = await supabase
          .from("digital_inquiries")
          .delete()
          .in("id", digitalOrderIds);
        if (digitalError) throw digitalError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();
      toast({
        title: t('orders.toasts.ordersDeleted'),
        description: t('orders.toasts.ordersDeletedDescription'),
      });
      setSelectedOrders([]);
      setShowDeleteDialog(false);
      setOrdersToDelete([]);
    },
  });

  const confirmDeleteOrders = (orderIds: string[]) => {
    const ordersToDeleteWithType = orderIds.map(id => {
      const order = orders?.find(o => o.id === id);
      return { id, type: order?.type || 'physical' };
    });
    setOrdersToDelete(ordersToDeleteWithType);
  };

  // Fonction pour ouvrir le modal de confirmation de changement de statut
  const handleStatusChangeRequest = (
    orderId: string,
    currentStatus: string,
    newStatus: string,
    orderType: 'physical' | 'digital',
    clientName: string
  ) => {
    setStatusChangeData({
      orderId,
      currentStatus,
      newStatus,
      orderType,
      clientName,
    });
    setShowStatusDialog(true);
  };

  // Fonction pour confirmer le changement de statut
  const confirmStatusChange = () => {
    if (statusChangeData) {
      updateStatusMutation.mutate({
        id: statusChangeData.orderId,
        status: statusChangeData.newStatus,
        type: statusChangeData.orderType,
      });
      setShowStatusDialog(false);
      setStatusChangeData(null);
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('orders.statuses.pending'),
      processing: t('orders.statuses.processing'),
      completed: t('orders.statuses.completed'),
      cancelled: t('orders.statuses.cancelled'),
    };
    return statusMap[status] || status;
  };

  // Fonction pour l'export CSV
  const exportToCSV = () => {
    if (!filteredOrders.length) return;
    const headers = [t('orders.csv.date'), t('orders.csv.name'), t('orders.csv.email'), t('orders.csv.phone'), t('orders.csv.product'), t('orders.csv.type'), t('orders.csv.quantity'), t('orders.csv.status')];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(order =>
        [
          format(new Date(order.created_at || ""), "dd/MM/yyyy"),
          order.client_name,
          order.client_email,
          order.client_phone || "",
          order.product_name || t('orders.unspecifiedProduct'),
          order.type === 'physical' ? t('orders.physical') : t('orders.digital'),
          order.quantity,
          statuses.find(s => s.value === order.status)?.label || order.status
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${t('orders.csv.filename')}_${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();
  };

  // Filtrage et tri des commandes (recherche + statut rapide + filtres avancés)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = [...orders];

    // Filtre rapide par statut (clics sur les cartes stats)
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Recherche texte
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.client_name?.toLowerCase().includes(search) ||
        order.client_email?.toLowerCase().includes(search) ||
        order.products?.name?.toLowerCase().includes(search)
      );
    }

    // Filtres avancés (toolbar)
    if (filters.paymentStatus.length > 0) {
      filtered = filtered.filter(order => {
        const raw = (order.payment_status ?? "") as string;
        // UI "paid" = DB "paid" ou "completed", ou commande terminée sans payment_status (physique ancien), ou facture liée payée
        let paymentStatus: PaymentStatus = raw === "completed" ? "paid" : (raw || "pending") as PaymentStatus;
        if (!raw && order.status === "completed") paymentStatus = "paid";
        if (paymentStatus !== "paid" && order.invoice_id && invoiceStatuses?.[order.invoice_id] === "paid") paymentStatus = "paid";
        return filters.paymentStatus.includes(paymentStatus);
      });
    }
    if (filters.shippingStatus.length > 0) {
      filtered = filtered.filter(order => {
        const raw = (order.status || "pending") as string;
        const shippingStatus: ShippingStatus = raw === "completed" ? "delivered" : (raw as ShippingStatus);
        return filters.shippingStatus.includes(shippingStatus);
      });
    }
    if (filters.orderType.length > 0) {
      filtered = filtered.filter(order => filters.orderType.includes(order.type as OrderTypeFilter));
    }
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        if (filters.dateRange.start && orderDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && orderDate > filters.dateRange.end) return false;
        return true;
      });
    }
    if (filters.products.length > 0) {
      filtered = filtered.filter(order => {
        const productId = order.type === "physical" ? order.product_id : order.digital_product_id;
        return !!productId && filters.products.includes(productId);
      });
    }
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
      filtered = filtered.filter(order => {
        const price = typeof order.products?.price === "number" ? order.products.price : Number(order.products?.price) || 0;
        const total = price * (order.quantity || 1);
        if (filters.amountRange.min !== null && total < filters.amountRange.min) return false;
        if (filters.amountRange.max !== null && total > filters.amountRange.max) return false;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];

      if (sortConfig.key === "created_at") {
        aValue = new Date(a.created_at || "").getTime();
        bValue = new Date(b.created_at || "").getTime();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, statusFilter, searchTerm, sortConfig, filters, invoiceStatuses]);

  // Calcul des commandes paginées
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Fonction pour télécharger le bon de commande
  const handleDownloadPO = async (order: OrderWithProduct) => {
    setDownloadingPO(order.id);
    try {
      const { blobUrl } = await PurchaseOrderService.generatePurchaseOrderPDF(
        order,
        cardInfo,
        invoiceSettings as any
      );
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `BC-${order.id?.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({
        title: t('orders.toasts.success'),
        description: t('orders.toasts.poDownloaded'),
      });
    } catch (error) {
      toast({
        title: t('orders.errors.error'),
        description: t('orders.errors.generatePOError'),
        variant: "destructive",
      });
    } finally {
      setDownloadingPO(null);
    }
  };

  // Fonction pour télécharger le bon de livraison
  const handleDownloadDN = async (order: OrderWithProduct) => {
    setDownloadingDN(order.id);
    try {
      const { blobUrl } = await DeliveryNoteService.generateDeliveryNotePDF(
        order,
        cardInfo,
        invoiceSettings as any
      );
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `BL-${order.id?.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({
        title: t('orders.toasts.success'),
        description: t('orders.toasts.dnDownloaded'),
      });
    } catch (error) {
      toast({
        title: t('orders.errors.error'),
        description: t('orders.errors.generateDNError'),
        variant: "destructive",
      });
    } finally {
      setDownloadingDN(null);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('orders.title')}</h1>
          <div className="text-center py-8">
            <p className="text-gray-900">{t('orders.errors.loadError')}</p>
            <p className="text-gray-700 mt-2">{t('orders.errors.retryLater')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-gray-900">{t('orders.loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('orders.title')}</h1>
          <div className="text-center py-8">
            <p className="text-gray-900">{t('orders.noOrders')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(current =>
      current.includes(orderId)
        ? current.filter(id => id !== orderId)
        : [...current, orderId]
    );
  };

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="relative min-h-screen bg-white overflow-x-hidden">
          <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {/* Header Apple Minimal */}
            <motion.div
              className="mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Icon Container Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <ShoppingCart className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {getTranslation('orders.title', 'Commandes')}
                    </h1>
                    <p
                      className="text-sm md:text-base text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {getTranslation('orders.description', 'Gérez vos commandes et leur statut')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Section Apple Minimal */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 md:mb-8">
                <div
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 cursor-pointer hover:shadow-sm transition-all duration-200"
                  onClick={() => setStatusFilter("all")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-light text-gray-500 mb-1 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {statsLabels.total}
                      </p>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >{stats.total}</h3>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-gray-600" />
                    </div>
                  </div>
                  <div className="h-12 md:h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockData.total}>
                        <Line type="monotone" dataKey="value" stroke="#6b7280" strokeWidth={1.5} dot={false} />
                        <RechartsTooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 cursor-pointer hover:shadow-sm transition-all duration-200"
                  onClick={() => setStatusFilter("pending")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-light text-gray-500 mb-1 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {(() => {
                          const translation = t('orders.stats.pending');
                          return translation && translation !== 'orders.stats.pending' ? translation : 'En attente';
                        })()}
                      </p>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >{stats.pending}</h3>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Clock className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-gray-600" />
                    </div>
                  </div>
                  <div className="h-12 md:h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockData.pending}>
                        <Line type="monotone" dataKey="value" stroke="#6b7280" strokeWidth={1.5} dot={false} />
                        <RechartsTooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 cursor-pointer hover:shadow-sm transition-all duration-200"
                  onClick={() => setStatusFilter("processing")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-light text-gray-500 mb-1 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {statsLabels.processing}
                      </p>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >{stats.processing}</h3>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <Package className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-gray-600" />
                    </div>
                  </div>
                  <div className="h-12 md:h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockData.processing}>
                        <Line type="monotone" dataKey="value" stroke="#6b7280" strokeWidth={1.5} dot={false} />
                        <RechartsTooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 cursor-pointer hover:shadow-sm transition-all duration-200"
                  onClick={() => setStatusFilter("completed")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-light text-gray-500 mb-1 truncate"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {statsLabels.completed}
                      </p>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >{stats.completed}</h3>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-gray-600" />
                    </div>
                  </div>
                  <div className="h-12 md:h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockData.completed}>
                        <Line type="monotone" dataKey="value" stroke="#6b7280" strokeWidth={1.5} dot={false} />
                        <RechartsTooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <OrderToolbar
              viewMode={viewMode as any}
              setViewMode={setViewMode as any}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
              totalOrders={orders?.length || 0}
              filteredCount={filteredOrders.length}
              cardName={t('orders.myOrders')}
              availableProducts={[]}
              onExport={exportToCSV}
            />

            {/* List View Apple Minimal */}
            {viewMode === "list" && (
              <div
                className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="w-[30px]">
                          <input
                            type="checkbox"
                            checked={selectedOrders.length === paginatedOrders.length}
                            onChange={handleSelectAll}
                            className="rounded border border-gray-200 focus:ring-2 focus:ring-gray-900"
                          />
                        </TableHead>
                        <TableHead className="text-gray-900 font-light cursor-pointer hover:text-gray-900 transition-colors text-xs sm:text-sm" onClick={() => handleSort("created_at")}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {t('orders.table.date') || 'Date'}
                            <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-900 font-light cursor-pointer hover:text-gray-900 transition-colors text-xs sm:text-sm" onClick={() => handleSort("client_name")}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {t('orders.table.name') || 'Nom'}
                            <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm hidden md:table-cell"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.email') || 'Email'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm hidden lg:table-cell"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.phone') || 'Téléphone'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.product') || 'Produit'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.type') || 'Type'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.quantity') || 'Quantité'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.status') || 'Statut'}</TableHead>
                        <TableHead className="text-gray-900 font-light text-xs sm:text-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('orders.table.actions') || 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-64 text-center align-middle">
                            <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                              <Package className="h-12 w-12 text-gray-300" />
                              <p className="font-medium text-gray-700">
                                {t('orders.emptyState.noResults')}
                              </p>
                              <p className="text-sm max-w-md">
                                {t('orders.emptyState.noResultsDescription')}
                              </p>
                              {hasActiveFilters && (
                                <Button
                                  variant="outline"
                                  onClick={resetFilters}
                                  className="mt-2"
                                >
                                  {t('orders.emptyState.resetFilters')}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                      paginatedOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            // Only open details if we didn't click an action or select
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input') || target.closest('[role="menuitem"]')) {
                              return;
                            }
                            setSelectedOrder(toProductInquiry(order));
                            setIsDetailModalOpen(true);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="rounded border border-gray-200 focus:ring-2 focus:ring-gray-900"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap text-gray-900 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {format(new Date(order.created_at || ""), "PPP", { locale: currentLanguage === 'fr' ? fr : enUS })}
                          </TableCell>
                          <TableCell className="font-light text-gray-900 text-xs sm:text-sm"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{order.client_name}</TableCell>
                          <TableCell className="text-gray-900 text-xs sm:text-sm hidden md:table-cell font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{order.client_email}</TableCell>
                          <TableCell className="text-gray-900 text-xs sm:text-sm hidden lg:table-cell font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{order.client_phone || "-"}</TableCell>
                          <TableCell className="font-light text-gray-900 text-xs sm:text-sm"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{order.product_name || t('orders.unspecifiedProduct') || 'Produit non spécifié'}</TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                              {order.type === 'physical' ? t('orders.physical') : t('orders.digital')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-light text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{order.quantity}</TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                              {statuses.find((s) => s.value === order.status)?.label ?? order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('orders.actions.title')}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrder(toProductInquiry(order));
                                      setIsDetailModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    <span>{t('orders.actions.viewDetails')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      <span>{t('orders.actions.changeStatus') || 'Changer le statut'}</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      {statuses.map((status) => (
                                        <DropdownMenuItem
                                          key={status.value}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChangeRequest(
                                              order.id,
                                              order.status,
                                              status.value,
                                              order.type,
                                              order.client_name
                                            );
                                          }}
                                          disabled={order.status === status.value}
                                        >
                                          <div className="flex items-center gap-2">
                                            {order.status === status.value && <CheckCircle className="h-3 w-3" />}
                                            <span className={order.status === status.value ? "font-medium" : ""}>
                                              {status.label}
                                            </span>
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPO(order);
                                    }}
                                    disabled={downloadingPO === order.id}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    <span>{t('orders.actions.downloadPO')}</span>
                                    {downloadingPO === order.id && (
                                      <Loader2 className="h-4 w-4 ml-auto animate-spin" />
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadDN(order);
                                    }}
                                    disabled={downloadingDN === order.id}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>{t('orders.actions.downloadDN')}</span>
                                    {downloadingDN === order.id && (
                                      <Loader2 className="h-4 w-4 ml-auto animate-spin" />
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrders([order.id]);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span>{t('orders.actions.delete')}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="p-6 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil((filteredOrders.length || 0) / pageSize)}
                    pageSize={pageSize}
                    totalItems={filteredOrders.length || 0}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            )}

            {/* Kanban View */}
            {viewMode === "kanban" && (
              <OrderKanbanView
                orders={filteredOrders}
                updateStatus={(orderId, field, status) => {
                  const order = filteredOrders.find(o => o.id === orderId);
                  if (order) {
                    updateStatusMutation.mutate({
                      id: orderId,
                      status,
                      type: order.type
                    });
                  }
                  return Promise.resolve();
                }}
                deleteOrder={async (orderId) => {
                  const order = filteredOrders.find(o => o.id === orderId);
                  if (order) {
                    await deleteOrdersMutation.mutateAsync([{ id: orderId, type: order.type }]);
                  }
                }}
              />
            )}

            {/* Stats View */}
            {viewMode === "stats" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <OrderStatsView
                  orders={filteredOrders as any}
                  cardName={cardInfo?.name || t('common.myCard')}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={!!ordersToDelete.length}
          onOpenChange={(open) => !open && setOrdersToDelete([])}
          title={t('orders.deleteDialog.title')}
          description={t('orders.deleteDialog.description', { count: ordersToDelete.length })}
          confirmText={t('orders.deleteDialog.confirm')}
          cancelText={t('orders.deleteDialog.cancel')}
          onConfirm={() => deleteOrdersMutation.mutate(ordersToDelete)}
          isLoading={deleteOrdersMutation.isPending}
          variant="danger"
        />

        {/* Detail Modal Apple Minimal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 bg-white rounded-lg shadow-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-light text-gray-900 flex items-center gap-3"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                  <Eye className="h-5 w-5 text-gray-600" />
                </div>
                {t('orders.detailModal.title')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('orders.detailModal.description')}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h4 className="font-light text-gray-900 mb-3 flex items-center gap-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      {t('orders.detailModal.client')}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <p><span className="font-light">{t('orders.detailModal.name')}:</span> {selectedOrder.client_name}</p>
                      <p><span className="font-light">{t('orders.detailModal.email')}:</span> {selectedOrder.client_email}</p>
                      <p><span className="font-light">{t('orders.detailModal.phone')}:</span> {selectedOrder.client_phone || "-"}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h4 className="font-light text-gray-900 mb-3 flex items-center gap-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <ShoppingCart className="h-5 w-5 text-gray-600" />
                      </div>
                      {t('orders.detailModal.order')}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <p><span className="font-light">{t('orders.detailModal.date')}:</span> {selectedOrder.created_at && new Date(selectedOrder.created_at).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US')}</p>
                      <p><span className="font-light">{t('orders.detailModal.type')}:</span> {(selectedOrder as any).type === 'physical' ? t('orders.physical') : t('orders.digital')}</p>
                      <div>
                        <span className="font-light">{t('orders.detailModal.status')}:</span>
                        <div className="mt-2 text-gray-900 border border-gray-200 rounded-lg overflow-hidden">
                          <Select
                            value={selectedOrder.status || undefined}
                            onValueChange={(newStatus) => {
                              handleStatusChangeRequest(
                                selectedOrder.id,
                                selectedOrder.status || 'pending',
                                newStatus,
                                (selectedOrder as any).type,
                                selectedOrder.client_name || ''
                              );
                            }}
                          >
                            <SelectTrigger className="w-full border-none shadow-none focus:ring-0 h-10 px-3 bg-white hover:bg-gray-50 transition-colors font-light">
                              <SelectValue placeholder={t('orders.detailModal.status')} />
                            </SelectTrigger>
                            <SelectContent className="border border-gray-200 shadow-sm rounded-lg bg-white overflow-hidden p-0">
                              {statuses.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors text-gray-700 font-light"
                                >
                                  <div className="flex items-center gap-2">
                                    {selectedOrder.status === status.value && <CheckCircle className="h-4 w-4 text-gray-900" />}
                                    <span>{status.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <OrderTimeline order={selectedOrder} t={t} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog Apple Minimal */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent className="border border-gray-200 bg-white rounded-lg shadow-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3 text-2xl md:text-3xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                {t('orders.statusDialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-base font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('orders.statusDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {statusChangeData && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="text-sm font-light text-gray-600"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('orders.statusDialog.client')}</p>
                    <p className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >{statusChangeData.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <p className="text-xs font-light text-gray-600 mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('orders.statusDialog.currentStatus')}</p>
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                      {getStatusLabel(statusChangeData.currentStatus)}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <div className="h-px w-8 bg-gray-300" />
                    <div className="mx-2 text-gray-900 font-light">→</div>
                    <div className="h-px w-8 bg-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-light text-gray-600 mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('orders.statusDialog.newStatus')}</p>
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-light">
                      {getStatusLabel(statusChangeData.newStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter className="flex gap-3">
              <AlertDialogCancel className="rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('orders.statusDialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('orders.statusDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </TooltipProvider>
  );
};

export default Orders;
