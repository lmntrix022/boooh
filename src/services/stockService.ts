import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

// Use Supabase type for stock_movements
type DbStockMovement = Database['public']['Tables']['stock_movements']['Row'];

// StockItem is a virtual type - aggregated from products + product_stock
// There is no stock_items table in the database
export interface StockItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  tags?: string[];
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  last_updated: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Type de mouvement de stock selon le schéma de la base de données
export type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'initial_stock' | 'reservation' | 'unreservation' | 'return' | 'damage' | 'expired' | 'transfer';

export interface StockMovement {
  id: string;
  product_id: string;
  card_id: string;
  movement_type: StockMovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
  operator_id: string | null;
  created_at: string | null;
}

export interface CreateStockItemData {
  name: string;
  description?: string;
  category: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  tags?: string[];
}

export interface UpdateStockItemData {
  name?: string;
  description?: string;
  category?: string;
  sku?: string;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  unit_price?: number;
  supplier?: string;
  location?: string;
  tags?: string[];
}

// DB type for stock_items
type DbStockItem = Database['public']['Tables']['stock_items']['Row'];

function toStockItem(item: DbStockItem): StockItem {
  const currentStock = item.current_stock ?? 0;
  const minStock = item.min_stock ?? 0;
  let status: StockItem['status'] = 'in_stock';
  if (currentStock <= 0) status = 'out_of_stock';
  else if (currentStock <= minStock) status = 'low_stock';

  return {
    id: item.id,
    name: item.name,
    description: item.description || undefined,
    category: item.category || 'Général',
    sku: item.sku || item.id,
    current_stock: currentStock,
    min_stock: minStock,
    max_stock: item.max_stock ?? 0,
    unit_price: Number(item.unit_price) || 0,
    supplier: item.supplier || undefined,
    location: item.location || undefined,
    tags: item.tags || [],
    status,
    last_updated: item.updated_at || item.created_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    user_id: item.user_id
  };
}

function toStockMovement(mov: DbStockMovement): StockMovement {
  return {
    id: mov.id,
    product_id: mov.product_id,
    card_id: mov.card_id,
    movement_type: mov.movement_type as StockMovementType,
    quantity: mov.quantity,
    stock_before: mov.stock_before,
    stock_after: mov.stock_after,
    reason: mov.reason,
    reference_id: mov.reference_id,
    reference_type: mov.reference_type,
    notes: mov.notes,
    operator_id: mov.operator_id,
    created_at: mov.created_at
  };
}

export class StockService {
  /**
   * Récupère le stock pour tous les produits de toutes les cartes d'un utilisateur avec pagination
   */
  static async getUserStock(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<StockItem[]> {
    if (!userId) return [];
    const { limit, offset = 0 } = options || {};

    // Récupérer les cards de l'utilisateur
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select('id')
      .eq('user_id', userId);

    if (cardsError) {
      throw new Error(`Erreur cartes: ${cardsError.message}`);
    }
    if (!cards || cards.length === 0) return [];

    const cardIds = cards.map(c => c.id);

    // Produits des cartes avec le prix et pagination
    let query = supabase
      .from('products')
      .select('id, card_id, name, description, price')
      .in('card_id', cardIds)
      .order('name', { ascending: true });

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      throw new Error(`Erreur produits: ${productsError.message}`);
    }
    if (!products || products.length === 0) return [];

    const productIds = products.map(p => p.id);

    const { data: stocks, error: stockError } = await supabase
      .from('product_stock')
      .select('product_id, current_stock')
      .in('product_id', productIds);

    if (stockError) {
      throw new Error(`Erreur stock: ${stockError.message}`);
    }

    const productIdToStock: Record<string, number> = {};
    (stocks || []).forEach(s => { productIdToStock[s.product_id] = s.current_stock ?? 0; });

    const nowIso = new Date().toISOString();
    const items: StockItem[] = products.map(p => {
      // Convertir le prix de string à number (DECIMAL types return strings)
      const price = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0);

      return {
        id: p.id,
        name: p.name || 'Produit',
        description: p.description || '',
        category: 'Produits',
        sku: p.id,
        current_stock: productIdToStock[p.id] ?? 0,
        min_stock: 0,
        max_stock: 0,
        unit_price: price,
        supplier: '',
        location: '',
        tags: [],
        status: (productIdToStock[p.id] ?? 0) <= 0 ? 'out_of_stock' : 'in_stock',
        last_updated: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        user_id: userId
      };
    });

