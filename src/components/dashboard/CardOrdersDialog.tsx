
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { notifyOSDrawerRefreshBadges } from "@/utils/osDrawerBadgesSync";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CardOrdersDialogProps {
  cardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statuses = [
  { value: "pending", label: "En attente" },
  { value: "processing", label: "En traitement" },
  { value: "completed", label: "Terminée" }
];

const CardOrdersDialog: React.FC<CardOrdersDialogProps> = ({ cardId, open, onOpenChange }) => {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_inquiries")
        .select(
          `
            *,
            products (
              name
            )
          `
        )
        .eq("card_id", cardId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!cardId,
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
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", cardId] });
      queryClient.invalidateQueries({ queryKey: ["os-drawer-badges"] });
      notifyOSDrawerRefreshBadges();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Commandes de la carte</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center space-x-2 py-8">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Chargement...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.created_at
                      ? format(new Date(order.created_at), "PPP", { locale: fr })
                      : ""}
                  </TableCell>
                  <TableCell>
                    {order.client_name}
                  </TableCell>
                  <TableCell>
                    {order.products?.name || "Produit non spécifié"}
                  </TableCell>
                  <TableCell>
                    {order.quantity}
                  </TableCell>
                  <TableCell>
                    {order.client_email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "pending"
                          ? "secondary"
                          : order.status === "processing"
                          ? "outline"
                          : "default"
                      }
                    >
                      {statuses.find((s) => s.value === order.status)?.label ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      defaultValue={order.status}
                      className="border rounded px-2 py-1 text-xs"
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: e.target.value,
                        })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogClose asChild>
          <Button variant="outline" className="mt-4">Fermer</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default CardOrdersDialog;
