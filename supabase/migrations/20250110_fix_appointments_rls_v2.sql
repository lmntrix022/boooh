-- Fix RLS policies for appointments table - Version 2
-- This version uses 'anon' role instead of 'public' for better Supabase compatibility

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_can_view_own_appointments" ON appointments;
DROP POLICY IF EXISTS "users_can_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "users_can_update_own_appointments" ON appointments;
DROP POLICY IF EXISTS "users_can_delete_own_appointments" ON appointments;
DROP POLICY IF EXISTS "public_can_create_appointments" ON appointments;
DROP POLICY IF EXISTS "card_owners_can_view_appointments" ON appointments;
DROP POLICY IF EXISTS "card_owners_can_update_appointments" ON appointments;
DROP POLICY IF EXISTS "card_owners_can_delete_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_can_create_appointments" ON appointments;

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to insert appointments
-- Using 'anon' role which is the default for non-authenticated Supabase requests
CREATE POLICY "anon_can_create_appointments" ON appointments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Card owners can view all appointments for their cards
CREATE POLICY "card_owners_can_view_appointments" ON appointments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM business_cards
            WHERE business_cards.id = appointments.card_id
            AND business_cards.user_id = auth.uid()
        )
    );

-- Policy 3: Card owners can update appointments for their cards
CREATE POLICY "card_owners_can_update_appointments" ON appointments
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

-- Policy 4: Card owners can delete appointments for their cards
CREATE POLICY "card_owners_can_delete_appointments" ON appointments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM business_cards
            WHERE business_cards.id = appointments.card_id
            AND business_cards.user_id = auth.uid()
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_card_id ON appointments(card_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;
