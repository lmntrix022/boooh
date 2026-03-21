-- ================================================================
-- ÉTAPE 1 : Créer l'enum subscription_plan avec toutes les valeurs
-- Ce fichier doit être exécuté EN PREMIER
-- ================================================================

-- Vérifier et créer l'enum
DO $$ 
DECLARE
    enum_exists BOOLEAN;
    rec RECORD;
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 ÉTAPE 1 : Création/Mise à jour de l''enum';
    RAISE NOTICE '=================================================';
    
    -- Vérifier si le type existe
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Créer le type avec toutes les valeurs
        CREATE TYPE subscription_plan AS ENUM (
            'free', 
            'business', 
            'magic',
            'essentiel',
            'connexions',
            'commerce',
            'opere'
        );
        RAISE NOTICE '✅ Enum subscription_plan créé avec 7 valeurs';
    ELSE
        RAISE NOTICE 'ℹ️ Enum subscription_plan existe déjà';
    END IF;
    
    -- Afficher les valeurs actuelles
    RAISE NOTICE '';
    RAISE NOTICE '📋 Valeurs actuelles de l''enum:';
    FOR rec IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  %: %', rec.enumsortorder, rec.enumlabel;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✅ ÉTAPE 1 terminée';
    RAISE NOTICE '➡️  Exécutez maintenant ÉTAPE 2';
    RAISE NOTICE '=================================================';
END $$;
