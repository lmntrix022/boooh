-- ================================================================
-- FIX MINIMAL POUR L'ENUM - JUSTE LES VALEURS MANQUANTES
-- ================================================================

-- Script ultra-simple : ajouter seulement les valeurs d'enum manquantes

DO $$
DECLARE
    current_values TEXT[];
BEGIN
    -- Récupérer les valeurs actuelles
    SELECT array_agg(enumlabel)
    INTO current_values
    FROM pg_enum
    WHERE enumtypid = 'subscription_plan'::regtype;

    -- Ajouter essentiel si manquant
    IF NOT ('essentiel' = ANY(current_values)) THEN
        ALTER TYPE subscription_plan ADD VALUE 'essentiel';
        RAISE NOTICE '✅ essentiel ajouté';
    ELSE
        RAISE NOTICE 'ℹ️ essentiel déjà présent';
    END IF;

    -- Ajouter connexions si manquant
    IF NOT ('connexions' = ANY(current_values)) THEN
        ALTER TYPE subscription_plan ADD VALUE 'connexions';
        RAISE NOTICE '✅ connexions ajouté';
    ELSE
        RAISE NOTICE 'ℹ️ connexions déjà présent';
    END IF;

    -- Ajouter commerce si manquant
    IF NOT ('commerce' = ANY(current_values)) THEN
        ALTER TYPE subscription_plan ADD VALUE 'commerce';
        RAISE NOTICE '✅ commerce ajouté';
    ELSE
        RAISE NOTICE 'ℹ️ commerce déjà présent';
    END IF;

    -- Ajouter opere si manquant
    IF NOT ('opere' = ANY(current_values)) THEN
        ALTER TYPE subscription_plan ADD VALUE 'opere';
        RAISE NOTICE '✅ opere ajouté';
    ELSE
        RAISE NOTICE 'ℹ️ opere déjà présent';
    END IF;

END $$;

-- Vérification rapide
SELECT 'VALEURS D''ENUM APRÈS FIX :' as status;
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;