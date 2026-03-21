# Guide de Vérification du Déploiement

## ✅ Étapes de Vérification Post-Déploiement

### 1. Vérifier que les Edge Functions sont déployées

```bash
# Lister les fonctions déployées
supabase functions list

# Vous devriez voir:
# - upgrade-plan
# - update-addons
```

**Statut attendu:** ✅ Les deux fonctions apparaissent dans la liste

---

### 2. Tester les Edge Functions depuis Supabase Dashboard

#### A. Tester `upgrade-plan`

1. Allez sur **Supabase Dashboard** → **Edge Functions** → `upgrade-plan`
2. Cliquez sur **"Invoke"** ou **"Test"**
3. Utilisez ce payload de test :

```json
{
  "plan_type": "business"
}
```

4. Cliquez sur **"Send Request"**

**Réponse attendue :**
```json
{
  "success": true,
  "subscription": {
    "id": "...",
    "user_id": "...",
    "plan_type": "business",
    "status": "active"
  },
  "message": "Plan mis à jour avec succès"
}
```

#### B. Tester `update-addons`

1. Allez sur **Edge Functions** → `update-addons`
2. Payload de test :

```json
{
  "addons": ["pack_volume", "pack_createur"]
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "subscription": {
    "addons": ["pack_volume", "pack_createur"]
  },
  "message": "Add-ons mis à jour avec succès"
}
```

---

### 3. Vérifier les Logs des Edge Functions

```bash
# Voir les logs en temps réel
supabase functions logs upgrade-plan --follow
```

Ou dans le **Dashboard Supabase** :
- Edge Functions → upgrade-plan → **Logs**
- Vérifiez qu'il n'y a pas d'erreurs

---

### 4. Tester le Frontend

#### A. Accéder à la page de gestion

1. Lancez l'application :
```bash
npm run dev
```

2. Connectez-vous avec un compte utilisateur

3. Allez sur : `http://localhost:8080/subscription`

**Vérifications :**
- ✅ La page charge sans erreur
- ✅ Le plan actuel s'affiche
- ✅ Les onglets "Plans" et "Add-ons" fonctionnent
- ✅ Les cartes de plans s'affichent correctement

#### B. Tester le changement de plan

1. Dans l'onglet **"Changer de plan"**
2. Cliquez sur **"Passer à BUSINESS"** (ou MAGIC)
3. Une dialog de confirmation s'ouvre
4. Cliquez sur **"Confirmer et payer"**

**Vérifications dans la Console :**
```javascript
// Ouvrez la console développeur (F12)
// Vous devriez voir:
"Calling Edge Function: upgrade-plan"
{success: true, subscription: {...}}
```

**Toast attendu :** "Mise à jour réussie ! Vous êtes maintenant sur le plan BUSINESS"

#### C. Tester la gestion des add-ons

1. Dans l'onglet **"Gérer les add-ons"**
2. Cliquez sur une carte d'add-on pour le sélectionner
3. Le prix total se met à jour automatiquement
4. Cliquez sur **"Enregistrer les modifications"**

**Toast attendu :** "Add-ons mis à jour avec succès"

---

### 5. Vérifier la Base de Données

#### Ouvrir le SQL Editor dans Supabase Dashboard

```sql
-- Vérifier la table user_subscriptions
SELECT * FROM user_subscriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'votre-email@test.com')
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu :**
```
| id | user_id | plan_type | status | addons | updated_at |
|----|---------|-----------|--------|--------|------------|
| ... | ... | business | active | ["pack_volume"] | 2025-10-17... |
```

**Vérifications :**
- ✅ `plan_type` a changé
- ✅ `status` = 'active'
- ✅ `addons` contient les add-ons sélectionnés
- ✅ `updated_at` est récent

---

### 6. Vérifier les Permissions RLS

```sql
-- Tester que l'utilisateur peut voir son abonnement
SELECT * FROM user_subscriptions WHERE user_id = auth.uid();

-- Tester que l'utilisateur ne peut pas voir les autres
SELECT * FROM user_subscriptions WHERE user_id != auth.uid();
-- Résultat attendu: 0 lignes (sécurisé ✅)
```

---

## 🐛 Résolution des Problèmes Courants

### Problème 1 : "Function not found"

**Cause :** La fonction n'est pas déployée ou mal nommée

**Solution :**
```bash
# Re-déployer
supabase functions deploy upgrade-plan
supabase functions deploy update-addons

# Vérifier
supabase functions list
```

---

### Problème 2 : "401 Unauthorized"

**Cause :** L'utilisateur n'est pas authentifié

**Solution :**
- Vérifiez que l'utilisateur est bien connecté
- Vérifiez le token JWT dans les en-têtes
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session); // Doit avoir un access_token
```

---

### Problème 3 : "Cannot find name 'supabase'"

**Cause :** Import manquant dans le frontend

