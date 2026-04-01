-- Guest checkout: finalize ecommerce inquiries without JWT (anon cannot UPDATE via RLS).
-- Verifies client_email matches and payment_status = 'pending' before updating.

CREATE OR REPLACE FUNCTION public.finalize_digital_inquiry_ecommerce_payment(
  p_inquiry_id UUID,
  p_client_email TEXT,
  p_payment_method TEXT,
  p_transaction_id TEXT,
  p_paid_at TIMESTAMPTZ,
  p_external_reference TEXT,
  p_payment_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row digital_inquiries%ROWTYPE;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  v_token := md5(random()::text || clock_timestamp()::text || random()::text)
    || md5(random()::text || clock_timestamp()::text || 'd');

  SELECT * INTO v_row
  FROM digital_inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inquiry not found');
  END IF;

  IF lower(trim(v_row.client_email)) <> lower(trim(COALESCE(p_client_email, ''))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  IF COALESCE(v_row.payment_status, '') <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment state');
  END IF;

  v_expires := COALESCE(p_paid_at, NOW()) + INTERVAL '24 hours';

  UPDATE digital_inquiries
  SET
    status = CASE
      WHEN COALESCE(p_payment_status, 'paid') IN ('paid', 'completed') THEN 'completed'
      ELSE 'pending'
    END,
    payment_status = COALESCE(NULLIF(p_payment_status, ''), 'paid'),
    payment_method = p_payment_method,
    transaction_id = NULLIF(p_transaction_id, ''),
    paid_at = COALESCE(p_paid_at, NOW()),
    external_reference = NULLIF(p_external_reference, ''),
    download_token = v_token,
    expires_at = v_expires,
    max_downloads = 3,
    download_count = COALESCE(download_count, 0)
  WHERE id = p_inquiry_id;

  RETURN jsonb_build_object('success', true, 'download_token', v_token, 'expires_at', v_expires);
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_product_inquiry_ecommerce_payment(
  p_inquiry_id UUID,
  p_client_email TEXT,
  p_payment_method TEXT,
  p_transaction_id TEXT,
  p_paid_at TIMESTAMPTZ,
  p_external_reference TEXT,
  p_payment_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row product_inquiries%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM product_inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inquiry not found');
  END IF;

  IF lower(trim(v_row.client_email)) <> lower(trim(COALESCE(p_client_email, ''))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  IF COALESCE(v_row.payment_status, '') <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment state');
  END IF;

  UPDATE product_inquiries
  SET
    status = CASE
      WHEN COALESCE(p_payment_status, 'paid') IN ('paid', 'completed') THEN 'confirmed'
      ELSE 'pending'
    END,
    payment_status = COALESCE(NULLIF(p_payment_status, ''), 'paid'),
    payment_method = p_payment_method,
    transaction_id = NULLIF(p_transaction_id, ''),
    paid_at = COALESCE(p_paid_at, NOW()),
    external_reference = NULLIF(p_external_reference, '')
  WHERE id = p_inquiry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_digital_inquiry_ecommerce_payment(
  UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_product_inquiry_ecommerce_payment(
  UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT
) TO anon, authenticated;
