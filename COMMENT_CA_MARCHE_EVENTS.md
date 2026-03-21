# Comment ça marche : Module Events

**Guide complet du fonctionnement du module Events**

---

## 📚 Table des Matières

1. [Architecture générale](#1-architecture-générale)
2. [Flux de données](#2-flux-de-données)
3. [Cycle de vie d'un événement](#3-cycle-de-vie-dun-événement)
4. [Parcours utilisateur détaillés](#4-parcours-utilisateur-détaillés)
5. [Technologies utilisées](#5-technologies-utilisées)
6. [Gestion d'état](#6-gestion-détat)
7. [Optimisations de performance](#7-optimisations-de-performance)

---

## 1. Architecture générale

### 1.1 Vue d'ensemble

Le module Events suit une architecture **en couches** :

```
┌─────────────────────────────────────────┐
│         PAGES (UI)                      │
│  EventsList, EventDetail, EventCreate  │
└──────────────┬──────────────────────────┘
               │ utilise
┌──────────────▼──────────────────────────┐
│      COMPOSANTS RÉUTILISABLES           │
│  EventCard, EventFormStepper, etc.      │
└──────────────┬──────────────────────────┘
               │ utilise
┌──────────────▼──────────────────────────┐
│           HOOKS                          │
│  useEventMap, useEventCreation, etc.    │
└──────────────┬──────────────────────────┘
               │ utilise
┌──────────────▼──────────────────────────┐
│          SERVICES                        │
│  eventService, ticketingService, etc.   │
└──────────────┬──────────────────────────┘
               │ utilise
┌──────────────▼──────────────────────────┐
│         SUPABASE (Backend)              │
│  Base de données PostgreSQL             │
└─────────────────────────────────────────┘
```

### 1.2 Flux de données principal

```
User Action → Component → Hook → Service → Supabase → Database
                ↑                                           ↓
                └────────── Response ←─────────────────────┘
```

---

## 2. Flux de données

### 2.1 Lecture de données (Fetching)

#### Exemple : Liste des événements (EventsList)

```typescript
// 1. L'utilisateur arrive sur /events
EventsList Component se monte

// 2. React Query est configuré avec useInfiniteQuery
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['events', stableFilters, stableSortBy],
  queryFn: ({ pageParam = 1 }) => getEvents(stableFilters, stableSortBy, pageParam, 12),
  // ...
});

// 3. React Query vérifie le cache
// - Si données en cache ET pas expirées (staleTime: 3min) → utilise le cache
// - Sinon → appelle queryFn qui exécute getEvents()

// 4. getEvents() dans eventService.ts fait la requête Supabase
export async function getEvents(filters, sort, page, pageSize) {
  let query = supabase.from('events').select('*', { count: 'exact' });
  
  // Applique les filtres
  if (filters.status) query = query.in('status', filters.status);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  // ...
  
  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  // Exécute la requête
  const { data, error, count } = await query;
  
  return {
    events: data,
    total: count,
    page,
    hasMore: to < count
  };
}

// 5. Les données retournent à React Query
// React Query met en cache + retourne à EventsList

// 6. EventsList affiche les événements
events.map(event => <EventCard key={event.id} event={event} />)
```

#### Pourquoi React Query ?

- ✅ **Cache automatique** : Les données sont mises en cache pendant 3 minutes
- ✅ **Déduplication** : Si plusieurs composants demandent les mêmes données, une seule requête
- ✅ **Refetch intelligent** : Recharge seulement si nécessaire
- ✅ **Optimistic updates** : Mise à jour optimiste de l'UI

### 2.2 Écriture de données (Mutations)

#### Exemple : Création d'un événement

```typescript
// 1. User remplit le formulaire EventFormStepper
const { register, handleSubmit, watch } = useForm<EventFormData>();

// 2. Auto-save avec debounce (toutes les 2 secondes)
useAutoSave(watch(), async (data) => {
  await updateEvent(eventId, data); // Sauvegarde en draft
});

// 3. Quand user clique "Publish"
const onSubmit = async (data: EventFormData) => {
  // Appelle useEventCreation hook
  await createDraft(data);
  await publishEvent(eventId);
  
  // Invalidate le cache React Query
  queryClient.invalidateQueries(['events']);
  
  // Navigate vers EventDetail
  navigate(`/events/${event.id}`);
};
```

---

## 3. Cycle de vie d'un événement

### 3.1 États possibles

```
draft → published → completed
   ↓        ↓
cancelled archived
```

### 3.2 Transitions d'état

```typescript
// 1. CRÉATION (draft par défaut)
createEvent(formData, userId) 
  → status: 'draft'
  → created_at: now()
  → published_at: null

// 2. PUBLICATION
publishEvent(eventId)
  → status: 'published'
  → published_at: now()
  → L'événement devient visible publiquement

// 3. ANNULATION
cancelEvent(eventId)
  → status: 'cancelled'
  → Les billets sont annulés

// 4. ARCHIVAGE
deleteEvent(eventId) // Soft delete
  → status: 'archived'
  → L'événement est masqué mais pas supprimé
```

---

## 4. Parcours utilisateur détaillés

### 4.1 Parcours : Voir la liste des événements

```
1. User navigue vers /events
   ↓
2. EventsList.tsx se monte
   ↓
3. useInfiniteQuery s'active
   - queryKey: ['events', filters, sortBy]
   - Vérifie le cache React Query
   ↓
4a. Cache HIT (données < 3min)
    → Affiche immédiatement (pas de loading)
    
4b. Cache MISS ou EXPIRED
    → Affiche skeletons
    → Appelle getEvents() via eventService
    ↓
5. Supabase retourne les événements
   ↓
6. React Query met en cache + affiche
   ↓
7. User scroll jusqu'en bas
   ↓
8. IntersectionObserver détecte le dernier élément
   ↓
9. fetchNextPage() est appelé
   ↓
10. Nouvelle requête avec pageParam = 2
    → Récupère les 12 événements suivants
    → Ajoute à la liste existante (infinite scroll)
```

**Optimisations appliquées :**
- ✅ `useMemo` pour stabiliser `filters` et `sortBy` (évite re-renders)
- ✅ `useRef` pour `fetchNextPage` dans IntersectionObserver (évite dépendances circulaires)
- ✅ `refetchOnWindowFocus: false` (pas de rechargement au focus)
- ✅ `refetchOnMount: false` (utilise le cache si disponible)

### 4.2 Parcours : Créer un événement

```
1. User clique "Create Event" → /events/create
   ↓
2. EventCreate.tsx se monte
   ↓
3. EventFormStepper s'affiche avec 7 étapes :
   - Basic Info (titre, description, type)
   - Dates & Location
   - Capacity & Waitlist
   - Media (images, vidéo)
   - Tickets (configuration)
   - Live Stream (optionnel)
   - Preview & Publish
   ↓
4. User remplit le formulaire étape par étape
   ↓
5. AUTO-SAVE (déclenché toutes les 2 secondes)
   - useAutoSave hook surveille les changements
   - Debounce de 2s (évite trop de sauvegardes)
   - JSON.stringify pour comparer les changements
   - Si changement détecté → updateEvent() en draft
   ↓
6. User valide une étape
   - Validation Zod vérifie les champs
   - Si valide → nextStep()
   - Si invalide → affiche erreurs
   ↓
7. User arrive à la dernière étape et clique "Publish"
   ↓
8. createDraft() ou createAndPublish()
   - Crée l'événement en base de données
   - Génère un ID unique
   - Retourne l'événement créé
   ↓
9. Navigation vers /events/{id}
   - L'événement est maintenant publié
```

**Auto-save expliqué :**

```typescript
// useAutoSave.ts
useEffect(() => {
  // Stabilise les données en JSON string
  const dataString = useMemo(() => JSON.stringify(data), [data]);
  
  // Compare avec la dernière sauvegarde
  const hasChanged = dataString !== JSON.stringify(lastSavedDataRef.current);
  
  if (!hasChanged) return; // Pas de changement, on sort
  
  // Debounce : annule le timeout précédent, en crée un nouveau
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => {
    saveWithRetry(data); // Sauvegarde après 2s d'inactivité
  }, 2000);
}, [dataString]);
```

### 4.3 Parcours : Acheter un billet

```
1. User est sur EventDetail et clique "Buy Ticket"
   ↓
2. TicketingWidget s'ouvre (modal)
   ↓
3. Step 1 : Sélection du type de billet
   - Affiche les TicketTier (VIP, Standard, etc.)
   - User sélectionne un type et une quantité
   ↓
4. Step 2 : Informations participant
   - Nom, email, téléphone
   - Validation en temps réel
   ↓
5. Step 3 : Paiement (si payant)
   - Si is_free → passe directement à Step 4
   - Sinon → intégration BoohPay ou autre
   ↓
6. useTicketing hook traite l'achat
   - Appelle purchaseTicket() ou createFreeTicket()
   ↓
7. ticketingService.ts :
   a. Crée l'enregistrement dans event_tickets
   b. Génère un numéro de billet unique (BOOH-TIMESTAMP-RANDOM)
   c. Génère un QR code (JSON avec ticket_id, event_id, email, token)
   d. Si payant → traite le paiement
   e. Crée l'attendee dans event_attendees
   f. Met à jour current_attendees de l'événement
   ↓
8. Track analytics
   - trackTicketSale() enregistre la vente
   ↓
9. Confirmation affichée
   - QR code visible
   - Email de confirmation envoyé (si configuré)
```

**QR Code expliqué :**

```typescript
// ticketingService.ts
function generateQRCodeData(ticketId, eventId, email) {
  return JSON.stringify({
    ticket_id: ticketId,
    event_id: eventId,
    attendee_email: email,
    validation_token: generateValidationToken(ticketId, email)
  });
}

// Le QR code contient ces infos encodées en JSON
// Quand scanné, on peut valider le billet
```

### 4.4 Parcours : Valider un billet (QR)

```
1. Organisateur ouvre /events/{id}/validate
   ↓
2. TicketValidation.tsx se monte
   ↓
3. Charge les stats de validation
   - getTicketValidationStats(eventId, timeFilter)
   - Affiche : validés aujourd'hui, cette semaine, total
   ↓
4. User scanne un QR code (ou saisit manuellement)
   ↓
5. validateQR(qrCodeString) est appelé
   ↓
6. ticketingService.validateTicketQR() :
   a. Parse le QR code (JSON)
   b. Vérifie le validation_token
   c. Vérifie que le billet existe en base
   d. Vérifie que le billet n'est pas déjà validé
   e. Vérifie que le billet appartient à cet événement
   ↓
7a. VALIDATION SUCCÈS
     - Marque is_validated = true
     - Enregistre validated_at et validated_by
     - checkInTicket() met aussi checked_in = true
     - Affiche succès + infos participant
     - Recharge les stats (via loadStatsRef)
     
7b. VALIDATION ÉCHEC
     - Affiche erreur (déjà validé, invalide, etc.)
     ↓
8. Auto-refresh (si activé)
   - Interval de 10 secondes
   - Recharge seulement les stats (pas l'événement)
```

**Auto-refresh expliqué :**

```typescript
// TicketValidation.tsx
const loadStatsRef = useRef(loadStats); // Référence stable
useEffect(() => {
  loadStatsRef.current = loadStats; // Mise à jour silencieuse
}, [loadStats]);

useEffect(() => {
  if (!autoRefresh || !id) return;
  
  const interval = setInterval(() => {
    loadStatsRef.current(id, timeFilter); // Utilise la ref stable
  }, 10000);
  
  return () => clearInterval(interval);
}, [autoRefresh, id, timeFilter]); // Pas de loadStats dans les deps
```

**Pourquoi useRef ?**
- Évite la dépendance circulaire
- Le useEffect de l'interval ne se re-crée pas à chaque changement de `loadStats`
- Mais utilise toujours la version la plus récente de `loadStats`

### 4.5 Parcours : Streaming en direct

```
1. User ouvre /events/{id}/live
   ↓
2. LiveEvent.tsx se monte
   ↓
3. Vérifie si l'événement a un live stream
   - has_live_stream: true
   - live_stream_url: "https://youtube.com/..."
   ↓
4. joinAsViewer() est appelé
   - Crée un EventViewer en base
   - session_id unique généré
   - Enregistre joined_at
   ↓
5. LivePlayer affiche le stream
   - Intègre YouTube/Twitch/Facebook player
   - Affiche "LIVE" badge si live_stream_status = 'live'
   ↓
6. Heartbeat toutes les 20 secondes
   - updateViewerHeartbeat() met à jour last_seen_at
   - Permet de compter les viewers actifs
   ↓
7. LiveChat s'affiche (si enable_chat = true)
   - WebSocket ou polling pour messages
   - User peut envoyer des messages
   - Affiche viewer_count en temps réel
   ↓
8. TipWidget s'affiche (si enable_tips = true)
   - User peut faire un don
   - Montants prédéfinis ou personnalisé
   - Paiement via BoohPay
   ↓
9. Si organisateur :
   - Bouton "Start Stream" / "End Stream"
   - startLiveStream() / endLiveStream()
   - Met à jour live_stream_status
   ↓
10. User quitte la page
    - leaveStream() est appelé
    - Enregistre left_at
    - Supprime le viewer de la liste active
```

---

## 5. Technologies utilisées

### 5.1 Gestion d'état

| Technologie | Usage | Pourquoi |
|------------|-------|----------|
| **React Query** | Cache serveur, fetching | Cache automatique, déduplication, optimistic updates |
| **useState** | État local composant | État UI (loading, form inputs, etc.) |
| **useForm (react-hook-form)** | Formulaires | Validation, performance, moins de re-renders |
| **Zustand (cardStore)** | État global simple | Carte sélectionnée (partagé entre composants) |

### 5.2 Validation

```typescript
// Zod Schema dans EventFormStepper
const eventFormSchema = z.object({
  title: z.string().min(3).max(100),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
}).refine((data) => {
  // Validation custom : end_date > start_date
  return new Date(data.end_date) > new Date(data.start_date);
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});
```

### 5.3 Animations

```typescript
// Framer Motion pour transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {content}
</motion.div>

// AnimatePresence pour animations de sortie
<AnimatePresence>
  {isOpen && <Modal />}
</AnimatePresence>
```

---

## 6. Gestion d'état

### 6.1 React Query Cache

```typescript
// Configuration globale (queryClient.ts)
{
  staleTime: 1000 * 60 * 3, // 3 minutes - données fraîches
  gcTime: 1000 * 60 * 30, // 30 minutes - garde en cache
  refetchOnWindowFocus: false, // Pas de refetch au focus
  refetchOnMount: false, // Utilise cache si disponible
}
```

**Comment ça marche :**

1. **Premier chargement** : Pas de cache → Requête serveur
2. **Rechargement < 3min** : Cache frais → Pas de requête
3. **Rechargement > 3min** : Cache expiré → Requête en arrière-plan, affiche cache pendant le chargement
4. **Après 30min** : Cache supprimé (garbage collection)

### 6.2 Invalidation de cache

```typescript
// Quand on crée/modifie un événement
await createEvent(data);
queryClient.invalidateQueries(['events']); // Invalide toutes les queries 'events'
// → Prochaine requête sera fraîche
```

### 6.3 Optimistic Updates

```typescript
// Exemple : Ajouter aux favoris
useMutation({
  mutationFn: addToFavorites,
  onMutate: async (eventId) => {
    // Optimistic update : met à jour UI immédiatement
    await queryClient.cancelQueries(['favorites']);
    const previous = queryClient.getQueryData(['favorites']);
    queryClient.setQueryData(['favorites'], old => [...old, eventId]);
    return { previous };
  },
  onError: (err, eventId, context) => {
    // Rollback en cas d'erreur
    queryClient.setQueryData(['favorites'], context.previous);
  },
});
```

---

## 7. Optimisations de performance

### 7.1 Memoization

```typescript
// Stabilise les objets pour éviter re-renders
const stableFilters = useMemo(() => filters, [
  filters.event_type?.join(','),
  filters.is_free,
  filters.search,
]);

// Stabilise les fonctions
const loadEvent = useCallback(async (eventId: string) => {
  // ...
}, []); // Dépendances vides = fonction stable
```

**Pourquoi c'est important :**
- Si `filters` change de référence à chaque render, les useEffect qui en dépendent se déclenchent en boucle
- `useMemo` crée une nouvelle référence seulement si les valeurs changent vraiment

### 7.2 React.memo

```typescript
// EventCard.tsx
export default React.memo(EventCard, (prevProps, nextProps) => {
  // Re-render seulement si ces props changent
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.current_attendees === nextProps.event.current_attendees &&
    prevProps.event.status === nextProps.event.status
  );
});
```

**Résultat :** Si EventsList re-render mais qu'EventCard n'a pas changé → Pas de re-render de EventCard

### 7.3 Lazy Loading

```typescript
// App.tsx - Code splitting
const EventDetail = React.lazy(() => import('./pages/EventDetail'));

// Se charge seulement quand nécessaire
<Suspense fallback={<Loading />}>
  <EventDetail />
</Suspense>
```

**Résultat :** Bundle plus petit au chargement initial

### 7.4 Image Optimization

```typescript
// OptimizedEventImage.tsx
const [isInView, setIsInView] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setIsInView(true);
      observer.disconnect(); // Charge une seule fois
    }
  });
  
  observer.observe(imageRef.current);
}, []);

// Charge l'image seulement quand visible
{isInView && <img src={src} />}
```

**Résultat :** Moins de requêtes initiales, chargement à la demande

---

## 8. Exemples concrets

### 8.1 Exemple : Filtres dans EventsList

```typescript
// User tape "concert" dans la recherche
setSearchQuery("concert");
  ↓
// Debounce attend 300ms
useDebounce(searchQuery, 300) → "concert" (après 300ms)
  ↓
// useEffect met à jour les filters
setFilters(prev => ({ ...prev, search: "concert" }));
  ↓
// stableFilters change (useMemo détecte le changement)
stableFilters.search = "concert"
  ↓
// React Query détecte le changement dans queryKey
queryKey: ['events', stableFilters, stableSortBy]
  ↓
// Invalide le cache et refetch
getEvents({ search: "concert" }, sortBy, 1, 12)
  ↓
// Affiche les résultats filtrés
```

### 8.2 Exemple : Auto-save dans EventFormStepper

```typescript
// User modifie le titre
watch().title = "Nouveau titre"
  ↓
// useAutoSave détecte le changement
JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)
  ↓
// Démarre un timeout de 2 secondes
setTimeout(() => save(), 2000)
  ↓
// User continue à taper (modifie description)
// Le timeout précédent est annulé
clearTimeout(timeoutRef.current)
// Nouveau timeout démarre
setTimeout(() => save(), 2000)
  ↓
// User arrête de taper pendant 2 secondes
// Le timeout se déclenche
saveWithRetry(data)
  ↓
// Sauvegarde en base de données
updateEvent(eventId, { title: "Nouveau titre", description: "..." })
```

---

## 9. Points clés à retenir

### ✅ Architecture en couches
- Pages → Composants → Hooks → Services → Supabase
- Séparation claire des responsabilités

### ✅ React Query pour le cache
- Cache automatique 3 minutes
- Refetch intelligent
- Optimistic updates possibles

### ✅ Performance optimisée
- Memoization (useMemo, useCallback)
- React.memo pour composants
- Lazy loading images et code

### ✅ Auto-save avec debounce
- Sauvegarde automatique toutes les 2 secondes d'inactivité
- Évite trop de requêtes

### ✅ Infinite scroll
- Chargement par pages de 12 événements
- IntersectionObserver pour détecter le scroll
- React Query manage les pages automatiquement

---

## 10. Diagrammes de flux

### 10.1 Création d'événement

```
User Input
    ↓
EventFormStepper (7 étapes)
    ↓
Auto-save (debounce 2s)
    ↓
updateEvent() → Supabase (draft)
    ↓
User clique "Publish"
    ↓
createEvent() → Supabase
    ↓
publishEvent() → Supabase (status: published)
    ↓
invalidateQueries(['events'])
    ↓
Navigate to /events/{id}
```

### 10.2 Achat de billet

```
User clique "Buy Ticket"
    ↓
TicketingWidget (4 étapes)
    ↓
User sélectionne ticket + infos
    ↓
useTicketing.purchaseTicket()
    ↓
ticketingService.purchaseTicket()
    ├─→ Crée event_ticket
    ├─→ Génère QR code
    ├─→ Traite paiement (si payant)
    └─→ Crée event_attendee
    ↓
trackTicketSale() (analytics)
    ↓
Confirmation affichée
```

---

**Ce document explique le fonctionnement interne du module Events.**
**Toutes les optimisations récentes (memoization, useRef, etc.) sont expliquées dans le contexte de leur utilisation.**
