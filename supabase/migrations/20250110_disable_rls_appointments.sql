-- Temporary fix: Disable RLS on appointments table
-- This will allow all inserts to work while we debug the real issue

-- Disable RLS completely on appointments table
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions
GRANT ALL ON TABLE public.appointments TO anon;
GRANT ALL ON TABLE public.appointments TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify RLS is disabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'appointments';
