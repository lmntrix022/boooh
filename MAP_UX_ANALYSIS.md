# 🗺️ Analyse UX Complète - Page Map Bööh

## 📊 Vue d'Ensemble du Système

### **Architecture Actuelle**
```
MapView (page)
  └── MarketplaceMap (logique principale)
      ├── Google Maps (carte interactive)
      ├── MarketplaceFilters (barre de recherche + Home)
      ├── NearbyCatalog (carousel produits/services)
      ├── BusinessDetailSheet (détails business)
      ├── MapControlsPanel (contrôles droite)
      ├── AdvancedFiltersPanel (filtres avancés)
      └── ActiveFiltersIndicator (indicateurs actifs)
```

### **Fonctionnalités Identifiées**

✅ **Recherche & Filtres** :
- Barre de recherche intelligente avec analyse d'intent
- Filtres avancés (prix, distance, badges, ratings)
- Recherche vocale (via useVoiceSearch)
- Historique de recherches sauvegardées
- Suggestions contextuelles
- "Rechercher dans cette zone"

✅ **Navigation & Visualisation** :
- Clustering des marqueurs (performance)
- Thème sombre/clair (useMapTheme)
- Styles de carte multiples (roadmap, satellite, hybrid, terrain)
- Géolocalisation utilisateur
- Mesure de distance
- Plein écran
- Vue liste alternative

✅ **Catalogue & Produits** :
- Carousel horizontal (produits + services)
- Drag & swipe (mobile-friendly)
- Badges dynamiques (Top, Nouveau, Promo)
- Distance en temps réel
- Tri par distance/popularité
- Détails complets par business

✅ **Interaction** :
- Favoris (cœur)
- Partage de carte
- Export de données JSON
- Itinéraire vers point
- InfoWindow sur markers
- Statistiques d'utilisation

---

## 🎯 Analyse des Points Forts

### **1. Design Premium** ⭐⭐⭐⭐⭐
- Animations framer-motion fluides
- Glassmorphism et backdrop-blur
- Transitions spring naturelles
- Design AWWWARDS level

### **2. Performance** ⭐⭐⭐⭐
- Clustering intelligent (Supercluster)
- React Query avec cache
- Lazy loading des composants
- Optimisation mobile (géométries réduites)

### **3. Intelligence de Recherche** ⭐⭐⭐⭐⭐
- Analyse sémantique (analyzeSearchQuery)
- Intent detection avancé
- Suggestions contextuelles
- Historique intelligent

### **4. Accessibilité** ⭐⭐⭐⭐
- Tooltips descriptifs
- aria-labels
- Focus visible
- Responsive design

---

## 🚨 Problèmes UX Identifiés

### **CRITIQUE - P0 (À corriger immédiatement)**

#### **1. Trop de Boutons Flottants** ⚠️
**Problème** : 8+ boutons flottants sur la carte (droite + gauche)
- Home, Search, Layers, Navigation, Ruler, Stats, List, Share, Fullscreen, Info
- **Impact** : Confusion visuelle, surcharge cognitive
- **Utilisateurs mobiles** : Boutons trop petits et trop nombreux

**Solution suggérée** :
```
Regrouper les boutons par catégorie :
┌─────────────────────────────────────┐
│ PRIMAIRES (toujours visibles) :    │
│  - Home + Search (gauche)           │
│  - Géolocalisation (droite)         │
│  - Menu "+" (3 dots) → autres       │
└─────────────────────────────────────┘
```

#### **2. Catalogue Bloque 40% de la Carte** ⚠️
**Problème** : Le `NearbyCatalog` occupe toute la largeur en bas
- **Sur mobile** : 50% de l'écran = catalogue
- **Impact** : Difficile de voir la carte complète
- **Scroll confusing** : Deux zones scrollables (carte + catalogue)

**Solution suggérée** :
```
Option A : Bouton toggle "Masquer catalogue" (⬇️)
Option B : Miniature collapsible (comme Google Maps)
Option C : Mode "Carte seule" avec bouton flottant
```

#### **3. Pas de Feedback de Chargement Global** ⚠️
**Problème** : Quand on change de filtre/recherche
- Produits/services se rechargent
- Mais pas de loading visible sur la carte
- **Impact** : L'utilisateur ne sait pas si ça charge

