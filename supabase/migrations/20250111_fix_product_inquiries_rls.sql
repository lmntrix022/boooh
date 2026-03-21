-- Migration pour corriger les politiques RLS sur product_inquiries et digital_inquiries
-- Permet aux propriétaires de cartes de mettre à jour le statut des commandes

-- ============================================
-- PRODUCT_INQUIRIES (Commandes physiques)
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can update their own product inquiries" ON product_inquiries;
DROP POLICY IF EXISTS "Card owners can update product inquiries" ON product_inquiries;
DROP POLICY IF EXISTS "Allow card owners to update product inquiries" ON product_inquiries;

-- Politique pour permettre aux propriétaires de cartes de mettre à jour les commandes
CREATE POLICY "Card owners can update product inquiry status"
ON product_inquiries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = product_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = product_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
);

-- Politique pour permettre la lecture des commandes aux propriétaires de cartes
CREATE POLICY "Card owners can view product inquiries"
ON product_inquiries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = product_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
);

-- Politique pour permettre la création de commandes (pour les clients)
CREATE POLICY "Anyone can create product inquiries"
ON product_inquiries
FOR INSERT
WITH CHECK (true);

-- ============================================
-- DIGITAL_INQUIRIES (Commandes digitales)
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can update their own digital inquiries" ON digital_inquiries;
DROP POLICY IF EXISTS "Card owners can update digital inquiries" ON digital_inquiries;
DROP POLICY IF EXISTS "Allow card owners to update digital inquiries" ON digital_inquiries;

-- Politique pour permettre aux propriétaires de cartes de mettre à jour les commandes
CREATE POLICY "Card owners can update digital inquiry status"
ON digital_inquiries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = digital_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = digital_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
);

-- Politique pour permettre la lecture des commandes aux propriétaires de cartes
CREATE POLICY "Card owners can view digital inquiries"
ON digital_inquiries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_cards
    WHERE business_cards.id = digital_inquiries.card_id
    AND business_cards.user_id = auth.uid()
  )
);

-- Politique pour permettre la création de commandes (pour les clients)
CREATE POLICY "Anyone can create digital inquiries"
ON digital_inquiries
FOR INSERT
WITH CHECK (true);

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_inquiries ENABLE ROW LEVEL SECURITY;

-- Ajouter un commentaire pour la documentation
COMMENT ON POLICY "Card owners can update product inquiry status" ON product_inquiries IS
'Permet aux propriétaires de cartes de business de mettre à jour le statut des commandes de produits physiques';

COMMENT ON POLICY "Card owners can update digital inquiry status" ON digital_inquiries IS
'Permet aux propriétaires de cartes de business de mettre à jour le statut des commandes de produits digitaux';
