-- Migration: Améliorations module devis
-- 1. Unification des champs de date (valid_until comme source unique)
-- 2. Métriques temps de réponse et délai de décision
-- Date: 2026-02-03

-- =====================================================
-- 1. UNIFICATION DES DATES DE VALIDITÉ
-- Backfill valid_until depuis quote_expires_at si null
-- =====================================================
UPDATE service_quotes
SET valid_until = (quote_expires_at AT TIME ZONE 'UTC')::DATE
WHERE valid_until IS NULL
  AND quote_expires_at IS NOT NULL;

-- Commenter quote_expires_at comme déprécié (on garde la colonne pour compatibilité, mais valid_until est la source)
COMMENT ON COLUMN service_quotes.quote_expires_at IS 'DEPRECATED: Use valid_until instead. Kept for backward compatibility.';

-- =====================================================
-- 2. MÉTRIQUES - Extension get_quote_conversion_stats
-- avg_response_hours: temps moyen création → envoi du devis (status quoted)
-- avg_decision_hours: temps moyen consultation → acceptation/refus
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_quote_conversion_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_avg_response NUMERIC;
  v_avg_decision NUMERIC;
BEGIN
  -- Temps moyen de réponse (création → premier passage en quoted)
  SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(quote_sent_at, updated_at) - created_at)) / 3600)
  INTO v_avg_response
  FROM service_quotes
  WHERE user_id = p_user_id
    AND status IN ('quoted', 'accepted', 'refused');

  -- Temps moyen de décision client (consultation → acceptation/refus)
  SELECT AVG(
    EXTRACT(EPOCH FROM (
      CASE
        WHEN status = 'accepted' THEN accepted_at
        ELSE updated_at
      END
      - COALESCE(viewed_at, quote_sent_at, updated_at, created_at)
    )) / 3600
  )
  INTO v_avg_decision
  FROM service_quotes
  WHERE user_id = p_user_id
    AND status IN ('accepted', 'refused')
    AND (
      (status = 'accepted' AND accepted_at IS NOT NULL)
      OR (status = 'refused')
    );

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
    'avg_response_hours', ROUND(COALESCE(v_avg_response, 0)::NUMERIC, 1),
    'avg_decision_hours', ROUND(COALESCE(v_avg_decision, 0)::NUMERIC, 1),
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
