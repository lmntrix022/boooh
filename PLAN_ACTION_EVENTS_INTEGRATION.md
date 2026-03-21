# Plan d'Action : Intégration Événements dans l'Écosystème

**Date**: 2025-12-18  
**Priorité**: Haute  
**Estimation totale**: 12-16 heures

---

## 🎯 Objectif

Intégrer les événements dans :
1. ✅ Carte interactive (/map) avec popups
2. ✅ Cartes utilisateur (section boutique)
3. ✅ Route dédiée `/card/:id/events` pour tous les événements

---

## 📊 Analyse de la vision

### ✅ Points forts
- **Cohérence parfaite** : Suit les mêmes patterns que produits/services
- **Découvrabilité maximale** : Carte + Cartes + Boutique
- **UX fluide** : Navigation naturelle entre tous les points d'entrée
- **Conversion optimisée** : Achat direct depuis n'importe où

### 💡 Améliorations suggérées

1. **Badge "LIVE" visible partout** : Si événement en direct, badge très visible
2. **Filtre "Événements" sur la carte** : Bouton toggle pour afficher/masquer les événements
3. **Statistiques dans la carte** : Afficher nombre d'événements à venir dans le header de la carte utilisateur
4. **Notifications push** : Si utilisateur a réservé, notification quand l'événement devient live

---

## 🚀 Plan d'implémentation (par ordre de priorité)

### Phase 1 : Fondations (2-3h)

#### 1.1 Types et interfaces
**Fichiers :**
- `src/components/map/types.ts`

**Actions :**
```typescript
// Ajouter dans PinType
export type PinType = 'business' | 'product' | 'service' | 'event' | 'cluster';

// Ajouter MapEvent interface
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
  status: 'published';
  has_live_stream?: boolean;
  live_stream_status?: 'scheduled' | 'live' | 'ended';
  card_id?: string;
  user_id: string;
  business_name?: string; // Nom du propriétaire
  business_avatar?: string; // Avatar du propriétaire
  distance?: number; // Distance depuis user (calculé)
}
```

#### 1.2 Service pour charger les événements
**Fichier :** `src/services/eventService.ts`

**Ajouter :**
```typescript
/**
 * Get events near a location (for map display)
 */
export async function getEventsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Event[]> {
  // Utiliser getEvents avec filtre location
  const filters: EventFilters = {
    location: { latitude, longitude, radius: radiusKm },
    status: ['published'],
  };
  
  const result = await getEvents(filters, { field: 'start_date', direction: 'asc' }, 1, 100);
  return result.events;
}

/**
 * Get all events for a card
 */
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

---

### Phase 2 : Carte Interactive (4-5h)

#### 2.1 Créer EventPreview component
**Fichier :** `src/components/map/EventPreview.tsx`

**Design :**
- Image de couverture (ou placeholder avec gradient)
- Titre + date/heure formatée
- Badge type (physical/online/hybrid)
- Prix ou badge "Gratuit"
- Badge "LIVE" si en direct (rouge pulsant)
- Participants actuels / Capacité max
- Boutons d'action :
  - "Voir détails" → `/events/:id`
  - "Suivre le live" (si live) → `/events/:id/live`
  - "Réserver" → Ouverture inline ou `/events/:id`

**Cohérence :**
- Même structure que ProductPreview/ServicePreview
- Glassmorphism : `bg-white/90 backdrop-blur-2xl`
- Bordures : `border-2 border-gray-200/60 shadow-2xl`
- Animations Framer Motion

#### 2.2 Modifier MarketplaceMap
**Fichier :** `src/components/map/MarketplaceMap.tsx`

**Modifications :**
1. Ajouter query pour charger les événements :
```typescript
const { data: events = [] } = useQuery({
  queryKey: ['map-events', center.lat, center.lng, zoom],
  queryFn: () => getEventsNearLocation(center.lat, center.lng, 50),
  enabled: center.lat && center.lng,
  staleTime: 60000, // 1 minute
});
```

2. Transformer en markers :
```typescript
const eventMarkers = events
  .filter(e => e.latitude && e.longitude)
  .map(event => ({
    id: `event-${event.id}`,
    type: 'event' as const,
    position: { lat: event.latitude!, lng: event.longitude! },
    data: event,
  }));
