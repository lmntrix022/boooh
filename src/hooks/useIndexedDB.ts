import { useState, useEffect, useCallback } from 'react';

interface IndexedDBConfig {
  dbName: string;
  version: number;
  storeName: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Hook pour utiliser IndexedDB comme cache persistant
 * Parfait pour stocker des données de cartes, images, etc.
 */
export const useIndexedDB = <T = any>(config: IndexedDBConfig) => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialiser la base de données
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(config.dbName, config.version);

        request.onerror = () => {
          setError(new Error('Erreur lors de l\'ouverture de IndexedDB'));
        };

        request.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          setDb(database);
          setIsReady(true);
        };

        request.onupgradeneeded = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;

          // Créer le store s'il n'existe pas
          if (!database.objectStoreNames.contains(config.storeName)) {
            database.createObjectStore(config.storeName, { keyPath: 'id' });
          }
        };
      } catch (err) {
        setError(err as Error);
      }
    };

    initDB();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, [config.dbName, config.version, config.storeName]);

  /**
   * Sauvegarder des données dans IndexedDB
   */
  const setItem = useCallback(
    async (key: string, value: T, ttl?: number): Promise<void> => {
      if (!db || !isReady) {
        throw new Error('IndexedDB n\'est pas prêt');
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([config.storeName], 'readwrite');
        const store = transaction.objectStore(config.storeName);

        const entry: CacheEntry<T> & { id: string } = {
          id: key,
          data: value,
          timestamp: Date.now(),
          expiresAt: ttl ? Date.now() + ttl : undefined,
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    [db, isReady, config.storeName]
  );

  /**
   * Récupérer des données depuis IndexedDB
   */
  const getItem = useCallback(
    async (key: string): Promise<T | null> => {
      if (!db || !isReady) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([config.storeName], 'readonly');
        const store = transaction.objectStore(config.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as (CacheEntry<T> & { id: string }) | undefined;

          if (!entry) {
            resolve(null);
            return;
          }

          // Vérifier l'expiration
          if (entry.expiresAt && entry.expiresAt < Date.now()) {
            // Supprimer l'entrée expirée
            deleteItem(key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => reject(request.error);
      });
    },
    [db, isReady, config.storeName]
  );

  /**
   * Supprimer une entrée
   */
  const deleteItem = useCallback(
    async (key: string): Promise<void> => {
      if (!db || !isReady) {
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([config.storeName], 'readwrite');
        const store = transaction.objectStore(config.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    [db, isReady, config.storeName]
  );

  /**
   * Vider tout le cache
   */
  const clear = useCallback(async (): Promise<void> => {
    if (!db || !isReady) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([config.storeName], 'readwrite');
      const store = transaction.objectStore(config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, [db, isReady, config.storeName]);

  /**
   * Obtenir toutes les clés
   */
  const keys = useCallback(async (): Promise<string[]> => {
    if (!db || !isReady) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([config.storeName], 'readonly');
      const store = transaction.objectStore(config.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }, [db, isReady, config.storeName]);

  /**
   * Nettoyer les entrées expirées
   */
  const cleanExpired = useCallback(async (): Promise<void> => {
    if (!db || !isReady) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([config.storeName], 'readwrite');
      const store = transaction.objectStore(config.storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const entry = cursor.value as CacheEntry<T> & { id: string };

          if (entry.expiresAt && entry.expiresAt < Date.now()) {
            cursor.delete();
          }

          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, isReady, config.storeName]);

  return {
    isReady,
    error,
    setItem,
    getItem,
    deleteItem,
    clear,
    keys,
    cleanExpired,
  };
};

/**
 * Hook spécialisé pour le cache des cartes de visite
 */
export const useCardCache = () => {
  return useIndexedDB({
    dbName: 'booh-card-cache',
    version: 1,
    storeName: 'cards',
  });
};

/**
 * Hook spécialisé pour le cache des images
 */
export const useImageCache = () => {
  return useIndexedDB<string>({
    dbName: 'booh-image-cache',
    version: 1,
    storeName: 'images',
  });
};

/**
 * Hook spécialisé pour le cache des données utilisateur
 */
export const useUserDataCache = () => {
  return useIndexedDB({
    dbName: 'booh-user-cache',
    version: 1,
    storeName: 'userData',
  });
};
