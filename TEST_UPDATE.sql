-- ================================================================
-- TEST DIRECT DE MISE À JOUR
-- ================================================================

-- Test 1: Vérifier les valeurs d'enum
SELECT '=== VALEURS D''ENUM ===' as test;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype ORDER BY enumsortorder;

-- Test 2: Tester une mise à jour directe
SELECT '=== TEST MISE À JOUR DIRECTE ===' as test;
UPDATE user_subscriptions
SET plan_type = 'essentiel'::subscription_plan,
    status = 'active',
    updated_at = NOW()
WHERE user_id = '1ce01ffe-6917-4390-8994-0ea3c5a97b91'
  AND status = 'active';

-- Test 3: Vérifier les RLS policies
SELECT '=== POLICIES RLS ===' as test;
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'user_subscriptions';

-- Test 4: Vérifier la structure de la table
SELECT '=== STRUCTURE TABLE ===' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;