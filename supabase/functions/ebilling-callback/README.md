# 🔔 eBilling Callback - Edge Function

Edge Function pour recevoir et traiter les notifications de paiement d'eBilling.

## 📋 Description

Cette fonction est appelée automatiquement par eBilling lorsqu'un paiement change de statut (SUCCESS, FAILED, PENDING).

### Ce qu'elle fait :

1. ✅ **Reçoit** le webhook POST d'eBilling
2. ✅ **Valide** le payload (structure et champs obligatoires)
3. ✅ **Enregistre** le callback dans `payment_callbacks` (traçabilité)
4. ✅ **Met à jour** la commande associée dans `orders`
5. ✅ **Marque** le callback comme traité
6. ✅ **Retourne** une réponse de succès à eBilling

---

## 🚀 Déploiement

### 1. Créer la table dans Supabase

```bash
# Exécutez la migration SQL
psql $DATABASE_URL < supabase/migrations/create_payment_callbacks_table.sql

# Ou via le SQL Editor de Supabase Dashboard
```

### 2. Déployer la fonction

```bash
# Se connecter à Supabase
supabase login

# Déployer la fonction
supabase functions deploy ebilling-callback

# Vérifier le déploiement
supabase functions list
```

### 3. Obtenir l'URL du webhook

```bash
# Format de l'URL
https://[VOTRE_PROJET].supabase.co/functions/v1/ebilling-callback
```

**Exemple :**
```
https://abcdefghijklmnopqrst.supabase.co/functions/v1/ebilling-callback
```

---

## ⚙️ Configuration eBilling

### Configurer le webhook chez eBilling

1. Connectez-vous à votre dashboard eBilling
2. Allez dans **Paramètres** → **Webhooks**
3. Ajoutez votre URL de callback :
   ```
   https://[VOTRE_PROJET].supabase.co/functions/v1/ebilling-callback
   ```
4. Événements à écouter : `payment.success`, `payment.failed`

### Tester le webhook

```bash
# Test avec curl
curl -X POST https://[VOTRE_PROJET].supabase.co/functions/v1/ebilling-callback \
  -H "Content-Type: application/json" \
  -d '{
    "bill_id": "BILL_TEST_123",
    "status": "SUCCESS",
    "reference": "ORDER-TEST-001",
    "amount": "5000",
    "payer_msisdn": "07123456",
    "payer_name": "Test User",
    "payer_email": "test@example.com",
    "transaction_id": "TXN_ABC123",
    "paid_at": "2025-10-17T14:30:00Z"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Callback received and processed",
  "callback_id": "uuid-here"
}
```

---

## 📊 Monitoring

### Vérifier les callbacks reçus

```sql
-- Tous les callbacks des dernières 24h
SELECT 
  id,
  bill_id,
  status,
  reference,
  amount,
  processed,
  created_at
FROM payment_callbacks
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Callbacks non traités

```sql
-- Callbacks en erreur
SELECT *
FROM payment_callbacks
WHERE processed = false
ORDER BY created_at DESC;
```

### Statistiques

```sql
-- Résumé des paiements
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  payment_system
FROM payment_callbacks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status, payment_system
ORDER BY count DESC;
```

---

## 🔍 Debugging

### Voir les logs en temps réel

```bash
# Suivre les logs de la fonction
supabase functions logs ebilling-callback --follow
```

### Logs importants

La fonction log les événements suivants :
- 🔔 `Received eBilling callback` - Callback reçu
- ✅ `Callback logged successfully` - Enregistré dans la DB
- 📦 `Order found: [id]` - Commande trouvée
- ✅ `Order updated to PAID` - Commande mise à jour
- ❌ `Failed to process callback` - Erreur de traitement

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Invalid payload structure` | Champs manquants | Vérifier le payload eBilling |
| `No matching order found` | Référence incorrecte | Vérifier `external_reference` |
| `Order update failed` | Problème DB | Vérifier les permissions RLS |
| `Failed to log callback` | Erreur table | Vérifier que la table existe |

---

## 🔐 Sécurité

### Recommandations

1. **IP Whitelist** (optionnel)
   ```typescript
   // Ajouter dans index.ts
   const ALLOWED_IPS = ['1.2.3.4', '5.6.7.8']; // IPs d'eBilling
   const clientIP = req.headers.get('x-forwarded-for');
   if (!ALLOWED_IPS.includes(clientIP)) {
     return new Response('Forbidden', { status: 403 });
   }
   ```

2. **HMAC Signature** (si eBilling le supporte)
   ```typescript
   // Vérifier la signature
   const signature = req.headers.get('x-ebilling-signature');
   const isValid = verifyHMAC(payload, signature, SECRET);
   if (!isValid) {
     return new Response('Invalid signature', { status: 401 });
   }
   ```

3. **Rate Limiting**
   - Configurer un rate limit sur Supabase (100 req/min recommandé)

---

## 🔄 Intégration avec les Commandes

### Structure attendue dans `orders`

```typescript
{
  id: 'uuid',
  external_reference: 'ORDER-123', // Doit correspondre au 'reference' d'eBilling
  payment_status: 'pending' | 'paid' | 'failed',
  payment_method: 'mobile_money',
  transaction_id: 'TXN_ABC',
  paid_at: '2025-10-17T14:30:00Z',
  status: 'pending' | 'confirmed' | 'cancelled'
}
```

### Actions post-paiement à implémenter

Lorsqu'un paiement réussit (`status === 'SUCCESS'`), vous devriez :

1. ✅ Envoyer email de confirmation au client
2. ✅ Générer la facture automatiquement
3. ✅ Mettre à jour le stock (produits physiques)
4. ✅ Envoyer le lien de téléchargement (produits digitaux)
5. ✅ Notifier le vendeur

**Exemple :**
```typescript
// Dans processCallback(), après update de la commande
if (payload.status === 'SUCCESS') {
  // Appeler d'autres Edge Functions
  await supabase.functions.invoke('send-order-confirmation', {
    body: { order_id: order.id }
  });
  
  await supabase.functions.invoke('generate-invoice', {
    body: { order_id: order.id }
  });
}
```

---

## 📝 Changelog

### v1.0.0 (2025-10-17)
- ✅ Implémentation initiale
- ✅ Support Airtel Money et Moov Money (Gabon)
- ✅ Logging complet dans `payment_callbacks`
- ✅ Mise à jour automatique des commandes
- ✅ Validation robuste du payload

---

## 🆘 Support

Pour toute question :
- 📧 Documentation eBilling : https://billing-easy.net/docs
- 📧 Support Supabase : https://supabase.com/support






















