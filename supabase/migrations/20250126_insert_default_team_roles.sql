-- ============================================================================
-- Migration: Rôles par défaut pour les invitations d'équipe
-- Date: 2025-01-26
-- Description: Créer les permissions par défaut pour chaque rôle
-- ============================================================================

-- Fonction helper pour créer les permissions par défaut basées sur le rôle
CREATE OR REPLACE FUNCTION public.setup_member_default_permissions(
  p_member_id uuid,
  p_member_role text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Supprimer les anciennes permissions
  DELETE FROM public.team_permissions WHERE member_id = p_member_id;
  
  -- Permissions par défaut selon le rôle
  CASE p_member_role
    WHEN 'viewer' THEN
      -- VIEWER (Collaborateur/Employé) - Voir seulement
      INSERT INTO public.team_permissions (member_id, resource_type, can_view, can_create, can_edit, can_delete)
      VALUES 
        (p_member_id, 'card', true, false, false, false),
        (p_member_id, 'product', true, false, false, false),
        (p_member_id, 'digital_product', true, false, false, false),
        (p_member_id, 'order', true, false, false, false),
        (p_member_id, 'contact', true, false, false, false),
        (p_member_id, 'invoice', true, false, false, false),
        (p_member_id, 'portfolio', true, false, false, false),
        (p_member_id, 'appointment', true, true, false, false), -- Peut créer ses propres RDV
        (p_member_id, 'stock', true, false, false, false),
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', false, false, false, false), -- Pas d'accès aux paramètres
        (p_member_id, 'team', false, false, false, false); -- Pas d'accès à l'équipe
        
    WHEN 'editor' THEN
      -- EDITOR (Manager/Responsable) - Voir et Modifier (pas de suppression globale)
      INSERT INTO public.team_permissions (member_id, resource_type, can_view, can_create, can_edit, can_delete, can_send, can_publish, can_manage_stock)
      VALUES 
        (p_member_id, 'card', true, true, true, false),
        (p_member_id, 'product', true, true, true, true),
        (p_member_id, 'digital_product', true, true, true, true),
        (p_member_id, 'order', true, true, true, false), -- Pas de suppression commandes
        (p_member_id, 'contact', true, true, true, false),
        (p_member_id, 'invoice', true, true, true, true, true, false, false),
        (p_member_id, 'portfolio', true, true, true, true, true, true, false),
        (p_member_id, 'appointment', true, true, true, true),
        (p_member_id, 'stock', true, true, true, false, false, false, true),
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', false, false, false, false), -- Pas d'accès aux paramètres
        (p_member_id, 'team', false, false, false, false); -- Pas d'accès à l'équipe
        
    WHEN 'member' THEN
      -- MEMBER - Accès complet (comme propriétaire sauf gestion équipe et paramètres)
      INSERT INTO public.team_permissions (member_id, resource_type, can_view, can_create, can_edit, can_delete, can_send, can_publish, can_manage_stock, can_process_payments, can_cancel, can_refund)
      VALUES 
        (p_member_id, 'card', true, true, true, true),
        (p_member_id, 'product', true, true, true, true),
        (p_member_id, 'digital_product', true, true, true, true),
        (p_member_id, 'order', true, true, true, false, false, false, false, true, true, true),
        (p_member_id, 'contact', true, true, true, true),
        (p_member_id, 'invoice', true, true, true, true, true, false, false, false, false, false),
        (p_member_id, 'portfolio', true, true, true, true, true, true, false, false, false, false),
        (p_member_id, 'appointment', true, true, true, true),
        (p_member_id, 'stock', true, true, true, true, false, false, true, false, false, false),
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', true, false, true, false), -- Peut modifier quelques paramètres
        (p_member_id, 'team', false, false, false, false); -- Pas d'accès à la gestion équipe
  END CASE;
END;
$$;

-- Trigger pour créer automatiquement les permissions par défaut quand un membre accepte
CREATE OR REPLACE FUNCTION public.on_member_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Quand le statut passe à 'accepted', créer les permissions par défaut
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    PERFORM public.setup_member_default_permissions(NEW.id, NEW.role);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_setup_member_permissions
  AFTER UPDATE ON public.team_members
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.on_member_accepted();

COMMENT ON FUNCTION public.setup_member_default_permissions IS 'Crée les permissions par défaut selon le rôle (viewer/editor/member)';
COMMENT ON FUNCTION public.on_member_accepted IS 'Déclenche la création des permissions quand un membre accepte l''invitation';

