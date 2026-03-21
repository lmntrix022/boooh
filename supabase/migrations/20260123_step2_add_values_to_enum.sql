-- ================================================================
-- ÉTAPE 2 : Ajouter les valeurs manquantes à l'enum
-- Exécuter APRÈS l'étape 1
-- ================================================================

-- Ajouter les valeurs manquantes UNE PAR UNE
-- IMPORTANT: Chaque ALTER TYPE doit être dans une transaction séparée

-- Ajouter 'free'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'free' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'free';
        RAISE NOTICE '✅ Valeur free ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur free existe déjà';
    END IF;
END $$;

-- COMMIT implicite ici entre les DO blocks

-- Ajouter 'business'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'business' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'business';
        RAISE NOTICE '✅ Valeur business ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur business existe déjà';
    END IF;
END $$;

-- Ajouter 'magic'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'magic' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'magic';
        RAISE NOTICE '✅ Valeur magic ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur magic existe déjà';
    END IF;
END $$;

-- Ajouter 'essentiel'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'essentiel' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'essentiel';
        RAISE NOTICE '✅ Valeur essentiel ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur essentiel existe déjà';
    END IF;
END $$;

-- Ajouter 'connexions'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'connexions' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'connexions';
        RAISE NOTICE '✅ Valeur connexions ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur connexions existe déjà';
    END IF;
END $$;

-- Ajouter 'commerce'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'commerce' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'commerce';
        RAISE NOTICE '✅ Valeur commerce ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur commerce existe déjà';
    END IF;
END $$;

-- Ajouter 'opere'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'opere' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'opere';
        RAISE NOTICE '✅ Valeur opere ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Valeur opere existe déjà';
    END IF;
END $$;

-- Vérifier le résultat final
DO $$
DECLARE
    rec RECORD;
    val_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO val_count
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan');
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 VÉRIFICATION FINALE';
    RAISE NOTICE 'Nombre de valeurs dans l''enum: %', val_count;
    RAISE NOTICE '=================================================';
    
    FOR rec IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  %: %', rec.enumsortorder, rec.enumlabel;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF val_count >= 7 THEN
        RAISE NOTICE '✅ ÉTAPE 2 terminée avec succès';
        RAISE NOTICE '➡️  Exécutez maintenant ÉTAPE 3 (créer les tables)';
    ELSE
        RAISE WARNING '⚠️ Seulement % valeurs (7 attendues)', val_count;
    END IF;
    
    RAISE NOTICE '=================================================';
END $$;
