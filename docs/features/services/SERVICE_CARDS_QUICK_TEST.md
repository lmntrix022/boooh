# Test rapide - Liaison Services-Cartes

## Prérequis

1. ✅ Migration appliquée : `20251016_create_service_cards_junction.sql`
2. ✅ Utilisateur connecté avec au moins 2 cartes de visite créées
3. ✅ Accès à `/portfolio/services`

## Checklist de test

### 1. Navigation vers la page Services
- [ ] Aller sur `/portfolio/services`
- [ ] La page se charge sans erreur
- [ ] Les services existants s'affichent (si existants)

### 2. Création d'un nouveau service

#### 2.1 Ouvrir le formulaire
- [ ] Cliquer sur "Ajouter un service"
- [ ] Le dialog s'ouvre avec tous les champs vides
- [ ] Le sélecteur de cartes est visible en bas du formulaire

#### 2.2 Remplir les informations de base
- [ ] Entrer un titre : "Service Test"
- [ ] Entrer une description
- [ ] Sélectionner une icône
- [ ] Définir le type de prix

#### 2.3 Sélectionner des cartes
- [ ] La section "Cartes associées" affiche vos cartes
- [ ] Cliquer dans le champ de recherche ouvre le dropdown
- [ ] Les cartes s'affichent avec checkbox et titre
- [ ] Sélectionner 2 cartes
- [ ] Les cartes sélectionnées apparaissent en badges au-dessus du champ
- [ ] Cliquer sur le X d'un badge retire la carte

#### 2.4 Actions rapides
- [ ] "Tout sélectionner" sélectionne toutes les cartes
- [ ] "Tout désélectionner" retire toutes les sélections

#### 2.5 Sauvegarder
- [ ] Cliquer sur "Créer"
- [ ] Toast de succès s'affiche
- [ ] Dialog se ferme
- [ ] Le nouveau service apparaît dans la liste

### 3. Affichage dans la liste

#### 3.1 Vérifier les badges
- [ ] Le service créé affiche les badges des cartes associées
- [ ] Les badges montrent l'icône CreditCard + nom de la carte
- [ ] Sur mobile, les badges s'affichent correctement (ml-13)
- [ ] Sur desktop, les badges s'affichent dans la zone des métadonnées

### 4. Édition d'un service

#### 4.1 Ouvrir l'édition
- [ ] Cliquer sur l'icône Pencil d'un service
- [ ] Le dialog s'ouvre avec les données du service
- [ ] Les cartes précédemment associées sont pré-sélectionnées
- [ ] Les badges des cartes sélectionnées s'affichent

#### 4.2 Modifier les associations
- [ ] Retirer une carte en cliquant sur son badge X
- [ ] Ajouter une nouvelle carte via le dropdown
- [ ] Les badges se mettent à jour instantanément

#### 4.3 Sauvegarder les modifications
- [ ] Cliquer sur "Mettre à jour"
- [ ] Toast de succès
- [ ] Les nouveaux badges s'affichent dans la liste

### 5. Service sans carte associée

#### 5.1 Créer un service global
- [ ] Créer un nouveau service
- [ ] Ne sélectionner aucune carte
- [ ] Sauvegarder
- [ ] Le service apparaît sans badges de cartes

### 6. Comportement responsive

#### 6.1 Mobile (< 640px)
- [ ] Les badges s'affichent sous le titre (ml-13)
- [ ] Le dropdown du sélecteur occupe toute la largeur
- [ ] Les actions "Tout sélectionner" sont accessibles

#### 6.2 Desktop (≥ 640px)
- [ ] Les badges s'affichent dans la zone des métadonnées
- [ ] Le dropdown a une largeur fixe
- [ ] L'interface est claire et aérée

### 7. Cas limites

#### 7.1 Aucune carte disponible
- [ ] Se connecter avec un compte sans cartes
- [ ] Ouvrir le formulaire de service
- [ ] Un message explicatif s'affiche : "Vous n'avez pas encore de cartes"

