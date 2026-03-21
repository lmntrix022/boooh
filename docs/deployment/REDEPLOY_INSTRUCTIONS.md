# 🚀 Redéployer la Fonction Email (FIX 500)

## Changement Effectué ✅

J'ai modifié le fichier `/supabase/functions/send-invoice-email/index.ts` pour utiliser le domaine de test de Resend au lieu d'un domaine non vérifié.

**Changement :**
```typescript
// AVANT (causait l'erreur 500)
from: data.user_email || 'Booh <noreply@boohcard.com>',

// APRÈS (utilise le domaine de test Resend)
from: 'Booh <onboarding@resend.dev>',
```

## Prochaines Étapes

### Étape 1 : Vérifier le secret Resend

Dans votre terminal :

```bash
# Vérifier que le secret est configuré
supabase secrets list

# Si pas configuré, le configurer maintenant
supabase secrets set RESEND_API_KEY=re_votre_cle_ici
```

⚠️ **IMPORTANT** : Remplacez `re_votre_cle_ici` par votre vraie clé API de Resend (celle que vous avez mise dans .env)

### Étape 2 : Redéployer la fonction

```bash
# Redéployer avec le changement
supabase functions deploy send-invoice-email
```

Vous devriez voir :
```
Deploying Function send-invoice-email (version 3)
✔ Deployed Function send-invoice-email
```

### Étape 3 : Tester immédiatement

1. Retournez dans votre application
2. Créez une facture de test
3. Mettez **votre propre email** comme email client
4. Cliquez sur "Envoyer"
5. Vérifiez votre boîte email ! 📧

## Vérification Rapide

Si vous voulez tester directement avec curl :

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
    "user_name": "Test User"
  }'
```

**Remplacez :**
- `VOTRE_ANON_KEY` par la valeur de `VITE_SUPABASE_ANON_KEY` dans votre .env
- `votre@email.com` par votre vrai email

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email_id": "abc123..."
}
```

## Voir les Logs (si besoin)

```bash
# Logs en temps réel
supabase functions logs send-invoice-email --tail

# Ou derniers logs
supabase functions logs send-invoice-email --limit 20
```

## Troubleshooting

### Si vous avez toujours une erreur 500

**1. Vérifier que le secret est bien configuré :**
```bash
supabase secrets list
```

Vous devriez voir `RESEND_API_KEY` dans la liste.

**2. Vérifier votre clé Resend :**
- Allez sur https://resend.com/api-keys
- Vérifiez que la clé existe et est valide
- La clé commence par `re_`

**3. Regarder les logs détaillés :**
```bash
supabase functions logs send-invoice-email --limit 30
```

**4. Tester avec votre propre email :**
En compte gratuit Resend, vous ne pouvez envoyer qu'à des emails autorisés. Testez d'abord avec l'email de votre compte Resend !

---

## Résumé des Commandes

```bash
# 1. Configurer le secret (si pas déjà fait)
supabase secrets set RESEND_API_KEY=re_votre_cle

# 2. Redéployer
supabase functions deploy send-invoice-email

# 3. Tester depuis l'app
# (Créer facture + Envoyer)

# 4. Vérifier les logs si problème
supabase functions logs send-invoice-email
```

---

**C'est tout !** Après le redéploiement, l'envoi d'email devrait fonctionner ! 🎉
