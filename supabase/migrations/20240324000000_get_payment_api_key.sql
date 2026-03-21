-- Function to safely get payment API key for a user (organizer)
-- Used by the ticketing service to initiate payments on behalf of the organizer
CREATE OR REPLACE FUNCTION get_payment_api_key(organizer_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_text TEXT;
BEGIN
  SELECT api_key INTO key_text
  FROM boohpay_merchants
  WHERE user_id = organizer_user_id;
  
  RETURN key_text;
END;
$$;

GRANT EXECUTE ON FUNCTION get_payment_api_key(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_api_key(UUID) TO anon;
