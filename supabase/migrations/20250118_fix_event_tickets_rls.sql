-- Fix RLS policy for event_tickets to allow unauthenticated users to create free tickets
-- This migration ensures that anyone (including unauthenticated users) can create tickets
-- for public, published events

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.event_tickets;

-- Create a more permissive policy that allows ticket creation for public events
-- This policy allows:
-- 1. Authenticated users to create tickets (with their user_id)
-- 2. Unauthenticated users to create tickets (with user_id = null) for public, published events
CREATE POLICY "Anyone can create tickets for public events"
    ON public.event_tickets FOR INSERT
    WITH CHECK (
        -- Allow if user is authenticated (can create tickets for any event they have access to)
        auth.uid() IS NOT NULL
        OR
        -- Allow unauthenticated users to create tickets for public, published events
        (
            auth.uid() IS NULL
            AND EXISTS (
                SELECT 1 FROM public.events
                WHERE events.id = event_tickets.event_id
                AND events.is_public = true
                AND events.status = 'published'
            )
        )
    );

-- Also ensure the SELECT policy allows viewing tickets created by unauthenticated users
-- (for organizers to see all tickets for their events)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.event_tickets;

CREATE POLICY "Users can view own tickets and organizers can view event tickets"
    ON public.event_tickets FOR SELECT
    USING (
        -- Users can view their own tickets
        user_id = auth.uid()
        OR
        -- Organizers can view all tickets for their events
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_tickets.event_id
            AND events.user_id = auth.uid()
        )
        OR
        -- Allow viewing tickets with null user_id if the event is public (for unauthenticated ticket holders)
        (
            user_id IS NULL
            AND EXISTS (
                SELECT 1 FROM public.events
                WHERE events.id = event_tickets.event_id
                AND events.is_public = true
                AND events.status = 'published'
            )
        )
    );
