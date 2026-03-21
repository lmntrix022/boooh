-- =====================================================
-- Migration: Stabilisation RLS pour appointments
-- Date: 2025-01-26
-- Description: Politiques RLS définitives pour appointments (réservation publique autorisée)
-- =====================================================

-- Étape 1: Nettoyer toutes les anciennes politiques
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.appointments';
    END LOOP;
END $$;

-- Étape 2: S'assurer que RLS est activé
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Étape 3: Créer les politiques stabilisées

-- INSERT: Permettre aux visiteurs anonymes ET authentifiés de créer des rendez-vous
-- C'est nécessaire pour permettre la réservation publique sur les cartes
CREATE POLICY "appointments_insert_public"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- SELECT: 
-- 1. Les propriétaires de cartes peuvent voir tous les rendez-vous de leurs cartes
CREATE POLICY "appointments_select_owners"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    -- Propriétaire de la carte
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- SELECT pour les visiteurs anonymes: Aucun accès (pour préserver la confidentialité)
-- Pas de politique SELECT pour 'anon' = pas d'accès

-- UPDATE: Seuls les propriétaires de cartes peuvent modifier les rendez-vous
CREATE POLICY "appointments_update_owners_only"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- DELETE: Seuls les propriétaires de cartes peuvent supprimer les rendez-vous
CREATE POLICY "appointments_delete_owners_only"
ON public.appointments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = appointments.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- Étape 4: Permissions nécessaires
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.appointments TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;

-- Étape 5: Vérification
SELECT 
    'appointments' as table_name,
    policyname,
    cmd,
    roles::text,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual::text, 1, 100)
        ELSE ''
    END as policy_condition
FROM pg_policies
WHERE tablename = 'appointments'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Résultat attendu:
-- ✅ appointments_insert_public (INSERT pour anon + authenticated)
-- ✅ appointments_select_owners_and_self (SELECT pour authenticated)
-- ✅ appointments_update_owners_only (UPDATE pour authenticated)
-- ✅ appointments_delete_owners_only (DELETE pour authenticated)

COMMENT ON TABLE public.appointments IS 'RLS stabilized on 2025-01-26: Public booking allowed, owners manage all appointments for their cards';

