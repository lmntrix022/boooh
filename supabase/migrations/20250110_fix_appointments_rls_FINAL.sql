-- Fix RLS policies for appointments - FINAL VERSION
-- This explicitly targets the 'anon' role for non-authenticated users

-- Drop ALL existing policies first
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON appointments';
    END LOOP;
END $$;

-- Disable then re-enable RLS for clean slate
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Policy for INSERT that explicitly includes 'anon' role
-- This allows non-authenticated users to create appointments
CREATE POLICY "allow_anon_insert_appointments"
ON appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy for SELECT - only card owners can view their appointments
CREATE POLICY "allow_owners_select_appointments"
ON appointments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Policy for UPDATE - only card owners can update their appointments
CREATE POLICY "allow_owners_update_appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Policy for DELETE - only card owners can delete their appointments
CREATE POLICY "allow_owners_delete_appointments"
ON appointments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Grant explicit table permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON TABLE public.appointments TO anon;
GRANT INSERT ON TABLE public.appointments TO authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_card_id ON appointments(card_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Verify the policies were created correctly
SELECT
    policyname,
    cmd as operation,
    roles,
    permissive as type
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;

-- Final check: Show table permissions
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'appointments'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
