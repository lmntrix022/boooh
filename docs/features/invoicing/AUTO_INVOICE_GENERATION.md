# Génération Automatique de Factures pour Inquiries Completed

## 🎯 Fonctionnalité

**Toutes les demandes (inquiries) avec le statut `completed` doivent avoir une facture.**

Ce système surveille en temps réel les `product_inquiries` et `digital_inquiries` avec statut `completed` et permet de générer automatiquement leurs factures en un clic.

---

## ✨ Nouvelles fonctionnalités ajoutées

### 1. **Hook de surveillance** - `useInquiryInvoiceSync`

Surveille automatiquement les demandes non facturées et met à jour le compteur en temps réel.

**Fichier:** [src/hooks/useInquiryInvoiceSync.ts](src/hooks/useInquiryInvoiceSync.ts)

**Fonctionnalités:**
- ✅ Surveillance temps réel avec Supabase Realtime
- ✅ Vérification périodique toutes les 30 secondes
- ✅ Compteur de demandes non facturées
- ✅ Génération automatique en masse
- ✅ Gestion d'erreurs détaillée

**Utilisation:**
```typescript
const {
  unbilledCount,      // Nombre de demandes sans facture
  isChecking,         // État de vérification
  autoGenerating,     // État de génération
  checkUnbilledInquiries,  // Fonction pour vérifier
  autoGenerateInvoices,    // Fonction pour générer
} = useInquiryInvoiceSync();
```

---

### 2. **Composant d'alerte** - `UnbilledInquiriesAlert`

Affiche une bannière d'alerte sur la page `/facture` quand des demandes `completed` n'ont pas de facture.

**Fichier:** [src/components/invoice/UnbilledInquiriesAlert.tsx](src/components/invoice/UnbilledInquiriesAlert.tsx)

**Apparence:**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Demandes en attente de facturation    [5]      │
│                                                      │
│  📄 Vous avez 5 demandes avec le statut             │
│     "completed" qui ne sont pas encore facturées.   │
│                                                      │
│  [⚡ Générer toutes les factures automatiquement]   │
│  [✕ Masquer]                                        │
│                                                      │
│  💡 Les factures seront générées avec les prix      │
│     actuels des produits.                           │
└─────────────────────────────────────────────────────┘
```

**Actions disponibles:**
- **Générer automatiquement** : Crée toutes les factures en un clic
- **Masquer** : Cache l'alerte (temporaire, réapparaît au rechargement)

---

### 3. **Intégration dans la page Facture**

**Fichier:** [src/pages/Facture.tsx](src/pages/Facture.tsx)

Le composant `UnbilledInquiriesAlert` s'affiche automatiquement en haut de la page quand il y a des demandes non facturées.

**Position:** Juste après le header, avant les boutons d'action.

---

## 🔄 Workflow automatique

### Scénario 1 : Surveillance passive

```
1. Client fait une demande → status: pending
2. Vous traitez → status: processing
3. Terminé → status: completed
   ↓
   [AUTOMATIQUE] Le hook détecte la nouvelle inquiry completed
   ↓
4. Alerte apparaît sur /facture : "1 demande en attente"
   ↓
5. Vous cliquez "Générer automatiquement"
   ↓
6. Facture créée automatiquement
   ↓
7. Alerte disparaît
```

### Scénario 2 : Génération en masse

```
Vous avez 10 demandes completed non facturées
   ↓
1. Ouvrir /facture
   ↓
2. Alerte affiche : "10 demandes en attente de facturation"
   ↓
3. Cliquer "⚡ Générer toutes les factures automatiquement"
   ↓
4. Dialog de confirmation :
   "Cette action va générer 10 factures automatiquement"
   ↓
5. Cliquer "Générer 10 factures"
   ↓
6. Génération en cours... (loader)
   ↓
7. Toast : "10 factures générées avec succès"
   ↓
8. Alerte disparaît
   ↓
9. Liste des factures se recharge automatiquement
```

---

## 🎨 Design de l'alerte

### Couleurs
- **Fond** : Dégradé orange-jaune (`from-orange-50 to-yellow-50`)
- **Bordure** : Orange (`border-orange-200`)
- **Icône** : Dégradé orange-jaune circulaire
- **Badge compteur** : Orange vif (`bg-orange-500`)

### Animation
- Apparition : Slide down + fade in (0.3s)
- Disparition : Slide up + fade out (0.3s)

---

## 🔍 Surveillance en temps réel

### Supabase Realtime

Le hook s'abonne aux changements sur les tables :

```typescript
// Écoute product_inquiries
supabase
  .channel('product_inquiries_changes')
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'product_inquiries',
    filter: 'status=eq.completed',
  }, payload => {
    // Recharger le compteur
    checkUnbilledInquiries();
  })
  .subscribe();

