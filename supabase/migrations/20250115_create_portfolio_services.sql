-- Create portfolio_services table
CREATE TABLE IF NOT EXISTS portfolio_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,

  -- Service info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'sparkles', -- nom de l'icône lucide-react

  -- Pricing
  price_type VARCHAR(20) DEFAULT 'custom', -- 'fixed', 'from', 'custom', 'free'
  price DECIMAL(10, 2),
  price_label VARCHAR(100), -- ex: "Sur devis", "À partir de 500€"

  -- CTA
  cta_label VARCHAR(100) DEFAULT 'Demander un devis',
  cta_url TEXT,

  -- Display
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_portfolio_services_user_id ON portfolio_services(user_id);
CREATE INDEX idx_portfolio_services_card_id ON portfolio_services(card_id);
CREATE INDEX idx_portfolio_services_published ON portfolio_services(is_published);
CREATE INDEX idx_portfolio_services_order ON portfolio_services(order_index);

-- Enable RLS
ALTER TABLE portfolio_services ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow users to view published services from any card
CREATE POLICY "Portfolio services are viewable by everyone"
  ON portfolio_services
  FOR SELECT
  USING (is_published = true);

-- Allow users to view their own services (published or not)
CREATE POLICY "Users can view their own portfolio services"
  ON portfolio_services
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own services
CREATE POLICY "Users can insert their own portfolio services"
  ON portfolio_services
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own services
CREATE POLICY "Users can update their own portfolio services"
  ON portfolio_services
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own services
CREATE POLICY "Users can delete their own portfolio services"
  ON portfolio_services
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_portfolio_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_services_updated_at
  BEFORE UPDATE ON portfolio_services
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_services_updated_at();

-- Add comment
COMMENT ON TABLE portfolio_services IS 'Services proposés dans le portfolio des utilisateurs';
