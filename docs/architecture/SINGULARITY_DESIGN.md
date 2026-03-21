# Singularity of Design — Bööh

## Principe

**La simplicité (Une seule URL / Carte) cache une puissance totale (Business OS).**  
L’architecture doit unifier minimalisme de la carte et complexité de l’OS sans friction.

---

## 1. Conflits identifiés (analyse préalable)

| Conflit | Description | Résolution technique |
|--------|-------------|----------------------|
| **Navigation vs morphisme** | Dashboard séparé = changement d’URL et rupture de la promesse "une seule URL". | Couches de réalité : Layer 0 = carte (public), Layer 1 = OS (proprio uniquement). Même URL `/card/:id`. |
| **Plans Legacy vs nouveaux** | Colonnes/features en double (FREE/BUSINESS/MAGIC vs ESSENTIEL/CONNEXIONS/COMMERCE/OPÉRÉ). | Adapter unique : `planFeaturesAdapter` + `useAdaptedPlan`. Une seule source de vérité pour les features. |
| **FREE = viral vs PAID = opérationnel** | FREE = vitrine (virale), PAID = gestion. | `PlanMode`: `viral` | `operational` dérivé du plan dans l’adapter. |
| **Barrière de paiement = frustration** | "Accès refusé" bloque sans explication. | Growth Insights : messages du type "Active ce module pour gérer les X leads captés par ta carte". |
| **Données sensibles vs vitrine publique** | Carte publique OK ; emails clients, revenus, commandes = privés. | RLS : SELECT public sur carte + contenu vitrine ; CRUD sensible réservé à `user_id = auth.uid()`. |

---

## 2. ENGINE — Données & sécurité

### 2.1 Adapter de plans

- **Fichier** : `src/adapters/planFeaturesAdapter.ts`
- **Rôle** : Unifier tout `planType` (Legacy ou nouveau) + features optionnelles DB → `AdaptedPlan` (features + mode `viral` | `operational`).
- **Usage** : `useAdaptedPlan()` dans l’app ; `hasFeature(adapted, 'hasEcommerce')` au lieu de brancher sur `isLegacyPlan` / `isNewPlan`.

### 2.2 RLS — Principes (vitrine vs sensible)

- **Carte (vitrine)** : `business_cards` — SELECT pour `user_id = auth.uid() OR is_public = true`. INSERT/UPDATE/DELETE pour `user_id = auth.uid()`.
- **Contenu lié public** : `media_content`, `social_links`, `products` (liste publique), etc. — SELECT anonyme ou authentifié pour ce qui est exposé sur la carte ; écriture par le propriétaire de la carte (via `business_cards.user_id`).
- **Données sensibles** : `appointments` (client_email, client_name), `unified_orders`, `service_quotes`, `invoices` — SELECT/UPDATE uniquement pour le propriétaire (jointure via `card_id` → `business_cards.user_id = auth.uid()`). Pas de SELECT public sur ces tables.

Les migrations RLS existantes (`business_cards`, `appointments`, etc.) doivent rester alignées avec ce principe : **vitrine lisible par tous, données de gestion réservées au propriétaire**.

### 2.3 React Query — Lazy

- Priorité visuelle : charger d’abord la carte (identité) ; ensuite, en différé, les modules OS (CRM, commandes, etc.) quand l’utilisateur est propriétaire ou accède au dashboard.
- `RealityLayerProvider` ne charge l’ownership que si nécessaire ; `ownerId` peut être passé depuis la carte déjà chargée pour éviter une requête redondante.

---

## 3. INTERFACE — UI morphologique

### 3.1 Couches de réalité

- **Contexte** : `src/contexts/RealityLayerContext.tsx`
- **Layer 0** : Carte seule (visible par tous sur `/card/:id`).
- **Layer 1** : Carte + édition + drawer OS (uniquement si `auth.uid() === card.user_id`).
- Pas de nouvelle URL dashboard pour la carte : tout reste sous `/card/:id`.

