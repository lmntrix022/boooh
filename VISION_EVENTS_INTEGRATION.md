# Vision : Intégration complète des Événements dans l'écosystème

**Date**: 2025-12-18  
**Objectif**: Intégrer les événements dans la carte interactive (/map), les cartes utilisateur, et la boutique

---

## 🎯 Vision globale

Les événements doivent être **intégrés naturellement** dans l'écosystème existant :

1. ✅ **Sur la carte (/map)** : Marqueurs avec popups cohérents
2. ✅ **Dans les cartes utilisateur** : Section dédiée dans la boutique
3. ✅ **Route boutique événements** : `/card/:id/events` pour voir tous les événements + achat de tickets

---

## 📋 Analyse de l'existant

### 1. Carte Interactive (/map)

**Fichiers clés :**
- `src/pages/MapView.tsx` → Utilise `MarketplaceMap`
- `src/components/map/MarketplaceMap.tsx` → Gère les markers (products, services, business)
- `src/components/map/SmartPin.tsx` → Rendu des markers
- `src/components/map/QuickPreview.tsx` → Popups au hover
- `src/components/map/types.ts` → Types pour MapProduct, MapService, MapBusiness

**Comment ça marche actuellement :**
```typescript
// MarketplaceMap charge les produits/services
const { products, services } = loadNearbyItems();

// Crée des markers pour chaque item
markers = [
  ...products.map(p => ({ type: 'product', data: p })),
  ...services.map(s => ({ type: 'service', data: s }))
];

// SmartPin affiche le marker avec un popup
<SmartPin marker={marker} onClick={...} />
```

**Ce qu'il faut ajouter :**
- Charger les événements proches (avec géolocalisation)
- Créer des markers de type `'event'`
- Créer `EventPreview` component (comme ProductPreview/ServicePreview)
- Ajouter `MapEvent` type dans `types.ts`

### 2. Cartes Utilisateur (PublicCardView)

**Fichiers clés :**
- `src/pages/PublicCardView.tsx` → Page principale de la carte publique
- `src/components/BusinessCardModern.tsx` → Carte avec slider Liens/Boutique
- `src/components/ProductDisplaySection.tsx` → Affiche produits dans la boutique
- `src/components/PublicCardActions.tsx` → Actions et liens vers marketplace/portfolio

**Structure actuelle :**
```typescript
// BusinessCardModern a un slider
const [activeSlider, setActiveSlider] = useState<'liens' | 'boutique'>('liens');

// Dans la boutique, on affiche ProductDisplaySection
{activeSlider === 'boutique' && (
  <ProductDisplaySection
    products={products}
    digitalProducts={digitalProducts}
    // ← Il faut ajouter events ici
  />
)}
```

**Ce qu'il faut ajouter :**
- Charger les événements de la carte dans PublicCardView
- Créer `EventDisplaySection` component (similaire à ProductDisplaySection)
- Afficher un aperçu des événements dans la boutique
- Lien vers `/card/:id/events` pour voir tous les événements

### 3. Route Boutique Événements

**Route à créer :** `/card/:id/events`

**Fichiers à créer :**
- `src/pages/cards/[id]/events/index.tsx` → Liste tous les événements d'une carte

**Fonctionnalités :**
- Liste tous les événements de l'utilisateur (par card_id)
- Filtres (upcoming, past, live)
- Achat de tickets directement depuis la liste
- Design cohérent avec le reste de l'app

---

## 🚀 Plan d'action détaillé

### Phase 1 : Événements sur la carte (/map)

#### 1.1 Ajouter les types
**Fichier :** `src/components/map/types.ts`

```typescript
export interface MapEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'physical' | 'online' | 'hybrid';
  start_date: string;
  end_date: string;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  cover_image_url?: string;
  is_free: boolean;
  tickets_config: TicketTier[];
  current_attendees: number;
  max_capacity?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  has_live_stream?: boolean;
  live_stream_status?: 'scheduled' | 'live' | 'ended';
  card_id?: string;
  user_id: string;
  // Distance calculée (si géolocalisé)
  distance?: number;
}
```

#### 1.2 Créer EventPreview component
**Fichier :** `src/components/map/EventPreview.tsx`

**Fonctionnalités :**
- Affiche les infos essentielles de l'événement
- Boutons : "Voir détails", "Suivre le live" (si live), "Réserver"
- Design cohérent avec ProductPreview/ServicePreview
- Lien vers `/events/:id` ou `/card/:cardId/events/:eventId`

