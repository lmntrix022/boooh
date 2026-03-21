# Intégration Factures ↔ Demandes de Produits (Inquiries)

## ✅ Mise à jour du système de facturation

Le système de facturation a été mis à jour pour fonctionner avec les **vraies tables de demandes** de votre application : `product_inquiries` et `digital_inquiries`.

---

## 🔄 Changements effectués

### 1. **Migration de base de données**

#### Fichier : `supabase/migrations/20250113_add_invoice_to_inquiries.sql`

Ajout des colonnes `invoice_id` aux tables de demandes :

```sql
-- Ajouter invoice_id à product_inquiries
ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Ajouter invoice_id à digital_inquiries
ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
```

**Index créés** pour optimiser les performances :
- `idx_product_inquiries_invoice_id`
- `idx_digital_inquiries_invoice_id`
- `idx_product_inquiries_status`
- `idx_digital_inquiries_status`

---

### 2. **Service de facturation mis à jour**

#### Fichier : `src/services/invoiceService.ts`

#### Nouvelles fonctions :

##### `getUnbilledInquiries(userId: string)`
Récupère toutes les demandes non facturées (complétées) d'un utilisateur.

**Fonctionnement :**
1. Récupère toutes les cartes de l'utilisateur
2. Fetch `product_inquiries` avec statut `completed` et `invoice_id = null`
3. Fetch `digital_inquiries` avec statut `completed` et `invoice_id = null`
4. Joint les informations du produit (nom, prix, description)
5. Combine et trie par date de création

**Retour :**
```typescript
[
  {
    id: string,
    type: 'product' | 'digital',
    product_name: string,
    product_price: number,
    product_description: string,
    client_name: string,
    client_email: string,
    client_phone: string,
    quantity: number,
    status: 'completed',
    notes: string | null,
    created_at: string,
    // ... autres champs
  }
]
```

##### `createInvoiceFromInquiry(userId, inquiryId, inquiryType)`
Génère automatiquement une facture depuis une demande de produit.

**Paramètres :**
- `userId` : ID de l'utilisateur
- `inquiryId` : ID de la demande (`product_inquiries.id` ou `digital_inquiries.id`)
- `inquiryType` : `'product'` ou `'digital'`

**Processus :**
1. Récupère l'inquiry avec les informations du produit
2. Récupère les paramètres de facturation de l'utilisateur
3. Calcule les totaux HT/TVA/TTC
4. Crée la facture avec un numéro auto-généré
5. Met à jour l'inquiry avec `invoice_id`

##### `isInquiryBilled(inquiryId, inquiryType)`
Vérifie si une demande a déjà été facturée.

**Retour :** `boolean`

---

### 3. **Formulaire de facture amélioré**

#### Fichier : `src/components/invoice/InvoiceForm.tsx`

#### Changements UI :

**Sélecteur de demandes** au lieu de commandes :
```tsx
{!invoice && unbilledInquiries.length > 0 && (
  <Card>
    <Alert>
      Vous avez {unbilledInquiries.length} demande(s) non facturée(s).
    </Alert>
    <Select value={selectedInquiryId} onValueChange={handleInquirySelect}>
      {unbilledInquiries.map((inquiry) => (
        <SelectItem key={inquiry.id} value={inquiry.id}>
          {inquiry.product_name} - {inquiry.client_name}
          Badge: {inquiry.type === 'product' ? 'Produit' : 'Numérique'}
        </SelectItem>
      ))}
    </Select>
  </Card>
)}
```

**Affichage amélioré** des demandes :
- Nom du produit
- Badge type (Produit / Numérique)
- Nom du client
- Quantité
- Prix total calculé

---

## 📊 Structure des données

### Tables `product_inquiries` et `digital_inquiries`

#### Colonnes existantes :
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | ID unique |
| card_id | UUID | Référence vers la carte business |
| product_id / digital_product_id | UUID | Référence vers le produit |
| client_name | TEXT | Nom du client |
| client_email | TEXT | Email |
| client_phone | TEXT | Téléphone |
| quantity | INTEGER | Quantité demandée |
| status | TEXT | État (`pending`, `processing`, `completed`, `cancelled`) |
| notes | TEXT | Notes additionnelles |
| created_at | TIMESTAMP | Date de création |

#### **Nouvelle colonne ajoutée :**
| Champ | Type | Description |
|-------|------|-------------|
| **invoice_id** | **UUID** | **Référence vers la facture générée** |

---

## 🚀 Comment utiliser

### Scénario 1 : Créer une facture depuis une demande

1. Aller sur `/facture`
2. Cliquer **"+ Nouvelle facture"**
3. Si vous avez des demandes complétées non facturées, un sélecteur apparaît
4. Sélectionner une demande dans la liste
5. Le formulaire se pré-remplit automatiquement :
   - ✅ **Client** : Nom, email, téléphone
   - ✅ **Produit** : Nom, quantité, prix
   - ✅ **Calculs** : Totaux HT/TVA/TTC
   - ✅ **Notes** : Description du produit + notes de la demande
6. Ajuster si nécessaire
7. Cliquer **"Enregistrer"**
8. La demande est maintenant liée à la facture

### Scénario 2 : Créer une facture manuelle

1. Aller sur `/facture`
2. Cliquer **"+ Nouvelle facture"**
3. Laisser le sélecteur sur **"-- Créer une facture manuelle --"**
4. Remplir manuellement tous les champs
5. Cliquer **"Enregistrer"**

---

## 🔗 Flux de données

