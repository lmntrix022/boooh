-- ================================================================
-- SCRIPT DE VÉRIFICATION POST-MIGRATION
-- Exécutez ce script pour vérifier que tout est OK
-- ================================================================

-- 1. Vérifier l'enum subscription_plan (doit retourner 7 lignes)
SELECT '1. VÉRIFICATION ENUM' AS test;
SELECT enumlabel, enumsortorder
FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- 2. Vérifier les commissions (doit retourner 7 lignes: 3 legacy + 4 nouveaux)
SELECT '2. VÉRIFICATION COMMISSIONS' AS test;
SELECT 
    plan_type,
    monthly_fee_fcfa,
    commission_percentage,
    setup_fee_fcfa,
    is_legacy,
    description
FROM commission_tiers
ORDER BY is_legacy DESC, monthly_fee_fcfa;

-- 3. Vérifier les packages Opéré (doit retourner 4 lignes)
SELECT '3. VÉRIFICATION PACKAGES OPÉRÉ' AS test;
SELECT 
    package_id,
    name,
    price_fcfa,
    price_eur,
    duration,
    is_popular
FROM opere_setup_packages
ORDER BY price_fcfa;

-- 4. Vérifier les tables créées (doit retourner 5 lignes)
SELECT '4. VÉRIFICATION TABLES' AS test;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'commission_tiers',
    'opere_setup_packages',
    'opere_setup_payments',
    'plan_revenue_tracking',
    'subscription_migrations'
)
ORDER BY table_name;

-- 5. Vérifier les fonctions créées
SELECT '5. VÉRIFICATION FONCTIONS' AS test;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('has_paid_opere_setup', 'get_plan_commission_config')
ORDER BY routine_name;

-- 6. Vérifier les RLS policies
SELECT '6. VÉRIFICATION RLS POLICIES' AS test;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
    'commission_tiers',
    'opere_setup_packages',
    'opere_setup_payments',
    'plan_revenue_tracking',
    'subscription_migrations'
)
ORDER BY tablename, policyname;

-- 7. Test fonction: Calculer commission pour chaque plan
SELECT '7. TEST CALCUL COMMISSIONS' AS test;

-- Test pour chaque plan avec un CA de 1M FCFA
WITH test_data AS (
    SELECT 
        'essentiel'::subscription_plan as plan_type
    UNION ALL SELECT 'connexions'::subscription_plan
    UNION ALL SELECT 'commerce'::subscription_plan
    UNION ALL SELECT 'opere'::subscription_plan
)
SELECT 
    td.plan_type::TEXT as plan,
    config.monthly_fee as fee_mensuel_fcfa,
    config.commission_pct as commission_pct,
    config.min_commission as min_commission_fcfa,
    -- Commission sur 1M FCFA de CA
    CASE 
        WHEN config.commission_pct > 0 THEN (1000000 * config.commission_pct / 100)::INTEGER
        ELSE 0
    END as commission_sur_1M_fcfa,
    -- Revenu total Bööh sur 1M de CA
    config.monthly_fee + 
    CASE 
        WHEN config.commission_pct > 0 THEN (1000000 * config.commission_pct / 100)::INTEGER
        ELSE 0
    END as revenu_booh_total_sur_1M
FROM test_data td
CROSS JOIN LATERAL get_plan_commission_config(td.plan_type) config
ORDER BY 
    CASE td.plan_type::TEXT
        WHEN 'essentiel' THEN 1
        WHEN 'connexions' THEN 2
        WHEN 'commerce' THEN 3
        WHEN 'opere' THEN 4
    END;

-- ================================================================
-- RÉSULTATS ATTENDUS
-- ================================================================
-- 1. ENUM: 7 valeurs (free, business, magic, essentiel, connexions, commerce, opere)
-- 2. COMMISSIONS: 7 lignes (3 legacy + 4 nouveaux)
-- 3. PACKAGES: 4 lignes (Standard 50K, Business 150K, Premium 300K, Enterprise 500K)
-- 4. TABLES: 5 tables
-- 5. FONCTIONS: 2 fonctions
-- 6. POLICIES: Au moins 5 policies
-- 7. CALCULS:
--    - Essentiel: 0 FCFA/mois, 0% commission
--    - Connexions: 15,000 FCFA/mois, 0% commission
--    - Commerce: 0 FCFA/mois, 5% commission (50,000 FCFA sur 1M)
--    - Opéré: 0 FCFA/mois, 10% commission (100,000 FCFA sur 1M)
-- ================================================================
