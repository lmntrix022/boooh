-- Migration pour créer la fonction de validation de téléchargement
-- Date: 2025-10-17
-- Permet de valider les tokens de téléchargement pour les produits numériques

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.validate_download(TEXT);

-- Fonction pour valider un token de téléchargement
CREATE OR REPLACE FUNCTION public.validate_download(
    p_download_token TEXT
) RETURNS TABLE (
    is_valid BOOLEAN,
    file_url TEXT,
    product_title TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    error_message TEXT
) AS $$
DECLARE
    v_inquiry RECORD;
    v_product RECORD;
BEGIN
    -- Vérifier si le token existe dans digital_inquiries et est valide
    SELECT * INTO v_inquiry
    FROM public.digital_inquiries
    WHERE download_token = p_download_token
    AND (expires_at IS NULL OR expires_at > NOW())
    AND status != 'cancelled';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false, 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT,
            NULL::TEXT,
            'Token invalide ou expiré'::TEXT;
        RETURN;
    END IF;
    
    -- Récupérer les informations du produit digital
    SELECT * INTO v_product
    FROM public.digital_products
    WHERE id = v_inquiry.digital_product_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false, 
            NULL::TEXT, 
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            'Produit introuvable'::TEXT;
        RETURN;
    END IF;
    
    -- Mettre à jour la date de dernier accès (optionnel)
    UPDATE public.digital_inquiries
    SET updated_at = NOW()
    WHERE id = v_inquiry.id;
    
    -- Retourner les informations de téléchargement valides
    -- Caster tous les champs en TEXT pour éviter les conflits de type
    RETURN QUERY SELECT 
        true, 
        v_product.file_url::TEXT,
        v_product.title::TEXT,
        v_inquiry.client_email::TEXT,
        v_inquiry.client_name::TEXT,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION public.validate_download IS 
'Valide un token de téléchargement pour les produits numériques. Vérifie l''expiration et retourne les informations du produit.';

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.validate_download TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download TO anon;
