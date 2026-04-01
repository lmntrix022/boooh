-- Migration: Public quote creation via RPC (anon-safe)
-- Goal: allow visitors (anon) to create a quote request WITHOUT opening service_quotes RLS.
-- Date: 2026-04-01

-- =====================================================
-- 1) RPC: create a public quote request (anon)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_public_service_quote(
  p_card_id UUID,
  p_client_name VARCHAR,
  p_client_email VARCHAR,
  p_service_requested TEXT,
  p_project_id UUID DEFAULT NULL,
  p_client_phone VARCHAR DEFAULT NULL,
  p_client_company VARCHAR DEFAULT NULL,
  p_project_description TEXT DEFAULT NULL,
  p_budget_range VARCHAR DEFAULT NULL,
  p_urgency VARCHAR DEFAULT NULL,
  p_preferred_start_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_public_token TEXT;
  v_quote service_quotes%ROWTYPE;
BEGIN
  -- Validate card and resolve owner (do NOT trust caller-provided user_id)
  SELECT bc.user_id INTO v_owner_id
  FROM business_cards bc
  WHERE bc.id = p_card_id
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found');
  END IF;

  -- If project_id is provided, ensure it belongs to same owner (and optionally same card)
  IF p_project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM portfolio_projects pp
      WHERE pp.id = p_project_id
        AND pp.user_id = v_owner_id
        AND (pp.card_id IS NULL OR pp.card_id = p_card_id)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid project');
    END IF;
  END IF;

  -- Token generation (prefer existing RPC if present)
  BEGIN
    v_public_token := public.generate_quote_public_token();
  EXCEPTION WHEN undefined_function THEN
    v_public_token := substr(md5(random()::text || clock_timestamp()::text), 1, 48);
  END;

  -- Insert quote request
  INSERT INTO service_quotes (
    user_id,
    card_id,
    project_id,
    client_name,
    client_email,
    client_phone,
    client_company,
    service_requested,
    project_description,
    budget_range,
    urgency,
    preferred_start_date,
    status,
    priority,
    public_token
  )
  VALUES (
    v_owner_id,
    p_card_id,
    p_project_id,
    COALESCE(p_client_name, ''),
    COALESCE(p_client_email, ''),
    NULLIF(p_client_phone, ''),
    NULLIF(p_client_company, ''),
    COALESCE(p_service_requested, ''),
    NULLIF(p_project_description, ''),
    NULLIF(p_budget_range, ''),
    NULLIF(p_urgency, ''),
    p_preferred_start_date,
    'new',
    'normal',
    v_public_token
  )
  RETURNING * INTO v_quote;

  -- Return shape that is robust for frontend
  RETURN jsonb_build_object('success', true, 'quote', to_jsonb(v_quote));
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_service_quote(
  UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, DATE
) TO anon;

GRANT EXECUTE ON FUNCTION public.create_public_service_quote(
  UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, DATE
) TO authenticated;

