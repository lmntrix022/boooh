-- Migration pour améliorer la table stock_movements avec traçabilité complète
-- Date: 2025-01-10

-- Créer ou modifier la table stock_movements avec tous les champs nécessaires
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,

  -- Type de mouvement: 'sale' (vente), 'purchase' (réapprovisionnement), 'adjustment' (ajustement)
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment')),

  -- Quantité du mouvement (toujours positive, la direction est donnée par movement_type)
  quantity INTEGER NOT NULL CHECK (quantity > 0),

  -- Stock avant et après le mouvement (pour audit complet)
  stock_before INTEGER NOT NULL DEFAULT 0,
  stock_after INTEGER NOT NULL DEFAULT 0,

  -- Raison du mouvement (optionnel pour ventes, requis pour ajustements)
  reason TEXT,

  -- Référence externe (numéro de commande, bon de livraison, etc.)
  reference TEXT,

  -- Informations supplémentaires (JSON pour flexibilité)
  -- Peut contenir: order_id, customer_name, supplier_name, invoice_number, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Utilisateur qui a effectué le mouvement (si applicable)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Horodatage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_card_id ON stock_movements(card_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference) WHERE reference IS NOT NULL;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_stock_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_movements_updated_at ON stock_movements;
CREATE TRIGGER trigger_update_stock_movements_updated_at
  BEFORE UPDATE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_movements_updated_at();

-- Fonction pour enregistrer un mouvement de stock (helper function)
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id UUID,
  p_card_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Récupérer le stock actuel
  SELECT COALESCE(current_stock, 0) INTO v_current_stock
  FROM product_stock
  WHERE product_id = p_product_id AND card_id = p_card_id;

  -- Si le produit n'existe pas dans product_stock, l'initialiser à 0
  IF v_current_stock IS NULL THEN
    INSERT INTO product_stock (product_id, card_id, current_stock)
    VALUES (p_product_id, p_card_id, 0)
    ON CONFLICT (product_id) DO NOTHING;
    v_current_stock := 0;
  END IF;

  -- Calculer le nouveau stock
  CASE p_movement_type
    WHEN 'sale' THEN
      v_new_stock := GREATEST(0, v_current_stock - p_quantity);
    WHEN 'purchase' THEN
      v_new_stock := v_current_stock + p_quantity;
    WHEN 'adjustment' THEN
      v_new_stock := p_quantity; -- Pour ajustement, quantity = nouveau stock total
    ELSE
      RAISE EXCEPTION 'Type de mouvement invalide: %', p_movement_type;
  END CASE;

  -- Insérer le mouvement
  INSERT INTO stock_movements (
    product_id,
    card_id,
    movement_type,
    quantity,
    stock_before,
    stock_after,
    reason,
    reference,
    metadata,
    user_id
  ) VALUES (
    p_product_id,
    p_card_id,
    p_movement_type,
    p_quantity,
    v_current_stock,
    v_new_stock,
    p_reason,
    p_reference,
    p_metadata,
    p_user_id
  )
  RETURNING id INTO v_movement_id;

  -- Mettre à jour le stock actuel
  UPDATE product_stock
  SET current_stock = v_new_stock,
      updated_at = NOW()
  WHERE product_id = p_product_id AND card_id = p_card_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE stock_movements IS 'Historique complet de tous les mouvements de stock pour traçabilité';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type: sale (vente), purchase (réapprovisionnement), adjustment (ajustement manuel)';
COMMENT ON COLUMN stock_movements.stock_before IS 'Quantité en stock avant le mouvement (pour audit)';
COMMENT ON COLUMN stock_movements.stock_after IS 'Quantité en stock après le mouvement (pour audit)';
COMMENT ON COLUMN stock_movements.reason IS 'Raison du mouvement (obligatoire pour adjustments: perte, dommage, inventaire, etc.)';
COMMENT ON COLUMN stock_movements.reference IS 'Référence externe: numéro de commande, bon de livraison, facture, etc.';
COMMENT ON COLUMN stock_movements.metadata IS 'Données supplémentaires en JSON (customer_name, supplier_name, etc.)';

-- Permissions RLS (Row Level Security)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir les mouvements de leurs propres cartes
CREATE POLICY "Users can view stock movements for their cards"
  ON stock_movements
  FOR SELECT
  USING (
    card_id IN (
      SELECT id FROM business_cards WHERE user_id = auth.uid()
    )
  );

-- Politique: Les utilisateurs peuvent créer des mouvements pour leurs propres cartes
CREATE POLICY "Users can create stock movements for their cards"
  ON stock_movements
  FOR INSERT
  WITH CHECK (
    card_id IN (
      SELECT id FROM business_cards WHERE user_id = auth.uid()
    )
  );

-- Politique: Les utilisateurs peuvent mettre à jour les mouvements de leurs propres cartes
CREATE POLICY "Users can update stock movements for their cards"
  ON stock_movements
  FOR UPDATE
  USING (
    card_id IN (
      SELECT id FROM business_cards WHERE user_id = auth.uid()
    )
  );
