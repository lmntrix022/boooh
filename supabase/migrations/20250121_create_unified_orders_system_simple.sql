-- Migration simplifiée pour créer le système de commandes unifié
-- Date: 2025-01-21
-- Version simplifiée pour éviter les erreurs de colonnes

-- =====================================================
-- 1. VUE UNIFIÉE SIMPLIFIÉE
-- =====================================================

-- Supprimer la vue si elle existe
DROP VIEW IF EXISTS unified_orders;

-- Créer la vue unifiée simplifiée
CREATE VIEW unified_orders AS
SELECT 
    -- Champs communs
    pi.id,
    'physical' as order_type,
    pi.card_id,
    pi.client_name,
    pi.client_email,
    pi.client_phone,
    pi.status,
    pi.payment_status,
    pi.payment_method,
    pi.payment_amount,
    pi.quantity,
    pi.created_at,
    pi.updated_at,
    pi.invoice_id,
    
    -- Champs spécifiques aux produits physiques
    pi.product_id,
    NULL as digital_product_id,
    NULL as download_token,
    NULL as expires_at,
    NULL as download_count,
    NULL as max_downloads,
    
    -- Informations du produit (via JOIN)
    p.name as product_name,
    p.price as product_price,
    p.description as product_description,
    p.image_url as product_image,
    p.category as product_category,
    
    -- Adresse de livraison (simplifiée)
    NULL as delivery_address,
    NULL as delivery_city,
    NULL as delivery_country,
    pi.client_phone as delivery_phone,
    
    -- Métadonnées
    'physical' as source_table,
    'Commande de produit physique' as order_description
FROM product_inquiries pi
LEFT JOIN products p ON pi.product_id = p.id

UNION ALL

SELECT 
    -- Champs communs
    di.id,
    'digital' as order_type,
    di.card_id,
    di.client_name,
    di.client_email,
    di.client_phone,
    di.status,
    di.payment_status,
    di.payment_method,
    di.payment_amount,
    di.quantity,
    di.created_at,
    di.updated_at,
    di.invoice_id,
    
    -- Champs spécifiques aux produits digitaux
    NULL as product_id,
    di.digital_product_id,
    di.download_token,
    di.expires_at,
    di.download_count,
    NULL as max_downloads,
    
    -- Informations du produit digital (via JOIN)
    dp.title as product_name,
    dp.price as product_price,
    dp.description as product_description,
    dp.thumbnail_url as product_image,
    dp.category as product_category,
    
    -- Pas d'adresse de livraison pour les produits digitaux
    NULL as delivery_address,
    NULL as delivery_city,
    NULL as delivery_country,
    NULL as delivery_phone,
    
    -- Métadonnées
    'digital' as source_table,
    'Commande de produit numérique' as order_description
FROM digital_inquiries di
LEFT JOIN digital_products dp ON di.digital_product_id = dp.id;

-- Commentaire sur la vue
COMMENT ON VIEW unified_orders IS
'Vue unifiée pour toutes les commandes (physiques et digitales) avec gestion hybride';

-- =====================================================
-- 2. FONCTION POUR METTRE À JOUR LE STATUT
-- =====================================================

-- Fonction unifiée pour mettre à jour le statut de n'importe quelle commande
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status VARCHAR,
    order_type VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    -- Mettre à jour selon le type de commande
    IF order_type = 'physical' THEN
        UPDATE product_inquiries 
        SET status = new_status, updated_at = NOW()
        WHERE id = order_id;
        
        -- Vérifier que la mise à jour a réussi
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Commande physique % non trouvée', order_id;
        END IF;
        
    ELSIF order_type = 'digital' THEN
        UPDATE digital_inquiries 
        SET status = new_status, updated_at = NOW()
        WHERE id = order_id;
        
        -- Vérifier que la mise à jour a réussi
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Commande digitale % non trouvée', order_id;
        END IF;
        
    ELSE
        RAISE EXCEPTION 'Type de commande invalide: %', order_type;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTION POUR RÉCUPÉRER LES COMMANDES
-- =====================================================

-- Fonction pour récupérer les commandes d'une carte avec filtres
CREATE OR REPLACE FUNCTION get_card_orders(
    card_id_param UUID,
    status_filter VARCHAR DEFAULT NULL,
    order_type_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    order_type VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    status VARCHAR,
    payment_status VARCHAR,
    product_name VARCHAR,
    quantity INTEGER,
    created_at TIMESTAMPTZ,
    order_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uo.id,
        uo.order_type,
        uo.client_name,
        uo.client_email,
        uo.status,
        uo.payment_status,
        uo.product_name,
        uo.quantity,
        uo.created_at,
        uo.order_description
    FROM unified_orders uo
    WHERE uo.card_id = card_id_param
    AND (status_filter IS NULL OR uo.status = status_filter)
    AND (order_type_filter IS NULL OR uo.order_type = order_type_filter)
    ORDER BY uo.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FONCTION POUR LES STATISTIQUES
-- =====================================================

-- Fonction pour les statistiques des commandes
CREATE OR REPLACE FUNCTION get_order_statistics(
    card_id_param UUID
) RETURNS TABLE (
    total_orders BIGINT,
    physical_orders BIGINT,
    digital_orders BIGINT,
    pending_orders BIGINT,
    processing_orders BIGINT,
    completed_orders BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE order_type = 'physical') as physical_orders,
        COUNT(*) FILTER (WHERE order_type = 'digital') as digital_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COALESCE(SUM(payment_amount), 0) as total_revenue
    FROM unified_orders
    WHERE card_id = card_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FONCTION POUR LA RECHERCHE
-- =====================================================

-- Fonction de recherche unifiée
CREATE OR REPLACE FUNCTION search_orders(
    card_id_param UUID,
    search_term VARCHAR,
    limit_count INTEGER DEFAULT 50
) RETURNS TABLE (
    id UUID,
    order_type VARCHAR,
    client_name VARCHAR,
    client_email VARCHAR,
    product_name VARCHAR,
    status VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uo.id,
        uo.order_type,
        uo.client_name,
        uo.client_email,
        uo.product_name,
        uo.status,
        uo.created_at
    FROM unified_orders uo
    WHERE uo.card_id = card_id_param
    AND (
        uo.client_name ILIKE '%' || search_term || '%'
        OR uo.client_email ILIKE '%' || search_term || '%'
        OR uo.product_name ILIKE '%' || search_term || '%'
    )
    ORDER BY uo.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- RLS pour la vue unifiée
ALTER VIEW unified_orders SET (security_invoker = true);

-- Politique RLS pour la vue
CREATE POLICY "Users can view their own unified orders"
ON unified_orders
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = unified_orders.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Pour appliquer cette migration:
-- supabase db push
-- ou depuis le dashboard Supabase > SQL Editor

