/**
 * Types pour le système de gestion de stock
 */

export interface StockItem {
  id: string;
  user_id: string;
  card_id?: string;

  // Informations produit
  name: string;
  description?: string;
  sku?: string; // Stock Keeping Unit
  barcode?: string;

  // Catégorie
  category?: string;
  subcategory?: string;

  // Stock
  quantity: number;
  min_quantity: number; // Seuil d'alerte
  max_quantity?: number;
  unit: string; // pcs, kg, l, etc.

  // Prix
  cost_price: number;
  selling_price: number;
  currency: string;

  // Location
  location?: string; // Emplacement dans l'entrepôt
  warehouse?: string;

  // Status
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

  // Images
  image_url?: string;

  // Fournisseur
  supplier_name?: string;
  supplier_contact?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  last_restock_date?: string;
}

export interface StockMovement {
  id: string;
  stock_item_id: string;
  user_id: string;

  // Type de mouvement
  type: 'in' | 'out' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;

  // Détails
  reason?: string;
  reference?: string; // Numéro de commande, facture, etc.

  // Location (pour transferts)
  from_location?: string;
  to_location?: string;

  // Coût
  unit_cost?: number;
  total_cost?: number;

  // Notes
  notes?: string;

  // Metadata
  created_by: string;
  created_at: string;
}

export interface StockAlert {
  id: string;
  stock_item_id: string;
  user_id: string;

  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'overstock';
  threshold_value: number;
  current_value: number;

  status: 'active' | 'resolved' | 'ignored';
  resolved_at?: string;

  created_at: string;
  updated_at: string;
}

export interface StockCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  parent_id?: string; // Pour les sous-catégories
  color?: string;
  icon?: string;
  active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockReport {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  categories: {
    name: string;
    count: number;
    value: number;
  }[];
  recent_movements: StockMovement[];
  generated_at: string;
}

export type StockItemFormData = Omit<StockItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type StockMovementFormData = Omit<StockMovement, 'id' | 'user_id' | 'created_by' | 'created_at'>;
export type SupplierFormData = Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
