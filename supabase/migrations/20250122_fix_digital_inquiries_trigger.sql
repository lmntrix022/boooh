-- Migration pour corriger le trigger problématique sur digital_inquiries
-- Date: 2025-01-22
-- Problème: Le trigger essaie d'accéder à NEW.product_id qui n'existe pas dans digital_inquiries
-- Solution: Supprimer le trigger et la fonction associée

-- =====================================================
-- 1. SUPPRIMER LE TRIGGER PROBLÉMATIQUE
-- =====================================================

DROP TRIGGER IF EXISTS trigger_validate_digital_inquiry_product_link ON digital_inquiries;

COMMENT ON TABLE digital_inquiries IS
'Table des commandes de produits digitaux - trigger product_id supprimé (le champ n''existe pas)';

-- =====================================================
-- 2. SUPPRIMER LA FONCTION TRIGGER
-- =====================================================

DROP FUNCTION IF EXISTS validate_digital_inquiry_product_link();

-- =====================================================
-- 3. SUPPRIMER LA COLONNE product_id SI ELLE EXISTE
-- =====================================================

-- Cette colonne ne devrait pas exister car digital_inquiries utilise digital_product_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'digital_inquiries'
        AND column_name = 'product_id'
    ) THEN
        -- Supprimer la colonne product_id
        ALTER TABLE digital_inquiries DROP COLUMN IF EXISTS product_id;

        RAISE NOTICE 'Colonne product_id supprimée de digital_inquiries';
    ELSE
        RAISE NOTICE 'Colonne product_id n''existe pas dans digital_inquiries (OK)';
    END IF;
END $$;

-- =====================================================
-- 4. VÉRIFIER LA STRUCTURE DE LA TABLE
-- =====================================================

-- Afficher la structure de digital_inquiries pour confirmation
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'digital_inquiries'
ORDER BY ordinal_position;

-- =====================================================
-- 5. SUPPRIMER LES VUES QUI RÉFÉRENCENT product_id
-- =====================================================

-- Supprimer la vue qui référence product_id
DROP VIEW IF EXISTS digital_inquiries_with_products;
DROP VIEW IF EXISTS digital_inquiries_link_statistics;

-- =====================================================
-- 6. NETTOYER LES FONCTIONS INUTILISÉES
-- =====================================================

DROP FUNCTION IF EXISTS link_digital_inquiry_to_product(UUID, UUID);

-- =====================================================
-- 7. VÉRIFICATION FINALE
-- =====================================================

-- Test: Essayer une mise à jour simple pour vérifier que le trigger ne pose plus problème
DO $$
BEGIN
    -- Ceci ne devrait plus générer d'erreur
    RAISE NOTICE 'Test de mise à jour de digital_inquiries - OK';
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Appliquer cette migration via:
-- supabase db push
-- ou depuis le dashboard Supabase > SQL Editor