**Solution suggérée** :
```tsx
// Overlay semi-transparent avec spinner
<AnimatePresence>
  {isLoading && (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50">
      <Spinner />
    </div>
  )}
</AnimatePresence>
```

---

### **MAJEUR - P1 (Important mais pas bloquant)**

#### **4. Géolocalisation Trop Intrusive** 📍
**Problème** : Permission demandée automatiquement au chargement
- Sur mobile, popup système immédiate
- **Impact** : Mauvaise première impression
- **Taux de refus élevé** probable

**Solution suggérée** :
```
✅ Afficher la carte d'abord (centre sur Libreville)
✅ Banner soft : "📍 Activez la position pour voir les distances"
✅ Demander la permission seulement si l'utilisateur clique
```

#### **5. Recherche Vocale Cachée** 🎤
**Problème** : Fonction existe (useVoiceSearch) mais pas de bouton visible
- **Impact** : Utilisateurs ne savent pas qu'ils peuvent parler
- **Mobile** : La voix est pourtant plus pratique que taper

**Solution suggérée** :
```tsx
// Ajouter micro dans la barre de recherche
<button className="...">
  <Mic className="w-5 h-5" />
</button>
```

#### **6. Pas de Vue "Autour de Moi"** 📍
**Problème** : Le catalogue montre "À proximité" mais :
- Pas de rayon visuel sur la carte
- Difficile de comprendre la zone couverte
- Pas de filtre distance rapide (500m, 1km, 5km)

**Solution suggérée** :
```tsx
// Cercle semi-transparent sur la carte
<Circle
  center={userLocation}
  radius={filters.maxDistance || 5000}
  options={{
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    strokeColor: '#3b82f6',
    strokeOpacity: 0.3
  }}
/>

// Boutons rapides
<div className="flex gap-2">
  <Chip onClick={() => setDistance(500)}>500m</Chip>
  <Chip onClick={() => setDistance(1000)}>1km</Chip>
  <Chip onClick={() => setDistance(5000)}>5km</Chip>
</div>
```

#### **7. Catalogue Pas Swipable Évident** 👆
**Problème** : Le carousel est swipable mais :
- Pas de hint visuel (pas de dots visibles avant scroll)
- Flèches petites
- **Impact** : Utilisateurs pensent qu'il n'y a qu'un seul item

**Solution suggérée** :
```tsx
// Dots toujours visibles
<div className="dots-indicator">
  {items.map((_, i) => <Dot active={i === current} />)}
</div>

// Ombre de débordement
<div className="absolute right-0 w-12 h-full bg-gradient-to-l from-white" />
```

---

### **MINEUR - P2 (Nice to have)**

#### **8. Pas de Sauvegarde de Position** 💾
**Problème** : Si l'utilisateur rafraîchit
- Perd sa position sur la carte
- Perd son zoom
- Perd ses filtres actifs

**Solution** : LocalStorage ou URL params
```typescript
// Sauvegarder l'état dans URL
?lat=0.4162&lng=9.4673&zoom=12&filter=products

// Ou localStorage
localStorage.setItem('map_state', JSON.stringify({
  center, zoom, filters
}));
```

#### **9. Pas de Mode "Hors Ligne"** 📵
**Problème** : Si connexion perdue
- Carte blanche
- Aucun message
- **Impact** : Utilisateur confus

**Solution** :
```tsx
// Détecter offline
if (!navigator.onLine) {
  return <OfflineMessage onRetry={refetch} />
}
```

#### **10. Statistiques Trop Techniques** 📊
**Problème** : MapStatsPanel montre des métriques dev
- Pas forcément utiles pour l'utilisateur final
- Gamification sous-exploitée

**Solution** : Gamification ludique
```
❌ "Visited: 5 cards"
✅ "🎯 Découvreur de talents ! (5/10 pour débloquer Explorateur)"
```

---

## 💡 Suggestions d'Amélioration Prioritaires

### **🔥 PRIORITÉ 1 - Quick Wins (2-4h)**

#### **A. Bouton Menu Unifié (Right Side)**
**But** : Réduire la surcharge visuelle