// Écoute digital_inquiries
supabase
  .channel('digital_inquiries_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'digital_inquiries',
    filter: 'status=eq.completed',
  }, payload => {
    checkUnbilledInquiries();
  })
  .subscribe();
```

**Déclencheurs:**
- Nouvelle inquiry avec status `completed`
- Mise à jour du status vers `completed`
- Suppression d'une inquiry `completed`
- Ajout d'un `invoice_id` à une inquiry

---

## 📊 Génération automatique - Détails

### Processus pour chaque inquiry

```typescript
for (const inquiry of unbilledInquiries) {
  // 1. Vérifier le type (product ou digital)
  const type = inquiry.type;

  // 2. Récupérer les infos du produit
  const product = inquiry.products || inquiry.digital_products;

  // 3. Préparer les données de facture
  const invoiceData = {
    client_name: inquiry.client_name,
    client_email: inquiry.client_email,
    client_phone: inquiry.client_phone,
    items: [{
      description: product.name || product.title,
      quantity: inquiry.quantity,
      unit_price_ht: product.price,
      vat_rate: settings.default_vat_rate,
      // Calculs automatiques HT/TVA/TTC
    }]
  };

  // 4. Créer la facture
  const invoice = await InvoiceService.createInvoiceFromInquiry(
    userId,
    inquiry.id,
    type
  );

  // 5. Lier inquiry → facture
  // inquiry.invoice_id = invoice.id (automatique)
}
```

### Gestion des erreurs

Si une facture échoue, les autres continuent :

```typescript
{
  success: 8,      // 8 factures créées
  errors: 2,       // 2 erreurs
  details: [
    { inquiryId: "...", invoiceNumber: "FAC-2025-001", status: "success" },
    { inquiryId: "...", status: "error", error: "Product not found" },
    // ...
  ]
}
```

**Toast affiché:**
- ✅ Succès : "8 factures générées avec succès"
- ⚠️ Erreurs : "2 erreurs lors de la génération"

---

## 🎯 Règles de génération

### Statut requis
- ✅ `status = 'completed'`
- ❌ `status = 'pending'` → Pas facturables
- ❌ `status = 'processing'` → Pas facturables
- ❌ `status = 'cancelled'` → Pas facturables

### Conditions de facturation
- ✅ `invoice_id IS NULL` (pas déjà facturée)
- ✅ Produit existe et a un prix
- ✅ Client a un nom (minimum)

### Calculs automatiques

**Prix HT** : `product.price` (depuis la table products/digital_products)

**Quantité** : `inquiry.quantity`

**Total HT** : `quantity × unit_price_ht`

**TVA** : `total_ht × (vat_rate / 100)` (18% par défaut en Côte d'Ivoire)

**Total TTC** : `total_ht + total_vat`

**Arrondis** : 2 décimales

---

## 🔧 Configuration

### Modifier le taux de TVA par défaut

Aller dans `/facture` → **Paramètres** (icône engrenage)

**Champ:** "Taux de TVA (%)"
**Valeur par défaut:** 18%

### Modifier le préfixe de facture

**Champ:** "Préfixe"
**Exemple:** `FAC-2025-`
**Résultat:** `FAC-2025-001`, `FAC-2025-002`, etc.

---

## 📈 Statistiques temps réel

Le hook met à jour le compteur automatiquement :

```typescript
// État initial
unbilledCount: 0

// Après détection
unbilledCount: 5  // 5 demandes non facturées

// Après génération
unbilledCount: 0  // Toutes facturées
```

**Fréquence de vérification:**
- ✅ Temps réel via Supabase Realtime (instant)
- ✅ Polling toutes les 30 secondes (backup)
- ✅ Au chargement de la page `/facture`
- ✅ Après génération de factures

---

## 🚀 Performance

### Optimisations implémentées

1. **Réutilisation de connexions**
   - Une seule instance du hook par session
   - Canaux Realtime partagés

2. **Debouncing**
   - Évite les vérifications multiples rapprochées
   - Max 1 check toutes les 30 secondes en polling

3. **Génération asynchrone**
   - Traitement parallèle (pas de blocage)
   - Affichage de progression

4. **Cache intelligent**
   - React Query gère le cache
   - Invalidation automatique après génération

---

## 🔍 Débogage

### Voir les demandes non facturées

```sql
-- Product inquiries sans facture
SELECT
  pi.id,
  pi.client_name,
  pi.status,
  pi.quantity,
  p.name as product_name,
  p.price,
  pi.invoice_id
