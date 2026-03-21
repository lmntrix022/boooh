# 🚀 Guide de Déploiement - eBilling Callback System

Guide complet pour déployer le système de callback eBilling sur votre projet.

---

## 📋 Vue d'Ensemble

Le système de callback permet de :
1. ✅ Recevoir automatiquement les notifications de paiement d'eBilling
2. ✅ Mettre à jour les commandes en temps réel
3. ✅ Logger tous les événements pour audit et debugging
4. ✅ Notifier les utilisateurs du statut de leur paiement

---

## 🎯 Prérequis

- ✅ Projet Supabase actif
- ✅ Supabase CLI installé (`npm install -g supabase`)
- ✅ Compte eBilling avec accès API
- ✅ Variables d'environnement configurées

---

## 📦 Étape 1 : Créer la Base de Données

### 1.1 Exécuter la migration SQL

**Option A : Via Supabase Dashboard**
1. Ouvrez [Supabase Dashboard](https://app.supabase.com)
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu de `supabase/migrations/create_payment_callbacks_table.sql`
5. Exécutez la requête

**Option B : Via CLI**
```bash
cd /Users/quantinekouaghe/Downloads/boooh-main

# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref [VOTRE_PROJECT_REF]

# Appliquer la migration
supabase db push
```

### 1.2 Vérifier la table créée

```sql
-- Dans le SQL Editor
SELECT * FROM payment_callbacks LIMIT 1;
```

Vous devriez voir la structure de la table sans erreur.

---

## 🔧 Étape 2 : Déployer l'Edge Function

### 2.1 Déployer la fonction

```bash
cd /Users/quantinekouaghe/Downloads/boooh-main

# Déployer la fonction ebilling-callback
supabase functions deploy ebilling-callback

# Vérifier le déploiement
supabase functions list
```

**Sortie attendue :**
```
┌─────────────────────┬─────────┬──────────────────────────────┐
│ NAME                │ STATUS  │ URL                          │
├─────────────────────┼─────────┼──────────────────────────────┤
│ ebilling-callback   │ ACTIVE  │ https://[...].supabase.co/... │
└─────────────────────┴─────────┴──────────────────────────────┘
```

### 2.2 Récupérer l'URL du webhook

```bash
# Format de l'URL
https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/ebilling-callback
```

**Exemple :**
```
https://abcdefghijklmnopqrst.supabase.co/functions/v1/ebilling-callback
```

⚠️ **Sauvegardez cette URL** - vous en aurez besoin pour la configuration eBilling.

### 2.3 Tester localement (optionnel)

```bash
# Démarrer les fonctions localement
supabase functions serve ebilling-callback

# Dans un autre terminal, tester
curl -X POST http://localhost:54321/functions/v1/ebilling-callback \
  -H "Content-Type: application/json" \
  -d '{
    "bill_id": "TEST_123",
    "status": "SUCCESS",
    "reference": "ORDER-TEST-001",
    "amount": "5000",
    "payer_msisdn": "07123456"
  }'
```

---

## ⚙️ Étape 3 : Configurer eBilling

### 3.1 Se connecter au Dashboard eBilling

1. Allez sur [https://billing-easy.net](https://billing-easy.net)
2. Connectez-vous avec vos identifiants
3. Accédez à **Paramètres** → **API & Webhooks**

### 3.2 Ajouter l'URL de callback

1. Cliquez sur **Ajouter un webhook**
2. Renseignez :
   - **URL** : `https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/ebilling-callback`
   - **Événements** : Cochez `payment.success` et `payment.failed`
   - **Méthode** : POST
   - **Format** : JSON

3. Cliquez sur **Tester** pour vérifier la connexion
4. Sauvegardez

### 3.3 Vérifier la configuration

eBilling devrait envoyer un webhook de test. Vérifiez dans les logs :

```bash
supabase functions logs ebilling-callback --follow
```

Vous devriez voir :
```
🔔 Received eBilling callback
✅ Callback logged successfully
```

---

## 🔐 Étape 4 : Configurer les Permissions

### 4.1 Vérifier les RLS Policies

La table `payment_callbacks` a des politiques de sécurité (RLS). Ajustez si nécessaire :

```sql
-- Permettre à tous les utilisateurs authentifiés de voir leurs propres callbacks
CREATE POLICY "Users can view their own callbacks"
  ON payment_callbacks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.external_reference = payment_callbacks.reference
      AND orders.card_id = auth.uid()
    )
  );
```

### 4.2 Créer la table orders (si elle n'existe pas)

Le callback s'attend à une table `orders` avec cette structure minimale :

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id),
  external_reference TEXT UNIQUE NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_external_reference ON orders(external_reference);
CREATE INDEX idx_orders_card_id ON orders(card_id);
```

---

## 🧪 Étape 5 : Tester le Workflow Complet

### 5.1 Créer une commande de test

```typescript
// Dans votre frontend
import { MobileMoneyService } from '@/services/mobileMoneyService';

async function testPayment() {
  try {
    // 1. Créer une commande dans votre DB
    const orderId = 'ORDER-TEST-' + Date.now();
    
    // 2. Initier le paiement USSD
    const result = await MobileMoneyService.initiateUssdPayment({
      amount: 1000, // 1000 FCFA pour test
      payer_name: 'Test User',
      payer_email: 'test@example.com',
      payer_msisdn: '07123456', // Votre numéro de test
      short_description: 'Test de paiement',
      external_reference: orderId,
    });

    console.log('Payment initiated:', result);
    
    // 3. L'utilisateur reçoit le USSD Push
    // 4. Après confirmation, eBilling envoie le callback
    // 5. Votre Edge Function met à jour la commande
  } catch (error) {
    console.error('Payment error:', error);
  }
}
```

### 5.2 Surveiller le callback

```bash
# Terminal 1 : Logs de l'Edge Function
supabase functions logs ebilling-callback --follow

# Terminal 2 : Vérifier la table
psql $DATABASE_URL -c "SELECT * FROM payment_callbacks ORDER BY created_at DESC LIMIT 5;"
```

### 5.3 Vérifier la mise à jour de la commande

```sql
-- Dans le SQL Editor
SELECT 
  o.id,
  o.external_reference,
  o.payment_status,
  o.transaction_id,
  pc.status as callback_status,
  pc.created_at as callback_received_at
FROM orders o
LEFT JOIN payment_callbacks pc ON pc.reference = o.external_reference
WHERE o.external_reference LIKE 'ORDER-TEST-%'
ORDER BY o.created_at DESC
LIMIT 5;
```

---

## 📊 Étape 6 : Intégration Frontend

### 6.1 Utiliser le hook React

```typescript
import { usePaymentStatus } from '@/services/paymentCallbackService';

function PaymentStatusComponent({ bill_id }: { bill_id: string }) {
  const { status, callback, loading } = usePaymentStatus(bill_id);

  if (loading) {
    return <div>Vérification du paiement...</div>;
  }

  if (status === 'SUCCESS') {
    return (
      <div className="bg-green-100 p-4 rounded">
        ✅ Paiement réussi !
        <p>Transaction: {callback?.transaction_id}</p>
      </div>
    );
  }

  if (status === 'FAILED') {
    return <div className="bg-red-100 p-4 rounded">❌ Paiement échoué</div>;
  }

  return <div className="bg-yellow-100 p-4 rounded">⏳ En attente...</div>;
}
```

### 6.2 Polling alternatif (sans Realtime)

```typescript
import { PaymentCallbackService } from '@/services/paymentCallbackService';

async function pollPaymentStatus(bill_id: string) {
  const maxAttempts = 24; // 2 minutes (24 * 5 secondes)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    const result = await PaymentCallbackService.checkPaymentStatus(bill_id);

    if (result.found && result.status === 'SUCCESS') {
      clearInterval(interval);
      // Rediriger vers page de succès
      window.location.href = `/payment/success?ref=${result.callback?.reference}`;
    } else if (result.found && result.status === 'FAILED') {
      clearInterval(interval);
      // Afficher erreur
      alert('Le paiement a échoué. Veuillez réessayer.');
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
      // Timeout
      console.warn('Timeout: Paiement toujours en attente');
    }
  }, 5000); // Toutes les 5 secondes
}
```

---

## 🔍 Monitoring & Maintenance

### Tableau de bord des paiements

```sql
-- Créer une vue pour le dashboard
CREATE OR REPLACE VIEW payment_dashboard AS
SELECT 
  DATE(created_at) as date,
  status,
  payment_system,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM payment_callbacks
