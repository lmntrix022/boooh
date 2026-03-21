
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  RefreshCw,
  ChevronDown,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Prix formatés directement en FCFA pour cohérence

type ProductInquiryWithProducts = Tables<"product_inquiries"> & {
  products: {
    name: string;
    price: number;
  } | null;
};

const statuses = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "processing", label: "En traitement", color: "bg-blue-100 text-blue-800", icon: Activity },
  { value: "completed", label: "Terminée", color: "bg-green-100 text-green-800", icon: CheckCircle }
];

const OrderManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fonction helper pour convertir les prix EUR vers XOF
  const convertPriceToXOF = (price: number): number => {
    // Si le prix semble être en EUR (généralement < 1000€ pour les produits Bööh)
    // le convertir vers XOF (1 EUR ≈ 625 FCFA)
    return price < 1000 ? price * 625 : price;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<ProductInquiryWithProducts | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_inquiries")
        .select(
          `
            *,
            products (
              name,
              price
            )
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProductInquiryWithProducts[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("product_inquiries")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès.",
      });
    },
  });

  // Statistiques calculées
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, processing: 0, completed: 0, revenue: 0 };

    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;

    // Calculer le revenu estimé (prix * quantité pour les commandes terminées)
    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => {
        const price = order.products?.price || 0;
        const quantity = order.quantity || 1;
        return sum + (price * quantity);
      }, 0);


    return { total, pending, processing, completed, revenue };
  }, [orders]);

  // Commandes filtrées
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      const matchesSearch = searchQuery === "" ||
        order.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);


  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleViewDetails = (order: ProductInquiryWithProducts) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const Icon = statusConfig.icon;
    return (
      <Badge className={`${statusConfig.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monitoring des Commandes</h1>
              <p className="mt-1 text-gray-600">Gérez et suivez toutes les demandes de produits</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Toutes catégories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <Progress value={(stats.pending / stats.total) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">En Traitement</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.processing}</div>
              <Progress value={(stats.processing / stats.total) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
              <Progress value={(stats.completed / stats.total) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Revenus</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'decimal',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(stats.revenue)} FCFA
              </div>
              <p className="text-xs text-gray-500 mt-1">Commandes terminées</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres et Recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email ou produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Résumé des résultats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {filteredOrders.length === orders?.length
                ? `${filteredOrders.length} commande${filteredOrders.length > 1 ? 's' : ''} au total`
                : `${filteredOrders.length} commande${filteredOrders.length > 1 ? 's' : ''} trouvée${filteredOrders.length > 1 ? 's' : ''} (${orders?.length || 0} au total)`
              }
            </div>
            {filteredOrders.length > itemsPerPage && (
              <div>
                Page {currentPage} sur {totalPages}
              </div>
            )}
          </div>
        </motion.div>

        {/* Table des commandes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Chargement des commandes...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Client</TableHead>
                    <TableHead className="font-semibold text-gray-900">Produit</TableHead>
                    <TableHead className="font-semibold text-gray-900">Quantité</TableHead>
                    <TableHead className="font-semibold text-gray-900">Prix</TableHead>
                    <TableHead className="font-semibold text-gray-900">Statut</TableHead>
                    <TableHead className="font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {currentOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{order.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {order.email}
                            </div>
                            {order.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {order.products?.name || 'Produit non spécifié'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {order.quantity || 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {order.products?.price ? (() => {
                              const converted = convertPriceToXOF(order.products.price);
                              return new Intl.NumberFormat('fr-FR', {
                                style: 'decimal',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(converted) + ' FCFA';
                            })() : 'Prix non défini'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy", { locale: fr }) : ''}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.created_at ? format(new Date(order.created_at), "HH:mm", { locale: fr }) : ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(order)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => updateStatusMutation.mutate({
                                id: order.id,
                                status: newStatus
                              })}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <ChevronDown className="w-3 h-3" />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map(status => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                      <status.icon className="w-3 h-3" />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
                  <p className="text-gray-600">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Aucune commande ne correspond à vos critères de recherche.'
                      : 'Aucune commande n\'a encore été passée.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white px-6 py-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredOrders.length)} sur {filteredOrders.length} commandes
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>

                {/* Numéros de page */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else {
                      // Logique pour afficher les bonnes pages quand il y en a beaucoup
                      if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal de détails */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande</DialogTitle>
              <DialogDescription>
                Informations complètes sur la demande de {selectedOrder?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom</label>
                    <p className="text-gray-900">{selectedOrder.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <p className="text-gray-900">{selectedOrder.phone || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Statut</label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Produit demandé</label>
                  <p className="text-gray-900">{selectedOrder.products?.name || 'Produit non spécifié'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantité</label>
                    <p className="text-gray-900">{selectedOrder.quantity || 1}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Prix estimé</label>
                    <p className="text-gray-900">
                      {selectedOrder.products?.price ? (() => {
                        const converted = convertPriceToXOF(selectedOrder.products.price);
                        return new Intl.NumberFormat('fr-FR', {
                          style: 'decimal',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(converted) + ' FCFA';
                      })() : 'Prix non défini'}
                    </p>
                  </div>
                </div>

                {selectedOrder.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Message du client</label>
                    <Textarea
                      value={selectedOrder.message}
                      readOnly
                      className="mt-1 bg-gray-50"
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>Créée le {selectedOrder.created_at ? format(new Date(selectedOrder.created_at), "PPP 'à' p", { locale: fr }) : ''}</span>
                  <span>Dernière mise à jour: {selectedOrder.updated_at ? format(new Date(selectedOrder.updated_at), "PPP 'à' p", { locale: fr }) : 'Jamais'}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrderManager;

