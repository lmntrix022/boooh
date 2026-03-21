-- Migration: Étendre get_quote_by_public_token pour inclure les infos carte (PDF)
-- Permet le téléchargement PDF depuis la page publique du devis
-- Date: 2026-02-03

CREATE OR REPLACE FUNCTION public.get_quote_by_public_token(p_token VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_quote JSONB;
  v_items JSONB;
  v_card JSONB;
  v_brand_color TEXT;
  v_card_id UUID;
BEGIN
  SELECT to_jsonb(sq.*) INTO v_quote
  FROM service_quotes sq
  WHERE sq.public_token = p_token
  LIMIT 1;
  
  IF v_quote IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Marquer comme consulté
  UPDATE service_quotes SET viewed_at = NOW() WHERE public_token = p_token;
  
  -- Récupérer les lignes
  SELECT COALESCE(jsonb_agg(to_jsonb(qi.*) ORDER BY qi.order_index, qi.created_at), '[]'::jsonb) INTO v_items
  FROM quote_items qi
  WHERE qi.quote_id = (v_quote->>'id')::UUID;
  
  -- Récupérer la carte (card_id ou première carte du user)
  v_card_id := (v_quote->>'card_id')::UUID;
  IF v_card_id IS NULL THEN
    SELECT bc.id INTO v_card_id
    FROM business_cards bc
    WHERE bc.user_id = (v_quote->>'user_id')::UUID
    LIMIT 1;
  END IF;
  
  IF v_card_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'name', bc.name,
      'email', bc.email,
      'phone', bc.phone,
      'address', bc.address,
      'company', bc.company,
      'company_logo_url', bc.company_logo_url
    ) INTO v_card
    FROM business_cards bc
    WHERE bc.id = v_card_id;
    
    SELECT ps.brand_color INTO v_brand_color
    FROM portfolio_settings ps
    WHERE ps.card_id = v_card_id
    LIMIT 1;
  END IF;
  
  -- Récupérer les paramètres facture (infos entreprise complètes : SIRET, adresse, etc.)
  RETURN jsonb_build_object(
    'quote', v_quote,
    'items', COALESCE(v_items, '[]'::jsonb),
    'card', COALESCE(v_card, '{}'::jsonb),
    'brandColor', COALESCE(v_brand_color, '#8B5CF6'),
    'company', COALESCE(
      (SELECT jsonb_build_object(
        'company_name', ins.company_name,
        'company_siret', ins.company_siret,
        'company_address', ins.company_address,
        'company_phone', ins.company_phone,
        'company_email', ins.company_email,
        'company_website', ins.company_website,
        'logo_url', ins.logo_url
      )
      FROM invoice_settings ins
      WHERE ins.user_id = (v_quote->>'user_id')::UUID
      LIMIT 1),
      '{}'::jsonb
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
