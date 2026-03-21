-- Migration pour ajouter la colonne product_id à digital_inquiries
-- Date: 2025-01-21
-- Problème: digital_inquiries n'a pas de colonne product_id, contrairement à product_inquiries
-- Solution: Ajouter la colonne product_id pour aligner les structures

-- =====================================================
-- 1. VÉRIFIER SI LA COLONNE EXISTE DÉJÀ
-- =====================================================

-- Vérifier si la colonne product_id existe déjà dans digital_inquiries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'digital_inquiries' 
        AND column_name = 'product_id'
    ) THEN
        -- Ajouter la colonne product_id
        ALTER TABLE digital_inquiries 
        ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
        
        -- Créer un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_digital_inquiries_product_id 
        ON digital_inquiries(product_id);
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN digital_inquiries.product_id IS 
        'Référence vers le produit associé à cette commande digitale';
        
        RAISE NOTICE 'Colonne product_id ajoutée à digital_inquiries';
    ELSE
        RAISE NOTICE 'Colonne product_id existe déjà dans digital_inquiries';
    END IF;
END $$;

-- =====================================================
-- 2. MIGRER LES DONNÉES EXISTANTES (SI NÉCESSAIRE)
-- =====================================================

-- Si des commandes digitales existent sans product_id, 
-- essayer de les lier aux produits digitaux correspondants
DO $$
DECLARE
    inquiry_record RECORD;
    digital_product_id UUID;
BEGIN
    -- Pour chaque commande digitale sans product_id
    FOR inquiry_record IN 
        SELECT id, client_email, created_at 
        FROM digital_inquiries 
        WHERE product_id IS NULL
    LOOP
        -- Essayer de trouver un produit digital correspondant
        -- Basé sur l'email du client et la date de création
        SELECT dp.id INTO digital_product_id
        FROM digital_products dp
        JOIN business_cards bc ON dp.card_id = bc.id
        WHERE bc.id = (
            SELECT card_id FROM digital_inquiries WHERE id = inquiry_record.id
        )
        ORDER BY dp.created_at DESC
        LIMIT 1;
        
        -- Si un produit digital est trouvé, l'associer
        IF digital_product_id IS NOT NULL THEN
            UPDATE digital_inquiries 
            SET product_id = digital_product_id 
            WHERE id = inquiry_record.id;
            
            RAISE NOTICE 'Commande digitale % liée au produit %', 
                inquiry_record.id, digital_product_id;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 3. AJOUTER UNE CONTRAINTE DE VÉRIFICATION
-- =====================================================

-- Ajouter une contrainte pour s'assurer que product_id pointe vers un produit valide
-- (Cette contrainte est déjà gérée par la clé étrangère, mais on peut ajouter des vérifications)

-- =====================================================
-- 4. CRÉER UNE VUE POUR LES COMMANDES AVEC PRODUITS
-- =====================================================

-- Vue pour récupérer les commandes digitales avec les informations du produit
CREATE OR REPLACE VIEW digital_inquiries_with_products AS
SELECT 
    di.*,
    p.name as product_name,
    p.price as product_price,
    p.description as product_description,
    p.image_url as product_image,
    dp.title as digital_product_title,
    dp.type as digital_product_type,
    dp.file_url as digital_file_url
FROM digital_inquiries di
LEFT JOIN products p ON di.product_id = p.id
LEFT JOIN digital_products dp ON di.product_id = dp.id
ORDER BY di.created_at DESC;

COMMENT ON VIEW digital_inquiries_with_products IS
'Vue des commandes digitales avec les informations des produits associés';

-- =====================================================
-- 5. FONCTION POUR LIER AUTOMATIQUEMENT LES PRODUITS
-- =====================================================

-- Fonction pour lier automatiquement une commande digitale à un produit
CREATE OR REPLACE FUNCTION link_digital_inquiry_to_product(
    inquiry_id UUID,
    product_id_param UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que la commande existe
    IF NOT EXISTS (SELECT 1 FROM digital_inquiries WHERE id = inquiry_id) THEN
        RAISE EXCEPTION 'Commande digitale % non trouvée', inquiry_id;
    END IF;
    
    -- Vérifier que le produit existe
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = product_id_param) THEN
        RAISE EXCEPTION 'Produit % non trouvé', product_id_param;
    END IF;
    
    -- Lier la commande au produit
    UPDATE digital_inquiries 
    SET product_id = product_id_param 
    WHERE id = inquiry_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER POUR VALIDER LES LIENS
-- =====================================================

-- Fonction trigger pour valider les liens product_id
CREATE OR REPLACE FUNCTION validate_digital_inquiry_product_link()
RETURNS TRIGGER AS $$
BEGIN
    -- Si product_id est fourni, vérifier qu'il existe
    IF NEW.product_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id) THEN
            RAISE EXCEPTION 'Produit % non trouvé', NEW.product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_validate_digital_inquiry_product_link ON digital_inquiries;
CREATE TRIGGER trigger_validate_digital_inquiry_product_link
    BEFORE INSERT OR UPDATE OF product_id ON digital_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION validate_digital_inquiry_product_link();

-- =====================================================
-- 7. STATISTIQUES DES LIENS
-- =====================================================

-- Vue pour les statistiques des liens product_id
CREATE OR REPLACE VIEW digital_inquiries_link_statistics AS
SELECT 
    COUNT(*) as total_inquiries,
    COUNT(product_id) as linked_inquiries,
    COUNT(*) - COUNT(product_id) as unlinked_inquiries,
    ROUND(COUNT(product_id) * 100.0 / COUNT(*), 2) as link_percentage
FROM digital_inquiries;

COMMENT ON VIEW digital_inquiries_link_statistics IS
'Statistiques des liens entre commandes digitales et produits';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Pour appliquer cette migration:
-- supabase db push
-- ou depuis le dashboard Supabase > SQL Editor