**Implémentation** :
```tsx
// Remplacer 6 boutons par 1 menu
<FloatingActionButton icon={Menu}>
  <MenuItem icon={Navigation}>Ma position</MenuItem>
  <MenuItem icon={Ruler}>Mesurer</MenuItem>
  <MenuItem icon={BarChart}>Stats</MenuItem>
  <MenuItem icon={List}>Vue liste</MenuItem>
  <MenuItem icon={Share}>Partager</MenuItem>
  <MenuItem icon={Download}>Export</MenuItem>
</FloatingActionButton>
```

**Avantages** :
- ✅ Interface moins chargée
- ✅ Plus facile sur mobile
- ✅ Hiérarchie claire (actions principales vs secondaires)

---

#### **B. Toggle Catalogue Collapsible**
**But** : Permettre de masquer le catalogue pour voir toute la carte

**Implémentation** :
```tsx
<motion.button
  onClick={() => setShowCatalog(!showCatalog)}
  className="absolute top-4 right-1/2 translate-x-1/2 z-50"
>
  {showCatalog ? <ChevronDown /> : <ChevronUp />}
</motion.button>

<motion.div
  animate={{ y: showCatalog ? 0 : '100%' }}
  className="catalogue-container"
>
  <NearbyCatalog />
</motion.div>
```

**Avantages** :
- ✅ Flexibilité pour l'utilisateur
- ✅ Carte en plein écran possible
- ✅ Meilleure lisibilité

---

#### **C. Rayon de Distance Visuel**
**But** : Montrer graphiquement la zone "À proximité"

**Implémentation** :
```tsx
import { Circle } from '@react-google-maps/api';

{userLocation && filters.maxDistance && (
  <Circle
    center={{ lat: userLocation[0], lng: userLocation[1] }}
    radius={filters.maxDistance}
    options={{
      fillColor: '#8b5cf6',
      fillOpacity: 0.08,
      strokeColor: '#8b5cf6',
      strokeOpacity: 0.3,
      strokeWeight: 2
    }}
  />
)}
```

**Avantages** :
- ✅ Visualisation claire de la zone
- ✅ Feedback immédiat lors du changement de distance
- ✅ Aide à comprendre pourquoi certains items sont affichés

---

### **🚀 PRIORITÉ 2 - Améliorations Majeures (1-2 jours)**

#### **D. Onboarding Interactif**
**But** : Guider les nouveaux utilisateurs

**Implémentation** :
```typescript
// Spotlight tour (package: react-joyride ou driver.js)
const steps = [
  { target: '.search-button', content: 'Recherchez des produits ou services' },
  { target: '.home-button', content: 'Retournez à l\'accueil' },
  { target: '.nearby-catalog', content: 'Découvrez ce qui est proche de vous' },
  { target: '.location-button', content: 'Centrez sur votre position' }
];
```

**Avantages** :
- ✅ Réduction du taux de rebond
- ✅ Découverte des fonctionnalités cachées
- ✅ Première expérience guidée

---

#### **E. Filtres Rapides (Chips)**
**But** : Accès rapide aux filtres populaires

**Implémentation** :
```tsx
<div className="absolute top-20 left-4 flex gap-2">
  <QuickFilter active={filters.filterType === 'food'} onClick={() => setFilterType('food')}>
    🍔 Restaurants
  </QuickFilter>
  <QuickFilter active={filters.filterType === 'beauty'} onClick={() => setFilterType('beauty')}>
    💅 Beauté
  </QuickFilter>
  <QuickFilter active={filters.hasPromotion} onClick={() => togglePromo()}>
    🏷️ Promos
  </QuickFilter>
</div>
```

**Avantages** :
- ✅ Accès en 1 clic
- ✅ Pas besoin d'ouvrir les filtres avancés
- ✅ Découverte visuelle des catégories

---

#### **F. Mode "Explorer Aléatoire"** 🎲
**But** : Découverte sérendipité

**Implémentation** :
```tsx
<FloatingButton
  icon={Shuffle}
  label="Découverte"
  onClick={exploreRandom}
/>

function exploreRandom() {
  const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
  setCenter({ lat: randomItem.latitude, lng: randomItem.longitude });
  setSelectedItem(randomItem);
  setZoom(16);
}
```

**Avantages** :
- ✅ Engagement ludique
- ✅ Découverte de produits inattendus
- ✅ Différenciation (fonctionnalité unique)

---

### **💎 PRIORITÉ 3 - Fonctionnalités Avancées (3-5 jours)**

