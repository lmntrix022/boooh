-- =====================================================
-- Migration: Stabilisation RLS pour business_cards
-- Date: 2025-01-26
-- Description: Politiques RLS définitives et sécurisées pour business_cards
-- =====================================================

-- Étape 1: Nettoyer toutes les anciennes politiques
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_cards' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.business_cards';
    END LOOP;
END $$;

-- Étape 2: S'assurer que RLS est activé
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Étape 3: Créer les politiques stabilisées

-- SELECT: Utilisateurs peuvent voir leurs propres cartes OU les cartes publiques
CREATE POLICY "business_cards_select_own_or_public"
ON public.business_cards
FOR SELECT
TO authenticated, anon
USING (
    -- Le propriétaire peut voir sa carte
    user_id = auth.uid() OR
    -- Les cartes publiques sont visibles par tous
    is_public = true
);

-- INSERT: Seuls les utilisateurs authentifiés peuvent créer leurs propres cartes
CREATE POLICY "business_cards_insert_own"
ON public.business_cards
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Les utilisateurs ne peuvent modifier que leurs propres cartes
CREATE POLICY "business_cards_update_own"
ON public.business_cards
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Les utilisateurs ne peuvent supprimer que leurs propres cartes
CREATE POLICY "business_cards_delete_own"
ON public.business_cards
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- OPTIONNEL: Politique admin pour accès complet (décommentez si nécessaire)
-- CREATE POLICY "business_cards_admin_full_access"
-- ON public.business_cards
-- FOR ALL
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.user_roles
--         WHERE user_roles.user_id = auth.uid()
--         AND user_roles.role = 'admin'
--     )
-- );

-- Étape 4: Vérification
SELECT 
    'business_cards' as table_name,
    policyname,
    cmd,
    roles::text,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
        ELSE ''
    END as policy_condition
FROM pg_policies
WHERE tablename = 'business_cards'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Résultat attendu:
-- ✅ business_cards_select_own_or_public (SELECT)
-- ✅ business_cards_insert_own (INSERT)
-- ✅ business_cards_update_own (UPDATE)
-- ✅ business_cards_delete_own (DELETE)

COMMENT ON TABLE public.business_cards IS 'RLS stabilized on 2025-01-26: Users can only access their own cards or public cards';




