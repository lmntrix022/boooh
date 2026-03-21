# Système de Traçabilité des Stocks - Documentation

## Vue d'ensemble

Le système de traçabilité des stocks de Booh offre une gestion complète et un historique détaillé de tous les mouvements de stock pour chaque produit de la Marketplace. Ce système permet aux utilisateurs de :

- ✅ Suivre chaque mouvement de stock (ventes, réapprovisionnements, ajustements)
- ✅ Auditer les écarts d'inventaire
- ✅ Planifier le réapprovisionnement
- ✅ Exporter l'historique en CSV pour analyse
- ✅ Identifier les causes de variations de stock

## Architecture du Système

### 1. Table `stock_movements`

La table `stock_movements` enregistre automatiquement tous les mouvements de stock avec les informations suivantes :

```typescript
interface StockMovement {
  id: string;                          // Identifiant unique
  product_id: string;                  // ID du produit concerné
  card_id: string;                     // ID de la carte de visite
  movement_type: StockMovementType;    // Type de mouvement
  quantity: number;                    // Quantité (positive ou négative)
  stock_before: number;                // Stock avant le mouvement
  stock_after: number;                 // Stock après le mouvement
  reason: string | null;               // Raison du mouvement
  reference_id: string | null;         // Référence externe (commande, etc.)
  reference_type: string | null;       // Type de référence
  notes: string | null;                // Notes supplémentaires
  operator_id: string | null;          // ID de l'utilisateur ayant effectué le mouvement
  created_at: string;                  // Date et heure du mouvement
}
```

### 2. Types de Mouvements

| Type | Description | Déclencheur | Quantité |
|------|-------------|-------------|----------|
| `sale` | **Sortie (Vente)** | Commande client payée et confirmée | Négative (-) |
| `purchase` | **Entrée (Réapprovisionnement)** | Ajout manuel de stock ou réception | Positive (+) |
| `adjustment` | **Ajustement** | Correction manuelle (perte, dommage, inventaire) | Variable |
| `initial_stock` | **Stock Initial** | Activation de la gestion de stock | Positive (+) |

### 3. Composants Principaux

#### `StockMovementHistory`
Composant d'affichage de l'historique des mouvements de stock.

**Localisation** : `src/components/stock/StockMovementHistory.tsx`

**Fonctionnalités** :
- Affichage chronologique des mouvements (du plus récent au plus ancien)
- Filtrage par type de mouvement
- Recherche par raison, référence ou notes
- Statistiques en temps réel (entrées, sorties, ajustements, stock actuel)
- Export CSV de l'historique
- Actualisation en temps réel

**Utilisation** :
```tsx
import StockMovementHistory from '@/components/stock/StockMovementHistory';

<StockMovementHistory
  productId="product-uuid"
  cardId="card-uuid"
  productName="Nom du produit"
/>
```

#### `StockAdjustmentDialog`
Dialogue pour effectuer des ajustements manuels de stock.

**Localisation** : `src/components/stock/StockAdjustmentDialog.tsx`

**Fonctionnalités** :
- 3 types d'ajustements :
  - **Ajouter** : Ajoute une quantité au stock actuel
  - **Retirer** : Retire une quantité du stock actuel
  - **Définir** : Définit le stock total (ajustement absolu)
- Raisons prédéfinies pour traçabilité
- Champs de référence et notes
- Validation des données avant soumission
- Aperçu en temps réel du nouveau stock

**Utilisation** :
```tsx
import StockAdjustmentDialog from '@/components/stock/StockAdjustmentDialog';

const [adjustmentOpen, setAdjustmentOpen] = useState(false);

<StockAdjustmentDialog
  open={adjustmentOpen}
  onOpenChange={setAdjustmentOpen}
  productId="product-uuid"
  cardId="card-uuid"
  productName="Nom du produit"
  currentStock={42}
  onSuccess={() => {
    // Rafraîchir les données
    loadProductStock();
  }}
/>
```

## Guide d'Utilisation

### 1. Enregistrement Automatique des Ventes

Lorsqu'une commande client est confirmée et payée, le système enregistre automatiquement un mouvement de type `sale` :

```typescript
// Exemple de code dans le processus de commande
const { error } = await supabase
  .from('stock_movements')
  .insert({
    product_id: productId,
    card_id: cardId,
    movement_type: 'sale',
    quantity: -quantityOrdered,  // Négatif pour sortie
    stock_before: currentStock,
    stock_after: currentStock - quantityOrdered,
    reason: 'Vente client',
    reference_id: orderId,
    reference_type: 'order',
    notes: `Commande ${orderType} - ${orderId}`,
    operator_id: null  // Null pour ventes automatiques
  });
```

### 2. Réapprovisionnement Manuel

L'utilisateur peut ajouter du stock manuellement via le dialogue d'ajustement :

1. Ouvrir le dialogue d'ajustement
2. Sélectionner "Ajouter"
3. Entrer la quantité reçue
4. Sélectionner la raison (ex: "Réception fournisseur")
5. Optionnel : Ajouter une référence (bon de livraison, facture)
6. Valider

### 3. Ajustement pour Inventaire Physique

Lorsqu'un inventaire physique révèle un écart :