    return items;
  }

  /**
   * Crée un produit dans products et initialise son stock dans product_stock
   */
  static async createProductWithStock(cardId: string, name: string, description: string, initialStock: number) {
    if (!cardId) throw new Error('cardId requis');
    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({ card_id: cardId, name, description })
      .select('id')
      .single();
    if (pErr) throw new Error(`Erreur création produit: ${pErr.message}`);

    const { error: sErr } = await supabase
      .from('product_stock')
      .insert({ product_id: product.id, card_id: cardId, current_stock: Math.max(0, initialStock || 0) });
    if (sErr) throw new Error(`Erreur init stock: ${sErr.message}`);

    return product.id as string;
  }

  /**
   * Met à jour un produit et son stock actuel
   */
  static async updateProductAndStock(cardId: string, productId: string, name: string, description: string, newStock?: number) {
    if (!cardId || !productId) throw new Error('cardId et productId requis');
    const { error: pErr } = await supabase
      .from('products')
      .update({ name, description })
      .eq('id', productId)
      .eq('card_id', cardId);
    if (pErr) throw new Error(`Erreur maj produit: ${pErr.message}`);

    if (typeof newStock === 'number') {
      const { error: sErr } = await supabase
        .from('product_stock')
        .upsert({ product_id: productId, card_id: cardId, current_stock: Math.max(0, newStock) }, { onConflict: 'product_id,card_id' });
      if (sErr) throw new Error(`Erreur maj stock: ${sErr.message}`);
    }
  }

  /** Supprime le produit et son stock associé */
  static async deleteProductAndStock(cardId: string, productId: string) {
    if (!cardId || !productId) throw new Error('cardId et productId requis');
    const { error: sErr } = await supabase
      .from('product_stock')
      .delete()
      .eq('product_id', productId)
      .eq('card_id', cardId);
    if (sErr) throw new Error(`Erreur suppression stock: ${sErr.message}`);

    const { error: pErr } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('card_id', cardId);
    if (pErr) throw new Error(`Erreur suppression produit: ${pErr.message}`);
  }

  /**
   * Enregistre un mouvement et met à jour product_stock
   */
  static async recordProductMovement(cardId: string | undefined, productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason?: string, reference?: string) {
    if (!productId) throw new Error('productId requis');
    // Si cardId manquant, le déduire depuis le produit
    let effectiveCardId = cardId;
    if (!effectiveCardId) {
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('card_id')
        .eq('id', productId)
        .maybeSingle();
      if (pErr) throw new Error(`Erreur récupération produit: ${pErr.message}`);
      effectiveCardId = prod?.card_id;
    }
    if (!effectiveCardId) throw new Error('card_id introuvable pour ce produit');
    const qty = Math.max(0, Math.floor(quantity || 0));

    // Lire stock actuel
    const { data: current, error: gErr } = await supabase
      .from('product_stock')
      .select('current_stock')
      .eq('card_id', effectiveCardId)
      .eq('product_id', productId)
      .maybeSingle();
    if (gErr) throw new Error(`Erreur lecture stock: ${gErr.message}`);
    const beforeStock = current?.current_stock ?? 0;
    let newStock = beforeStock;
    if (type === 'in') newStock += qty;
    if (type === 'out') newStock = Math.max(0, newStock - qty);
    if (type === 'adjustment') newStock = qty;

    // Mettre à jour stock (composite key: product_id + card_id)
    const { error: uErr } = await supabase
      .from('product_stock')
      .upsert({ product_id: productId, card_id: effectiveCardId, current_stock: newStock }, {
        onConflict: 'product_id,card_id'
      });
    if (uErr) throw new Error(`Erreur maj stock: ${uErr.message}`);

    // Mapper le type vers vos valeurs observées
    const movement_type = type === 'in' ? 'purchase' : type === 'out' ? 'sale' : 'adjustment';

    // Préparer l'objet d'insertion avec seulement les champs qui existent
    const movementData: any = {
      product_id: productId,
      card_id: effectiveCardId,
      movement_type,
      quantity: qty,
      stock_before: beforeStock,
      stock_after: newStock,
    };

    // Ajouter reason et reference seulement s'ils sont fournis
    if (reason) movementData.reason = reason;
    if (reference) movementData.reference = reference;

    const { error: mErr } = await supabase
      .from('stock_movements')
      .insert(movementData);

    if (mErr) throw new Error(`Erreur enregistrement mouvement: ${mErr.message}`);

    // Alerte simple
    let alert_type: string | null = null;
    if (newStock === 0) alert_type = 'out_of_stock';
    else if (newStock <= 5) alert_type = 'low_stock';
    if (alert_type) {
      await supabase.from('stock_alerts').insert({
        product_id: productId,
        card_id: effectiveCardId,
        alert_type,
        current_stock: newStock,
        threshold: 5
      }).then(() => { }, () => { });
    }

    return newStock;
  }
  /**
   * Récupère les produits et leur stock pour une carte (card_id) avec pagination optionnelle
   */
  static async getCardStock(
    cardId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<StockItem[]> {
    if (!cardId) return [];
    const { limit, offset = 0 } = options || {};

    // 1) Récupère les produits de la carte avec le prix et pagination
    let query = supabase
      .from('products')
      .select('id, card_id, name, description, price')
      .eq('card_id', cardId)
      .order('name', { ascending: true });

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      throw new Error(`Erreur produits: ${productsError.message}`);
    }

    if (!products || products.length === 0) return [];

    const productIds = products.map(p => p.id);

    // 2) Récupère les niveaux de stock correspondants
    const { data: stocks, error: stockError } = await supabase
      .from('product_stock')
      .select('product_id, current_stock')
      .eq('card_id', cardId)
      .in('product_id', productIds);

    if (stockError) {
      throw new Error(`Erreur stock: ${stockError.message}`);
    }

    const productIdToStock: Record<string, number> = {};
    (stocks || []).forEach(s => { productIdToStock[s.product_id] = s.current_stock ?? 0; });

    // 3) Normalise vers StockItem
    const nowIso = new Date().toISOString();
    const items: StockItem[] = products.map(p => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0);

      return {
        id: p.id,
        name: p.name || 'Produit',
        description: p.description || '',
        category: 'Produits',
        sku: p.id,
        current_stock: productIdToStock[p.id] ?? 0,
        min_stock: 0,
        max_stock: 0,
        unit_price: price,
        supplier: '',
        location: '',
        tags: [],
        status: (productIdToStock[p.id] ?? 0) <= 0 ? 'out_of_stock' : 'in_stock',
        last_updated: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        user_id: ''
      };
    });

    return items;
  }

  /**
   * Récupère les mouvements de stock d'une carte (stock_movements)
   */
  static async getCardMovements(cardId: string, productId?: string) {
    if (!cardId) return [];
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) throw new Error(`Erreur mouvements: ${error.message}`);
    return data || [];
  }

  /**
   * Récupère les réservations (stock_reservations)
   */
  static async getCardReservations(cardId: string, productId?: string) {
    if (!cardId) return [];
    let query = supabase
      .from('stock_reservations')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) throw new Error(`Erreur réservations: ${error.message}`);
    return data || [];
  }

  /**
   * Récupère les alertes de stock (stock_alerts)
   */
  static async getCardAlerts(cardId: string, productId?: string) {
    if (!cardId) return [];
    let query = supabase
      .from('stock_alerts')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) throw new Error(`Erreur alertes: ${error.message}`);
    return data || [];
  }
  /**
   * Récupère tous les articles de stock d'un utilisateur
   */
  static async getStockItems(userId: string): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la récupération des articles: ${error.message}`);
      }

      return (data || []).map(toStockItem);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un article de stock par son ID
   */
  static async getStockItem(userId: string, itemId: string): Promise<StockItem | null> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Erreur lors de la récupération de l'article: ${error.message}`);
      }

      return data ? toStockItem(data) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un nouvel article de stock
   */
  static async createStockItem(
    userId: string,
    itemData: CreateStockItemData
  ): Promise<StockItem> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('ID utilisateur invalide');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (userId !== user.id) {
        throw new Error('ID utilisateur ne correspond pas à l\'utilisateur authentifié');
      }

      // Calculer le statut basé sur le stock
      const status = this.calculateStockStatus(
        itemData.current_stock,
        itemData.min_stock
      );

      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          user_id: userId,
          ...itemData,
          status,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création de l'article: ${error.message}`);
      }

      return toStockItem(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour un article de stock
   */
  static async updateStockItem(
    userId: string,
    itemId: string,
    updateData: UpdateStockItemData
  ): Promise<StockItem> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('ID utilisateur invalide');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (userId !== user.id) {
        throw new Error('ID utilisateur ne correspond pas à l\'utilisateur authentifié');
      }

      // Récupérer l'article actuel pour calculer le nouveau statut
      const currentItem = await this.getStockItem(userId, itemId);
      if (!currentItem) {
        throw new Error('Article non trouvé');
      }

      // Calculer le nouveau statut si le stock change
      const newStock = updateData.current_stock !== undefined
        ? updateData.current_stock
        : currentItem.current_stock;
      const newMinStock = updateData.min_stock !== undefined
        ? updateData.min_stock
        : currentItem.min_stock;

      const status = this.calculateStockStatus(newStock, newMinStock);

      const { data, error } = await supabase
        .from('stock_items')
        .update({
          ...updateData,
          status,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour de l'article: ${error.message}`);
      }

      return toStockItem(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un article de stock
   */
  static async deleteStockItem(userId: string, itemId: string): Promise<void> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('ID utilisateur invalide');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (userId !== user.id) {
        throw new Error('ID utilisateur ne correspond pas à l\'utilisateur authentifié');
      }

      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erreur lors de la suppression de l'article: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recherche des articles de stock
   */
  static async searchStockItems(
    userId: string,
    query: string
  ): Promise<StockItem[]> {
    try {
      const cleanQuery = query.trim().replace(/[%_\\]/g, '\\$&'); // Échapper les caractères spéciaux

      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${cleanQuery}%,sku.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la recherche: ${error.message}`);
      }

      return (data || []).map(toStockItem);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filtre les articles par catégorie
   */
  static async getStockItemsByCategory(
    userId: string,
    category: string
  ): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors du filtrage par catégorie: ${error.message}`);
      }

      return (data || []).map(toStockItem);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filtre les articles par statut
   */
  static async getStockItemsByStatus(
    userId: string,
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  ): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors du filtrage par statut: ${error.message}`);
      }

      return (data || []).map(toStockItem);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les mouvements de stock d'un article
   */
  static async getStockMovements(
    userId: string,
    itemId?: string
  ): Promise<StockMovement[]> {
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          stock_items!inner(user_id)
        `)
        .eq('stock_items.user_id', userId);

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la récupération des mouvements: ${error.message}`);
      }

      // Filter out the stock_items relation and map to StockMovement
      return (data || []).map((item: unknown) => {
        const mov = item as DbStockMovement & { stock_items?: unknown };
        return toStockMovement(mov);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enregistre un mouvement de stock
   */
  static async recordStockMovement(
    userId: string,
    itemId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<StockMovement> {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('ID utilisateur invalide');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (userId !== user.id) {
        throw new Error('ID utilisateur ne correspond pas à l\'utilisateur authentifié');
      }

      // Vérifier que l'article existe et appartient à l'utilisateur
      const item = await this.getStockItem(userId, itemId);
      if (!item) {
        throw new Error('Article non trouvé');
      }

      // Calculer le nouveau stock
      let newStock = item.current_stock;
      if (type === 'in') {
        newStock += quantity;
      } else if (type === 'out') {
        newStock -= quantity;
        if (newStock < 0) {
          throw new Error('Stock insuffisant');
        }
      } else if (type === 'adjustment') {
        newStock = quantity;
      }

      // Mettre à jour le stock de l'article
      await this.updateStockItem(userId, itemId, {
        current_stock: newStock,
      });

      // Enregistrer le mouvement - note: stock_movements uses different field names
      // Map our simplified API to the actual DB schema
      const movementType = type === 'in' ? 'purchase' : type === 'out' ? 'sale' : 'adjustment';
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: itemId,
          card_id: item.id, // Using item.id as a fallback for card_id
          movement_type: movementType,
          quantity,
          stock_before: item.current_stock,
          stock_after: newStock,
          reason,
          reference_id: reference || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de l'enregistrement du mouvement: ${error.message}`);
      }

      return toStockMovement(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcule le statut de stock basé sur le stock actuel et minimum
   */
  private static calculateStockStatus(
    currentStock: number,
    minStock: number
  ): 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' {
    if (currentStock <= 0) {
      return 'out_of_stock';
    } else if (currentStock <= minStock) {
      return 'low_stock';
    } else {
      return 'in_stock';
    }
  }

  /**
   * Récupère les statistiques de stock
   */
  static async getStockStats(userId: string): Promise<{
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    categories: { [key: string]: number };
  }> {
    try {
      const items = await this.getStockItems(userId);

      const stats = {
        total: items.length,
        inStock: items.filter(item => item.status === 'in_stock').length,
        lowStock: items.filter(item => item.status === 'low_stock').length,
        outOfStock: items.filter(item => item.status === 'out_of_stock').length,
        totalValue: items.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0),
        categories: {} as { [key: string]: number }
      };

      // Compter par catégorie
      items.forEach(item => {
        stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les articles avec stock faible
   */
  static async getLowStockItems(userId: string): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['low_stock', 'out_of_stock'])
        .order('current_stock', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors de la récupération des articles en stock faible: ${error.message}`);
      }

      return (data || []).map(toStockItem);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte les articles de stock en CSV
   */
  static async exportStockItemsCSV(userId: string): Promise<string> {
    try {
      const items = await this.getStockItems(userId);

      const headers = [
        'Nom',
        'SKU',
        'Catégorie',
        'Description',
        'Stock actuel',
        'Stock minimum',
        'Stock maximum',
        'Prix unitaire',
        'Valeur totale',
        'Statut',
        'Fournisseur',
        'Emplacement',
        'Tags',
        'Date de création',
        'Dernière mise à jour'
      ];

      const csvRows = [
        headers.join(','),
        ...items.map(item => [
          `"${item.name || ''}"`,
          `"${item.sku || ''}"`,
          `"${item.category || ''}"`,
          `"${item.description || ''}"`,
          item.current_stock || 0,
          item.min_stock || 0,
          item.max_stock || 0,
          item.unit_price || 0,
          (item.current_stock * item.unit_price) || 0,
          `"${item.status || ''}"`,
          `"${item.supplier || ''}"`,
          `"${item.location || ''}"`,
          `"${(item.tags || []).join(';')}"`,
          `"${item.created_at || ''}"`,
          `"${item.last_updated || ''}"`
        ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sauvegarde les mouvements d'inventaire et met à jour les stocks
   */
  static async saveInventory(
    cardId: string,
    inventoryItems: Array<{
      id: string;
      systemStock: number;
      physicalStock: number;
      variance: number;
    }>
  ): Promise<void> {
    try {
      // Pour chaque article avec une variance, enregistrer un mouvement d'ajustement
      for (const item of inventoryItems) {
        if (item.variance !== 0) {
          // Enregistrer le mouvement d'ajustement
          await this.recordProductMovement(
            cardId,
            item.id,
            'adjustment',
            item.physicalStock,
            `Ajustement inventaire: ${item.systemStock} → ${item.physicalStock}`
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'inventaire:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel inventaire
   */
  static async createInventory(cardId: string, userId: string, itemCount: number) {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .insert({
          card_id: cardId,
          user_id: userId,
          status: 'in_progress',
          item_count: itemCount,
          discrepancy_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur création inventaire:', error);
      throw error;
    }
  }

  /**
   * Ajoute les articles à un inventaire
   */
  static async addInventoryItems(
    inventoryId: string,
    items: Array<{
      product_id: string;
      system_stock: number;
      unit_value: number;
    }>
  ) {
    try {
      const itemsToInsert = items.map(item => ({
        inventory_id: inventoryId,
        product_id: item.product_id,
        system_stock: item.system_stock,
        physical_stock: 0,
        variance: 0,
        variance_percent: 0,
        unit_value: item.unit_value,
        total_value: 0
      }));

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur ajout items inventaire:', error);
      throw error;
    }
  }

  /**
   * Met à jour la quantité physique d'un article
   */
  static async updateInventoryItemStock(
    inventoryItemId: string,
    physicalStock: number
  ) {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('inventory_items')
        .select('system_stock, unit_value')
        .eq('id', inventoryItemId)
        .single();

      if (fetchError) throw fetchError;

      const variance = physicalStock - item.system_stock;
      const variancePercent = item.system_stock > 0 ? (variance / item.system_stock) * 100 : 0;
      const totalValue = physicalStock * item.unit_value;

      const { error } = await supabase
        .from('inventory_items')
        .update({
          physical_stock: physicalStock,
          variance,
          variance_percent: parseFloat(variancePercent.toFixed(2)),
          total_value: totalValue
        })
        .eq('id', inventoryItemId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      throw error;
    }
  }

  /**
   * Finalise un inventaire
   */
  static async finalizeInventory(inventoryId: string) {
    try {
      // Appeler la fonction SQL pour finaliser
      const { data, error } = await supabase
        .rpc('finalize_inventory', { p_inventory_id: inventoryId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur finalisation inventaire:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les inventaires d'une carte
   */
  static async getCardInventories(cardId: string) {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select(`
          *,
          inventory_items (
            id,
            product_id,
            system_stock,
            physical_stock,
            variance,
            variance_percent,
            unit_value,
            total_value
          )
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération inventaires:', error);
      throw error;
    }
  }

  /**
   * Récupère les stats d'un inventaire
   */
  static async getInventoryStats(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_inventory_stats', { p_inventory_id: inventoryId });

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('Erreur stats inventaire:', error);
      throw error;
    }
  }
}
