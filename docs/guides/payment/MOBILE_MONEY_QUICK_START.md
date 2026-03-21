# Guide de démarrage rapide - Mobile Money

## 🚀 Mise en place en 5 minutes

### Étape 1 : Appliquer la migration (30 secondes)

```bash
cd /Users/quantinekouaghe/Downloads/boooh-main
supabase db push
```

✅ Cela ajoute automatiquement tous les champs de paiement nécessaires.

---

### Étape 2 : Installer axios si nécessaire (30 secondes)

```bash
npm install axios
```

---

### Étape 3 : Intégrer dans une page produit (2 minutes)

#### Exemple : Ajouter le paiement à une page de commande

```tsx
import React, { useState } from 'react';
import MobileMoneyPayment from '@/components/payment/MobileMoneyPayment';
import { Button } from '@/components/ui/button';

function ProductOrderPage({ product, orderId }) {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div>
      {/* Informations du produit */}
      <h1>{product.name}</h1>
      <p>Prix: {product.price} FCFA</p>

      {/* Bouton pour lancer le paiement */}
      {!showPayment ? (
        <Button onClick={() => setShowPayment(true)}>
          Payer avec Mobile Money
        </Button>
      ) : (
        /* Composant de paiement */
        <MobileMoneyPayment
          orderId={orderId}
          orderType="physical" // ou "digital"
          amount={product.price}
          onSuccess={() => {
            alert('Paiement initié ! Vérifiez votre téléphone.');
            // Rediriger vers la page de confirmation
            window.location.href = `/orders/${orderId}/confirmation`;
          }}
          onCancel={() => {
            setShowPayment(false);
          }}
        />
      )}
    </div>
  );
}
```

---

### Étape 4 : Test rapide (2 minutes)

1. **Créer une commande de test**

Via l'interface ou directement en base :

```sql
INSERT INTO product_inquiries (
  card_id,
  product_id,
  client_name,
  client_email,
  client_phone,
  quantity
) VALUES (
  'votre-card-id',
  'votre-product-id',
  'Test Client',
  'test@example.com',
  '96123456',
  1
);
```

2. **Ouvrir la page de commande**

3. **Cliquer sur "Payer avec Mobile Money"**

4. **Remplir le formulaire**
   - Numéro: 96 12 34 56 (exemple)
   - Opérateur: MTN (détecté automatiquement)

5. **Cliquer sur "Payer"**

6. **Vérifier en base de données**

```sql
SELECT
  id,
  payment_status,
  payment_method,
  billing_easy_bill_id,
  payment_reference
FROM product_inquiries
WHERE id = 'order-id';
```

**Résultat attendu :**
```
payment_status: 'processing'
payment_method: 'mobile_money'
billing_easy_bill_id: '...'
payment_reference: 'PHY-XXXXX-XXXXX'
```

---

## 🔧 Intégrations courantes

### 1. Ajouter un bouton de paiement dans une liste de commandes

```tsx
import { OrdersService } from '@/services/ordersService';

function OrdersList({ orders }) {
  const handlePay = async (order) => {
    const result = await OrdersService.initiateMobileMoneyPayment(
      order.id,
      order.type,
      {
        amount: order.products.price,
        phone_number: order.client_phone,
        operator: 'mtn', // Ou détecter automatiquement
      }
    );

    if (result.success) {
      alert('Paiement initié ! Référence: ' + result.reference);
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <p>{order.product_name} - {order.products.price} FCFA</p>
          {order.payment_status !== 'completed' && (
            <Button onClick={() => handlePay(order)}>
              Payer maintenant
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2. Afficher le statut de paiement

```tsx
import { OrdersService } from '@/services/ordersService';
import { useQuery } from '@tanstack/react-query';

function PaymentStatus({ orderId, orderType }) {
  const { data: status } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => OrdersService.checkPaymentStatus(orderId, orderType),
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status?.status]}`}>
      {status?.status === 'completed' && '✅ '}
      {status?.status === 'processing' && '⏳ '}
      {status?.status === 'failed' && '❌ '}
      {status?.status}
    </span>
  );
}
```

### 3. Tableau de bord des paiements

