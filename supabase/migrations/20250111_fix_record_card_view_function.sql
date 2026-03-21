-- Migration pour corriger la fonction record_card_view
-- Date: 2025-01-11
-- Problème: La fonction acceptait seulement card_uuid mais était appelée avec 4 paramètres
-- Solution: Mettre à jour la signature pour accepter tous les paramètres nécessaires

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.record_card_view(UUID);

-- Créer la nouvelle fonction avec tous les paramètres
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
    END;

    -- Générer un visitor_id anonyme basé sur IP + User-Agent (comme côté client)
    -- Utiliser MD5 pour hacher (SHA256 n'est pas disponible en plpgsql de base)
    BEGIN
        visitor_hash := MD5(COALESCE(viewer_ip_param, 'unknown') || '-' || COALESCE(user_agent_param, 'unknown'));
    EXCEPTION WHEN OTHERS THEN
        visitor_hash := NULL;
    END;

    -- Insérer une nouvelle vue
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

    -- Log pour debug (peut être supprimé en production)
    RAISE NOTICE 'Vue enregistrée pour la carte % depuis IP % (visitor: %)', card_uuid, viewer_ip_param, visitor_hash;

EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on ne bloque pas
    RAISE WARNING 'Erreur lors de l''enregistrement de la vue: %', SQLERRM;
END;
$$;

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) IS
'Enregistre une vue de carte avec IP, user agent et referrer.
Utilisée par PublicCardView pour tracker les consultations de cartes.';

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_card_view(UUID, TEXT, TEXT, TEXT) TO authenticated;
