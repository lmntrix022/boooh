-- Migration: Fix RLS sur digital_purchases pour CRM - VERSION CORRIGÉE
-- Date: 2025-10-18
-- Description: Permettre aux vendeurs (propriétaires de cartes) de voir les achats de leurs produits digitaux

-- 1. SUPPRIMER la policy existante qui bloque l'accès
DROP POLICY IF EXISTS "Buyers can view their purchases" ON public.digital_purchases;

-- 2. CRÉER la policy pour les acheteurs (permettre aux clients de voir leurs achats)
CREATE POLICY "Buyers can view their purchases"
ON public.digital_purchases
FOR SELECT
USING (buyer_email = auth.jwt() ->> 'email');

-- 3. CRÉER la policy pour les vendeurs (permettre aux vendeurs de voir les achats de leurs produits)
CREATE POLICY "Sellers can view purchases of their digital products"
ON public.digital_purchases
FOR SELECT
USING (
  -- Le vendeur peut voir les achats de ses produits digitaux
  product_id IN (
    SELECT dp.id 
    FROM public.digital_products dp
    JOIN public.business_cards bc ON dp.card_id = bc.id
    WHERE bc.user_id = auth.uid()
  )
);

-- 4. Commentaires
COMMENT ON POLICY "Buyers can view their purchases" ON public.digital_purchases IS
'Permet aux acheteurs de voir leurs propres achats digitaux';

COMMENT ON POLICY "Sellers can view purchases of their digital products" ON public.digital_purchases IS
'Permet aux vendeurs (propriétaires de cartes) de voir tous les achats de leurs produits digitaux pour le CRM';

-- Résultat final:
-- ✅ Les acheteurs voient leurs achats (buyer_email = auth.email)
-- ✅ Les vendeurs voient les achats de leurs produits (product belongs to their card)
