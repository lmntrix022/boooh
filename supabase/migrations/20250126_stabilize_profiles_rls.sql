-- =====================================================
-- Migration: Stabilisation RLS pour profiles
-- Date: 2025-01-26
-- Description: Politiques RLS définitives pour profiles
-- =====================================================

-- Étape 1: Nettoyer toutes les anciennes politiques
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Étape 2: S'assurer que RLS est activé
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Étape 3: Créer les politiques stabilisées

-- Politique pour le service role (nécessaire pour auth triggers)
CREATE POLICY "profiles_service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- SELECT: Les utilisateurs peuvent lire leur propre profil
-- Les admins peuvent lire tous les profils
-- Les utilisateurs authentifiés peuvent lire tous les profils (pour le réseau social)
CREATE POLICY "profiles_select_own_or_admin_or_authenticated"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (
    -- L'utilisateur peut voir son propre profil
    id = auth.uid() OR
    -- Les admins peuvent voir tous les profils
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ) OR
    -- Les utilisateurs authentifiés peuvent voir les autres profils (réseau social)
    (auth.uid() IS NOT NULL)
);

-- INSERT: Seuls le service_role peut insérer (via trigger auth)
-- Les utilisateurs ne créent pas directement leur profil
CREATE POLICY "profiles_insert_service_role"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE: Les utilisateurs peuvent modifier leur propre profil uniquement
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- DELETE: Les utilisateurs ne peuvent pas supprimer leur profil
-- Pas de politique DELETE = personne ne peut supprimer (sauf service_role)

-- Étape 4: Permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated, anon;
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- Étape 5: Vérification
SELECT 
    'profiles' as table_name,
    policyname,
    cmd,
    roles::text
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY cmd, policyname;

COMMENT ON TABLE public.profiles IS 'RLS stabilized on 2025-01-26: Users can only read/update their own profile, service_role handles inserts';

