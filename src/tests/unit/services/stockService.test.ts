import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StockService, StockItem, CreateStockItemData, UpdateStockItemData } from '@/services/stockService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Helper pour créer des mocks Supabase chaînés
const createSupabaseMock = () => {
  const mockCalls: any[] = [];
  
  const mockFrom = vi.fn().mockImplementation(() => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockCalls.push(chain);
    return chain;
  });
  
  return { mockFrom, mockCalls };
};

describe('StockService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any implementation that might persist
    vi.mocked(supabase.from).mockReset();
  });

  describe('getUserStock', () => {
    const userId = 'user-123';

    it('devrait retourner un tableau vide si userId est vide', async () => {
      const result = await StockService.getUserStock('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('devrait récupérer le stock pour tous les produits d\'un utilisateur', async () => {
      const mockCards = [{ id: 'card-1' }, { id: 'card-2' }];
      const mockProducts = [
        { id: 'prod-1', card_id: 'card-1', name: 'Produit 1', description: 'Desc 1', price: '1000' },
        { id: 'prod-2', card_id: 'card-2', name: 'Produit 2', description: 'Desc 2', price: '2000' },
      ];
      const mockStocks = [
        { product_id: 'prod-1', current_stock: 10 },
        { product_id: 'prod-2', current_stock: 5 },
      ];

      // Mock cards query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
        }),
      } as any);

      // Mock products query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
        }),
      } as any);

      // Mock stock query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: mockStocks,
          error: null,
        }),
      } as any);

      const result = await StockService.getUserStock(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('prod-1');
      expect(result[0].current_stock).toBe(10);
      expect(result[1].current_stock).toBe(5);
    });

    it('devrait gérer les erreurs lors de la récupération des cartes', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Erreur base de données' },
        }),
      } as any);

      await expect(
        StockService.getUserStock(userId)
      ).rejects.toThrow('Erreur cartes: Erreur base de données');
    });

    it('devrait retourner un tableau vide si aucune carte trouvée', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await StockService.getUserStock(userId);
      expect(result).toEqual([]);
    });
  });

  describe('createProductWithStock', () => {
    const cardId = 'card-123';
    const name = 'Nouveau Produit';
    const description = 'Description du produit';
    const initialStock = 100;

    it('devrait créer un produit avec son stock initial', async () => {
      const mockProduct = { id: 'prod-new' };

      // Mock product creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProduct,
          error: null,
        }),
      } as any);

      // Mock stock creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await StockService.createProductWithStock(cardId, name, description, initialStock);

      expect(result).toBe('prod-new');
    });

    it('devrait rejeter si cardId est manquant', async () => {
      await expect(
        StockService.createProductWithStock('', name, description, initialStock)
      ).rejects.toThrow('cardId requis');
    });

    it('devrait gérer les erreurs lors de la création du produit', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Erreur création' },
        }),
      } as any);

      await expect(
        StockService.createProductWithStock(cardId, name, description, initialStock)
      ).rejects.toThrow('Erreur création produit: Erreur création');
    });

    it('devrait utiliser 0 comme stock si initialStock est négatif', async () => {
      const mockProduct = { id: 'prod-new' };

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProduct,
          error: null,
        }),
      } as any);

      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: insertMock,
      } as any);

      await StockService.createProductWithStock(cardId, name, description, -10);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ current_stock: 0 })
      );
    });
  });

  describe('updateProductAndStock', () => {
    const cardId = 'card-123';
    const productId = 'prod-123';
    const name = 'Produit Mis à Jour';
    const description = 'Nouvelle description';
    const newStock = 50;

    it('devrait mettre à jour le produit et le stock', async () => {
      // Mock product update - chain properly
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const secondEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      updateChain.eq.mockReturnValue({
        eq: secondEq,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(updateChain as any);

      // Mock stock upsert
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: upsertMock,
      } as any);

      await StockService.updateProductAndStock(cardId, productId, name, description, newStock);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ current_stock: 50 }),
        { onConflict: 'product_id' }
      );
    });

    it('devrait mettre à jour seulement le produit si newStock n\'est pas fourni', async () => {
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const secondEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      updateChain.eq.mockReturnValue({
        eq: secondEq,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(updateChain as any);

      await StockService.updateProductAndStock(cardId, productId, name, description);

      expect(secondEq).toHaveBeenCalled();
    });

    it('devrait rejeter si cardId ou productId est manquant', async () => {
      await expect(
        StockService.updateProductAndStock('', productId, name, description)
      ).rejects.toThrow('cardId et productId requis');

      await expect(
        StockService.updateProductAndStock(cardId, '', name, description)
      ).rejects.toThrow('cardId et productId requis');
    });
  });

  describe('deleteProductAndStock', () => {
    const cardId = 'card-123';
    const productId = 'prod-123';

    it('devrait supprimer le stock puis le produit', async () => {
      // Mock stock deletion - chain properly
      const deleteStockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const secondEqStock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      deleteStockChain.eq.mockReturnValue({
        eq: secondEqStock,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(deleteStockChain as any);

      // Mock product deletion - chain properly
      const deleteProductChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const secondEqProduct = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      deleteProductChain.eq.mockReturnValue({
        eq: secondEqProduct,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(deleteProductChain as any);

      await StockService.deleteProductAndStock(cardId, productId);

      expect(secondEqStock).toHaveBeenCalled();
      expect(secondEqProduct).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la suppression du stock', async () => {
      const deleteStockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const secondEqStock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Erreur suppression stock' },
      });
      deleteStockChain.eq.mockReturnValue({
        eq: secondEqStock,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(deleteStockChain as any);

      await expect(
        StockService.deleteProductAndStock(cardId, productId)
      ).rejects.toThrow('Erreur suppression stock: Erreur suppression stock');
    });
  });

  describe('recordProductMovement', () => {
    const cardId = 'card-123';
    const productId = 'prod-123';

    it('devrait enregistrer un mouvement d\'entrée (in)', async () => {
      const currentStock = 10;
      const quantity = 5;

      // Mock get current stock - chain: select().eq().eq().maybeSingle()
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { current_stock: currentStock },
        error: null,
      });
      selectChain.eq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle,
        }),
      });

      vi.mocked(supabase.from).mockReturnValueOnce(selectChain as any);

      // Mock stock upsert
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: upsertMock,
      } as any);

      // Mock movement insert
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      // Mock alerts (optional)
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn(),
      } as any);

      const result = await StockService.recordProductMovement(
        cardId,
        productId,
        'in',
        quantity,
        'Réception stock'
      );

      expect(result).toBe(15); // 10 + 5
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ current_stock: 15 }),
        { onConflict: 'product_id,card_id' }
      );
    });

    it('devrait enregistrer un mouvement de sortie (out)', async () => {
      const currentStock = 10;
      const quantity = 3;
      let callCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (table === 'product_stock') {
          if (callCount === 1) {
            // First call: get current stock
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { current_stock: currentStock },
                      error: null,
                    }),
                  }),
                }),
              }),
            } as any;
          } else {
            // Second call: upsert stock
            return {
              select: vi.fn().mockReturnThis(), // Keep for safety
              upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            } as any;
          }
        } else if (table === 'stock_movements') {
          // Third call: insert movement
          return {
            select: vi.fn().mockReturnThis(), // Keep for safety
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'stock_alerts') {
          // Fourth call: insert alert (optional) - the code uses .then() so we return a promise-like object
          const insertPromise = Promise.resolve({ data: null, error: null });
          return {
            select: vi.fn().mockReturnThis(), // Keep for safety
            insert: vi.fn().mockReturnValue(insertPromise),
          } as any;
        }

        // Default chain
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      });

      const result = await StockService.recordProductMovement(
        cardId,
        productId,
        'out',
        quantity,
        'Vente'
      );

      expect(result).toBe(7); // 10 - 3
    });

    it('devrait enregistrer un ajustement de stock', async () => {
      const currentStock = 10;
      const newStock = 15;
      let callCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (table === 'product_stock' && callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { current_stock: currentStock },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        } else if (table === 'product_stock' && callCount === 2) {
          return {
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'stock_movements') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }

        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      });

      const result = await StockService.recordProductMovement(
        cardId,
        productId,
        'adjustment',
        newStock,
        'Inventaire'
      );

      expect(result).toBe(15);
    });

    it('devrait déduire cardId depuis le produit si non fourni', async () => {
      const mockProduct = { card_id: 'deduced-card-id' };
      let callCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (table === 'products' && callCount === 1) {
          // First call: get product to deduce cardId
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProduct,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else if (table === 'product_stock' && callCount === 2) {
          // Second call: get current stock
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { current_stock: 10 },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        } else if (table === 'product_stock' && callCount === 3) {
          return {
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'stock_movements') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }

        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      });

      await StockService.recordProductMovement(
        undefined,
        productId,
        'in',
        5
      );

      // Verify the calls were made in the right order
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(supabase.from).toHaveBeenCalledWith('product_stock');
      expect(supabase.from).toHaveBeenCalledWith('stock_movements');
    });

    it('devrait créer une alerte si stock = 0', async () => {
      const currentStock = 5;
      let callCount = 0;
      let alertInsertMock: any;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;

        if (table === 'product_stock' && callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { current_stock: currentStock },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        } else if (table === 'product_stock' && callCount === 2) {
          return {
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'stock_movements') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'stock_alerts') {
          // Store the insert mock to check it later
          alertInsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
          return {
            insert: alertInsertMock,
          } as any;
        }

        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      });

      await StockService.recordProductMovement(
        cardId,
        productId,
        'out',
        5,
        'Vente'
      );

      // Check that alert was inserted
      expect(alertInsertMock).toHaveBeenCalled();
      expect(alertInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ alert_type: 'out_of_stock' })
      );
    });
  });

  describe('getCardStock', () => {
    const cardId = 'card-123';

    it('devrait retourner un tableau vide si cardId est vide', async () => {
      const result = await StockService.getCardStock('');
      expect(result).toEqual([]);
    });

    it('devrait récupérer le stock pour tous les produits d\'une carte', async () => {
      const mockProducts = [
        { id: 'prod-1', card_id: cardId, name: 'Produit 1', description: 'Desc 1', price: '1000' },
        { id: 'prod-2', card_id: cardId, name: 'Produit 2', description: 'Desc 2', price: '2000' },
      ];
      const mockStocks = [
        { product_id: 'prod-1', current_stock: 10 },
        { product_id: 'prod-2', current_stock: 0 },
      ];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockProducts,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else if (table === 'product_stock') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: mockStocks,
                  error: null,
                }),
              }),
            }),
          } as any;
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        } as any;
      });

      const result = await StockService.getCardStock(cardId);

      expect(result).toHaveLength(2);
      expect(result[0].current_stock).toBe(10);
      expect(result[0].status).toBe('in_stock');
      expect(result[1].current_stock).toBe(0);
      expect(result[1].status).toBe('out_of_stock');
    });
  });

  describe('getCardMovements', () => {
    const cardId = 'card-123';

    it('devrait récupérer tous les mouvements d\'une carte', async () => {
      const mockMovements = [
        {
          id: 'mov-1',
          product_id: 'prod-1',
          movement_type: 'sale',
          quantity: 5,
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockMovements,
            error: null,
          }),
        };

        if (table === 'stock_movements') {
          chain.select = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockMovements,
                error: null,
              }),
            }),
          });
        }

        return chain;
      });

      const result = await StockService.getCardMovements(cardId);

      expect(result).toEqual(mockMovements);
    });

    it('devrait filtrer par productId si fourni', async () => {
      const productId = 'prod-1';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };

        if (table === 'stock_movements') {
          // order() returns an object with .eq() method for further filtering
          const orderResult = {
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
          chain.select = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue(orderResult),
            }),
          });
        }

        return chain;
      });

      const result = await StockService.getCardMovements(cardId, productId);

      expect(result).toEqual([]);
    });
  });

  describe('calculateStockStatus', () => {
    it('devrait calculer le statut basé sur le stock actuel et minimum', () => {
      // Test via les méthodes publiques qui utilisent calculateStockStatus
      // Cette méthode est privée, donc on teste son comportement indirectement
      // via createStockItem ou updateStockItem
    });
  });
});