#### 7.2 Recherche de carte
- [ ] Ouvrir le dropdown
- [ ] Taper "test" dans la recherche
- [ ] Seules les cartes contenant "test" s'affichent
- [ ] Si aucune carte trouvée : "Aucune carte trouvée"

#### 7.3 Suppression de service
- [ ] Supprimer un service avec cartes associées
- [ ] Confirmation demandée
- [ ] Le service et ses liens sont supprimés (cascade)
- [ ] Pas d'erreur

### 8. Vérifications en base de données

```sql
-- 1. Vérifier la table service_cards
SELECT * FROM service_cards;

-- 2. Vérifier les liens d'un service spécifique
SELECT
  ps.title as service,
  bc.title as carte
FROM service_cards sc
JOIN portfolio_services ps ON ps.id = sc.service_id
JOIN business_cards bc ON bc.id = sc.card_id;

-- 3. Compter les services par carte
SELECT
  bc.title,
  COUNT(sc.service_id) as nombre_services
FROM business_cards bc
LEFT JOIN service_cards sc ON sc.card_id = bc.id
GROUP BY bc.id, bc.title;
```

### 9. Tests API (optionnel)

```typescript
// Dans la console du navigateur
import { PortfolioService } from '@/services/portfolioService';

// 1. Obtenir les services avec cartes
const services = await PortfolioService.getUserServicesWithCards(userId);
console.log('Services avec cartes:', services);

// 2. Obtenir les cartes d'un service
const cardIds = await PortfolioService.getServiceCards(serviceId);
console.log('Cartes du service:', cardIds);

// 3. Mettre à jour les liens
await PortfolioService.updateServiceCards(serviceId, [cardId1, cardId2]);

// 4. Services d'une carte
const cardServices = await PortfolioService.getPublishedCardServices(cardId);
console.log('Services de la carte:', cardServices);
```

## Résultats attendus

### ✅ Fonctionnalités core
- Création de service avec sélection de cartes
- Édition avec pré-sélection des cartes existantes
- Affichage des badges dans la liste
- Suppression en cascade

### ✅ UX/UI
- Interface intuitive et fluide
- Recherche réactive
- Actions rapides (tout sélectionner/désélectionner)
- Responsive sur mobile et desktop
- Messages d'aide clairs

### ✅ Performance
- Chargement rapide (3 requêtes max)
- Pas de lag lors de la sélection
- Mise à jour instantanée de l'UI

### ✅ Sécurité
- RLS empêche l'accès aux cartes d'autres users
- Validation côté serveur
- Aucune fuite de données

## Bugs potentiels à surveiller

1. **Dropdown reste ouvert** après sélection
   - Solution : `setIsOpen(false)` après sélection

2. **Badges ne s'affichent pas** après création
   - Vérifier que `invalidateQueries` utilise la bonne clé : `user-services-with-cards`

3. **Erreur 403 lors de la sauvegarde**
   - Vérifier les policies RLS
   - S'assurer que les cartes appartiennent à l'utilisateur

4. **Les cartes pré-sélectionnées ne s'affichent pas** en édition
   - Vérifier que `linked_cards` est bien chargé
   - Vérifier le mapping `service.linked_cards?.map(card => card.id)`

## Assistance rapide

### Erreur : "Cannot read property 'map' of undefined"
```typescript
// Dans CardSelector.tsx, ligne ~151
{service.linked_cards && service.linked_cards.length > 0 && (
  // Vérifier que cette condition existe
)}
```

### Les badges ne sont pas cliquables
```typescript
// Vérifier que le bouton X a le type="button"
<button type="button" onClick={...}>
```

### Migration non appliquée
```bash
# Vérifier si la table existe
psql -c "SELECT * FROM service_cards LIMIT 1;"

# Si erreur, appliquer la migration
supabase db push
```

## Validation finale

- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Aucune erreur TypeScript
- [ ] Performance acceptable (< 500ms pour charger les services)
- [ ] Fonctionne sur Chrome, Firefox, Safari
- [ ] Fonctionne sur mobile (iOS/Android)

---

**Date de test :** _______________
**Testeur :** _______________
**Résultat :** ⭕ Pass / ❌ Fail
**Notes :** _______________
