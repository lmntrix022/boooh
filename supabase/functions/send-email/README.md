# Send Email - Supabase Edge Function

Cette fonction Supabase Edge permet d'envoyer des emails génériques depuis le CRM via Resend.

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
supabase functions deploy send-email

# Ou déployer toutes les fonctions
supabase functions deploy
```

## Utilisation depuis le CRM

### Interface TypeScript

```typescript
interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'crm' | 'follow-up' | 'upsell' | 'reactivation';
  contact_name?: string;
  user_name?: string;
  user_email?: string;
}
```

### Exemple d'utilisation dans CommunicationCenter

```typescript
const sendEmail = async (to: string, subject: string, message: string) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject,
      message,
      type: 'crm',
      contact_name: contact?.full_name,
      user_name: user?.user_metadata?.full_name,
      user_email: user?.email
    },
  });

  if (error) {
    throw error;
  }

  return data;
};
```

## Templates d'emails

La fonction génère automatiquement des templates HTML professionnels selon le type :

- **CRM** : Email standard depuis le CRM
- **Follow-up** : Email de relance avec CTA
- **Upsell** : Email commercial avec bouton d'action
- **Reactivation** : Email de réactivation client

## Fonctionnalités

### ✅ Templates HTML Responsifs
- Design moderne et professionnel
- Compatible mobile
- Couleurs et branding bööh

### ✅ Types d'emails supportés
- **CRM** : Communication générale
- **Follow-up** : Relances avec CTA
- **Upsell** : Offres commerciales
- **Reactivation** : Réengagement client

### ✅ Sécurité
- Authentification Supabase requise
- Validation des données d'entrée
- Clés API stockées en tant que secrets
- CORS configuré

## Développement local

Pour tester localement :

```bash
# Démarrer Supabase localement
supabase start

# Servir les fonctions localement
supabase functions serve send-email --env-file .env.local

# Tester avec curl
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "Ceci est un test depuis le CRM",
    "type": "crm",
    "contact_name": "John Doe"
  }'
```

## Limites et tarification

### Resend (Gratuit)
- ✅ 100 emails/jour gratuits
- ✅ 3,000 emails/mois gratuits
- ✅ Plans payants à partir de $20/mois pour 50k emails

## Logs et monitoring

Les logs sont disponibles dans le dashboard Supabase :
1. Allez dans "Edge Functions"
2. Sélectionnez "send-email"
3. Consultez les logs en temps réel

## Troubleshooting

### Erreur CORS
**Solution :** La fonction est maintenant déployée avec les bons headers CORS.

### Erreur 500: "RESEND_API_KEY not found"
**Solution :** Configurez la clé API Resend :
```bash
supabase secrets set RESEND_API_KEY=your_api_key_here
```

### Erreur 400: "Missing required fields"
**Vérifiez que vous envoyez :**
- `to` (email du destinataire)
- `subject` (sujet de l'email)
- `message` (contenu du message)

## Intégration CRM

Cette fonction est utilisée par :
- **CommunicationCenter** : Envoi d'emails depuis le CRM
- **Actions Recommandées** : Emails de relance automatiques
- **Actions Rapides** : Communication directe avec les contacts