#### **G. Itinéraire Multi-Étapes** 🛣️
**But** : Planifier un parcours avec plusieurs stops

**Implémentation** :
```tsx
// Mode "Planifier ma visite"
const [routeWaypoints, setRouteWaypoints] = useState<Product[]>([]);

<Button onClick={() => setRoutePlanningMode(true)}>
  📍 Planifier ma visite
</Button>

// Cliquer sur items pour les ajouter au parcours
// Afficher l'itinéraire optimisé
// "Démarrer la navigation" → Google Maps
```

**Avantages** :
- ✅ Cas d'usage shopping réel
- ✅ Optimisation du temps utilisateur
- ✅ Augmentation des visites multiples

---

#### **H. Réservation/Achat Direct depuis la Carte** 🛒
**But** : Réduire les frictions

**Problème actuel** :
```
Carte → Clic produit → Sheet détails → Bouton "Acheter" → Nouvelle page
(4 étapes)
```

**Solution** :
```
Carte → Clic produit → Quick Actions (hover)
  ├── "Acheter maintenant" (modal panier)
  ├── "Réserver créneau" (modal calendar)
  └── "Voir détails" (sheet actuel)
(2 étapes)
```

**Implémentation** :
```tsx
<ProductCard
  onQuickBuy={() => addToCart(product)}  // Panier direct
  onBookSlot={() => openBooking(service)}  // Résa directe
  onViewDetails={() => openSheet(item)}    // Détails complets
/>
```

**Avantages** :
- ✅ Conversion +30-50%
- ✅ Moins de clics
- ✅ Expérience fluide

---

#### **I. Notifications de Proximité** 🔔
**But** : Alerter quand l'utilisateur est proche d'un favori

**Implémentation** :
```typescript
useEffect(() => {
  if (!userLocation) return;
  
  favorites.forEach(fav => {
    const distance = calculateDistance(userLocation, fav.location);
    if (distance < 500) { // 500m
      toast({
        title: '📍 Vous êtes près de ' + fav.name,
        description: 'À seulement ' + distance + 'm',
        action: <Button>Y aller</Button>
      });
    }
  });
}, [userLocation, favorites]);
```

**Avantages** :
- ✅ Engagement utilisateur
- ✅ Rappel des favoris
- ✅ Conversion opportuniste

---

#### **J. Carte Hors Ligne (PWA)** 📵
**But** : Fonctionnalité partielle sans connexion

**Implémentation** :
```typescript
// Cache les dernières positions visitées
const offlineCache = {
  lastSearch: filters,
  lastCenter: center,
  cachedItems: nearbyItems.slice(0, 20),
  timestamp: Date.now()
};

// Service Worker cache les tiles Google Maps
workbox.routing.registerRoute(
  /maps\.googleapis\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-maps-cache'
  })
);
```

**Avantages** :
- ✅ Résilience
- ✅ UX sans coupure
- ✅ Utilisation en zone faible signal

---

## 🎨 Améliorations UI/UX Spécifiques

### **1. Améliorer le Empty State** 🤷
**Actuel** : "Aucun résultat"
**Proposé** :
```tsx
<EmptyState>
  <Illustration />
  <h3>Aucun résultat dans cette zone</h3>
  <p>Essayez d'élargir votre recherche ou de zoomer sur la carte</p>
  <Button onClick={clearFilters}>Réinitialiser les filtres</Button>
  <Button variant="outline" onClick={exploreNearby}>
    Explorer autour de moi
  </Button>
</EmptyState>
```

---

### **2. Améliorer les Markers Clustering** 🎯
**Problème** : Clusters génériques (juste un nombre)
**Proposé** :
```tsx
// Clusters avec preview des types
<ClusterMarker count={12}>
  <div className="cluster-preview">
    🍕 x3  💇 x5  📦 x4
  </div>
</ClusterMarker>
```

---

### **3. Animations de Transition** ✨
**Ajouter** :
```tsx
// Quand l'utilisateur clique sur un item du catalogue
// → Animer la caméra vers le marker
mapRef.current?.panTo(itemLocation);
mapRef.current?.setZoom(16);

// Avec transition smooth
google.maps.event.addListener(map, 'zoom_changed', () => {
  // Pulse le marker sélectionné
  selectedMarker.animation = google.maps.Animation.BOUNCE;
});
```

