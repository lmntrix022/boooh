-- Create inventories table
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  item_count INTEGER NOT NULL DEFAULT 0,
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  system_stock INTEGER NOT NULL DEFAULT 0,
  physical_stock INTEGER NOT NULL DEFAULT 0,
  variance INTEGER NOT NULL DEFAULT 0,
  variance_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  unit_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_inventories_card_id ON inventories(card_id);
CREATE INDEX idx_inventories_user_id ON inventories(user_id);
CREATE INDEX idx_inventories_status ON inventories(status);
CREATE INDEX idx_inventories_created_at ON inventories(created_at);
CREATE INDEX idx_inventory_items_inventory_id ON inventory_items(inventory_id);
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);

-- Enable RLS
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventories
CREATE POLICY "Users can view their own inventories" ON inventories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create inventories" ON inventories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inventories" ON inventories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own inventories" ON inventories
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for inventory_items
CREATE POLICY "Users can view inventory items for their inventories" ON inventory_items
  FOR SELECT USING (
    inventory_id IN (
      SELECT id FROM inventories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inventory items for their inventories" ON inventory_items
  FOR INSERT WITH CHECK (
    inventory_id IN (
      SELECT id FROM inventories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inventory items for their inventories" ON inventory_items
  FOR UPDATE USING (
    inventory_id IN (
      SELECT id FROM inventories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete inventory items for their inventories" ON inventory_items
  FOR DELETE USING (
    inventory_id IN (
      SELECT id FROM inventories WHERE user_id = auth.uid()
    )
  );

-- Create function to calculate inventory stats
CREATE OR REPLACE FUNCTION calculate_inventory_stats(p_inventory_id UUID)
RETURNS TABLE(
  total_items INTEGER,
  items_with_variance INTEGER,
  total_system_value NUMERIC,
  total_physical_value NUMERIC,
  total_variance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE variance != 0)::INTEGER,
    SUM(system_stock * unit_value)::NUMERIC,
    SUM(physical_stock * unit_value)::NUMERIC,
    SUM((physical_stock - system_stock) * unit_value)::NUMERIC
  FROM inventory_items
  WHERE inventory_id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to finalize inventory
CREATE OR REPLACE FUNCTION finalize_inventory(p_inventory_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE inventories
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_inventory_id AND status = 'in_progress';

  IF FOUND THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Inventaire finalisé avec succès'::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Inventaire non trouvé ou déjà finalisé'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;
