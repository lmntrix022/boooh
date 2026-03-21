-- =====================================================
-- Script de Vérification et Stabilisation RLS
-- Date: 2025-01-26
-- Objectif: Vérifier et stabiliser toutes les politiques RLS
-- =====================================================

-- =====================================================
-- PARTIE 1: FONCTION DE VÉRIFICATION RLS
-- =====================================================

CREATE OR REPLACE FUNCTION verify_rls_status()
RETURNS TABLE(
    table_name text,
    schema_name text,
    rls_enabled boolean,
    policy_count bigint,
    policies text[],
    issues text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_rec RECORD;
    policy_list text[];
    issues_list text[];
    has_select boolean;
    has_insert boolean;
    has_update boolean;
    has_delete boolean;
BEGIN
    -- Parcourir toutes les tables du schéma public avec RLS
    FOR table_rec IN
        SELECT 
            t.tablename,
            t.schemaname,
            t.rowsecurity as rls_enabled
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        AND EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.schemaname = t.schemaname 
            AND p.tablename = t.tablename
        )
    LOOP
        -- Réinitialiser les listes
        policy_list := ARRAY[]::text[];
        issues_list := ARRAY[]::text[];
        has_select := false;
        has_insert := false;
        has_update := false;
        has_delete := false;

        -- Collecter les politiques
        SELECT 
            array_agg(p.policyname ORDER BY p.policyname),
            bool_or(p.cmd = 'SELECT'),
            bool_or(p.cmd = 'INSERT'),
            bool_or(p.cmd = 'UPDATE'),
            bool_or(p.cmd = 'DELETE')
        INTO policy_list, has_select, has_insert, has_update, has_delete
        FROM pg_policies p
        WHERE p.schemaname = table_rec.schemaname
        AND p.tablename = table_rec.tablename;

        -- Vérifier les problèmes courants
        IF table_rec.rls_enabled AND policy_list IS NULL THEN
            issues_list := array_append(issues_list, 'RLS activé mais aucune politique définie');
        END IF;

        IF table_rec.rls_enabled AND NOT has_select THEN
            issues_list := array_append(issues_list, 'Pas de politique SELECT');
        END IF;

        -- Ne pas vérifier INSERT/UPDATE/DELETE car certaines tables peuvent être read-only

        -- Retourner le résultat
        RETURN QUERY SELECT
            table_rec.tablename::text,
            table_rec.schemaname::text,
            table_rec.rls_enabled,
            array_length(policy_list, 1)::bigint,
            policy_list,
            issues_list;
    END LOOP;

    -- Inclure aussi les tables avec RLS activé mais sans politiques visibles
    FOR table_rec IN
        SELECT 
            t.tablename,
            t.schemaname,
            t.rowsecurity as rls_enabled
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.schemaname = t.schemaname 
            AND p.tablename = t.tablename
        )
    LOOP
        RETURN QUERY SELECT
            table_rec.tablename::text,
            table_rec.schemaname::text,
            true,
            0::bigint,
            ARRAY[]::text[],
            ARRAY['RLS activé mais aucune politique visible']::text[];
    END LOOP;
END;
$$;

-- =====================================================
-- PARTIE 2: SCRIPT DE VÉRIFICATION (À EXÉCUTER)
-- =====================================================

-- Afficher l'état de toutes les tables avec RLS
SELECT * FROM verify_rls_status()
ORDER BY table_name;

-- Vérifier les tables sans RLS (potentiellement dangereux)
SELECT 
    tablename,
    schemaname,
    rowsecurity as rls_enabled,
    'ATTENTION: RLS désactivé' as warning
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- Compter les politiques par table
SELECT 
    schemaname,
    tablename,
    count(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- PARTIE 3: CORRECTIONS AUTOMATIQUES
-- =====================================================

-- Cette section contient les corrections pour les tables problématiques communes

-- Note: Les corrections spécifiques doivent être dans des migrations séparées
-- Ce fichier sert uniquement de diagnostic




