-- Re-enable RLS with a working configuration
-- Based on testing, we know RLS disabled works, so we need permissive policies

-- First, clean up any existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON appointments';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create a PERMISSIVE policy for INSERT that applies to both anon and authenticated
-- PERMISSIVE means it grants access (default), not RESTRICTIVE
CREATE POLICY "appointments_insert_policy"
ON appointments
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow card owners to SELECT their appointments
CREATE POLICY "appointments_select_policy"
ON appointments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Allow card owners to UPDATE their appointments
CREATE POLICY "appointments_update_policy"
ON appointments
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
)
WITH CHECK (true);

-- Allow card owners to DELETE their appointments
CREATE POLICY "appointments_delete_policy"
ON appointments
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Ensure all permissions are granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.appointments TO anon, authenticated;

-- Verify the setup
SELECT
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_tables
WHERE tablename = 'appointments'
UNION ALL
SELECT
    'Policy Count' as check_type,
    'appointments' as tablename,
    COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE tablename = 'appointments';

-- Show all policies
SELECT
    policyname,
    cmd as operation,
    roles,
    permissive as policy_type
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;
