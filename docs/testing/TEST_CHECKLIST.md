# ✅ Checklist de Test - Système d'Abonnement

## 🚀 Tests Rapides (5 minutes)

### 1. Vérifier les Edge Functions
```bash
# Dans le terminal
supabase functions list

# Attendu:
# ✅ upgrade-plan
# ✅ update-addons
```

### 2. Tester le Frontend

#### A. Lancer l'app
```bash
npm run dev
# Ouvrir http://localhost:8080
```

#### B. Se connecter ou créer un compte
- Créer un nouveau compte → **Plan FREE automatique** ✅

#### C. Accéder à la gestion d'abonnement
```
URL: http://localhost:8080/subscription
```

**Vérifications visuelles :**
- [ ] La page charge sans erreur
- [ ] Le plan actuel (FREE) s'affiche en haut
- [ ] 2 onglets visibles : "Changer de plan" et "Gérer les add-ons"
- [ ] Les 3 cartes de plans s'affichent (FREE, BUSINESS, MAGIC)

---

## 🧪 Test Complet (10 minutes)

### Test 1 : Upgrade de Plan

**Étapes :**
1. Sur `/subscription`
2. Onglet "Changer de plan"
3. Cliquer sur **"Passer à BUSINESS"**
4. Dialog de confirmation s'ouvre
5. Vérifier les infos :
   - Plan actuel: FREE
   - Nouveau plan: BUSINESS  
   - Prix: 12,500 FCFA/mois
6. Cliquer **"Confirmer et payer"**

**Résultats attendus :**
- [ ] Loading spinner pendant 1-2 secondes
- [ ] Toast vert : "Mise à jour réussie !"
- [ ] Dialog se ferme automatiquement
- [ ] Badge en haut change : **BUSINESS** (au lieu de FREE)
- [ ] Prix total : **12,500 FCFA/mois**

**Vérifier en console (F12) :**
```javascript
// Doit voir:
POST /functions/v1/upgrade-plan
Status: 200
Response: {success: true, ...}
```

**Vérifier en base de données :**
```sql
SELECT plan_type, status FROM user_subscriptions 
WHERE user_id = auth.uid();

-- Résultat attendu:
-- plan_type: 'business'
-- status: 'active'
```

---

### Test 2 : Gestion des Add-ons

**Étapes :**
1. Sur `/subscription` 
2. Onglet **"Gérer les add-ons"**
3. Cliquer sur la carte **"Pack Volume"**
4. Observer le prix total se mettre à jour
5. Cliquer sur **"Enregistrer les modifications"**

**Résultats attendus :**
- [ ] Carte "Pack Volume" a une coche ✓
- [ ] Prix passe de 12,500 → **17,500 FCFA/mois**
- [ ] Bouton "Enregistrer" devient actif
- [ ] Toast : "Add-ons mis à jour avec succès"

**Vérifier en BDD :**
```sql
SELECT addons FROM user_subscriptions 
WHERE user_id = auth.uid();

-- Résultat attendu:
-- addons: ["pack_volume"]
```

---

### Test 3 : Retirer un Add-on

**Étapes :**
1. Cliquer à nouveau sur **"Pack Volume"** (décocher)
2. Prix redescend à **12,500 FCFA**
3. Cliquer **"Enregistrer"**

**Résultats attendus :**
- [ ] La coche ✓ disparaît
- [ ] Prix : 12,500 FCFA
- [ ] Toast de succès

---

### Test 4 : Upgrade vers MAGIC

**Étapes :**
1. Onglet "Changer de plan"
2. Cliquer **"Passer à MAGIC"**
3. Confirmer dans le dialog

**Résultats attendus :**
- [ ] Toast : "Plan MAGIC activé"
- [ ] Badge : **MAGIC**
- [ ] Prix : **25,000 FCFA/mois**
- [ ] Dans l'onglet Add-ons, plus d'add-ons disponibles (MAGIC a tout inclus)

---

### Test 5 : Page Pricing Publique

**URL :** `http://localhost:8080/pricing`

**Vérifications :**
- [ ] Page accessible sans connexion
- [ ] 3 colonnes de plans visibles
- [ ] Badge "Le plus populaire" sur BUSINESS
- [ ] Section "Add-ons" en bas
- [ ] CTA "Commencer gratuitement" pour FREE
- [ ] CTA "Passer à..." pour BUSINESS et MAGIC