1. Ouvrir le dialogue d'ajustement
2. Sélectionner "Définir" pour fixer le stock total
3. Entrer le stock réel compté
4. Sélectionner "Inventaire physique" comme raison
5. Ajouter des notes expliquant l'écart si nécessaire
6. Valider

### 4. Gestion des Pertes et Dommages

Pour enregistrer des produits perdus ou endommagés :

1. Ouvrir le dialogue d'ajustement
2. Sélectionner "Retirer"
3. Entrer la quantité perdue/endommagée
4. Sélectionner la raison appropriée :
   - "Produit endommagé" pour dommages
   - "Perte ou vol" pour pertes
   - "Périmé" pour produits hors date
5. Ajouter des détails dans les notes
6. Valider

## Audit et Analyse

### Vérification de l'Exactitude du Stock

Pour vérifier si le stock système correspond au stock physique :

1. Accéder à l'historique des mouvements du produit
2. Vérifier le "Stock Actuel" affiché dans les statistiques
3. Comparer avec le comptage physique
4. En cas d'écart :
   - Consulter l'historique pour identifier la source
   - Effectuer un ajustement "Inventaire physique"
   - Documenter l'écart dans les notes

### Export pour Analyse

L'historique peut être exporté en CSV pour :
- Analyse dans Excel/Google Sheets
- Intégration avec d'autres systèmes
- Archivage comptable
- Audits externes

**Format CSV** :
```
Date,Type,Quantité,Stock Avant,Stock Après,Raison,Référence,Notes
07/10/2025 15:31,"Sortie (Vente)",-6,14,8,"marketplace_purchase","",""
```

### Filtrage et Recherche

Utilisez les outils de filtrage pour :
- **Par type** : Voir uniquement les ventes, entrées ou ajustements
- **Par recherche** : Trouver des mouvements spécifiques par mots-clés
- **Par période** : Analyser une période donnée (via filtres de date futurs)

## Raisons d'Ajustement Prédéfinies

Le système propose 7 raisons standard :

| Raison | Description | Cas d'usage |
|--------|-------------|-------------|
| **Produit endommagé** | Dommage ou détérioration | Produits cassés, abîmés lors du transport |
| **Perte ou vol** | Produit perdu ou volé | Vol, perte en entrepôt |
| **Inventaire physique** | Correction suite à inventaire | Écart découvert lors d'un comptage |
| **Retour** | Retour client ou fournisseur | Retours de marchandises |
| **Périmé** | Produit périmé ou hors date | Produits alimentaires, cosmétiques |
| **Correction d'erreur** | Correction d'une erreur de saisie | Erreur humaine dans le système |
| **Autre raison** | Autre (préciser dans notes) | Cas non couvert par les autres raisons |

## Bonnes Pratiques

### 1. Documentation des Mouvements

- ✅ **Toujours** sélectionner une raison appropriée
- ✅ Ajouter une référence quand disponible (bon, facture, etc.)
- ✅ Documenter les ajustements importants dans les notes
- ✅ Être précis et factuel dans les descriptions

### 2. Fréquence des Inventaires

- Effectuer des inventaires physiques réguliers
- Comparer avec l'historique système
- Ajuster immédiatement en cas d'écart
- Documenter les causes d'écarts récurrents

### 3. Sécurité et Traçabilité

- Chaque mouvement est tracé avec l'ID de l'opérateur
- Les horodatages sont automatiques et immuables
- L'historique ne peut pas être modifié (insert only)
- Garder une trace de tous les ajustements manuels

### 4. Planification du Réapprovisionnement

Utilisez les statistiques pour :
- Identifier les produits à forte rotation (nombreuses sorties)
- Anticiper les ruptures de stock
- Optimiser les commandes fournisseurs
- Analyser les tendances de vente

## Intégration Future

Le système est conçu pour être extensible :

### Alertes Automatiques
```typescript
// Futur : Alertes automatiques de stock bas
if (newStock <= minStockThreshold) {
  // Envoyer notification
  sendLowStockAlert(productId, newStock, minStockThreshold);
}
```

### Prévisions
```typescript
// Futur : Calcul du taux de rotation
const rotationRate = totalOut / averageStock;
const daysUntilStockout = currentStock / dailySalesAverage;
```

### Intégrations Tierces
- Export vers systèmes ERP
- Synchronisation avec comptabilité
- API pour partenaires logistiques

## Support et Dépannage

### Problèmes Courants

**Q: L'historique n'apparaît pas**
- Vérifier que le produit a un ID valide
- Vérifier les permissions de l'utilisateur
- Rafraîchir la page

**Q: Le stock ne correspond pas à l'historique**
- Vérifier le dernier mouvement (`stock_after`)
- Chercher les mouvements non affichés (filtres actifs?)
- Effectuer un ajustement "Inventaire physique"

**Q: Impossible d'effectuer un ajustement**
- Vérifier que tous les champs obligatoires sont remplis
- Vérifier la quantité (doit être > 0)
- Vérifier les permissions de l'utilisateur

### Contact

Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.

---

**Version** : 1.0
**Dernière mise à jour** : 10 janvier 2025
**Auteur** : Équipe Booh Development