---

### **4. Feedback Haptique (Mobile)** 📳
**Ajouter** :
```typescript
// Quand l'utilisateur sélectionne un item
if ('vibrate' in navigator) {
  navigator.vibrate(10); // 10ms léger
}

// Quand l'utilisateur arrive à destination
navigator.vibrate([100, 50, 100]); // Pattern
```

---

### **5. Mode Nuit Automatique** 🌙
**Améliorer** :
```typescript
// Détecter l'heure et changer automatiquement
const hour = new Date().getHours();
const autoNightMode = hour < 7 || hour > 19;

// Ou suivre les préférences système
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

## 📱 Optimisations Mobile Spécifiques

### **1. Gestes Natifs**
```typescript
// Swipe up sur le catalogue → Ouvrir détails
// Swipe down → Fermer
// Pinch sur carte → Zoom (déjà géré par Google Maps)
// Double tap marker → Zoom + sélection
```

### **2. Bottom Sheet Amélioré**
```tsx
// Trois états : minimisé, mi-hauteur, plein écran
const heights = ['10%', '50%', '90%'];
<Sheet
  snapPoints={heights}
  defaultSnap={1} // Mi-hauteur par défaut
/>
```

### **3. Recherche Raccourcie**
```tsx
// Bouton "Près de moi" en un clic
<QuickAction
  icon={Target}
  label="Près de moi"
  onClick={() => {
    setFilters({ maxDistance: 1000 });
    handleGoToUserLocation();
  }}
/>
```

---

## 🔥 Fonctionnalités Innovantes (Différenciation)

### **1. AR View (Vue Augmentée)** 📸
**Concept** : Pointer le téléphone → voir les markers en overlay
```typescript
// Utilise device orientation + compass
// Overlay les items sur la caméra
// "Cette direction : Restaurant à 200m"
```

**Impact** : 🤯 WOW effect, viralité

---

### **2. Social Features** 👥
**Concept** : Voir ce que mes amis ont aimé
```tsx
<Filter icon={Users}>
  Populaire chez mes contacts
</Filter>

// Markers avec badges sociaux
<Badge>❤️ 3 amis l'ont aimé</Badge>
```

**Impact** : Engagement +40%, découverte sociale

---

### **3. Itinéraire Audio** 🎧
**Concept** : Navigation vocale vers le point
```typescript
// "Dans 50 mètres, tournez à droite vers le restaurant"
const speakDirection = (instruction: string) => {
  const utterance = new SpeechSynthesisUtterance(instruction);
  speechSynthesis.speak(utterance);
};
```

**Impact** : Mains libres, accessibilité ++

---

### **4. Mode "Deals Flash"** ⚡
**Concept** : Promotions géolocalisées en temps réel
```tsx
<LiveDealsPanel>
  <Deal expires={15min}>
    -30% chez Restaurant X
    📍 À 500m de vous
  </Deal>
