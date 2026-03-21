/**
 * Tests unitaires pour digitalProductService
 *
 * Teste les opérations CRUD sur les produits digitaux:
 * - Récupération par carte
 * - Récupération par ID
 * - Création
 * - Mise à jour
 * - Suppression
 * - Validation Zod
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { digitalProductService } from '@/services/digitalProductService';
import { supabase } from '@/integrations/supabase/client';
import type { DigitalProduct } from '@/services/digitalProductService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  },
}));

describe('digitalProductService', () => {
  const mockCardId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '987fcdeb-51a2-43e1-b789-123456789abc';

  const mockProduct: DigitalProduct = {
    id: mockProductId,
    card_id: mockCardId,
    title: 'Test Ebook',
    description: 'A comprehensive guide to testing',
    type: 'ebook_pdf',
    status: 'published',
    price: 29.99,
    currency: 'XOF',
    is_free: false,
    is_premium: true,
    file_url: 'https://example.com/ebook.pdf',
    preview_url: 'https://example.com/preview.pdf',
    thumbnail_url: 'https://example.com/thumb.jpg',
    file_size: 1024000,
    duration: 0,
    format: 'pdf',
    preview_duration: 0,
    view_count: 150,
    download_count: 45,
    purchase_count: 30,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProductsByCardId', () => {
    it('devrait récupérer tous les produits d\'une carte', async () => {
      const mockProducts = [mockProduct];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockProducts,
              error: null,
            }),
          }),
        }),
      } as any);

      const products = await digitalProductService.getProductsByCardId(mockCardId);

      expect(products).toEqual(mockProducts);
      expect(supabase.from).toHaveBeenCalledWith('digital_products');
    });

    it('devrait retourner un tableau vide si aucun produit', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const products = await digitalProductService.getProductsByCardId(mockCardId);

      expect(products).toEqual([]);
    });

    it('devrait valider l\'UUID de la carte', async () => {
      const invalidCardId = 'not-a-uuid';

      await expect(
        digitalProductService.getProductsByCardId(invalidCardId)
      ).rejects.toThrow();
    });

    it('devrait gérer les erreurs Supabase', async () => {
      const mockError = new Error('Database connection failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        digitalProductService.getProductsByCardId(mockCardId)
      ).rejects.toThrow('Database connection failed');
    });

    it('devrait trier les produits par date de création (desc)', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      } as any);

      await digitalProductService.getProductsByCardId(mockCardId);

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('getProductById', () => {
    it('devrait récupérer un produit par son ID', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProduct,
              error: null,
            }),
          }),
        }),
      } as any);

      const product = await digitalProductService.getProductById(mockProductId);

      expect(product).toEqual(mockProduct);
      expect(supabase.from).toHaveBeenCalledWith('digital_products');
    });

    it('devrait retourner null si produit non trouvé', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const product = await digitalProductService.getProductById(mockProductId);

      expect(product).toBeNull();
    });

    it('devrait valider l\'UUID du produit', async () => {
      const invalidProductId = 'invalid-uuid';

      await expect(
        digitalProductService.getProductById(invalidProductId)
      ).rejects.toThrow();
    });

    it('devrait gérer les erreurs de récupération', async () => {
      const mockError = new Error('Product not found');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        digitalProductService.getProductById(mockProductId)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    it('devrait créer un nouveau produit', async () => {
      const newProductData: Partial<DigitalProduct> = {
        card_id: mockCardId,
        title: 'New Ebook',
        type: 'ebook_pdf',
        price: 19.99,
        currency: 'XOF',
      };

      const createdProduct = { ...mockProduct, ...newProductData };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdProduct,
              error: null,
            }),
          }),
        }),
      } as any);

      const product = await digitalProductService.createProduct(newProductData);

      expect(product).toEqual(createdProduct);
      expect(supabase.from).toHaveBeenCalledWith('digital_products');
    });

    it('devrait gérer les erreurs de création', async () => {
      const mockError = new Error('Validation failed');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        digitalProductService.createProduct({ title: 'Test' })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('updateProduct', () => {
    it('devrait mettre à jour un produit', async () => {
      const updates: Partial<DigitalProduct> = {
        title: 'Updated Title',
        price: 39.99,
      };

      const updatedProduct = { ...mockProduct, ...updates };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedProduct,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const product = await digitalProductService.updateProduct(
        mockProductId,
        updates
      );

      expect(product.title).toBe('Updated Title');
      expect(product.price).toBe(39.99);
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        digitalProductService.updateProduct(mockProductId, { title: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProduct', () => {
    it('devrait supprimer un produit', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await expect(
        digitalProductService.deleteProduct(mockProductId)
      ).resolves.toBeUndefined();
    });

    it('devrait gérer les erreurs de suppression', async () => {
      const mockError = new Error('Delete failed');

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError,
          }),
        }),
      } as any);

      await expect(
        digitalProductService.deleteProduct(mockProductId)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Edge Cases', () => {
    it('devrait gérer les UUIDs null ou undefined', async () => {
      await expect(
        digitalProductService.getProductsByCardId(null as any)
      ).rejects.toThrow();

      await expect(
        digitalProductService.getProductById(undefined as any)
      ).rejects.toThrow();
    });

    it('devrait gérer les données malformées', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { invalid: 'data' },
              error: null,
            }),
          }),
        }),
      } as any);

      const product = await digitalProductService.getProductById(mockProductId);
      expect(product).toBeDefined();
    });

    it('devrait gérer les timeout réseau', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Network timeout')),
          }),
        }),
      } as any);

      await expect(
        digitalProductService.getProductsByCardId(mockCardId)
      ).rejects.toThrow('Network timeout');
    });
  });
});
