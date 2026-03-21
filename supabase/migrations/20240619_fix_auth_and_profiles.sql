-- Disable RLS temporarily for cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remove email column as it's redundant with auth.users
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by admins" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users on their own records" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new streamlined policies
CREATE POLICY "service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Update permissions to be more restrictive
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;

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

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_user();

-- Ensure the trigger function has the correct permissions
ALTER FUNCTION public.create_profile_for_user() SECURITY DEFINER; 