GROUP BY DATE(created_at), status, payment_system
ORDER BY date DESC, status;

-- Utiliser la vue
SELECT * FROM payment_dashboard WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Alertes automatiques (optionnel)

Créez une Edge Function pour envoyer des alertes si :
- Trop de paiements échouent (> 10%)
- Des callbacks ne sont pas traités pendant > 1h
- Une anomalie est détectée

---

## 🐛 Troubleshooting

### Problème : Callback non reçu

**Vérifications :**
1. L'URL du webhook est correcte dans eBilling
2. L'Edge Function est déployée et active
3. Pas de firewall bloquant eBilling

**Solution :**
```bash
# Vérifier les logs
supabase functions logs ebilling-callback --follow

# Tester manuellement
curl -X POST https://[VOTRE_PROJECT].supabase.co/functions/v1/ebilling-callback \
  -H "Content-Type: application/json" \
  -d '{"bill_id":"TEST","status":"SUCCESS","reference":"ORDER-123","amount":"5000"}'
```

### Problème : Commande non mise à jour

**Vérifications :**
1. La référence dans eBilling correspond à `orders.external_reference`
2. Les permissions RLS permettent la mise à jour
3. La table `orders` existe et a les bons champs

**Solution :**
```sql
-- Vérifier les callbacks non traités
SELECT * FROM payment_callbacks WHERE processed = false;

-- Retry manuel
UPDATE orders 
SET payment_status = 'paid', status = 'confirmed'
WHERE external_reference = 'ORDER-XXX';
```

### Problème : Erreurs 500

**Vérifications :**
```bash
# Logs détaillés
supabase functions logs ebilling-callback --follow

# Vérifier les variables d'environnement
supabase secrets list
```

---

## ✅ Checklist de Déploiement

- [ ] Table `payment_callbacks` créée
- [ ] Edge Function `ebilling-callback` déployée
- [ ] URL webhook configurée dans eBilling
- [ ] Table `orders` existe avec les bons champs
- [ ] RLS policies configurées
- [ ] Tests manuels passés
- [ ] Test en environnement lab eBilling réussi
- [ ] Monitoring activé (logs)
- [ ] Documentation partagée avec l'équipe
- [ ] Migration vers production planifiée

---

## 📞 Support

**Documentation :**
- [eBilling API Docs](https://billing-easy.net/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

**Contacts :**
- Support eBilling : support@billing-easy.net
- Support Supabase : https://supabase.com/support

---

**Version :** 1.0.0  
**Dernière mise à jour :** 17 octobre 2025









