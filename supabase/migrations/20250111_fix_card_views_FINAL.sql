-- Migration FINALE pour corriger l'enregistrement des vues de cartes
-- Date: 2025-01-11
-- Problème: Conflit de surcharge de fonction (PGRST203)
-- Solution: Supprimer TOUTES les versions de la fonction et en créer UNE SEULE version correcte

-- ============================================
-- ÉTAPE 1: NETTOYER TOUTES LES VERSIONS DE LA FONCTION
-- ============================================

-- Supprimer toutes les signatures possibles de la fonction record_card_view
-- Cette approche exhaustive garantit qu'il n'y a plus de conflits

DROP FUNCTION IF EXISTS public.record_card_view(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(UUID, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(UUID, INET, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(card_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(card_uuid UUID, viewer_ip_param TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(card_uuid UUID, viewer_ip_param TEXT, user_agent_param TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.record_card_view(card_uuid UUID, viewer_ip_param TEXT, user_agent_param TEXT, referrer_param TEXT) CASCADE;

-- Vérifier qu'il ne reste aucune fonction record_card_view
DO $$
DECLARE
    remaining_functions INT;
BEGIN
    SELECT COUNT(*) INTO remaining_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'record_card_view'
    AND n.nspname = 'public';

    IF remaining_functions > 0 THEN
        RAISE WARNING 'Il reste encore % version(s) de record_card_view', remaining_functions;
    ELSE
        RAISE NOTICE '✅ Toutes les anciennes versions de record_card_view ont été supprimées';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2: S'ASSURER QUE LA TABLE EST PRÊTE
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
-- ÉTAPE 3: CRÉER LES INDEX POUR PERFORMANCE
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
-- ÉTAPE 4: CRÉER UNE SEULE VERSION DE LA FONCTION
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
    -- Convertir l'IP en type INET (gérer les erreurs de conversion)
    BEGIN
        IF viewer_ip_param IS NOT NULL AND viewer_ip_param != '' THEN
            ip_address := viewer_ip_param::INET;
        ELSE
            ip_address := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Si la conversion échoue, utiliser NULL
        ip_address := NULL;
    END;

    -- Générer un visitor_id anonyme basé sur IP + User-Agent
    -- Utiliser MD5 pour hacher (compatible avec PostgreSQL sans extensions)
    visitor_hash := MD5(
        COALESCE(viewer_ip_param, 'unknown') || '-' ||
        COALESCE(user_agent_param, 'unknown') || '-' ||
        EXTRACT(EPOCH FROM NOW())::TEXT
    );

    -- Insérer une nouvelle vue avec toutes les informations
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

    -- Log pour debug (visible dans les logs Supabase)
    RAISE DEBUG 'Vue enregistrée: carte=%, IP=%, visitor=%',
        card_uuid,
        COALESCE(viewer_ip_param, 'none'),
        COALESCE(visitor_hash, 'none');

EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, logger mais ne pas bloquer l'application
    RAISE WARNING 'Erreur lors de l''enregistrement de la vue: % (SQLSTATE: %)',
        SQLERRM,
        SQLSTATE;
END;
$$;

-- ============================================
-- ÉTAPE 5: PERMISSIONS ET DOCUMENTATION
-- ============================================

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) IS
'Enregistre une vue de carte de visite avec tracking anonyme.

Paramètres:
- card_uuid: ID de la carte consultée (REQUIS)
- viewer_ip_param: Adresse IP du visiteur (optionnel)
- user_agent_param: User-Agent du navigateur (optionnel)
- referrer_param: URL de provenance (optionnel)

Génère automatiquement un visitor_id anonyme (hash MD5) pour tracker les visiteurs uniques.
Cette fonction est SECURITY DEFINER donc elle s''exécute avec les privilèges du propriétaire.';

-- Accorder les permissions aux rôles anon et authenticated
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Révoquer l'accès public par défaut (sécurité)
REVOKE ALL ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

-- ============================================
-- ÉTAPE 6: VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier qu'il n'y a qu'UNE SEULE version de la fonction
DO $$
DECLARE
    function_count INT;
    function_signature TEXT;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'record_card_view'
    AND n.nspname = 'public';

    IF function_count = 1 THEN
        -- Obtenir la signature de la fonction
        SELECT pg_get_function_identity_arguments(p.oid) INTO function_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'record_card_view'
        AND n.nspname = 'public';

        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ MIGRATION RÉUSSIE';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Une seule version de la fonction existe:';
        RAISE NOTICE 'record_card_view(%)', function_signature;
        RAISE NOTICE '';
    ELSIF function_count = 0 THEN
        RAISE EXCEPTION '❌ Aucune fonction record_card_view trouvée après la migration!';
    ELSE
        RAISE EXCEPTION '❌ Plusieurs versions de record_card_view existent encore (%). Veuillez contacter le support.', function_count;
    END IF;
END $$;

-- Afficher un résumé des données existantes
DO $$
DECLARE
    views_count INT;
    unique_visitors INT;
    cards_with_views INT;
BEGIN
    -- Compter les vues totales
    SELECT COUNT(*) INTO views_count FROM card_views;

    -- Compter les visiteurs uniques
    SELECT COUNT(DISTINCT visitor_id) INTO unique_visitors
    FROM card_views
    WHERE visitor_id IS NOT NULL;

    -- Compter les cartes ayant des vues
    SELECT COUNT(DISTINCT card_id) INTO cards_with_views
    FROM card_views;

    RAISE NOTICE 'Statistiques actuelles:';
    RAISE NOTICE '  - Vues totales: %', views_count;
    RAISE NOTICE '  - Visiteurs uniques: %', unique_visitors;
    RAISE NOTICE '  - Cartes avec vues: %', cards_with_views;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 La fonction record_card_view est prête!';
    RAISE NOTICE 'Vous pouvez maintenant tester depuis votre application.';
    RAISE NOTICE '========================================';
END $$;
