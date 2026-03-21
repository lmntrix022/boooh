# 🚨 GUIDE URGENT - Fix Erreur 400 Admin

## Problème
Erreur `PATCH 400 (Bad Request)` lors de l'activation des abonnements dans `/admin/users/[id]`

## Cause
Les nouvelles valeurs d'enum (`essentiel`, `connexions`, `commerce`, `opere`) ne sont pas dans la base de données.

## Solution en 3 étapes

### ÉTAPE 1 : Vérifier l'état actuel
```sql
-- Copiez-collez ça dans Supabase SQL Editor :
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype ORDER BY enumsortorder;
```
**Résultat attendu :** Liste avec `free`, `business`, `magic`, `essentiel`, `connexions`, `commerce`, `opere`

### ÉTAPE 2 : Ajouter les valeurs manquantes (si nécessaire)
```sql
-- SI LES VALEURS MANQUENT, exécutez ceci :
DO $$
BEGIN
    ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'essentiel';
    ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'connexions';
    ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'commerce';
    ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'opere';
    RAISE NOTICE '✅ VALEURS AJOUTÉES';
END $$;
```

### ÉTAPE 3 : Tester
1. Allez dans `/admin/users/[ID_UTILISATEUR]`
2. Cliquez sur "Activer plan BÖÖH Essentiel (gratuit)"
3. **L'erreur 400 devrait disparaître**

## Si ça ne marche toujours pas

### Option A : Vider le cache
- `Ctrl + Shift + R` (hard refresh)
- Redémarrer le serveur de dev

### Option B : Vérifier les RLS
```sql
-- Dans Supabase SQL Editor :
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_subscriptions';
```

### Option C : Test direct
```sql
-- Test si les nouvelles valeurs fonctionnent :
SELECT 'essentiel'::subscription_plan as test1,
       'connexions'::subscription_plan as test2,
       'commerce'::subscription_plan as test3,
       'opere'::subscription_plan as test4;
```

## Contact
Si rien ne marche, envoyez-moi le résultat de l'ÉTAPE 1.