**Solution :**
```typescript
// Ajouter dans SubscriptionManagement.tsx
import { supabase } from '@/integrations/supabase/client';
```

---

### Problème 4 : CORS Error

**Cause :** Headers CORS non configurés dans Edge Function

**Solution :**
Les Edge Functions incluent déjà les headers CORS :
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Si l'erreur persiste, ajoutez ces headers dans la réponse.

---

### Problème 5 : "Plan invalide"

**Cause :** Le `plan_type` envoyé n'est pas valide

**Solution :**
Vérifiez que vous envoyez un des plans valides :
```typescript
// Valeurs acceptées:
'free', 'business', 'magic'

// ❌ Incorrect:
'FREE', 'Business', 'MAGIC'

// ✅ Correct:
'free', 'business', 'magic'
```

---

## 📊 Checklist de Vérification Complète

### Backend (Supabase)

- [ ] Edge Function `upgrade-plan` déployée
- [ ] Edge Function `update-addons` déployée
- [ ] Table `user_subscriptions` existe
- [ ] RLS activé sur `user_subscriptions`
- [ ] Trigger `on_auth_user_created_subscription` actif
- [ ] Les logs Edge Functions ne montrent pas d'erreurs

### Frontend

- [ ] Page `/subscription` accessible
- [ ] Import `supabase` présent dans SubscriptionManagement.tsx
- [ ] Les appels Edge Functions sont décommentés (ligne 77 et 110)
- [ ] Le toast de succès s'affiche après changement
- [ ] Le refetch() met à jour l'UI automatiquement

### Tests Utilisateur

- [ ] Créer un nouveau compte → Plan FREE auto
- [ ] Upgrader vers BUSINESS → Succès
- [ ] Ajouter un add-on → Prix mis à jour
- [ ] Retirer un add-on → Prix mis à jour
- [ ] Changer vers MAGIC → Succès

### Base de Données

- [ ] Les changements sont persistés
- [ ] Les dates `updated_at` sont correctes
- [ ] Les add-ons sont stockés en JSON array
- [ ] Un utilisateur ne voit que son abonnement

---

## 🎯 Test Complet End-to-End

### Scénario de Test

```
1. Créer un compte test:
   Email: test@booh.com
   → Plan FREE créé automatiquement ✅

2. Aller sur /subscription
   → Affiche plan FREE ✅

3. Cliquer "Passer à BUSINESS"
   → Dialog s'ouvre ✅
   → Prix: 12,500 FCFA ✅

4. Confirmer
   → Edge Function appelée ✅
   → Toast "Mise à jour réussie" ✅
   → UI refresh automatique ✅
   → Badge "BUSINESS" affiché ✅

5. Onglet "Add-ons"
   → Sélectionner "Pack Volume" ✅
   → Prix: 12,500 + 5,000 = 17,500 ✅

6. Enregistrer
   → Edge Function appelée ✅
   → Toast "Add-ons mis à jour" ✅

7. Vérifier en BDD:
   SELECT * FROM user_subscriptions WHERE user_id = '...'
   → plan_type = 'business' ✅
   → addons = ["pack_volume"] ✅
```

---

## 🚀 Prochaines Étapes

Maintenant que les Edge Functions sont déployées et actives :

1. **Intégrer Mobile Money**
   - Voir [PAYMENT_INTEGRATION_GUIDE.md](PAYMENT_INTEGRATION_GUIDE.md)
   - Ajouter MTN/Orange/Moov API

2. **Créer la table `payment_transactions`**
   ```sql
   CREATE TABLE payment_transactions (...);
   ```

3. **Déployer les fonctions de paiement**
   - `initiate-payment`
   - `payment-webhook`

4. **Tester en Sandbox**
   - Mode test MTN/Orange/Moov

5. **Passer en Production**
   - Obtenir les credentials production
   - Mettre à jour les variables d'environnement

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs :**
   ```bash
   supabase functions logs upgrade-plan
   ```

2. **Tester manuellement dans Supabase Dashboard**
   - Edge Functions → Invoke

3. **Vérifier la console du navigateur (F12)**
   - Onglet Console
   - Onglet Network → Filtrer "functions"

4. **Consulter la documentation :**
   - [COMMENT_LES_USERS_CHOISISSENT.md](COMMENT_LES_USERS_CHOISISSENT.md)
   - [SUBSCRIPTION_SYSTEM.md](SUBSCRIPTION_SYSTEM.md)

---

## ✅ Validation Finale

Si tous ces points sont verts, le système est opérationnel ! 🎉

- ✅ Edge Functions déployées et fonctionnelles
- ✅ Frontend connecté aux Edge Functions
- ✅ Base de données mise à jour correctement
- ✅ UI responsive et feedback utilisateur clair
- ✅ Sécurité RLS active

**Vous êtes prêt à accepter des changements de plan ! 🚀**
