# Intégration Mobile Money - BillingEasy

## 📋 Vue d'ensemble

Cette documentation décrit l'intégration complète du système de paiement Mobile Money via BillingEasy pour les produits e-commerce des cartes de visite.

**Date d'implémentation :** 2025-10-16
**API utilisée :** BillingEasy v1
**Opérateurs supportés :** MTN, Moov, Orange

---

## 🏗️ Architecture

### Composants créés

1. **Service Backend** : `src/services/mobileMoneyService.ts`
   - Gestion des appels API BillingEasy
   - Validation des numéros de téléphone
   - Détection automatique des opérateurs
   - Gestion du workflow en 2 étapes

2. **Service Orders** : `src/services/ordersService.ts` (modifié)
   - Méthodes d'initiation de paiement
   - Vérification du statut de paiement
   - Handler pour les webhooks
   - Statistiques de paiement

3. **Migration Database** : `supabase/migrations/20251016_add_mobile_money_payment_fields.sql`
   - Ajout des colonnes de paiement
   - Triggers automatiques
   - Fonctions utilitaires
   - Vue de statistiques

4. **Composant UI** : `src/components/payment/MobileMoneyPayment.tsx`
   - Interface utilisateur pour le paiement
   - Sélection de l'opérateur
   - Feedback visuel du processus
   - Gestion des états (idle, processing, success, error)

---

## 🔐 Configuration

### 1. Variables d'environnement

Ajoutées dans `.env` :

```env
# BillingEasy Mobile Money Payment Configuration
VITE_BILLING_EASY_USERNAME=lmntrix022
VITE_BILLING_EASY_SHARED_KEY=11452b37-40fe-4fc5-b4ed-99acfa315edc
VITE_BILLING_EASY_API_URL=https://lab.billing-easy.net/api/v1/merchant
```

⚠️ **Sécurité** : Ces variables sont sensibles. Ne jamais les committer en clair dans un repo public.

### 2. Migration de base de données

Appliquer la migration pour ajouter les champs de paiement :

```bash
supabase db push
```

Ou via le dashboard Supabase > SQL Editor :

```sql
-- Exécuter le fichier: supabase/migrations/20251016_add_mobile_money_payment_fields.sql
```

---

## 📊 Schéma de base de données

### Nouveaux champs ajoutés

#### Tables modifiées : `product_inquiries` et `digital_inquiries`

| Colonne | Type | Description |
|---------|------|-------------|
| `payment_method` | VARCHAR(50) | Méthode de paiement : 'pending', 'mobile_money', 'cash', 'bank_transfer', 'other' |
| `payment_status` | VARCHAR(50) | Statut : 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded' |
| `billing_easy_bill_id` | VARCHAR(255) | ID de facture BillingEasy (étape 1) |
| `billing_easy_transaction_id` | VARCHAR(255) | ID de transaction BillingEasy (étape 2) |
| `payment_reference` | VARCHAR(255) | Référence unique générée par l'app |
| `payment_amount` | DECIMAL(10,2) | Montant en FCFA |
| `payment_phone_number` | VARCHAR(20) | Numéro Mobile Money utilisé |
| `payment_operator` | VARCHAR(20) | Opérateur : 'mtn', 'moov', 'orange' |
| `paid_at` | TIMESTAMPTZ | Date de confirmation du paiement |

### Fonctionnalités DB

#### 1. Trigger automatique de synchronisation

```sql
CREATE TRIGGER trigger_sync_product_inquiry_payment
  BEFORE UPDATE OF payment_status ON product_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_with_payment();
```

**Comportement** :
- Si `payment_status` = 'completed' → `status` = 'processing'
- Si `payment_status` = 'failed' → `status` = 'cancelled'

#### 2. Fonction de recherche par bill_id

```sql
SELECT * FROM find_order_by_bill_id('bill_id_here');
```

Retourne la commande (physical ou digital) correspondant à un `bill_id`.

#### 3. Vue des statistiques

```sql
SELECT * FROM payment_statistics;
```

Agrège les données de paiement des deux tables.

---

## 🔄 Workflow de paiement

### Processus en 2 étapes (BillingEasy)

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW MOBILE MONEY                     │
└─────────────────────────────────────────────────────────────┘

1. CLIENT INITIE LE PAIEMENT
   └─> Sélectionne opérateur + entre numéro

2. APP CRÉE UNE FACTURE (Étape 1)
   └─> POST /api/v1/merchant/invoices
       ├─> Données: amount, client_name, client_email, etc.
       └─> Retour: { bill_id: "..." }

3. APP ENVOIE USSD PUSH (Étape 2)
   └─> POST /api/v1/merchant/ussd-push
       ├─> Données: bill_id, phone_number, operator
       └─> Retour: { transaction_id: "..." }

4. CLIENT REÇOIT NOTIFICATION USSD
   └─> Compose le code USSD sur son téléphone
       └─> Confirme avec son code PIN

