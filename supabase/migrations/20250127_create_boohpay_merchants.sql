-- Migration pour créer la table boohpay_merchants
-- Cette table stocke les merchants BoohPay associés aux utilisateurs Bööh

CREATE TABLE IF NOT EXISTS boohpay_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boohpay_merchant_id TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL, -- En production, devrait être chiffré
  api_key_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir qu'un seul merchant
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_boohpay_merchants_user_id ON boohpay_merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_boohpay_merchants_boohpay_merchant_id ON boohpay_merchants(boohpay_merchant_id);

-- RLS (Row Level Security)
ALTER TABLE boohpay_merchants ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leur propre merchant
CREATE POLICY "Users can view their own boohpay merchant"
  ON boohpay_merchants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leur propre merchant
CREATE POLICY "Users can insert their own boohpay merchant"
  ON boohpay_merchants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre merchant
CREATE POLICY "Users can update their own boohpay merchant"
  ON boohpay_merchants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leur propre merchant
CREATE POLICY "Users can delete their own boohpay merchant"
  ON boohpay_merchants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_boohpay_merchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boohpay_merchants_updated_at
  BEFORE UPDATE ON boohpay_merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_boohpay_merchants_updated_at();

-- Commentaires
COMMENT ON TABLE boohpay_merchants IS 'Stores BoohPay merchant associations for Bööh users';
COMMENT ON COLUMN boohpay_merchants.boohpay_merchant_id IS 'ID of the merchant in BoohPay system';
COMMENT ON COLUMN boohpay_merchants.api_key IS 'API key for BoohPay (should be encrypted in production)';