#### 1.3 Modifier MarketplaceMap
**Fichier :** `src/components/map/MarketplaceMap.tsx`

**Modifications :**
- Charger les événements avec géolocalisation
- Créer des markers de type `'event'`
- Ajouter dans le switch case pour le rendu
- Intégrer EventPreview dans QuickPreview

#### 1.4 Service pour charger les événements
**Fichier :** `src/services/eventService.ts` (déjà existe, ajouter fonction)

```typescript
export async function getEventsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Event[]> {
  // Utiliser la fonction existante getEvents avec filtre location
}
```

---

### Phase 2 : Événements dans les cartes utilisateur

#### 2.1 Charger les événements dans PublicCardView
**Fichier :** `src/pages/PublicCardView.tsx`

**Modifications :**
- Ajouter query pour charger les événements de la carte
- Passer les événements à BusinessCardModern

```typescript
const { data: events = [] } = useQuery({
  queryKey: ['card-events', card?.id],
  queryFn: async () => {
    if (!card?.id) return [];
    return await getCardEvents(card.id); // À créer
  },
  enabled: !!card?.id,
});
```

#### 2.2 Créer EventDisplaySection component
**Fichier :** `src/components/EventDisplaySection.tsx`

**Fonctionnalités :**
- Affiche les événements à venir (limit 3-4)
- Card pour chaque événement avec :
  - Image de couverture
  - Titre, date, type (physical/online/hybrid)
  - Badge "Free" ou prix
  - Bouton "Voir détails" ou "Réserver"
- Lien "Voir tous les événements" vers `/card/:id/events`
- Design cohérent avec ProductDisplaySection

#### 2.3 Modifier BusinessCardModern
**Fichier :** `src/components/BusinessCardModern.tsx`

**Modifications :**
- Ajouter `events` prop
- Passer events à ProductDisplaySection ou créer EventDisplaySection séparé
- Afficher dans la section boutique

#### 2.4 Modifier ProductDisplaySection
**Fichier :** `src/components/ProductDisplaySection.tsx`

**Option A :** Ajouter section événements dans ce composant  
**Option B :** Créer composant séparé EventDisplaySection et l'afficher après

**Recommandation : Option B** (meilleure séparation des responsabilités)

---

### Phase 3 : Route boutique événements

#### 3.1 Créer la page EventsListByCard
**Fichier :** `src/pages/cards/[id]/events/index.tsx`

**Fonctionnalités :**
- Header avec infos de la carte (nom, avatar)
- Liste des événements avec filtres :
  - Tous / À venir / Passés / En direct
- Cards d'événements avec :
  - Image, titre, dates, type
  - Prix/Badge gratuit
  - Participants actuels
  - Actions : Voir détails, Réserver ticket
- Design cohérent avec EventsList mais adapté au contexte "boutique"

#### 3.2 Service pour charger les événements d'une carte
**Fichier :** `src/services/eventService.ts`

```typescript
export async function getCardEvents(cardId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('card_id', cardId)
    .eq('status', 'published')
    .order('start_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}
```

#### 3.3 Ajouter route dans App.tsx
**Fichier :** `src/App.tsx`

```typescript
<Route path="/card/:id/events" element={<EventsListByCard />} />
```

#### 3.4 Lien depuis PublicCardActions
**Fichier :** `src/components/PublicCardActions.tsx`

Ajouter un bouton/lien vers `/card/:id/events` si l'utilisateur a des événements

---

## 📐 Design & UX

### Cohérence visuelle

Tous les composants doivent suivre le design system :
- ✅ Glassmorphism : `bg-white/90 backdrop-blur-2xl`
- ✅ Bordures : `border-2 border-gray-200/60 shadow-2xl`
- ✅ Arrondi : `rounded-3xl`
- ✅ Animations : Framer Motion pour transitions
- ✅ Typographie : Gradients pour titres

### Popup sur la carte

**EventPreview** doit avoir :
- Image de couverture (ou placeholder)
- Titre + date/heure
- Type (badge physical/online/hybrid)
- Prix ou badge "Gratuit"
- Boutons d'action :
  - "Voir détails" → `/events/:id`
  - "Suivre le live" (si live) → `/events/:id/live`
  - "Réserver" → Ouverture TicketingWidget inline

### Section dans la boutique

**EventDisplaySection** doit :
- S'intégrer naturellement avec ProductDisplaySection
- Afficher max 3-4 événements à venir
- Design card similaire aux produits
- Badge "Live" si événement en cours
- Lien clair vers la page complète

