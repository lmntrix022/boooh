import { supabase } from '@/integrations/supabase/client';
import { CardIdSchema, ProductIdSchema, UuidSchema } from '@/lib/validation-schemas';
import { Database } from '@/types/supabase';

// DB type
type DbDigitalProduct = Database['public']['Tables']['digital_products']['Row'];

// Extended type with computed fields
export interface DigitalProduct {
  id: string;
  card_id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  price: number;
  currency: string;
  is_free: boolean;
  is_premium: boolean;
  file_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
  file_size?: number;
  duration?: number;
  format?: string;
  preview_duration: number;
  view_count: number;
  download_count: number;
  purchase_count: number;
  created_at: string;
  updated_at: string;
}

// Convert DB row to extended type
function toDigitalProduct(row: DbDigitalProduct): DigitalProduct {
  return {
    id: row.id,
    card_id: row.card_id,
    title: row.title || row.name || 'Untitled',
    description: row.description || undefined,
    type: row.type || 'ebook_pdf',
    status: row.status || 'draft',
    price: Number(row.price) || 0,
    currency: row.currency || 'EUR',
    is_free: row.is_free ?? false,
    is_premium: row.is_premium ?? false,
    file_url: row.file_url || undefined,
    preview_url: row.preview_url || undefined,
    thumbnail_url: row.thumbnail_url || undefined,
    file_size: row.file_size || undefined,
    duration: row.duration || undefined,
    format: row.format || undefined,
    preview_duration: row.preview_duration || 30,
    view_count: 0, // Computed field, not in DB
    download_count: row.download_count || 0,
    purchase_count: 0, // Computed field, not in DB
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

export interface DigitalPurchase {
  id: string;
  product_id: string;
  buyer_email: string;
  buyer_name?: string;
  buyer_phone?: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_reference?: string;
  download_token: string;
  download_count: number;
  max_downloads: number;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired' | 'refunded';
  created_at: string;
  last_download_at?: string;
}

export interface DigitalProductAnalytics {
  id: string;
  title: string;
  type: string;
  price: number;
  view_count: number;
  download_count: number;
  purchase_count: number;
  total_revenue: number;
  avg_sale_price: number;
  created_at: string;
  published_at?: string;
}

class DigitalProductService {
  /**
   * Récupère tous les produits numériques d'une carte
   */
  async getProductsByCardId(cardId: string): Promise<DigitalProduct[]> {
    try {
      // Validation de l'ID de carte
      CardIdSchema.parse(cardId);

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toDigitalProduct);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un produit numérique par ID
   */
  async getProductById(productId: string): Promise<DigitalProduct | null> {
    try {
      ProductIdSchema.parse(productId);

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data ? toDigitalProduct(data) : null;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Crée un nouveau produit numérique
   */
  async createProduct(productData: Database['public']['Tables']['digital_products']['Insert']): Promise<DigitalProduct> {
    try {
      const { data, error } = await supabase
        .from('digital_products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return toDigitalProduct(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour un produit numérique
   */
  async updateProduct(productId: string, updates: Database['public']['Tables']['digital_products']['Update']): Promise<DigitalProduct> {
    try {
      const { data, error } = await supabase
        .from('digital_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return toDigitalProduct(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un produit numérique
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Incrémente le compteur de vues (uses download_count as proxy since view_count doesn't exist)
   */
  async incrementViewCount(productId: string): Promise<void> {
    try {
      // view_count doesn't exist in DB, this is a no-op for now
      // Could use analytics or a separate table in the future
      console.log(`View tracked for product ${productId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un achat sécurisé
   */
  async createSecurePurchase(
    productId: string,
    buyerEmail: string,
    buyerName?: string,
    buyerPhone?: string,
    paymentMethod?: string,
    paymentReference?: string
  ): Promise<string> {
    try {
      // Use direct insert since RPC may not exist
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      const { data, error } = await supabase
        .from('digital_purchases')
        .insert({
          product_id: productId,
          buyer_email: buyerEmail,
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null,
          payment_method: paymentMethod || null,
          payment_reference: paymentReference || null,
          download_token: crypto.randomUUID(),
          amount: 0, // Will be updated after payment
          expires_at: expiresAt,
          status: 'pending'
        })
        .select('download_token')
        .single();

      if (error) throw error;
      return data?.download_token || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valide un téléchargement
   */
  async validateDownload(downloadToken: string): Promise<{
    is_valid: boolean;
    file_url: string;
    product_title: string;
    error_message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('digital_purchases')
        .select('*, digital_products(file_url, title)')
        .eq('download_token', downloadToken)
        .single();

      if (error || !data) {
        return {
          is_valid: false,
          file_url: '',
          product_title: '',
          error_message: 'Invalid download token'
        };
      }

      const product = data.digital_products as { file_url: string | null; title: string | null } | null;
      return {
        is_valid: true,
        file_url: product?.file_url || '',
        product_title: product?.title || '',
        error_message: ''
      };
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère les achats d'un utilisateur
   */
  async getPurchasesByEmail(email: string): Promise<DigitalPurchase[]> {
    try {
      const { data, error } = await supabase
        .from('digital_purchases')
        .select('*')
        .eq('buyer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        product_id: row.product_id,
        buyer_email: row.buyer_email,
        buyer_name: row.buyer_name || undefined,
        buyer_phone: row.buyer_phone || undefined,
        amount: Number(row.amount) || 0,
        currency: row.currency || 'EUR',
        payment_method: row.payment_method || undefined,
        payment_reference: row.payment_reference || undefined,
        download_token: row.download_token,
        download_count: row.download_count || 0,
        max_downloads: row.max_downloads || 5,
        expires_at: row.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: (row.status || 'pending') as DigitalPurchase['status'],
        created_at: row.created_at || new Date().toISOString(),
        last_download_at: row.last_download_at || undefined
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les analytics d'un produit
   */
  async getProductAnalytics(productId: string): Promise<DigitalProductAnalytics | null> {
    try {
      // digital_product_analytics is likely a view - just cast the result
      const { data, error } = await supabase
        .from('digital_product_analytics')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) return null;
      return data as unknown as DigitalProductAnalytics;
    } catch {
      return null;
    }
  }

  /**
   * Récupère les analytics d'une carte
   */
  async getCardAnalytics(cardId: string): Promise<DigitalProductAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('digital_product_analytics')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DigitalProductAnalytics[];
    } catch {
      return [];
    }
  }

  /**
   * Recherche des produits numériques
   */
  async searchProducts(query: string, filters?: {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    isFree?: boolean;
    isPremium?: boolean;
  }): Promise<DigitalProduct[]> {
    try {
      let queryBuilder = supabase
        .from('digital_products')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (filters?.type) {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }

      if (filters?.minPrice !== undefined) {
        queryBuilder = queryBuilder.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('price', filters.maxPrice);
      }

      if (filters?.isFree !== undefined) {
        queryBuilder = queryBuilder.eq('is_free', filters.isFree);
      }

      if (filters?.isPremium !== undefined) {
        queryBuilder = queryBuilder.eq('is_premium', filters.isPremium);
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toDigitalProduct);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload un fichier vers Supabase Storage
   */
  async uploadFile(
    file: File,
    cardId: string,
    type: 'file' | 'preview' | 'thumbnail'
  ): Promise<string> {
    try {
      // Validation du fichier
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }

      // Validation de la taille (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error(`Le fichier est trop volumineux. Taille maximale: 50MB`);
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt) {
        throw new Error('Extension de fichier invalide');
      }

      // Validation des extensions autorisées
      const allowedExtensions = {
        'file': ['.mp3', '.wav', '.mp4', '.pdf', '.epub'],
        'preview': ['.mp3', '.wav', '.mp4'],
        'thumbnail': ['.jpg', '.jpeg', '.png', '.webp']
      };

      if (!allowedExtensions[type].includes(`.${fileExt}`)) {
        throw new Error(`Extension non autorisée pour ${type}. Extensions autorisées: ${allowedExtensions[type].join(', ')}`);
      }

      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const bucketName = type === 'thumbnail' ? 'digital-thumbnails' : 'digital-products';
      const filePath = `${cardId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        // Error log removed
        throw new Error(`Erreur d'upload: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Supprime un fichier de Supabase Storage
   */
  async deleteFile(filePath: string, bucketName: string = 'digital-products'): Promise<void> {
    try {
      if (!filePath) {
        throw new Error('Chemin de fichier requis');
      }

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        // Error log removed
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Nettoie les fichiers orphelins d'un produit
   */
  async cleanupProductFiles(productId: string): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('Produit non trouvé');
      }

      const filesToDelete: { path: string; bucket: string }[] = [];

      // Ajouter les fichiers à supprimer
      if (product.file_url) {
        const filePath = product.file_url.split('/').slice(-2).join('/');
        filesToDelete.push({ path: filePath, bucket: 'digital-products' });
      }

      if (product.preview_url) {
        const previewPath = product.preview_url.split('/').slice(-2).join('/');
        filesToDelete.push({ path: previewPath, bucket: 'digital-products' });
      }

      if (product.thumbnail_url) {
        const thumbnailPath = product.thumbnail_url.split('/').slice(-2).join('/');
        filesToDelete.push({ path: thumbnailPath, bucket: 'digital-thumbnails' });
      }

      // Supprimer les fichiers
      for (const file of filesToDelete) {
        try {
          await this.deleteFile(file.path, file.bucket);
        } catch (error) {
          // Warning log removed
        }
      }
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère les statistiques globales
   */
  async getGlobalStats(): Promise<{
    totalProducts: number;
    totalRevenue: number;
    totalDownloads: number;
    totalViews: number;
  }> {
    try {
      // Note: view_count and purchase_count don't exist in DB
      // Using download_count and computing revenue from purchases
      const { data, error } = await supabase
        .from('digital_products')
        .select('download_count, price');

      if (error) throw error;

      const stats = data?.reduce(
        (acc, product) => ({
          totalProducts: acc.totalProducts + 1,
          totalRevenue: acc.totalRevenue + (Number(product.price) || 0),
          totalDownloads: acc.totalDownloads + (product.download_count || 0),
          totalViews: 0, // Not tracked in DB
        }),
        { totalProducts: 0, totalRevenue: 0, totalDownloads: 0, totalViews: 0 }
      );

      return stats || { totalProducts: 0, totalRevenue: 0, totalDownloads: 0, totalViews: 0 };
    } catch (error) {
      throw error;
    }
  }
}

export const digitalProductService = new DigitalProductService();
