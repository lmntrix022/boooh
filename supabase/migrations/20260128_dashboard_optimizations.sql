-- Migration: Optimized Dashboard Aggregations
-- Description: RPC function to aggregate revenue and order counts for multiple cards efficiently
-- Date: 2026-01-28

-- Function to get aggregated order stats and revenue for multiple cards
CREATE OR REPLACE FUNCTION public.get_multi_card_order_stats(card_ids UUID[])
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue NUMERIC,
    physical_orders BIGINT,
    digital_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH all_orders AS (
        SELECT 
            'physical' as type,
            payment_amount
        FROM product_inquiries
        WHERE card_id = ANY(card_ids)
        
        UNION ALL
        
        SELECT 
            'digital' as type,
            payment_amount
        FROM digital_inquiries
        WHERE card_id = ANY(card_ids)
    )
    SELECT
        COUNT(*)::BIGINT as total_orders,
        COALESCE(SUM(payment_amount), 0)::NUMERIC as total_revenue,
        COUNT(*) FILTER (WHERE type = 'physical')::BIGINT as physical_orders,
        COUNT(*) FILTER (WHERE type = 'digital')::BIGINT as digital_orders
    FROM all_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get per-card order and appointment counts in bulk
CREATE OR REPLACE FUNCTION public.get_multi_card_aggregations(card_ids UUID[])
RETURNS TABLE (
    card_id UUID,
    order_count BIGINT,
    appointment_count BIGINT,
    revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH order_stats AS (
        SELECT 
            uo.card_id,
            COUNT(*) as order_count,
            SUM(uo.payment_amount) as revenue
        FROM unified_orders uo
        WHERE uo.card_id = ANY(card_ids)
        GROUP BY uo.card_id
    ),
    appointment_stats AS (
        SELECT 
            a.card_id,
            COUNT(*) as appointment_count
        FROM appointments a
        WHERE a.card_id = ANY(card_ids)
        GROUP BY a.card_id
    )
    SELECT 
        c.id as card_id,
        COALESCE(os.order_count, 0)::BIGINT as order_count,
        COALESCE(as_stats.appointment_count, 0)::BIGINT as appointment_count,
        COALESCE(os.revenue, 0)::NUMERIC as revenue
    FROM unnest(card_ids) c(id)
    LEFT JOIN order_stats os ON c.id = os.card_id
    LEFT JOIN appointment_stats as_stats ON c.id = as_stats.card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_multi_card_order_stats(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multi_card_order_stats(UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_multi_card_aggregations(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multi_card_aggregations(UUID[]) TO anon;
