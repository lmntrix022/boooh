-- Enable team members to access cards from their team owner
-- This allows invited team members to view the cards of the user who invited them

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Team members can view owner cards" ON business_cards;

-- Create policy for team members to view cards of the owner
CREATE POLICY "Team members can view owner cards"
ON business_cards
FOR SELECT
TO authenticated
USING (
  -- Allow if user owns the card (existing behavior)
  user_id = auth.uid()
  OR
  -- OR if user is a member of a team where the owner_id owns the card
  EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_members.member_id = auth.uid()
    AND team_members.owner_id = business_cards.user_id
    AND team_members.status = 'accepted'
  )
);

-- Add comment for documentation
COMMENT ON POLICY "Team members can view owner cards" ON business_cards IS
'Allows team members to view cards from the user who invited them to their team';

