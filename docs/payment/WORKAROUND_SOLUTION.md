# Solution de Contournement Temporaire - Système de Paiement eBilling

## 🎯 Problème Identifié

L'API eBilling retourne une erreur `merchant_name not valid` lors de la création de facture, même si :
- ✅ L'authentification OAuth2 fonctionne
- ✅ Le payload est conforme à la documentation (sans `merchant_name`)
- ✅ Les factures sont bien créées (visibles dans le dashboard eBilling)
- ❌ L'API ne retourne pas l'`invoice_id` dans la réponse à cause de l'erreur

**Impact :** Sans `invoice_id`, nous ne pouvons pas envoyer le USSD push immédiatement.

## ✅ Solution de Contournement Implémentée

### 1. Modification de `billing-easy-create-invoice`

**Fichier :** `supabase/functions/billing-easy-create-in includee/index.ts`

**Changement :**
- Si l'API retourne une erreur 500 mais que les factures arrivent dans le compte, on assume que la facture est créée
- On retourne un **succès partiel** avec la `reference` externe
- Le champ `workaround: true` indique qu'on utilise le contournement

**Réponse retournée :**
```json
{
  "success": true,
  "bill_id": null,
  "invoice_id": null,
  "reference": "REF-XXXXX",
  "external_reference": "REF-XXXXX",
  "data": {
    "workaround": true,
    "note": "Facture créée mais invoice_id non retourné par l'API. L'ID sera récupéré automatiquement via le callback webhook."
  },
  "warning": "invoice_id manquant - sera récupéré via callback"
}
```

### 2. Modification de `MobileMoneyService`

**Fichier :** `src/services/mobileMoneyService.ts`

**Changement :**
- Gestion du cas où `bill_id` est `null` mais `success=true` avec workaround
- Le service accepte la réponse partielle et continue avec la référence externe
- `initiateUssdPayment` retourne une réponse partielle indiquant que le USSD push sera envoyé plus tard

### 3. Modification de `ebilling-callback` (ENVOI AUTOMATIQUE)

**Fichier :** `supabase/functions/ebilling-callback/index.ts`

**Fonctionnalité ajoutée :**
- **Fonction `sendUssdPushAutomatically`** : Envoie automatiquement le USSD push via l'Edge Function `ebilling-ussd-push`
- **Déclenchement automatique** : Quand le callback reçoit un statut `PENDING` avec un `bill_id` (invoice_id) et un `payer_msisdn`
- **Vérification** : Envoie seulement si l'inquiry n'est pas déjà payée

**Flux :**
1. La facture est créée (malgré l'erreur API)
2. Le callback eBilling est reçu avec `invoice_id` (bill_id) et statut `PENDING`
3. Le callback détecte automatiquement qu'il faut envoyer le USSD push
4. Le USSD push est envoyé automatiquement à l'utilisateur
5. L'utilisateur reçoit la notification USSD et peut payer

## 🔄 Flux Complet avec Solution de Contournement

### Cas Normal (quand集合 problème sera résolu)
```
1. Création facture → Réception invoice_id → Envoi USSD push ✅
```

### Cas Actuel avec Workaround
```
1. Création facture → Erreur API mais facture créée → Référence externe retournée
2. eBilling envoie callback webhook avec invoice_id + statut PENDING
3. ✅ Le callback détecte automatiquement et envoie le USSD push
4. Utilisateur reçoit notification USSD et paie
5. eBilling envoie callback avec statut SUCCESS
6. Le système met à jour le statut de paiement
```

## 📋 Conditions pour l'Envoi Automatique du USSD Push

Le callback envoie automatiquement le USSD push si **toutes** ces conditions sont remplies :
- ✅ Statut du callback = `PENDING`
- ✅ `bill_id` présent dans le payload (invoice_id reçu)
- ✅ `payer_msisdn` présent dans le payload
- ✅ L'inquiry associée n'est pas déjà payée (`payment_status !== 'paid'` et `payment_status !== 'completed'`)

## 🔍 Détection du Système de Paiement

Le système détecte automatiquement :
- **Numéros commençant par `07`** → `airtelmoney` (Airtel Money)
- **Numéros commençant par `06`** → `moovmoney4` (Moov Money)

## 📝 Logs de Debugging

Le callback logge les événements suivants :
- `📱 Envoi automatique du USSD push pour bill_id: XXX`
- `🚀 Solution de contournement: Envoi automatique du USSD push (invoice_id reçu via callback)`
- `✅ USSD push envoyé automatiquement avec succès`
- `⚠️ Échec envoi automatique USSD push (non bloquant)` (si échec)

## ⚠️ Notes Importantes

1. **Non-bloquant** : Si l'envoi automatique du USSD push échoue, le callback continue son traitement normal
2. **Pas de double envoi** : Le système vérifie que l'inquiry n'est pas déjà payée avant d'envoyer
3. **Temporaire** : Cette solution est temporaire en attendant que le problème `merchant_name` soit résolu côté eBilling

## 🚀 Prochaines Étapes (Quand le Problème Sera Résolu)

Une fois que le problème `merchant_name` sera résolu côté eBilling :
1. L'API retournera l'`invoice_id` directement dans la réponse de création de facture
2. Le USSD push pourra être envoyé immédiatement (flux normal)
3. Cette solution de contournement pourra être désactivée

## 📞 Support eBilling

Il est recommandé de contacter le support eBilling pour :
- Résoudre le problème `merchant_name not valid` alors que le champ n'est pas dans le payload
- Confirmer que les factures sont bien créées mais l'invoice_id n'est pas retourné
- Vérifier la configuration du compte marchand