```

3. Ajouter dans le rendu des markers :
```typescript
{...eventMarkers.map(marker => (
  <SmartPin
    key={marker.id}
    marker={marker}
    // ...
  />
))}
```

#### 2.3 Modifier SmartPin
**Fichier :** `src/components/map/SmartPin.tsx`

**Modifications :**
- Ajouter icône spécifique pour type 'event' (Calendar icon)
- Gérer le style du marker pour événements
- Différencier visuellement les événements live (badge rouge)

#### 2.4 Modifier QuickPreview
**Fichier :** `src/components/map/QuickPreview.tsx`

**Modifications :**
```typescript
{marker.type === 'event' && (
  <EventPreview 
    event={marker.data as MapEvent} 
    onViewDetails={onViewDetails} 
  />
)}
```

#### 2.5 Ajouter filtre "Événements" dans les filtres
**Fichier :** `src/components/map/MarketplaceMap.tsx`

Ajouter toggle pour afficher/masquer les événements dans les filtres

---

### Phase 3 : Cartes Utilisateur (3-4h)

#### 3.1 Charger les événements dans PublicCardView
**Fichier :** `src/pages/PublicCardView.tsx`

**Ajouter :**
```typescript
// Charger les événements de la carte
const { data: cardEvents = [] } = useQuery({
  queryKey: ['card-events', card?.id],
  queryFn: async () => {
    if (!card?.id) return [];
    return await getCardEvents(card.id);
  },
  enabled: !!card?.id,
  staleTime: 5 * 60 * 1000,
});
```

**Passer à BusinessCardModern :**
```typescript
<BusinessCardModern
  // ... autres props
  events={cardEvents}
/>
```

#### 3.2 Créer EventDisplaySection component
**Fichier :** `src/components/EventDisplaySection.tsx`

**Fonctionnalités :**
- Affiche max 3-4 événements à venir
- Cards avec :
  - Image de couverture (lazy loading)
  - Titre + date formatée
  - Type (badge)
  - Prix ou "Gratuit"
  - Badge "LIVE" si en direct
  - Bouton "Voir détails" ou "Réserver"
- Lien "Voir tous les événements" vers `/card/:id/events`
- Design cohérent avec ProductDisplaySection
- Animation d'entrée

#### 3.3 Modifier BusinessCardModern
**Fichier :** `src/components/BusinessCardModern.tsx`

**Modifications :**
1. Ajouter `events` prop :
```typescript
interface BusinessCardProps {
  // ... autres props
  events?: Event[];
}
```

2. Afficher EventDisplaySection dans la boutique :
```typescript
{activeSlider === 'boutique' && (
  <motion.div>
    {/* EventDisplaySection si événements existent */}
    {events && events.length > 0 && (
      <EventDisplaySection
        events={events}
        cardId={cardId}
        onEventClick={(eventId) => {
          // Navigate ou ouvrir modal
        }}
      />
    )}
    
    {/* ProductDisplaySection existant */}
    <ProductDisplaySection
      products={products}
      digitalProducts={digitalProducts}
      // ...
    />
  </motion.div>
)}
```

---

### Phase 4 : Route Boutique Événements (3-4h)

#### 4.1 Créer la page EventsListByCard
**Fichier :** `src/pages/cards/[id]/events/index.tsx`

**Fonctionnalités :**
- Header avec infos de la carte (avatar, nom, retour vers carte)
- Tabs/Filtres : Tous / À venir / Passés / En direct
- Liste des événements :
  - Cards événements (design cohérent avec EventsList)
  - Informations essentielles
  - Actions : Voir détails, Réserver ticket
- Intégration TicketingWidget pour achat direct
- Design responsive
- Loading states et empty states

**Design :**
- Cohérent avec EventsList mais adapté au contexte "boutique"
- Header avec avatar de l'utilisateur
- Breadcrumb : Carte > Événements

#### 4.2 Ajouter route dans App.tsx
**Fichier :** `src/App.tsx`

```typescript
<Route path="/card/:id/events" element={<EventsListByCard />} />
```

#### 4.3 Lien depuis PublicCardActions
**Fichier :** `src/components/PublicCardActions.tsx`

**Ajouter bouton si événements existent :**
```typescript
{events && events.length > 0 && (
  <motion.a
    href={`/card/${cardId}/events`}
    className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <Calendar className="h-5 w-5" />
    <span className="font-medium">Mes Événements</span>
    <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs">
      {events.length}
    </span>
  </motion.a>
)}
```

#### 4.4 Lien depuis EventDisplaySection
**Fichier :** `src/components/EventDisplaySection.tsx`

Déjà prévu dans le composant (bouton "Voir tous les événements")

---

## 🎨 Détails de design

### EventPreview (Popup carte)

```typescript
// Structure
<div className="w-80 bg-white/90 backdrop-blur-2xl rounded-2xl border-2 border-gray-200/60 shadow-2xl overflow-hidden">
  {/* Image couverture */}
  <div className="relative h-40 bg-gradient-to-br from-purple-500 to-blue-500">
    {event.cover_image_url && (
      <img src={event.cover_image_url} className="w-full h-full object-cover" />
    )}
    {/* Badge LIVE si en direct */}
    {event.live_stream_status === 'live' && (
      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
        🔴 LIVE
      </div>
    )}
  </div>
  
  {/* Contenu */}
  <div className="p-4">
    <h3 className="font-bold text-lg mb-2">{event.title}</h3>
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
      <Calendar className="h-4 w-4" />
      {format(new Date(event.start_date), 'PPp')}
    </div>
    {/* Type badge */}
    {/* Prix */}
    {/* Participants */}
    {/* Actions */}
  </div>
