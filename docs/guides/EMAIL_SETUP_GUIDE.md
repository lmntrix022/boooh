# Guide de configuration de l'envoi d'emails pour les factures

## 🎯 Problème identifié

L'erreur 403 lors de l'envoi d'emails provient d'une **limitation de Resend en mode gratuit** :

- ✅ Vous pouvez envoyer des emails **uniquement à votre propre adresse email** (`ekq022@gmail.com`)
- ❌ Vous **ne pouvez pas** envoyer à d'autres adresses (`lemaneq02@gmail.com`, etc.) sans domaine vérifié

## ✅ Solutions

### Solution 1 : Test avec votre propre email (Immédiat)

**Pour tester l'envoi d'emails immédiatement :**

1. Ouvrez une facture dans l'application
2. Changez l'email du client pour `ekq022@gmail.com` (votre email)
3. Cliquez sur "Envoyer par email"
4. ✅ L'email sera envoyé avec succès !

### Solution 2 : Vérifier un domaine dans Resend (Production)

**Pour envoyer des emails à n'importe quel client :**

#### Étape 1 : Vérifier votre domaine sur Resend

1. Allez sur https://resend.com/domains
2. Connectez-vous avec votre compte Resend
3. Cliquez sur **"Add Domain"**
4. Entrez votre domaine : `booh.ga`
5. Suivez les instructions pour ajouter les enregistrements DNS :
   - `TXT` pour la vérification
   - `MX` pour recevoir les emails (optionnel)
   - `DKIM` pour l'authentification

#### Étape 2 : Mettre à jour l'Edge Function

Une fois le domaine vérifié, modifiez le fichier :
`supabase/functions/send-invoice-email/index.ts`

Trouvez cette ligne (environ ligne 285) :
```typescript
const fromEmail = 'Booh <onboarding@resend.dev>';
```

Remplacez-la par :
```typescript
const fromEmail = 'Booh <noreply@booh.ga>';
```

#### Étape 3 : Redéployer la fonction

```bash
supabase functions deploy send-invoice-email --no-verify-jwt
```

#### Étape 4 : Tester

Envoyez une facture à n'importe quel email - ça fonctionnera ! 🎉

---

## 📊 État actuel

### ✅ Ce qui fonctionne

- ✅ L'Edge Function est déployée et configurée
- ✅ La clé API Resend est configurée (`RESEND_API_KEY`)
- ✅ L'authentification Supabase fonctionne
- ✅ Les emails peuvent être envoyés **à votre propre adresse** (`ekq022@gmail.com`)
- ✅ Le template HTML est moderne et responsive

### ⚠️ Limitations actuelles

- ⚠️ Mode gratuit Resend : emails limités à votre propre adresse
- ⚠️ Domaine non vérifié : `onboarding@resend.dev` utilisé (domaine de test)

### 🎯 Prochaines étapes recommandées

1. **Vérifier le domaine `booh.ga` dans Resend** (30 minutes)
2. Mettre à jour l'adresse `from` dans l'Edge Function
3. Redéployer la fonction
4. Envoyer des factures à tous vos clients ! 🚀

---

## 🧪 Tests effectués

### Test 1 : Page de test HTML ✅
- **Fichier** : `test-email-function.html`
- **Email destinataire** : `ekq022@gmail.com` (votre email)
- **Résultat** : ✅ Succès
- **Raison** : Envoi à votre propre email = autorisé par Resend

### Test 2 : Page Facture ❌ → ✅
- **Page** : `/facture`
- **Email destinataire** : `lemaneq02@gmail.com` (client)
- **Résultat initial** : ❌ Erreur 403
- **Raison** : Resend refuse les emails à d'autres adresses sans domaine vérifié
- **Solution** : Changer temporairement l'email du client pour `ekq022@gmail.com`

---

## 💡 Alternatives à Resend

Si vous préférez un autre service d'envoi d'emails :

### SendGrid
- ✅ 100 emails/jour gratuits
- ✅ Pas de limitation sur les destinataires en mode gratuit
- 🔗 https://sendgrid.com

