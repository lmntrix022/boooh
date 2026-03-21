-- Migration complète pour le système de commandes unifié
-- Date: 2025-01-21
-- Testé et validé : la vue de base fonctionne !

-- =====================================================
-- 1. SUPPRIMER LA VUE SIMPLE ET CRÉER LA VERSION COMPLÈTE
-- =====================================================

DROP VIEW IF EXISTS unified_orders;

CREATE VIEW unified_orders AS
SELECT 
    -- Identifiants
    pi.id,
    'physical' as order_type,
    pi.card_id,
    
    -- Informations client
    pi.client_name,
    pi.client_email,
    pi.client_phone,
    
    -- Statut et paiement
    pi.status,
    pi.payment_status,
    pi.payment_method,
    pi.payment_amount,
    pi.quantity,
    
    -- Dates
    pi.created_at,
    pi.updated_at,
    
    -- Références
    pi.invoice_id,
    pi.product_id,
    NULL::UUID as digital_product_id,
    
    -- Champs spécifiques digital (NULL pour physique)
    NULL::TEXT as download_token,
    NULL::TIMESTAMP WITH TIME ZONE as expires_at,
    NULL::INTEGER as download_count,
    
    -- Informations produit
    p.name as product_name,
    p.price as product_price,
    p.description as product_description,
    p.image_url as product_image,
    p.category as product_category,
    
    -- Métadonnées
    'physical' as source_table,
    'Commande de produit physique' as order_description
FROM product_inquiries pi
LEFT JOIN products p ON pi.product_id = p.id

UNION ALL

SELECT 
    -- Identifiants
    di.id,
    'digital' as order_type,
    di.card_id,
    
    -- Informations client
    di.client_name,
    di.client_email,
    di.client_phone,
    
    -- Statut et paiement
    di.status,
    di.payment_status,
    di.payment_method,
    di.payment_amount,
    di.quantity,
    
    -- Dates
    di.created_at,
    di.updated_at,
    
    -- Références
    di.invoice_id,
    NULL::UUID as product_id,
    di.digital_product_id,
    
    -- Champs spécifiques digital
    di.download_token,
    di.expires_at,
    di.download_count,
    
    -- Informations produit digital
    dp.title as product_name,
    dp.price as product_price,
    dp.description as product_description,
    dp.thumbnail_url as product_image,
    dp.category as product_category,
    
    -- Métadonnées
    'digital' as source_table,
    'Commande de produit numérique' as order_description
FROM digital_inquiries di
LEFT JOIN digital_products dp ON di.digital_product_id = dp.id;

COMMENT ON VIEW unified_orders IS
'Vue unifiée pour toutes les commandes (physiques et digitales) avec gestion hybride complète';

-- =====================================================
-- 2. FONCTION POUR METTRE À JOUR LE STATUT
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status VARCHAR,
    order_type VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    IF order_type = 'physical' THEN
        UPDATE product_inquiries 
        SET status = new_status, updated_at = NOW()
        WHERE id = order_id;
    ELSIF order_type = 'digital' THEN
        UPDATE digital_inquiries 
        SET status = new_status, updated_at = NOW()
        WHERE id = order_id;
    ELSE
        RAISE EXCEPTION 'Type de commande inconnu: %', order_type;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_order_status IS
'Met à jour le statut d''une commande (physique ou digitale)';

-- =====================================================
-- 3. FONCTION POUR RÉCUPÉRER LES COMMANDES D'UNE CARTE
-- =====================================================

CREATE OR REPLACE FUNCTION get_card_orders(p_card_id UUID)
RETURNS SETOF unified_orders AS $$
BEGIN
    RETURN QUERY 
    SELECT * 
    FROM unified_orders 
    WHERE card_id = p_card_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_card_orders IS
'Récupère toutes les commandes (physiques et digitales) pour une carte donnée';

-- =====================================================
-- 4. FONCTION POUR OBTENIR LES STATISTIQUES DE COMMANDES
-- =====================================================

