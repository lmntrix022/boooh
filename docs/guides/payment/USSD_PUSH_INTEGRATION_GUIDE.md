# 📱 Guide d'Intégration USSD Push - eBilling

Guide complet pour intégrer le paiement par USSD Push avec eBilling dans votre application Vite.js.

## 🎯 Qu'est-ce que le USSD Push ?

Le USSD Push permet d'envoyer une notification de paiement directement sur le téléphone de l'utilisateur. L'utilisateur reçoit un code USSD qu'il peut composer immédiatement pour confirmer le paiement, sans quitter votre application ou être redirigé vers une page externe.

**Avantages :**
- ✅ Meilleure expérience utilisateur (pas de redirection)
- ✅ Paiement plus rapide et intuitif
- ✅ Taux de conversion plus élevé
- ✅ Fonctionne sur tous les téléphones (même sans smartphone)

---

## 📋 Étapes d'Intégration

### **Étape 1 : Créer une facture (Bill) via l'API eBilling**

Envoyez une requête `POST` à l'endpoint de création de facture :

**Endpoint :** `https://lab.billing-easy.net/api/v1/merchant/e_bills`

**Headers requis :**
```http
Content-Type: application/json
Authorization: Basic [username:sharedKey en base64]
```

**Corps de la requête :**
```json
{
  "payer_email": "client@example.com",
  "payer_msisdn": "07123456",
  "amount": "5000",
  "short_description": "Achat de produit",
  "external_reference": "ORDER-123",
  "payer_name": "Nom du client",
  "expiry_period": "60"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "bill_id": "BILL_12345",
  "reference": "REF_67890",
  "status": "PENDING"
}
```

**⚠️ Important :** Récupérez et conservez le `bill_id` de la réponse.

---

### **Étape 2 : Envoyer une requête USSD Push**

Utilisez le `bill_id` obtenu pour envoyer le USSD Push :

**Endpoint :** `https://lab.billing-easy.net/api/v1/merchant/e_bills/{bill_id}/ussd_push`

**Headers requis :**
```http
Content-Type: application/json
Authorization: Basic [username:sharedKey en base64]
```

**Corps de la requête :**
```json
{
  "payer_msisdn": "07123456",
  "payment_system_name": "airtelmoney"
}
```

**Détection automatique du système de paiement :**
- Numéro commençant par **`06`** → `"moovmoney4"` (Moov Money)
- Numéro commençant par **`07`** → `"airtelmoney"` (Airtel Money)

**Réponse attendue :**
```json
{
  "success": true,
  "message": "USSD Push envoyé avec succès",
  "status": "SENT"
}
```

---

### **Étape 3 : Afficher une confirmation à l'utilisateur**

Une fois le USSD Push envoyé avec succès, informez l'utilisateur :

```
✅ Notification envoyée !

Une demande de paiement a été envoyée sur votre téléphone +241 07 12 34 56.

📱 Veuillez :
1. Vérifier votre téléphone
2. Composer le code USSD affiché
3. Confirmer le paiement de 5,000 FCFA

⏱️ Vous avez 60 minutes pour confirmer le paiement.
```

**Interface utilisateur recommandée :**
- Afficher un loader/spinner pendant la vérification du statut
- Montrer le montant exact et le numéro de téléphone
- Proposer un bouton "Vérifier le statut" pour polling manuel
- Afficher un timer de 60 minutes

---

### **Étape 4 : Configurer l'URL de callback**

Configurez un endpoint dans votre backend pour recevoir les notifications de paiement d'eBilling.

**URL de callback :** `https://votre-domaine.com/api/ebilling/callback`

**Méthode :** `POST`

**Payload reçu :**
```json
{
  "bill_id": "BILL_12345",
  "status": "SUCCESS",
  "reference": "REF_67890",
  "amount": "5000",
  "payer_msisdn": "07123456",
  "payer_name": "Nom du client",
  "payer_email": "client@example.com",
  "transaction_id": "TXN_ABC123",
  "paid_at": "2025-10-17T14:30:00Z"
}
```

**Statuts possibles :**
- `SUCCESS` : Paiement réussi
- `FAILED` : Paiement échoué
- `PENDING` : En attente

---

### **Étape 5 : Gérer le callback côté backend**

Créez un point d'écoute pour recevoir et traiter la notification POST d'eBilling.

**Exemple avec Supabase Edge Function :**

```typescript
// supabase/functions/ebilling-callback/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    
    // Validation des données
    if (!payload.bill_id || !payload.status || !payload.reference) {
      return new Response('Invalid payload', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mettre à jour le statut de la commande
    if (payload.status === 'SUCCESS') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: 'mobile_money',
          transaction_id: payload.transaction_id,
          paid_at: payload.paid_at,
        })
        .eq('external_reference', payload.reference)

      // Déclencher les actions post-paiement
      // - Envoyer email de confirmation
      // - Générer la facture
      // - Mettre à jour le stock
      // etc.
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Callback error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
```

**⚠️ Sécurité :**
- Vérifiez l'IP source de la requête (liste blanche eBilling)
- Validez la signature HMAC si fournie par eBilling
- Utilisez HTTPS uniquement
- Loggez toutes les tentatives de callback

---

## 💻 Exemple d'Utilisation Frontend

