/**
 * Service unifié de cache et préchargement pour les cartes
 *
 * Remplace:
 * - preloadService.ts
 * - cardPreloadService.ts
 * - enhancedPreloadService.ts
 * - smartPreloadService.ts
 *
 * Stratégies disponibles:
 * - IndexedDB pour persistance (utilisé par défaut)
 * - In-memory pour cache temporaire
 * - Event-driven pour préchargement intelligent
 */

import { supabase } from '@/integrations/supabase/client';

// Types
interface CacheOptions {
  ttl?: number; // Time to live en millisecondes
  storage?: 'indexeddb' | 'memory';
  priority?: 'high' | 'medium' | 'low';
}

interface CacheEntry {
  key: string; // OBLIGATOIRE pour keyPath IndexedDB
  data: any;
  timestamp: number;
  ttl: number;
}

interface PreloadOptions extends CacheOptions {
  slowConnectionMode?: boolean;
  includeImages?: boolean;
}

// Configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const INDEXED_DB_NAME = 'booh-card-cache';
const INDEXED_DB_VERSION = 2; // Incrémenté pour forcer migration du schéma
const STORES = {
  CARDS: 'cards',
  IMAGES: 'images',
  USER_DATA: 'user-data',
};

// In-memory cache fallback
const memoryCache = new Map<string, CacheEntry>();

// IndexedDB helper
class IndexedDBHelper {
  private dbPromise: Promise<IDBDatabase> | null = null;

  async getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

          // Version 2: Recréer les stores avec keyPath correct
          if (oldVersion < 2) {
            // Supprimer les anciens stores s'ils existent (mauvais schéma)
            if (db.objectStoreNames.contains(STORES.CARDS)) {
              db.deleteObjectStore(STORES.CARDS);
            }
            if (db.objectStoreNames.contains(STORES.IMAGES)) {
              db.deleteObjectStore(STORES.IMAGES);
            }
            if (db.objectStoreNames.contains(STORES.USER_DATA)) {
              db.deleteObjectStore(STORES.USER_DATA);
            }

            // Créer les nouveaux stores avec keyPath 'key'
            const cardsStore = db.createObjectStore(STORES.CARDS, { keyPath: 'key' });
            cardsStore.createIndex('timestamp', 'timestamp', { unique: false });

            const imagesStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'key' });
            imagesStore.createIndex('timestamp', 'timestamp', { unique: false });

            const userDataStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
            userDataStore.createIndex('timestamp', 'timestamp', { unique: false });

          }
        };
      });
    }
    return this.dbPromise;
  }

  async set(store: string, key: string, value: any, ttl: number): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);

      const entry: CacheEntry = {
        key: key, // Stocker la clé dans l'entrée (DOIT être en premier pour keyPath)
        data: value,
        timestamp: Date.now(),
        ttl,
      };

      // Avec keyPath, on peut utiliser put() directement avec l'objet
      const request = objectStore.put(entry);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
      // Fallback to memory
      memoryCache.set(`${store}:${key}`, {
        key: `${store}:${key}`,
        data: value,
        timestamp: Date.now(),
        ttl,
      });
    }
  }

  async get(store: string, key: string): Promise<any | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;

          if (!entry) {
            resolve(null);
            return;
          }

          // Vérifier expiration
          if (Date.now() - entry.timestamp > entry.ttl) {
            // Expiré, supprimer
            this.delete(store, key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      // Fallback to memory
      const entry = memoryCache.get(`${store}:${key}`);
      if (entry && Date.now() - entry.timestamp <= entry.ttl) {
        return entry.data;
      }
      return null;
    }
  }

  async delete(store: string, key: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      objectStore.delete(key);
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      memoryCache.delete(`${store}:${key}`);
    }
  }

  async clear(store: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      objectStore.clear();
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      // Clear memory cache for this store
      for (const key of memoryCache.keys()) {
        if (key.startsWith(`${store}:`)) {
          memoryCache.delete(key);
        }
      }
    }
  }

  async cleanExpired(): Promise<void> {
    const now = Date.now();

    try {
      const db = await this.getDB();

      for (const store of Object.values(STORES)) {
        try {
          // Vérifier que le store existe avant de l'utiliser
          if (!db.objectStoreNames.contains(store)) {
            continue;
          }

          const transaction = db.transaction(store, 'readwrite');
          const objectStore = transaction.objectStore(store);
          const request = objectStore.openCursor();

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const entry = cursor.value as CacheEntry;
              if (now - entry.timestamp > entry.ttl) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        } catch (error) {
          // Ignorer silencieusement les erreurs de stores individuels
        }
      }
    } catch (error) {
      // Ignorer silencieusement - l'IndexedDB peut ne pas être disponible
    }

    // Clean memory cache
    for (const [key, entry] of memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        memoryCache.delete(key);
      }
    }
  }
}

const db = new IndexedDBHelper();

// Détection de connexion lente
function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    return conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.saveData);
  }
  return false;
}

