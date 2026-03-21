-- Fix user_roles RLS policies to avoid infinite recursion
-- This migration removes the recursive policies and creates simpler ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary unrestricted policy" ON public.user_roles;

-- Policy 1: Allow all authenticated users to read their own role
-- This is essential for checking if a user is admin
CREATE POLICY "users_can_read_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Allow service role to manage all roles (for admin operations)
-- Admins will need to use service role key for role management
CREATE POLICY "service_role_full_access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: If you want to allow users to read ALL roles (useful for admin pages)
-- You can uncomment this policy:
-- CREATE POLICY "authenticated_can_read_all_roles"
-- ON public.user_roles
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- Add comment
COMMENT ON TABLE public.user_roles IS 'Stores user roles (admin/user). RLS enabled with non-recursive policies.';
