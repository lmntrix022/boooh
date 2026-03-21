-- Migration pour corriger les contraintes de statut sur digital_inquiries
-- Date: 2025-01-21
-- Problème: Contrainte digital_inquiries_status_check empêche les changements de statut
-- Solution: Aligner les statuts avec ceux utilisés dans l'interface

-- =====================================================
-- 1. SUPPRIMER L'ANCIENNE CONTRAINTE SI ELLE EXISTE
-- =====================================================

-- Supprimer l'ancienne contrainte de statut si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'digital_inquiries_status_check'
        AND conrelid = 'digital_inquiries'::regclass
    ) THEN
        ALTER TABLE digital_inquiries DROP CONSTRAINT digital_inquiries_status_check;
    END IF;
END $$;

-- =====================================================
-- 2. AJOUTER LA NOUVELLE CONTRAINTE ALIGNÉE
-- =====================================================

-- Ajouter la nouvelle contrainte avec les statuts utilisés dans l'interface
ALTER TABLE digital_inquiries 
ADD CONSTRAINT digital_inquiries_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'));

-- =====================================================
-- 3. VÉRIFIER ET CORRIGER LES DONNÉES EXISTANTES
-- =====================================================

-- Mettre à jour les statuts invalides vers des statuts valides
UPDATE digital_inquiries 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'processing', 'completed', 'cancelled');

-- =====================================================
-- 4. AJOUTER UNE CONTRAINTE SIMILAIRE POUR product_inquiries
-- =====================================================

-- S'assurer que product_inquiries a la même contrainte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_inquiries_status_check'
        AND conrelid = 'product_inquiries'::regclass
    ) THEN
        ALTER TABLE product_inquiries 
        ADD CONSTRAINT product_inquiries_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'));
    END IF;
END $$;

-- =====================================================
-- 5. COMMENTAIRES POUR LA DOCUMENTATION
-- =====================================================

COMMENT ON CONSTRAINT digital_inquiries_status_check ON digital_inquiries IS
'Contrainte de vérification pour les statuts de commandes digitales: pending, processing, completed, cancelled';

COMMENT ON CONSTRAINT product_inquiries_status_check ON product_inquiries IS
'Contrainte de vérification pour les statuts de commandes physiques: pending, processing, completed, cancelled';

-- =====================================================
-- 6. FONCTION POUR VALIDER LES TRANSITIONS DE STATUT
-- =====================================================

-- Fonction pour valider les transitions de statut
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Transitions autorisées
    CASE old_status
        WHEN 'pending' THEN
            RETURN new_status IN ('processing', 'completed', 'cancelled');
        WHEN 'processing' THEN
            RETURN new_status IN ('completed', 'cancelled');
        WHEN 'completed' THEN
            RETURN new_status IN ('cancelled'); -- Seul l'annulation est possible
        WHEN 'cancelled' THEN
            RETURN new_status IN ('pending'); -- Réactivation possible
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGER POUR VALIDER LES TRANSITIONS
-- =====================================================

-- Fonction trigger pour valider les transitions
CREATE OR REPLACE FUNCTION check_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Vérifier que la transition est autorisée
        IF NOT validate_status_transition(OLD.status, NEW.status) THEN
            RAISE EXCEPTION 'Transition de statut non autorisée: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour digital_inquiries
DROP TRIGGER IF EXISTS trigger_check_digital_status_transition ON digital_inquiries;
CREATE TRIGGER trigger_check_digital_status_transition
    BEFORE UPDATE OF status ON digital_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION check_status_transition();

-- Créer les triggers pour product_inquiries
DROP TRIGGER IF EXISTS trigger_check_product_status_transition ON product_inquiries;
CREATE TRIGGER trigger_check_product_status_transition
    BEFORE UPDATE OF status ON product_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION check_status_transition();

-- =====================================================
-- 8. VUE POUR LES STATISTIQUES DE STATUT
-- =====================================================

-- Vue pour les statistiques de statut
CREATE OR REPLACE VIEW order_status_statistics AS
SELECT 
    'digital_inquiries' AS table_name,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM digital_inquiries 
GROUP BY status

UNION ALL

SELECT 
    'product_inquiries' AS table_name,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM product_inquiries 
GROUP BY status
ORDER BY table_name, status;

COMMENT ON VIEW order_status_statistics IS
'Statistiques des statuts de commandes par table';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Pour appliquer cette migration:
-- supabase db push
-- ou depuis le dashboard Supabase > SQL Editor

