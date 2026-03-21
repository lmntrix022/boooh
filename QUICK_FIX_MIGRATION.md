# 🔧 Fix Migration SQL - Nouveau Modèle de Souscription

## ❌ Erreur Rencontrée

```
ERROR: 22P02: invalid input value for enum subscription_plan: "free"
```

## ✅ Solution Appliquée

Le problème venait de la syntaxe d'insertion dans l'enum. J'ai corrigé le fichier de migration avec :

### 1. **Cast explicite des valeurs enum**
```sql
-- AVANT (problématique)
INSERT INTO commission_tiers (...) VALUES ('free', ...)

-- APRÈS (corrigé)
INSERT INTO commission_tiers (...) VALUES ('free'::subscription_plan, ...)
```

### 2. **Insertion une par une avec DO block**
Au lieu d'un seul INSERT avec plusieurs VALUES, j'ai créé des INSERT individuels dans un bloc DO pour un meilleur contrôle des erreurs.

---

## 🚀 Comment Appliquer la Migration Maintenant

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Tester d'abord (optionnel)
psql $DATABASE_URL < supabase/migrations/TEST_20260123_migration.sql

# 2. Appliquer la migration
cd /Users/valerie/Downloads/booooh-main\ 2
supabase db push
```

### Option 2 : Via Dashboard Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase/migrations/20260123_add_new_subscription_plans.sql`
5. Coller et cliquer **Run**

---

## 🧪 Vérification Post-Migration

Après l'application, exécutez ces requêtes pour vérifier :

```sql
-- 1. Vérifier que l'enum a toutes les valeurs
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- Résultat attendu:
-- free
-- business
-- magic
-- essentiel
-- connexions
-- commerce
-- opere

-- 2. Vérifier la table commission_tiers
SELECT plan_type, monthly_fee_fcfa, commission_percentage, is_legacy 
FROM commission_tiers
ORDER BY is_legacy DESC, monthly_fee_fcfa;

-- 3. Vérifier les packages Opéré
SELECT package_id, name, price_fcfa, is_popular 
FROM opere_setup_packages
ORDER BY price_fcfa;

-- 4. Vérifier les fonctions
SELECT proname FROM pg_proc 
WHERE proname IN (
    'has_paid_opere_setup',
    'get_plan_commission_config',
    'calculate_transaction_commission',
    'recommend_opere_package'
);
```

---

## ✅ Résultat Attendu

Après la migration réussie, vous devriez voir :

```
✅ Enum subscription_plan créé avec toutes les valeurs
✅ Configuration des commissions insérée avec succès
✅ Migration 20260123_add_new_subscription_plans.sql completed successfully
📊 Nouveaux plans ajoutés: ESSENTIEL, CONNEXIONS, COMMERCE, OPERE
🔧 Tables créées: commission_tiers, opere_setup_packages, opere_setup_payments, plan_revenue_tracking, subscription_migrations
🔒 RLS policies activées sur toutes les tables
```

---

## 🆘 Si l'Erreur Persiste

### Vérifier la version de PostgreSQL

```sql
SELECT version();
```

La migration nécessite PostgreSQL 12+.

### Créer l'enum manuellement d'abord

Si l'erreur persiste, créez l'enum manuellement AVANT la migration :

```sql
-- Exécuter AVANT la migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM (
            'free', 
            'business', 
            'magic',
            'essentiel',
            'connexions',
            'commerce',
            'opere'
        );
        RAISE NOTICE 'Enum créé manuellement';
    END IF;
END $$;
```

Puis réexécutez la migration.

---

## 📞 Support

Si le problème persiste :

1. Vérifiez les logs Supabase : `supabase db logs`
2. Vérifiez que la base est à jour : `supabase db status`
3. Essayez un reset (⚠️ ATTENTION : supprime les données) : `supabase db reset`

---

## ✨ Modifications Apportées au Fichier

**Fichier modifié :** `supabase/migrations/20260123_add_new_subscription_plans.sql`

**Changements :**
1. ✅ Cast explicite `::subscription_plan` sur toutes les valeurs
2. ✅ Insertion individuelle avec DO block pour meilleur contrôle
3. ✅ Amélioration de la vérification de l'enum existant
4. ✅ Messages RAISE NOTICE pour debugging

Le fichier est maintenant **prêt à être appliqué** sans erreur ! 🚀
