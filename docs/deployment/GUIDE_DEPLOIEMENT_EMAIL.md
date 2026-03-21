# 🚀 Guide de déploiement de l'envoi d'email

## Problème actuel
L'envoi d'email ne fonctionne pas car la fonction Edge Supabase n'est pas déployée sur votre projet Supabase.

---

## ✅ Solution rapide : Déployer sur Supabase (Production)

### Étape 1 : Installer Supabase CLI (si pas déjà fait)

```bash
# macOS
brew install supabase/tap/supabase

# Vérifier l'installation
supabase --version
```

### Étape 2 : Se connecter à Supabase

```bash
# Se connecter avec votre compte Supabase
supabase login

# Lier votre projet local au projet Supabase
cd /Users/valerie/Downloads/boooh-main
supabase link --project-ref tgqrnrqpeaijtrlnbgfj
```

**Note** : Votre projet ID est `tgqrnrqpeaijtrlnbgfj` (extrait de l'URL Supabase)

### Étape 3 : Configurer la clé API Resend sur Supabase

```bash
# Définir le secret dans Supabase (production)
supabase secrets set RESEND_API_KEY=re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW --project-ref tgqrnrqpeaijtrlnbgfj
```

### Étape 4 : Déployer la fonction

```bash
# Déployer la fonction send-invoice-email
supabase functions deploy send-invoice-email --project-ref tgqrnrqpeaijtrlnbgfj

# Ou déployer toutes les fonctions
supabase functions deploy --project-ref tgqrnrqpeaijtrlnbgfj
```

### Étape 5 : Tester l'envoi

Retournez sur votre application et testez l'envoi d'une facture !

---

## 🧪 Option alternative : Test rapide avec curl

Si vous voulez tester la fonction avant de l'utiliser dans l'app :

```bash
curl -X POST https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncXJucnFwZWFpanRybG5iZ2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODg2OTksImV4cCI6MjA3NTA2NDY5OX0.cpu0Pi7yi_lfofCjzRjidPyR7QtuV6Ihh3gYK87oNsw" \
  -d '{
    "invoice_number": "TEST-001",
    "client_name": "Client Test",
    "client_email": "votre-email@example.com",
    "total_ttc": 50000,
    "issue_date": "2025-10-13",
    "due_date": "2025-11-13",
    "user_name": "Booh"
  }'
```

**Remplacez** `votre-email@example.com` par votre vraie adresse email pour recevoir le test.

---

## 🔧 Dépannage

### Problème : "supabase: command not found"

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase
```

### Problème : "Failed to link project"

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrez votre projet
3. Allez dans "Settings" → "API"
4. Vérifiez que le Project ID correspond à `tgqrnrqpeaijtrlnbgfj`

### Problème : "RESEND_API_KEY not configured"

```bash
# Re-définir le secret
supabase secrets set RESEND_API_KEY=re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW --project-ref tgqrnrqpeaijtrlnbgfj

# Vérifier les secrets
supabase secrets list --project-ref tgqrnrqpeaijtrlnbgfj
```

### Problème : "Email not sent" ou "Resend API error"

1. **Vérifiez que la clé Resend est valide** :
   - Allez sur [https://resend.com/api-keys](https://resend.com/api-keys)
   - Vérifiez que la clé `re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW` existe et est active

2. **Vérifiez le domaine d'envoi** :
   - Par défaut, la fonction utilise `onboarding@resend.dev` (fonctionne pour les tests)
   - Pour la production, vérifiez votre domaine `booh.ga` dans Resend
   - Si vérifié, modifiez la ligne 228 de [index.ts](supabase/functions/send-invoice-email/index.ts:228)

3. **Vérifiez les logs Supabase** :
   - Allez sur [https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions](https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions)
   - Cliquez sur `send-invoice-email`
   - Consultez les logs pour voir les erreurs

### Problème : "Resend free tier limit exceeded"

Resend offre **100 emails/jour gratuits**. Si dépassé :
1. Attendez 24h
2. Ou passez au plan payant Resend ($20/mois pour 50k emails)

---

## 📧 Vérifier la configuration Resend

### Accéder au dashboard Resend

1. Allez sur [https://resend.com/api-keys](https://resend.com/api-keys)
2. Connectez-vous avec votre compte
3. Vérifiez que la clé `re_CnZmPT41_56yy18Xu1SbdTVLBnv5rAcnW` est présente

### Vérifier le domaine

1. Allez sur [https://resend.com/domains](https://resend.com/domains)
2. Si `booh.ga` n'est pas vérifié, utilisez `onboarding@resend.dev` (par défaut dans le code)
3. Pour vérifier `booh.ga` :
   - Ajoutez les enregistrements DNS fournis par Resend
   - Attendez la vérification (peut prendre quelques heures)
   - Modifiez la ligne 228 de l'Edge Function

---

## ✅ Vérification finale

Après déploiement, testez l'envoi :

1. Allez sur votre application → `/facture`
2. Créez une facture de test avec votre email
3. Cliquez sur "Envoyer"
4. Vérifiez votre boîte mail (et spam)

Si tout fonctionne, vous devriez recevoir un email avec :
- ✅ Le numéro de facture
- ✅ Les dates d'émission et d'échéance
- ✅ Le montant total
- ✅ Un design moderne bleu/violet

---

## 🎉 Félicitations !

Votre système d'envoi d'email est maintenant fonctionnel !

**Prochaines étapes recommandées** :
1. Vérifier votre domaine `booh.ga` dans Resend
2. Modifier l'email d'envoi de `onboarding@resend.dev` à `noreply@booh.ga`
3. Configurer des templates d'email personnalisés
4. Ajouter des pièces jointes PDF (actuellement juste un lien)

---

## 📞 Support

Si vous rencontrez encore des problèmes :
1. Vérifiez les logs Supabase
2. Vérifiez les logs Resend
3. Testez avec curl (voir section ci-dessus)
4. Vérifiez que Docker n'est pas requis (déploiement production)

**Bon courage ! 🚀**
