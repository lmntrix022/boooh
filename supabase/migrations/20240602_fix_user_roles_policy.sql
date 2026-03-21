-- Supprimer la politique problématique qui cause la récursion infinie
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Créer une politique temporaire pour permettre toutes les opérations
CREATE POLICY "Temporary unrestricted policy" 
ON public.user_roles
FOR ALL 
TO authenticated
USING (true);

-- Insérer un premier administrateur (vous devrez remplacer cet UUID par l'ID de votre utilisateur)
-- Cette insertion sera possible grâce à la politique temporaire
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'admin'::app_role
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
);

-- Une fois que nous avons au moins un admin, nous pouvons recréer une politique plus restrictive
-- Cette politique permettra aux admins de gérer les rôles tout en évitant la récursion
DROP POLICY IF EXISTS "Temporary unrestricted policy" ON public.user_roles;

-- Politique pour les utilisateurs existants
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
); 