### Page boutique événements

**EventsListByCard** doit :
- Header avec avatar/nom de l'utilisateur
- Filtres clairs (tabs ou buttons)
- Cards événements cohérentes avec le reste
- Intégration TicketingWidget pour achat direct
- Design responsive

---

## 🔧 Détails techniques

### Géolocalisation

Pour les événements sur la carte :
- Utiliser `latitude` et `longitude` de l'événement
- Calculer la distance depuis la position de l'utilisateur
- Filtrer par rayon (par défaut 50km)
- Afficher seulement les événements `published` et à venir

### Performance

- Utiliser React Query pour le cache
- Lazy loading des images
- Pagination si beaucoup d'événements
- Memoization des composants (React.memo)

### Routes

```
/map                           → Carte avec événements
/card/:id                      → Carte publique (avec section événements)
/card/:id/events               → Tous les événements de la carte
/events/:id                    → Détails d'un événement (existant)
/events/:id/live               → Streaming live (existant)
```

---

## 📝 Checklist d'implémentation

### Phase 1 : Carte (/map)
- [ ] Ajouter `MapEvent` dans `types.ts`
- [ ] Créer `EventPreview.tsx`
- [ ] Modifier `MarketplaceMap.tsx` pour charger les événements
- [ ] Ajouter markers événements sur la carte
- [ ] Intégrer EventPreview dans QuickPreview
- [ ] Tester la géolocalisation

### Phase 2 : Cartes utilisateur
- [ ] Créer service `getCardEvents()` dans `eventService.ts`
- [ ] Ajouter query dans `PublicCardView.tsx`
- [ ] Créer `EventDisplaySection.tsx`
- [ ] Modifier `BusinessCardModern.tsx` pour afficher les événements
- [ ] Tester l'affichage dans la boutique

### Phase 3 : Route boutique
- [ ] Créer `pages/cards/[id]/events/index.tsx`
- [ ] Implémenter filtres (upcoming/past/live)
- [ ] Ajouter route dans `App.tsx`
- [ ] Lien depuis `PublicCardActions.tsx`
- [ ] Tester l'achat de tickets

### Tests & Polish
- [ ] Tester tous les parcours utilisateur
- [ ] Vérifier la cohérence du design
- [ ] Optimiser les performances
- [ ] Ajouter loading states
- [ ] Gérer les erreurs (pas d'événements, etc.)

---

## 🎨 Exemples de code

### EventPreview.tsx (structure)

```typescript
interface EventPreviewProps {
  event: MapEvent;
  onViewDetails: () => void;
  onFollowLive?: () => void;
  onReserve?: () => void;
}

export const EventPreview: React.FC<EventPreviewProps> = ({
  event,
  onViewDetails,
  onFollowLive,
  onReserve,
}) => {
  return (
    <div className="w-80 bg-white/90 backdrop-blur-2xl rounded-2xl border-2 border-gray-200/60 shadow-2xl overflow-hidden">
      {/* Image */}
      {/* Infos */}
      {/* Actions */}
    </div>
  );
};
```

### EventDisplaySection.tsx (structure)

```typescript
interface EventDisplaySectionProps {
  events: Event[];
  cardId: string;
  onEventClick?: (eventId: string) => void;
}

export const EventDisplaySection: React.FC<EventDisplaySectionProps> = ({
  events,
  cardId,
  onEventClick,
}) => {
  const upcomingEvents = events.filter(/* ... */).slice(0, 4);
  
  return (
    <div className="space-y-4">
      {/* Titre */}
      {/* Liste des événements */}
      {/* Lien vers tous les événements */}
    </div>
  );
};
```

---

## 💡 Avantages de cette approche

1. **Cohérence** : Les événements suivent les mêmes patterns que produits/services
2. **Découvrabilité** : Les événements sont visibles sur la carte ET dans les cartes
3. **Conversion** : Achat direct depuis la carte ou la boutique
4. **UX fluide** : Navigation naturelle entre carte → carte utilisateur → événements
5. **Performance** : Réutilisation des composants et patterns existants

---

## 🚦 Priorités

**Haute priorité :**
1. EventPreview pour la carte
2. Chargement des événements sur la carte
3. EventDisplaySection dans les cartes

**Moyenne priorité :**
4. Route `/card/:id/events`
5. Filtres et recherche

**Basse priorité :**
6. Optimisations avancées
7. Analytics spécifiques

---

**Cette vision transforme les événements en citoyens de première classe de l'écosystème, au même titre que les produits et services !** 🎉
