-- ÉTAPE 1: Supprimer toutes les politiques qui causent des problèmes de récursion
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Profiles are viewable by admins" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- ÉTAPE 2: Désactiver temporairement la RLS pour permettre les insertions directes
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer une fonction qui vérifie si un utilisateur est admin sans causer de récursion
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_exists boolean;
BEGIN
  -- Vérifier directement dans la table sans utiliser de politiques RLS
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = 'admin'
  ) INTO admin_exists;
  
  RETURN admin_exists;
END;
$$;

-- ÉTAPE 4: Insérer l'administrateur initial si ce n'est pas déjà fait
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT auth.uid(), 'admin'::app_role;
  END IF;
END $$;

-- ÉTAPE 5: Créer les profils pour tous les utilisateurs existants
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ÉTAPE 6: Réactiver RLS et ajouter des politiques sans récursion
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politiques pour profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid()); 