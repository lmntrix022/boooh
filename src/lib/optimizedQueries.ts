import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type BusinessCardType = Tables<"business_cards">;
type SocialLinkType = Tables<"social_links">;
type ProductType = Tables<"products">;
type DigitalProductType = Tables<"digital_products">;
type MediaContentType = Tables<"media_content">;

interface CardData extends Omit<BusinessCardType, 'social_links' | 'products' | 'digital_products' | 'media_content'> {
  social_links?: SocialLinkType[];
  products?: ProductType[];
  digital_products?: DigitalProductType[];
  media_content?: MediaContentType[];
}

// Cache en mémoire pour les requêtes
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const optimizedQueries = {
  // Requête optimisée pour une carte complète
  // Accepte soit un UUID soit un slug
  async getCardWithRelations(identifier: string, isPublic: boolean = false): Promise<CardData | null> {
    const cacheKey = `card-${identifier}-${isPublic}`; // Cache key stable sans timestamp
    
    // Vérifier le cache (RÉACTIVÉ pour performance)
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Déterminer si l'identifiant est un UUID ou un slug
      // Un UUID a le format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caractères avec tirets)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      // Construire la requête selon le type d'identifiant
      let cardQuery: any = supabase
        .from('business_cards')
        .select(`
          *,
          social_links (*),
          products (*),
          media_content (*)
        `);
      
      if (isUUID) {
        cardQuery = cardQuery.eq('id', identifier);
      } else {
        // C'est un slug
        cardQuery = cardQuery.eq('slug', identifier);
      }
      
      cardQuery = cardQuery.single();
      
      // Requête optimisée : toutes les requêtes en parallèle
      const [cardResult] = await Promise.all([
        cardQuery
      ]);
      
      if (cardResult.error) {
        throw cardResult.error;
      }
      
      const cardData = cardResult.data as any;
      const cardId = cardData.id; // On récupère l'ID réel pour les requêtes suivantes
      
      // Vérifier que la carte est publique
      if (isPublic && !cardData.is_public) {
        throw new Error("Cette carte n'est pas publique");
      }
      
      // Requête séparée pour les produits numériques (RLS)
      const digitalProductsResult = await supabase
        .from('digital_products')
        .select('*')
        .eq('card_id', cardId);
      
      // Combiner les données (digitalProducts est optionnel)
      const data = {
        ...cardData,
        digital_products: digitalProductsResult.data || []
      };
      
      // Erreur digitalProducts non-bloquante (optionnel)
      if (digitalProductsResult.error) {
        // Silencieux - les produits numériques sont optionnels
      }

      // Filtrer les produits disponibles et les médias actifs
      const filteredData = {
        ...data,
        products: (data as any).products?.filter((product: ProductType) => product.is_available) || [],
        digital_products: data.digital_products?.filter((product: DigitalProductType) => product.status === 'published') || [],
        media_content: (data as any).media_content?.filter((media: MediaContentType) => media.is_active) || []
      } as CardData;

      // Vérifier que les données essentielles existent
      if (!filteredData.id || !filteredData.name) {
        throw new Error("Données de carte incomplètes");
      }

      // Mettre en cache avec les deux identifiants (slug et UUID)
      queryCache.set(cacheKey, { data: filteredData, timestamp: Date.now() });
      if (filteredData.slug && isUUID) {
        // Si on a cherché par UUID mais qu'on a un slug, mettre aussi en cache avec le slug
        queryCache.set(`card-${filteredData.slug}-${isPublic}`, { data: filteredData, timestamp: Date.now() });
      }

      return filteredData;
    } catch (error) {
      // Error log removed
      throw error; // Lancer l'erreur au lieu de retourner null
    }
  },

  // Requête optimisée pour plusieurs cartes
  async getCardsWithRelations(cardIds: string[], isPublic: boolean = false): Promise<CardData[]> {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select(`
          *,
          social_links (*),
          products (*)
        `)
        .in('id', cardIds)
        .eq('is_public', true);  // Toujours true pour les cartes publiques

      if (error) throw error;

      return data.map((card: any) => ({
        ...card,
        products: card.products?.filter((product: ProductType) => product.is_available) || []
      }));
    } catch (error) {
      // Error log removed
      return [];
    }
  },

  // Requête optimisée pour les cartes populaires
  async getPopularCards(limit: number = 10): Promise<CardData[]> {
    const cacheKey = `popular-cards-${limit}`;
    
    // Vérifier le cache
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select(`
          *,
          social_links (*),
          products (*)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const filteredData = data.map((card: any) => ({
        ...card,
        products: card.products?.filter((product: ProductType) => product.is_available) || []
      }));

      // Mettre en cache
      queryCache.set(cacheKey, { data: filteredData, timestamp: Date.now() });

      return filteredData;
    } catch (error) {
      // Error log removed
      return [];
    }
  },

  // Vider le cache
  clearCache(): void {
    queryCache.clear();
  },

  // Vider une entrée spécifique du cache
  clearCacheEntry(key: string): void {
    queryCache.delete(key);
  }
};

// Préchargement intelligent
export const preloadCardData = async (cardId: string, isPublic: boolean = false) => {
  try {
    await optimizedQueries.getCardWithRelations(cardId, isPublic);
  } catch (error) {
    // Error log removed
  }
};

// Préchargement de plusieurs cartes
export const preloadMultipleCards = async (cardIds: string[], isPublic: boolean = false) => {
  try {
    await optimizedQueries.getCardsWithRelations(cardIds, isPublic);
  } catch (error) {
    // Error log removed
  }
}; 