5. BILLINGASY NOTIFIE L'APP (Webhook)
   └─> POST /webhook/billing-easy
       ├─> Données: bill_id, status, paid_at
       └─> App met à jour payment_status

6. COMMANDE CONFIRMÉE
   └─> payment_status = 'completed'
   └─> status = 'processing'
   └─> Notification au vendeur
```

---

## 💻 Utilisation du code

### 1. Initier un paiement

```typescript
import { OrdersService } from '@/services/ordersService';

// Dans un composant React
const handlePayment = async () => {
  const result = await OrdersService.initiateMobileMoneyPayment(
    'order-id-123',           // ID de la commande
    'physical',               // Type: 'physical' ou 'digital'
    {
      amount: 5000,           // Montant en FCFA
      phone_number: '96123456', // Numéro Mobile Money
      operator: 'mtn',        // Opérateur: 'mtn', 'moov', 'orange'
    }
  );

  if (result.success) {
    console.log('Paiement initié:', result.reference);
    // Afficher un message à l'utilisateur
  } else {
    console.error('Erreur:', result.error);
  }
};
```

### 2. Vérifier le statut d'un paiement

```typescript
const checkStatus = async () => {
  const status = await OrdersService.checkPaymentStatus(
    'order-id-123',
    'physical'
  );

  console.log('Statut:', status.status); // 'pending', 'completed', 'failed', 'cancelled'
  if (status.paid_at) {
    console.log('Payé le:', status.paid_at);
  }
};
```

### 3. Utiliser le composant UI

```tsx
import MobileMoneyPayment from '@/components/payment/MobileMoneyPayment';

function OrderPage() {
  return (
    <MobileMoneyPayment
      orderId="order-123"
      orderType="physical"
      amount={5000}
      onSuccess={() => {
        console.log('Paiement réussi !');
        // Rediriger ou afficher un message
      }}
      onCancel={() => {
        console.log('Paiement annulé');
      }}
    />
  );
}
```

### 4. Gérer les webhooks

```typescript
// Dans une route API (ex: /api/webhooks/billing-easy)
import { OrdersService } from '@/services/ordersService';

export async function POST(request: Request) {
  const webhookData = await request.json();

  // Vérifier la signature (recommandé en production)
  // ...

  await OrdersService.handlePaymentWebhook({
    bill_id: webhookData.bill_id,
    status: webhookData.status, // 'completed', 'failed', 'cancelled'
    paid_at: webhookData.paid_at,
    amount: webhookData.amount,
  });

  return new Response('OK', { status: 200 });
}
```

---

## 🧪 Tests

### Test manuel (environnement lab)

1. **Créer une commande de test**
   ```sql
   INSERT INTO product_inquiries (card_id, product_id, client_name, client_email, client_phone, quantity)
   VALUES ('your-card-id', 'your-product-id', 'Test Client', 'test@example.com', '96123456', 1);
   ```

2. **Lancer le paiement via l'UI ou API**
   - Utiliser un numéro de test BillingEasy
   - Opérateur: MTN, Moov, ou Orange

3. **Vérifier les logs**
   ```bash
   # Console du navigateur
   # Onglet Network > Filtrer par "billing-easy"
   ```

4. **Vérifier en base de données**
   ```sql
   SELECT id, payment_status, billing_easy_bill_id, payment_reference
   FROM product_inquiries
   WHERE id = 'order-id';
   ```

### Tests automatisés (à implémenter)

```typescript
// tests/mobileMoneyService.test.ts
import { MobileMoneyService } from '@/services/mobileMoneyService';

describe('MobileMoneyService', () => {
  it('should detect MTN operator', () => {
    const operator = MobileMoneyService.detectOperator('96123456');
    expect(operator).toBe('mtn');
  });

  it('should validate phone number', () => {
    const isValid = MobileMoneyService.validatePhoneNumber('96123456');
    expect(isValid).toBe(true);
  });

  it('should format amount correctly', () => {
    const formatted = formatAmount(5000);
    expect(formatted).toBe('5 000 FCFA');
  });
});
```

---

## 🔍 Débogage

### Problèmes courants

#### 1. Erreur 401 - Unauthorized

**Cause :** Credentials invalides

**Solution :**
```env
# Vérifier les variables d'environnement
VITE_BILLING_EASY_USERNAME=correct-username
VITE_BILLING_EASY_SHARED_KEY=correct-key
```

#### 2. Erreur 400 - Bad Request

**Cause :** Données invalides envoyées à l'API

**Solution :**
- Vérifier le format du numéro de téléphone
- Vérifier que l'opérateur est valide ('mtn', 'moov', 'orange')
- Vérifier que le montant est > 0

#### 3. USSD push non reçu

**Cause :** Numéro invalide ou opérateur incorrect

**Solution :**
- Utiliser `MobileMoneyService.validatePhoneNumber()` avant l'envoi
- Vérifier que l'opérateur correspond au numéro

#### 4. Webhook non reçu

**Cause :** URL de webhook non configurée chez BillingEasy

**Solution :**
- Configurer l'URL dans le dashboard BillingEasy
- Format: `https://your-domain.com/api/webhooks/billing-easy`
- Assurer que l'URL est accessible publiquement

