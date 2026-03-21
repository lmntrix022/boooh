-- Migration pour corriger l'accès public aux produits numériques
-- Date: 2024-12-05
-- Permet l'accès public aux produits numériques des cartes publiques

-- 1. Ajouter une politique pour permettre l'accès public aux produits numériques
CREATE POLICY "Anyone can view digital products of public cards" ON public.digital_products
    FOR SELECT USING (
        card_id IN (
            SELECT id FROM public.business_cards 
            WHERE is_public = true
        )
    );

-- 2. Vérifier que la politique existe
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'digital_products';