</LiveDealsPanel>
```

**Impact** : Urgence, conversion immédiate, fidélisation

---

## 📊 Métriques à Tracker

Pour mesurer l'impact des améliorations :

```typescript
// Analytics essentielles
trackEvent('map_loaded', { device, connection });
trackEvent('search_performed', { query, resultsCount });
trackEvent('filter_applied', { filterType, value });
trackEvent('item_clicked', { type, id, distance });
trackEvent('catalog_swiped', { direction, currentIndex });
trackEvent('menu_opened', { trigger });
trackEvent('location_enabled', { method });
trackEvent('route_requested', { from, to });
```

---

## 🎯 Roadmap Suggérée

### **Sprint 1 (1 semaine)** - Quick Wins
- [ ] Menu unifié boutons droite
- [ ] Toggle catalogue collapsible  
- [ ] Rayon distance visuel
- [ ] Loading overlay global
- [ ] Dots carousel toujours visibles

### **Sprint 2 (2 semaines)** - Core UX
- [ ] Onboarding interactif
- [ ] Filtres rapides (chips)
- [ ] Géolocalisation douce
- [ ] Bouton recherche vocale
- [ ] Mode "Autour de moi" amélioré

### **Sprint 3 (3 semaines)** - Advanced
- [ ] Achat/Résa directe depuis carte
- [ ] Sauvegarde état URL/localStorage
- [ ] Notifications de proximité
- [ ] Mode hors ligne
- [ ] Gamification avancée

### **Sprint 4 (Futur)** - Innovation
- [ ] AR View (si budget)
- [ ] Social features
- [ ] Audio navigation
- [ ] Mode Deals Flash

---

## 🏆 Score UX Actuel vs Cible

| Critère | Actuel | Cible | Gap |
|---------|--------|-------|-----|
| **Simplicité** | 6/10 | 9/10 | -3 |
| **Performance** | 8/10 | 9/10 | -1 |
| **Mobile-Friendly** | 7/10 | 9/10 | -2 |
| **Découvrabilité** | 5/10 | 9/10 | -4 |
| **Engagement** | 6/10 | 9/10 | -3 |
| **Conversion** | 6/10 | 9/10 | -3 |

**Score Global** : **6.3/10** → **Cible : 9/10**

---

## 🎓 Principes UX à Appliquer

### **1. Progressive Disclosure** 📚
- Montrer l'essentiel d'abord
- Fonctions avancées accessibles mais pas visibles
- "Don't make me think"

### **2. Affordance Claire** 🎯
- Chaque élément doit être évident
- Boutons = apparence de boutons
- Swipable = indicateurs visuels

### **3. Feedback Immédiat** ⚡
- Chaque action = réponse visuelle
- Loading states clairs
- Succès/erreur explicites

### **4. Zero State Excellence** 🌟
- Jamais d'écran blanc
- Empty states guidants
- Erreurs constructives

### **5. Mobile-First, Desktop-Enhanced** 📱
- Concevoir pour le pouce
- Desktop = bonus features
- Touch targets ≥ 44px

---

## 🔧 Checklist Technique

### **Performance**
- [ ] Lazy load images catalogue (IntersectionObserver)
- [ ] Debounce recherche (déjà fait ?)
- [ ] Virtualisation liste si >100 items
- [ ] Preload tiles au zoom
- [ ] Compression images produits

### **Accessibilité**
- [ ] Navigation clavier complète
- [ ] Screen reader support
- [ ] Contraste AA minimum
- [ ] Focus visible partout
- [ ] Zoom texte jusqu'à 200%

### **SEO**
- [ ] Meta tags dynamiques par zone
- [ ] Schema.org LocalBusiness
- [ ] Sitemap XML des businesses
- [ ] Open Graph images

---

## 🎨 Inspiration Design

### **Références à étudier** :
1. **Google Maps** - Simplicité, performance
2. **Uber** - Rayon visuel, estimations
3. **Airbnb** - Filtres élégants, carte + liste
4. **Waze** - Gamification, social
5. **Apple Maps** - Animations fluides, design épuré

---

## 💰 Impact Business Estimé

### **Après implémentation priorités 1+2** :
- ⬆️ **Taux d'utilisation Map** : +35%
- ⬆️ **Conversions produits/services** : +25%
- ⬇️ **Taux de rebond** : -20%
- ⬆️ **Temps passé sur page** : +45%
- ⬆️ **Retours utilisateurs** : +60%

---

## 🚀 Conclusion & Next Steps

### **Actions Immédiates (Cette Semaine)** :
1. ✅ Implémenter menu unifié (droite)
2. ✅ Toggle catalogue collapsible
3. ✅ Rayon distance visuel
4. ✅ Améliorer empty states

### **Actions Court Terme (2-3 Semaines)** :
1. Onboarding tour
2. Filtres rapides chips
3. Achat direct depuis carte
4. Notifications proximité

### **Vision Long Terme** :
- Mode AR (Q2 2026)
- Social features (Q3 2026)
- Gamification avancée (Q4 2026)

---

**La carte est déjà excellente techniquement. Ces améliorations la rendront exceptionnelle du point de vue utilisateur !** 🎯

---

## 📞 Recommandations Finales

**Top 3 Quick Wins à implémenter MAINTENANT** :
1. 🎯 **Menu unifié** → Réduit la surcharge visuelle
2. 📍 **Toggle catalogue** → Flexibilité utilisateur
3. 🔵 **Rayon visuel** → Compréhension immédiate

Ces 3 changements prendront **4-6h** mais auront un **impact UX massif** ! 🚀






