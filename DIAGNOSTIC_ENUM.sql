-- ================================================================
-- DIAGNOSTIC RAPIDE DE L'ENUM ET DES TABLES
-- ================================================================

-- 1. Vérifier les valeurs actuelles de l'enum
SELECT '=== VALEURS ACTUELLES DE L''ENUM ===' as section;
SELECT enumlabel as valeur, enumsortorder as ordre
FROM pg_enum
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- 2. Vérifier si les nouvelles valeurs existent
SELECT '=== VÉRIFICATION NOUVELLES VALEURS ===' as section;
SELECT
    'essentiel' as valeur,
    CASE WHEN 'essentiel' = ANY(ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype)) THEN '✅ PRÉSENT' ELSE '❌ MANQUANT' END as statut
UNION ALL
SELECT 'connexions', CASE WHEN 'connexions' = ANY(ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype)) THEN '✅ PRÉSENT' ELSE '❌ MANQUANT' END
UNION ALL
SELECT 'commerce', CASE WHEN 'commerce' = ANY(ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype)) THEN '✅ PRÉSENT' ELSE '❌ MANQUANT' END
UNION ALL
SELECT 'opere', CASE WHEN 'opere' = ANY(ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan'::regtype)) THEN '✅ PRÉSENT' ELSE '❌ MANQUANT' END;

-- 3. Vérifier la structure de la table user_subscriptions
SELECT '=== STRUCTURE user_subscriptions ===' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Tester une requête simple avec les nouvelles valeurs
SELECT '=== TEST REQUÊTE AVEC NOUVELLES VALEURS ===' as section;
DO $$
BEGIN
    -- Tester si on peut utiliser les nouvelles valeurs
    BEGIN
        PERFORM 'essentiel'::subscription_plan;
        RAISE NOTICE '✅ essentiel fonctionne';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ essentiel ne fonctionne pas: %', SQLERRM;
    END;

    BEGIN
        PERFORM 'connexions'::subscription_plan;
        RAISE NOTICE '✅ connexions fonctionne';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ connexions ne fonctionne pas: %', SQLERRM;
    END;

    BEGIN
        PERFORM 'commerce'::subscription_plan;
        RAISE NOTICE '✅ commerce fonctionne';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ commerce ne fonctionne pas: %', SQLERRM;
    END;

    BEGIN
        PERFORM 'opere'::subscription_plan;
        RAISE NOTICE '✅ opere fonctionne';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ opere ne fonctionne pas: %', SQLERRM;
    END;
END $$;