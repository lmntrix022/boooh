# Send Invoice Email - Supabase Edge Function

Cette fonction Supabase Edge permet d'envoyer des factures par email via Resend.

## Configuration requise

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour gratuits)
3. Vérifiez votre domaine ou utilisez un domaine de test
4. Générez une clé API dans la section "API Keys"

### 2. Configurer les variables d'environnement

```bash
# Dans votre projet Supabase
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### 3. Déployer la fonction

```bash
# Déployer la fonction sur Supabase
supabase functions deploy send-invoice-email

# Ou déployer toutes les fonctions
supabase functions deploy
```

## Utilisation depuis le frontend

### Méthode recommandée : Via le service

Créez un service pour appeler la fonction :

```typescript
// src/services/emailService.ts
import { supabase } from '@/integrations/supabase/client';

export interface SendInvoiceEmailParams {
  invoice_number: string;
  client_name: string;
  client_email: string;
  total_ttc: number;
  issue_date: string;
  due_date: string;
  pdf_url?: string;
  user_email?: string;
  user_name?: string;
}

export class EmailService {
  static async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<void> {
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending invoice email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }
}
```

### Exemple d'utilisation dans un composant

```typescript
import { EmailService } from '@/services/emailService';

// Dans votre fonction d'envoi
const handleSendInvoice = async (invoice: Invoice) => {
  try {
    await EmailService.sendInvoiceEmail({
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      client_email: invoice.client_email!,
      total_ttc: invoice.total_ttc,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      pdf_url: invoice.pdf_url,
      user_email: user?.email,
      user_name: user?.user_metadata?.full_name,
    });

    toast.success('Facture envoyée par email avec succès');
  } catch (error) {
    toast.error('Erreur lors de l\'envoi de l\'email');
  }
};
```

## Template d'email

L'email envoyé inclut :
- ✅ Design moderne et responsive
- ✅ Informations de la facture (numéro, dates, montant)
- ✅ Lien de téléchargement du PDF (si fourni)
- ✅ Message personnalisable
- ✅ Branding Booh

## Alternatives à Resend

Si vous préférez un autre service d'envoi d'emails :

### SendGrid

```typescript
// Remplacer l'appel Resend par SendGrid
const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: data.client_email }],
    }],
    from: { email: data.user_email || 'noreply@boohcard.com' },
    subject: `Facture ${data.invoice_number}`,
    content: [{
      type: 'text/html',
      value: emailHtml,
    }],
  }),
});
```

### Mailgun

```typescript
// Remplacer l'appel Resend par Mailgun
const formData = new FormData();
formData.append('from', data.user_email || 'noreply@boohcard.com');
formData.append('to', data.client_email);
formData.append('subject', `Facture ${data.invoice_number}`);
formData.append('html', emailHtml);

const mgResponse = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
  },
  body: formData,
});
```

## Développement local

Pour tester localement :

```bash
# Démarrer Supabase localement
supabase start

# Servir les fonctions localement
supabase functions serve send-invoice-email --env-file .env.local

# Tester avec curl
curl -X POST http://localhost:54321/functions/v1/send-invoice-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "invoice_number": "FAC-2025-001",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "total_ttc": 50000,
    "issue_date": "2025-01-15",
    "due_date": "2025-02-15"
  }'
```

## Limites et tarification

### Resend (Gratuit)
- ✅ 100 emails/jour gratuits
- ✅ 3,000 emails/mois gratuits
- ✅ Plans payants à partir de $20/mois pour 50k emails

### SendGrid (Gratuit)
- ✅ 100 emails/jour gratuits
- ✅ Plans payants à partir de $15/mois pour 40k emails

### Mailgun (Gratuit)
- ✅ 5,000 emails/mois gratuits les 3 premiers mois
- ✅ Plans payants à partir de $35/mois pour 50k emails

## Sécurité

- ✅ Authentification Supabase requise
- ✅ Validation des données d'entrée
- ✅ Clés API stockées en tant que secrets Supabase
- ✅ CORS configuré pour votre domaine
- ✅ Rate limiting via Supabase (à configurer)

## Logs et monitoring

Les logs sont disponibles dans le dashboard Supabase :
1. Allez dans "Edge Functions"
2. Sélectionnez "send-invoice-email"
3. Consultez les logs en temps réel

## Troubleshooting

### Erreur 500: "Edge Function returned a non-2xx status code"

**Causes possibles:**

1. **RESEND_API_KEY manquante** (cause la plus fréquente)
   - Vérifiez que le secret est configuré dans Supabase Vault
   - Dashboard: https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/settings/vault
   - CLI: `supabase secrets set RESEND_API_KEY=votre_cle`

2. **Fonction non déployée**
   - Déployez la fonction: `./deploy-email-function.sh`
   - Ou manuellement: `supabase functions deploy send-invoice-email`

3. **Clé API Resend invalide**
   - Vérifiez que votre clé API est valide dans Resend dashboard
   - Générez une nouvelle clé si nécessaire

4. **Problème avec l'API Resend**
   - Vérifiez les logs: https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions/send-invoice-email/logs
   - Les logs montreront l'erreur exacte de Resend

**Comment déboguer:**

```bash
# 1. Vérifier les logs en temps réel
supabase functions logs send-invoice-email --project-ref tgqrnrqpeaijtrlnbgfj

# 2. Tester la fonction directement
curl -X POST https://tgqrnrqpeaijtrlnbgfj.supabase.co/functions/v1/send-invoice-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "invoice_number": "TEST-001",
    "client_name": "Test Client",
    "client_email": "test@example.com",
    "total_ttc": 10000,
    "issue_date": "2025-10-13",
    "due_date": "2025-11-13"
  }'
```

**Étapes de résolution rapide:**

1. **Configurez le secret RESEND_API_KEY:**
   ```bash
   export RESEND_API_KEY='votre_cle_resend'
   ./deploy-email-function.sh
   ```

2. **Ou configurez via le dashboard:**
   - Allez sur: https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/settings/vault
   - Cliquez "Add new secret"
   - Nom: `RESEND_API_KEY`
   - Valeur: Votre clé API Resend
   - Sauvegardez

3. **Vérifiez les logs:**
   - https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions/send-invoice-email/logs
   - Cherchez les messages d'erreur spécifiques

### L'email n'arrive pas
- Vérifiez que la clé API Resend est correctement configurée
- Vérifiez les logs de la fonction dans Supabase
- Vérifiez le dossier spam du destinataire
- Vérifiez que le domaine d'envoi est vérifié dans Resend
- Pour les tests, utilisez `onboarding@resend.dev` comme expéditeur

### Erreur 400: "Missing required fields"
- Vérifiez que `client_email` et `invoice_number` sont fournis
- Vérifiez que les champs ne sont pas vides ou `undefined`

### Email mal formaté
- Vérifiez que toutes les données requises sont fournies
- Vérifiez le template HTML dans `getEmailTemplate()`
- Les montants sont en FCFA (format français)