</div>
```

### EventDisplaySection (Boutique carte)

```typescript
// Cards événements similaires à ProductDisplaySection
<div className="grid grid-cols-1 gap-4">
  {events.slice(0, 4).map(event => (
    <Card className="overflow-hidden">
      {/* Image + Badge LIVE */}
      {/* Infos */}
      {/* Bouton action */}
    </Card>
  ))}
</div>

{/* Lien vers tous les événements */}
<motion.button onClick={() => navigate(`/card/${cardId}/events`)}>
  Voir tous les événements ({events.length})
</motion.button>
```

---

## 📝 Checklist complète

### Phase 1 : Fondations
- [ ] Ajouter `MapEvent` dans `types.ts`
- [ ] Ajouter `'event'` dans `PinType`
- [ ] Créer `getEventsNearLocation()` dans `eventService.ts`
- [ ] Créer `getCardEvents()` dans `eventService.ts`

### Phase 2 : Carte
- [ ] Créer `EventPreview.tsx`
- [ ] Modifier `MarketplaceMap.tsx` pour charger les événements
- [ ] Ajouter eventMarkers dans le rendu
- [ ] Modifier `SmartPin.tsx` pour type 'event'
- [ ] Modifier `QuickPreview.tsx` pour EventPreview
- [ ] Ajouter filtre toggle événements
- [ ] Tester géolocalisation

### Phase 3 : Cartes utilisateur
- [ ] Ajouter query dans `PublicCardView.tsx`
- [ ] Créer `EventDisplaySection.tsx`
- [ ] Modifier `BusinessCardModern.tsx` (ajouter events prop)
- [ ] Afficher EventDisplaySection dans boutique
- [ ] Tester affichage

### Phase 4 : Route boutique
- [ ] Créer `pages/cards/[id]/events/index.tsx`
- [ ] Implémenter filtres/tabs
- [ ] Intégrer TicketingWidget
- [ ] Ajouter route dans `App.tsx`
- [ ] Ajouter lien depuis `PublicCardActions.tsx`
- [ ] Tester navigation complète

### Tests & Polish
- [ ] Tester tous les parcours
- [ ] Vérifier cohérence design
- [ ] Optimiser performances
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design
- [ ] Gestion erreurs

---

## ⚡ Optimisations importantes

1. **Cache React Query** :
   - `staleTime: 60000` pour événements carte (1 min)
   - `staleTime: 300000` pour événements carte utilisateur (5 min)

2. **Lazy Loading** :
   - Images événements avec `OptimizedEventImage`
   - Code splitting pour `EventDisplaySection`

3. **Memoization** :
   - `React.memo` pour EventPreview et EventDisplaySection
   - `useMemo` pour filtrer/trier les événements

4. **Performance carte** :
   - Limiter nombre d'événements affichés (max 100)
   - Clustering si trop d'événements au même endroit
   - Debounce pour recalcul distance

---

## 🎯 Résultat attendu

Après implémentation :

1. **Sur /map** :
   - Marqueurs événements visibles (icône calendrier)
   - Popup au hover/click avec infos + actions
   - Filtre pour afficher/masquer événements

2. **Dans /card/:id** :
   - Section événements dans la boutique
   - Aperçu 3-4 événements à venir
   - Lien vers tous les événements

3. **Sur /card/:id/events** :
   - Liste complète des événements de l'utilisateur
   - Filtres (upcoming/past/live)
   - Achat tickets direct

**Les événements deviennent des citoyens de première classe de l'écosystème ! 🎉**
