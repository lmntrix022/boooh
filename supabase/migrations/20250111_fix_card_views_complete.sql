-- Migration complète pour corriger l'enregistrement des vues de cartes
-- Date: 2025-01-11
-- Problème: Les vues ne s'incrémentent plus car la fonction record_card_view ne génère pas le visitor_id
-- Solution: Mettre à jour la fonction pour générer le visitor_id côté serveur

-- ============================================
-- ÉTAPE 1: S'assurer que la table card_views a toutes les colonnes nécessaires
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
        RAISE NOTICE 'Colonne visitor_id ajoutée';
    END IF;

    -- Ajouter referrer si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'referrer'
    ) THEN
        ALTER TABLE card_views ADD COLUMN referrer TEXT;
        RAISE NOTICE 'Colonne referrer ajoutée';
    END IF;

    -- Vérifier que viewed_at existe (devrait toujours exister)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'viewed_at'
    ) THEN
        ALTER TABLE card_views ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne viewed_at ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Créer/Recréer les index pour les performances
-- ============================================

-- Index pour visitor_id (vues uniques)
CREATE INDEX IF NOT EXISTS idx_card_views_visitor_id
ON card_views(visitor_id)
WHERE visitor_id IS NOT NULL;

-- Index pour referrer (sources de trafic)
CREATE INDEX IF NOT EXISTS idx_card_views_referrer
ON card_views(referrer)
WHERE referrer IS NOT NULL;

-- Index pour viewed_at (tri par date)
CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at_desc
ON card_views(viewed_at DESC);

-- Index composite pour requêtes courantes (card_id + date)
CREATE INDEX IF NOT EXISTS idx_card_views_card_viewed
ON card_views(card_id, viewed_at DESC);

-- Index pour les comptages rapides par carte
CREATE INDEX IF NOT EXISTS idx_card_views_card_id
ON card_views(card_id);

-- ============================================
-- ÉTAPE 3: Recréer la fonction record_card_view avec génération de visitor_id
-- ============================================

-- Supprimer l'ancienne fonction (toutes les signatures possibles)
DROP FUNCTION IF EXISTS public.record_card_view(UUID);
DROP FUNCTION IF EXISTS public.record_card_view(UUID, TEXT, TEXT, TEXT);

-- Créer la nouvelle fonction avec génération de visitor_id
CREATE OR REPLACE FUNCTION public.record_card_view(
    card_uuid UUID,
    viewer_ip_param TEXT DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    referrer_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
        RAISE NOTICE 'Impossible de convertir l''IP: %', viewer_ip_param;
    END;

    -- Générer un visitor_id anonyme basé sur IP + User-Agent
    -- Utiliser MD5 pour hacher (compatible avec PostgreSQL sans extensions)
    BEGIN
        visitor_hash := MD5(
            COALESCE(viewer_ip_param, 'unknown') || '-' ||
            COALESCE(user_agent_param, 'unknown')
        );
    EXCEPTION WHEN OTHERS THEN
        visitor_hash := NULL;
        RAISE NOTICE 'Impossible de générer le visitor_id';
    END;

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
    RAISE NOTICE 'Vue enregistrée: carte=%, IP=%, visitor=%',
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
-- ÉTAPE 4: Permissions et sécurité
-- ============================================

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) IS
'Enregistre une vue de carte de visite avec tracking anonyme.
Paramètres:
- card_uuid: ID de la carte consultée
- viewer_ip_param: Adresse IP du visiteur (optionnel)
- user_agent_param: User-Agent du navigateur (optionnel)
- referrer_param: URL de provenance (optionnel)

Génère automatiquement un visitor_id anonyme (hash MD5) pour tracker les visiteurs uniques.';

-- Accorder les permissions aux rôles anon et authenticated
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================
-- ÉTAPE 5: Vérifications et nettoyage
-- ============================================

-- Afficher un résumé de la migration
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

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vues totales: %', views_count;
    RAISE NOTICE 'Visiteurs uniques: %', unique_visitors;
    RAISE NOTICE 'Cartes avec vues: %', cards_with_views;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'La fonction record_card_view est maintenant opérationnelle.';
    RAISE NOTICE 'Les nouvelles vues incluront automatiquement un visitor_id.';
    RAISE NOTICE '========================================';
END $$;
