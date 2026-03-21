# Supabase Edge Functions

## 📦 Functions Disponibles

### 1. `upgrade-plan`
**Endpoint:** `POST /functions/v1/upgrade-plan`

**Description:** Change ou crée l'abonnement d'un utilisateur.

**Requête:**
```json
{
  "plan_type": "business" | "magic" | "free"
}
```

**Réponse:**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_type": "business",
    "status": "active",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "auto_renew": true
  },
  "message": "Mise à jour vers business réussie"
}
```

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('upgrade-plan', {
  body: { plan_type: 'business' }
});
```

---

### 2. `update-addons`
**Endpoint:** `POST /functions/v1/update-addons`

**Description:** Met à jour les addons actifs d'un utilisateur.

**Requête:**
```json
{
  "addons": ["pack_volume", "pack_brand"]
}
```

**Réponse:**
```json
{
  "success": true,
  "addons": [
    {
      "id": "uuid",
      "addon_type": "pack_volume",
      "quantity": 1,
      "purchased_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_cost": 13000,
  "message": "2 addon(s) ajouté(s) avec succès"
}
```

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('update-addons', {
  body: { addons: ['pack_volume', 'pack_brand'] }
});
```

---

## 🚀 Déploiement

### Local Development
```bash
# Installer le CLI Supabase
npm install -g supabase

# Démarrer Supabase localement
supabase start

# Déployer les functions
supabase functions deploy upgrade-plan
supabase functions deploy update-addons
```

### Production
```bash
# Déployer sur Supabase Cloud
supabase functions deploy upgrade-plan --project-ref YOUR_PROJECT_REF
supabase functions deploy update-addons --project-ref YOUR_PROJECT_REF
```

---

## 📋 Notes

- ✅ **Pas de paiement**: Les functions mettent à jour directement la DB
- ✅ **Pas de webhook**: Pas besoin de webhook pour confirmer
- ⚠️ **CORS activé**: Les functions acceptent les requêtes depuis le frontend
- 🔐 **Auth requis**: L'utilisateur doit être authentifié

---

## 🧪 Tests

### Tester upgrade-plan
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/upgrade-plan \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan_type": "magic"}'
```

### Tester update-addons
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-addons \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"addons": ["pack_volume", "pack_brand"]}'
```

