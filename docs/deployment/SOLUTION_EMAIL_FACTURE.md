# 📧 SOLUTION COMPLÈTE : Envoi d'email pour les factures

## 🔍 Diagnostic du problème

**Symptôme** : L'envoi d'email ne fonctionne pas sur la page `/facture`

**Cause identifiée** : La fonction Edge Supabase `send-invoice-email` n'est **pas déployée en production**

**Preuve** :
- ✅ Clé API Resend configurée : `re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW`
- ✅ Code de la fonction créé : `supabase/functions/send-invoice-email/index.ts`
- ✅ Service frontend prêt : `src/services/emailService.ts`
- ❌ Fonction non déployée sur Supabase
- ❌ Docker non actif (impossible de tester localement)

---

## 🚀 SOLUTION RAPIDE (5 minutes)

### Option 1 : Déploiement automatique avec le script

```bash
cd /Users/valerie/Downloads/boooh-main
./deploy-email-function.sh
```

Ce script va :
1. ✅ Vérifier que Supabase CLI est installé
2. ✅ Se connecter à votre projet Supabase
3. ✅ Configurer le secret `RESEND_API_KEY`
4. ✅ Déployer la fonction `send-invoice-email`

### Option 2 : Déploiement manuel

```bash
# 1. Installer Supabase CLI (si nécessaire)
brew install supabase/tap/supabase

# 2. Se connecter
supabase login

# 3. Lier le projet
cd /Users/valerie/Downloads/boooh-main
supabase link --project-ref tgqrnrqpeaijtrlnbgfj

# 4. Configurer le secret
supabase secrets set RESEND_API_KEY=re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW

# 5. Déployer la fonction
supabase functions deploy send-invoice-email
```

---

## 🧪 TEST IMMÉDIAT

### Test 1 : Avec curl

```bash
curl -X POST https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncXJucnFwZWFpanRybG5iZ2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODg2OTksImV4cCI6MjA3NTA2NDY5OX0.cpu0Pi7yi_lfofCjzRjidPyR7QtuV6Ihh3gYK87oNsw" \
  -d '{
    "invoice_number": "TEST-001",
    "client_name": "Test Client",
    "client_email": "VOTRE_EMAIL@example.com",
    "total_ttc": 50000,
    "issue_date": "2025-10-13",
    "due_date": "2025-11-13",
    "user_name": "Booh"
  }'
```

**Remplacez `VOTRE_EMAIL@example.com` par votre vraie adresse !**

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email_id": "abc123..."
}
```

### Test 2 : Depuis l'application

1. Allez sur [http://localhost:8080/facture](http://localhost:8080/facture)
2. Créez une facture avec votre email comme client
3. Cliquez sur le bouton "Envoyer"
4. Vérifiez votre boîte mail (et les spams !)

---

## 📊 VÉRIFICATIONS

### Vérifier que la fonction est déployée

1. Allez sur [https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj](https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj)
2. Menu "Edge Functions"
3. Vous devriez voir `send-invoice-email` dans la liste
4. Statut : **Active** ✅

### Vérifier les secrets

```bash
supabase secrets list --project-ref tgqrnrqpeaijtrlnbgfj
```

Vous devriez voir :
```
RESEND_API_KEY=re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW
```

### Vérifier les logs

1. Dashboard Supabase → Edge Functions → send-invoice-email → Logs
2. Ou avec CLI :
```bash
supabase functions logs send-invoice-email --project-ref tgqrnrqpeaijtrlnbgfj
```

---

## 🔧 DÉPANNAGE

### Problème : "supabase: command not found"

**Solution** :
```bash
brew install supabase/tap/supabase
```

### Problème : "Failed to deploy function"

**Causes possibles** :
1. Vous n'êtes pas connecté → `supabase login`
2. Projet non lié → `supabase link --project-ref tgqrnrqpeaijtrlnbgfj`
3. Erreur de syntaxe dans le code → Vérifiez `supabase/functions/send-invoice-email/index.ts`

**Solution** :
```bash
# Forcer la reconnexion
supabase logout
supabase login

# Re-lier le projet
supabase link --project-ref tgqrnrqpeaijtrlnbgfj --force

# Re-déployer
supabase functions deploy send-invoice-email
```

### Problème : "RESEND_API_KEY not configured"

**Solution** :
```bash
# Re-configurer le secret
supabase secrets set RESEND_API_KEY=re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW --project-ref tgqrnrqpeaijtrlnbgfj

