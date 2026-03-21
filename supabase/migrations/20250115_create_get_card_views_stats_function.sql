-- Migration: Create RPC function to get card views statistics without pagination limits
-- This function aggregates views directly in the database, bypassing PostgREST pagination

-- Function to get total views and shares for multiple cards
CREATE OR REPLACE FUNCTION public.get_card_views_stats(card_ids UUID[])
RETURNS TABLE (
  total_views BIGINT,
  total_shares BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cv.count), 0)::BIGINT as total_views,
    COALESCE(SUM(CASE WHEN cv.referrer IS NOT NULL THEN cv.count ELSE 0 END), 0)::BIGINT as total_shares
  FROM card_views cv
  WHERE cv.card_id = ANY(card_ids);
END;
$$;

-- Function to get per-card view counts
CREATE OR REPLACE FUNCTION public.get_per_card_view_counts(card_ids UUID[])
RETURNS TABLE (
  card_id UUID,
  view_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cv.card_id,
    COALESCE(SUM(cv.count), 0)::BIGINT as view_count
  FROM card_views cv
  WHERE cv.card_id = ANY(card_ids)
  GROUP BY cv.card_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_card_views_stats(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_card_views_stats(UUID[]) TO anon;

GRANT EXECUTE ON FUNCTION public.get_per_card_view_counts(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_per_card_view_counts(UUID[]) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_card_views_stats(UUID[]) IS
'Aggregates total views and shares for multiple cards. Bypasses PostgREST pagination limits by doing server-side aggregation.';

COMMENT ON FUNCTION public.get_per_card_view_counts(UUID[]) IS
'Returns view counts per card. Used for per-card statistics in dashboard.';
