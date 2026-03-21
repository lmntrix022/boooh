import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InvoiceService } from "@/services/invoiceService";
import { notifyOSDrawerRefreshBadges } from "@/utils/osDrawerBadgesSync";
import OrderToolbar from "./OrderToolbar";
import OrderListView from "./OrderListView";
import OrderKanbanView from "./OrderKanbanView";
import InvoiceView from "./InvoiceView";

type Order = Tables<"product_inquiries"> & {
  products: Pick<Tables<"products">, "id" | "name" | "price"> | null;
};

export type ViewMode = "list" | "kanban" | "invoice";

export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";
export type ShippingStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderTypeFilter = 'physical' | 'digital';

export interface OrderFilters {
  paymentStatus: PaymentStatus[];
  shippingStatus: ShippingStatus[];
  orderType: OrderTypeFilter[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  products: string[];
  amountRange: {
    min: number | null;
    max: number | null;
  };
}

interface OrderDashboardProps {
  cardId: string;
  userId: string;
  cardName: string;
}

const OrderDashboard: React.FC<OrderDashboardProps> = ({ cardId, userId, cardName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<OrderFilters>({
    paymentStatus: [],
    shippingStatus: [],
    orderType: [],
    dateRange: { start: null, end: null },
    products: [],
    amountRange: { min: null, max: null },
  });

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("product_inquiries")
          .select(`
            *,
            products (id, name, price)
          `)
          .eq("card_id", cardId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data as Order[] || []);
      } catch (error: any) {
        // Error log removed
        toast({
          title: "Erreur",
          description: "Impossible de charger les commandes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [cardId, toast]);

  // Statuts des factures liées (pour filtre "Payé" quand la facture est payée)
  useEffect(() => {
    const ids = [...new Set(orders.map((o) => (o as any).invoice_id).filter(Boolean))] as string[];
    if (ids.length === 0) {
      setInvoiceStatuses({});
      return;
    }
    InvoiceService.getInvoiceStatusesByIds(ids).then(setInvoiceStatuses);
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          order.client_name?.toLowerCase().includes(searchLower) ||
          order.client_email?.toLowerCase().includes(searchLower) ||
          order.client_phone?.toLowerCase().includes(searchLower) ||
          order.id?.toLowerCase().includes(searchLower) ||
          order.products?.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Payment status filter (commande terminée ou facture liée payée = considérée payée)
      if (filters.paymentStatus.length > 0) {
        const raw = ((order as any).payment_status ?? "") as string;
        let paymentStatus: PaymentStatus = raw === "completed" ? "paid" : (raw || "pending") as PaymentStatus;
        if (!raw && order.status === "completed") paymentStatus = "paid";
        const invoiceId = (order as any).invoice_id;
        if (paymentStatus !== "paid" && invoiceId && invoiceStatuses[invoiceId] === "paid") paymentStatus = "paid";
        if (!filters.paymentStatus.includes(paymentStatus)) return false;
      }

      // Shipping status filter (DB column is "status": pending, processing, shipped, delivered, cancelled)
      if (filters.shippingStatus.length > 0) {
        const orderShippingStatus = (order.status as ShippingStatus) || "pending";
        if (!filters.shippingStatus.includes(orderShippingStatus)) {
          return false;
        }
      }

      // Order type filter (Dashboard only has physical orders)
      if (filters.orderType.length > 0) {
        if (!filters.orderType.includes("physical")) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const orderDate = new Date(order.created_at);
        if (filters.dateRange.start && orderDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && orderDate > filters.dateRange.end) {
          return false;
        }
      }

      // Product filter
      if (filters.products.length > 0) {
        if (!order.products || !filters.products.includes(order.products.id)) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
        const totalAmount = (order.products?.price || 0) * (order.quantity || 1);
        if (filters.amountRange.min !== null && totalAmount < filters.amountRange.min) {
          return false;
        }
        if (filters.amountRange.max !== null && totalAmount > filters.amountRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchTerm, filters, invoiceStatuses]);

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    field: "payment_status" | "shipping_status",
    status: string
  ) => {
    try {
      // DB has "status" for order/shipping lifecycle, not "shipping_status"
      const dbField = field === "shipping_status" ? "status" : field;
      const { error } = await supabase
        .from("product_inquiries")
        .update({ [dbField]: status })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, [dbField]: status } : order
        )
      );
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: "Statut mis à jour",
        description: `Le statut de la commande a été mis à jour.`,
      });
    } catch (error: any) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  // Generate invoice
  const generateInvoice = async (orderId: string) => {
    // TODO: Implement invoice generation
    toast({
      title: "Génération de facture",
      description: "Cette fonctionnalité sera bientôt disponible.",
    });
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("product_inquiries").delete().eq("id", orderId);

      if (error) throw error;

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();

      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée avec succès.",
      });
    } catch (error: any) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande.",
        variant: "destructive",
      });
    }
  };

  // Get unique products for filter
  const uniqueProducts = useMemo(() => {
    const products = orders
      .filter((order) => order.products)
      .map((order) => order.products!);
    const unique = Array.from(new Map(products.map((p) => [p.id, p])).values());
    return unique;
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <OrderToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        totalOrders={orders.length}
        filteredCount={filteredOrders.length}
        cardName={cardName}
        availableProducts={uniqueProducts}
      />

      {/* Views */}
      {viewMode === "list" && (
        <OrderListView
          orders={filteredOrders}
          updateStatus={updateOrderStatus}
          generateInvoice={generateInvoice}
          deleteOrder={deleteOrder}
        />
      )}

      {viewMode === "kanban" && (
        <OrderKanbanView
          orders={filteredOrders as any}
          updateStatus={updateOrderStatus}
          deleteOrder={deleteOrder}
        />
      )}

      {viewMode === "invoice" && (
        <InvoiceView
          orders={filteredOrders as any}
          generateInvoice={generateInvoice}
          deleteOrder={deleteOrder}
        />
      )}
    </div>
  );
};

export default OrderDashboard;
