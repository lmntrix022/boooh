-- Migration: Fix revenue calculation to use price*quantity when payment_amount is NULL
-- Description: payment_amount is only set for Mobile Money payments; most orders have NULL.
--              Use product_price * quantity as fallback for accurate chiffre d'affaires.
-- Date: 2026-02-03

-- Update get_multi_card_order_stats to calculate revenue from price*quantity when payment_amount is NULL
CREATE OR REPLACE FUNCTION public.get_multi_card_order_stats(card_ids UUID[])
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue NUMERIC,
    physical_orders BIGINT,
    digital_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH physical_with_amount AS (
        SELECT 
            pi.id,
            'physical' as type,
            COALESCE(NULLIF(pi.payment_amount, 0), (COALESCE(p.price, 0) * COALESCE(pi.quantity, 1)))::NUMERIC as order_amount
        FROM product_inquiries pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE pi.card_id = ANY(card_ids)
    ),
    digital_with_amount AS (
        SELECT 
            di.id,
            'digital' as type,
            COALESCE(NULLIF(di.payment_amount, 0), (COALESCE(dp.price, 0) * COALESCE(di.quantity, 1)))::NUMERIC as order_amount
        FROM digital_inquiries di
        LEFT JOIN digital_products dp ON di.digital_product_id = dp.id
        WHERE di.card_id = ANY(card_ids)
    ),
    all_orders AS (
        SELECT type, order_amount FROM physical_with_amount
        UNION ALL
        SELECT type, order_amount FROM digital_with_amount
    )
    SELECT
        COUNT(*)::BIGINT as total_orders,
        COALESCE(SUM(order_amount), 0)::NUMERIC as total_revenue,
        COUNT(*) FILTER (WHERE type = 'physical')::BIGINT as physical_orders,
        COUNT(*) FILTER (WHERE type = 'digital')::BIGINT as digital_orders
    FROM all_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_multi_card_aggregations to use same revenue logic for per-card stats
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
            SUM(COALESCE(
            NULLIF(uo.payment_amount, 0)::NUMERIC,
            (COALESCE(uo.product_price, 0) * COALESCE(uo.quantity, 1))::NUMERIC
        )) as revenue
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

-- Grant permissions (idempotent)
GRANT EXECUTE ON FUNCTION public.get_multi_card_order_stats(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multi_card_order_stats(UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_multi_card_aggregations(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multi_card_aggregations(UUID[]) TO anon;
