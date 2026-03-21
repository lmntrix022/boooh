import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderWithProduct } from "@/services/ordersService";

interface InvoiceViewProps {
  orders: OrderWithProduct[];
  generateInvoice: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({
  orders,
  generateInvoice,
  deleteOrder
}) => {
  const [invoiceFilter, setInvoiceFilter] = useState<string>("all");

  // Simuler l'état de facture (dans un vrai système, cela viendrait de la BD)
  const getInvoiceStatus = (order: OrderWithProduct) => {
    // Les commandes "completed" ou "processing" sont considérées comme ayant besoin d'une facture
    if (order.status === "completed") {
      return { status: "generated", number: `INV-${order.id.slice(0, 8)}` };
    } else if (order.status === "processing") {
      return { status: "pending", number: null };
    } else {
      return { status: "not_required", number: null };
    }
  };

  const filteredOrders = orders.filter(order => {
    const invoiceStatus = getInvoiceStatus(order);
    if (invoiceFilter === "all") return true;
    if (invoiceFilter === "generated") return invoiceStatus.status === "generated";
    if (invoiceFilter === "pending") return invoiceStatus.status === "pending";
    if (invoiceFilter === "paid_no_invoice") {
      return order.status === "processing" && invoiceStatus.status === "pending";
    }
    return true;
  });

  const getStatusBadge = (order: OrderWithProduct) => {
    const paymentStatusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      processing: { label: "Payé", className: "bg-green-100 text-green-800 border-green-200" },
      completed: { label: "Payé", className: "bg-green-100 text-green-800 border-green-200" },
    };

    const status = paymentStatusMap[order.status] || paymentStatusMap.pending;
    return (
      <Badge className={`${status.className} border`}>
        {status.label}
      </Badge>
    );
  };

  const getInvoiceBadge = (order: OrderWithProduct) => {
    const invoiceStatus = getInvoiceStatus(order);

    if (invoiceStatus.status === "generated") {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Générée
        </Badge>
      );
    } else if (invoiceStatus.status === "pending") {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 border flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Non générée
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 border flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Non requise
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <motion.div
        className="glass-card card-3d border-2 border-white/30 shadow-2xl rounded-3xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold gradient-text-3d flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
                  <FileText className="h-6 w-6 text-white" />
                </span>
                Gestion des Factures
              </h2>
              <p className="text-sm text-gray-600 mt-1">Vue axée sur les documents comptables et la conformité fiscale</p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <SelectTrigger className="w-[220px] glass border-2 border-white/40 rounded-2xl shadow-lg">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les commandes</SelectItem>
                  <SelectItem value="generated">Factures générées</SelectItem>
                  <SelectItem value="pending">Factures non générées</SelectItem>
                  <SelectItem value="paid_no_invoice">⚠️ Payées sans facture</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border-2 border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-medium text-blue-600 uppercase">Factures Générées</p>
              <p className="text-2xl font-bold gradient-text-3d mt-1">
                {orders.filter(o => getInvoiceStatus(o).status === "generated").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border-2 border-orange-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-medium text-orange-600 uppercase">À Générer</p>
              <p className="text-2xl font-bold gradient-text-3d mt-1">
                {orders.filter(o => getInvoiceStatus(o).status === "pending").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass border-2 border-red-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-medium text-red-600 uppercase">⚠️ Payées sans facture</p>
              <p className="text-2xl font-bold gradient-text-3d mt-1">
                {orders.filter(o => o.status === "processing" && getInvoiceStatus(o).status === "pending").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass border-2 border-gray-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-medium text-gray-600 uppercase">Total Commandes</p>
              <p className="text-2xl font-bold gradient-text-3d mt-1">{orders.length}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tableau des factures */}
      <motion.div
        className="glass-card card-3d border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-green-400/20 via-emerald-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                <TableHead className="font-semibold text-gray-700">N° Commande</TableHead>
                <TableHead className="font-semibold text-gray-700">Client</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Statut Paiement</TableHead>
                <TableHead className="font-semibold text-gray-700">N° Facture</TableHead>
                <TableHead className="font-semibold text-gray-700">Statut Facture</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, index) => {
                const invoiceStatus = getInvoiceStatus(order);
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-800">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">{order.client_name}</p>
                        <p className="text-xs text-gray-500">{order.client_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(order.created_at || ""), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-700">
                      {invoiceStatus.number || "-"}
                    </TableCell>
                    <TableCell>
                      {getInvoiceBadge(order)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {invoiceStatus.status === "generated" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => await generateInvoice(order.id)}
                            className="rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        ) : invoiceStatus.status === "pending" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={async () => await generateInvoice(order.id)}
                            className="rounded-lg bg-orange-600 hover:bg-orange-700"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Générer Facture
                          </Button>
                        ) : null}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => await deleteOrder(order.id)}
                          className="rounded-lg hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucune commande à afficher</p>
            <p className="text-sm mt-2">Essayez de modifier les filtres</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InvoiceView;