---

## 🐛 Tests d'Erreur

### Test 6 : Utilisateur non connecté

**Étapes :**
1. Se déconnecter
2. Aller sur `/subscription` (URL directe)

**Résultat attendu :**
- [ ] Redirection automatique vers `/auth`
- [ ] Après connexion, retour sur `/subscription`

---

### Test 7 : Plan déjà actif

**Étapes :**
1. Être sur plan BUSINESS
2. Cliquer sur la carte BUSINESS (plan actuel)

**Résultat attendu :**
- [ ] Toast : "Vous êtes déjà sur ce plan"
- [ ] Bouton désactivé ou grayed-out

---

### Test 8 : Add-ons identiques

**Étapes :**
1. Avoir "Pack Volume" actif
2. Ne rien changer
3. Cliquer "Enregistrer"

**Résultat attendu :**
- [ ] Bouton "Enregistrer" est **désactivé**
- [ ] Texte : "disabled" ou couleur grisée

---

## 📊 Vérifications Techniques

### Console Navigateur (F12)

**Onglet Console :**
- [ ] Aucune erreur rouge
- [ ] Pas de warning sur `supabase` undefined
- [ ] Logs de succès des Edge Functions

**Onglet Network :**
- [ ] Requêtes vers `/functions/v1/upgrade-plan` → Status 200
- [ ] Requêtes vers `/functions/v1/update-addons` → Status 200
- [ ] Headers `Authorization: Bearer ...` présent

---

### Supabase Dashboard

**Edge Functions → Logs :**
- [ ] Pas d'erreurs 500
- [ ] Requêtes loguées avec succès
- [ ] Payload correct dans les logs

**SQL Editor :**
```sql
-- Vérifier qu'il y a des abonnements
SELECT COUNT(*) FROM user_subscriptions;
-- Doit être > 0

-- Vérifier les plans actifs
SELECT plan_type, COUNT(*) as count 
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY plan_type;

-- Vérifier que RLS fonctionne
-- (se connecter comme user normal, pas admin)
SELECT * FROM user_subscriptions;
-- Doit voir SEULEMENT son propre abonnement
```

---

## 🎯 Résumé des Tests

| Test | Objectif | Statut |
|------|----------|--------|
| 1. Upgrade FREE → BUSINESS | Change de plan | ⬜ |
| 2. Ajouter add-on | Gestion add-ons | ⬜ |
| 3. Retirer add-on | Gestion add-ons | ⬜ |
| 4. Upgrade BUSINESS → MAGIC | Change de plan | ⬜ |
| 5. Page Pricing publique | Affichage | ⬜ |
| 6. Redirection non-auth | Sécurité | ⬜ |
| 7. Plan déjà actif | UX | ⬜ |
| 8. Add-ons identiques | UX | ⬜ |

**Si tous les tests sont ✅, le système est opérationnel !**

---

## 🚨 En Cas de Problème

### Edge Function ne répond pas
```bash
# Re-déployer
supabase functions deploy upgrade-plan
supabase functions deploy update-addons

# Vérifier les logs
supabase functions logs upgrade-plan --follow
```

### Erreur dans le Frontend
```bash
# Vérifier que supabase est importé
grep "import.*supabase" src/pages/SubscriptionManagement.tsx

# Doit afficher:
# import { supabase } from '@/integrations/supabase/client';
```

### BDD non mise à jour
```sql
-- Vérifier que le trigger fonctionne
SELECT * FROM pg_trigger WHERE tgname = 'update_user_subscriptions_updated_at';

-- Vérifier RLS
SELECT * FROM pg_policies WHERE tablename = 'user_subscriptions';
```

---

## ✅ Validation Finale

**Tous les tests passent ?** → Vous êtes prêt ! 🎉

**Prochaine étape :**
Intégrer Mobile Money pour accepter les vrais paiements.
Voir : [PAYMENT_INTEGRATION_GUIDE.md](PAYMENT_INTEGRATION_GUIDE.md)

---

## 📝 Notes

Date du test : ___________  
Testeur : ___________  
Environnement : ☐ Local  ☐ Staging  ☐ Production  
Résultat global : ☐ ✅ Tous les tests OK  ☐ ⚠️ Quelques problèmes  ☐ ❌ Bugs majeurs