/**
 * Service principal de cache de cartes
 */
export const cardCacheService = {
  /**
   * Précharger une carte unique
   */
  async preloadCard(
    cardId: string,
    options: PreloadOptions = {}
  ): Promise<void> {
    const {
      ttl = DEFAULT_TTL,
      storage = 'indexeddb',
      slowConnectionMode = isSlowConnection(),
    } = options;

    // Skip preload sur connexion lente
    if (slowConnectionMode) {
      return;
    }

    try {
      // Vérifier si déjà en cache
      const cached = await this.getCard(cardId);
      if (cached) {
        return;
      }

      // Fetch card data
      const { data: card, error } = await supabase
        .from('business_cards')
        .select('*, social_links(*), products(*)')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      if (!card) return;

      // Save to cache
      if (storage === 'indexeddb') {
        await db.set(STORES.CARDS, cardId, card, ttl);
      } else {
        memoryCache.set(cardId, {
          key: cardId,
          data: card,
          timestamp: Date.now(),
          ttl,
        });
      }

      // Précharger les images si demandé
      if (options.includeImages && (card as any).avatar) {
        await this.preloadImage((card as any).avatar, options);
      }
    } catch (error) {
      console.error('Error preloading card:', error);
    }
  },

  /**
   * Précharger plusieurs cartes en batch
   */
  async preloadCards(
    cardIds: string[],
    options: PreloadOptions = {}
  ): Promise<void> {
    const maxConcurrent = isSlowConnection() ? 1 : 3;

    // Process in chunks
    for (let i = 0; i < cardIds.length; i += maxConcurrent) {
      const chunk = cardIds.slice(i, i + maxConcurrent);
      await Promise.all(
        chunk.map(cardId => this.preloadCard(cardId, options))
      );
    }
  },

  /**
   * Précharger les cartes populaires (publiques)
   */
  async preloadPopularCards(limit: number = 5): Promise<void> {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('business_cards')
        .select('id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: cards, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;
      if (!cards || cards.length === 0) return;

      const cardIds = cards.map((c: any) => c.id);
      await this.preloadCards(cardIds, { includeImages: false });
    } catch (error) {
      // Silently fail - preloading is an optimization, not critical
      // Network errors (ERR_TUNNEL_CONNECTION_FAILED) are expected when offline
    }
  },

  /**
   * Précharger une image
   */
  async preloadImage(
    url: string,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = DEFAULT_TTL } = options;

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert to base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);

      const base64 = await base64Promise;
      await db.set(STORES.IMAGES, url, base64, ttl);
    } catch (error) {
      console.error('Error preloading image:', error);
    }
  },

  /**
   * Récupérer une carte du cache
   */
  async getCard(cardId: string): Promise<any | null> {
    // Try IndexedDB first
    const cached = await db.get(STORES.CARDS, cardId);
    if (cached) return cached;

    // Try memory cache
    const memEntry = memoryCache.get(cardId);
    if (memEntry && Date.now() - memEntry.timestamp <= memEntry.ttl) {
      return memEntry.data;
    }

    return null;
  },

  /**
   * Récupérer une image du cache
   */
  async getImage(url: string): Promise<string | null> {
    return db.get(STORES.IMAGES, url);
  },

  /**
   * Nettoyer le cache expiré
   */
  async cleanExpiredCache(): Promise<void> {
    await db.cleanExpired();
  },

  /**
   * Vider tout le cache
   */
  async clearAllCache(): Promise<void> {
    await Promise.all([
      db.clear(STORES.CARDS),
      db.clear(STORES.IMAGES),
      db.clear(STORES.USER_DATA),
    ]);
    memoryCache.clear();
  },

  /**
   * Vider le cache d'une carte spécifique
   */
  async clearCard(cardId: string): Promise<void> {
    await db.delete(STORES.CARDS, cardId);
    memoryCache.delete(cardId);
  },

  /**
   * Préchargement intelligent basé sur la route
   */
  async preloadForRoute(pathname: string): Promise<void> {
    if (pathname === '/' || pathname === '/dashboard') {
      // Précharger les cartes populaires
      await this.preloadPopularCards();
    } else if (pathname.startsWith('/card/')) {
      // Précharger la carte spécifique si l'ID est dans l'URL
      const cardId = pathname.split('/card/')[1];
      if (cardId) {
        await this.preloadCard(cardId, { includeImages: true });
      }
    }
  },
};

/**
 * Hook React pour utiliser le cache service
 */
export function useCardCache() {
  return {
    preloadCard: cardCacheService.preloadCard.bind(cardCacheService),
    preloadCards: cardCacheService.preloadCards.bind(cardCacheService),
    getCard: cardCacheService.getCard.bind(cardCacheService),
    clearCard: cardCacheService.clearCard.bind(cardCacheService),
    clearAllCache: cardCacheService.clearAllCache.bind(cardCacheService),
  };
}

export default cardCacheService;
