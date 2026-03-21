-- ================================================================
-- VÉRIFICATION SIMPLE ET RAPIDE
-- ================================================================

-- 1️⃣ Vérifier l'enum (doit retourner 7 lignes)
SELECT '📊 1. ENUM subscription_plan' AS verification;
SELECT enumlabel as valeur, enumsortorder as ordre
FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- 2️⃣ Vérifier les commissions (doit retourner 7 lignes)
SELECT '💰 2. COMMISSIONS configurées' AS verification;
SELECT 
    plan_type::TEXT as plan,
    monthly_fee_fcfa as abonnement_fcfa,
    commission_percentage as commission_pct,
    CASE WHEN is_legacy THEN '🔶 Legacy' ELSE '✨ Nouveau' END as type
FROM commission_tiers
ORDER BY is_legacy DESC, monthly_fee_fcfa;

-- 3️⃣ Vérifier les packages (doit retourner 4 lignes)
SELECT '📦 3. PACKAGES Opéré' AS verification;
SELECT 
    name as package,
    price_fcfa,
    duration as duree,
    CASE WHEN is_popular THEN '⭐ POPULAIRE' ELSE '' END as badge
FROM opere_setup_packages
ORDER BY price_fcfa;

-- 4️⃣ Vérifier les tables (doit retourner 5 lignes)
SELECT '🗄️ 4. TABLES créées' AS verification;
SELECT 
    table_name as table,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes
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

-- 5️⃣ Test rapide des commissions sur 1M FCFA
SELECT '💵 5. SIMULATION sur 1,000,000 FCFA de CA' AS verification;
SELECT 
    ct.plan_type::TEXT as plan,
    ct.monthly_fee_fcfa as abonnement_mensuel,
    ct.commission_percentage as pct,
    (1000000 * ct.commission_percentage / 100)::INTEGER as commission_sur_1M,
    ct.monthly_fee_fcfa + (1000000 * ct.commission_percentage / 100)::INTEGER as revenu_booh_total
FROM commission_tiers ct
WHERE NOT ct.is_legacy
ORDER BY ct.plan_type;

-- ================================================================
-- ✅ RÉSULTATS ATTENDUS :
-- 1. 7 valeurs d'enum
-- 2. 7 commissions (3 legacy + 4 nouveaux)
-- 3. 4 packages (Standard 50K, Business 150K, Premium 300K, Enterprise 500K)
-- 4. 5 tables
-- 5. Commissions :
--    - essentiel: 0 FCFA
--    - connexions: 15,000 FCFA (pas de commission)
--    - commerce: 50,000 FCFA (5% de 1M)
--    - opere: 100,000 FCFA (10% de 1M)
-- ================================================================
