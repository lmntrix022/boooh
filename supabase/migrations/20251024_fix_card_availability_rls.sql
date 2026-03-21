-- Migration: Fix card_availability_settings RLS policies
-- Purpose: Resolve 406 Not Acceptable errors by improving RLS policies

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can manage their card availability settings" ON card_availability_settings;
DROP POLICY IF EXISTS "Users can select their card availability settings" ON card_availability_settings;
DROP POLICY IF EXISTS "Users can insert their card availability settings" ON card_availability_settings;
DROP POLICY IF EXISTS "Users can update their card availability settings" ON card_availability_settings;
DROP POLICY IF EXISTS "Users can delete their card availability settings" ON card_availability_settings;

-- Create new, more permissive policies for better REST API compatibility

-- SELECT policy: Users can read their own card availability settings
CREATE POLICY "card_availability_select"
  ON card_availability_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy: Users can create availability settings for their own cards
CREATE POLICY "card_availability_insert"
  ON card_availability_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own availability settings
CREATE POLICY "card_availability_update"
  ON card_availability_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own availability settings
CREATE POLICY "card_availability_delete"
  ON card_availability_settings
  FOR DELETE
  USING (auth.uid() = user_id);
