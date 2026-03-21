-- Migration: Service-Cards Many-to-Many Relationship
-- Description: Create junction table to link services to multiple business cards

-- Create service_cards junction table
CREATE TABLE IF NOT EXISTS service_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES portfolio_services(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate associations
  UNIQUE(service_id, card_id)
);

-- Create indexes for performance
CREATE INDEX idx_service_cards_service_id ON service_cards(service_id);
CREATE INDEX idx_service_cards_card_id ON service_cards(card_id);

-- Enable RLS
ALTER TABLE service_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view service-card links for their own services
CREATE POLICY "Users can view their own service-card links"
  ON service_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_services ps
      WHERE ps.id = service_cards.service_id
      AND ps.user_id = auth.uid()
    )
  );

-- Users can create links for their own services
CREATE POLICY "Users can create service-card links"
  ON service_cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_services ps
      WHERE ps.id = service_cards.service_id
      AND ps.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM business_cards bc
      WHERE bc.id = service_cards.card_id
      AND bc.user_id = auth.uid()
    )
  );

-- Users can delete their own service-card links
CREATE POLICY "Users can delete their own service-card links"
  ON service_cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_services ps
      WHERE ps.id = service_cards.service_id
      AND ps.user_id = auth.uid()
    )
  );

-- Public can view published services' card associations
CREATE POLICY "Public can view published service-card links"
  ON service_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_services ps
      WHERE ps.id = service_cards.service_id
      AND ps.is_published = true
    )
  );

-- Add comment
COMMENT ON TABLE service_cards IS 'Junction table linking portfolio services to business cards (many-to-many relationship)';