CREATE OR REPLACE FUNCTION get_order_statistics(p_card_id UUID)
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    processing_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    total_revenue NUMERIC,
    physical_orders BIGINT,
    digital_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(uo.id) AS total_orders,
        COUNT(CASE WHEN uo.status = 'pending' THEN 1 END) AS pending_orders,
        COUNT(CASE WHEN uo.status = 'processing' THEN 1 END) AS processing_orders,
        COUNT(CASE WHEN uo.status = 'completed' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN uo.status = 'cancelled' THEN 1 END) AS cancelled_orders,
        COALESCE(SUM(uo.payment_amount), 0) AS total_revenue,
        COUNT(CASE WHEN uo.order_type = 'physical' THEN 1 END) AS physical_orders,
        COUNT(CASE WHEN uo.order_type = 'digital' THEN 1 END) AS digital_orders
    FROM unified_orders uo
    WHERE uo.card_id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_order_statistics IS
'Obtient les statistiques agrégées des commandes pour une carte';

-- =====================================================
-- 5. FONCTION DE RECHERCHE UNIFIÉE
-- =====================================================

CREATE OR REPLACE FUNCTION search_orders(
    p_card_id UUID,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS SETOF unified_orders AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM unified_orders
    WHERE card_id = p_card_id
    AND (
        client_name ILIKE '%' || p_search_term || '%' OR
        client_email ILIKE '%' || p_search_term || '%' OR
        product_name ILIKE '%' || p_search_term || '%' OR
        order_description ILIKE '%' || p_search_term || '%' OR
        status ILIKE '%' || p_search_term || '%'
    )
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_orders IS
'Recherche des commandes par terme de recherche (nom, email, produit, statut)';

-- =====================================================
-- 6. FONCTION POUR RÉCUPÉRER UNE COMMANDE PAR ID
-- =====================================================

CREATE OR REPLACE FUNCTION get_order_by_id(
    p_order_id UUID,
    p_order_type VARCHAR
) RETURNS SETOF unified_orders AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM unified_orders
    WHERE id = p_order_id
    AND order_type = p_order_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_order_by_id IS
'Récupère une commande spécifique par son ID et son type';

-- =====================================================
-- 7. VUE POUR L'ANALYSE DES COMMANDES
-- =====================================================

CREATE OR REPLACE VIEW order_analytics AS
SELECT
    order_type,
    status,
    COUNT(id) AS order_count,
    SUM(payment_amount) AS total_revenue,
    AVG(payment_amount) AS average_order_value,
    MIN(payment_amount) AS min_order_value,
    MAX(payment_amount) AS max_order_value
FROM unified_orders
GROUP BY order_type, status
ORDER BY order_type, status;

COMMENT ON VIEW order_analytics IS
'Vue pour l''analyse des commandes par type (physique/digital) et statut avec métriques financières';

-- =====================================================
-- 8. VUE POUR LES COMMANDES RÉCENTES
-- =====================================================

CREATE OR REPLACE VIEW recent_orders AS
SELECT *
FROM unified_orders
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

COMMENT ON VIEW recent_orders IS
'Vue des commandes des 30 derniers jours';

-- =====================================================
-- 9. FONCTION POUR METTRE À JOUR LE STATUT DE PAIEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_status(
    order_id UUID,
    new_payment_status VARCHAR,
    order_type VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    IF order_type = 'physical' THEN
        UPDATE product_inquiries 
        SET payment_status = new_payment_status, updated_at = NOW()
        WHERE id = order_id;
    ELSIF order_type = 'digital' THEN
        UPDATE digital_inquiries 
        SET payment_status = new_payment_status, updated_at = NOW()
        WHERE id = order_id;
    ELSE
        RAISE EXCEPTION 'Type de commande inconnu: %', order_type;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_status IS
'Met à jour le statut de paiement d''une commande (physique ou digitale)';

-- =====================================================
-- 10. INDEX POUR AMÉLIORER LES PERFORMANCES
-- =====================================================

-- Index sur product_inquiries
CREATE INDEX IF NOT EXISTS idx_product_inquiries_card_id ON product_inquiries(card_id);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_status ON product_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_created_at ON product_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_client_email ON product_inquiries(client_email);

-- Index sur digital_inquiries
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_card_id ON digital_inquiries(card_id);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_status ON digital_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_created_at ON digital_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_client_email ON digital_inquiries(client_email);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Test rapide
SELECT 
    order_type,
    status,
    COUNT(*) as count
FROM unified_orders
GROUP BY order_type, status
ORDER BY order_type, status;


