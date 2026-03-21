-- Migration: Gestionnaire de devis Phase 1 - Top 1%
-- 1. Lignes de devis (quote_items)
-- 2. Numérotation automatique (quote_number)
-- 3. Token public pour consultation client (public_token)
-- 4. Support acceptation en ligne (accepted_at, rejection_reason)
-- Date: 2026-02-03

-- =====================================================
-- 1. TABLE: quote_items (Lignes de devis)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES service_quotes(id) ON DELETE CASCADE,
  
  -- Détails de la ligne
  title VARCHAR(500) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'unité',
  vat_rate DECIMAL(5, 2) DEFAULT 0,
  total_ht DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Ordre d'affichage
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- RLS
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quote items for their quotes"
ON quote_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM service_quotes sq
    WHERE sq.id = quote_items.quote_id AND sq.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_quotes sq
    WHERE sq.id = quote_items.quote_id AND sq.user_id = auth.uid()
  )
);

-- =====================================================
-- 2. COLONNES service_quotes
-- =====================================================
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS public_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS valid_until DATE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_service_quotes_public_token ON service_quotes(public_token) WHERE public_token IS NOT NULL;

-- =====================================================
-- 3. SÉQUENCE NUMÉRO DE DEVIS PAR USER
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_number_sequences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction: obtenir le prochain numéro de devis
CREATE OR REPLACE FUNCTION public.get_next_quote_number(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_year TEXT;
  v_num INTEGER;
  v_result VARCHAR(50);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  INSERT INTO quote_number_sequences (user_id, last_number, updated_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    last_number = quote_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_num;
  
  v_result := 'DEV-' || v_year || '-' || LPAD(v_num::TEXT, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: ON CONFLICT needs RETURNING to work correctly - use a different approach
DROP FUNCTION IF EXISTS public.get_next_quote_number(UUID);

CREATE OR REPLACE FUNCTION public.get_next_quote_number(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_year TEXT;
  v_num INTEGER;
  v_result VARCHAR(50);
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Upsert and get new number
  INSERT INTO quote_number_sequences (user_id, last_number, updated_at)
  VALUES (p_user_id, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE quote_number_sequences
  SET last_number = last_number + 1, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING last_number INTO v_num;
  
  v_result := 'DEV-' || v_year || '-' || LPAD(v_num::TEXT, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_next_quote_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_quote_number(UUID) TO service_role;

-- =====================================================
-- 4. FONCTION: Générer token public sécurisé
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_quote_public_token()
RETURNS TEXT AS $$
BEGIN
  -- Utilise md5+random (built-in) si pgcrypto non disponible
  RETURN substr(md5(random()::text || clock_timestamp()::text), 1, 48);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_quote_public_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_public_token() TO service_role;

-- =====================================================
-- 5. RLS: service_quotes (pas de SELECT anon direct - utilisation RPC)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own service quotes" ON service_quotes;
DROP POLICY IF EXISTS "Users can manage their service quotes" ON service_quotes;
CREATE POLICY "Users can manage their service quotes"
ON service_quotes FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Activer RLS si pas déjà fait
ALTER TABLE service_quotes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5b. FONCTION: Récupérer un devis par token public (anon)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_quote_by_public_token(p_token VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_quote JSONB;
  v_items JSONB;
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
  
  RETURN jsonb_build_object(
    'quote', v_quote,
    'items', v_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_quote_by_public_token(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.get_quote_by_public_token(VARCHAR) TO authenticated;

-- =====================================================
-- 6. FONCTION: Accepter/Refuser un devis (appelée par anon avec token)
-- =====================================================
CREATE OR REPLACE FUNCTION public.respond_quote_public(
  p_token VARCHAR,
  p_action TEXT,  -- 'accept' | 'reject'
  p_rejection_reason TEXT DEFAULT NULL
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

GRANT EXECUTE ON FUNCTION public.respond_quote_public(VARCHAR, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.respond_quote_public(VARCHAR, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 7. BACKFILL: Générer public_token pour devis existants
-- =====================================================
UPDATE service_quotes
SET public_token = substr(md5(id::text || random()::text || clock_timestamp()::text), 1, 48)
WHERE public_token IS NULL;

-- Backfill quote_number (via sous-requête)
UPDATE service_quotes sq
SET quote_number = 'DEV-' || EXTRACT(YEAR FROM sq.created_at)::TEXT || '-' || LPAD(sub.rn::TEXT, 4, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM service_quotes
  WHERE quote_number IS NULL
) sub
WHERE sq.id = sub.id;
