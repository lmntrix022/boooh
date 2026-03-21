# Guide d'Intégration des Paiements - Bööh Card Magic

## Vue d'ensemble

Ce guide explique comment les utilisateurs choisissent leur plan et payent pour leur abonnement.

## 🔄 Flux Utilisateur Complet

### 1. Inscription (Plan FREE automatique)
```
Utilisateur s'inscrit → Trigger Supabase → Plan FREE créé automatiquement
```

### 2. Découvrir les Plans
```
/pricing → Voir tous les plans → Cliquer sur "Passer à BUSINESS"
```

### 3. Choisir un Plan

**Route:** `/subscription`

L'utilisateur peut :
- Voir son plan actuel
- Comparer les plans disponibles
- Cliquer sur "Passer à ce plan"
- Sélectionner/désélectionner des add-ons

### 4. Confirmation et Paiement

#### Étape 1 : Dialog de Confirmation
- Affiche le plan sélectionné
- Montre le prix mensuel
- Bouton "Confirmer et payer"

#### Étape 2 : Appel Edge Function
```typescript
const { data, error } = await supabase.functions.invoke('upgrade-plan', {
  body: { 
    plan_type: 'business',
    payment_method: 'mobile_money',
    phone_number: '+226XXXXXXXX'
  }
});
```

#### Étape 3 : Initialisation du Paiement Mobile Money

L'Edge Function doit :
1. Créer une transaction dans la table `payment_transactions`
2. Appeler l'API Mobile Money (MTN, Orange, Moov)
3. Envoyer le USSD push à l'utilisateur
4. Retourner le `transaction_id`

### 5. Confirmation du Paiement

#### Option A : Webhook (Recommandé)
```
Mobile Money → Webhook Supabase → Mise à jour subscription
```

#### Option B : Polling
```
Frontend → Check status toutes les 5s → Update UI
```

## 📱 Intégration Mobile Money

### Configuration Requise

#### MTN Mobile Money
- API Key
- API Secret
- Subscription Key
- Environment: Sandbox / Production

#### Orange Money
- Client ID
- Client Secret
- Merchant Key

#### Moov Money
- Merchant ID
- API Key
- API Secret

### Tables à Créer

```sql
-- Table des transactions de paiement
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn_money', 'orange_money', 'moov_money')),
  phone_number TEXT NOT NULL,
  transaction_ref TEXT UNIQUE, -- Référence externe Mobile Money
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled')) DEFAULT 'pending',
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_ref ON payment_transactions(transaction_ref);
```

### Edge Function pour Initier le Paiement

