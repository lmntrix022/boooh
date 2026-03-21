-- ============================================================================
-- Migration: Corriger les RLS policies pour team_members
-- Date: 2025-01-26
-- Description: Réparer l'erreur 403 Forbidden en simplifiant les policies
-- ============================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "team_owners_full_access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_own_access" ON public.team_members;
DROP POLICY IF EXISTS "public_invitation_check" ON public.team_members;

-- Policy 1: Owners ont accès complet
CREATE POLICY "team_owners_full_access"
ON public.team_members
FOR ALL
TO authenticated
USING (owner_id = auth.uid());

-- Policy 2: Members peuvent voir leurs propres invitations (simplifié)
CREATE POLICY "team_members_own_access"
ON public.team_members
FOR SELECT
TO authenticated
USING (member_id = auth.uid());

-- Policy 3: Public peut vérifier invitations pending (pour lien d'acceptation)
CREATE POLICY "public_invitation_check"
ON public.team_members
FOR SELECT
TO public
USING (status = 'pending');

-- Vérifier les permissions sur auth.users
COMMENT ON TABLE public.team_members IS 'Fixed RLS - removed problematic auth.users query';







