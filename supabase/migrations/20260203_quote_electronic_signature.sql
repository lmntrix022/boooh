-- Migration: Signatures électroniques sur acceptation devis
-- Date: 2026-02-03

-- Colonne pour stocker la signature client (base64 data URL)
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE;

-- Mettre à jour la fonction respond_quote_public pour accepter la signature
CREATE OR REPLACE FUNCTION public.respond_quote_public(
  p_token VARCHAR,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL,
  p_client_signature TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_quote service_quotes%ROWTYPE;
BEGIN
  IF p_action NOT IN ('accept', 'reject') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
  
  SELECT * INTO v_quote
  FROM service_quotes
  WHERE public_token = p_token
  AND status = 'quoted'
  LIMIT 1;
  
  IF v_quote.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found or not available');
  END IF;
  
  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote has expired');
  END IF;
  
  IF p_action = 'accept' THEN
    UPDATE service_quotes
    SET status = 'accepted',
        accepted_at = NOW(),
        rejection_reason = NULL,
        client_signature = NULLIF(TRIM(p_client_signature), ''),
        client_signed_at = CASE WHEN NULLIF(TRIM(p_client_signature), '') IS NOT NULL THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = v_quote.id;
    RETURN jsonb_build_object('success', true, 'status', 'accepted');
  ELSE
    UPDATE service_quotes
    SET status = 'refused',
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE id = v_quote.id;
    RETURN jsonb_build_object('success', true, 'status', 'refused');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.respond_quote_public(VARCHAR, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.respond_quote_public(VARCHAR, TEXT, TEXT, TEXT) TO authenticated;
