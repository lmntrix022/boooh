-- Fix RLS policies for appointments - Version 3 (Simplified)
-- Drop ALL existing policies first
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON appointments';
    END LOOP;
END $$;

-- Disable RLS temporarily to clean slate
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create simple policy for INSERT that allows everyone
CREATE POLICY "allow_all_inserts" ON appointments
    FOR INSERT
    WITH CHECK (true);

-- Create simple policy for SELECT for card owners
CREATE POLICY "allow_owners_select" ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_cards
            WHERE business_cards.id = appointments.card_id
            AND business_cards.user_id = auth.uid()
        )
    );

-- Create simple policy for UPDATE for card owners
CREATE POLICY "allow_owners_update" ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM business_cards
            WHERE business_cards.id = appointments.card_id
            AND business_cards.user_id = auth.uid()
        )
    );

-- Create simple policy for DELETE for card owners
CREATE POLICY "allow_owners_delete" ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM business_cards
            WHERE business_cards.id = appointments.card_id
            AND business_cards.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT INSERT ON appointments TO anon;
GRANT INSERT ON appointments TO authenticated;
GRANT SELECT, UPDATE, DELETE ON appointments TO authenticated;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_appointments_card_id ON appointments(card_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Show final policies
SELECT
    policyname,
    cmd as operation,
    roles,
    CASE
        WHEN qual IS NOT NULL THEN 'USING clause exists'
        ELSE 'No USING'
    END as using_clause,
    CASE
        WHEN with_check IS NOT NULL THEN 'WITH CHECK clause exists'
        ELSE 'No WITH CHECK'
    END as check_clause
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;