FROM product_inquiries pi
LEFT JOIN products p ON pi.product_id = p.id
WHERE pi.status = 'completed'
AND pi.invoice_id IS NULL;

-- Digital inquiries sans facture
SELECT
  di.id,
  di.client_name,
  di.status,
  di.quantity,
  dp.title as product_name,
  dp.price,
  di.invoice_id
FROM digital_inquiries di
LEFT JOIN digital_products dp ON di.digital_product_id = dp.id
WHERE di.status = 'completed'
AND di.invoice_id IS NULL;
```

### Logs dans la console

Le hook affiche des logs utiles :

```javascript
// Changement détecté
console.log('Product inquiry changed:', payload);
console.log('Digital inquiry changed:', payload);

// Erreur de génération
console.error('Error generating invoice for inquiry ${inquiryId}:', error);

// Résultats
console.log('Auto-generation results:', { success, errors, details });
```

---

## ⚠️ Cas particuliers

### Produit supprimé

Si le produit n'existe plus dans la table `products` ou `digital_products` :
- ❌ La facture ne peut pas être générée
- ⚠️ Erreur affichée dans les détails
- 💡 Solution : Restaurer le produit ou créer la facture manuellement

### Prix à 0

Si `product.price = 0` ou `NULL` :
- ✅ La facture est créée quand même
- 💡 Prix HT = 0, TVA = 0, Total TTC = 0
- ⚠️ Vous pouvez l'éditer après pour corriger le prix

### Client sans email

Si `client_email` est vide :
- ✅ La facture est créée
- ⚠️ L'email ne sera pas pré-rempli
- 💡 Vous pouvez l'ajouter manuellement après

---

## 🎁 Avantages

### Pour vous (l'entreprise)

✅ **Gain de temps massif**
- Plus besoin de créer manuellement chaque facture
- 1 clic = toutes les factures générées

✅ **Aucun oubli**
- Alerte visible dès qu'il y a des demandes à facturer
- Surveillance temps réel

✅ **Cohérence**
- Prix toujours synchronisés avec les produits
- Calculs automatiques sans erreur

✅ **Traçabilité**
- Lien direct inquiry ↔ facture
- Historique complet

### Pour vos clients

✅ **Rapidité**
- Factures générées immédiatement après commande terminée

✅ **Précision**
- Informations correctes (nom, email, produit, prix)

✅ **Professionnalisme**
- Numérotation automatique
- Format standardisé

---

## 🔮 Prochaines améliorations possibles

### Court terme
- [ ] Notification email après génération automatique
- [ ] Envoi automatique de la facture au client
- [ ] Option "Auto-générer sans confirmation"

### Moyen terme
- [ ] Génération PDF automatique
- [ ] Webhook de notification externe
- [ ] Règles personnalisées (ex: auto-générer seulement si prix > 10000 FCFA)

### Long terme
- [ ] IA pour détection d'anomalies (prix incohérent, quantité inhabituelle)
- [ ] Facturation récurrente automatique
- [ ] Intégration comptable automatique

---

## 📞 Support

### Console navigateur (F12)

Vérifier les logs :
```javascript
// Hook initialisé
"Enhanced performance optimizations enabled"

// Nouveau changement
"Product inquiry changed: {...}"

// Compteur mis à jour
"Unbilled count: 5"
```

### Supabase Dashboard

**Realtime > Inspector**
- Vérifier que les channels sont actifs
- Voir les événements en direct

---

## 📚 Fichiers concernés

| Fichier | Rôle |
|---------|------|
| [src/hooks/useInquiryInvoiceSync.ts](src/hooks/useInquiryInvoiceSync.ts) | Hook de surveillance et génération |
| [src/components/invoice/UnbilledInquiriesAlert.tsx](src/components/invoice/UnbilledInquiriesAlert.tsx) | Composant d'alerte UI |
| [src/pages/Facture.tsx](src/pages/Facture.tsx) | Intégration dans la page |
| [src/services/invoiceService.ts](src/services/invoiceService.ts) | Fonctions de génération |

---

**Date de création** : 13 janvier 2025
**Version** : 1.0
**Statut** : ✅ Fonctionnel et prêt à l'emploi

**Toutes les demandes `completed` auront maintenant une facture! 🎉**
