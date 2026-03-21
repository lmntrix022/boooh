# Intégration Commandes ↔ Factures

## ✅ Ce qui a été ajouté

### 1. **Liaison Commandes → Factures**

Les factures peuvent maintenant être générées automatiquement à partir des commandes existantes.

#### Nouvelles fonctionnalités du service (`invoiceService.ts`)

- **`getUnbilledOrders(userId)`** : Récupère toutes les commandes complétées non facturées
- **`createInvoiceFromOrder(userId, orderId)`** : Génère automatiquement une facture depuis une commande
- **`isOrderBilled(orderId)`** : Vérifie si une commande a déjà une facture

### 2. **Interface utilisateur améliorée**

#### Sélecteur de commande dans le formulaire de facture

Quand vous créez une nouvelle facture, si vous avez des commandes non facturées :

1. **Une alerte bleue** s'affiche en haut du formulaire
2. **Un sélecteur déroulant** liste toutes les commandes non facturées
3. **Sélection automatique** : Les informations client et produits sont pré-remplies

```
┌─────────────────────────────────────────────┐
│  🛒 Lier à une commande existante           │
├─────────────────────────────────────────────┤
│  ⓘ Vous avez 5 commandes non facturées.    │
│     Sélectionnez-en une pour générer        │
│     automatiquement la facture.             │
│                                             │
│  📋 Sélectionner une commande               │
│  ┌─────────────────────────────────────┐   │
│  │ Commande #ORD-001 - Jean Dupont    │   │
│  │ Commande #ORD-002 - Marie Martin   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### Données automatiquement remplies

Quand vous sélectionnez une commande :
- ✅ **Client** : Nom, email, téléphone, adresse
- ✅ **Produits** : Liste complète avec quantités et prix
- ✅ **Calculs** : Totaux HT/TVA/TTC automatiques
- ✅ **Notes** : "Facture pour la commande #XXX"
- ✅ **Mode de paiement** : Repris depuis la commande

### 3. **Migration de base de données**

#### Fichier : `20250112_add_invoice_to_orders.sql`

Ajoute le champ `invoice_id` à la table `orders` pour lier chaque commande à sa facture.

```sql
ALTER TABLE orders
ADD COLUMN invoice_id UUID REFERENCES invoices(id);
```

## 🚀 Comment utiliser

### Scénario 1 : Générer une facture depuis une commande

1. Allez sur `/facture`
2. Cliquez sur **"+ Nouvelle facture"**
3. Si vous avez des commandes non facturées, le sélecteur apparaît
4. Sélectionnez une commande dans la liste
5. Le formulaire se remplit automatiquement
6. Cliquez sur **"Enregistrer"**
7. La commande est maintenant liée à la facture

### Scénario 2 : Créer une facture manuelle

1. Allez sur `/facture`
2. Cliquez sur **"+ Nouvelle facture"**
3. Laissez le sélecteur sur **"-- Créer une facture manuelle --"**
4. Remplissez manuellement le formulaire
5. Cliquez sur **"Enregistrer"**

### Scénario 3 : Réinitialiser après avoir sélectionné une commande

Si vous avez sélectionné une commande par erreur :
1. Cliquez sur **"Réinitialiser et créer manuellement"**
2. Le formulaire revient à zéro

## 📊 Flux de données

```
Commande (orders)
    │
    │ order_id
    ├──────────────────> Facture (invoices)
    │                        │
    │                        │ invoice_id
    │ <──────────────────────┘
    │
    └─ invoice_id (NULL si pas encore facturé)
```

## 🗃️ Structure des données

### Table `orders` (mise à jour)

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | ID de la commande |
| user_id | UUID | Propriétaire |
| customer_name | TEXT | Nom du client |
| customer_email | TEXT | Email |
| total_amount | NUMERIC | Montant total |
| status | TEXT | État (completed, pending...) |
| **invoice_id** | **UUID** | **Référence vers la facture** |

### Table `invoices`

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | ID de la facture |
| user_id | UUID | Propriétaire |
| **order_id** | **UUID** | **Référence vers la commande** |
| invoice_number | TEXT | Numéro de facture |
| client_name | TEXT | Nom du client |
| total_ttc | NUMERIC | Montant TTC |
| status | TEXT | État (draft, sent, paid...) |

## 🔧 Installation

### 1. Appliquer la migration SQL

```bash
# Via Supabase CLI
supabase db push

# Ou via le Dashboard Supabase
# Copiez le contenu de 20250112_add_invoice_to_orders.sql
# Puis collez dans SQL Editor > Run
```

### 2. Tester la fonctionnalité

```bash
# Le serveur dev doit tourner
npm run dev

# Ouvrez http://localhost:8080/facture
# Créez une nouvelle facture
# Le sélecteur de commandes apparaît si vous en avez
```

## 🎯 Avantages

✅ **Gain de temps** : Plus besoin de ressaisir les informations
✅ **Moins d'erreurs** : Données copiées automatiquement
✅ **Traçabilité** : Lien bidirectionnel commande ↔ facture
✅ **Comptabilité** : Factures liées aux commandes pour reporting
✅ **UX améliorée** : Interface intuitive et rapide

## 🔮 Prochaines étapes possibles

- [ ] Génération PDF avec référence commande
- [ ] Statistiques : "X commandes en attente de facturation"
- [ ] Factures groupées (plusieurs commandes → 1 facture)
- [ ] Alerte automatique : "Commande terminée, créer facture ?"
- [ ] Export comptable avec lien commande/facture

---

**Date de création** : 12 janvier 2025
**Version** : 1.0
**Statut** : ✅ Fonctionnel et testé
