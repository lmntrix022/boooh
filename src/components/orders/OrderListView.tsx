import React from "react";
import { Tables } from "@/integrations/supabase/types";

type Order = Tables<"product_inquiries"> & {
  products: Pick<Tables<"products">, "id" | "name" | "price"> | null;
};

interface OrderListViewProps {
  orders: Order[];
  updateStatus: (orderId: string, field: "payment_status" | "shipping_status", status: string) => Promise<void>;
  generateInvoice: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const OrderListView: React.FC<OrderListViewProps> = () => {
  return <div>Order List View - Component stub</div>;
};

export default OrderListView;
