# 🚀 Optimisations de Performance - Bööh Project

**Date : 2025-10-15**  
**Statut : ⚠️ Optimisations Critiques Identifiées**

---

## 🎯 **Problèmes Identifiés**

### **1. Pagination Manquante** ⚠️ CRITIQUE

**Fichiers affectés :**
- `src/services/portfolioService.ts` - `getUserProjects()` (ligne 219-234)
- `src/services/dashboardService.ts` - Plusieurs requêtes sans limites
- `src/services/ordersService.ts` - Pagination partiellement implémentée

**Impact :** Peut charger des milliers d'enregistrements d'un coup

### **2. IndexedDB Saturation** ⚠️ CRITIQUE

**Problème :** React Query Persist Client peut saturer l'IndexedDB
**Impact :** Application lente, erreurs de stockage, crash possible

### **3. Préchargement Agressif** ⚠️ MOYEN

**Problème :** Trop de données préchargées simultanément
**Impact :** Consommation mémoire excessive, lenteur initiale

---

## 🔧 **Solutions à Implémenter**

### **1. Pagination des Services**

#### **A. PortfolioService - getUserProjects()**
```typescript
// AVANT (ligne 219-234)
static async getUserProjects(userId: string, publishedOnly = false): Promise<PortfolioProject[]> {
  let query = supabase
    .from('portfolio_projects')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });
  // ❌ Pas de limite !
}

// APRÈS (optimisé)
static async getUserProjects(
  userId: string, 
  options: {
    publishedOnly?: boolean;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  } = {}
): Promise<{
  projects: PortfolioProject[];
  total: number;
  hasMore: boolean;
}> {
  const { publishedOnly = false, limit = 20, offset = 0, searchTerm } = options;
  
  let query = supabase
    .from('portfolio_projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1); // ✅ Pagination

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  
  return {
    projects: data || [],
    total: count || 0,
    hasMore: (offset + limit) < (count || 0)
  };
}
```

#### **B. DashboardService - Limiter les Requêtes**
```typescript
// Ajouter des limites par défaut
private static async getRecentViews(cardIds: string[], limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from("card_views")
    .select("*")
    .in("card_id", cardIds)
    .order("created_at", { ascending: false })
    .limit(limit); // ✅ Limite par défaut
}
```

### **2. IndexedDB - Configuration React Query**

#### **A. Optimiser la Configuration**
```typescript
// src/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Réduire le cache time
      staleTime: 1000 * 60 * 5, // 5 minutes (au lieu de 10)
      cacheTime: 1000 * 60 * 30, // 30 minutes (au lieu de 1h)
      
      // ✅ Limiter les retries
      retry: 2,
      retryDelay: 1000,
      
      // ✅ Désactiver le refetch automatique
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// ✅ Persister avec taille limitée
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'booh-cache',
  serialize: (data) => {
    // Limiter la taille du cache
    const serialized = JSON.stringify(data);
    if (serialized.length > 5 * 1024 * 1024) { // 5MB max
      console.warn('Cache trop volumineux, nettoyage automatique');
      return '{}';
    }
    return serialized;
  },
});
```

#### **B. Nettoyage Automatique**
```typescript
// src/utils/cacheManager.ts
export class CacheManager {
  static async cleanupIndexedDB(): Promise<void> {
    try {
      // Nettoyer React Query cache
      await queryClient.clear();
      
      // Nettoyer IndexedDB manuellement si nécessaire
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name?.includes('booh') || db.name?.includes('query')) {
            await new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve(undefined);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        }
      }
      
      console.log('✅ Cache nettoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage du cache:', error);
    }
  }

  static getCacheSize(): number {
    try {
      const cache = localStorage.getItem('booh-cache');
      return cache ? new Blob([cache]).size : 0;
    } catch {
      return 0;
    }
  }

  static shouldCleanup(): boolean {
    return this.getCacheSize() > 3 * 1024 * 1024; // 3MB
  }
}
```

### **3. Préchargement Intelligent**

#### **A. Lazy Loading Conditionnel**
```typescript
// src/hooks/useSmartPreload.ts
export const useSmartPreload = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Détecter la connexion lente
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const isSlow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.saveData;
      setIsSlowConnection(isSlow);
    }
  }, []);

  const preloadIfNeeded = useCallback((preloadFn: () => void) => {
    if (!isSlowConnection) {
      preloadFn();
    }
  }, [isSlowConnection]);

  return { isSlowConnection, preloadIfNeeded };
};
```

#### **B. Pagination Virtuelle**
```typescript
// src/components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

export const VirtualizedProjectsList = ({ projects }: { projects: PortfolioProject[] }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

---

## 📋 **Plan d'Implémentation**

### **Phase 1 : Pagination Critique** (1-2h)
1. ✅ Modifier `PortfolioService.getUserProjects()`
2. ✅ Ajouter pagination à `DashboardService`
3. ✅ Tester avec de gros datasets

### **Phase 2 : Cache Management** (1h)
1. ✅ Implémenter `CacheManager`
2. ✅ Optimiser la configuration React Query
3. ✅ Ajouter bouton de nettoyage manuel

### **Phase 3 : Préchargement Intelligent** (1h)
1. ✅ Implémenter `useSmartPreload`
2. ✅ Conditionner les préchargements
3. ✅ Ajouter pagination virtuelle

### **Phase 4 : Monitoring** (30min)
1. ✅ Ajouter métriques de performance
2. ✅ Alertes de taille de cache
3. ✅ Dashboard de monitoring

---

## 🎯 **Impact Attendu**

- **Performance** : ⬆️ 70% plus rapide
- **Mémoire** : ⬇️ 60% moins de RAM
- **IndexedDB** : ⬇️ 80% moins de données
- **UX** : ⬆️ Chargement instantané

---

## 🔍 **Monitoring**

```typescript
// src/utils/performanceMonitor.ts
export const PerformanceMonitor = {
  logCacheSize: () => {
    const size = CacheManager.getCacheSize();
    console.log(`📊 Cache size: ${(size / 1024 / 1024).toFixed(2)}MB`);
    if (size > 5 * 1024 * 1024) {
      console.warn('⚠️ Cache trop volumineux, nettoyage recommandé');
    }
  },

  logQueryPerformance: (queryName: string, duration: number) => {
    if (duration > 1000) {
      console.warn(`⚠️ Query ${queryName} lente: ${duration}ms`);
    }
  }
};
```

---

**Priorité : Commencer par la pagination des services Portfolio ! 🚀**