```typescript
import { MobileMoneyService } from '@/services/mobileMoneyService'

async function handlePayment() {
  try {
    // Données du paiement
    const invoiceData = {
      amount: 5000,
      payer_name: 'Jean Dupont',
      payer_email: 'jean@example.com',
      payer_msisdn: '07123456', // Gabon
      short_description: 'Achat de produit digital',
      external_reference: `ORDER-${orderId}`,
    }

    // Workflow complet USSD Push
    const result = await MobileMoneyService.initiateUssdPayment(invoiceData)

    // Afficher la confirmation à l'utilisateur
    showNotification({
      type: 'success',
      title: '📱 Notification envoyée !',
      message: result.instructions,
    })

    // Démarrer le polling du statut
    pollPaymentStatus(result.bill_id)
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Erreur',
      message: error.message,
    })
  }
}

// Vérifier périodiquement le statut du paiement
async function pollPaymentStatus(bill_id: string) {
  const maxAttempts = 20 // 20 tentatives
  const interval = 5000 // 5 secondes
  let attempts = 0

  const polling = setInterval(async () => {
    attempts++

    try {
      const status = await MobileMoneyService.checkPaymentStatus(bill_id)

      if (status.status === 'SUCCESS') {
        clearInterval(polling)
        showNotification({
          type: 'success',
          title: '✅ Paiement réussi !',
          message: `Votre paiement de ${status.amount} FCFA a été confirmé.`,
        })
        // Rediriger vers la page de confirmation
        window.location.href = `/orders/${bill_id}/success`
      } else if (status.status === 'FAILED') {
        clearInterval(polling)
        showNotification({
          type: 'error',
          title: '❌ Paiement échoué',
          message: 'Le paiement a été refusé. Veuillez réessayer.',
        })
      }

      // Arrêter après 20 tentatives (env. 1min 40s)
      if (attempts >= maxAttempts) {
        clearInterval(polling)
        showNotification({
          type: 'warning',
          title: '⏱️ Vérification en cours',
          message: 'Le paiement est en cours de traitement. Vous recevrez une confirmation par email.',
        })
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }, interval)
}
```

---

## 🔧 Configuration des Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration eBilling
VITE_BILLING_EASY_USERNAME=votre_username
VITE_BILLING_EASY_SHARED_KEY=votre_shared_key
VITE_BILLING_EASY_API_URL=https://lab.billing-easy.net/api/v1/merchant
VITE_BILLING_EASY_PAYMENT_URL=https://test.billing-easy.net

# URL de callback (backend)
BILLING_EASY_CALLBACK_URL=https://votre-domaine.com/api/ebilling/callback
```

**⚠️ Pour la production :**
- Remplacez `lab.billing-easy.net` par l'URL de production
- Remplacez `test.billing-easy.net` par l'URL de production
- Utilisez des credentials de production

---

## 🎨 Bonnes Pratiques

### **1. Gestion des Erreurs**
- ✅ Valider le montant avant l'envoi (minimum/maximum)
- ✅ Valider le format du numéro de téléphone
- ✅ Détecter automatiquement l'opérateur
- ✅ Afficher des messages d'erreur clairs à l'utilisateur

### **2. Expérience Utilisateur**
- ✅ Afficher un loader pendant le traitement
- ✅ Montrer clairement les étapes à suivre
- ✅ Proposer un bouton "Réessayer" en cas d'échec
- ✅ Sauvegarder l'état du paiement (localStorage)

### **3. Sécurité**
- ⚠️ **NE JAMAIS exposer les credentials côté client**
- ✅ Déplacer toutes les requêtes vers un backend/Edge Function
- ✅ Valider les webhooks avec signature HMAC
- ✅ Logger tous les événements de paiement

### **4. Monitoring**
- ✅ Logger chaque étape du workflow
- ✅ Tracker les taux de conversion
- ✅ Monitorer les échecs de paiement
- ✅ Alerter sur les anomalies

---

## 🔄 Architecture Recommandée (Sécurisée)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │  HTTPS  │   Backend    │  HTTPS  │   eBilling  │
│  (Vite.js)  │────────▶│(Edge Func.)  │────────▶│     API     │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │                        │
       │                        │◀───────────────────────┘
       │                        │    Callback webhook
       │                        │
       │◀───────────────────────┤
       │    WebSocket/SSE       │
       │    (notification)      │
```

**Flow :**
1. Frontend appelle votre backend (Edge Function)
2. Backend crée la facture sur eBilling (avec credentials sécurisés)
3. Backend envoie le USSD Push
4. Frontend affiche la confirmation
5. eBilling envoie le callback au backend
6. Backend notifie le frontend via WebSocket/SSE ou polling

---

## 📞 Support

**Documentation eBilling :**
- URL: https://billing-easy.net/docs
- Email: support@billing-easy.net

**Codes d'Erreur Courants :**
- `400` : Paramètres manquants ou invalides
- `401` : Authentification échouée
- `404` : Facture non trouvée
- `500` : Erreur serveur eBilling

---

## ✅ Checklist d'Intégration

- [ ] Variables d'environnement configurées
- [ ] Service MobileMoneyService testé
- [ ] Backend/Edge Function créé pour la sécurité
- [ ] Endpoint callback configuré
- [ ] Validation des numéros de téléphone
- [ ] Gestion d'erreurs robuste
- [ ] Interface utilisateur claire
- [ ] Polling du statut implémenté
- [ ] Logs et monitoring en place
- [ ] Tests en environnement lab
- [ ] Migration vers production

---

**Version :** 1.0.0  
**Dernière mise à jour :** 17 octobre 2025





