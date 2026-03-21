-- ================================================================
-- Script de TEST pour la migration des nouveaux plans
-- À exécuter AVANT la migration principale pour vérifier
-- ================================================================

-- 1. Vérifier si l'enum subscription_plan existe
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'subscription_plan'
ORDER BY e.enumsortorder;

-- Résultat attendu: devrait lister toutes les valeurs de l'enum
-- Si aucun résultat: l'enum n'existe pas (OK, sera créé)

-- ================================================================
-- 2. Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'commission_tiers',
    'opere_setup_packages',
    'opere_setup_payments',
    'plan_revenue_tracking',
    'subscription_migrations'
)
ORDER BY table_name;

-- Résultat attendu: aucune table (OK, seront créées)
-- Si tables existent: OK, utilisera ON CONFLICT

-- ================================================================
-- 3. Test de création d'enum (rollback automatique)
DO $$
BEGIN
    -- Test dans une transaction qui sera rollback
    RAISE NOTICE 'Test de création enum...';
    
    -- Simuler la vérification
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        RAISE NOTICE '✅ Enum subscription_plan existe déjà';
    ELSE
        RAISE NOTICE '⚠️ Enum subscription_plan n''existe pas, sera créé par la migration';
    END IF;
    
    -- Ne rien créer ici, juste tester
END $$;

-- ================================================================
-- 4. Vérifier user_subscriptions (pour compatibilité)
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
AND column_name = 'plan_type';

-- Résultat attendu: column avec type subscription_plan ou text

-- ================================================================
-- INSTRUCTIONS
-- ================================================================
/*
✅ Si tout se passe bien avec ce script de test:
   → Appliquer la migration: supabase db push

❌ Si erreurs:
   1. Vérifier que Supabase est bien démarré
   2. Vérifier les permissions
   3. Créer manuellement l'enum si nécessaire:
      
      CREATE TYPE subscription_plan AS ENUM (
          'free', 'business', 'magic',
          'essentiel', 'connexions', 'commerce', 'opere'
      );
*/
