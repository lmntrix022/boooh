-- Fonction pour ajouter le premier administrateur
CREATE OR REPLACE FUNCTION public.add_first_admin(admin_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Utiliser les privilèges du créateur de la fonction
SET search_path = public
AS $$
BEGIN
    -- Vérifier si l'utilisateur existe dans auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;
    
    -- Insérer l'utilisateur comme admin s'il n'est pas déjà admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN true;
END;
$$; 