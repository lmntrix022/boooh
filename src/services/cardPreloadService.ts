import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type BusinessCardType = Tables<"business_cards">;
type SocialLinkType = Tables<"social_links">;
type ProductType = Tables<"products">;

interface CardData extends BusinessCardType {
  social_links?: SocialLinkType[];
  products?: ProductType[];
}

// Cache en mémoire pour les cartes
const cardCache = new Map<string, { data: CardData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cardPreloadService = {
  // Précharger une carte
  async preloadCard(cardId: string, isPublic: boolean = false): Promise<CardData | null> {
    try {
      // Vérifier le cache
      const cached = cardCache.get(cardId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      // Requêtes parallèles pour optimiser le chargement
      const [cardResult, socialResult, productsResult] = await Promise.all([
        supabase
          .from("business_cards")
          .select("*")
          .eq("id", cardId)
          .eq(isPublic ? "is_public" : "id", isPublic ? true : cardId)
          .single(),
        supabase
          .from("social_links")
          .select("*")
          .eq("card_id", cardId),
        supabase
          .from("products")
          .select("*")
          .eq("card_id", cardId)
          .eq("is_available", true)
      ]);

      if (cardResult.error) throw cardResult.error;

      const fullCardData: CardData = {
        ...cardResult.data,
        social_links: socialResult.data || [],
        products: productsResult.data || []
      };

      // Mettre en cache
      cardCache.set(cardId, { data: fullCardData, timestamp: Date.now() });

      return fullCardData;
    } catch (error) {
      // Error log removed
      return null;
    }
  },

  // Précharger plusieurs cartes
  async preloadCards(cardIds: string[], isPublic: boolean = false): Promise<Map<string, CardData>> {
    const results = new Map<string, CardData>();
    
    // Précharger en parallèle avec limitation de concurrence
    const chunks = this.chunkArray(cardIds, 3); // 3 requêtes simultanées max
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (id) => {
        const data = await this.preloadCard(id, isPublic);
        if (data) results.set(id, data);
      });
      
      await Promise.all(promises);
    }
    
    return results;
  },

  // Obtenir une carte du cache
  getFromCache(cardId: string): CardData | null {
    const cached = cardCache.get(cardId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },

  // Vider le cache
  clearCache(): void {
    cardCache.clear();
  },

  // Vider une carte spécifique du cache
  clearCardCache(cardId: string): void {
    cardCache.delete(cardId);
  },

  // Diviser un tableau en chunks
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

// Préchargement automatique des cartes populaires
export const preloadPopularCards = async () => {
  try {
    // Récupérer les cartes les plus vues
    const { data: popularCards } = await supabase
      .from('business_cards')
      .select('id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (popularCards && popularCards.length > 0) {
      const cardIds = popularCards.map(card => card.id);
      await cardPreloadService.preloadCards(cardIds, true);
    }
  } catch (error) {
    // Error log removed
  }
};

// Préchargement au démarrage de l'app
if (typeof window !== 'undefined') {
  // Précharger les cartes populaires après 2 secondes
  setTimeout(preloadPopularCards, 2000);
} 