### Mailgun
- ✅ 5,000 emails/mois gratuits (3 premiers mois)
- ✅ Bonne documentation
- 🔗 https://mailgun.com

### Amazon SES
- ✅ Très bon rapport qualité/prix ($0.10 pour 1000 emails)
- ⚠️ Configuration plus complexe
- 🔗 https://aws.amazon.com/ses

---

## 📝 Logs et débogage

### Voir les logs de l'Edge Function

**Via le dashboard Supabase :**
https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions/send-invoice-email/logs

**Via la console de votre navigateur :**
Les logs commencent par des émojis pour faciliter le débogage :
- 📧 `Sending email with params` : Données envoyées
- 🔐 `Current session` : État de l'authentification
- ✅ `Email sent successfully` : Succès
- ❌ `Error` : Erreur avec détails

### Tester directement avec curl

```bash
# Récupérez d'abord votre token d'accès depuis la console :
# localStorage.getItem('supabase.auth.token')

curl -X POST https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "invoice_number": "TEST-001",
    "client_name": "Test Client",
    "client_email": "ekq022@gmail.com",
    "total_ttc": 10000,
    "issue_date": "2025-10-13",
    "due_date": "2025-11-13",
    "user_email": "ekq022@gmail.com",
    "user_name": "Your Name"
  }'
```

---

## 🔧 Configuration technique

### Variables d'environnement (Supabase Secrets)

```bash
# Vérifier les secrets configurés
supabase secrets list

# Secrets actuels :
# - RESEND_API_KEY ✅
# - SUPABASE_URL ✅
# - SUPABASE_ANON_KEY ✅
```

### Configuration de l'Edge Function

**Fichier** : `supabase/config.toml`

```toml
[functions.send-invoice-email]
verify_jwt = false
# Note: JWT verification désactivée pour permettre des messages d'erreur plus clairs
```

### Déploiement

```bash
# Déployer la fonction
supabase functions deploy send-invoice-email --no-verify-jwt

# Vérifier le déploiement
supabase functions list
```

---

## ❓ FAQ

### Q : Pourquoi la page de test fonctionne mais pas la page facture ?

**R :** La page de test envoie à **votre email** (`ekq022@gmail.com`), ce qui est autorisé par Resend. La page facture envoie à **l'email du client** (autre adresse), ce qui nécessite un domaine vérifié.

### Q : Combien coûte la vérification d'un domaine dans Resend ?

**R :** C'est **gratuit** ! Le plan gratuit de Resend inclut :
- ✅ 100 emails/jour
- ✅ 3,000 emails/mois
- ✅ Domaines personnalisés vérifiés
- ✅ Tracking des emails

### Q : Puis-je utiliser un sous-domaine ?

**R :** Oui ! Par exemple : `mail.booh.ga` ou `noreply.booh.ga`

### Q : Combien de temps prend la vérification DNS ?

**R :** Généralement **quelques minutes à quelques heures**, selon votre fournisseur DNS.

---

## 🚀 Checklist de mise en production

- [ ] Vérifier le domaine `booh.ga` dans Resend
- [ ] Ajouter les enregistrements DNS (TXT, DKIM)
- [ ] Attendre la vérification DNS (quelques minutes)
- [ ] Mettre à jour `fromEmail` dans l'Edge Function
- [ ] Redéployer la fonction avec `supabase functions deploy`
- [ ] Tester l'envoi à un email externe
- [ ] Configurer le suivi des bounces (optionnel)
- [ ] Configurer les webhooks Resend (optionnel)

---

## 📞 Support

**Resend Documentation :**
- Vérification de domaine : https://resend.com/docs/dashboard/domains/introduction
- API Reference : https://resend.com/docs/api-reference/introduction

**Supabase Edge Functions :**
- Documentation : https://supabase.com/docs/guides/functions
- Logs : https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions

---

Créé le : 2025-10-13
Dernière mise à jour : 2025-10-13
