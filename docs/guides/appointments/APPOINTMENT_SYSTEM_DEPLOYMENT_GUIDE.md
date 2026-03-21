# Guide de Déploiement du Système de Rendez-vous Amélioré

Ce guide explique comment déployer et configurer toutes les améliorations apportées au système de rendez-vous.

## 📋 Vue d'ensemble des améliorations

✅ **Notifications email** - Emails automatiques avec Resend
✅ **Pagination** - Gestion efficace de grands volumes de RDV
✅ **Horaires personnalisables** - Chaque carte a ses propres horaires
✅ **Gestion des fuseaux horaires** - Support international
✅ **Rappels automatiques** - Emails 24h et 1h avant le RDV
✅ **Logs d'emails** - Traçabilité complète des notifications

---

## 🔧 Étape 1: Appliquer la migration SQL

### 1.1 Via Supabase CLI

```bash
cd /Users/quantinekouaghe/Downloads/boooh-main

# Appliquer la migration
supabase migration up 20251019_appointment_notifications
```

### 1.2 Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu de `supabase/migrations/20251019_appointment_notifications.sql`
5. Exécutez le script

### 1.3 Vérification

```sql
-- Vérifiez que les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'card_availability_settings',
  'appointment_email_logs',
  'appointment_reminders'
);

-- Devrait retourner 3 lignes
```

---

## 📧 Étape 2: Configurer Resend pour les emails

### 2.1 Créer un compte Resend

1. Allez sur https://resend.com/signup
2. Créez un compte
3. Vérifiez votre email

### 2.2 Obtenir une clé API

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nommez-la `booh-appointments`
4. Copiez la clé (elle commence par `re_`)

### 2.3 Ajouter un domaine (Recommandé)

**Option A: Domaine personnalisé (recommandé pour production)**

1. Dans Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `booh.app`)
4. Suivez les instructions pour configurer les enregistrements DNS:
   ```
   Type: TXT
   Host: @
   Value: [fourni par Resend]

   Type: CNAME
   Host: resend._domainkey
   Value: [fourni par Resend]
   ```