### 3.2 Edit-in-place + Drawer

- **RealityLayerCard** (`src/components/card/RealityLayerCard.tsx`) : pour le propriétaire, boutons flottants "Modifier" et "Dashboard" ; double-clic sur la carte → navigation vers `/cards/:id/edit`.
- **OSDrawer** (`src/components/card/OSDrawer.tsx`) : tiroir latéral avec liens vers CRM, Stock, Boutique, RDV, Portfolio, Facturation, Carte. Les entrées désactivées selon le plan (via `useAdaptedPlan().hasFeature`).

Intégration : `PublicCardView` enveloppe le contenu avec `RealityLayerProvider`, `RealityLayerCard` et affiche `OSDrawer`.

---

## 4. STRATÉGIE — Business Flow

### 4.1 Growth Insights

- **Service** : `src/services/growthInsightsService.ts`
- **Principe** : Remplacer "Accès refusé" par un message orienté valeur, ex. "Active ton CRM pour ne plus perdre un lead" + "X contacts ont consulté ta carte".
- **SubscriptionMessagesService** : `getGrowthInsightMessage(feature, viewCount?, inquiryCount?)` délègue à ce service pour réutiliser les messages dans les prompts d’upgrade.

### 4.2 Localisation intelligente

- **Hook** : `src/hooks/useLocaleContext.ts`
- Détection devise/culture (FCFA/Mobile Money vs USD/Stripe) à partir de la config courante (`getCurrentCurrency()`).
- Expose `isFcfaZone`, `isCardZone`, `paymentPreference` pour adapter l’UI (paiement, libellés).

---

## 5. Autocritique

- **Risque de surcharge UI** : Les boutons "Modifier" et "Dashboard" sur la carte propriétaire peuvent nuire au minimalisme. **Mitigation** : boutons discrets, repliables (état `showFloating`), et possibilité de les masquer en mode "présentation".
- **Drawer vs navigation** : Le drawer OS redirige vers des routes dédiées (`/contacts`, `/cards/:id/products`, etc.) au lieu de tout garder sous la même URL. **Choix assumé** : la "singularité" est la carte comme point d’entrée unique ; la gestion reste en sous-routes pour ne pas alourdir la page publique et garder le SEO/partage sur `/card/:id`.
- **Adapter et PlansService** : L’adapter utilise `PLAN_FEATURES` / `NEW_PLAN_FEATURES` en fallback ; `useSubscription` continue de s’appuyer sur `PlansService` et la DB. Pas de double source de vérité : l’adapter normalise ce que le hook fournit déjà (planType + features), et ajoute uniquement le mode viral/operational.
- **Simplicité préservée** : Un visiteur anonyme ne voit que la carte (Layer 0). Un propriétaire voit la même carte + des contrôles légers (edit, dashboard). La promesse "une seule URL pour la carte" est respectée ; la complexité reste derrière l’auth et le plan.

---

## 6. Fichiers créés / modifiés (résumé)

| Fichier | Rôle |
|---------|------|
| `src/adapters/planFeaturesAdapter.ts` | Unification plans Legacy + nouveaux, mode viral/operational. |
| `src/hooks/useAdaptedPlan.ts` | Hook exposant l’adapter + `hasFeature`. |
| `src/services/growthInsightsService.ts` | Messages Growth Insights + métriques carte. |
| `src/services/subscriptionMessages.ts` | + `getGrowthInsightMessage`. |
| `src/contexts/RealityLayerContext.tsx` | Layer 0/1, isOwner, drawer/edit state. |
| `src/components/card/RealityLayerCard.tsx` | Wrapper carte + boutons propriétaire. |
| `src/components/card/OSDrawer.tsx` | Tiroir liens OS (CRM, Stock, etc.). |
| `src/hooks/useLocaleContext.ts` | Contexte devise / zone de paiement. |
| `src/pages/PublicCardView.tsx` | Intégration RealityLayerProvider, RealityLayerCard, OSDrawer. |
