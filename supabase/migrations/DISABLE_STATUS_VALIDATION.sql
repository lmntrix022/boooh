-- =====================================================
-- SCRIPT POUR DÉSACTIVER LA VALIDATION DES TRANSITIONS DE STATUT
-- =====================================================
-- Date: 2025-01-22
-- À utiliser UNIQUEMENT si les transitions de statut causent des problèmes
-- =====================================================

-- Option 1: Supprimer complètement les triggers de validation
-- (Recommandé si vous voulez une gestion flexible des statuts)

DROP TRIGGER IF EXISTS trigger_check_digital_status_transition ON digital_inquiries CASCADE;
DROP TRIGGER IF EXISTS trigger_check_product_status_transition ON product_inquiries CASCADE;

SELECT 'Triggers de validation de statut supprimés - Toutes les transitions sont maintenant autorisées' as status;

-- =====================================================
-- Option 2: Modifier la fonction pour autoriser TOUTES les transitions
-- (Alternative si vous voulez garder le trigger mais sans restrictions)
-- =====================================================

-- Décommentez les lignes ci-dessous si vous préférez cette approche:

/*
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Autoriser toutes les transitions
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT 'Fonction de validation modifiée - Toutes les transitions sont autorisées' as status;
*/

-- =====================================================
-- Option 3: Rendre la validation plus permissive
-- =====================================================

-- Décommentez les lignes ci-dessous pour une version plus permissive:

/*
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Autoriser toutes les transitions sauf de 'completed' vers 'pending'
    IF old_status = 'completed' AND new_status = 'pending' THEN
        RETURN FALSE;
    END IF;

    -- Autoriser toutes les autres transitions
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT 'Fonction de validation rendue plus permissive' as status;
*/
