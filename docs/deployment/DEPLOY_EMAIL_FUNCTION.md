# Déployer la Fonction d'Envoi d'Email

## Problème Actuel
Erreur 403 lors de l'envoi d'emails de facture.

## Solution Rapide

### Étape 1 : Configurer Resend
1. Créer compte sur [resend.com](https://resend.com)
2. Obtenir la clé API (commence par `re_`)

### Étape 2 : Configurer Supabase
```bash
supabase secrets set RESEND_API_KEY=re_votre_cle
```

### Étape 3 : Déployer
```bash
cd supabase/functions
supabase functions deploy send-invoice-email
```

## Test
```bash
curl -X POST 'https://VOTRE_REF.supabase.co/functions/v1/send-invoice-email' \
  -H 'Authorization: Bearer VOTRE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"invoice_number":"TEST","client_email":"test@email.com","client_name":"Test","total_ttc":1000,"issue_date":"2025-01-16","due_date":"2025-02-15"}'
```

Voir [FIX_EMAIL_403_ERROR.md](FIX_EMAIL_403_ERROR.md) pour plus de détails.
