-- ================================================================
-- AJOUT RAPIDE DES VALEURS D'ENUM MANQUANTES
-- ================================================================

DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    RAISE NOTICE '🔍 VÉRIFICATION ET AJOUT DES VALEURS D''ENUM...';

    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'subscription_plan'::regtype;

    RAISE NOTICE 'Valeurs actuelles: %', enum_values;

    -- Ajouter chaque nouvelle valeur si elle n'existe pas
    IF NOT ('essentiel' = ANY(enum_values)) THEN
        RAISE NOTICE '➕ AJOUT essentiel';
        ALTER TYPE subscription_plan ADD VALUE 'essentiel';
    END IF;

    IF NOT ('connexions' = ANY(enum_values)) THEN
        RAISE NOTICE '➕ AJOUT connexions';
        ALTER TYPE subscription_plan ADD VALUE 'connexions';
    END IF;

    IF NOT ('commerce' = ANY(enum_values)) THEN
        RAISE NOTICE '➕ AJOUT commerce';
        ALTER TYPE subscription_plan ADD VALUE 'commerce';
    END IF;

    IF NOT ('opere' = ANY(enum_values)) THEN
        RAISE NOTICE '➕ AJOUT opere';
        ALTER TYPE subscription_plan ADD VALUE 'opere';
    END IF;

    RAISE NOTICE '✅ TERMINÉ - LES NOUVELLES VALEURS D''ENUM SONT DISPONIBLES !';
END $$;

-- Vérification finale
SELECT '=== ÉTAT FINAL DE L''ENUM ===' as section;
SELECT enumlabel as valeur, enumsortorder as ordre
FROM pg_enum
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;