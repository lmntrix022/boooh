-- Migration: Gestionnaire de devis Phase 2 - Top 1%
-- 1. Templates de devis réutilisables (quote_templates + quote_template_items)
-- 2. Suivi des relances (last_reminder_sent_at sur service_quotes)
-- 3. RPC pour stats conversion (motifs de refus)
-- Date: 2026-02-03

-- =====================================================
-- 1. TABLE: quote_templates (Modèles de devis)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Métadonnées
  is_default BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quote_templates_user_id ON quote_templates(user_id);

-- RLS
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quote templates"
ON quote_templates FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 2. TABLE: quote_template_items (Lignes des modèles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_template_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES quote_templates(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'unité',
  vat_rate DECIMAL(5, 2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quote_template_items_template_id ON quote_template_items(template_id);

ALTER TABLE quote_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage template items for their templates"
ON quote_template_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quote_templates qt
    WHERE qt.id = quote_template_items.template_id AND qt.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quote_templates qt
    WHERE qt.id = quote_template_items.template_id AND qt.user_id = auth.uid()
  )
);

-- =====================================================
-- 3. COLONNE: last_reminder_sent_at sur service_quotes
-- =====================================================
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 4. FONCTION: Stats conversion devis (pour dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_quote_conversion_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'new', COUNT(*) FILTER (WHERE status = 'new'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'quoted', COUNT(*) FILTER (WHERE status = 'quoted'),
    'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
    'refused', COUNT(*) FILTER (WHERE status = 'refused'),
    'closed', COUNT(*) FILTER (WHERE status = 'closed'),
    'conversion_rate', CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('quoted', 'accepted', 'refused')) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / 
         COUNT(*) FILTER (WHERE status IN ('quoted', 'accepted', 'refused'))::NUMERIC) * 100, 
        1
      )
      ELSE 0 
    END,
    'refusal_reasons', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('reason', reason, 'count', cnt))
       FROM (
         SELECT rejection_reason as reason, COUNT(*)::int as cnt
         FROM service_quotes
         WHERE user_id = p_user_id AND status = 'refused' AND rejection_reason IS NOT NULL AND rejection_reason != ''
         GROUP BY rejection_reason
       ) sub),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM service_quotes
  WHERE user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_quote_conversion_stats(UUID) TO authenticated;