```typescript
// supabase/functions/initiate-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { plan_type, payment_method, phone_number } = await req.json();
  
  // 1. Calculer le montant
  const planPrices = {
    free: 0,
    business: 12500,
    magic: 25000
  };
  const amount = planPrices[plan_type];
  
  // 2. Créer la transaction
  const { data: transaction } = await supabaseClient
    .from('payment_transactions')
    .insert({
      user_id: user.id,
      amount,
      currency: 'XOF',
      payment_method,
      phone_number,
      status: 'pending'
    })
    .select()
    .single();
  
  // 3. Appeler l'API Mobile Money selon le provider
  let mobileMoneyResponse;
  
  switch (payment_method) {
    case 'mtn_money':
      mobileMoneyResponse = await initiateMTNPayment({
        amount,
        phone: phone_number,
        reference: transaction.id
      });
      break;
      
    case 'orange_money':
      mobileMoneyResponse = await initiateOrangePayment({
        amount,
        phone: phone_number,
        reference: transaction.id
      });
      break;
      
    case 'moov_money':
      mobileMoneyResponse = await initiateMoovPayment({
        amount,
        phone: phone_number,
        reference: transaction.id
      });
      break;
  }
  
  // 4. Mettre à jour avec la référence externe
  await supabaseClient
    .from('payment_transactions')
    .update({
      transaction_ref: mobileMoneyResponse.referenceId,
      provider_response: mobileMoneyResponse
    })
    .eq('id', transaction.id);
  
  return new Response(JSON.stringify({
    success: true,
    transaction_id: transaction.id,
    message: 'Veuillez composer le code USSD pour confirmer le paiement'
  }));
});

// Fonction pour MTN
async function initiateMTNPayment({ amount, phone, reference }) {
  const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('MTN_API_KEY')}`,
      'X-Reference-Id': reference,
      'X-Target-Environment': 'sandbox',
      'Ocp-Apim-Subscription-Key': Deno.env.get('MTN_SUBSCRIPTION_KEY'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XOF',
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone.replace('+', '')
      },
      payerMessage: 'Abonnement Bööh Card',
      payeeNote: reference
    })
  });
  
  return await response.json();
}
```

### Webhook pour Confirmation

```typescript
// supabase/functions/payment-webhook/index.ts
serve(async (req) => {
  const payload = await req.json();
  
  // Vérifier la signature (sécurité)
  const signature = req.headers.get('X-Webhook-Signature');
  if (!verifySignature(payload, signature)) {
    throw new Error('Signature invalide');
  }
  
  // Extraire les infos
  const { transaction_ref, status } = payload;
  
  // Trouver la transaction
  const { data: transaction } = await supabaseClient
    .from('payment_transactions')
    .select('*, subscription_id, user_id')
    .eq('transaction_ref', transaction_ref)
    .single();
  
  if (!transaction) {
    throw new Error('Transaction introuvable');
  }
  
  // Mettre à jour le statut
  if (status === 'SUCCESSFUL') {
    // 1. Marquer la transaction comme réussie
    await supabaseClient
      .from('payment_transactions')
      .update({ status: 'success' })
      .eq('id', transaction.id);
    
    // 2. Activer l'abonnement
    await supabaseClient
      .from('user_subscriptions')
      .update({ 
        status: 'active',
        start_date: new Date().toISOString()
      })
      .eq('user_id', transaction.user_id);
    
    // 3. Envoyer un email de confirmation
    await sendConfirmationEmail(transaction.user_id);
  }
  
  return new Response('OK');
});
```

## 🎨 Interface Utilisateur - Page de Paiement

### Composant PaymentModal

```tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function PaymentModal({ plan, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtn_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Appeler Edge Function
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          plan_type: plan.type,
          payment_method: paymentMethod,
          phone_number: phoneNumber
        }
      });
      
      if (error) throw error;
      
      setTransactionId(data.transaction_id);
      
      // Commencer à poller le statut
      startStatusPolling(data.transaction_id);
      
    } catch (error) {
      toast.error('Erreur lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const startStatusPolling = (txId) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('payment_transactions')
        .select('status')
        .eq('id', txId)
        .single();
      
      if (data.status === 'success') {
        clearInterval(interval);
        toast.success('Paiement confirmé !');
        onClose();
        window.location.reload();
      } else if (data.status === 'failed') {
        clearInterval(interval);
        toast.error('Paiement échoué');
      }
    }, 5000); // Check toutes les 5 secondes
    
    // Arrêter après 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finaliser le paiement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Méthode de paiement</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mtn_money" id="mtn" />
                <Label htmlFor="mtn">MTN Mobile Money</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange_money" id="orange" />
                <Label htmlFor="orange">Orange Money</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moov_money" id="moov" />
                <Label htmlFor="moov">Moov Money</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label>Numéro de téléphone</Label>
            <Input
              type="tel"
              placeholder="+226 XX XX XX XX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous recevrez un message USSD pour confirmer le paiement de{' '}
              <strong>{plan.price.toLocaleString()} FCFA</strong>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!phoneNumber || isProcessing}
          >
            {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 📊 Monitoring et Analytics

### Dashboard Admin

Créer une page admin pour :
- Voir toutes les transactions
- Filtrer par statut
- Voir les abonnements actifs
- Calculer le MRR (Monthly Recurring Revenue)

```sql
-- Vue pour le MRR
CREATE VIEW subscription_revenue AS
SELECT 
  DATE_TRUNC('month', start_date) as month,
  plan_type,
  COUNT(*) as subscribers,
  SUM(
    CASE 
      WHEN plan_type = 'free' THEN 0
      WHEN plan_type = 'business' THEN 12500
      WHEN plan_type = 'magic' THEN 25000
    END
  ) as mrr
FROM user_subscriptions
WHERE status = 'active'
GROUP BY month, plan_type
ORDER BY month DESC;
```

## 🔐 Sécurité

1. **Valider toutes les entrées** dans les Edge Functions
2. **Vérifier les signatures** des webhooks
3. **Logger toutes les transactions** pour audit
4. **Chiffrer les données sensibles** (numéros de téléphone)
5. **Rate limiting** sur les endpoints de paiement

## 🚀 Déploiement

### Étape 1 : Variables d'environnement
```bash
# Dans Supabase Dashboard > Settings > Functions
MTN_API_KEY=your_key
MTN_SUBSCRIPTION_KEY=your_key
ORANGE_CLIENT_ID=your_id
ORANGE_CLIENT_SECRET=your_secret
MOOV_MERCHANT_ID=your_id
```

### Étape 2 : Déployer les Edge Functions
```bash
supabase functions deploy upgrade-plan
supabase functions deploy update-addons
supabase functions deploy initiate-payment
supabase functions deploy payment-webhook
```

### Étape 3 : Configurer les Webhooks
Dans chaque provider Mobile Money, configurer l'URL :
```
https://your-project.supabase.co/functions/v1/payment-webhook
```

## 📝 Checklist de Mise en Production

- [ ] Créer les tables de transactions
- [ ] Implémenter les Edge Functions
- [ ] Tester en sandbox
- [ ] Obtenir les credentials production
- [ ] Configurer les webhooks
- [ ] Tester le flux complet
- [ ] Mettre en place le monitoring
- [ ] Former l'équipe support

## 🆘 Support

En cas de problème de paiement :
1. Vérifier le statut dans `payment_transactions`
2. Consulter les logs Edge Functions
3. Contacter le support du provider Mobile Money
