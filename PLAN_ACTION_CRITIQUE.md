# 🚨 PLAN D'ACTION CRITIQUE - Bööh

**Date:** 2025-01-27  
**Priorité:** 🔴 CRITIQUE  
**Durée estimée:** 2-3 semaines

---

## 📋 ACTIONS IMMÉDIATES (Semaine 1)

### 1. 🔴 Pagination Services (3 jours)

**Fichiers à modifier:**
- [ ] `src/services/portfolioService.ts`
- [ ] `src/services/dashboardService.ts`
- [ ] `src/services/ordersService.ts`
- [ ] `src/services/crmService.ts`

**Tâches:**
```typescript
// Template à appliquer
static async getXXX(
  userId: string,
  options: {
    limit?: number;      // Default: 20
    offset?: number;     // Default: 0
    searchTerm?: string;
  } = {}
): Promise<{
  data: XXX[];
  total: number;
  hasMore: boolean;
}> {
  const { limit = 20, offset = 0, searchTerm } = options;
  
  let query = supabase
    .from('table_name')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
    
  if (searchTerm) {
    query = query.ilike('column', `%${searchTerm}%`);
  }
  
  const { data, count, error } = await query;
  if (error) throw error;
  
  return {
    data: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit
  };
}
```

**Impact:** ⬇️ 90% données chargées, ⬆️ 80% performance

---

### 2. 🔴 Refactoring Composants Monolithiques (4 jours)

#### 2.1 BusinessCardModern.tsx (2160 lignes)

**Structure cible:**
```
src/components/card/
  ├── BusinessCardModern.tsx (main, ~300 lignes)
  ├── BusinessCardHeader.tsx
  ├── BusinessCardContent.tsx
  ├── BusinessCardMedia.tsx
  ├── BusinessCardActions.tsx
  ├── BusinessCardFooter.tsx
  └── BusinessCardSkeleton.tsx
```

**Tâches:**
- [ ] Extraire header (logo, nom, titre)
- [ ] Extraire contenu (sections, informations)
- [ ] Extraire média (images, vidéos, carousel)
- [ ] Extraire actions (boutons, liens)
- [ ] Extraire footer (social, copyright)
- [ ] Créer skeleton pour loading state

#### 2.2 ModernCardForm.tsx (2082 lignes)

**Structure cible:**
```
src/components/forms/
  ├── ModernCardForm.tsx (main, ~400 lignes)
  ├── CardFormBasicInfo.tsx
  ├── CardFormMedia.tsx
  ├── CardFormSocial.tsx
  ├── CardFormAppearance.tsx
  └── CardFormPreview.tsx
```

**Tâches:**
- [ ] Extraire section informations de base
- [ ] Extraire section média
- [ ] Extraire section réseaux sociaux
- [ ] Extraire section apparence/thème
- [ ] Extraire preview en temps réel

#### 2.3 ContactCRMDetail.tsx (1694 lignes)

**Structure cible:**
```
src/components/crm/
  ├── ContactCRMDetail.tsx (main, ~300 lignes)
  ├── ContactHeader.tsx (déjà créé ✅)
  ├── ContactStats.tsx (déjà créé ✅)
  ├── ContactActions.tsx (déjà créé ✅)
  ├── ContactTimeline.tsx
  └── ContactNotes.tsx
```

**Tâches:**
- [ ] Extraire timeline des interactions
- [ ] Extraire section notes
- [ ] Vérifier que Header/Stats/Actions sont bien utilisés

**Impact:** ⬆️ 50% maintenabilité, ⬆️ 20% performance

---

### 3. 🔴 Unification Services Cache (2 jours)

**Problème actuel:**
- `cardCacheService.ts`
- `preloadCleanupService.ts`
- `CacheManager.ts`
- `cardPreloadService.ts`

**Solution:**
```typescript
// src/services/cache/unifiedCacheService.ts
export class UnifiedCacheService {
  // Card caching
  static async cacheCard(cardId: string, data: any): Promise<void>
  static async getCachedCard(cardId: string): Promise<any | null>
  
  // Preload management
  static async preloadCard(cardId: string): Promise<void>
  static async cleanupPreloads(): Promise<void>
  
  // Cache management
  static async cleanup(): Promise<void>
  static async getCacheSize(): Promise<number>
  static async monitorSize(): Promise<void>
}
```

**Tâches:**
- [ ] Créer `unifiedCacheService.ts`
- [ ] Migrer logique de `cardCacheService`
- [ ] Migrer logique de `preloadCleanupService`
- [ ] Migrer logique de `CacheManager`
- [ ] Migrer logique de `cardPreloadService`
- [ ] Mettre à jour tous les imports
- [ ] Supprimer anciens services

**Impact:** ⬇️ 75% duplication, ⬆️ 40% maintenabilité

---

## 📋 ACTIONS HAUTE PRIORITÉ (Semaine 2)

