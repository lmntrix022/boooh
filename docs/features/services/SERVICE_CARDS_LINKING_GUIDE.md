# Guide : Liaison Services-Cartes

## Vue d'ensemble

Ce guide explique la nouvelle fonctionnalité permettant de lier les services du portfolio à une ou plusieurs cartes de visite spécifiques.

## Architecture

### Base de données

#### Table de jonction `service_cards`
```sql
CREATE TABLE service_cards (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES portfolio_services(id) ON DELETE CASCADE,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ,
  UNIQUE(service_id, card_id)
);
```

**Caractéristiques :**
- Relation many-to-many entre services et cartes
- Contrainte d'unicité pour éviter les doublons
- Suppression en cascade si un service ou une carte est supprimé
- RLS activé avec politiques pour les propriétaires

### Service Layer

#### Nouvelles méthodes dans `portfolioService.ts`

1. **`linkServiceToCard(serviceId, cardId)`** - Lier un service à une carte
2. **`unlinkServiceFromCard(serviceId, cardId)`** - Délier un service d'une carte
3. **`updateServiceCards(serviceId, cardIds)`** - Remplacer tous les liens d'un service
4. **`getServiceCards(serviceId)`** - Obtenir les IDs des cartes liées
5. **`getUserServicesWithCards(userId)`** - Obtenir les services avec leurs cartes
6. **`getPublishedCardServices(cardId)`** - Obtenir les services publiés d'une carte

#### Nouveaux types

```typescript
interface ServiceCard {
  id: string;
  service_id: string;
  card_id: string;
  created_at: string;
}

interface PortfolioServiceWithCards extends PortfolioService {
  linked_cards?: {
    id: string;
    title: string;
    slug?: string;
  }[];
}
```

### Composant UI

#### `CardSelector` Component

Un composant réutilisable pour sélectionner des cartes avec :
- Recherche en temps réel
- Multi-sélection avec checkboxes
- Affichage des cartes sélectionnées en badges
- Actions "Tout sélectionner" / "Tout désélectionner"
- Support de limite maximale de sélection
- Messages d'aide et d'erreur
- Design responsive

**Props :**
```typescript
interface CardSelectorProps {
  cards: BusinessCard[];
  selectedCardIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helpText?: string;
  maxSelection?: number;
}
```

## Utilisation

### Page de gestion des services

**Localisation :** `/portfolio/services` → `PortfolioServicesSettings.tsx`

#### Créer/Éditer un service avec des cartes associées

1. Ouvrir le formulaire de service (nouveau ou édition)
2. Remplir les informations du service (titre, description, prix, etc.)
3. Dans la section "Cartes associées", sélectionner les cartes
4. Sauvegarder

**Comportement :**
- Si aucune carte n'est sélectionnée, le service est considéré comme "global"
- Les cartes sélectionnées sont affichées en badges sous chaque service dans la liste
- Lors de l'édition, les cartes déjà liées sont pré-sélectionnées

#### Affichage dans la liste

Les services affichent maintenant :
- Informations du service (titre, description, prix)
- Statut de publication
- **Badges des cartes liées** avec icône et nom de la carte

### Vue publique

Pour afficher les services d'une carte spécifique dans la vue publique :

```typescript
import { PortfolioService } from '@/services/portfolioService';

// Obtenir les services publiés d'une carte
const services = await PortfolioService.getPublishedCardServices(cardId);
```

Cette méthode :
1. Récupère les liens service-carte pour la carte donnée
2. Charge les services correspondants qui sont publiés
3. Trie par `order_index`

## Workflow complet

### 1. Création d'un service

```typescript
// 1. Créer le service
const service = await PortfolioService.createService({
  user_id: userId,
  title: "Développement Web",
  description: "...",
  // ... autres champs
});

// 2. Lier à des cartes
await PortfolioService.updateServiceCards(service.id, [
  "card-id-1",
  "card-id-2"
]);
```

### 2. Mise à jour des associations

```typescript
// Remplacer tous les liens existants
await PortfolioService.updateServiceCards(serviceId, [
  "new-card-id-1",
  "new-card-id-3"
]);
```

### 3. Récupération avec cartes

```typescript
// Pour l'interface d'administration
const servicesWithCards = await PortfolioService.getUserServicesWithCards(userId);

// Structure du résultat :
// [
//   {
//     id: "...",
//     title: "Service 1",
//     // ... autres champs du service
//     linked_cards: [
//       { id: "card-1", title: "Ma Carte Pro", slug: "ma-carte-pro" },
//       { id: "card-2", title: "Carte Perso", slug: "carte-perso" }
//     ]
//   }
// ]
```

