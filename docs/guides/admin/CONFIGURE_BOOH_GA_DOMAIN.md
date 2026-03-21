# 🌐 Configuration du Domaine booh.ga pour les Emails

## Étape 1 : Ajouter le Domaine dans Resend

### 1.1 Accéder à Resend
1. Allez sur https://resend.com/domains
2. Connectez-vous à votre compte
3. Cliquez sur **"Add Domain"**

### 1.2 Ajouter booh.ga
1. Entrez : `booh.ga`
2. Cliquez sur **"Add"**

### 1.3 Configurer les Enregistrements DNS

Resend va vous fournir des enregistrements DNS à ajouter. Vous devrez ajouter ces enregistrements chez votre registrar de domaine (où vous avez acheté booh.ga).

**Enregistrements typiques requis :**

#### SPF Record (TXT)
```
Nom : @ (ou booh.ga)
Type : TXT
Valeur : v=spf1 include:resend.com ~all
```

#### DKIM Records (TXT) - 3 enregistrements
```
Nom : resend._domainkey
Type : TXT
Valeur : [fournie par Resend]

Nom : resend2._domainkey
Type : TXT
Valeur : [fournie par Resend]

Nom : resend3._domainkey
Type : TXT
Valeur : [fournie par Resend]
```

### 1.4 Vérifier le Domaine
1. Ajoutez les enregistrements DNS chez votre registrar
2. Attendez 5-30 minutes pour la propagation
3. Retournez sur Resend et cliquez sur **"Verify"**
4. Le statut doit passer de "Pending" à **"Verified"** ✅

---

## Étape 2 : Mettre à Jour la Fonction Edge

Une fois votre domaine vérifié, mettez à jour la fonction pour utiliser votre domaine.

### 2.1 Modifier le Fichier

Le fichier `/supabase/functions/send-invoice-email/index.ts` a déjà été modifié, mais nous allons le personnaliser pour votre domaine :

```typescript
// AVANT (domaine de test)
from: 'Booh <onboarding@resend.dev>',

// APRÈS (votre domaine)
from: 'Booh <noreply@booh.ga>',
```

### 2.2 Redéployer la Fonction

```bash
supabase functions deploy send-invoice-email
```

---

## Étape 3 : Tester l'Envoi

### 3.1 Test Direct via Curl

```bash
curl -i --location --request POST \
  'https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email' \
  --header 'Authorization: Bearer VOTRE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "invoice_number": "TEST-001",
    "client_name": "Test Client",
    "client_email": "votre@email.com",
    "total_ttc": 50000,
    "issue_date": "2025-01-15",
    "due_date": "2025-02-15",
    "user_name": "Booh Card"
  }'
```

Remplacez :
- `VOTRE_ANON_KEY` par votre clé dans .env (`VITE_SUPABASE_ANON_KEY`)
- `votre@email.com` par votre vrai email

### 3.2 Test via l'Application

1. Créez une facture de test
2. Mettez votre propre email comme client
3. Cliquez sur "Envoyer"
4. Vérifiez votre boîte email !

---

## 🚨 Si le Domaine N'est Pas Encore Vérifié

**Option 1 : Utiliser le Domaine de Test Temporairement**

Pour tester immédiatement sans attendre la vérification DNS :
- La fonction utilise déjà `onboarding@resend.dev` (domaine de test de Resend)
- Redéployez simplement : `supabase functions deploy send-invoice-email`
- Ça fonctionnera tout de suite !

**Option 2 : Attendre la Vérification**

- Ajoutez les enregistrements DNS
- Attendez 5-30 minutes
- Vérifiez dans Resend
- Puis modifiez et redéployez

---

## 📋 Checklist Complète

### Configuration Resend
- [ ] Compte Resend créé
- [ ] Domaine booh.ga ajouté dans Resend
- [ ] Enregistrements DNS SPF ajoutés
- [ ] Enregistrements DNS DKIM ajoutés (3x)
- [ ] Domaine vérifié dans Resend (statut "Verified")
- [ ] Clé API Resend configurée : `supabase secrets set RESEND_API_KEY=re_xxx`

### Configuration Supabase
- [ ] Fonction modifiée pour utiliser booh.ga
- [ ] Fonction redéployée : `supabase functions deploy send-invoice-email`
- [ ] Fonction listée : `supabase functions list` (STATUS: ACTIVE)

### Tests
- [ ] Test curl réussi (statut 200)
- [ ] Test depuis l'application réussi
- [ ] Email reçu dans la boîte
- [ ] Template HTML correct

---

## 🎯 Configuration DNS Détaillée

Selon votre registrar de domaine, voici où ajouter les enregistrements :

### Si vous utilisez Freenom (.ga gratuit)
1. Allez sur https://my.freenom.com
2. Services → My Domains
3. Manage Domain → Manage Freenom DNS
4. Ajoutez les enregistrements TXT fournis par Resend

### Si vous utilisez Cloudflare
1. Allez sur https://dash.cloudflare.com
2. Sélectionnez booh.ga
3. DNS → Records
4. Add record (pour chaque enregistrement)

### Si vous utilisez un autre registrar
Consultez la documentation de votre registrar pour savoir comment ajouter des enregistrements TXT.

---

## 🔍 Vérification DNS

Pour vérifier que vos enregistrements DNS sont bien propagés :

```bash
# Vérifier SPF
dig TXT booh.ga

# Vérifier DKIM
dig TXT resend._domainkey.booh.ga
dig TXT resend2._domainkey.booh.ga
dig TXT resend3._domainkey.booh.ga
```

Ou utilisez un outil en ligne : https://mxtoolbox.com/

---

## 💡 Emails Recommandés

Une fois votre domaine vérifié, vous pouvez utiliser :

- `noreply@booh.ga` - Pour les factures (pas de réponse)
- `factures@booh.ga` - Alternative
- `contact@booh.ga` - Pour support client
- `admin@booh.ga` - Pour communications importantes

**Important :** Tous ces emails fonctionneront pour **l'envoi uniquement** via Resend. Pour recevoir des emails, vous devez configurer un service de messagerie (Gmail, Outlook, etc.).

---

## 🆘 Problèmes Courants

### Le domaine ne se vérifie pas

**Causes possibles :**
- Enregistrements DNS incorrects
- Propagation DNS pas encore terminée (attendre 1-2h)
- Enregistrements ajoutés au mauvais endroit

**Solution :**
- Vérifier les valeurs exactes dans Resend
- Attendre plus longtemps
- Utiliser `dig` pour vérifier
- Contacter le support du registrar

### Emails marqués comme spam

**Solutions :**
- Vérifier que SPF et DKIM sont configurés
- Ne pas envoyer trop d'emails d'un coup
- Demander aux destinataires de marquer comme "pas spam"
- Ajouter un lien de désinscription dans vos emails

### "Domain not verified" dans les logs

**Solution :**
- Vérifier le statut dans Resend
- Si "Pending", attendre la propagation DNS
- Si "Failed", vérifier les enregistrements DNS

---

## 📞 Support

### Support Resend
- Documentation : https://resend.com/docs
- Email : support@resend.com
- Discord : https://resend.com/discord

### Support Freenom (.ga)
- https://my.freenom.com/clientarea.php?action=tickets

---

**Status Actuel :**
- ✅ Fonction Edge prête
- ✅ Template email prêt
- ⏳ En attente de vérification domaine booh.ga
- ✅ Fallback sur onboarding@resend.dev (fonctionne déjà)

**Prochaine étape :** Vérifier votre domaine sur Resend !