```
Product Inquiry (product_inquiries)
    │
    │ product_id
    ├──────────────────> Product (products)
    │                        │
    │                        └─ name, price, description
    │
    │ invoice_id
    └──────────────────> Invoice (invoices)
                             │
                             └─ invoice_items

Digital Inquiry (digital_inquiries)
    │
    │ digital_product_id
    ├──────────────────> Digital Product (digital_products)
    │                        │
    │                        └─ title, price, description
    │
    │ invoice_id
    └──────────────────> Invoice (invoices)
                             │
                             └─ invoice_items
```

---

## 📝 Exemple de données

### Demande de produit (`product_inquiries`)
```json
{
  "id": "3a4f1aa3-d5ec-45c8-a599-07c92d0f799d",
  "product_id": "7cf2001a-bf23-4e9c-9643-3da6db92d372",
  "card_id": "382fe29b-fb97-40bc-a674-b5362375eee6",
  "client_name": "Ondiang Ondo Henry Martin",
  "client_email": "h3o@gmail.com",
  "client_phone": "0659990999",
  "quantity": 4,
  "status": "completed",
  "invoice_id": null,  ← Devient UUID après facturation
  "created_at": "2025-10-04 16:39:04"
}
```

### Facture générée (`invoices`)
```json
{
  "id": "invoice-uuid",
  "user_id": "user-uuid",
  "invoice_number": "FAC-2025-001",
  "client_name": "Ondiang Ondo Henry Martin",
  "client_email": "h3o@gmail.com",
  "client_phone": "0659990999",
  "order_id": "3a4f1aa3-d5ec-45c8-a599-07c92d0f799d",  ← Référence inquiry
  "total_ttc": 50000,
  "status": "draft",
  "created_at": "2025-01-13"
}
```

---

## 🔍 Différences avec l'ancienne version

| Avant | Après |
|-------|-------|
| Table `orders` (inexistante) | Tables `product_inquiries` + `digital_inquiries` |
| `order_items` (inexistants) | Produit unique par inquiry |
| `getUnbilledOrders()` | `getUnbilledInquiries()` |
| `createInvoiceFromOrder()` | `createInvoiceFromInquiry()` |
| `isOrderBilled()` | `isInquiryBilled()` |
| Commandes avec plusieurs items | Une inquiry = 1 produit + quantité |

---

## ⚙️ Installation

### 1. Appliquer la migration SQL

```bash
# Via Supabase CLI
cd supabase
supabase db push

# Ou via le Dashboard Supabase
# 1. Aller dans SQL Editor
# 2. Copier le contenu de 20250113_add_invoice_to_inquiries.sql
# 3. Exécuter
```

### 2. Vérifier les modifications

```sql
-- Vérifier les colonnes ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_inquiries'
AND column_name = 'invoice_id';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'digital_inquiries'
AND column_name = 'invoice_id';
```

### 3. Tester l'application

```bash
npm run dev
# Ouvrir http://localhost:8080/facture
```

---

## 🎯 Fonctionnalités

### ✅ Implémenté
- [x] Récupération des demandes non facturées (complétées uniquement)
- [x] Distinction produits physiques / numériques
- [x] Pré-remplissage automatique du formulaire
- [x] Calcul automatique HT/TVA/TTC
- [x] Liaison bidirectionnelle inquiry ↔ facture
- [x] Affichage des demandes avec badge type
- [x] Filtrage par statut `completed`
- [x] Support multi-cartes par utilisateur

### ⚠️ À implémenter
- [ ] Factures groupées (plusieurs inquiries → 1 facture)
- [ ] Génération PDF avec référence produit
- [ ] Envoi email au client
- [ ] Notification automatique après demande complétée
- [ ] Statistiques : "X demandes en attente de facturation"

---

## 🐛 Points d'attention

### Statut des demandes
Seules les demandes avec **statut `completed`** sont récupérées pour facturation.

**Statuts possibles :**
- `pending` : En attente (non facturables)
- `processing` : En traitement (non facturables)
- `completed` : Terminées ✅ (facturables)
- `cancelled` : Annulées (non facturables)

### Prix des produits
Les prix sont récupérés depuis les tables `products` et `digital_products`. Assurez-vous que ces prix sont à jour.

### Multi-cartes
Un utilisateur peut avoir plusieurs cartes business. Le système récupère les demandes de **toutes ses cartes**.

---

## 🔮 Améliorations futures possibles

1. **Dashboard de facturation**
   - Widget : "X demandes en attente de facturation"
   - Rappel automatique après 30 jours

2. **Workflow automatisé**
   - Génération automatique de facture après `status = completed`
   - Option : "Générer facture automatiquement"

3. **Factures groupées**
   - Sélection multiple de demandes
   - Regroupement par client
   - Une facture pour plusieurs produits

4. **Intégration paiement**
   - Lier statut `paid` de facture à l'inquiry
   - Webhook de confirmation de paiement

5. **Export comptable**
   - Export avec référence inquiry
   - Format FEC (Fichier des Écritures Comptables)

---

## 📚 Documentation liée

- [CLAUDE.md](./CLAUDE.md) - Documentation générale du projet
- [INVOICE_ORDER_INTEGRATION.md](./INVOICE_ORDER_INTEGRATION.md) - Ancienne intégration (obsolète)
- [supabase/migrations/20250113_add_invoice_to_inquiries.sql](./supabase/migrations/20250113_add_invoice_to_inquiries.sql) - Migration SQL

---

## 📞 Support

En cas de problème :
1. Vérifier que la migration SQL a bien été appliquée
2. Vérifier les RLS policies sur `product_inquiries` et `digital_inquiries`
3. Consulter la console navigateur pour les erreurs
4. Vérifier les logs Supabase

---

**Date de création** : 13 janvier 2025
**Version** : 2.0
**Statut** : ✅ Fonctionnel et testé
**Remplace** : `INVOICE_ORDER_INTEGRATION.md` (système basé sur `orders`)