5. Attendez la vérification (peut prendre jusqu'à 48h)

**Option B: Mode test (développement)**

Pour tester sans domaine:
- Les emails seront envoyés depuis `onboarding@resend.dev`
- Limitée à 100 emails/jour
- Ne peut envoyer qu'à l'email du compte Resend

### 2.4 Configurer les variables d'environnement

#### Dans Supabase

1. Allez dans **Project Settings** > **Edge Functions** > **Secrets**
2. Ajoutez les variables suivantes:

```bash
RESEND_API_KEY=re_votre_cle_api_resend
PUBLIC_URL=https://votre-domaine.com
```

#### En local (.env)

```bash
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key

# Resend (pour les edge functions)
RESEND_API_KEY=re_votre_cle_api_resend
PUBLIC_URL=http://localhost:8080
```

---

## 🚀 Étape 3: Déployer les Edge Functions

### 3.1 Installer Supabase CLI (si pas déjà fait)

```bash
# macOS
brew install supabase/tap/supabase

# Vérifier l'installation
supabase --version
```

### 3.2 Se connecter à Supabase

```bash
supabase login
supabase link --project-ref votre-project-ref
```

### 3.3 Déployer les fonctions

```bash
# Déployer la fonction d'envoi d'emails
supabase functions deploy send-appointment-email

# Déployer la fonction de rappels
supabase functions deploy send-appointment-reminders
```

### 3.4 Vérifier le déploiement

```bash
# Lister les fonctions déployées
supabase functions list

# Tester la fonction d'email
supabase functions invoke send-appointment-email --data '{
  "type": "owner_new_booking",
  "appointmentId": "test-id"
}'
```

---

## ⏰ Étape 4: Configurer le Cron Job pour les rappels

### 4.1 Via Supabase Dashboard

1. Allez dans **Database** > **Cron Jobs** (dans Extensions)
2. Activez l'extension `pg_cron` si pas déjà fait
3. Créez un nouveau cron job:

```sql
-- Exécuter toutes les 15 minutes
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://votre-projet.supabase.co/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### 4.2 Vérifier le cron job

```sql
-- Lister les cron jobs actifs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-appointment-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎨 Étape 5: Mettre à jour le frontend

### 5.1 Installer les dépendances

```bash
npm install
```

### 5.2 Build l'application

```bash
npm run build
```

### 5.3 Tester en local

```bash
npm run dev
```

Ouvrez http://localhost:8080 et testez:

1. Créer un nouveau rendez-vous
2. Vérifier que les emails sont envoyés
3. Tester la pagination dans la vue liste
4. Configurer les horaires de disponibilité

---

## 🧪 Étape 6: Tests

### 6.1 Test du système de notification

```bash
# 1. Créer un rendez-vous de test
curl -X POST https://votre-projet.supabase.co/rest/v1/appointments \
  -H "apikey: votre_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "test-card-id",
    "client_name": "Test User",
    "client_email": "test@example.com",
    "date": "2025-10-20T14:00:00Z",
    "status": "pending"
  }'

# 2. Vérifier les logs d'emails
SELECT * FROM appointment_email_logs ORDER BY created_at DESC LIMIT 5;
```

### 6.2 Test de la pagination

1. Créez au moins 15 rendez-vous
2. Ouvrez la vue liste
3. Vérifiez que seuls 12 RDV sont affichés
4. Naviguez entre les pages

### 6.3 Test des horaires personnalisés

1. Allez sur `/cards/{id}/appointment-settings`
2. Configurez des horaires personnalisés (ex: Lun-Ven 10h-18h)
3. Testez la réservation publique
4. Vérifiez que seuls les créneaux configurés sont disponibles

### 6.4 Test des fuseaux horaires

1. Changez le fuseau horaire dans les paramètres
2. Créez un rendez-vous
3. Vérifiez que l'heure est correcte dans l'email

---

## 📊 Étape 7: Monitoring

### 7.1 Logs des emails

```sql
-- Emails envoyés aujourd'hui
SELECT
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM appointment_email_logs
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY email_type;
```

### 7.2 Rappels en attente

```sql
-- Rappels programmés pour les prochaines 24h
SELECT
  ar.*,
  a.client_name,
  a.client_email,
  a.date
FROM appointment_reminders ar
JOIN appointments a ON ar.appointment_id = a.id
WHERE ar.status = 'pending'
AND ar.scheduled_for <= NOW() + INTERVAL '24 hours'
ORDER BY ar.scheduled_for;
```

### 7.3 Performance

```sql
-- Rendez-vous par statut
SELECT status, COUNT(*)
FROM appointments
GROUP BY status;

-- Taux de confirmation
SELECT
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 100.0 / COUNT(*) as confirmation_rate
FROM appointments
WHERE status IN ('confirmed', 'cancelled', 'pending');
```

---

## 🔐 Étape 8: Sécurité

### 8.1 Vérifier les RLS policies

```sql
-- Tester qu'un utilisateur ne peut voir que ses propres paramètres
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-id-here';

SELECT * FROM card_availability_settings;
-- Ne devrait retourner que les paramètres de l'utilisateur

RESET ROLE;
```

### 8.2 Rate limiting (recommandé)

Ajoutez un rate limiting dans Supabase:

1. Allez dans **Authentication** > **Rate Limits**
2. Configurez:
   - Max requests: 100 per hour
   - Max email sends: 50 per hour

---

## 🎯 Étape 9: Optimisations recommandées

### 9.1 Index pour performance

```sql
-- Index pour recherche rapide d'emails
CREATE INDEX IF NOT EXISTS idx_appointments_client_email
ON appointments(client_email);

-- Index pour les rappels à venir
CREATE INDEX IF NOT EXISTS idx_reminders_pending
ON appointment_reminders(status, scheduled_for)
WHERE status = 'pending';
```

### 9.2 Nettoyage automatique des anciens logs

```sql
-- Supprimer les logs d'emails de plus de 90 jours
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM appointment_email_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Planifier le nettoyage mensuel
SELECT cron.schedule(
  'cleanup-email-logs',
  '0 0 1 * *', -- Le 1er de chaque mois à minuit
  $$SELECT cleanup_old_email_logs();$$
);
```

---

## 📝 Étape 10: Personnalisation des templates d'emails

### 10.1 Modifier les templates

Éditez `supabase/functions/send-appointment-email/index.ts`:

```typescript
// Ligne ~25-80 : Template owner_new_booking
// Ligne ~82-140 : Template client_booking_confirmation
// etc.
```

### 10.2 Variables disponibles

Chaque template a accès à:
- `client_name` - Nom du client
- `client_email` - Email du client
- `client_phone` - Téléphone (optionnel)
- `card_name` - Nom de la carte
- `owner_email` - Email du propriétaire
- `date_formatted` - Date formatée en français
- `duration` - Durée en minutes
- `notes` - Notes du RDV
- Divers URLs (manage_url, calendar_url, etc.)

### 10.3 Redéployer après modification

```bash
supabase functions deploy send-appointment-email
```

---

## 🆘 Dépannage

### Problème: Les emails ne sont pas envoyés

**Solution:**

1. Vérifiez la clé API Resend:
   ```bash
   supabase secrets list
   ```

2. Vérifiez les logs de la fonction:
   ```bash
   supabase functions logs send-appointment-email
   ```

3. Testez manuellement:
   ```bash
   curl -X POST https://votre-projet.supabase.co/functions/v1/send-appointment-email \
     -H "Authorization: Bearer votre_service_role_key" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "owner_new_booking",
       "appointmentId": "id-existant"
     }'
   ```

### Problème: Rappels non envoyés

**Solution:**

1. Vérifiez le cron job:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';
   ```

2. Vérifiez qu'il y a des rappels en attente:
   ```sql
   SELECT COUNT(*) FROM appointment_reminders
   WHERE status = 'pending' AND scheduled_for <= NOW();
   ```

3. Exécutez manuellement:
   ```bash
   supabase functions invoke send-appointment-reminders
   ```

### Problème: Créneaux horaires incorrects

**Solution:**

1. Vérifiez le fuseau horaire:
   ```sql
   SELECT timezone FROM card_availability_settings WHERE card_id = 'votre-card-id';
   ```

2. Vérifiez les horaires de travail:
   ```sql
   SELECT working_hours FROM card_availability_settings WHERE card_id = 'votre-card-id';
   ```

3. Testez la fonction getAvailableSlots en console:
   ```javascript
   import { getAvailableSlots } from '@/services/availabilityService';
   const slots = await getAvailableSlots('card-id', new Date());
   console.log(slots);
   ```

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Guide complet du système](/EXPERT_CODE_ANALYSIS.md)

---

## ✅ Checklist de déploiement

- [ ] Migration SQL appliquée
- [ ] Compte Resend créé et clé API obtenue
- [ ] Variables d'environnement configurées
- [ ] Edge functions déployées
- [ ] Cron job configuré
- [ ] Frontend builddéployé
- [ ] Tests effectués (email, pagination, horaires)
- [ ] Monitoring configuré
- [ ] RLS policies vérifiées
- [ ] Index de performance créés
- [ ] Documentation lue et comprise

---

## 🎉 Prochaines étapes

Une fois le déploiement terminé:

1. **Ajouter la route dans App.tsx**:
   ```typescript
   <Route
     path="/cards/:id/appointment-settings"
     element={
       <ProtectedRoute>
         <FeatureProtectedRoute feature="hasAppointments">
           <AppointmentSettings />
         </FeatureProtectedRoute>
       </ProtectedRoute>
     }
   />
   ```

2. **Ajouter un lien dans le dashboard**:
   - Depuis AppointmentManager ou Appointments page
   - Bouton "Paramètres de disponibilité"

3. **Tester en production** avec de vrais emails

4. **Collecter les retours utilisateurs**

5. **Ajuster les templates d'emails** selon les besoins

---

**Besoin d'aide?** Consultez les logs et la section dépannage ci-dessus.