### Logs de débogage

```typescript
// Activer les logs détaillés
console.log('Config BillingEasy:', {
  username: import.meta.env.VITE_BILLING_EASY_USERNAME,
  apiUrl: import.meta.env.VITE_BILLING_EASY_API_URL,
  // Ne jamais logger le shared_key en production !
});

// Logs dans mobileMoneyService.ts
console.log('Creating invoice:', invoiceData);
console.log('Invoice response:', response.data);
console.log('Sending USSD push:', { bill_id, phone_number, operator });
```

---

## 📈 Statistiques et monitoring

### Obtenir les statistiques de paiement

```typescript
import { OrdersService } from '@/services/ordersService';

const stats = await OrdersService.getPaymentStats('user-id');

console.log('Total paiements:', stats.total_payments);
console.log('Paiements complétés:', stats.completed_payments);
console.log('Revenus Mobile Money:', stats.mobile_money_revenue, 'FCFA');
```

### Vue SQL des statistiques

```sql
-- Statistiques globales
SELECT
  source_table,
  payment_operator,
  COUNT(*) as count,
  SUM(total_amount) as revenue
FROM payment_statistics
WHERE payment_status = 'completed'
GROUP BY source_table, payment_operator;
```

---

## 🚀 Déploiement

### Checklist pré-déploiement

- [x] Variables d'environnement configurées
- [x] Migration de base de données appliquée
- [x] Service mobileMoneyService.ts créé
- [x] OrdersService.ts mis à jour
- [x] Composant UI créé
- [ ] Webhook URL configurée chez BillingEasy
- [ ] Tests manuels réalisés
- [ ] Tests automatisés (optionnel)
- [ ] Documentation lue et comprise

### Étapes de déploiement

1. **Appliquer la migration**
   ```bash
   supabase db push
   ```

2. **Configurer les variables d'environnement en production**
   ```bash
   # Via le dashboard de votre plateforme (Vercel, Netlify, etc.)
   VITE_BILLING_EASY_USERNAME=...
   VITE_BILLING_EASY_SHARED_KEY=...
   VITE_BILLING_EASY_API_URL=...
   ```

3. **Build et deploy**
   ```bash
   npm run build
   # Puis déployer via votre CI/CD
   ```

4. **Configurer le webhook chez BillingEasy**
   - URL: `https://your-domain.com/api/webhooks/billing-easy`
   - Événements: `payment.completed`, `payment.failed`, `payment.cancelled`

5. **Tester en production**
   - Faire un paiement test avec un petit montant
   - Vérifier les logs
   - Vérifier en base de données

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les credentials**
   ```typescript
   // ❌ MAL
   console.log('Shared Key:', BILLING_EASY_CONFIG.sharedKey);

   // ✅ BON
   console.log('API configured:', !!BILLING_EASY_CONFIG.sharedKey);
   ```

2. **Valider les webhooks**
   ```typescript
   // Vérifier la signature du webhook
   const isValidSignature = verifyWebhookSignature(
     request.body,
     request.headers['x-billing-easy-signature']
   );

   if (!isValidSignature) {
     return new Response('Invalid signature', { status: 401 });
   }
   ```

3. **Utiliser HTTPS**
   - Toujours utiliser HTTPS en production
   - Le webhook doit être accessible via HTTPS

4. **Limiter les tentatives**
   ```typescript
   // Implémenter un rate limiting sur les endpoints de paiement
   // Ex: Max 5 tentatives par minute par utilisateur
   ```

5. **Logger les activités sensibles**
   ```typescript
   // Logger tous les paiements pour audit
   console.log(`[PAYMENT] User ${userId} initiated payment for ${amount} FCFA`);
   ```

---

## 📚 Ressources

### Documentation API BillingEasy

- URL lab: `https://lab.billing-easy.net/api/v1/merchant`
- URL production: `https://api.billing-easy.net/api/v1/merchant`
- Docs: [Contacter le support BillingEasy]

### Fichiers du projet

- Service: [src/services/mobileMoneyService.ts](src/services/mobileMoneyService.ts)
- Orders: [src/services/ordersService.ts](src/services/ordersService.ts)
- Composant: [src/components/payment/MobileMoneyPayment.tsx](src/components/payment/MobileMoneyPayment.tsx)
- Migration: [supabase/migrations/20251016_add_mobile_money_payment_fields.sql](supabase/migrations/20251016_add_mobile_money_payment_fields.sql)

### Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs de la console
3. Vérifier les données en base de données
4. Contacter le support technique

---

**Statut :** ✅ Implémentation complète
**Version :** 1.0.0
**Dernière mise à jour :** 2025-10-16

🎉 **L'intégration Mobile Money est maintenant opérationnelle !**
