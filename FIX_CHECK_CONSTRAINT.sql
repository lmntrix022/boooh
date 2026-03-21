-- ================================================================
-- FIX DE LA CONTRAINTE CHECK user_subscriptions_plan_type_check
-- ================================================================

-- 1. Vérifier la contrainte actuelle
SELECT '=== CONTRAINTE CHECK ACTUELLE ===' as info;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'user_subscriptions_plan_type_check';

-- 2. Supprimer la contrainte restrictive
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

-- 3. Vérifier que les valeurs d'enum sont bien présentes
SELECT '=== VALEURS D''ENUM DISPONIBLES ===' as info;
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- 4. Tester une mise à jour avec les nouvelles valeurs
SELECT '=== TEST MISE À JOUR ===' as info;
UPDATE user_subscriptions
SET plan_type = 'essentiel'::subscription_plan,
    updated_at = NOW()
WHERE user_id = '1ce01ffe-6917-4390-8994-0ea3c5a97b91';

-- 5. Vérifier le résultat
SELECT '=== RÉSULTAT FINAL ===' as info;
SELECT user_id, plan_type, status, updated_at
FROM user_subscriptions
WHERE user_id = '1ce01ffe-6917-4390-8994-0ea3c5a97b91';