## Politiques RLS

### Lecture (SELECT)
- ✅ Utilisateurs authentifiés peuvent voir les liens de leurs propres services
- ✅ Public peut voir les liens des services publiés

### Écriture (INSERT/UPDATE/DELETE)
- ✅ Utilisateurs peuvent créer/modifier/supprimer les liens de leurs services
- ✅ Vérification que la carte appartient bien à l'utilisateur
- ❌ Impossible de lier un service à la carte d'un autre utilisateur

## Migration

### Appliquer la migration

**Via Supabase CLI :**
```bash
supabase db push
```

**Via Dashboard Supabase :**
1. Aller dans SQL Editor
2. Copier le contenu de `20251016_create_service_cards_junction.sql`
3. Exécuter

### Rollback (si nécessaire)

```sql
-- Supprimer la table
DROP TABLE IF EXISTS service_cards CASCADE;
```

## Cas d'usage

### 1. Service disponible sur toutes les cartes
Ne pas créer de liens dans `service_cards`. Le service sera considéré comme global.

### 2. Service spécifique à certaines cartes
Créer des liens uniquement pour les cartes concernées :
```typescript
await PortfolioService.updateServiceCards(serviceId, [cardId1, cardId2]);
```

### 3. Filtrage par carte sur la page publique
```typescript
// Afficher uniquement les services de cette carte
const cardServices = await PortfolioService.getPublishedCardServices(cardId);
```

### 4. Service non associé mais publié
Si un service est publié mais n'a aucune carte associée, il peut être affiché :
- Comme service global sur toutes les cartes de l'utilisateur
- Uniquement sur une page dédiée au portfolio

## Performance

### Optimisations implémentées

1. **Indexes sur clés étrangères**
   ```sql
   CREATE INDEX idx_service_cards_service_id ON service_cards(service_id);
   CREATE INDEX idx_service_cards_card_id ON service_cards(card_id);
   ```

2. **Chargement en batch**
   - `getUserServicesWithCards()` charge tous les services, cartes et liens en 3 requêtes
   - Utilise des Maps pour combiner les données efficacement

3. **Contrainte d'unicité**
   - Empêche les doublons au niveau de la base de données
   - Améliore les performances des jointures

## Cohérence avec l'existant

### Compatibilité avec `card_id` dans `portfolio_services`

Le champ `card_id` dans la table `portfolio_services` reste disponible pour :
- Rétrocompatibilité
- Cas d'usage où un service a une "carte principale"

**Recommandation :** Utiliser la nouvelle table de jonction `service_cards` pour toutes les nouvelles implémentations.

## Améliorations futures

1. **Drag & Drop** pour réorganiser les cartes associées
2. **Copie de service** vers d'autres cartes en un clic
3. **Prévisualisation** du service tel qu'il apparaîtra sur chaque carte
4. **Analytics** : tracking des performances par carte
5. **Templates de services** avec suggestions de cartes adaptées

## Support et dépannage

### Problème : Les cartes ne s'affichent pas dans le sélecteur

**Vérification :**
```typescript
// 1. Vérifier que l'utilisateur a des cartes
const { data: cards } = await supabase
  .from('business_cards')
  .select('*')
  .eq('user_id', userId);

console.log('Cartes disponibles:', cards);
```

### Problème : Erreur lors de la sauvegarde des liens

**Vérification :**
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'service_cards';

-- Vérifier que les cartes appartiennent à l'utilisateur
SELECT * FROM business_cards WHERE id = ANY(ARRAY['card-id-1', 'card-id-2']);
```

### Problème : Les services n'apparaissent pas sur une carte

**Vérification :**
```typescript
// 1. Vérifier les liens existants
const cardIds = await PortfolioService.getServiceCards(serviceId);
console.log('Cartes liées:', cardIds);

// 2. Vérifier que le service est publié
const service = await PortfolioService.getService(serviceId);
console.log('Service publié?:', service.is_published);
```

## Résumé

La fonctionnalité de liaison services-cartes offre :
- ✅ **Flexibilité** : Lier un service à une ou plusieurs cartes
- ✅ **User-friendly** : Interface intuitive avec recherche et sélection multiple
- ✅ **Performance** : Optimisations avec indexes et chargement en batch
- ✅ **Sécurité** : RLS complet avec vérifications strictes
- ✅ **Évolutivité** : Architecture extensible pour futures fonctionnalités

---

**Fichiers modifiés :**
- `supabase/migrations/20251016_create_service_cards_junction.sql`
- `src/services/portfolioService.ts`
- `src/components/portfolio/CardSelector.tsx`
- `src/pages/portfolio/PortfolioServicesSettings.tsx`