# Vérifier
supabase secrets list --project-ref tgqrnrqpeaijtrlnbgfj
```

### Problème : "Resend API error: 401 Unauthorized"

**Cause** : La clé API Resend n'est pas valide ou a expiré

**Solution** :
1. Allez sur [https://resend.com/api-keys](https://resend.com/api-keys)
2. Vérifiez que la clé `re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW` existe
3. Si expirée, générez une nouvelle clé
4. Mettez à jour le secret Supabase :
```bash
supabase secrets set RESEND_API_KEY=NOUVELLE_CLE --project-ref tgqrnrqpeaijtrlnbgfj
```

### Problème : "Email not delivered" / Email n'arrive pas

**Solutions** :

1. **Vérifiez les spams** 📧
   - L'email peut être dans les courriers indésirables

2. **Vérifiez le domaine d'envoi** 🌐
   - Par défaut : `onboarding@resend.dev` (fonctionne pour les tests)
   - Pour production : vérifiez votre domaine `booh.ga` dans Resend
   - Modifiez la ligne 228 de `supabase/functions/send-invoice-email/index.ts`

3. **Vérifiez les quotas Resend** 📊
   - Gratuit : 100 emails/jour
   - Allez sur [https://resend.com/overview](https://resend.com/overview)
   - Vérifiez votre usage

4. **Vérifiez les logs** 📋
   ```bash
   supabase functions logs send-invoice-email --project-ref tgqrnrqpeaijtrlnbgfj
   ```

### Problème : "Cannot connect to Docker daemon"

**Cause** : Vous essayez de tester localement mais Docker n'est pas démarré

**Solution** : Utilisez le déploiement en production (pas besoin de Docker !)

---

## 🎯 FLOW COMPLET DE L'ENVOI D'EMAIL

```
1. Utilisateur clique "Envoyer" sur une facture
   ↓
2. Frontend (Facture.tsx:227) appelle EmailService.sendInvoiceEmail()
   ↓
3. EmailService.ts:35 invoque supabase.functions.invoke('send-invoice-email')
   ↓
4. Requête POST vers https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email
   ↓
5. Edge Function (index.ts:181) reçoit la requête
   ↓
6. Validation des données (ligne 198)
   ↓
7. Récupération RESEND_API_KEY (ligne 209)
   ↓
8. Génération du template HTML (ligne 223)
   ↓
9. Appel API Resend (ligne 246)
   ↓
10. Resend envoie l'email au client
   ↓
11. Réponse retournée au frontend
   ↓
12. Statut de la facture mis à jour : draft → sent
   ↓
13. Toast de confirmation affiché
```

---

## 📧 STRUCTURE DE L'EMAIL ENVOYÉ

L'email contient :
- **En-tête** : Logo + Titre "Nouvelle Facture"
- **Badge** : Numéro de facture (ex: FAC-2025-001)
- **Message** : Bonjour {client_name}
- **Détails** :
  - Date d'émission
  - Date d'échéance
- **Montant** : Total TTC en gros et en valeur
- **Bouton** : Télécharger le PDF (si fourni)
- **Note** : Rappel de paiement avant échéance
- **Footer** : Signature + mention Booh

**Design** : Moderne, gradient bleu/violet, responsive

---

## 🚦 CHECKLIST DE VÉRIFICATION

Après déploiement, vérifiez :

- [ ] Fonction déployée sur Supabase Dashboard
- [ ] Secret RESEND_API_KEY configuré
- [ ] Test curl fonctionne (retourne success: true)
- [ ] Email reçu dans la boîte mail
- [ ] Email bien formaté (design moderne)
- [ ] Envoi depuis l'app fonctionne
- [ ] Statut de la facture passe à "sent"
- [ ] Toast de confirmation s'affiche
- [ ] Logs Supabase propres (pas d'erreur)

---

## 🎉 FÉLICITATIONS !

Une fois tout configuré, votre système d'envoi d'email est **production-ready** !

### Prochaines améliorations possibles :

1. **Vérifier le domaine booh.ga** dans Resend
   - Pour envoyer depuis `noreply@booh.ga` au lieu de `onboarding@resend.dev`

2. **Ajouter pièces jointes PDF**
   - Actuellement : lien de téléchargement
   - Amélioration : PDF en pièce jointe

3. **Templates personnalisables**
   - Permettre à l'utilisateur de personnaliser le template
   - Ajouter des variables dynamiques

4. **Notifications de statut**
   - Email de rappel automatique avant échéance
   - Email de confirmation après paiement

5. **Tracking des emails**
   - Savoir si le client a ouvert l'email
   - Savoir si le client a téléchargé le PDF

---

## 📚 DOCUMENTATION

- [Guide de déploiement détaillé](GUIDE_DEPLOIEMENT_EMAIL.md)
- [README Edge Function](supabase/functions/send-invoice-email/README.md)
- [Documentation Resend](https://resend.com/docs)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🆘 BESOIN D'AIDE ?

Si vous rencontrez encore des problèmes :

1. **Vérifiez les logs Supabase** (le plus important !)
2. **Testez avec curl** pour isoler le problème
3. **Vérifiez les quotas Resend**
4. **Vérifiez que la clé API est valide**
5. **Consultez la documentation ci-dessus**

**Bonne chance ! 🚀**
