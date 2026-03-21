import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  Trash2,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { OrderWithProduct } from "@/services/ordersService";
import { useLanguage } from "@/hooks/useLanguage";

interface OrderKanbanViewProps {
  orders: OrderWithProduct[];
  updateStatus: (orderId: string, field: "payment_status" | "shipping_status", status: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const OrderKanbanView: React.FC<OrderKanbanViewProps> = ({
  orders,
  updateStatus,
  deleteOrder
}) => {
  const { t, currentLanguage } = useLanguage();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Colonnes Kanban basées sur le statut
  const columns = [
    {
      id: "pending",
      title: t('orders.kanban.columns.pending'),
      status: "pending",
      icon: Clock,
      color: "bg-white border border-gray-200 shadow-sm",
      badgeColor: "bg-gray-100 text-gray-700 border border-gray-200"
    },
    {
      id: "processing",
      title: t('orders.kanban.columns.processing'),
      status: "processing",
      icon: Package,
      color: "bg-white border border-gray-200 shadow-sm",
      badgeColor: "bg-gray-100 text-gray-700 border border-gray-200"
    },
    {
      id: "shipped",
      title: t('orders.kanban.columns.shipped'),
      status: "shipped",
      icon: Truck,
      color: "bg-white border border-gray-200 shadow-sm",
      badgeColor: "bg-gray-100 text-gray-700 border border-gray-200"
    },
    {
      id: "completed",
      title: t('orders.kanban.columns.completed'),
      status: "completed",
      icon: CheckCircle,
      color: "bg-white border border-gray-200 shadow-sm",
      badgeColor: "bg-gray-100 text-gray-700 border border-gray-200"
    }
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
    setDraggedItem(orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      await updateStatus(draggedItem, "shipping_status", newStatus);
      setDraggedItem(null);
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnOrders = getOrdersByStatus(column.status);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className={`rounded-lg shadow-sm p-4 min-h-[600px] ${column.color}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* En-tête de colonne */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${column.badgeColor} shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >{column.title}</h3>
                    <p className="text-xs text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {columnOrders.length} {columnOrders.length === 1 ? t('orders.kanban.order') : t('orders.kanban.orders')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cartes de commande */}
              <div className="space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('orders.kanban.noOrders')}</p>
                  </div>
                ) : (
                  columnOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-sm transition-all duration-200 cursor-move ${
                        draggedItem === order.id ? "opacity-50 scale-95" : ""
                      }`}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e as React.DragEvent<HTMLDivElement>, order.id)}
                    >
                      {/* Alerte si facture non générée */}
                      {(order.status === "processing" || order.status === "completed") && (
                        <div className="mb-3 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-gray-700" />
                          <span className="text-xs text-gray-700 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('orders.kanban.invoiceToGenerate')}</span>
                        </div>
                      )}

                      {/* Info commande */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-light text-gray-900 text-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{order.client_name}</p>
                            <p className="text-xs text-gray-500 truncate font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{order.client_email}</p>
                          </div>
                          <Badge className={`text-xs ${column.badgeColor} rounded-lg font-light`}>
                            #{order.id.slice(0, 6)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-600">
                            <p className="font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{(order as any).product_name || t('orders.kanban.product')}</p>
                            <p className="text-gray-400 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('orders.kanban.quantity')}: {order.quantity || 1}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {format(new Date(order.created_at || ""), "dd MMM", { locale: currentLanguage === 'fr' ? fr : enUS })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions rapides */}
                      <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`mailto:${order.client_email}`)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('orders.kanban.email')}</p>
                          </TooltipContent>
                        </Tooltip>

                        {order.client_phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`tel:${order.client_phone}`)}
                                className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('orders.kanban.call')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        

                        <div className="flex-1" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => await deleteOrder(order.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('orders.kanban.delete')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default OrderKanbanView;
