-- Script de diagnostic pour identifier les triggers sur digital_inquiries
-- Exécuter ce script dans Supabase SQL Editor pour voir tous les triggers

-- =====================================================
-- 1. LISTER TOUS LES TRIGGERS SUR digital_inquiries
-- =====================================================

SELECT
    tgname as trigger_name,
    tgtype,
    tgenabled,
    proname as function_name,
    pg_get_triggerdef(pg_trigger.oid) as trigger_definition
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE pg_class.relname = 'digital_inquiries'
ORDER BY tgname;

-- =====================================================
-- 2. VOIR LA DÉFINITION COMPLÈTE DES FONCTIONS TRIGGER
-- =====================================================

SELECT
    proname as function_name,
    pg_get_functiondef(pg_proc.oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%digital_inquiry%' OR proname LIKE '%product_id%'
ORDER BY proname;

-- =====================================================
-- 3. VÉRIFIER LES COLONNES DE digital_inquiries
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'digital_inquiries'
ORDER BY ordinal_position;
