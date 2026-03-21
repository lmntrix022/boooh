-- ============================================================================
-- Migration: Mettre à jour les permissions par défaut selon l'exemple donné
-- Date: 2025-01-26
-- Description: 
-- - Propriétaire/Admin: Complet (owner)
-- - Manager/Responsable: Limité aux fonctions commerciales (manager)
-- - Collaborateur/Employé: Limité (collaborator)
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.setup_member_default_permissions(uuid, text);

-- Nouvelle fonction avec les 3 rôles correspondant à l'exemple
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
    WHEN 'collaborator' THEN
      -- COLLABORATEUR/EMPLOYÉ - Limité (Voir seulement, sauf créer ses RDV)
      INSERT INTO public.team_permissions (member_id, resource_type, can_view, can_create, can_edit, can_delete)
      VALUES 
        (p_member_id, 'card', true, false, false, false),
        (p_member_id, 'product', true, false, false, false),
        (p_member_id, 'digital_product', true, false, false, false),
        (p_member_id, 'order', true, false, false, false),
        (p_member_id, 'contact', true, false, false, false), -- Peut ajouter notes clients
        (p_member_id, 'invoice', true, false, false, false),
        (p_member_id, 'quote', true, false, false, false),
        (p_member_id, 'portfolio', true, false, false, false),
        (p_member_id, 'appointment', true, true, false, false), -- Peut créer ses RDV
        (p_member_id, 'stock', true, false, false, false),
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', false, false, false, false), -- Aucun accès paramètres
        (p_member_id, 'team', false, false, false, false); -- Aucun accès équipe
        
    WHEN 'manager' THEN
      -- MANAGER/RESPONSABLE - Limité aux fonctions commerciales
      INSERT INTO public.team_permissions (
        member_id, resource_type, can_view, can_create, can_edit, can_delete, 
        can_send, can_publish, can_manage_stock
      )
      VALUES 
        (p_member_id, 'card', true, true, true, false), -- Voir / Modifier
        (p_member_id, 'product', true, true, true, true),
        (p_member_id, 'digital_product', true, true, true, true),
        (p_member_id, 'order', true, true, true, false),
        (p_member_id, 'contact', true, true, true, false), -- Voir / Modifier
        (p_member_id, 'invoice', true, true, true, true, true, false, false), -- Voir / Créer / Envoyer
        (p_member_id, 'quote', true, true, true, true, true, false, false),
        (p_member_id, 'portfolio', true, true, true, true, true, true, false),
        (p_member_id, 'appointment', true, true, true, true), -- Gérer rendez-vous
        (p_member_id, 'stock', true, true, true, false, false, false, true), -- Gérer stock
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', false, false, false, false), -- Accès limité
        (p_member_id, 'team', false, false, false, false); -- Pas d'accès équipe
        
    WHEN 'member' THEN
      -- PROPRIETAIRE/MEMBER - Accès complet (sauf gestion équipe/plan réservé à owner)
      INSERT INTO public.team_permissions (
        member_id, resource_type, can_view, can_create, can_edit, can_delete, 
        can_send, can_publish, can_manage_stock, can_process_payments, can_cancel, can_refund
      )
      VALUES 
        (p_member_id, 'card', true, true, true, true),
        (p_member_id, 'product', true, true, true, true),
        (p_member_id, 'digital_product', true, true, true, true),
        (p_member_id, 'order', true, true, true, false, false, false, false, true, true, true), -- Traiter paiements, annuler, rembourser
        (p_member_id, 'contact', true, true, true, true), -- Accès total CRM
        (p_member_id, 'invoice', true, true, true, true, true, false, false, false, false, false),
        (p_member_id, 'quote', true, true, true, true, true, false, false, false, false, false),
        (p_member_id, 'portfolio', true, true, true, true, true, true, false, false, false, false),
        (p_member_id, 'appointment', true, true, true, true), -- Gérer tous
        (p_member_id, 'stock', true, true, true, true, false, false, true, false, false, false),
        (p_member_id, 'statistics', true, false, false, false),
        (p_member_id, 'settings', true, false, true, false), -- Peut modifier quelques paramètres
        (p_member_id, 'team', false, false, false, false); -- Gestion équipe réservée au propriétaire
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.setup_member_default_permissions IS 'Crée les permissions selon le rôle: collaborator (limité), manager (commercial), member (complet)';







