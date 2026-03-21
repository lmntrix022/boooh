import { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

const DB_NAME = 'BOOH_CACHE_DB'
const STORE_NAME = 'queryCache'
const DB_VERSION = 1

// Fonction pour obtenir la DB IndexedDB
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// Créer un persister personnalisé pour IndexedDB
export function createIndexedDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        const db = await getDB()
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        store.put(client, 'queryClient')

        return new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
        })
      } catch (error) {
        // Error persisting to IndexedDB
        // Fallback silencieux sans erreur
      }
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const db = await getDB()
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get('queryClient')

        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
      } catch (error) {
        // Error restoring from IndexedDB
        return undefined
      }
    },

    removeClient: async () => {
      try {
        const db = await getDB()
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        store.delete('queryClient')

        return new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
        })
      } catch (error) {
        // Error removing from IndexedDB
      }
    }
  }
}

// Export du persister
export const indexedDBPersister = createIndexedDBPersister()
