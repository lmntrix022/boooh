-- Migration: Fix RLS sur digital_purchases pour CRM
-- Date: 2025-10-18
-- Description: Permettre aux vendeurs (propriétaires de cartes) de voir les achats de leurs produits digitaux

-- 1. Ajouter policy pour que les vendeurs voient les achats de leurs produits
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

-- 2. Commentaire
COMMENT ON POLICY "Sellers can view purchases of their digital products" ON public.digital_purchases IS
'Permet aux vendeurs (propriétaires de cartes) de voir tous les achats de leurs produits digitaux pour le CRM';

-- Note: La policy existante "Buyers can view their purchases" reste active
-- Résultat: Les acheteurs voient leurs achats ET les vendeurs voient les achats de leurs produits