### 4. 🟡 Bundle Size Optimization (3 jours)

#### 4.1 Dynamic Imports

**Fichiers à modifier:**
- [ ] `src/pages/MapView.tsx` - Lazy load Mapbox
- [ ] `src/components/dashboard/DashboardCharts.tsx` - Lazy load Recharts
- [ ] `src/components/invoice/InvoicePDF.tsx` - Lazy load jsPDF

**Exemple:**
```typescript
// ❌ AVANT
import { Map } from 'react-map-gl';
import { LineChart } from 'recharts';
import jsPDF from 'jspdf';

// ✅ APRÈS
const Map = lazy(() => import('react-map-gl').then(m => ({ default: m.Map })));
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const jsPDF = lazy(() => import('jspdf'));
```

#### 4.2 Tree-shaking

**Vérifier:**
- [ ] Tous les imports sont spécifiques (pas de `import *`)
- [ ] Pas d'imports inutilisés
- [ ] Utiliser `sideEffects: false` dans package.json

#### 4.3 Alternative jsPDF

**Options:**
1. Génération PDF côté serveur (Supabase Edge Function)
2. Utiliser `pdfkit` (plus léger)
3. Utiliser `react-pdf` (si compatible)

**Impact:** ⬇️ 30-40% bundle size

---

### 5. 🟡 Requêtes N+1 (2 jours)

**Fichiers à auditer:**
- [ ] `src/pages/Admin.tsx`
- [ ] `src/services/ordersService.ts`
- [ ] `src/services/dashboardService.ts`
- [ ] `src/services/crmService.ts`

**Pattern à chercher:**
```typescript
// ❌ Pattern N+1
await Promise.all(
  items.map(async (item) => {
    const { data } = await supabase
      .from('related_table')
      .select('*')
      .eq('item_id', item.id)
      .single();
    return { ...item, related: data };
  })
);

// ✅ Solution avec JOIN
const { data } = await supabase
  .from('items')
  .select(`
    *,
    related_table (*)
  `)
  .eq('user_id', userId);
```

**Impact:** ⬇️ 50-70% requêtes DB

---

### 6. 🟡 Memoization (2 jours)

**Composants à optimiser:**
- [ ] `src/pages/Dashboard.tsx`
- [ ] `src/pages/Admin.tsx`
- [ ] `src/components/dashboard/DashboardCharts.tsx`
- [ ] `src/components/crm/ContactCRMDetail.tsx`

**Pattern à appliquer:**
```typescript
// ✅ useMemo pour calculs coûteux
const processedData = useMemo(() => {
  return rawData.map(item => ({
    ...item,
    formatted: format(item.date),
    calculated: calculate(item.value)
  }));
}, [rawData]);

// ✅ useCallback pour fonctions passées en props
const handleClick = useCallback((id: string) => {
  // handler logic
}, [dependencies]);

// ✅ React.memo pour composants purs
export const ExpensiveComponent = React.memo(({ data }) => {
  // component logic
});
```

**Impact:** ⬇️ 30-40% re-renders

---

## 📊 MÉTRIQUES DE SUCCÈS

### Avant vs Après

| Métrique | Avant | Objectif | Impact |
|----------|-------|----------|--------|
| Bundle JS | 4.96 MB | < 3 MB | ⬇️ 40% |
| Composant max | 2160 lignes | < 500 lignes | ⬇️ 77% |
| Requêtes/page | 10-20 | < 5 | ⬇️ 75% |
| Re-renders | 100% | < 60% | ⬇️ 40% |
| Services cache | 4 | 1 | ⬇️ 75% |

---

## ✅ CHECKLIST VALIDATION

### Semaine 1
- [ ] Pagination implémentée dans tous les services
- [ ] BusinessCardModern.tsx refactoré (< 500 lignes)
- [ ] ModernCardForm.tsx refactoré (< 500 lignes)
- [ ] ContactCRMDetail.tsx refactoré (< 500 lignes)
- [ ] UnifiedCacheService créé et migré
- [ ] Anciens services cache supprimés

### Semaine 2
- [ ] Dynamic imports pour Maps/Charts/PDF
- [ ] Tree-shaking vérifié et optimisé
- [ ] Toutes les requêtes N+1 corrigées
- [ ] Memoization ajoutée dans composants critiques
- [ ] Bundle size < 3 MB
- [ ] Tests passent tous

---

## 🎯 PROCHAINES ÉTAPES

1. **Créer tickets GitHub/Linear** pour chaque action
2. **Assigner développeurs** selon expertise
3. **Définir milestones** avec dates
4. **Mettre en place monitoring** pour mesurer impact
5. **Code review** systématique avant merge

---

**Note:** Ce plan est prioritaire et doit être exécuté dans les 2-3 prochaines semaines pour améliorer significativement les performances et la maintenabilité de l'application.
