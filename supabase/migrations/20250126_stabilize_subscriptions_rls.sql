-- =====================================================
-- Migration: Stabilisation RLS pour subscriptions et tables liées
-- Date: 2025-01-26
-- Description: Politiques RLS définitives pour le système d'abonnements
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTIONS TABLE
-- =====================================================

-- Nettoyer les politiques existantes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subscriptions';
    END LOOP;
END $$;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT: Les utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "subscriptions_select_own"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Les utilisateurs peuvent créer leurs propres abonnements
CREATE POLICY "subscriptions_insert_own"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Les utilisateurs peuvent modifier leurs propres abonnements
CREATE POLICY "subscriptions_update_own"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Les abonnements ne sont généralement pas supprimés, mais si nécessaire:
-- Pas de politique DELETE = personne ne peut supprimer (protection des données)

-- =====================================================
-- 2. USER_ADDONS TABLE (si existe)
-- =====================================================

DO $$
DECLARE
    table_exists boolean;
    r RECORD;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_addons'
    ) INTO table_exists;

    IF table_exists THEN
        -- Nettoyer les politiques existantes
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_addons' AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_addons';
        END LOOP;

        ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "user_addons_select_own"
        ON public.user_addons
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());

        CREATE POLICY "user_addons_insert_own"
        ON public.user_addons
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "user_addons_update_own"
        ON public.user_addons
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "user_addons_delete_own"
        ON public.user_addons
        FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- =====================================================
-- 3. SUBSCRIPTION_PLANS TABLE (lecture seule pour tous)
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscription_plans' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subscription_plans';
    END LOOP;
END $$;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les plans
CREATE POLICY "subscription_plans_select_all"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- Pas de INSERT/UPDATE/DELETE = seul l'admin peut gérer via service_role

-- =====================================================
-- 4. VÉRIFICATION
-- =====================================================

SELECT 
    tablename as table_name,
    policyname,
    cmd,
    roles::text
FROM pg_policies
WHERE tablename IN ('subscriptions', 'user_addons', 'subscription_plans')
AND schemaname = 'public'
ORDER BY tablename, cmd, policyname;

COMMENT ON TABLE public.subscriptions IS 'RLS stabilized on 2025-01-26: Users can only access their own subscriptions';