```tsx
import { OrdersService } from '@/services/ordersService';
import { useAuth } from '@/contexts/AuthContext';

function PaymentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    OrdersService.getPaymentStats(user.id).then(setStats);
  }, [user.id]);

  if (!stats) return <div>Chargement...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-600">Total paiements</h3>
        <p className="text-2xl font-bold">{stats.total_payments}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-600">Paiements complétés</h3>
        <p className="text-2xl font-bold text-green-600">{stats.completed_payments}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-600">Revenus Mobile Money</h3>
        <p className="text-2xl font-bold">{stats.mobile_money_revenue.toLocaleString()} FCFA</p>
      </div>
    </div>
  );
}
```

---

## 🎨 Personnalisation du composant

### Changer les couleurs

```tsx
<MobileMoneyPayment
  orderId={orderId}
  orderType="physical"
  amount={5000}
  onSuccess={() => {}}
  onCancel={() => {}}
  // Ajouter des props personnalisées si nécessaire
/>
```

Pour personnaliser davantage, modifier directement :
`src/components/payment/MobileMoneyPayment.tsx`

### Ajouter des logos personnalisés

```tsx
// Dans MobileMoneyPayment.tsx
const operatorLogos: Record<string, string> = {
  mtn: '/images/mtn-logo.png',  // Remplacer les emojis par des images
  moov: '/images/moov-logo.png',
  orange: '/images/orange-logo.png',
};
```

---

## 📱 Tester avec de vrais numéros

### Numéros de test BillingEasy (environnement lab)

- **MTN :** 96 12 34 56
- **Moov :** 98 12 34 56
- **Orange :** 07 12 34 56

⚠️ Ces numéros sont pour l'environnement de test uniquement.

### Passer en production

1. Changer l'URL dans `.env` :
   ```env
   VITE_BILLING_EASY_API_URL=https://api.billing-easy.net/api/v1/merchant
   ```

2. Utiliser les credentials de production fournis par BillingEasy

3. Tester avec de vrais numéros

---

## 🐛 Dépannage rapide

### Problème : "Configuration BillingEasy incomplète"

**Solution :** Vérifier que les 3 variables sont dans `.env` :

```bash
cat .env | grep BILLING_EASY
```

Redémarrer le serveur de dev après modification :

```bash
npm run dev
```

### Problème : Erreur 400 lors de l'appel API

**Solution :** Vérifier le format du numéro de téléphone :

```typescript
import { MobileMoneyService } from '@/services/mobileMoneyService';

console.log(MobileMoneyService.validatePhoneNumber('96123456')); // true ou false
console.log(MobileMoneyService.detectOperator('96123456')); // 'mtn', 'moov', 'orange', ou null
```

### Problème : USSD push non reçu

**Solution :**
- Vérifier que le numéro est correct
- Vérifier que l'opérateur correspond au numéro
- En test, utiliser les numéros fournis par BillingEasy

---

## ✅ Checklist finale

Avant de considérer l'intégration complète :

- [ ] Migration appliquée (`supabase db push`)
- [ ] Variables d'environnement configurées
- [ ] Composant intégré dans au moins une page
- [ ] Test avec un paiement fictif réussi
- [ ] Vérification en base de données OK
- [ ] Documentation lue

---

## 📞 Prochaines étapes

1. **Implémenter les webhooks** (pour les notifications automatiques)
   - Créer une route API : `/api/webhooks/billing-easy`
   - Utiliser `OrdersService.handlePaymentWebhook()`

2. **Ajouter des notifications** (email, SMS)
   - Notifier le client quand le paiement est confirmé
   - Notifier le vendeur

3. **Améliorer l'UX**
   - Polling automatique du statut toutes les 5 secondes
   - Afficher un timer de countdown
   - Ajouter des animations

4. **Monitoring**
   - Logger tous les paiements
   - Créer un dashboard admin des transactions
   - Alertes en cas d'échec répétés

---

**Temps total estimé :** 5-10 minutes pour la mise en place de base
**Complexité :** ⭐⭐ (Moyenne - déjà tout implémenté)

🎉 **Vous êtes prêt à accepter des paiements Mobile Money !**
