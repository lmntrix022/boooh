-- First, ensure the service role has all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Add insert policy for service role
CREATE POLICY "service_role_insert"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Grant insert permission to service_role explicitly
GRANT INSERT ON public.profiles TO service_role;

-- Make sure the trigger function is owned by postgres
ALTER FUNCTION public.create_profile_for_user() OWNER TO postgres;

-- Update the trigger function to use service_role
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
SET role = 'service_role'
LANGUAGE plpgsql
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        -- Insert with explicit role
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
        -- Log error details
        RAISE LOG 'Error in create_profile_for_user: %, SQLSTATE: %, SQLERRM: %', 
            SQLERRM, SQLSTATE, SQLERRM;
        -- Continue with user creation even if profile creation fails
        RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_user();

-- Reset ownership of the trigger function
ALTER FUNCTION public.create_profile_for_user() OWNER TO postgres;

-- Verify table structure
DO $$
BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Missing required column: id';
    END IF;

    -- Ensure the id column is the primary key
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'profiles'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'id column must be the primary key';
    END IF;
END;
$$; 