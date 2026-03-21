-- ============================================================================
-- Migration: Système d'équipe avec invitations et permissions
-- Date: 2025-01-26
-- Description: Créer les tables team_members et team_permissions pour 
--               gérer les invitations d'équipe et permissions granulaires
-- ============================================================================

-- Table 1: team_members
-- Stocke les membres de l'équipe et leurs invitations
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL si pending
  email text NOT NULL,
  role text NOT NULL DEFAULT 'collaborator', -- 'collaborator', 'manager', 'member'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  expires_at timestamptz, -- Invitations expirent après 7 jours
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_role CHECK (role IN ('collaborator', 'manager', 'member')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS team_members_owner_id_idx ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS team_members_email_idx ON public.team_members(email);
CREATE INDEX IF NOT EXISTS team_members_member_id_idx ON public.team_members(member_id) WHERE member_id IS NOT NULL;

-- Table 2: team_permissions
-- Permissions granulaires par ressource pour chaque membre
-- resource_type: les types de ressources (card, product, contact, invoice, portfolio, appointment, etc.)
-- resource_id: ID spécifique de la ressource (NULL = toutes les ressources de ce type)
CREATE TABLE IF NOT EXISTS public.team_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  resource_type text NOT NULL, 
  resource_id uuid,
  
  -- Permissions de base
  can_view boolean DEFAULT false NOT NULL,
  can_create boolean DEFAULT false NOT NULL,
  can_edit boolean DEFAULT false NOT NULL,
  can_delete boolean DEFAULT false NOT NULL,
  
  -- Permissions spéciales selon le type de ressource
  can_send boolean DEFAULT false, -- Envoyer emails, factures, etc.
  can_publish boolean DEFAULT false, -- Publier produits, projets, etc.
  can_manage_stock boolean DEFAULT false, -- Gérer stock/inventaire
  can_process_payments boolean DEFAULT false, -- Traiter paiements
  can_cancel boolean DEFAULT false, -- Annuler commandes, rendez-vous, etc.
  can_refund boolean DEFAULT false, -- Rembourser commandes
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_resource_type CHECK (resource_type IN (
    'card',           -- Cartes de visite
    'product',        -- Produits e-commerce physiques
    'digital_product',-- Produits numériques
    'order',          -- Commandes
    'contact',        -- Contacts CRM
    'invoice',        -- Factures
    'quote',          -- Devis
    'portfolio',      -- Projets portfolio
    'appointment',    -- Rendez-vous
    'stock',          -- Gestion stock
    'statistics',     -- Statistiques/Analytics
    'settings',       -- Paramètres compte
    'team'            -- Gestion équipe
  ))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS team_permissions_member_id_idx ON public.team_permissions(member_id);
CREATE INDEX IF NOT EXISTS team_permissions_resource_idx ON public.team_permissions(resource_type, resource_id);

-- RLS: team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Owner a accès complet à ses invitations
CREATE POLICY "team_owners_full_access"
ON public.team_members
FOR ALL
TO authenticated
USING (owner_id = auth.uid());

-- Policy 2: Members peuvent voir leurs propres invitations (par email)
CREATE POLICY "team_members_own_access"
ON public.team_members
FOR SELECT
TO authenticated
USING (member_id = auth.uid());

-- Policy 3: Public accès pour vérifier invitation en attente
CREATE POLICY "public_invitation_check"
ON public.team_members
FOR SELECT
TO anon
USING (status = 'pending');

-- RLS: team_permissions
ALTER TABLE public.team_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Owner et member peuvent voir les permissions
CREATE POLICY "team_permissions_visible"
ON public.team_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.id = team_permissions.member_id
    AND (team_members.owner_id = auth.uid() OR team_members.member_id = auth.uid())
  )
);

-- Policy: Seul l'owner peut modifier les permissions
CREATE POLICY "team_permissions_owner_only"
ON public.team_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.id = team_permissions.member_id
    AND team_members.owner_id = auth.uid()
  )
);

-- Fonction pour updater updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_permissions_updated_at
  BEFORE UPDATE ON public.team_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour vérifier si un utilisateur est membre d'une équipe
CREATE OR REPLACE FUNCTION public.is_team_member(
  p_owner_id uuid,
  p_member_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = p_owner_id
    AND member_id = p_member_id
    AND status = 'accepted'
  );
END;
$$;

-- Fonction pour obtenir les permissions complètes d'un membre
CREATE OR REPLACE FUNCTION public.get_member_permissions(
  p_member_id uuid,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL
)
RETURNS TABLE (
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  can_send boolean,
  can_publish boolean,
  can_manage_stock boolean,
  can_process_payments boolean,
  can_cancel boolean,
  can_refund boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.can_view,
    tp.can_create,
    tp.can_edit,
    tp.can_delete,
    tp.can_send,
    tp.can_publish,
    tp.can_manage_stock,
    tp.can_process_payments,
    tp.can_cancel,
    tp.can_refund
  FROM public.team_permissions tp
  WHERE tp.member_id = p_member_id
  AND tp.resource_type = p_resource_type
  AND (p_resource_id IS NULL OR tp.resource_id IS NULL OR tp.resource_id = p_resource_id)
  ORDER BY tp.resource_id NULLS LAST
  LIMIT 1;
END;
$$;

-- Fonction pour obtenir le rôle de base d'un membre (member/editor/viewer)
CREATE OR REPLACE FUNCTION public.get_member_role(
  p_owner_id uuid,
  p_member_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_role text;
BEGIN
  SELECT role INTO member_role
  FROM public.team_members
  WHERE owner_id = p_owner_id
  AND member_id = p_member_id
  AND status = 'accepted';
  
  RETURN COALESCE(member_role, 'none');
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.team_members TO authenticated;
GRANT ALL ON TABLE public.team_permissions TO authenticated;
GRANT SELECT ON TABLE public.team_members TO anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_permissions(uuid, text, uuid) TO authenticated;

-- Commentaires
COMMENT ON TABLE public.team_members IS 'Gère les membres de l''équipe et leurs invitations';
COMMENT ON TABLE public.team_permissions IS 'Permissions granulaires par ressource pour chaque membre';
COMMENT ON FUNCTION public.is_team_member IS 'Vérifie si un utilisateur est membre d''une équipe';
COMMENT ON FUNCTION public.get_member_permissions IS 'Récupère les permissions d''un membre pour une ressource';

