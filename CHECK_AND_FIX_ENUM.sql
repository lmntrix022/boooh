-- ================================================================
-- SCRIPT DE VÉRIFICATION ET RÉPARATION DE L'ENUM
-- À EXÉCUTER DANS L'INTERFACE SQL DE SUPABASE
-- ================================================================

-- 1. Vérifier les valeurs actuelles de l'enum
DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    RAISE NOTICE '🔍 VÉRIFICATION DES VALEURS ACTUELLES DE L''ENUM subscription_plan';

    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'subscription_plan'::regtype;

    RAISE NOTICE 'Valeurs actuelles: %', enum_values;

    -- Vérifier chaque nouvelle valeur
    IF NOT ('essentiel' = ANY(enum_values)) THEN
        RAISE NOTICE '❌ essentiel manquant - AJOUT';
        ALTER TYPE subscription_plan ADD VALUE 'essentiel';
    ELSE
        RAISE NOTICE '✅ essentiel présent';
    END IF;

    IF NOT ('connexions' = ANY(enum_values)) THEN
        RAISE NOTICE '❌ connexions manquant - AJOUT';
        ALTER TYPE subscription_plan ADD VALUE 'connexions';
    ELSE
        RAISE NOTICE '✅ connexions présent';
    END IF;

    IF NOT ('commerce' = ANY(enum_values)) THEN
        RAISE NOTICE '❌ commerce manquant - AJOUT';
        ALTER TYPE subscription_plan ADD VALUE 'commerce';
    ELSE
        RAISE NOTICE '✅ commerce présent';
    END IF;

    IF NOT ('opere' = ANY(enum_values)) THEN
        RAISE NOTICE '❌ opere manquant - AJOUT';
        ALTER TYPE subscription_plan ADD VALUE 'opere';
    ELSE
        RAISE NOTICE '✅ opere présent';
    END IF;

    RAISE NOTICE '🎉 VÉRIFICATION TERMINÉE';
END $$;

-- 2. Créer la table commission_tiers si elle n'existe pas
CREATE TABLE IF NOT EXISTS commission_tiers (
    plan_type subscription_plan PRIMARY KEY,
    monthly_fee_fcfa INTEGER NOT NULL DEFAULT 0,
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    setup_fee_fcfa INTEGER NOT NULL DEFAULT 0,
    min_commission_fcfa INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_legacy BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insérer les données de commission (upsert pour éviter les conflits)
INSERT INTO commission_tiers (
    plan_type,
    monthly_fee_fcfa,
    commission_percentage,
    setup_fee_fcfa,
    min_commission_fcfa,
    description,
    is_legacy
) VALUES
    -- Nouveaux plans stratégiques
    ('essentiel', 0, 0, 0, 0, 'BÖÖH Essentiel - Gratuit pour adoption massive', FALSE),
    ('connexions', 15000, 0, 0, 0, 'BÖÖH Connexions - MRR stable 15K FCFA/mois', FALSE),
    ('commerce', 0, 5, 0, 0, 'BÖÖH Commerce - 5% commission sur CA', FALSE),
    ('opere', 0, 10, 50000, 0, 'BÖÖH Opéré - 10% commission + setup 50K minimum', FALSE),

    -- Plans legacy (maintenus pour compatibilité)
    ('free', 0, 3, 0, 0, 'Plan gratuit legacy - Commission 3%', TRUE),
    ('business', 25000, 2, 0, 0, 'Plan business legacy - 25K FCFA/mois + 2%', TRUE),
    ('magic', 50000, 1, 0, 0, 'Plan magic legacy - 50K FCFA/mois + 1%', TRUE)
ON CONFLICT (plan_type) DO UPDATE SET
    monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
    commission_percentage = EXCLUDED.commission_percentage,
    setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
    min_commission_fcfa = EXCLUDED.min_commission_fcfa,
    description = EXCLUDED.description,
    is_legacy = EXCLUDED.is_legacy,
    updated_at = NOW();

-- 4. Créer la table opere_setup_packages si elle n'existe pas
CREATE TABLE IF NOT EXISTS opere_setup_packages (
    package_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_fcfa INTEGER NOT NULL,
    price_eur INTEGER NOT NULL,
    duration TEXT NOT NULL,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insérer les packages Opéré
INSERT INTO opere_setup_packages (
    package_id, name, price_fcfa, price_eur, duration, is_popular
) VALUES
    ('standard', 'Standard', 50000, 75, '3 mois', FALSE),
    ('business', 'Business', 150000, 225, '6 mois', TRUE),
    ('premium', 'Premium', 300000, 450, '12 mois', FALSE),
    ('enterprise', 'Enterprise', 500000, 750, '24 mois', FALSE)
ON CONFLICT (package_id) DO UPDATE SET
    name = EXCLUDED.name,
    price_fcfa = EXCLUDED.price_fcfa,
    price_eur = EXCLUDED.price_eur,
    duration = EXCLUDED.duration,
    is_popular = EXCLUDED.is_popular;

-- 6. Supprimer et recréer la fonction get_plan_commission_config
DROP FUNCTION IF EXISTS get_plan_commission_config(subscription_plan);

CREATE FUNCTION get_plan_commission_config(plan subscription_plan)
RETURNS TABLE(
    monthly_fee INTEGER,
    commission_pct DECIMAL(5,2),
    setup_fee INTEGER,
    min_commission INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.monthly_fee_fcfa,
        ct.commission_percentage,
        ct.setup_fee_fcfa,
        ct.min_commission_fcfa
    FROM commission_tiers ct
    WHERE ct.plan_type = plan;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer la fonction calculate_transaction_commission si elle n'existe pas
CREATE OR REPLACE FUNCTION calculate_transaction_commission(
    amount_fcfa INTEGER,
    plan subscription_plan
) RETURNS INTEGER AS $$
DECLARE
    config RECORD;
    commission_amount INTEGER;
BEGIN
    -- Récupérer la configuration du plan
    SELECT * INTO config FROM get_plan_commission_config(plan);

    IF config IS NULL THEN
        RAISE EXCEPTION 'Configuration non trouvée pour le plan %', plan;
    END IF;

    -- Calculer la commission
    commission_amount := (amount_fcfa * config.commission_pct / 100)::INTEGER;

    -- Appliquer le minimum si nécessaire
    IF commission_amount < config.min_commission THEN
        commission_amount := config.min_commission;
    END IF;

    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- 8. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE 'Résumé des modifications:';
    RAISE NOTICE '- Enum subscription_plan mis à jour avec 4 nouvelles valeurs';
    RAISE NOTICE '- Table commission_tiers créée/remplie';
    RAISE NOTICE '- Table opere_setup_packages créée/remplie';
    RAISE NOTICE '- Fonctions get_plan_commission_config et calculate_transaction_commission créées';
    RAISE NOTICE '';
    RAISE NOTICE 'Vous pouvez maintenant tester l''activation des abonnements dans l''admin ! 🚀';
END $$;