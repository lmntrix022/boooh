-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users on their own records" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new streamlined policies

-- 1. Allow service role full access (needed for auth)
CREATE POLICY "service_role_all_access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Allow authenticated users to read their own profile and admin profiles
CREATE POLICY "authenticated_read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- 3. Allow authenticated users to update their own profile
CREATE POLICY "authenticated_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Allow public read access to public profiles
CREATE POLICY "public_read_access"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Update permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Ensure the trigger function has the correct permissions
ALTER FUNCTION public.create_profile_for_user() SECURITY DEFINER;

-- Update the trigger function to be more resilient
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO public.profiles (
            id,
            full_name,
            created_at
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NOW()
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't prevent user creation
        RAISE LOG 'Error in create_profile_for_user: %', SQLERRM;
        RETURN NEW;
END;
$$; 