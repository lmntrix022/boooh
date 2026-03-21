-- Migration ULTRA-AGRESSIVE pour nettoyer TOUTES les versions de record_card_view
-- Date: 2025-01-11
-- Problème: Plusieurs versions de la fonction persistent malgré les DROP IF EXISTS
-- Solution: Identification et suppression dynamique de TOUTES les versions

-- ============================================
-- ÉTAPE 1: IDENTIFIER TOUTES LES VERSIONS EXISTANTES
-- ============================================

DO $$
DECLARE
    func_record RECORD;
    drop_statement TEXT;
    dropped_count INT := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NETTOYAGE COMPLET DE record_card_view';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Lister toutes les versions de la fonction
    RAISE NOTICE 'Versions existantes avant nettoyage:';
    FOR func_record IN
        SELECT
            p.oid,
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'record_card_view'
        ORDER BY n.nspname, p.oid
    LOOP
        RAISE NOTICE '  - %.%(%) [OID: %]',
            func_record.schema_name,
            func_record.function_name,
            func_record.args,
            func_record.oid;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Suppression en cours...';
    RAISE NOTICE '';

    -- Supprimer TOUTES les versions dynamiquement
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'record_card_view'
    LOOP
        -- Construire la commande DROP avec la signature complète
        drop_statement := format(
            'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );

        RAISE NOTICE '  Exécution: %', drop_statement;

        -- Exécuter la suppression
        BEGIN
            EXECUTE drop_statement;
            dropped_count := dropped_count + 1;
            RAISE NOTICE '  ✅ Supprimé: %.%(%)',
                func_record.schema_name,
                func_record.function_name,
                func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '  ⚠️ Erreur lors de la suppression: %', SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Résumé du nettoyage:';
    RAISE NOTICE '  - Fonctions supprimées: %', dropped_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 2: VÉRIFIER QUE TOUT EST NETTOYÉ
-- ============================================

DO $$
DECLARE
    remaining_functions INT;
BEGIN
    SELECT COUNT(*) INTO remaining_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'record_card_view';

    IF remaining_functions > 0 THEN
        RAISE EXCEPTION '❌ Il reste encore % version(s) de record_card_view après le nettoyage forcé!', remaining_functions;
    ELSE
        RAISE NOTICE '✅ Toutes les versions de record_card_view ont été supprimées avec succès!';
        RAISE NOTICE '';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 3: PRÉPARER LA TABLE
-- ============================================

-- Vérifier et ajouter les colonnes manquantes
DO $$
BEGIN
    -- Ajouter visitor_id si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'visitor_id'
    ) THEN
        ALTER TABLE card_views ADD COLUMN visitor_id TEXT;
        RAISE NOTICE '✅ Colonne visitor_id ajoutée';
    END IF;

    -- Ajouter referrer si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'referrer'
    ) THEN
        ALTER TABLE card_views ADD COLUMN referrer TEXT;
        RAISE NOTICE '✅ Colonne referrer ajoutée';
    END IF;

    -- Vérifier que viewed_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'viewed_at'
    ) THEN
        ALTER TABLE card_views ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Colonne viewed_at ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 4: CRÉER LES INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_card_views_visitor_id
ON card_views(visitor_id)
WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_views_referrer
ON card_views(referrer)
WHERE referrer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at_desc
ON card_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_views_card_viewed
ON card_views(card_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_views_card_id
ON card_views(card_id);

-- ============================================
-- ÉTAPE 5: CRÉER LA NOUVELLE FONCTION (UNIQUE)
-- ============================================

CREATE FUNCTION public.record_card_view(
    card_uuid UUID,
    viewer_ip_param TEXT DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    referrer_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ip_address INET;
    visitor_hash TEXT;
BEGIN
    -- Convertir l'IP en type INET
    BEGIN
        IF viewer_ip_param IS NOT NULL AND viewer_ip_param != '' THEN
            ip_address := viewer_ip_param::INET;
        ELSE
            ip_address := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        ip_address := NULL;
    END;

    -- Générer un visitor_id unique
    visitor_hash := MD5(
        COALESCE(viewer_ip_param, 'unknown') || '-' ||
        COALESCE(user_agent_param, 'unknown') || '-' ||
        EXTRACT(EPOCH FROM NOW())::TEXT
    );

    -- Insérer la vue
    INSERT INTO public.card_views (
        card_id,
        viewer_ip,
        user_agent,
        referrer,
        visitor_id,
        viewed_at,
        count
    )
    VALUES (
        card_uuid,
        ip_address,
        user_agent_param,
        referrer_param,
        visitor_hash,
        NOW(),
        1
    );

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de l''enregistrement de la vue: % (SQLSTATE: %)',
        SQLERRM,
        SQLSTATE;
END;
$$;

-- ============================================
-- ÉTAPE 6: PERMISSIONS
-- ============================================

COMMENT ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) IS
'Enregistre une vue de carte de visite avec tracking anonyme.';

GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

-- ============================================
-- ÉTAPE 7: VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
    function_count INT;
    function_signature TEXT;
    views_count INT;
    unique_visitors INT;
    cards_with_views INT;
BEGIN
    -- Vérifier qu'il n'y a qu'une seule fonction
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'record_card_view'
    AND n.nspname = 'public';

    IF function_count = 1 THEN
        SELECT pg_get_function_identity_arguments(p.oid) INTO function_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'record_card_view'
        AND n.nspname = 'public';

        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ MIGRATION RÉUSSIE!';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Fonction créée:';
        RAISE NOTICE '  public.record_card_view(%)', function_signature;
        RAISE NOTICE '';
    ELSIF function_count = 0 THEN
        RAISE EXCEPTION '❌ Aucune fonction créée!';
    ELSE
        RAISE EXCEPTION '❌ Plusieurs versions existent encore (%)!', function_count;
    END IF;

    -- Statistiques
    SELECT COUNT(*) INTO views_count FROM card_views;
    SELECT COUNT(DISTINCT visitor_id) INTO unique_visitors FROM card_views WHERE visitor_id IS NOT NULL;
    SELECT COUNT(DISTINCT card_id) INTO cards_with_views FROM card_views;

    RAISE NOTICE 'Statistiques:';
    RAISE NOTICE '  - Vues totales: %', views_count;
    RAISE NOTICE '  - Visiteurs uniques: %', unique_visitors;
    RAISE NOTICE '  - Cartes avec vues: %', cards_with_views;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Vous pouvez maintenant tester l''application!';
    RAISE NOTICE '========================================';
END $$;
